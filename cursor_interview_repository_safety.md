# Interview repository safety
_Exported on 17/09/2026 at 17:02:52 GMT+5:30 from Cursor (3.17.21)_

---

**Cursor**

Static-only audit. No install/run of the target. Reading the skill reference docs, then starting Phase 1.

Notable: `investigation/malware-packages` is present. Continuing static discovery with helper scripts and manifests only.

Confirmed disclosure archive with quarantined malware samples. Continuing the full static checklist.

Workspace state changed during the audit — re-checking HEAD with read-only Git only (no checkout).

Workspace is now on branch `original` (malicious take-home). Re-auditing this state statically — no install/run.

# Interview Take-home Security Audit

## VERDICT

DO NOT INSTALL / RUN

## CONFIDENCE

HIGH

## Executive Summary

Audited branch `original` (tracks `antfarm-original/main`) as a static-only review — no install or execution of the target. This is the known Antfarm / fake take-home supply-chain trap: a committed `.npmrc` with an `npm_` auth token, decoy `animatecss-tailwind-adapter@2.0.6` in **devDependencies**, and lockfile-resolved `@aaron205whitmore/postcss-animate-utils@1.0.2` that performs HTTP C2 + `new Function` RCE when Tailwind loads the plugin. Install or `npm run dev` is enough to trigger the chain. Do not install, run, or Phase-2 sandbox this tree.

## Assignment Context

Presented as “Proof of Dev” — on-chain developer reputation (Next.js, wallet/RainbowKit, Alchemy/Etherscan, scoring worker, optional NFT/EAS). README tells candidates to `npm install` && `npm run dev`. The animation/PostCSS stack is not required for that product story and is the malware delivery path.

## Dependency Inventory

Current workspace manifests have full deps; lockfile has **1251** packages (`lockfileVersion` 3). Transitives are lockfile-verified for the malware path. Selected inventory:

| Package | Version | Direct/Transitive | Assessment | Reason |
|---|---|---|---|---|
| animatecss-tailwind-adapter | 2.0.6 | Direct (devDep, apps/web) | SUSPICIOUS / HIGH RISK | Decoy Tailwind plugin; pulls private-scoped dropper |
| @aaron205whitmore/postcss-animate-utils | 1.0.2 | Transitive (via decoy) | SUSPICIOUS / HIGH RISK | Confirmed C2 + RCE dropper |
| next / react / react-dom | 16.2.4 / 19.2.4 | Direct | COMMON | Fit assignment UI |
| wagmi / viem / rainbowkit / ethers | various | Direct | COMMON | Wallet / chain UI |
| @ethereum-attestation-service/eas-sdk | 2.9.0 | Direct | COMMON | Matches EAS feature |
| @alch/alchemy-sdk | ^1.1.1 | Direct | COMMON | Chain data |
| @x402/core, @x402/evm, @x402/extensions, @x402/svm | ^2.19.0 | Direct | ESTABLISHED BUT NICHE | Payment/protocol stack; secondary concern vs malware |
| express / mongodb / zeromq | analysis service | Direct | COMMON | Worker stack |
| Rust indexer (anyhow, tokio, mongodb, reqwest, …) | Cargo.toml | Direct | COMMON | Indexer; do not build either |
| Remaining ~1200 lockfile packages | various | Transitive | not fully reputation-scored | Sonatype unavailable |

## Unusual Dependencies

- **animatecss-tailwind-adapter@2.0.6** — SUSPICIOUS. Brand-new-style publisher naming; wired in `apps/web/tailwind.config.ts` via `require('animatecss-tailwind-adapter')(...)`. Unrelated to wallet-reputation scoring.
- **@aaron205whitmore/postcss-animate-utils@1.0.2** — SUSPICIOUS / malware. Unexpected private scope; `publishConfig.access: restricted`; only installable with the attacker `.npmrc` token. Dropper in `normalizeOptions()`: obfuscated base64 host → `POST http://153.75.81.2:1224/debugCheck` → base64 payload → `new Function('require', …)(require)`.
- **@x402/\*** — ESTABLISHED BUT NICHE for this take-home; not the blocking finding.

## Typosquat / Package Confusion

our static analysis found: decoy resembles legitimate Animate.css / Tailwind plugin ecosystems; private scope `@aaron205whitmore` looks like a personal/org package used for package-confusion / gated malware. Sonatype typosquat intel: **not verified** (MCP unavailable).

## Git Hooks / Auto-run

- `.git/hooks/`: only `*.sample` — None found (non-sample)
- Global `core.hooksPath` / `init.templateDir`: empty
- `.vscode` / `.devcontainer` / `.idea` auto-run: None found

## Lifecycle Scripts

No `preinstall` / `install` / `postinstall` / `prepare` on the malware packages in the lockfile (`hasInstallScript` absent). Payload is **import-time / Tailwind-plugin evaluation**, not an install lifecycle script — still RCE on normal `npm run dev` / CSS build.

Root/workspace scripts (`dev`, `build`, etc.) are ordinary app launchers (would load the decoy).

## Dynamic Execution / Obfuscation

**CRITICAL** (our static analysis found; also confirmed earlier from disclosure-sample `config.js` matching this lockfile version):

- Obfuscated `themeService` base64 slice/reorder → host `153.75.81.2:1224`
- `fetch` POST to `/debugCheck`
- `Buffer.from(..., 'base64')` on response `message`
- `new Function('require', dynamicCssRules)(require)` → full Node RCE

App-local `child_process` in `infra/scripts/dev.js`, `apps/web/scripts/dev.mjs`, `scripts/compile-contract.js`, tests: expected for a monorepo launcher (not the C2 chain).

## Network / Remote Execution

- C2: `http://153.75.81.2:1224/debugCheck` (raw IP HTTP)
- Registry: `https://registry.npmjs.org/` for both malware tarballs (resolved in lockfile)
- Legitimate app endpoints (Alchemy, Etherscan, WalletConnect, localhost worker) in `.env.example` / code — not the block reason

Do not fetch the C2 payload.

## Credentials / Secrets

| TYPE | FILE | LOCATION | SEVERITY |
|---|---|---|---|
| npm `_authToken` (`npm_` prefix) | `.npmrc` (working tree) | line 1 `//registry.npmjs.org/:_authToken=` | CRITICAL |
| Same class of npm token | Git history | commit `3c6624c` (`.npmrc` added) | CRITICAL |
| Placeholder API / wallet keys | `.env.example` | documented placeholders only | LOW / informational |

Values redacted. **Rotate/ignore this npm token; never reuse it.** Treat any machine that already ran `npm install` / `npm run dev` on this assignment as potentially compromised.

## Git History Findings

- `.npmrc` with registry auth token introduced in `3c6624c` (“feat(web): bootstrap Next.js app and Tailwind setup”).
- `animatecss-tailwind-adapter` present historically in `apps/web` devDependencies from that era.
- Current HEAD still contains `.npmrc` + malware deps (this is the live trap branch, not a cleaned disclosure archive).

## Sonatype Findings

not verified / unavailable — Sonatype MCP namespace in error state; auth timed out. No CVE/trust scores claimed.

## Opsera Findings

not verified / incomplete — Opsera authenticated; secrets scan requires `gitleaks`, which is missing on this host. Did not proceed with a partial Opsera run without tool approval. Static findings above stand independently.

## Static Analysis Findings

1. **Confirmed Antfarm-style chain** before any install: obscure animation devDep → private scoped dep → malicious JS → hardcoded IP HTTP → base64 → `new Function`.
2. Attacker `.npmrc` present so `npm install` can fetch the restricted package.
3. Lockfile pins exact malware versions and integrity hashes (see IOCs).
4. `tailwind.config.ts` actively `require`s the decoy plugin.
5. No IDE folderOpen auto-exec; hooks clean — risk is **npm install / dev**, not Git hooks.
6. `apps/web/.next` artifacts exist; `node_modules` currently absent — do not install to “finish” a prior build.
7. Mid-audit the workspace was on a disclosure/archive view earlier; **current branch `original` is the malicious assignment**. Report reflects current HEAD.

## IOCs

- domains: `registry.npmjs.org` (malware tarball host); C2 is IP-based
- IPs: `153.75.81.2`
- URLs: `http://153.75.81.2:1224/debugCheck`;  
  `https://registry.npmjs.org/animatecss-tailwind-adapter/-/animatecss-tailwind-adapter-2.0.6.tgz`;  
  `https://registry.npmjs.org/@aaron205whitmore/postcss-animate-utils/-/postcss-animate-utils-1.0.2.tgz`
- filenames: `.npmrc`; `apps/web/tailwind.config.ts`; lockfile entries for the two packages
- hook hashes: None (no non-sample hooks)
- package names: `animatecss-tailwind-adapter@2.0.6`; `@aaron205whitmore/postcss-animate-utils@1.0.2`
- integrity:  
  `sha512-xUYmRvcpcrc2Q5VT6muogMpOmHsXRdNo/cd87vXrZA0hziavzvHlJu9s6BRvP1/5yUa3mU8yJXFEiddLwLGDyw==` (decoy);  
  `sha512-XRkEgb9Rl0n3qx5ozUpVxqTzZLcqfePskFeAgjBlQanPj9Ncn8iEU6FKUFiOL3XKjL9/cDyfJUgvjfcr123zAg==` (dropper)
- suspicious commit identifiers: `3c6624c` (`.npmrc` + bootstrap); branch `original` / remote `antfarm-original/main`

## Limitations

- No install-time or runtime behavior observed (by design).
- Sonatype reputation/CVE graph not verified.
- Opsera gitleaks secrets scan not completed.
- Full transitive reputation review of ~1250 packages not performed; malware path alone is decisive.
- Dropper source for this branch was corroborated via lockfile identity + prior static read of the same version’s `config.js` / published campaign docs; package tarball was not re-fetched.

## Recommendation

DO NOT RUN

---

Phase 2 sandboxed install/run is **refused** for this verdict. If you already installed or ran the original assignment elsewhere, treat that machine as compromised and rotate credentials from a clean device. For a cleaned disclosure archive (malware removed, install blocked), re-run this audit on that specific commit/branch only after confirming HEAD.


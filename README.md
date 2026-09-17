# Proof of Dev — Security Disclosure Archive

> **DO NOT run `npm install` or `npm run dev`.**
>
> This repository is a **security investigation / disclosure archive**, not a runnable app.
> Install and run scripts are intentionally disabled and will exit with an error.

---

## What happened

This project was distributed as a take-home / interview-style coding assignment
(“Proof of Dev” — on-chain developer reputation). Alongside ordinary app code it
contained a **supply-chain malware trap**:

| Artifact | Role |
|----------|------|
| `.npmrc` with an `npm_` auth token | Attacker-controlled token used to pull a **private** scoped package that normal `npm` users cannot see |
| `animatecss-tailwind-adapter@2.0.6` | Public **decoy** Tailwind / Animate.css plugin (brand-new publisher, fake maturity version) |
| `@aaron205whitmore/postcss-animate-utils@1.0.2` | **Malicious** dependency. `normalizeOptions()` fires an async dropper |

### Dropper behavior (confirmed in sample)

In `@aaron205whitmore/postcss-animate-utils` → `src/config.js`, inside `normalizeOptions`:

1. Decodes a C2 host from an obfuscated base64 string → `153.75.81.2:1224`
2. `POST http://153.75.81.2:1224/debugCheck`
3. Base64-decodes `JSON.message`
4. Executes it via `new Function('require', …)(require)` → **full Node.js RCE** on the developer machine

The decoy plugin loads the malicious PostCSS helper when Tailwind evaluates the plugin
(e.g. during `npm run dev` / CSS build), not necessarily during `npm install` alone.
Lifecycle install scripts are **not** required for this payload.

This matches the campaign documented publicly as a fake-startup take-home malware drop
(see e.g. [Worklo: Fake Startup, Real Malware](https://aydinnyunus.github.io/2026/08/06/worklo-fake-job-npm-supply-chain-malware/)).
Related public advisories in the same animate/tailwind theme include
[GHSA-cjj7-4xf8-fgf8](https://github.com/advisories/GHSA-cjj7-4xf8-fgf8)
(`tailwindcss-animatecss-latest`).

---

## Automated audit (reposafety.com)

A successful static investigation was run with the Cursor skill `/interview-repo-safety`
([reposafety.com](https://reposafety.com)). The exported transcript and verdict are in
[`cursor_interview_repository_safety.md`](./cursor_interview_repository_safety.md)
(DO NOT INSTALL / RUN, high confidence).

---

## Investigation samples

Quarantined copies (for research / reading only) live under:

```
investigation/
├── WARNING.md
└── malware-packages/
    ├── animatecss-tailwind-adapter-2.0.6.tgz
    ├── animatecss-tailwind-adapter-2.0.6/package/…
    ├── aaron205whitmore-postcss-animate-utils-1.0.2.tgz
    └── aaron205whitmore-postcss-animate-utils-1.0.2/package/…
```

**Do not `require()`, `node`, or reinstall these packages.** Reading the source is enough.
The dropper is in:

`investigation/malware-packages/aaron205whitmore-postcss-animate-utils-1.0.2/package/src/config.js`

---

## How this repo is locked down

To stop anyone from installing the malware **by mistake**:

1. **Malware package names removed** from all `package.json` files.
2. **`package-lock.json` removed** so a lockfile cannot re-pull those packages.
3. **Attacker `.npmrc` removed** (never re-add an `npm_` token from this assignment).
4. **Workspace dependencies emptied**; `npm` scripts (`preinstall`, `install`, `dev`, `build`, …)
   call `scripts/block-install.js`, which **always exits with code 1** and prints a warning.
5. `block-install.js` also refuses if those package names reappear in manifests or `node_modules`.

If you see the red “INSTALL / RUN DISABLED” banner, that is intentional.

---

## If you already ran `npm install` / `npm run dev` on the original assignment

Treat the machine as **potentially compromised**:

1. Rotate credentials that lived on that Mac (GitHub, npm, SSH keys, cloud keys, wallet keys, etc.) from a clean device.
2. Remove the packages and any project `.npmrc` containing the attacker token.
3. Clear npm cache: `npm cache clean --force`
4. Run a full malware scan and review LaunchAgents / unexpected Node persistence.

---

## Original project (historical context)

The assignment claimed to be a full-stack app that scores Ethereum wallets for on-chain
developer activity (Next.js UI, analysis worker, optional NFT / EAS attestation).
That product framing was the social-engineering cover. Source under `apps/`, `services/`,
`contracts/`, etc. remains as evidence of how the trap was packaged — **it is not supported
software and must not be executed.**

---

## Disclaimer

Samples are provided for defensive security research and awareness.
Do not use this repository to attack systems. Do not install or execute the quarantined packages.

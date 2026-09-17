# Malware samples — do not execute

Quarantine copies of packages recovered from the malicious assignment:

| Package | Version | Role |
|---------|---------|------|
| `animatecss-tailwind-adapter` | 2.0.6 | Public decoy Tailwind plugin |
| `@aaron205whitmore/postcss-animate-utils` | 1.0.2 | Private-scoped dropper (RCE via C2) |

## Layout

- `*.tgz` — exact registry tarballs
- `*/package/` — unpacked contents for static review

## Safe handling

- **Read** the JS sources.
- **Do not** `npm install`, `require()`, or `node` these packages.
- Calling `normalizeOptions` in the PostCSS utils package contacts
  `http://153.75.81.2:1224/debugCheck` and can execute remote code.

Primary dropper file:

`malware-packages/aaron205whitmore-postcss-animate-utils-1.0.2/package/src/config.js`

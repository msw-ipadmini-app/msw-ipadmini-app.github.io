# MSW JP01 - 2026-10-27 Release Candidate / Non-production

## Strict release boundary
- Repository: `msw-ipadmini-app/msw-ipadmini-app.github.io`
- Candidate branch: `draft-journal-print-20261027`
- User-facing production deployment: `main` branch. DO NOT merge/publish without explicit user approval and final safety review.
- Production `main` verified unchanged at commit `0883cbf4ceb28ee3c44c5777b6a2945816ecc82b` after preparation.
- Working draft prepared from production code; does not import fake seeded patients, and does not change stored patient records.
- Never ask for real patient information in ChatGPT, GitHub, test pages or screenshots.

## Confirmed live runtime and backup
- User confirmed iPad mini installed app version matched production code at time of inspection:
  `1.0.21-MVP01-sec13-RC3M-PILOT-BASIC-FIX1-RX02-NAVFIX1`
- User exported `.mswdb` encrypted backup, found the file in iPad Files, and pressed "保存確認済み".
- **Only file presence was verified; restoration has not been tested.** Protect this backup. Never wipe Safari storage, uninstall installed PWA, clear IndexedDB, or replace PIN/key in production.

## Candidate implementation
- Candidate app version: `1.0.21-MVP01-sec13-RC3M-PILOT-BASIC-FIX1-RX02-NAVFIX1-JP01`.
- Production IndexedDB name remains exactly `mswdb_mvp01_clinical_v1`.
- Production deployment origin and base path remain `https://msw-ipadmini-app.github.io` and `/`.
- Journal admission waiting queue excludes patients assigned to mapped beds, while keeping patient records intact.
- Moving a pending admission to a valid bed clears the admission-pending status in its edit/save path.
- Morning print: 4 A4 pages even if "other/unassigned" empty; three-character municipality display from existing `市町村` field; colored Saint Therese meeting ID; disease/care/facility multi-line wrapping; room outer border weight and compact family/admission-days.
- `styles.css` carries approved print-only formatting changes.
- `index.html` carries matching asset query versions and SHA-384 SRI for `styles.css`, `pwa-updater.js`, `app.js`.
- `sw.js` uses matching query versions and updated cache key, with no change to the cache's data-minimizing allowlist.
- Candidate changes are branch-only. The production app's main branch was not modified.

## Verification and limits
- Candidate JS and SW passed syntax parsing in the project preparation environment.
- Current published SRI hashes were independently reproduced from the exact GitHub source before new SRI hashes were calculated; all three existing hashes matched.
- Candidate `index.html` SHA-384 references match current candidate CSS/JS assets; updater unchanged.
- GitHub repository file SHA and commit existence confirmed.
- Prior isolated test build: iPad mini user verified A-E initial display; admission queue A; moving A to 201-2 removes from journal; A4 four pages; Saint Therese red ID; disease, care and care-manager/facility wrap; municipality 3 chars; room border. Verification was performed on the earlier dedicated test build, not directly on the packaged production-origin candidate.
- V3 isolated test authentication: user registered PIN with two-entry confirmation, reloaded Safari and unlocked successfully. Different IndexedDB namespace; test data were not brought to production.
- **Not yet tested:** installation/update and data preservation of packaged JP01 on real production origin, backup restoration, post-release cache transition and post-release print in actual PWA.
- Do not describe backup file existence as verified ability to restore.

## Fixed user workflow (do not reset when conversation changes)
- One requested interaction at a time, result reported before next interaction; prefer tappable options in chat.
- User tests on iPad mini; Windows PC for chat and where needed GitHub only. Do not require Windows testing or PowerShell by default.
- Screen layout prototypes: standalone HTML preview in iPad mini Safari. Full app tests: separate fake-only test URL and separate IndexedDB.
- No intermediate ZIP links, no real patient info submitted to ChatGPT/GitHub.
- Always distinguish code checks from iPad real-device checks. Each progress update should report estimated percentage explicitly, without falsely claiming deployment.
- Next task: Review this candidate for production change-control, including fallback/recovery; get explicit user permission before merging. Do not tell user to clear caches/storage.

## Candidate commit references
- Pre-packaging branch commit: `e397ea4dbd6b0da8aefd5ef150ca7a3da570501d`
- Fully packaged code commit: `d54c2c8a7f66da5124682f60e402f824ad1679f5`

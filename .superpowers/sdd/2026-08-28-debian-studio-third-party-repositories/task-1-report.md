# Task 1 Report

## RED

Added `src/features/vendors/validate.test.ts` first and ran:

```text
npm test -- src/features/vendors/validate.test.ts
```

The suite failed before running because `./validate` did not exist. This was the expected missing-feature failure.

## GREEN

Implemented the readonly vendor domain types and strict catalog validator. The validator checks duplicate IDs, filenames, and keyring paths; HTTPS URLs; required metadata; known releases and architectures; safe keyring directories; non-empty package/component/compatibility sets; and suite metadata.

Verification:

- `npm test -- src/features/vendors/validate.test.ts`: 9 passed
- `npm run typecheck`: passed
- `npm run test:run`: 8 files, 78 tests passed
- `git diff --check`: passed

## Changed files

- `src/features/vendors/model.ts`
- `src/features/vendors/validate.ts`
- `src/features/vendors/validate.test.ts`

## Commit

`feat: add vendor repository model` (the commit containing this report)

## Self-review

The implementation is intentionally limited to Task 1 and keeps catalog validation deterministic and side-effect free. Error messages include the offending product ID and the violated invariant. An unrelated pre-existing modification to `scripts/__snapshots__/generate-api.test.ts.snap` was left untouched.

## Fix-Runde 1

RED: Ergänzte Regressionstests schlugen erwartungsgemäß für `https://`, Pfadtraversal in Keyring-Pfaden und unvollständige/ungültige Suite-Mappings fehl.

GREEN: HTTPS-Werte werden nun mit dem URL-Parser samt Host und `https:`-Protokoll geprüft. Keyring-Pfade weisen Traversal- und doppelte Separators zurück. Suite-Mappings müssen nichtleer sein, nur bekannte Release-Schlüssel enthalten und für jedes unterstützte Release einen nichtleeren Wert liefern.

Verifikation:

- `npm test -- src/features/vendors/validate.test.ts`: 10 passed
- `npm run test:run`: 8 Dateien, 79 Tests passed
- `npm run typecheck`: passed

Fix-Commit: `fix: harden vendor catalog validation`

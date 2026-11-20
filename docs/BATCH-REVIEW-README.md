# Batch vocabulary ZIP review — experimental component

For Ancient Language Trainer (GPL-3.0-or-later), intended for Pale Moon and
Basilisk on MX Linux. This is a **pre-integration** component on the
`feature/batch-vocabulary-import` development branch, **not** a replacement for
the main application's Save / Open collection functions.

## Installation

With the `feature/batch-vocabulary-import` branch checked out and clean, extract
the package **into the repository root**. The ZIP adds four paths:

- `tools/batch-vocabulary-import-preview.html`
- `assets/alt-pair-zip-reader.js`
- `vendor/jszip.min.js` and `vendor/JSZIP-LICENSE.markdown`
- `tests/zip-reader.test.js`

It does not overwrite `index.html`, `assets/app.js`, or your existing
Screenshot Pair Helper. It does not install npm dependencies or access a server.

Open `tools/batch-vocabulary-import-preview.html` with Pale Moon or Basilisk.
Choose `ancient-language-suggested-crops3-PM.zip` or the Basilisk equivalent;
click **Open ZIP and preview**. The 12 reviewed pairs should appear with 24
original PNG previews. Uncheck entries to omit; fill in the shared textbook,
language, and chapter and optional individual grammar notes. Choose **Export
approved-batch JSON** and verify the download. The exported data URI images
must look identical to their original crops.

The resulting file uses the **intermediate** `ALT-approved-batch-1` format.
**Do not use File > Open collection JSON in the main trainer to load this
intermediate file**: it is not the app's normal collection format. Connecting
this reader to the main app's entry model is the next task and requires review
of the current `assets/app.js` and `index.html`.

## Security and privacy

No network access or OCR. The browser reads the ZIP using a vendored copy of
JSZip 3.10.1 (MIT/GPLv3; license included). Unknown manifests, duplicate names,
non-PNG images, missing files, and excessive sizes are rejected. A ZIP may be at
most 70 MB and contain at most 300 pairs; expanded images at most 64 MB total.

Treat private textbook crops and exported batches as user-owned data. Do not
commit either to the public repository unless distribution rights permit.

## Test without npm dependencies

On a machine with Node.js:

    node tests/zip-reader.test.js

The smoke test uses a tiny synthetic PNG generated for testing; it does not
contain text from any textbook.

## Next integration step

Inspect `assets/app.js` to determine the app's exact vocabulary entry fields,
JSON schema, duplicate rules, state update functions, and save-to-file behavior.
Then connect an Import Approved Pairs UI to the app and reuse its existing
entry-validation, UI redraw, and save routine, rather than constructing a guessed
collection structure.

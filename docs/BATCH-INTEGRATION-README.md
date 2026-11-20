# Ancient Language Trainer: direct batch importing (experimental v0.3)

This update builds on the v0.2.2 readability / screenshot-cropping branch. It **does not** change the version-1 saved collection JSON schema. It adds a Vocabulary > Import vocabulary batch option to the main trainer.

## Requirements

- Pale Moon or Basilisk on MX Linux (testing requested; this version has not yet been verified in those browsers).
- No npm, network service, or build step. Node.js is optional for automated checks.
- The existing `feature/batch-vocabulary-import` development branch with `assets/alt-readability.js` already installed from v0.2.

## Install on the development branch

**Back up private collection JSON files somewhere outside the public repository before testing.**

```sh
cd ~/Projects/ancient-language-trainer
git branch --show-current
git status --short
# Confirm: feature/batch-vocabulary-import

mkdir -p ~/alt-backups/v03-batch
cp index.html assets/app.js assets/style.css ~/alt-backups/v03-batch/

# From the project root, after downloading the ZIP to ~/Downloads:
unzip -o ~/Downloads/ancient-language-trainer-v03-direct-batch-import.zip

# Optional automated checks. Node.js alone is enough; npm is not required.
node tests/zip-reader.test.js
node tests/batch-import.test.js
```

The ZIP includes code, a locally bundled copy of JSZip and its license, and tests. It does **not** include any textbook images or personal vocabulary data. The vendor JSZip files are copied from the already-tested batch-review prototype.

## Use

1. Open `index.html` in Pale Moon or Basilisk.
2. Use **Vocabulary > Import vocabulary batch** or the **Import batch** button.
3. Choose either a Screenshot Pair Helper `.zip` (directly) or an `ALT-approved-batch-1` JSON produced by Batch Vocabulary Review.
4. Click **Open file and preview**. Check every word image and definition image. Set Language, Textbook, Chapter / group; optionally add per-word grammar and notes. Select/deselect any pairs.
5. Click **Import selected vocabulary into this collection**, and confirm.
6. Verify the number of new entries under Browse vocabulary; test a game with your chapter selected.
7. **File > Save collection JSON...** and verify that a JSON download actually appeared. Reopen that saved collection to confirm images and metadata.

The ZIP is read locally; no OCR or network calls are made. Images are embedded as base64 PNGs in the same version-1 collection format the trainer already uses. Existing entries and study scores are not overwritten or deleted. Reimporting an exact word+definition image pair into the **same language, chapter and textbook** is treated as a duplicate and skipped. The batch remains unsaved in memory until you download the collection JSON.

Please do not attempt to open the experimental *approved-batch* JSON using File > Open collection JSON. That command intentionally replaces the entire collection and accepts only the full version-1 collection format. Use the new Vocabulary > Import vocabulary batch action instead.

## Quality checks for both browsers

- ZIP opens and shows 12 correct pairs for Chapter 17.
- Approve 12, import; verify 12 new entries and two-sided images intact.
- Import the same ZIP again into the same chapter; verify 0 new and 12 duplicates skipped.
- Change metadata, Select None and Select All; confirm metadata remains edited.
- Deselect one pair and import a fresh batch; only selected pairs should appear.
- Export collection JSON, reload it, and confirm that all previous vocabulary, image crops, notes and scores survive.
- Run Memory Match, Flashcards, Multiple Choice and Speed Recognition with imported entries.

## Rollback

First export any new vocabulary to a private collection JSON. Then restore the backed-up `index.html`, `assets/app.js`, and `assets/style.css`; the new support files may remain unused without affecting the old trainer.

```sh
cd ~/Projects/ancient-language-trainer
cp ~/alt-backups/v03-batch/index.html .
cp ~/alt-backups/v03-batch/app.js assets/
cp ~/alt-backups/v03-batch/style.css assets/
```

Do not merge these experimental changes into `main` until tested in both browsers. Do not commit private screenshots, textbook pages, or study collection files into the public repository.

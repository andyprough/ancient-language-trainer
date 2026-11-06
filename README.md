# Ancient Language Trainer

A small, offline-first vocabulary trainer for Biblical Hebrew, Greek, Latin, Aramaic, and other languages. The target browsers are **Pale Moon** and **Basilisk** on Linux (UXP/Goanna). This is an **early prototype**: it uses conservative JavaScript but has **not yet been tested in those two browsers**.

**Status: v0.1 prototype.** It provides four games, manual screenshot cropping, independent screenshot or typed-text entry on both sides, optional morphology notes, and file-based JSON import/export. Automatically detecting and pairing rows from an entire chapter screenshot is **not implemented yet**.

## Launch

Open `index.html` in Pale Moon or Basilisk. There is no server, network access, package manager, build step, or installation. Files are all relative to `index.html`.

## Add vocabulary

1. Choose **Vocabulary > Add vocabulary entry**.
2. Set the word side to Typed text or Screenshot.
3. Set the definition side **independently** to Typed text or Screenshot.
4. Enter optional textbook, chapter, language, grammar/morphology and notes.
5. Save the entry. Your collection is in memory until you export it.

For full chapter screenshots, choose **Vocabulary > Crop from chapter screenshot**. Select a screenshot, drag around an individual Hebrew term and click **Use selection as Hebrew / word**; drag around the corresponding English definition and click **Use selection as English / definition**. Then open the entry form, add metadata and save. You may repeat this for the same page without loading it again. This is *manual cropping, not Hebrew OCR*.

Use **File > Save collection JSON** regularly. For safety, verify that the browser actually downloaded the file before closing the tab. Use **File > Open collection JSON** to reload it. This replaces the collection currently in memory (with an unsaved-changes warning). Images are embedded inside the saved JSON, so the file may become large.

The app does not persist to browser localStorage, does not contact any server, and does not upload files. **Your backed-up JSON collection is the source of truth.** Do not store private chapter screenshots in this public Git repository.

## Games and reward points

- **Memory Match:** find word/answer pairs; +8 per pair, +10 completion bonus.
- **Flashcards:** reveal an answer and self-grade; +4 for each unique known card within a session.
- **Multiple Choice:** choose the matching answer among vocabulary entries; +10 correct.
- **Speed Recognition:** multiple-choice answers for 60 seconds; +10 correct.

The sidebar filters games by language and chapter/group. Games use the same entries with no re-entry. The daily points target and personal reward text are configurable under **Statistics**; progress is exported with the vocabulary. This is a lightweight reward system, not an algorithmically scheduled spaced-repetition implementation.

## Privacy, copyright, and licensing

The **application source code** is free software under **GNU GPL version 3 or later** (`GPL-3.0-or-later`). See [`LICENSE`](LICENSE).

**Your textbook content is not part of the project.** Do not commit or redistribute scanned pages, vocabulary images, answer keys, or copied textbook lists unless their licenses or permissions allow it. Readers should import their own legitimately obtained images locally. The GPL license on the code does **not** license copyrighted images imported by users.

The repository deliberately contains no textbook screenshots or proprietary study decks. See `.gitignore`.

## Suggested GitHub setup (from your MX Linux VM)

After extracting the ZIP, change to its `ancient-language-trainer` folder and run:

```sh
gh auth status
git init -b main
git add .
git commit -m "Initial Ancient Language Trainer offline prototype"
gh repo create andyprough/ancient-language-trainer --public --source=. --remote=origin --push
```

Review the repo name and visibility before running the `gh repo create` line. It creates a **public** GitHub repository. Do not run it if that repository already exists; if it does, clone it and copy files into that repository instead. You can also create it as a **private** repository initially, then switch it to public later.

## Project design principles

1. **Textbook fidelity**: preserve screenshot pixels and user-entered definitions as provided; never invent or silently replace textbook meanings.
2. **Source-agnostic vocabulary**: the word and answer sides each accept either an image or text.
3. **Metadata without forcing it into the game question**: language, textbook, chapter, grammar, notes.
4. **Offline-first and portable**: JSON saves include everything; no account or database required.
5. **Legacy-browser support**: favor plain HTML/CSS/ES5 JavaScript over framework build stacks.
6. **Reversible operations**: manual review before accepting imported pairs; explicit save/load.

## Known limitations / next milestones

- Verify and fix any differences in Pale Moon and Basilisk on the intended MX Linux machines. Chromium-only testing is not enough.
- Test `file://` JSON downloads/reimports in both target browsers.
- Add optional automatic *suggested* term/definition region detection for structured textbook pages, always with visual review before saving. No OCR required.
- Add image rotation, resizing, and rectangle adjustment for tricky page layouts.
- Add richer answer feedback and stronger scoring safeguards, a study-history dashboard, and optional scheduling.
- Test very large decks and storage sizes; consider image compression and portable `.zip` collections in a later format revision.
- Improve keyboard navigation and screen-reader labels.

## Contributing

Issues and pull requests are welcome once the repository is published. Please include your browser name/version and Linux distribution when reporting a compatibility problem. Please do not attach copyrighted textbook scans to public bug reports.

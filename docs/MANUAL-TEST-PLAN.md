# Manual test plan for Pale Moon and Basilisk

Run these tests on MX Linux in both target browsers before publishing a stable release.

- [ ] Open `index.html` from disk (`file://`) without network access; menu items work.
- [ ] Add a typed Hebrew word with niqqud and a typed English definition; characters display correctly and right-to-left.
- [ ] Add a typed Greek word and its English answer in another language/group.
- [ ] Add a word screenshot and typed definition.
- [ ] Add a word screenshot and a definition screenshot.
- [ ] Add text on both sides; add image on both sides.
- [ ] Crop two selections from a whole chapter screenshot (one Hebrew / word, one English / definition). Save one entry, repeat without re-loading the page.
- [ ] Edit a saved entry and its optional morphology. Delete an entry and confirm the remaining list is correct.
- [ ] Apply chapter and language filters; confirm games use only selected entries.
- [ ] Complete Memory Match and verify points.
- [ ] Complete Flashcards and self-grade; verify the answer/grammar only appear after Reveal.
- [ ] Play Multiple Choice and Speed Recognition; verify scoring.
- [ ] Change daily snack reward threshold and text.
- [ ] File > Save collection JSON; verify an actual local file exists.
- [ ] Close/reopen the page. File > Open collection JSON; verify images, text, metadata, and points restored.
- [ ] Open a malformed JSON file; verify an error and no overwrite.
- [ ] Reopen screenshot via the Cropper and verify exact diacritic/vowel-point pixels are preserved.
- [ ] Verify zero network activity and no application storage outside an explicit user-saved JSON file.

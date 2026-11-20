/* Ancient Language Trainer - approved-pair ZIP reader. GPL-3.0-or-later.
   Dependency: vendor/jszip.min.js (JSZip 3.10.1, MIT/GPLv3).
   ES5 syntax for Pale Moon / Basilisk. ZIPs are read locally, never uploaded.
   Exposes: ALTReadPairZip(file, onSuccess, onError).
*/
(function (root) {
  'use strict';
  var MAX_ENTRIES = 300;
  var MAX_IMAGE_BYTES = 5 * 1024 * 1024;
  var MAX_TOTAL_BYTES = 64 * 1024 * 1024;
  var MAX_ZIP_BYTES = 70 * 1024 * 1024;

  function fail(message) { throw new Error(message); }
  function safeName(name) {
    return typeof name === 'string' &&
      /^(?:word|definition)-[0-9]{3,6}\.png$/.test(name);
  }
  function isPNG(bytes) {
    var sig = [137,80,78,71,13,10,26,10], i;
    if (bytes.length < 33) return false;
    for (i = 0; i < sig.length; i++) if (bytes[i] !== sig[i]) return false;
    return true;
  }
  function properBase64(bytes) {
    var i, j, blocks = [], part, step = 8190;
    for (i = 0; i < bytes.length; i += step) {
      part = '';
      for (j = i; j < Math.min(i + step, bytes.length); j++) part += String.fromCharCode(bytes[j]);
      blocks.push(btoa(part));
    }
    return blocks.join('');
  }
  function decodeZip(arrayBuffer, callback, onError) {
    var total = 0, names = {}, output = [], promises = [];
    if (!root.JSZip) { onError('ZIP library not loaded (vendor/jszip.min.js).'); return; }
    root.JSZip.loadAsync(arrayBuffer).then(function (zip) {
      var manifestEntry = zip.file('manifest.json');
      if (!manifestEntry) fail('This ZIP does not contain manifest.json. Use an export from Screenshot Pair Helper.');
      return manifestEntry.async('string').then(function (json) {
        var manifest, entries, i, record, n, entry, map;
        try { manifest = JSON.parse(json); }
        catch (e) { fail('manifest.json is not valid JSON.'); }
        if (!manifest || manifest.format !== 'ALT-screenshot-pairs-1' || !Array.isArray(manifest.entries)) {
          fail('Unsupported manifest format. Expected ALT-screenshot-pairs-1.');
        }
        entries = manifest.entries;
        if (entries.length < 1 || entries.length > MAX_ENTRIES) fail('Expected between 1 and ' + MAX_ENTRIES + ' pairs.');
        for (i = 0; i < entries.length; i++) {
          record = entries[i];
          if (!record || !safeName(record.wordImage) || !safeName(record.definitionImage)) fail('Invalid filename in pair ' + (i + 1));
          if (names[record.wordImage] || names[record.definitionImage]) fail('Duplicate filename in manifest.');
          names[record.wordImage] = true; names[record.definitionImage] = true;
          map = { word: record.wordImage, definition: record.definitionImage, column: record.column || '', index: i };
          output.push(map);
        }
        for (i = 0; i < output.length; i++) {
          (function (record) {
            var wordEntry = zip.file(record.word), defEntry = zip.file(record.definition);
            if (!wordEntry || !defEntry) fail('ZIP is missing an image named in the manifest: pair ' + (record.index + 1));
            promises.push(wordEntry.async('uint8array').then(function (bytes) {
              if (!isPNG(bytes) || bytes.length > MAX_IMAGE_BYTES) fail('Invalid or oversized word PNG: ' + record.word);
              total += bytes.length;
              if (total > MAX_TOTAL_BYTES) fail('Expanded images exceed the 64 MB safety limit.');
              record.wordURI = 'data:image/png;base64,' + properBase64(bytes);
            }));
            promises.push(defEntry.async('uint8array').then(function (bytes) {
              if (!isPNG(bytes) || bytes.length > MAX_IMAGE_BYTES) fail('Invalid or oversized definition PNG: ' + record.definition);
              total += bytes.length;
              if (total > MAX_TOTAL_BYTES) fail('Expanded images exceed the 64 MB safety limit.');
              record.definitionURI = 'data:image/png;base64,' + properBase64(bytes);
            }));
          })(output[i]);
        }
        return Promise.all(promises).then(function () {
          callback({format: manifest.format, sourceFile: manifest.sourceFile || '', entries: output});
        });
      });
    }).catch(function (err) { onError(err && err.message ? err.message : String(err)); });
  }
  root.ALTReadPairZip = function (file, onSuccess, onError) {
    if (!file) { onError('Choose an exported ZIP first.'); return; }
    if (file.size > MAX_ZIP_BYTES) { onError('ZIP is larger than the 70 MB safety limit.'); return; }
    var reader = new FileReader();
    reader.onerror = function () { onError('Could not read the selected ZIP.'); };
    reader.onload = function (e) { decodeZip(e.target.result, onSuccess, onError); };
    reader.readAsArrayBuffer(file);
  };
})(this);

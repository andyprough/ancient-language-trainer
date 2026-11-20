/* Optional Node.js smoke test; no npm installation required.
   Run from repository root: node tests/zip-reader.test.js
   Uses original 1x1 sample PNG generated for this test, not textbook content.
*/
'use strict';
var fs = require('fs');
var vm = require('vm');
var JSZip = require('../vendor/jszip.min.js');
var png64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/pu8AAAAASUVORK5CYII=';
function FileReader() {}
FileReader.prototype.readAsArrayBuffer = function (file) {
  this.onload({target: {result: file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength)}});
};
var context = { JSZip: JSZip, FileReader: FileReader, Promise: Promise, Uint8Array: Uint8Array,
  btoa: function (s) { return Buffer.from(s, 'binary').toString('base64'); } };
vm.createContext(context);
vm.runInContext(fs.readFileSync('assets/alt-pair-zip-reader.js','utf8'), context);
function read(buffer) { return new Promise(function (resolve,reject) {context.ALTReadPairZip(buffer,resolve,reject);}); }
(async function () {
  var zip = new JSZip();
  zip.file('manifest.json', JSON.stringify({format:'ALT-screenshot-pairs-1', sourceFile:'test.png',entries:[
    {wordImage:'word-001.png',definitionImage:'definition-001.png',column:'left'},
    {wordImage:'word-002.png',definitionImage:'definition-002.png',column:'right'}
  ]}));
  var png=Buffer.from(png64,'base64');
  ['word-001.png','definition-001.png','word-002.png','definition-002.png'].forEach(function (name){zip.file(name,png)});
  var bytes=await zip.generateAsync({type:'nodebuffer',compression:'DEFLATE'});
  var out=await read(bytes);
  if(out.entries.length!==2) throw Error('Wrong entry count');
  out.entries.forEach(function (entry) {
    if(!entry.wordURI || !entry.definitionURI)throw Error('Missing PNG');
    if(!Buffer.from(entry.wordURI.split(',')[1],'base64').equals(png))throw Error('PNG differs');
  });
  var invalid = new JSZip();invalid.file('manifest.json','{"format":"WRONG","entries":[]}');
  try { await read(await invalid.generateAsync({type:'nodebuffer'}));throw Error('Invalid manifest accepted'); }
  catch(e){if(String(e).indexOf('Invalid manifest accepted')>=0)throw e;}
  console.log('PASS: approved pairs ZIP decoded; PNGs unmodified; malformed manifest rejected');
})().catch(function(e){console.error(e);process.exit(1)});

/* node tests/batch-import.test.js -- no npm required. */
'use strict';
var assert=require('assert'), fs=require('fs'), vm=require('vm'), JSZip=require('../vendor/jszip.min.js');
var png64='iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/pu8AAAAASUVORK5CYII=';
function FileReader() {}
FileReader.prototype.readAsArrayBuffer=function(file){this.onload({target:{result:file.buffer.slice(file.byteOffset,file.byteOffset+file.byteLength)}});};
var c={JSZip:JSZip,FileReader:FileReader,Promise:Promise,Uint8Array:Uint8Array,btoa:function(s){return Buffer.from(s,'binary').toString('base64');}};
vm.createContext(c);
vm.runInContext(fs.readFileSync('assets/alt-pair-zip-reader.js','utf8'),c);
vm.runInContext(fs.readFileSync('assets/alt-batch-core.js','utf8'),c);
function read(buffer){return new Promise(function(resolve,reject){c.ALTReadPairZip(buffer,resolve,reject);});}
(async function(){
  var zip=new JSZip(), png=Buffer.from(png64,'base64');
  zip.file('manifest.json',JSON.stringify({format:'ALT-screenshot-pairs-1',sourceFile:'chapter-17.jpg',entries:[
    {wordImage:'word-001.png',definitionImage:'definition-001.png',column:'left'},
    {wordImage:'word-002.png',definitionImage:'definition-002.png',column:'right'}
  ]}));
  ['word-001.png','definition-001.png','word-002.png','definition-002.png'].forEach(function(n){zip.file(n,png);});
  var decoded=await read(await zip.generateAsync({type:'nodebuffer'}));
  var batch=c.ALTBatchCore.fromZip(decoded);
  assert.strictEqual(batch.entries.length,2);
  var meta={language:'Biblical Hebrew',chapter:'Chapter 17',textbook:'The First Hebrew Primer'};
  var initial=c.ALTBatchCore.build(batch.entries,[],meta);
  assert.strictEqual(initial.entries.length,1,'Identical repeated pairs must be skipped inside a batch');
  assert.strictEqual(initial.duplicates,1);
  assert.strictEqual(initial.entries[0].word.type,'image');
  assert.strictEqual(initial.entries[0].answer.type,'image');
  assert.strictEqual(initial.entries[0].chapter,'Chapter 17');
  assert.strictEqual(c.ALTBatchCore.build(batch.entries,initial.entries,meta).duplicates,2,'Reimport must skip duplicates');
  assert.strictEqual(c.ALTBatchCore.build(batch.entries,initial.entries,{language:'Biblical Hebrew',chapter:'Chapter 18',textbook:'The First Hebrew Primer'}).entries.length,1,'Same image in other chapter is permitted');
  batch.entries[1].selected=false;
  var skipped=c.ALTBatchCore.build(batch.entries,[],meta);
  assert.strictEqual(skipped.unchecked,1);
  var approved={format:'ALT-approved-batch-1',sourceFile:'test.jpg',language:'Biblical Hebrew',chapter:'Chapter 17',textbook:'The First Hebrew Primer',entries:[
    {wordType:'image',wordImage:batch.entries[0].wordURI,definitionType:'image',definitionImage:batch.entries[0].definitionURI,grammar:'Qal perfect',notes:'check the vowel points'}
  ]};
  var out=c.ALTBatchCore.fromApproved(approved);
  assert.strictEqual(out.entries[0].grammar,'Qal perfect');
  assert.strictEqual(out.entries[0].notes,'check the vowel points');
  assert.strictEqual(c.ALTBatchCore.build(out.entries,[],meta).entries[0].notes,'check the vowel points');
  assert.throws(function(){c.ALTBatchCore.fromApproved({format:'ALT-approved-batch-1',entries:[{wordType:'image',wordImage:'data:image/png;base64,invalid',definitionType:'image',definitionImage:out.entries[0].definitionURI}]});},/Invalid/);
  assert.throws(function(){c.ALTBatchCore.build(out.entries,[],{language:'',chapter:'Chapter 17'});},/language/);
  // Data remains compatible with the existing version-1 collection structure.
  var model={format:'ancient-language-trainer',version:1,name:'My Ancient Languages',entries:initial.entries.map(function(e,i){e.id='entry-test-'+i;return e;}),scores:{'2026-11-19':42},settings:{goal:100,reward:'Enjoy a tasty snack!'}};
  assert.strictEqual(JSON.parse(JSON.stringify(model)).version,1);
  assert.strictEqual(model.scores['2026-11-19'],42);
  console.log('PASS: ZIP to model entries, approved JSON, duplicate protection, metadata, saved model v1');
})().catch(function(e){console.error(e);process.exit(1)});

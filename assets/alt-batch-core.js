/* Ancient Language Trainer - offline batch import normalization. GPL-3.0-or-later.
 * ES5-style JavaScript. No network or browser storage. Input images are left intact.
 */
(function (root) {
  'use strict';
  var MAX_PAIRS = 300;
  var MAX_IMAGE_BASE64_LENGTH = 7 * 1024 * 1024;
  var MAX_TOTAL_BASE64_LENGTH = 90 * 1024 * 1024;
  function fail(message) { throw new Error(message); }
  function clip(s, limit) { return String(s === null || s === undefined ? '' : s).replace(/^\s+|\s+$/g, '').slice(0, limit); }
  function isPNGData(s) {
    return typeof s === 'string' &&
      /^data:image\/png;base64,iVBORw0KGgo/.test(s) &&
      s.length <= MAX_IMAGE_BASE64_LENGTH &&
      /^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/.test(s);
  }
  function validatePairs(pairs) {
    if (!Array.isArray(pairs) || !pairs.length || pairs.length > MAX_PAIRS) fail('Expected 1 to 300 vocabulary pairs.');
    var total = 0, i, p;
    for (i = 0; i < pairs.length; i++) {
      p = pairs[i];
      if (!p || !isPNGData(p.wordURI) || !isPNGData(p.definitionURI)) fail('Invalid or oversized PNG in pair ' + (i + 1) + '.');
      total += p.wordURI.length + p.definitionURI.length;
      if (total > MAX_TOTAL_BASE64_LENGTH) fail('Batch images exceed the 90 MB safety limit.');
    }
  }
  function fromZip(data) {
    if (!data || data.format !== 'ALT-screenshot-pairs-1') fail('Expected an exported Screenshot Pair Helper ZIP.');
    var items=[], i, e;
    for (i=0;i<(data.entries || []).length;i++) {
      e=data.entries[i];
      items.push({wordURI:e.wordURI,definitionURI:e.definitionURI,column:clip(e.column,30),grammar:'',notes:'',selected:true});
    }
    validatePairs(items);
    return {sourceFile:clip(data.sourceFile,200), language:'Biblical Hebrew',
      textbook:'The First Hebrew Primer',chapter:'Chapter 17',entries:items};
  }
  function fromApproved(data) {
    if (!data || data.format !== 'ALT-approved-batch-1' || !Array.isArray(data.entries)) fail('Expected an ALT-approved-batch-1 JSON export.');
    var items=[], i,e;
    for(i=0;i<data.entries.length;i++) {
      e=data.entries[i];
      if(!e || e.wordType!=='image' || e.definitionType!=='image') fail('Unsupported entry at position '+(i+1)+'.');
      items.push({wordURI:e.wordImage,definitionURI:e.definitionImage,column:clip(e.column,30),
        grammar:clip(e.grammar,400), notes:clip(e.notes,2000), selected:true});
    }
    validatePairs(items);
    return {sourceFile:clip(data.sourceFile,200), language:clip(data.language,160),
      textbook:clip(data.textbook,200), chapter:clip(data.chapter,160), entries:items};
  }
  function sameEntry(a,b) {
    return a.language===b.language && a.chapter===b.chapter && a.textbook===b.textbook &&
      a.word && a.answer && b.word && b.answer &&
      a.word.type==='image' && b.word.type==='image' &&
      a.answer.type==='image' && b.answer.type==='image' &&
      a.word.value===b.word.value && a.answer.value===b.answer.value;
  }
  function build(pairs, existing, meta) {
    validatePairs(pairs);
    var language=clip(meta.language,160),chapter=clip(meta.chapter,160),textbook=clip(meta.textbook,200),
      added=[],duplicate=0,ignored=0,i,j,p,c,found;
    if(!language || !chapter) fail('Enter a language and a chapter/group before importing.');
    for(i=0;i<pairs.length;i++) {
      p=pairs[i];
      if(!p.selected){ignored++;continue;}
      c={word:{type:'image',value:p.wordURI},answer:{type:'image',value:p.definitionURI},
        language:language,chapter:chapter,textbook:textbook,grammar:clip(p.grammar,400),notes:clip(p.notes,2000)};
      found=false;
      for(j=0;j<existing.length;j++)if(sameEntry(existing[j],c)){found=true;break;}
      if(!found)for(j=0;j<added.length;j++)if(sameEntry(added[j],c)){found=true;break;}
      if(found){duplicate++;continue;}
      added.push(c);
    }
    return {entries:added,duplicates:duplicate,unchecked:ignored};
  }
  root.ALTBatchCore={fromZip:fromZip,fromApproved:fromApproved,build:build};
})(this);

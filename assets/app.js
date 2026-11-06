/* Ancient Language Trainer - GPL-3.0-or-later
 * Conservative browser JavaScript: no frameworks, modules, fetch, or network calls.
 */
(function () {
  'use strict';
  var model = blankModel();
  var dirty = false;
  var editingId = null;
  var images = {source: '', answer: ''};
  var pageImage = null;
  var selection = null;
  var selecting = false;
  var dragStart = null;
  var matchState = null;
  var flashState = null;
  var quizState = null;
  var speedState = null;
  var speedTimer = null;

  function el(id) { return document.getElementById(id); }
  function blankModel() { return {format: 'ancient-language-trainer', version: 1, name: 'My Ancient Languages', entries: [], scores: {}, settings: {goal: 100, reward: 'Enjoy a tasty snack!'}}; }
  function trimmed(value) { return String(value || '').replace(/^\s+|\s+$/g, ''); }
  function localDay() { var d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function shuffle(a) { var b = a.slice(0); var i,j,t; for (i = b.length - 1; i > 0; i--) { j = Math.floor(Math.random() * (i + 1)); t = b[i]; b[i] = b[j]; b[j] = t; } return b; }
  function create(tag, css, text) { var n = document.createElement(tag); if (css) n.className = css; if (text !== undefined) n.appendChild(document.createTextNode(String(text))); return n; }
  function clear(n) { while (n.firstChild) n.removeChild(n.firstChild); }
  function msg(text) { el('status').textContent = text; }
  function markDirty() { dirty = true; el('fileState').textContent = 'Unsaved changes'; }
  function markSaved() { dirty = false; el('fileState').textContent = 'Collection saved/exported'; }
  function promptDiscard() { return !dirty || window.confirm('You have unsaved changes. Discard them and open another collection?'); }
  function setVisible(id, visible) { if (visible) el(id).classList.remove('hidden'); else el(id).classList.add('hidden'); }
  function showView(name) {
    var names = ['entries','editor','importer','matching','flashcards','quiz','speed','statistics','help'];
    var i;
    for (i = 0; i < names.length; i++) setVisible('view-' + names[i], names[i] === name);
    hideMenus();
    if (name !== 'speed' && speedTimer) stopSpeed(false);
    if (name === 'statistics') renderStats();
    if (name === 'entries') renderTable();
  }
  function hideMenus() {
    var list = document.querySelectorAll('.menu-popup'), i;
    for (i = 0; i < list.length; i++) list[i].classList.add('hidden');
  }
  function setSideMode(side) {
    var image = el(side + 'Mode').value === 'image';
    setVisible(side + 'TextBox', !image);
    setVisible(side + 'ImageBox', image);
  }
  function renderFace(container, side, large) {
    clear(container);
    if (side.type === 'image') {
      var img = create('img', large ? 'study-image' : 'image-word');
      img.src = side.value; img.alt = 'Imported vocabulary image';
      container.appendChild(img);
    } else {
      var span = create('span', large ? 'word-rtl' : '', side.value);
      span.dir = 'auto';
      container.appendChild(span);
    }
  }
  function validImage(value) { return typeof value === 'string' && /^data:image\/(png|jpeg|gif|webp);base64,[A-Za-z0-9+/=]+$/.test(value); }
  function safeSide(side) {
    if (!side || typeof side !== 'object') return null;
    if (side.type === 'text' && typeof side.value === 'string' && trimmed(side.value)) return {type: 'text', value: side.value.slice(0, 10000)};
    if (side.type === 'image' && validImage(side.value)) return {type: 'image', value: side.value};
    return null;
  }
  function validateModel(input) {
    if (!input || input.format !== 'ancient-language-trainer' || input.version !== 1 || !Array.isArray(input.entries) || input.entries.length > 20000) throw new Error('Not a compatible version 1 study collection.');
    var output = blankModel();
    output.name = trimmed(input.name).slice(0, 120) || output.name;
    output.entries = [];
    var i,e,w,a;
    for (i = 0; i < input.entries.length; i++) {
      e = input.entries[i]; w = safeSide(e.word); a = safeSide(e.answer);
      if (!w || !a) throw new Error('The collection contains an invalid vocabulary entry at position ' + (i + 1) + '.');
      output.entries.push({id: String(e.id || ('entry-' + i)).slice(0,100), word: w, answer: a,
        language: String(e.language || '').slice(0,160), chapter: String(e.chapter || '').slice(0,160),
        textbook: String(e.textbook || '').slice(0,200), grammar: String(e.grammar || '').slice(0,400),
        notes: String(e.notes || '').slice(0,2000)});
    }
    if (input.scores && typeof input.scores === 'object') {
      for (var key in input.scores) {
        if (Object.prototype.hasOwnProperty.call(input.scores,key) && /^\d{4}-\d{2}-\d{2}$/.test(key)) {
          var s = Number(input.scores[key]);
          if (isFinite(s) && s >= 0 && s < 100000000) output.scores[key] = Math.floor(s);
        }
      }
    }
    if (input.settings && typeof input.settings === 'object') {
      var goal = Number(input.settings.goal);
      if (isFinite(goal) && goal >= 10 && goal <= 10000) output.settings.goal = Math.floor(goal);
      if (typeof input.settings.reward === 'string') output.settings.reward = input.settings.reward.slice(0,150);
    }
    return output;
  }
  function updateFilters() {
    var oldLang = el('languageFilter').value, oldChapter = el('chapterFilter').value;
    var langs = {}, chapters = {}, i, e;
    for (i = 0; i < model.entries.length; i++) { e = model.entries[i]; if (e.language) langs[e.language] = true; if (e.chapter) chapters[e.chapter] = true; }
    function fill(sel, options, first, previous) {
      clear(sel); var op = create('option', '', first); op.value = ''; sel.appendChild(op);
      var keys = Object.keys(options).sort();
      for (var j = 0; j < keys.length; j++) { op = create('option','',keys[j]); op.value = keys[j]; sel.appendChild(op); }
      sel.value = Object.prototype.hasOwnProperty.call(options,previous) ? previous : '';
    }
    fill(el('languageFilter'),langs,'All languages',oldLang);
    fill(el('chapterFilter'),chapters,'All chapters / groups',oldChapter);
  }
  function filteredEntries() {
    var lang = el('languageFilter').value, chapter = el('chapterFilter').value;
    return model.entries.filter(function (e) { return (!lang || e.language === lang) && (!chapter || e.chapter === chapter); });
  }
  function renderTable() {
    updateFilters(); var tbody = el('entryRows'); clear(tbody);
    var rows = filteredEntries();
    for (var i=0; i<rows.length; i++) {
      (function (entry) {
        var tr = create('tr'); var w = create('td'),a = create('td'),meta = create('td'),actions = create('td');
        renderFace(w,entry.word,false); renderFace(a,entry.answer,false);
        meta.appendChild(create('div','',entry.language || 'Unspecified language'));
        meta.appendChild(create('div','muted',entry.chapter || 'Unsorted'));
        if (entry.grammar) meta.appendChild(create('div','muted',entry.grammar));
        var edit = create('button','', 'Edit'); var del = create('button','', 'Delete');
        edit.type='button'; del.type='button';
        edit.addEventListener('click',function(){ openEdit(entry.id); });
        del.addEventListener('click',function(){ if(window.confirm('Delete this vocabulary entry?')) { model.entries = model.entries.filter(function(x){return x.id!==entry.id;}); markDirty(); refresh(); msg('Entry deleted. Export JSON to save the change.'); } });
        actions.appendChild(edit); actions.appendChild(document.createTextNode(' ')); actions.appendChild(del);
        tr.appendChild(w);tr.appendChild(a);tr.appendChild(meta);tr.appendChild(actions);tbody.appendChild(tr);
      })(rows[i]);
    }
    el('emptyNotice').textContent = rows.length ? '' : 'No entries in this selection. Add vocabulary or change the filters.';
    el('entryCount').textContent = rows.length + ' entr' + (rows.length === 1 ? 'y' : 'ies');
  }
  function refresh() { renderTable(); renderReward(); renderStats(); el('collectionTitle').value = model.name; }
  function readImage(file, callback) {
    if (!file) return;
    if (!/^image\/(png|jpeg|gif|webp)$/.test(file.type) || file.size > 12000000) { msg('Choose a PNG, JPG, GIF, or WebP image smaller than 12 MB.'); return; }
    var reader = new FileReader();
    reader.onload = function () { if (validImage(reader.result)) { callback(reader.result); } else msg('Could not read a supported image.'); };
    reader.onerror = function () { msg('Could not read that image file.'); };
    reader.readAsDataURL(file);
  }
  function showImagePreview(side) {
    var box = el(side + 'Preview'); clear(box);
    if (!images[side]) box.appendChild(create('span','muted','No image selected.'));
    else { var img = create('img'); img.alt = side + ' image preview'; img.src = images[side]; box.appendChild(img); }
  }
  function resetEditor(preserveMeta) {
    var lang = preserveMeta ? el('languageText').value : 'Biblical Hebrew';
    var chapter = preserveMeta ? el('chapterText').value : 'Chapter 17';
    var book = preserveMeta ? el('textbookText').value : 'The First Hebrew Primer';
    editingId = null; el('editorHeading').textContent = 'Add vocabulary entry'; el('submitEntry').textContent = 'Save entry';
    el('entryForm').reset();
    images = {source:'',answer:''}; el('sourceFile').value=''; el('answerFile').value='';
    el('languageText').value = lang; el('chapterText').value=chapter; el('textbookText').value=book;
    showImagePreview('source');showImagePreview('answer');setSideMode('source');setSideMode('answer');
  }
  function openEdit(id) {
    var e=null,i;
    for(i=0;i<model.entries.length;i++) if(model.entries[i].id===id){e=model.entries[i];break;}
    if(!e) return;
    resetEditor(false);editingId=id;el('editorHeading').textContent='Edit vocabulary entry';el('submitEntry').textContent='Update entry';
    el('sourceMode').value=e.word.type;el('answerMode').value=e.answer.type;
    if(e.word.type==='text') el('sourceText').value=e.word.value; else images.source=e.word.value;
    if(e.answer.type==='text') el('answerText').value=e.answer.value; else images.answer=e.answer.value;
    el('languageText').value=e.language;el('chapterText').value=e.chapter;el('textbookText').value=e.textbook;
    el('grammarText').value=e.grammar;el('notesText').value=e.notes;
    showImagePreview('source');showImagePreview('answer');setSideMode('source');setSideMode('answer');showView('editor');
  }
  function currentSide(side) {
    var mode = el(side + 'Mode').value;
    return safeSide({type: mode, value: mode === 'text' ? el(side + 'Text').value : images[side]});
  }
  function saveEntry(event) {
    if (event) event.preventDefault();
    var word = currentSide('source'), answer = currentSide('answer');
    if (!word || !answer) { msg('Please provide both a word and its matching answer, using text or an image.'); return; }
    var e = {id: editingId || 'entry-' + new Date().getTime() + '-' + Math.floor(Math.random()*1000000),
      word:word,answer:answer,language:trimmed(el('languageText').value),chapter:trimmed(el('chapterText').value),
      textbook:trimmed(el('textbookText').value),grammar:trimmed(el('grammarText').value), notes:trimmed(el('notesText').value)};
    var updated = false;
    for (var i=0;i<model.entries.length;i++) if(model.entries[i].id===editingId){ model.entries[i]=e; updated=true;break; }
    if(!updated) model.entries.push(e);
    resetEditor(true);markDirty();refresh();showView('entries');msg(updated ? 'Entry updated. Remember to export your collection.' : 'Entry added. Save your collection JSON to keep your changes.');
  }
  function downloadCollection() {
    model.name = trimmed(el('collectionTitle').value) || 'My Ancient Languages';
    var json = JSON.stringify(model,null,2);
    var blob = new Blob([json],{type:'application/json;charset=utf-8'});
    var url = (window.URL || window.webkitURL).createObjectURL(blob);
    var link = create('a');
    var filename = model.name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'') || 'ancient-language-collection';
    link.href=url;link.download=filename+'.json';
    document.body.appendChild(link);link.click();document.body.removeChild(link);
    // Browsers vary in when a download begins; delayed revocation is intentionally not required.
    window.setTimeout(function(){ (window.URL || window.webkitURL).revokeObjectURL(url); }, 30000);
    markSaved();msg('Requested collection download. Verify the JSON was saved before closing the browser.');
  }
  function readCollection(file) {
    if(!file || file.size > 45000000) { msg('Choose a collection JSON smaller than 45 MB.');return; }
    var reader = new FileReader();
    reader.onload = function(){
      try { var data = validateModel(JSON.parse(reader.result)); if(!promptDiscard())return; model=data;dirty=false;el('fileState').textContent='Loaded collection'; resetEditor(false); refresh();showView('entries');msg('Collection loaded: '+model.entries.length+' vocabulary entries.'); }
      catch(ex){msg('Import failed: '+ex.message);}
    };
    reader.onerror=function(){msg('Could not read the collection JSON.');};reader.readAsText(file);
  }
  function todayPoints() { return model.scores[localDay()] || 0; }
  function addPoints(amount) { var key=localDay(); model.scores[key]=(model.scores[key]||0)+amount;markDirty();renderReward();renderStats(); }
  function renderReward() {
    var value=todayPoints(),goal=model.settings.goal;
    el('todayPoints').textContent=value;el('goalDisplay').textContent=goal;
    el('goalProgress').max=goal;el('goalProgress').value=Math.min(value,goal);
    el('rewardMessage').textContent=value>=goal?'Reward unlocked: '+model.settings.reward: (goal-value)+' more points to your reward.';
  }
  function renderStats() {
    var total=0;for(var day in model.scores)if(Object.prototype.hasOwnProperty.call(model.scores,day))total+=model.scores[day];
    el('statsEntries').textContent=model.entries.length;el('statsToday').textContent=todayPoints();el('statsTotal').textContent=total;
    el('dailyGoal').value=model.settings.goal;el('rewardText').value=model.settings.reward;
  }

  // Cropper works on pixels, so neither Hebrew recognition nor retyping is needed.
  function loadPageImage(file) {
    readImage(file,function(data){
      var img=new Image();img.onload=function(){pageImage=img;selection=null;
        var scale=Math.min(950/img.width,600/img.height,1);
        el('cropCanvas').width=Math.max(1,Math.round(img.width*scale));
        el('cropCanvas').height=Math.max(1,Math.round(img.height*scale));
        drawCrop();el('cropInfo').textContent='Page loaded. Drag a rectangle around a word or definition.';
      };img.onerror=function(){msg('Could not decode the chapter screenshot.');};img.src=data;
    });
  }
  function cropPoint(event) {
    var canvas=el('cropCanvas'),rect=canvas.getBoundingClientRect();
    var x=(event.clientX-rect.left)*canvas.width/rect.width;
    var y=(event.clientY-rect.top)*canvas.height/rect.height;
    return {x:Math.max(0,Math.min(canvas.width,x)),y:Math.max(0,Math.min(canvas.height,y))};
  }
  function selectionFrom(a,b) {return {x:Math.min(a.x,b.x),y:Math.min(a.y,b.y),w:Math.abs(a.x-b.x),h:Math.abs(a.y-b.y)};}
  function drawCrop() {
    var canvas=el('cropCanvas'),ctx=canvas.getContext('2d');
    ctx.clearRect(0,0,canvas.width,canvas.height);
    if(pageImage)ctx.drawImage(pageImage,0,0,canvas.width,canvas.height);
    if(selection){ctx.save();ctx.strokeStyle='#d13630';ctx.lineWidth=3;ctx.strokeRect(selection.x,selection.y,selection.w,selection.h);ctx.fillStyle='rgba(255,222,0,0.13)';ctx.fillRect(selection.x,selection.y,selection.w,selection.h);ctx.restore();}
  }
  function selectedData() {
    if(!pageImage||!selection||selection.w<6||selection.h<6){msg('Drag a rectangle on the screenshot first.');return null;}
    var sx=pageImage.width/el('cropCanvas').width,sy=pageImage.height/el('cropCanvas').height;
    var w=Math.round(selection.w*sx),h=Math.round(selection.h*sy),ratio=Math.min(1,1400/w,700/h);
    var out=document.createElement('canvas');out.width=Math.max(1,Math.round(w*ratio));out.height=Math.max(1,Math.round(h*ratio));
    out.getContext('2d').drawImage(pageImage,selection.x*sx,selection.y*sy,selection.w*sx,selection.h*sy,0,0,out.width,out.height);
    return out.toDataURL('image/png');
  }
  function assignCrop(side) {
    var data=selectedData(); if(!data)return;
    images[side]=data;el(side+'Mode').value='image';setSideMode(side);showImagePreview(side);
    msg('Cropped image assigned to the '+(side==='source'?'word':'answer')+' side. Select the other side, or open the entry editor to save.');
  }

  function studySet(minimum) {
    var items=filteredEntries();
    if(items.length<minimum){msg('Add at least '+minimum+' entries to this language/chapter selection, or choose All chapters.');return null;}
    return shuffle(items);
  }
  function startMatching() {
    var entries=studySet(2);if(!entries)return;
    entries=entries.slice(0,Math.min(4,entries.length));
    var cards=[],i;
    for(i=0;i<entries.length;i++){cards.push({entry:entries[i],side:'word',id:i});cards.push({entry:entries[i],side:'answer',id:i});}
    matchState={cards:shuffle(cards),flipped:[],matched:{},matches:0,moves:0,total:entries.length};
    displayMatching();msg('Memory Match started: find the matching word and definition.');
  }
  function displayMatching() {
    if(!matchState)return;
    var board=el('matchBoard');clear(board);
    for(var i=0;i<matchState.cards.length;i++)(function(index){
      var card=matchState.cards[index],selected=matchState.flipped.indexOf(index)!==-1,correct=!!matchState.matched[card.id];
      var button=create('button',selected?'flipped':correct?'matched':'','');button.type='button';
      if(selected||correct)renderFace(button,card.entry[card.side],false);
      else button.appendChild(create('span','','?'));
      button.addEventListener('click',function(){flipMatch(index);});board.appendChild(button);
    })(i);
    el('matchInfo').textContent=matchState.matches+'/'+matchState.total+' pairs | '+matchState.moves+' attempts';
  }
  function flipMatch(index) {
    var st=matchState;if(!st)return;
    var card=st.cards[index];
    if(st.matched[card.id]||st.flipped.indexOf(index)!==-1)return;
    if(st.flipped.length===2)st.flipped=[];
    st.flipped.push(index);
    if(st.flipped.length===2){st.moves++;
      var other=st.cards[st.flipped[0]];
      if(other.id===card.id&&other.side!==card.side){st.matched[card.id]=true;st.matches++;addPoints(8);st.flipped=[];if(st.matches===st.total){addPoints(10);msg('Perfect! You completed Memory Match and earned '+(st.total*8+10)+' points.');}}
    }
    displayMatching();
  }
  function startFlashcards() {
    var entries=studySet(1);if(!entries)return;
    flashState={entries:entries,index:0,shown:false,credited:{}};displayFlash();msg('Flashcards started. Try to recall the answer, then click Reveal.');
  }
  function displayFlash() {
    if(!flashState)return;
    var st=flashState,box=el('flashCard');clear(box);
    if(st.index>=st.entries.length){box.appendChild(create('p','','Review complete!'));el('flashInfo').textContent='Finished';return;}
    var e=st.entries[st.index];
    renderFace(box,st.shown?e.answer:e.word,true);
    if(st.shown&&e.grammar)box.appendChild(create('p','muted', 'Grammar: '+e.grammar));
    if(st.shown&&e.notes)box.appendChild(create('p','muted','Notes: '+e.notes));
    el('flashInfo').textContent=(st.index+1)+' / '+st.entries.length;
  }
  function finishFlash(known) {
    var st=flashState;if(!st||st.index>=st.entries.length)return;
    if(!st.shown){msg('Please reveal the answer before grading this flashcard.');return;}
    var e=st.entries[st.index];
    if(known&&!st.credited[e.id]){addPoints(4);st.credited[e.id]=true;}
    if(!known&&st.entries.length<500)st.entries.push(e);
    st.index++;st.shown=false;displayFlash();
  }
  function choiceGame(mode) {
    var entries=studySet(2);if(!entries)return;
    var st={entries:entries,index:0,correct:0,mode:mode,answerLock:false};
    if(mode==='quiz'){quizState=st;showChoiceQuestion(st);} else {speedState=st;showChoiceQuestion(st);}
  }
  function showChoiceQuestion(st) {
    var question=el(st.mode+'Question'),choices=el(st.mode+'Choices');clear(question);clear(choices);
    if(st.index>=st.entries.length){
      if(st.mode==='quiz'){question.appendChild(create('p','','Quiz complete! '+st.correct+' of '+st.entries.length+' correct.'));el('quizInfo').textContent='Complete';}
      else{st.entries=shuffle(st.entries);st.index=0;showChoiceQuestion(st);}
      return;
    }
    var target=st.entries[st.index];renderFace(question,target.word,true);
    var others=shuffle(st.entries.filter(function(x){return x.id!==target.id;})).slice(0,3);
    var options=shuffle([target].concat(others));
    for(var j=0;j<options.length;j++)(function(choice){
      var button=create('button');button.type='button';renderFace(button,choice.answer,false);
      button.addEventListener('click',function(){submitChoice(st,target,choice);});choices.appendChild(button);
    })(options[j]);
    if(st.mode==='quiz')el('quizInfo').textContent=(st.index+1)+' / '+st.entries.length+' | '+st.correct+' correct';
  }
  function submitChoice(st,target,choice) {
    if(st.answerLock)return;
    if(st.mode==='speed'&&(!speedState||!speedTimer))return;
    if(target.id===choice.id){st.correct++;addPoints(10);msg('Correct! +10 points.');}
    else msg('Not quite. Keep practicing.');
    st.index++;showChoiceQuestion(st);
  }
  function startSpeed() {
    stopSpeed(false);choiceGame('speed');if(!speedState)return;
    speedState.remaining=60;
    el('speedInfo').textContent='60 seconds | 0 correct';
    speedTimer=window.setInterval(function(){
      if(!speedState){stopSpeed(false);return;}
      speedState.remaining--;
      el('speedInfo').textContent=speedState.remaining+' seconds | '+speedState.correct+' correct';
      if(speedState.remaining<=0)stopSpeed(true);
    },1000);
    msg('Your 60-second recognition challenge has begun!');
  }
  function stopSpeed(showResult) {
    if(speedTimer){window.clearInterval(speedTimer);speedTimer=null;}
    if(showResult&&speedState){clear(el('speedChoices'));clear(el('speedQuestion'));el('speedQuestion').appendChild(create('p','','Time! '+speedState.correct+' correct answers.'));msg('Speed challenge complete: '+speedState.correct+' correct answers.');}
    speedState = null;
  }
  function bindClicks() {
    var buttons=document.querySelectorAll('[data-view]');
    for(var i=0;i<buttons.length;i++)buttons[i].addEventListener('click',function(){showView(this.getAttribute('data-view'));});
    buttons=document.querySelectorAll('[data-menu]');
    for(i=0;i<buttons.length;i++)buttons[i].addEventListener('click',function(event){
      var menuName='menu-'+this.getAttribute('data-menu'),menu=el(menuName),wasHidden=menu.classList.contains('hidden');
      hideMenus();if(wasHidden){menu.style.left=this.getBoundingClientRect().left+'px';menu.classList.remove('hidden');}
      event.stopPropagation();
    });
    document.addEventListener('click',function(event){ if(!event.target.closest || !event.target.closest('.menu-popup'))hideMenus(); });
  }
  function init() {
    bindClicks();
    el('newCollection').addEventListener('click',function(){if(!promptDiscard())return;model=blankModel();dirty=false;el('fileState').textContent='New unsaved collection';resetEditor(false);refresh();showView('entries');msg('Blank collection started.');});
    el('loadCollection').addEventListener('click',function(){hideMenus();el('collectionFile').click();});
    el('collectionFile').addEventListener('change',function(){if(this.files.length)readCollection(this.files[0]);this.value='';});
    el('saveCollection').addEventListener('click',function(){hideMenus();downloadCollection();});
    el('collectionTitle').addEventListener('change',function(){model.name=trimmed(this.value)||model.name;markDirty();});
    el('languageFilter').addEventListener('change',renderTable);el('chapterFilter').addEventListener('change',renderTable);
    el('sourceMode').addEventListener('change',function(){setSideMode('source');});
    el('answerMode').addEventListener('change',function(){setSideMode('answer');});
    el('sourceFile').addEventListener('change',function(){if(this.files[0])readImage(this.files[0],function(data){images.source=data;showImagePreview('source');msg('Word screenshot ready to save.');});});
    el('answerFile').addEventListener('change',function(){if(this.files[0])readImage(this.files[0],function(data){images.answer=data;showImagePreview('answer');msg('Answer screenshot ready to save.');});});
    el('clearSourceImage').addEventListener('click',function(){images.source='';el('sourceFile').value='';showImagePreview('source');});
    el('clearAnswerImage').addEventListener('click',function(){images.answer='';el('answerFile').value='';showImagePreview('answer');});
    el('entryForm').addEventListener('submit',saveEntry);
    el('resetEntry').addEventListener('click',function(){resetEditor(true);msg('Entry form cleared.');});
    el('chapterImageFile').addEventListener('change',function(){if(this.files[0])loadPageImage(this.files[0]);});
    var canvas=el('cropCanvas');
    canvas.addEventListener('mousedown',function(event){if(!pageImage)return;selecting=true;dragStart=cropPoint(event);selection={x:dragStart.x,y:dragStart.y,w:0,h:0};drawCrop();event.preventDefault();});
    canvas.addEventListener('mousemove',function(event){if(!selecting)return;selection=selectionFrom(dragStart,cropPoint(event));drawCrop();});
    canvas.addEventListener('mouseup',function(event){if(!selecting)return;selecting=false;selection=selectionFrom(dragStart,cropPoint(event));drawCrop();el('cropInfo').textContent='Selection ready. Choose Word or Answer below.';});
    canvas.addEventListener('mouseleave',function(event){if(selecting){selecting=false;selection=selectionFrom(dragStart,cropPoint(event));drawCrop();}});
    el('cropToSource').addEventListener('click',function(){assignCrop('source');});
    el('cropToAnswer').addEventListener('click',function(){assignCrop('answer');});
    el('cropClear').addEventListener('click',function(){selection=null;drawCrop();});
    el('startMatching').addEventListener('click',startMatching);
    el('startFlashcards').addEventListener('click',startFlashcards);
    el('revealFlash').addEventListener('click',function(){if(flashState){flashState.shown=true;displayFlash();}});
    el('knownFlash').addEventListener('click',function(){finishFlash(true);});
    el('missedFlash').addEventListener('click',function(){finishFlash(false);});
    el('startQuiz').addEventListener('click',function(){choiceGame('quiz');});
    el('startSpeed').addEventListener('click',startSpeed);
    el('saveReward').addEventListener('click',function(){var n=Number(el('dailyGoal').value);if(!isFinite(n)||n<10||n>10000){msg('Choose a goal between 10 and 10,000 points.');return;}model.settings.goal=Math.floor(n);model.settings.reward=trimmed(el('rewardText').value)||'Enjoy a tasty snack!';markDirty();renderReward();renderStats();msg('Reward preferences updated. Export JSON to keep them.');});
    window.onbeforeunload=function(event){if(dirty){var text='Unsaved changes may be lost. Export your collection JSON first.';event.returnValue=text;return text;}};
    resetEditor(false);refresh();showView('entries');
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();

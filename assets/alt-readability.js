/* Ancient Language Trainer: optional Biblical Hebrew readability enhancement.
 * Copyright (C) 2026. GPL-3.0-or-later.
 * No network, no storage, no external dependencies. ES5-friendly.
 */
(function () {
  'use strict';
  var sizes = { small: 28, normal: 34, large: 40, extra: 48 };
  var setting = 'large'; /* 40px default after MX Linux Pale Moon readability testing. */
  var toolbar;
  var timer = null;
  var hebrew = /[\u0590-\u05FF]/;
  var latin = /[A-Za-z]/;

  function hasDirectHebrew(el) {
    var i, n, s = '';
    if (!el || !el.childNodes) return false;
    for (i = 0; i < el.childNodes.length; i++) {
      n = el.childNodes[i];
      if (n.nodeType === 3) s += n.nodeValue || '';
    }
    /* Don't enlarge labels that contain English explanatory prose. */
    return hebrew.test(s) && !latin.test(s);
  }
  function isFormControl(el) {
    var tag = (el.tagName || '').toLowerCase();
    return /^(input|select|option|textarea|script|style|noscript)$/.test(tag);
  }
  function isInsideToolbar(el) {
    while (el) {
      if (el === toolbar) return true;
      el = el.parentNode;
    }
    return false;
  }
  function styleHebrew(el) {
    if (isFormControl(el) || isInsideToolbar(el) || !hasDirectHebrew(el)) return;
    el.style.fontFamily = '"Ezra SIL", "SBL Hebrew", "Noto Serif Hebrew", serif';
    el.style.fontSize = sizes[setting] + 'px';
    el.style.lineHeight = '1.52';
    el.style.maxWidth = '100%';
    /* Preserve original direction and text, including any Unicode vowel marks. */
    if ((' ' + el.className + ' ').indexOf(' alt-hebrew-readable ') < 0 && typeof el.className === 'string') {
      el.className += ' alt-hebrew-readable';
    }
  }
  function scan() {
    timer = null;
    var nodes = document.body.getElementsByTagName('*'), i;
    for (i = 0; i < nodes.length; i++) styleHebrew(nodes[i]);
  }
  function queueScan() {
    if (timer !== null) return;
    timer = window.setTimeout(scan, 80);
  }
  function createToolbar() {
    toolbar = document.createElement('div');
    toolbar.id = 'alt-readability-toolbar';
    toolbar.setAttribute('role', 'region');
    toolbar.setAttribute('aria-label', 'Hebrew font size');
    toolbar.style.cssText = 'position:fixed;bottom:10px;right:14px;z-index:99999;background:#f8fafc;border:1px solid #8797a8;border-radius:6px;padding:7px 9px;color:#172b43;font:14px Arial,sans-serif;box-shadow:0 2px 8px rgba(0,0,0,.18);';
    var label = document.createElement('label');
    label.appendChild(document.createTextNode('Hebrew size: '));
    label.htmlFor = 'alt-hebrew-size';
    toolbar.appendChild(label);
    var select = document.createElement('select');
    select.id = 'alt-hebrew-size';
    select.style.cssText = 'font:14px Arial,sans-serif;padding:4px;max-width:130px;';
    var opts = [['small', 'Small (28)'], ['normal', 'Normal (34)'], ['large', 'Large (40)'], ['extra', 'Extra large (48)']];
    for (var i = 0; i < opts.length; i++) {
      var opt = document.createElement('option');
      opt.value = opts[i][0];
      opt.text = opts[i][1];
      select.add(opt);
    }
    select.value = setting;
    select.onchange = function () { setting = select.value; scan(); };
    toolbar.appendChild(select);
    var hide = document.createElement('button');
    hide.type = 'button';
    hide.appendChild(document.createTextNode('Hide'));
    hide.style.cssText = 'margin-left:8px;padding:4px 7px;font:13px Arial,sans-serif;';
    hide.onclick = function () { toolbar.style.display = 'none'; };
    toolbar.appendChild(hide);
    document.body.appendChild(toolbar);
    /* Ctrl+Alt+H restores the toolbar when hidden. */
    document.addEventListener('keydown', function (ev) {
      var key = ev.key || '';
      if (ev.ctrlKey && ev.altKey && (key === 'h' || key === 'H' || ev.keyCode === 72)) {
        toolbar.style.display = 'block';
      }
    });
  }
  function init() {
    if (document.getElementById('alt-readability-toolbar')) return;
    createToolbar();
    scan();
    if (window.MutationObserver) {
      var observer = new MutationObserver(queueScan);
      observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    } else {
      window.setInterval(scan, 1500);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
}());

/* ============================================================
   Presentation Generator — App Logic
   Pure HTML/CSS/JS (no dependencies)
   ============================================================ */

(function () {
  'use strict';

  const CANVAS_W = 1280;
  const CANVAS_H = 720;
  const STORAGE_KEY = 'pres-gen-state-v1';

  const FONT_FAMILIES = {
    sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Pretendard", "Helvetica Neue", Arial, sans-serif',
    serif: 'Georgia, "Times New Roman", "Nanum Myeongjo", serif',
    mono: '"SF Mono", Menlo, Monaco, "Courier New", monospace',
    display: '"Helvetica Neue", "Pretendard", Impact, Arial, sans-serif',
  };

  const LAYOUTS = {
    blank: { name: 'Blank', elements: () => [] },
    title: {
      name: 'Title',
      elements: () => [
        textEl({ x: 140, y: 280, w: 1000, h: 110, text: 'Presentation', fontSize: 84, fontWeight: 700, align: 'center' }),
        textEl({ x: 240, y: 410, w: 800, h: 60, text: 'Subtitle goes here', fontSize: 26, fontWeight: 300, align: 'center', color: '#9a9a9a' }),
      ],
    },
    titleBody: {
      name: 'Title + Body',
      elements: () => [
        textEl({ x: 100, y: 100, w: 1080, h: 100, text: 'Section title', fontSize: 56, fontWeight: 700 }),
        textEl({ x: 100, y: 240, w: 1080, h: 380, text: 'Body content. Edit this in the properties panel.\n\nAdd more lines as needed.', fontSize: 26, fontWeight: 400, color: '#cfcfcf' }),
      ],
    },
    twoColumn: {
      name: 'Two Column',
      elements: () => [
        textEl({ x: 80, y: 120, w: 540, h: 60, text: 'Left title', fontSize: 36, fontWeight: 700 }),
        textEl({ x: 80, y: 200, w: 540, h: 420, text: 'Left column content.', fontSize: 22, color: '#cfcfcf' }),
        textEl({ x: 660, y: 120, w: 540, h: 60, text: 'Right title', fontSize: 36, fontWeight: 700 }),
        textEl({ x: 660, y: 200, w: 540, h: 420, text: 'Right column content.', fontSize: 22, color: '#cfcfcf' }),
      ],
    },
  };

  // ---------- Standalone export template ----------
  // Self-contained HTML viewer (no dependencies). Slide data is injected at
  // __SLIDES_JSON__. Drop the file into a GH Pages repo to deploy.
  const EXPORT_TEMPLATE = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Presentation</title>
<style>
*, *::before, *::after { box-sizing: border-box; }
html, body { margin: 0; padding: 0; height: 100%; background: #000; color: #fff; overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Pretendard", "Helvetica Neue", Arial, sans-serif; }
.stage { position: fixed; inset: 0; display: flex; align-items: center; justify-content: center; }
.frame { position: relative; width: min(100vw, calc(100vh * 16 / 9));
  height: min(100vh, calc(100vw * 9 / 16)); overflow: hidden; }
.canvas { position: absolute; top: 50%; left: 50%; width: 1280px; height: 720px;
  transform: translate(-50%, -50%); transform-origin: center center; }
.el { position: absolute; user-select: none;
  transition: transform 0.25s ease, filter 0.25s ease, opacity 0.25s ease, color 0.25s ease, background 0.25s ease; }
.el.text { display: flex; align-items: center; line-height: 1.3; padding: 4px; word-break: break-word; }
.el.text > div { width: 100%; }
.el.shape-rect { border-radius: 4px; }
.el.shape-circle { border-radius: 50%; }
.el.hover-scale:hover { transform: scale(1.05); }
.el.hover-glow:hover { filter: drop-shadow(0 0 12px rgba(255,255,255,0.55)); }
.el.hover-lift:hover { transform: translateY(-6px); }
.el.hover-fade:hover { opacity: 0.6; }
@keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
@keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
@keyframes slideLeft { from { opacity: 0; transform: translateX(-40px); } to { opacity: 1; transform: translateX(0); } }
@keyframes slideRight { from { opacity: 0; transform: translateX(40px); } to { opacity: 1; transform: translateX(0); } }
@keyframes scaleUp { from { opacity: 0; transform: scale(0.85); } to { opacity: 1; transform: scale(1); } }
.anim-fade { animation: fadeIn .6s ease both; }
.anim-up { animation: slideUp .6s cubic-bezier(.2,.8,.2,1) both; }
.anim-left { animation: slideLeft .6s cubic-bezier(.2,.8,.2,1) both; }
.anim-right { animation: slideRight .6s cubic-bezier(.2,.8,.2,1) both; }
.anim-scale { animation: scaleUp .6s cubic-bezier(.2,.8,.2,1) both; }
.hud { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); display: flex; gap: 4px;
  align-items: center; padding: 6px; background: rgba(20,20,20,0.75); backdrop-filter: blur(10px);
  border: 1px solid #262626; border-radius: 999px; opacity: 0; transition: opacity .3s ease;
  font-size: 12px; z-index: 10; }
body:hover .hud, .hud:hover { opacity: 1; }
.hud button { background: transparent; border: none; color: #9a9a9a; padding: 6px 14px;
  cursor: pointer; border-radius: 999px; font: inherit; }
.hud button:hover { background: #1f1f1f; color: #fff; }
.hud .counter { padding: 0 10px; color: #9a9a9a; font-variant-numeric: tabular-nums; }
</style>
</head>
<body>
<div class="stage"><div class="frame"><div class="canvas" id="canvas"></div></div></div>
<div class="hud">
  <button id="prev" title="Prev">‹</button>
  <span class="counter" id="counter">1 / 1</span>
  <button id="next" title="Next">›</button>
  <button id="full" title="Fullscreen (F)">Full</button>
</div>
<script id="data" type="application/json">__SLIDES_JSON__</script>
<script>
(function(){
  var CANVAS_W=1280,CANVAS_H=720;
  var FF={
    sans:'-apple-system, BlinkMacSystemFont, "Segoe UI", "Pretendard", "Helvetica Neue", Arial, sans-serif',
    serif:'Georgia, "Times New Roman", "Nanum Myeongjo", serif',
    mono:'"SF Mono", Menlo, Monaco, "Courier New", monospace',
    display:'"Helvetica Neue", "Pretendard", Impact, Arial, sans-serif'
  };
  var slides=[];
  try { slides=JSON.parse(document.getElementById('data').textContent)||[]; } catch(e) {}
  if(!slides.length){slides=[{bg:'#0a0a0a',elements:[]}];}
  var idx=0;
  var canvas=document.getElementById('canvas');
  var counter=document.getElementById('counter');
  function fit(){
    var frame=document.querySelector('.frame');
    var s=Math.min(frame.clientWidth/CANVAS_W,frame.clientHeight/CANVAS_H);
    canvas.style.transform='translate(-50%, -50%) scale('+s+')';
  }
  function render(){
    var slide=slides[idx]; if(!slide) return;
    document.body.style.background=slide.bg||'#000';
    canvas.innerHTML='';
    (slide.elements||[]).forEach(function(el,i){
      var node=document.createElement('div');
      node.className='el '+(el.type==='text'?'text':'shape-'+el.type);
      node.style.left=el.x+'px'; node.style.top=el.y+'px';
      node.style.width=el.w+'px'; node.style.height=el.h+'px';
      if(el.type==='text'){
        node.style.fontFamily=FF[el.font]||FF.sans;
        node.style.fontSize=el.fontSize+'px';
        node.style.fontWeight=String(el.fontWeight);
        node.style.color=el.color;
        node.style.textAlign=el.align;
        var inner=document.createElement('div');
        inner.textContent=el.text;
        node.appendChild(inner);
      } else {
        node.style.background=el.fill;
      }
      if(el.motion&&el.motion!=='none'){node.classList.add(el.motion);node.style.animationDelay=(i*0.08)+'s';}
      if(el.hover&&el.hover!=='none') node.classList.add(el.hover);
      canvas.appendChild(node);
    });
    counter.textContent=(idx+1)+' / '+slides.length;
    if(history&&history.replaceState) history.replaceState(null,'','#'+(idx+1));
  }
  function next(){ if(idx<slides.length-1){idx++;render();} }
  function prev(){ if(idx>0){idx--;render();} }
  function full(){
    if(!document.fullscreenElement){
      var r=document.documentElement.requestFullscreen;
      if(r) r.call(document.documentElement);
    } else if(document.exitFullscreen){
      document.exitFullscreen();
    }
  }
  document.addEventListener('keydown',function(e){
    if(e.key==='ArrowRight'||e.key===' '||e.key==='PageDown'){e.preventDefault();next();}
    else if(e.key==='ArrowLeft'||e.key==='PageUp'){e.preventDefault();prev();}
    else if(e.key==='Home'){idx=0;render();}
    else if(e.key==='End'){idx=slides.length-1;render();}
    else if(e.key==='f'||e.key==='F'){full();}
  });
  document.getElementById('next').addEventListener('click',next);
  document.getElementById('prev').addEventListener('click',prev);
  document.getElementById('full').addEventListener('click',full);
  document.addEventListener('click',function(e){
    if(e.target.closest('.hud')) return;
    next();
  });
  window.addEventListener('resize',fit);
  var h=parseInt((location.hash||'').replace('#',''),10);
  if(h&&h>=1&&h<=slides.length) idx=h-1;
  fit(); render();
})();
</script>
</body>
</html>`;

  function uid(prefix) {
    return prefix + '_' + Math.random().toString(36).slice(2, 9);
  }

  function textEl(props) {
    return Object.assign({
      id: uid('el'),
      type: 'text',
      x: 100, y: 100, w: 400, h: 80,
      text: 'Text',
      font: 'sans',
      fontSize: 32,
      fontWeight: 400,
      color: '#ffffff',
      align: 'left',
      hover: 'none',
      motion: 'none',
    }, props);
  }

  function shapeEl(type, props) {
    return Object.assign({
      id: uid('el'),
      type: type,
      x: 200, y: 200, w: 200, h: 200,
      fill: '#ffffff',
      hover: 'none',
      motion: 'none',
    }, props);
  }

  function newSlide(layout) {
    layout = layout || 'titleBody';
    return {
      id: uid('slide'),
      bg: '#0a0a0a',
      layout: layout,
      elements: LAYOUTS[layout].elements(),
    };
  }

  // ---------- State ----------
  const state = {
    slides: [],
    currentSlideId: null,
    selectedElementId: null,
  };

  // ---------- Persistence ----------
  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        slides: state.slides,
        currentSlideId: state.currentSlideId,
      }));
    } catch (e) {}
  }

  function restore() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      if (!data || !Array.isArray(data.slides) || !data.slides.length) return false;
      state.slides = data.slides;
      state.currentSlideId = data.currentSlideId || data.slides[0].id;
      return true;
    } catch (e) {
      return false;
    }
  }

  // ---------- Helpers ----------
  function getCurrentSlide() {
    return state.slides.find(s => s.id === state.currentSlideId) || null;
  }
  function getSelectedElement() {
    const slide = getCurrentSlide();
    if (!slide) return null;
    return slide.elements.find(el => el.id === state.selectedElementId) || null;
  }

  // ---------- DOM refs ----------
  const els = {};

  // ---------- Render ----------
  function renderAll() {
    renderSlidesList();
    renderCanvas();
    renderProperties();
    persist();
  }

  function renderSlidesList() {
    els.slidesList.innerHTML = '';
    els.slideCount.textContent = String(state.slides.length).padStart(2, '0');
    state.slides.forEach((slide, i) => {
      const thumb = document.createElement('div');
      thumb.className = 'slide-thumb' + (slide.id === state.currentSlideId ? ' active' : '');

      const num = document.createElement('span');
      num.className = 'slide-thumb-num';
      num.textContent = String(i + 1).padStart(2, '0');
      thumb.appendChild(num);

      const del = document.createElement('button');
      del.className = 'slide-thumb-del';
      del.textContent = '×';
      del.title = 'Delete slide';
      del.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteSlide(slide.id);
      });
      thumb.appendChild(del);

      const inner = document.createElement('div');
      inner.className = 'slide-thumb-inner';
      inner.style.width = CANVAS_W + 'px';
      inner.style.height = CANVAS_H + 'px';
      inner.style.background = slide.bg;
      slide.elements.forEach(el => inner.appendChild(buildElementNode(el, true)));
      thumb.appendChild(inner);

      thumb.addEventListener('click', () => selectSlide(slide.id));
      els.slidesList.appendChild(thumb);

      requestAnimationFrame(() => {
        const w = thumb.clientWidth;
        const h = thumb.clientHeight;
        if (w > 0 && h > 0) {
          const s = Math.min(w / CANVAS_W, h / CANVAS_H);
          inner.style.transform = 'scale(' + s + ')';
        }
      });
    });
  }

  function renderCanvas() {
    els.canvas.innerHTML = '';
    const slide = getCurrentSlide();
    if (!slide) {
      const empty = document.createElement('div');
      empty.className = 'canvas-empty';
      empty.textContent = 'No slide selected';
      els.canvas.appendChild(empty);
      els.canvas.style.background = '#000';
      els.btnDeleteElement.disabled = true;
      return;
    }
    els.canvas.style.background = slide.bg;
    slide.elements.forEach(el => {
      els.canvas.appendChild(buildElementNode(el, false));
    });
    els.btnDeleteElement.disabled = !state.selectedElementId;
  }

  function buildElementNode(el, preview) {
    const node = document.createElement('div');
    node.className = 'el ' + (el.type === 'text' ? 'text' : 'shape-' + el.type);
    if (!preview && el.id === state.selectedElementId) node.classList.add('selected');
    node.style.left = el.x + 'px';
    node.style.top = el.y + 'px';
    node.style.width = el.w + 'px';
    node.style.height = el.h + 'px';

    if (el.type === 'text') {
      node.style.fontFamily = FONT_FAMILIES[el.font] || FONT_FAMILIES.sans;
      node.style.fontSize = el.fontSize + 'px';
      node.style.fontWeight = String(el.fontWeight);
      node.style.color = el.color;
      node.style.textAlign = el.align;
      node.style.display = 'flex';
      node.style.alignItems = 'center';
      const inner = document.createElement('div');
      inner.style.width = '100%';
      inner.style.pointerEvents = 'none';
      inner.textContent = el.text;
      node.appendChild(inner);
    } else {
      node.style.background = el.fill;
    }

    if (!preview) {
      const handle = document.createElement('div');
      handle.className = 'resize-handle';
      handle.addEventListener('mousedown', (e) => beginResize(e, el.id));
      node.appendChild(handle);

      node.addEventListener('mousedown', (e) => {
        if (e.target.classList.contains('resize-handle')) return;
        selectElement(el.id);
        beginDrag(e, el.id);
      });
    }
    return node;
  }

  // ---------- Properties panel ----------
  function renderProperties() {
    const body = els.propertiesBody;
    body.innerHTML = '';
    const slide = getCurrentSlide();
    if (!slide) {
      body.innerHTML = '<div class="empty-hint">Add a slide to begin</div>';
      return;
    }
    const sel = getSelectedElement();
    if (sel) body.appendChild(buildElementProps(sel));
    else body.appendChild(buildSlideProps(slide));
  }

  function section(title) {
    const wrap = document.createElement('div');
    wrap.className = 'prop-section';
    const h = document.createElement('div');
    h.className = 'prop-section-title';
    h.textContent = title;
    wrap.appendChild(h);
    return wrap;
  }

  function row(label) {
    const r = document.createElement('div');
    r.className = 'prop-row';
    if (label) {
      const l = document.createElement('label');
      l.className = 'prop-label';
      l.textContent = label;
      r.appendChild(l);
    }
    return r;
  }

  function numInput(value, onChange) {
    const i = document.createElement('input');
    i.type = 'number';
    i.className = 'prop-input';
    i.value = value;
    i.addEventListener('change', () => onChange(parseFloat(i.value) || 0));
    return i;
  }

  function selectInput(value, options, onChange) {
    const s = document.createElement('select');
    s.className = 'prop-select';
    options.forEach(opt => {
      const o = document.createElement('option');
      o.value = opt[0];
      o.textContent = opt[1];
      if (opt[0] === String(value)) o.selected = true;
      s.appendChild(o);
    });
    s.addEventListener('change', () => onChange(s.value));
    return s;
  }

  function colorInput(value, onChange) {
    const wrap = document.createElement('span');
    wrap.style.display = 'flex';
    wrap.style.flex = '1';
    wrap.style.gap = '6px';
    const c = document.createElement('input');
    c.type = 'color';
    c.className = 'prop-color';
    c.value = value;
    const t = document.createElement('input');
    t.type = 'text';
    t.className = 'prop-input';
    t.value = value;
    c.addEventListener('input', () => { t.value = c.value; onChange(c.value); });
    t.addEventListener('change', () => { c.value = t.value; onChange(t.value); });
    wrap.appendChild(c);
    wrap.appendChild(t);
    return wrap;
  }

  function buildSlideProps(slide) {
    const frag = document.createDocumentFragment();

    // Layout
    const lay = section('Layout');
    const grid = document.createElement('div');
    grid.className = 'layout-grid';
    Object.keys(LAYOUTS).forEach(key => {
      const v = LAYOUTS[key];
      const card = document.createElement('div');
      const cls = key.toLowerCase().replace(/[^a-z]/g, '');
      card.className = 'layout-card lc-' + cls;
      card.dataset.name = v.name;
      if (slide.layout === key) card.classList.add('active');
      ['t1', 't2', 't3', 't4', 't5', 't6'].forEach(c => {
        const bar = document.createElement('div');
        bar.className = 'lc-bar ' + c;
        card.appendChild(bar);
      });
      card.addEventListener('click', () => {
        if (slide.layout === key) return;
        if (slide.elements.length > 0 && key !== 'blank') {
          if (!confirm('Replace current elements with the new layout template?')) return;
        }
        applyLayout(slide.id, key);
      });
      grid.appendChild(card);
    });
    lay.appendChild(grid);
    frag.appendChild(lay);

    // Background
    const bg = section('Background');
    const bgRow = row('Color');
    bgRow.appendChild(colorInput(slide.bg, v => {
      slide.bg = v;
      renderCanvas();
      renderSlidesList();
      persist();
    }));
    bg.appendChild(bgRow);
    frag.appendChild(bg);

    // Add element
    const add = section('Add element');
    const addPills = document.createElement('div');
    addPills.className = 'pill-group';
    [['Text', 'text'], ['Rectangle', 'rect'], ['Circle', 'circle']].forEach(opt => {
      const p = document.createElement('button');
      p.className = 'pill';
      p.textContent = '+ ' + opt[0];
      p.addEventListener('click', () => addElement(opt[1]));
      addPills.appendChild(p);
    });
    add.appendChild(addPills);
    frag.appendChild(add);

    return frag;
  }

  function buildElementProps(el) {
    const frag = document.createDocumentFragment();

    // Position & size
    const pos = section('Position & size');
    const r1 = row('X / Y');
    r1.appendChild(numInput(el.x, v => updateElement(el.id, { x: v })));
    r1.appendChild(numInput(el.y, v => updateElement(el.id, { y: v })));
    pos.appendChild(r1);
    const r2 = row('W / H');
    r2.appendChild(numInput(el.w, v => updateElement(el.id, { w: v })));
    r2.appendChild(numInput(el.h, v => updateElement(el.id, { h: v })));
    pos.appendChild(r2);
    frag.appendChild(pos);

    if (el.type === 'text') {
      // Content
      const c = section('Content');
      const cr = document.createElement('div');
      cr.className = 'prop-row';
      const ta = document.createElement('textarea');
      ta.className = 'prop-textarea';
      ta.value = el.text;
      ta.addEventListener('input', () => updateElement(el.id, { text: ta.value }, { skipPropsRender: true }));
      cr.appendChild(ta);
      c.appendChild(cr);
      frag.appendChild(c);

      // Typography
      const t = section('Typography');
      const fr = row('Font');
      fr.appendChild(selectInput(el.font, [
        ['sans', 'Sans'], ['serif', 'Serif'], ['mono', 'Mono'], ['display', 'Display'],
      ], v => updateElement(el.id, { font: v })));
      t.appendChild(fr);

      const wr = row('Weight');
      wr.appendChild(selectInput(String(el.fontWeight), [
        ['300', 'Light'], ['400', 'Regular'], ['600', 'Semibold'], ['700', 'Bold'],
      ], v => updateElement(el.id, { fontWeight: parseInt(v, 10) })));
      t.appendChild(wr);

      const sr = row('Size');
      const range = document.createElement('input');
      range.type = 'range';
      range.className = 'prop-range';
      range.min = '8';
      range.max = '200';
      range.value = el.fontSize;
      const sv = document.createElement('span');
      sv.className = 'prop-value';
      sv.textContent = el.fontSize + 'px';
      range.addEventListener('input', () => {
        sv.textContent = range.value + 'px';
        updateElement(el.id, { fontSize: parseInt(range.value, 10) }, { skipPropsRender: true });
      });
      sr.appendChild(range);
      sr.appendChild(sv);
      t.appendChild(sr);

      const ar = row('Align');
      const apills = document.createElement('div');
      apills.className = 'pill-group';
      ['left', 'center', 'right'].forEach(a => {
        const p = document.createElement('button');
        p.className = 'pill' + (el.align === a ? ' active' : '');
        p.textContent = a;
        p.addEventListener('click', () => updateElement(el.id, { align: a }));
        apills.appendChild(p);
      });
      ar.appendChild(apills);
      t.appendChild(ar);

      const colr = row('Color');
      colr.appendChild(colorInput(el.color, v => updateElement(el.id, { color: v }, { skipPropsRender: true })));
      t.appendChild(colr);

      frag.appendChild(t);
    } else {
      const s = section('Shape');
      const fr = row('Fill');
      fr.appendChild(colorInput(el.fill, v => updateElement(el.id, { fill: v }, { skipPropsRender: true })));
      s.appendChild(fr);
      frag.appendChild(s);
    }

    // Interactions
    const ix = section('Interaction');
    const hr = row('Hover');
    hr.appendChild(selectInput(el.hover, [
      ['none', 'None'],
      ['hover-scale', 'Scale up'],
      ['hover-glow', 'Glow'],
      ['hover-lift', 'Lift'],
      ['hover-fade', 'Fade'],
    ], v => updateElement(el.id, { hover: v })));
    ix.appendChild(hr);

    const mr = row('Motion');
    mr.appendChild(selectInput(el.motion, [
      ['none', 'None'],
      ['anim-fade', 'Fade in'],
      ['anim-up', 'Slide up'],
      ['anim-left', 'Slide left'],
      ['anim-right', 'Slide right'],
      ['anim-scale', 'Scale in'],
    ], v => updateElement(el.id, { motion: v })));
    ix.appendChild(mr);
    const hint = document.createElement('div');
    hint.style.fontSize = '11px';
    hint.style.color = 'var(--text-faint)';
    hint.style.marginTop = '6px';
    hint.textContent = 'Effects play in Present mode.';
    ix.appendChild(hint);
    frag.appendChild(ix);

    return frag;
  }

  // ---------- Actions ----------
  function addSlide() {
    const slide = newSlide('titleBody');
    state.slides.push(slide);
    state.currentSlideId = slide.id;
    state.selectedElementId = null;
    renderAll();
  }

  function deleteSlide(id) {
    const idx = state.slides.findIndex(s => s.id === id);
    if (idx === -1) return;
    state.slides.splice(idx, 1);
    if (state.currentSlideId === id) {
      const next = state.slides[idx] || state.slides[idx - 1] || null;
      state.currentSlideId = next ? next.id : null;
      state.selectedElementId = null;
    }
    renderAll();
  }

  function selectSlide(id) {
    state.currentSlideId = id;
    state.selectedElementId = null;
    renderAll();
  }

  function applyLayout(slideId, layout) {
    const slide = state.slides.find(s => s.id === slideId);
    if (!slide) return;
    slide.layout = layout;
    slide.elements = LAYOUTS[layout].elements();
    state.selectedElementId = null;
    renderAll();
  }

  function addElement(type) {
    const slide = getCurrentSlide();
    if (!slide) return;
    let el;
    if (type === 'text') {
      el = textEl({ x: 200, y: 200, w: 480, h: 80, text: 'New text' });
    } else if (type === 'circle') {
      el = shapeEl('circle', { x: 540, y: 260, w: 200, h: 200 });
    } else {
      el = shapeEl('rect', { x: 440, y: 260, w: 400, h: 200 });
    }
    slide.elements.push(el);
    state.selectedElementId = el.id;
    renderAll();
  }

  function updateElement(id, patch, opts) {
    opts = opts || {};
    const slide = getCurrentSlide();
    if (!slide) return;
    const el = slide.elements.find(e => e.id === id);
    if (!el) return;
    Object.assign(el, patch);
    renderCanvas();
    renderSlidesList();
    if (!opts.skipPropsRender) renderProperties();
    persist();
  }

  function selectElement(id) {
    if (state.selectedElementId === id) return;
    state.selectedElementId = id;
    renderCanvas();
    renderProperties();
  }

  function deselectElement() {
    if (!state.selectedElementId) return;
    state.selectedElementId = null;
    renderCanvas();
    renderProperties();
  }

  function deleteElement() {
    const slide = getCurrentSlide();
    const id = state.selectedElementId;
    if (!slide || !id) return;
    slide.elements = slide.elements.filter(e => e.id !== id);
    state.selectedElementId = null;
    renderAll();
  }

  // ---------- Drag / Resize ----------
  let dragState = null;

  function beginDrag(e, id) {
    e.preventDefault();
    const slide = getCurrentSlide();
    if (!slide) return;
    const el = slide.elements.find(x => x.id === id);
    if (!el) return;
    dragState = {
      mode: 'move', id: id,
      startX: e.clientX, startY: e.clientY,
      origX: el.x, origY: el.y,
    };
    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', endDrag);
  }

  function beginResize(e, id) {
    e.preventDefault();
    e.stopPropagation();
    const slide = getCurrentSlide();
    if (!slide) return;
    const el = slide.elements.find(x => x.id === id);
    if (!el) return;
    selectElement(id);
    dragState = {
      mode: 'resize', id: id,
      startX: e.clientX, startY: e.clientY,
      origW: el.w, origH: el.h,
    };
    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', endDrag);
  }

  function onDrag(e) {
    if (!dragState) return;
    const rect = els.canvas.getBoundingClientRect();
    const scale = rect.width / CANVAS_W || 1;
    const dx = (e.clientX - dragState.startX) / scale;
    const dy = (e.clientY - dragState.startY) / scale;
    if (dragState.mode === 'move') {
      updateElement(dragState.id, {
        x: Math.round(dragState.origX + dx),
        y: Math.round(dragState.origY + dy),
      }, { skipPropsRender: true });
    } else {
      updateElement(dragState.id, {
        w: Math.max(20, Math.round(dragState.origW + dx)),
        h: Math.max(20, Math.round(dragState.origH + dy)),
      }, { skipPropsRender: true });
    }
  }

  function endDrag() {
    if (!dragState) return;
    dragState = null;
    document.removeEventListener('mousemove', onDrag);
    document.removeEventListener('mouseup', endDrag);
    renderProperties();
    persist();
  }

  // ---------- Save / Load ----------
  // Save = export a single self-contained HTML file ready to deploy on GH Pages.
  // The file embeds slide data inside <script id="data" type="application/json">,
  // so the same exported file can also be re-imported via Load.
  function saveToFile() {
    if (!state.slides.length) {
      alert('No slides to export.');
      return;
    }
    const safeJson = JSON.stringify(state.slides).replace(/</g, '\\u003c');
    const html = EXPORT_TEMPLATE.replace('__SLIDES_JSON__', () => safeJson);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'presentation.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function loadFromFile(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = String(reader.result);
        let slides;
        const isHtml = /\.html?$/i.test(file.name) || /^\s*<!DOCTYPE/i.test(text);
        if (isHtml) {
          const m = text.match(/<script id="data" type="application\/json">([\s\S]*?)<\/script>/);
          if (!m) throw new Error('No embedded slide data found');
          slides = JSON.parse(m[1]);
        } else {
          const data = JSON.parse(text);
          slides = Array.isArray(data) ? data : data.slides;
        }
        if (!Array.isArray(slides)) throw new Error('Invalid slide data');
        state.slides = slides;
        state.currentSlideId = slides.length ? slides[0].id : null;
        state.selectedElementId = null;
        renderAll();
      } catch (e) {
        alert('Could not load file: ' + (e.message || 'invalid format'));
      }
    };
    reader.readAsText(file);
  }

  // ---------- Present mode ----------
  let presentIndex = 0;

  function enterPresent() {
    if (!state.slides.length) return;
    presentIndex = Math.max(0, state.slides.findIndex(s => s.id === state.currentSlideId));
    if (presentIndex < 0) presentIndex = 0;
    els.presentOverlay.hidden = false;
    requestAnimationFrame(renderPresent);
    document.addEventListener('keydown', onPresentKey);
  }

  function exitPresent() {
    els.presentOverlay.hidden = true;
    document.removeEventListener('keydown', onPresentKey);
  }

  function nextPresent() {
    if (presentIndex < state.slides.length - 1) {
      presentIndex++;
      renderPresent();
    }
  }
  function prevPresent() {
    if (presentIndex > 0) {
      presentIndex--;
      renderPresent();
    }
  }

  function onPresentKey(e) {
    if (e.key === 'Escape') { exitPresent(); }
    else if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
      e.preventDefault(); nextPresent();
    } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
      e.preventDefault(); prevPresent();
    }
  }

  function renderPresent() {
    const slide = state.slides[presentIndex];
    if (!slide) return;
    const stage = els.presentStage;
    stage.innerHTML = '';
    stage.style.background = slide.bg;

    const sw = stage.clientWidth;
    const sh = stage.clientHeight;
    const scale = Math.min(sw / CANVAS_W, sh / CANVAS_H);

    const inner = document.createElement('div');
    inner.style.position = 'absolute';
    inner.style.left = '50%';
    inner.style.top = '50%';
    inner.style.width = CANVAS_W + 'px';
    inner.style.height = CANVAS_H + 'px';
    inner.style.transform = 'translate(-50%, -50%) scale(' + scale + ')';
    inner.style.transformOrigin = 'center center';

    slide.elements.forEach((el, i) => {
      const node = buildPresentElementNode(el);
      if (el.motion && el.motion !== 'none') {
        node.classList.add(el.motion);
        node.style.animationDelay = (i * 0.08) + 's';
      }
      if (el.hover && el.hover !== 'none') node.classList.add(el.hover);
      inner.appendChild(node);
    });
    stage.appendChild(inner);

    els.presentCounter.textContent = (presentIndex + 1) + ' / ' + state.slides.length;
  }

  function buildPresentElementNode(el) {
    const node = document.createElement('div');
    node.className = 'el ' + (el.type === 'text' ? 'text' : 'shape-' + el.type);
    node.style.left = el.x + 'px';
    node.style.top = el.y + 'px';
    node.style.width = el.w + 'px';
    node.style.height = el.h + 'px';
    if (el.type === 'text') {
      node.style.fontFamily = FONT_FAMILIES[el.font] || FONT_FAMILIES.sans;
      node.style.fontSize = el.fontSize + 'px';
      node.style.fontWeight = String(el.fontWeight);
      node.style.color = el.color;
      node.style.textAlign = el.align;
      node.style.display = 'flex';
      node.style.alignItems = 'center';
      const inner = document.createElement('div');
      inner.style.width = '100%';
      inner.textContent = el.text;
      node.appendChild(inner);
    } else {
      node.style.background = el.fill;
    }
    return node;
  }

  // ---------- Canvas fit ----------
  function fitCanvas() {
    const wrap = document.getElementById('canvasWrap');
    if (!wrap) return;
    const padding = 64;
    const sx = (wrap.clientWidth - padding) / CANVAS_W;
    const sy = (wrap.clientHeight - padding) / CANVAS_H;
    const scale = Math.max(0.2, Math.min(1, sx, sy));
    document.documentElement.style.setProperty('--canvas-scale', String(scale));
  }

  // ---------- Init ----------
  function init() {
    els.slidesList = document.getElementById('slidesList');
    els.slideCount = document.getElementById('slideCount');
    els.canvas = document.getElementById('canvas');
    els.propertiesBody = document.getElementById('propertiesBody');
    els.btnDeleteElement = document.getElementById('btnDeleteElement');
    els.presentOverlay = document.getElementById('presentOverlay');
    els.presentStage = document.getElementById('presentStage');
    els.presentCounter = document.getElementById('presentCounter');
    els.fileLoader = document.getElementById('fileLoader');

    document.getElementById('btnAddSlide').addEventListener('click', addSlide);
    document.getElementById('btnPresent').addEventListener('click', enterPresent);
    document.getElementById('btnSave').addEventListener('click', saveToFile);
    document.getElementById('btnLoad').addEventListener('click', () => els.fileLoader.click());
    els.fileLoader.addEventListener('change', (e) => {
      if (e.target.files[0]) loadFromFile(e.target.files[0]);
      e.target.value = '';
    });
    document.getElementById('btnPrev').addEventListener('click', prevPresent);
    document.getElementById('btnNext').addEventListener('click', nextPresent);
    document.getElementById('btnExitPresent').addEventListener('click', exitPresent);
    els.btnDeleteElement.addEventListener('click', deleteElement);

    document.querySelectorAll('[data-add]').forEach(b => {
      b.addEventListener('click', () => addElement(b.dataset.add));
    });

    els.canvas.addEventListener('mousedown', (e) => {
      if (e.target === els.canvas) deselectElement();
    });

    document.addEventListener('keydown', (e) => {
      if (!els.presentOverlay.hidden) return;
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if ((e.key === 'Delete' || e.key === 'Backspace') && state.selectedElementId) {
        e.preventDefault();
        deleteElement();
      } else if (e.key === 'Escape') {
        deselectElement();
      }
    });

    window.addEventListener('beforeunload', persist);
    window.addEventListener('resize', () => {
      fitCanvas();
      renderSlidesList();
      if (!els.presentOverlay.hidden) renderPresent();
    });
    fitCanvas();

    if (!restore() || !state.slides.length) {
      const intro = newSlide('title');
      const next = newSlide('titleBody');
      state.slides = [intro, next];
      state.currentSlideId = intro.id;
    }
    renderAll();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

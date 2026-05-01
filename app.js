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
__GOOGLE_FONTS_LINKS__
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
.el[data-link] { cursor: pointer; }
.el.linkcard { display:flex; background:#181818; border:1px solid #262626; border-radius:8px; overflow:hidden; }
.linkcard-image { flex:0 0 35%; background-size:cover; background-position:top center; background-repeat:no-repeat; background-color:#1f1f1f; }
.linkcard-meta { flex:1; padding:14px 18px; min-width:0; overflow:hidden; display:flex; flex-direction:column; justify-content:center; gap:4px; font-family:inherit; }
.linkcard-domain { font-size:11px; letter-spacing:0.06em; color:#9a9a9a; text-transform:uppercase; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.linkcard-title { font-size:16px; font-weight:600; color:#ededed; line-height:1.3; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
.linkcard-desc { font-size:13px; color:#9a9a9a; line-height:1.4; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
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
  function fontFamily(name){ return FF[name] || name || FF.sans; }
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
    canvas.style.backgroundColor=slide.bg||'#000';
    canvas.style.backgroundImage=slide.bgImage?'url("'+slide.bgImage+'")':'';
    canvas.style.backgroundSize='cover';
    canvas.style.backgroundPosition='center';
    canvas.innerHTML='';
    (slide.elements||[]).forEach(function(el,i){
      var node=document.createElement('div');
      var cls='el ';
      if(el.type==='text') cls+='text';
      else if(el.type==='image') cls+='image';
      else if(el.type==='video') cls+='video';
      else if(el.type==='linkcard') cls+='linkcard';
      else cls+='shape-'+el.type;
      node.className=cls;
      node.style.left=el.x+'px'; node.style.top=el.y+'px';
      node.style.width=el.w+'px'; node.style.height=el.h+'px';
      if(el.type==='text'){
        node.style.fontFamily=fontFamily(el.font);
        node.style.fontSize=el.fontSize+'px';
        node.style.fontWeight=String(el.fontWeight);
        node.style.letterSpacing=(el.letterSpacing||0)+'px';
        node.style.fontStretch=(el.fontStretch||100)+'%';
        node.style.color=el.color;
        node.style.textAlign=el.align;
        var inner=document.createElement('div');
        inner.textContent=el.text;
        node.appendChild(inner);
      } else if(el.type==='image'){
        var img=document.createElement('img');
        img.src=el.src||'';
        img.draggable=false;
        img.style.width='100%'; img.style.height='100%';
        img.style.objectFit=el.fit||'cover';
        img.style.display='block';
        node.appendChild(img);
      } else if(el.type==='video'){
        var vid=document.createElement('video');
        vid.src=el.src||'';
        vid.style.width='100%'; vid.style.height='100%';
        vid.style.objectFit=el.fit||'cover';
        vid.style.display='block';
        vid.playsInline=true;
        vid.muted=el.muted!==false;
        vid.loop=el.loop!==false;
        if(el.controls) vid.controls=true;
        if(el.autoplay!==false){ vid.autoplay=true; vid.muted=true; setTimeout(function(){ vid.play && vid.play().catch(function(){}); },0); }
        node.appendChild(vid);
      } else if(el.type==='linkcard'){
        if(el.image){
          var lcImg=document.createElement('div');
          lcImg.className='linkcard-image';
          lcImg.style.backgroundImage='url("'+el.image+'")';
          node.appendChild(lcImg);
        }
        var lcMeta=document.createElement('div');
        lcMeta.className='linkcard-meta';
        if(el.domain){ var lcDom=document.createElement('div'); lcDom.className='linkcard-domain'; lcDom.textContent=el.domain; lcMeta.appendChild(lcDom); }
        if(el.title){ var lcT=document.createElement('div'); lcT.className='linkcard-title'; lcT.textContent=el.title; lcMeta.appendChild(lcT); }
        if(el.description){ var lcD=document.createElement('div'); lcD.className='linkcard-desc'; lcD.textContent=el.description; lcMeta.appendChild(lcD); }
        node.appendChild(lcMeta);
      } else {
        node.style.background=el.fill;
      }
      if(el.motion&&el.motion!=='none'){node.classList.add(el.motion);node.style.animationDelay=(i*0.08)+'s';}
      if(el.hover&&el.hover!=='none') node.classList.add(el.hover);
      if(el.link) node.setAttribute('data-link',el.link);
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
    var linked=e.target.closest&&e.target.closest('[data-link]');
    if(linked){
      var u=linked.getAttribute('data-link');
      if(u){
        if(!/^https?:\\/\\//i.test(u)) u='https://'+u;
        // Modifier/middle click opens a new tab; plain click navigates in-place
        // so the browser back button returns to the current slide.
        if(e.ctrlKey||e.metaKey||e.shiftKey||e.button===1){
          window.open(u,'_blank','noopener');
        } else {
          location.href=u;
        }
      }
      e.stopPropagation();
      return;
    }
    if(e.target.closest('.hud')) return;
    if(e.target.tagName==='VIDEO' && e.target.controls) return;
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
      letterSpacing: 0,
      fontStretch: 100,
      color: '#ffffff',
      align: 'left',
      hover: 'none',
      motion: 'none',
      link: '',
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
      link: '',
    }, props);
  }

  function imageEl(src, props) {
    return Object.assign({
      id: uid('el'),
      type: 'image',
      x: 240, y: 160, w: 800, h: 400,
      src: src || '',
      fit: 'cover',
      hover: 'none',
      motion: 'none',
      link: '',
    }, props);
  }

  function videoEl(src, props) {
    return Object.assign({
      id: uid('el'),
      type: 'video',
      x: 240, y: 160, w: 800, h: 450,
      src: src || '',
      fit: 'cover',
      autoplay: true,
      loop: true,
      muted: true,
      controls: false,
      hover: 'none',
      motion: 'none',
      link: '',
    }, props);
  }

  function linkcardEl(url, props) {
    return Object.assign({
      id: uid('el'),
      type: 'linkcard',
      x: 280, y: 220, w: 720, h: 160,
      title: '',
      description: '',
      image: '',
      domain: '',
      hover: 'hover-lift',
      motion: 'none',
      link: url || '',
    }, props);
  }

  function normalizeUrl(url) {
    if (!url) return '';
    return /^[a-z][a-z0-9+.-]*:\/\//i.test(url) ? url : 'https://' + url;
  }

  function extractDomain(url) {
    if (!url) return '';
    try {
      return new URL(normalizeUrl(url)).hostname.replace(/^www\./i, '');
    } catch (e) {
      return '';
    }
  }

  // WordPress mShots — free, no API key, returns a live screenshot of the URL.
  // First request kicks off rendering and may return a placeholder; the
  // screenshot becomes available within ~10-30s and is then cached.
  function screenshotUrl(url, opts) {
    const target = normalizeUrl(url);
    if (!target) return '';
    let q = '?w=1024';
    if (opts && opts.bust) q += '&_=' + Date.now();
    return 'https://s0.wp.com/mshots/v1/' + encodeURIComponent(target) + q;
  }

  async function fetchLinkPreview(url, opts) {
    const target = normalizeUrl(url);
    if (!target) return null;
    let title = '', description = '';
    try {
      const resp = await fetch('https://api.microlink.io/?url=' + encodeURIComponent(target));
      if (resp.ok) {
        const json = await resp.json();
        if (json.status === 'success' && json.data) {
          title = json.data.title || '';
          description = json.data.description || '';
        }
      }
    } catch (e) { /* metadata fetch best-effort; screenshot still works */ }
    return {
      title: title,
      description: description,
      image: screenshotUrl(target, opts),
      domain: extractDomain(target),
    };
  }

  function fitToCanvas(natW, natH, maxW, maxH) {
    maxW = maxW || 880;
    maxH = maxH || 540;
    if (!natW || !natH) return { w: maxW, h: Math.round(maxW * 9 / 16) };
    const ratio = natW / natH;
    let w = maxW, h = maxW / ratio;
    if (h > maxH) { h = maxH; w = maxH * ratio; }
    return { w: Math.round(w), h: Math.round(h) };
  }

  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.onerror = () => reject(r.error || new Error('read error'));
      r.readAsDataURL(file);
    });
  }
  function readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.onerror = () => reject(r.error || new Error('read error'));
      r.readAsText(file);
    });
  }
  function loadImageMetadata(dataUrl) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
      img.onerror = () => resolve({ w: 0, h: 0 });
      img.src = dataUrl;
    });
  }
  function loadVideoMetadata(dataUrl) {
    return new Promise((resolve) => {
      const v = document.createElement('video');
      v.preload = 'metadata';
      v.muted = true;
      v.onloadedmetadata = () => resolve({ w: v.videoWidth, h: v.videoHeight, d: v.duration });
      v.onerror = () => resolve({ w: 0, h: 0, d: 0 });
      v.src = dataUrl;
    });
  }

  function newSlide(layout) {
    layout = layout || 'titleBody';
    return {
      id: uid('slide'),
      bg: '#0a0a0a',
      bgImage: '',
      layout: layout,
      elements: LAYOUTS[layout].elements(),
    };
  }

  // ---------- State ----------
  const state = {
    slides: [],
    currentSlideId: null,
    selectedElementId: null,
    editingElementId: null,
  };

  // Local fonts detected via Local Font Access API. Cached in localStorage.
  let localFonts = [];
  const FONT_CACHE_KEY = 'pres-gen-local-fonts-v1';

  // Curated Google Fonts catalog (Latin + Korean). Selecting one of these
  // injects a <link> tag at runtime; export HTML only includes the ones
  // actually referenced in slides.
  const GOOGLE_FONTS = [
    // Sans
    'Albert Sans', 'Be Vietnam Pro', 'DM Sans', 'IBM Plex Sans', 'Inter',
    'Karla', 'Lato', 'Manrope', 'Montserrat', 'Mulish', 'Nunito',
    'Open Sans', 'Outfit', 'Plus Jakarta Sans', 'Poppins', 'Public Sans',
    'Raleway', 'Roboto', 'Source Sans 3', 'Space Grotesk', 'Work Sans',
    // Serif
    'Bitter', 'Cormorant Garamond', 'Crimson Text', 'EB Garamond',
    'IBM Plex Serif', 'Libre Baskerville', 'Lora', 'Merriweather',
    'Playfair Display', 'PT Serif', 'Source Serif 4', 'Spectral',
    // Display
    'Anton', 'Archivo Black', 'Bebas Neue', 'Caveat', 'Dancing Script',
    'Lobster', 'Oswald', 'Pacifico', 'Permanent Marker', 'Righteous',
    // Mono
    'Fira Code', 'IBM Plex Mono', 'Inconsolata', 'JetBrains Mono',
    'Roboto Mono', 'Source Code Pro', 'Space Mono',
    // Korean
    'Black Han Sans', 'Cute Font', 'Diphylleia', 'Do Hyeon', 'Dokdo',
    'East Sea Dokdo', 'Gaegu', 'Gowun Batang', 'Gowun Dodum', 'Gugi',
    'Hahmlet', 'Hi Melody', 'IBM Plex Sans KR', 'Jua', 'Nanum Gothic',
    'Nanum Myeongjo', 'Nanum Pen Script', 'Noto Sans KR', 'Noto Serif KR',
    'Poor Story', 'Single Day', 'Stylish', 'Sunflower', 'Yeon Sung',
  ];
  const GOOGLE_FONT_SET = new Set(GOOGLE_FONTS);
  const GOOGLE_FONTS_USED_KEY = 'pres-gen-gfonts-used-v1';
  let googleFontsUsed = new Set();
  let googleFontsBundleLoaded = false;

  function googleFontsBundleHref(families) {
    const list = families.map(f => 'family=' + f.replace(/\s+/g, '+') + ':wght@300;400;500;600;700');
    return 'https://fonts.googleapis.com/css2?' + list.join('&') + '&display=swap';
  }

  function injectGoogleFontLink(family) {
    const id = 'gfont-' + family.replace(/\s+/g, '_');
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = googleFontsBundleHref([family]);
    document.head.appendChild(link);
  }

  function loadGoogleFont(family) {
    if (!GOOGLE_FONT_SET.has(family)) return;
    if (!googleFontsUsed.has(family)) {
      googleFontsUsed.add(family);
      saveGoogleFontsUsedCache();
    }
    injectGoogleFontLink(family);
  }

  function loadGoogleFontsUsedCache() {
    try {
      const raw = localStorage.getItem(GOOGLE_FONTS_USED_KEY);
      if (!raw) return new Set();
      const arr = JSON.parse(raw);
      return new Set(Array.isArray(arr) ? arr : []);
    } catch (e) { return new Set(); }
  }
  function saveGoogleFontsUsedCache() {
    try {
      localStorage.setItem(GOOGLE_FONTS_USED_KEY, JSON.stringify([...googleFontsUsed]));
    } catch (e) {}
  }

  function rehydrateUsedGoogleFonts() {
    googleFontsUsed.forEach(f => injectGoogleFontLink(f));
  }

  function preloadAllGoogleFontsForPreview() {
    if (googleFontsBundleLoaded) return;
    googleFontsBundleLoaded = true;
    const id = 'gfont-preview-bundle';
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = googleFontsBundleHref(GOOGLE_FONTS);
    document.head.appendChild(link);
  }

  function loadLocalFontsCache() {
    try {
      const raw = localStorage.getItem(FONT_CACHE_KEY);
      if (!raw) return [];
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch (e) { return []; }
  }
  function saveLocalFontsCache(list) {
    try { localStorage.setItem(FONT_CACHE_KEY, JSON.stringify(list)); } catch (e) {}
  }

  async function detectLocalFonts() {
    if (typeof window.queryLocalFonts !== 'function') {
      alert('이 브라우저는 Local Font Access API를 지원하지 않습니다.\n폰트 이름을 직접 입력해 주세요. (Chrome/Edge 103+ 권장)');
      return null;
    }
    try {
      const fonts = await window.queryLocalFonts();
      const seen = new Set();
      const families = [];
      fonts.forEach(f => {
        if (f && f.family && !seen.has(f.family)) {
          seen.add(f.family);
          families.push(f.family);
        }
      });
      families.sort((a, b) => a.localeCompare(b));
      return families;
    } catch (e) {
      alert('폰트 접근 권한이 거부되었거나 오류가 발생했습니다: ' + (e.message || e.name));
      return null;
    }
  }

  function resolveFontFamily(font) {
    if (!font) return FONT_FAMILIES.sans;
    if (FONT_FAMILIES[font]) return FONT_FAMILIES[font];
    return font;
  }

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
      inner.style.backgroundColor = slide.bg;
      if (slide.bgImage) {
        inner.style.backgroundImage = 'url("' + slide.bgImage + '")';
        inner.style.backgroundSize = 'cover';
        inner.style.backgroundPosition = 'center';
      }
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
    els.canvas.style.backgroundColor = slide.bg;
    els.canvas.style.backgroundImage = slide.bgImage ? 'url("' + slide.bgImage + '")' : '';
    els.canvas.style.backgroundSize = 'cover';
    els.canvas.style.backgroundPosition = 'center';
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
      node.style.fontFamily = resolveFontFamily(el.font);
      node.style.fontSize = el.fontSize + 'px';
      node.style.fontWeight = String(el.fontWeight);
      node.style.letterSpacing = (el.letterSpacing || 0) + 'px';
      node.style.fontStretch = (el.fontStretch || 100) + '%';
      node.style.color = el.color;
      node.style.textAlign = el.align;
      node.style.display = 'flex';
      node.style.alignItems = 'center';
      const inner = document.createElement('div');
      inner.style.width = '100%';
      inner.textContent = el.text;
      const isEditing = !preview && state.editingElementId === el.id;
      if (isEditing) {
        node.classList.add('editing');
        inner.contentEditable = 'true';
        inner.spellcheck = false;
        inner.setAttribute('data-edit-id', el.id);
        inner.style.outline = 'none';
        inner.style.cursor = 'text';
        inner.style.userSelect = 'text';
        inner.style.whiteSpace = 'pre-wrap';
        setTimeout(() => {
          inner.focus();
          const range = document.createRange();
          range.selectNodeContents(inner);
          const sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
        }, 0);
        inner.addEventListener('input', () => {
          el.text = inner.innerText;
          renderSlidesList();
        });
        inner.addEventListener('blur', () => {
          if (state.editingElementId !== el.id) return;
          state.editingElementId = null;
          renderCanvas();
          renderProperties();
          persist();
        });
        inner.addEventListener('keydown', (ke) => {
          ke.stopPropagation();
          if (ke.key === 'Escape') {
            ke.preventDefault();
            inner.blur();
          }
        });
        inner.addEventListener('paste', (pe) => {
          pe.preventDefault();
          const text = (pe.clipboardData || window.clipboardData).getData('text/plain');
          document.execCommand('insertText', false, text);
        });
      } else {
        inner.style.pointerEvents = 'none';
      }
      node.appendChild(inner);
    } else if (el.type === 'image') {
      const img = document.createElement('img');
      img.src = el.src || '';
      img.draggable = false;
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.objectFit = el.fit || 'cover';
      img.style.display = 'block';
      img.style.pointerEvents = 'none';
      img.style.userSelect = 'none';
      node.appendChild(img);
    } else if (el.type === 'video') {
      const v = document.createElement('video');
      v.src = el.src || '';
      v.muted = true;
      v.preload = 'metadata';
      v.playsInline = true;
      v.style.width = '100%';
      v.style.height = '100%';
      v.style.objectFit = el.fit || 'cover';
      v.style.display = 'block';
      v.style.pointerEvents = 'none';
      v.addEventListener('loadedmetadata', () => { try { v.currentTime = 0.05; } catch (e) {} });
      node.appendChild(v);
    } else if (el.type === 'linkcard') {
      buildLinkcardChildren(node, el);
    } else {
      node.style.background = el.fill;
    }

    if (el.link) node.setAttribute('data-link', el.link);

    if (!preview) {
      const handle = document.createElement('div');
      handle.className = 'resize-handle';
      handle.addEventListener('mousedown', (e) => beginResize(e, el.id));
      node.appendChild(handle);

      node.addEventListener('mousedown', (e) => {
        if (state.editingElementId === el.id) return;
        if (state.editingElementId) {
          state.editingElementId = null;
        }
        if (e.target.classList.contains('resize-handle')) return;
        selectElement(el.id);
        beginDrag(e, el.id);
      });

      if (el.type === 'text') {
        node.addEventListener('dblclick', (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (state.editingElementId === el.id) return;
          state.editingElementId = el.id;
          state.selectedElementId = el.id;
          renderCanvas();
          renderProperties();
        });
      }
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

  function buildLinkcardChildren(node, el) {
    if (el.image) {
      const imgDiv = document.createElement('div');
      imgDiv.className = 'linkcard-image';
      imgDiv.style.backgroundImage = 'url("' + el.image + '")';
      node.appendChild(imgDiv);
    }
    const meta = document.createElement('div');
    meta.className = 'linkcard-meta';
    if (el.domain) {
      const d = document.createElement('div');
      d.className = 'linkcard-domain';
      d.textContent = el.domain;
      meta.appendChild(d);
    }
    if (el.title) {
      const t = document.createElement('div');
      t.className = 'linkcard-title';
      t.textContent = el.title;
      meta.appendChild(t);
    }
    if (el.description) {
      const dsc = document.createElement('div');
      dsc.className = 'linkcard-desc';
      dsc.textContent = el.description;
      meta.appendChild(dsc);
    }
    node.appendChild(meta);
  }

  function buildFontPicker(el) {
    const PRESETS = ['sans', 'serif', 'mono', 'display'];
    const wrap = document.createElement('span');
    wrap.style.display = 'flex';
    wrap.style.flex = '1';
    wrap.style.gap = '6px';

    const inputWrap = document.createElement('div');
    inputWrap.className = 'font-input-wrap';

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'prop-input';
    input.value = el.font;
    input.placeholder = '클릭하여 폰트 선택';
    input.autocomplete = 'off';
    input.spellcheck = false;

    const popup = document.createElement('div');
    popup.className = 'font-popup';
    popup.hidden = true;
    document.body.appendChild(popup);

    function rebuildPopup(filter) {
      popup.innerHTML = '';
      const f = (filter || '').toLowerCase().trim();
      const presetMatches = PRESETS.filter(n => !f || n.toLowerCase().includes(f));
      const localMatches = localFonts.filter(n => !f || n.toLowerCase().includes(f));
      const googleMatches = GOOGLE_FONTS.filter(n => !f || n.toLowerCase().includes(f));
      let activeItem = null;

      function appendSection(title, names, opts) {
        if (!names.length) return;
        const head = document.createElement('div');
        head.className = 'font-popup-section';
        head.textContent = title;
        popup.appendChild(head);
        names.forEach(name => {
          const item = makeItem(name, opts);
          if (name === el.font) { item.classList.add('active'); activeItem = item; }
          popup.appendChild(item);
        });
      }

      appendSection('Presets', presetMatches);
      if (localMatches.length) {
        appendSection('Local fonts (' + localMatches.length + ')', localMatches);
      }
      if (googleMatches.length) {
        appendSection('Google Fonts (' + googleMatches.length + ')', googleMatches, { google: true });
      }

      if (!presetMatches.length && !localMatches.length && !googleMatches.length) {
        const empty = document.createElement('div');
        empty.className = 'font-popup-empty';
        empty.textContent = '일치하는 폰트 없음';
        popup.appendChild(empty);
      }
      if (activeItem) {
        requestAnimationFrame(() => {
          activeItem.scrollIntoView({ block: 'nearest' });
        });
      }
    }

    function makeItem(name, opts) {
      opts = opts || {};
      const item = document.createElement('div');
      item.className = 'font-popup-item';
      item.title = name;
      item.style.fontFamily = resolveFontFamily(name);

      const label = document.createElement('span');
      label.textContent = name;
      item.appendChild(label);

      if (opts.google) {
        const tag = document.createElement('span');
        tag.className = 'font-popup-badge';
        tag.textContent = 'G';
        item.appendChild(tag);
      }

      item.addEventListener('mousedown', (e) => {
        e.preventDefault();
        if (opts.google) loadGoogleFont(name);
        input.value = name;
        hidePopup();
        updateElement(el.id, { font: name });
      });
      return item;
    }

    function positionPopup() {
      const rect = input.getBoundingClientRect();
      popup.style.left = rect.left + 'px';
      popup.style.top = (rect.bottom + 4) + 'px';
      popup.style.width = rect.width + 'px';
    }

    function showPopup() {
      preloadAllGoogleFontsForPreview();
      rebuildPopup(input.value);
      positionPopup();
      popup.hidden = false;
      const propsBody = document.getElementById('propertiesBody');
      if (propsBody) propsBody.addEventListener('scroll', hidePopup, { once: true, passive: true });
      window.addEventListener('resize', hidePopup, { once: true });
    }

    function hidePopup() {
      popup.hidden = true;
    }

    function destroyPopup() {
      if (popup.parentNode) popup.parentNode.removeChild(popup);
    }

    input.addEventListener('focus', showPopup);
    input.addEventListener('mousedown', () => {
      if (popup.hidden) setTimeout(showPopup, 0);
    });
    input.addEventListener('input', () => {
      if (popup.hidden) showPopup();
      else rebuildPopup(input.value);
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { hidePopup(); input.blur(); }
      else if (e.key === 'Enter') {
        e.preventDefault();
        const v = input.value.trim() || 'sans';
        hidePopup();
        updateElement(el.id, { font: v });
      }
    });
    input.addEventListener('blur', () => setTimeout(hidePopup, 150));

    // Detach popup when its anchor is removed from DOM
    const observer = new MutationObserver(() => {
      if (!document.body.contains(input)) {
        destroyPopup();
        observer.disconnect();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    inputWrap.appendChild(input);
    wrap.appendChild(inputWrap);

    const detectBtn = document.createElement('button');
    detectBtn.className = 'pill';
    detectBtn.title = '내 PC에 설치된 폰트 가져오기';
    detectBtn.textContent = localFonts.length ? 'Refresh' : 'Find';
    detectBtn.style.flex = '0 0 auto';
    detectBtn.addEventListener('click', async () => {
      const original = detectBtn.textContent;
      detectBtn.disabled = true;
      detectBtn.textContent = '...';
      const list = await detectLocalFonts();
      detectBtn.disabled = false;
      if (list && list.length) {
        localFonts = list;
        saveLocalFontsCache(localFonts);
        alert(list.length + '개 폰트를 가져왔습니다. Font 입력란을 클릭하면 목록이 펼쳐집니다.');
        renderProperties();
      } else {
        detectBtn.textContent = original;
      }
    });
    wrap.appendChild(detectBtn);
    return wrap;
  }

  function triggerImageUpload(slideId) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.style.display = 'none';
    input.addEventListener('change', () => {
      const file = input.files && input.files[0];
      if (!file) return;
      if (file.size > 8 * 1024 * 1024) {
        if (!confirm('이미지 크기가 ' + (file.size / 1024 / 1024).toFixed(1) + 'MB 입니다. 추출 파일이 매우 커집니다. 계속할까요?')) {
          return;
        }
      }
      const reader = new FileReader();
      reader.onload = () => {
        const slide = state.slides.find(s => s.id === slideId);
        if (!slide) return;
        slide.bgImage = String(reader.result);
        renderAll();
      };
      reader.readAsDataURL(file);
    });
    document.body.appendChild(input);
    input.click();
    setTimeout(() => document.body.removeChild(input), 0);
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

    // Background color
    const bg = section('Background');
    const bgRow = row('Color');
    bgRow.appendChild(colorInput(slide.bg, v => {
      slide.bg = v;
      renderCanvas();
      renderSlidesList();
      persist();
    }));
    bg.appendChild(bgRow);

    // Background image
    const bgImgRow = row('Image');
    const imgBtns = document.createElement('div');
    imgBtns.className = 'image-upload-row';
    const uploadBtn = document.createElement('button');
    uploadBtn.className = 'pill';
    uploadBtn.textContent = slide.bgImage ? 'Replace' : 'Upload';
    uploadBtn.addEventListener('click', () => triggerImageUpload(slide.id));
    imgBtns.appendChild(uploadBtn);
    if (slide.bgImage) {
      const clearBtn = document.createElement('button');
      clearBtn.className = 'pill';
      clearBtn.textContent = 'Clear';
      clearBtn.addEventListener('click', () => {
        slide.bgImage = '';
        renderAll();
      });
      imgBtns.appendChild(clearBtn);
    }
    bgImgRow.appendChild(imgBtns);
    bg.appendChild(bgImgRow);
    if (slide.bgImage) {
      const preview = document.createElement('div');
      preview.className = 'bg-image-preview';
      preview.style.backgroundImage = 'url("' + slide.bgImage + '")';
      bg.appendChild(preview);
    }
    frag.appendChild(bg);

    // Add element
    const add = section('Add element');
    const addPills = document.createElement('div');
    addPills.className = 'pill-group';
    [['Text', 'text'], ['Rectangle', 'rect'], ['Circle', 'circle'], ['Image', 'image'], ['Video', 'video'], ['Link Card', 'linkcard']].forEach(opt => {
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
      fr.appendChild(buildFontPicker(el));
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

      // Letter spacing (자간)
      const lsR = row('Tracking');
      const lsRange = document.createElement('input');
      lsRange.type = 'range';
      lsRange.className = 'prop-range';
      lsRange.min = '-5';
      lsRange.max = '30';
      lsRange.step = '0.1';
      const lsCurrent = el.letterSpacing || 0;
      lsRange.value = lsCurrent;
      const lsVal = document.createElement('span');
      lsVal.className = 'prop-value';
      lsVal.textContent = lsCurrent.toFixed(1) + 'px';
      lsRange.addEventListener('input', () => {
        const v = parseFloat(lsRange.value);
        lsVal.textContent = v.toFixed(1) + 'px';
        updateElement(el.id, { letterSpacing: v }, { skipPropsRender: true });
      });
      lsR.appendChild(lsRange);
      lsR.appendChild(lsVal);
      t.appendChild(lsR);

      // Font stretch / character width (글자 폭)
      const fsR = row('Width');
      const fsRange = document.createElement('input');
      fsRange.type = 'range';
      fsRange.className = 'prop-range';
      fsRange.min = '50';
      fsRange.max = '200';
      fsRange.step = '1';
      const fsCurrent = el.fontStretch || 100;
      fsRange.value = fsCurrent;
      const fsVal = document.createElement('span');
      fsVal.className = 'prop-value';
      fsVal.textContent = fsCurrent + '%';
      fsRange.addEventListener('input', () => {
        const v = parseInt(fsRange.value, 10);
        fsVal.textContent = v + '%';
        updateElement(el.id, { fontStretch: v }, { skipPropsRender: true });
      });
      fsR.appendChild(fsRange);
      fsR.appendChild(fsVal);
      t.appendChild(fsR);

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

      const colr = row('Text color');
      colr.appendChild(colorInput(el.color, v => updateElement(el.id, { color: v }, { skipPropsRender: true })));
      t.appendChild(colr);

      frag.appendChild(t);
    } else if (el.type === 'image') {
      const s = section('Image');
      const fitR = row('Fit');
      const fitPills = document.createElement('div');
      fitPills.className = 'pill-group';
      ['cover', 'contain', 'fill'].forEach(f => {
        const p = document.createElement('button');
        p.className = 'pill' + ((el.fit || 'cover') === f ? ' active' : '');
        p.textContent = f;
        p.addEventListener('click', () => updateElement(el.id, { fit: f }));
        fitPills.appendChild(p);
      });
      fitR.appendChild(fitPills);
      s.appendChild(fitR);
      const repR = row('');
      const repBtn = document.createElement('button');
      repBtn.className = 'pill';
      repBtn.textContent = 'Replace image';
      repBtn.addEventListener('click', () => replaceElementMedia(el.id, 'image'));
      repR.appendChild(repBtn);
      s.appendChild(repR);
      frag.appendChild(s);
    } else if (el.type === 'linkcard') {
      const s = section('Link card');

      const ur = row('URL');
      const urlInput = document.createElement('input');
      urlInput.type = 'url';
      urlInput.className = 'prop-input';
      urlInput.placeholder = 'https://...';
      urlInput.value = el.link || '';
      urlInput.addEventListener('change', () => {
        const v = urlInput.value.trim();
        updateElement(el.id, { link: v, domain: el.domain || extractDomain(v) });
      });
      ur.appendChild(urlInput);
      s.appendChild(ur);

      const fetchR = row('');
      const fetchBtn = document.createElement('button');
      fetchBtn.className = 'pill';
      fetchBtn.textContent = el.title ? 'Refresh metadata' : 'Fetch metadata';
      fetchBtn.addEventListener('click', async () => {
        if (!el.link) { alert('URL을 먼저 입력해 주세요.'); return; }
        const original = fetchBtn.textContent;
        fetchBtn.disabled = true;
        fetchBtn.textContent = '...';
        const data = await fetchLinkPreview(el.link, { bust: true });
        fetchBtn.disabled = false;
        if (data) {
          el.title = data.title || el.title;
          el.description = data.description || el.description;
          el.image = data.image || '';
          el.domain = data.domain || extractDomain(el.link);
          renderAll();
        } else {
          fetchBtn.textContent = original;
          alert('미리보기를 가져오지 못했습니다.');
        }
      });
      fetchR.appendChild(fetchBtn);
      s.appendChild(fetchR);

      const tr = row('Title');
      const titleInput = document.createElement('input');
      titleInput.type = 'text';
      titleInput.className = 'prop-input';
      titleInput.value = el.title || '';
      titleInput.addEventListener('input', () => updateElement(el.id, { title: titleInput.value }, { skipPropsRender: true }));
      tr.appendChild(titleInput);
      s.appendChild(tr);

      const dr = row('Desc');
      const descInput = document.createElement('textarea');
      descInput.className = 'prop-textarea';
      descInput.value = el.description || '';
      descInput.addEventListener('input', () => updateElement(el.id, { description: descInput.value }, { skipPropsRender: true }));
      dr.appendChild(descInput);
      s.appendChild(dr);

      const domR = row('Domain');
      const domInput = document.createElement('input');
      domInput.type = 'text';
      domInput.className = 'prop-input';
      domInput.value = el.domain || '';
      domInput.addEventListener('input', () => updateElement(el.id, { domain: domInput.value }, { skipPropsRender: true }));
      domR.appendChild(domInput);
      s.appendChild(domR);

      const imgR = row('Image URL');
      const imgInput = document.createElement('input');
      imgInput.type = 'url';
      imgInput.className = 'prop-input';
      imgInput.value = el.image || '';
      imgInput.placeholder = 'https://... or upload';
      imgInput.addEventListener('change', () => updateElement(el.id, { image: imgInput.value.trim() }));
      imgR.appendChild(imgInput);
      s.appendChild(imgR);

      const upR = row('');
      const upBtns = document.createElement('div');
      upBtns.className = 'image-upload-row';
      const upBtn = document.createElement('button');
      upBtn.className = 'pill';
      upBtn.textContent = el.image ? 'Replace image' : 'Upload image';
      upBtn.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.style.display = 'none';
        input.addEventListener('change', async () => {
          const file = input.files && input.files[0];
          if (!file) return;
          const dataUrl = await readFileAsDataUrl(file);
          updateElement(el.id, { image: dataUrl });
        });
        document.body.appendChild(input);
        input.click();
        setTimeout(() => document.body.removeChild(input), 0);
      });
      upBtns.appendChild(upBtn);
      if (el.image) {
        const clearBtn = document.createElement('button');
        clearBtn.className = 'pill';
        clearBtn.textContent = 'Clear';
        clearBtn.addEventListener('click', () => updateElement(el.id, { image: '' }));
        upBtns.appendChild(clearBtn);
      }
      upR.appendChild(upBtns);
      s.appendChild(upR);

      if (el.image) {
        const preview = document.createElement('div');
        preview.className = 'bg-image-preview';
        preview.style.backgroundImage = 'url("' + el.image + '")';
        s.appendChild(preview);
      }

      frag.appendChild(s);
    } else if (el.type === 'video') {
      const s = section('Video');
      const fitR = row('Fit');
      const fitPills = document.createElement('div');
      fitPills.className = 'pill-group';
      ['cover', 'contain', 'fill'].forEach(f => {
        const p = document.createElement('button');
        p.className = 'pill' + ((el.fit || 'cover') === f ? ' active' : '');
        p.textContent = f;
        p.addEventListener('click', () => updateElement(el.id, { fit: f }));
        fitPills.appendChild(p);
      });
      fitR.appendChild(fitPills);
      s.appendChild(fitR);

      const togglesR = document.createElement('div');
      togglesR.className = 'prop-row';
      togglesR.style.flexDirection = 'column';
      togglesR.style.alignItems = 'stretch';
      togglesR.style.gap = '4px';
      [
        ['autoplay', 'Autoplay'],
        ['loop', 'Loop'],
        ['muted', 'Muted'],
        ['controls', 'Show controls'],
      ].forEach(([key, label]) => {
        const lbl = document.createElement('label');
        lbl.style.display = 'flex';
        lbl.style.alignItems = 'center';
        lbl.style.gap = '8px';
        lbl.style.cursor = 'pointer';
        lbl.style.color = 'var(--text)';
        lbl.style.fontSize = '12px';
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.checked = !!el[key];
        cb.addEventListener('change', () => {
          const patch = {};
          patch[key] = cb.checked;
          updateElement(el.id, patch);
        });
        lbl.appendChild(cb);
        lbl.appendChild(document.createTextNode(label));
        togglesR.appendChild(lbl);
      });
      s.appendChild(togglesR);

      const repR = row('');
      const repBtn = document.createElement('button');
      repBtn.className = 'pill';
      repBtn.textContent = 'Replace video';
      repBtn.addEventListener('click', () => replaceElementMedia(el.id, 'video'));
      repR.appendChild(repBtn);
      s.appendChild(repR);
      frag.appendChild(s);
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

    if (el.type !== 'linkcard') {
      const lr = row('Link');
      const linkInput = document.createElement('input');
      linkInput.type = 'url';
      linkInput.className = 'prop-input';
      linkInput.placeholder = 'https://...';
      linkInput.value = el.link || '';
      linkInput.addEventListener('change', () => {
        updateElement(el.id, { link: linkInput.value.trim() }, { skipPropsRender: true });
      });
      lr.appendChild(linkInput);
      ix.appendChild(lr);
    }

    const hint = document.createElement('div');
    hint.style.fontSize = '11px';
    hint.style.color = 'var(--text-faint)';
    hint.style.marginTop = '6px';
    hint.textContent = 'Effects/links play in Present mode and the exported HTML.';
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
    if (type === 'image') return triggerMediaInsert('image');
    if (type === 'video') return triggerMediaInsert('video');
    if (type === 'linkcard') return triggerLinkCardInsert();
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

  function triggerMediaInsert(kind) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = kind === 'image' ? 'image/*' : 'video/*';
    input.style.display = 'none';
    input.addEventListener('change', async () => {
      const file = input.files && input.files[0];
      if (file) {
        if (kind === 'image') await insertImageFile(file);
        else await insertVideoFile(file);
      }
    });
    document.body.appendChild(input);
    input.click();
    setTimeout(() => document.body.removeChild(input), 0);
  }

  async function insertImageFile(file) {
    if (file.size > 10 * 1024 * 1024) {
      if (!confirm((file.size / 1048576).toFixed(1) + 'MB 이미지입니다. 저장 파일이 매우 커집니다. 계속할까요?')) return;
    }
    const dataUrl = await readFileAsDataUrl(file);
    const meta = await loadImageMetadata(dataUrl);
    const slide = getCurrentSlide();
    if (!slide) return;
    const fit = fitToCanvas(meta.w, meta.h);
    const el = imageEl(dataUrl, {
      x: Math.round((CANVAS_W - fit.w) / 2),
      y: Math.round((CANVAS_H - fit.h) / 2),
      w: fit.w, h: fit.h,
    });
    slide.elements.push(el);
    state.selectedElementId = el.id;
    renderAll();
  }

  async function insertVideoFile(file) {
    if (file.size > 30 * 1024 * 1024) {
      if (!confirm((file.size / 1048576).toFixed(1) + 'MB 영상입니다. 저장 파일이 매우 커집니다. 계속할까요?')) return;
    }
    const dataUrl = await readFileAsDataUrl(file);
    const meta = await loadVideoMetadata(dataUrl);
    const slide = getCurrentSlide();
    if (!slide) return;
    const fit = fitToCanvas(meta.w || 1280, meta.h || 720);
    const el = videoEl(dataUrl, {
      x: Math.round((CANVAS_W - fit.w) / 2),
      y: Math.round((CANVAS_H - fit.h) / 2),
      w: fit.w, h: fit.h,
    });
    slide.elements.push(el);
    state.selectedElementId = el.id;
    renderAll();
  }

  async function insertUrlFromText(text) {
    const slide = getCurrentSlide();
    if (!slide) return false;
    const m1 = text.match(/^URL=(.+)$/im);
    const m2 = text.match(/<string>\s*(https?:\/\/[^<\s]+)\s*<\/string>/i);
    const m3 = text.match(/(https?:\/\/[^\s"'<>]+)/i);
    const url = (m1 && m1[1].trim()) || (m2 && m2[1].trim()) || (m3 && m3[1].trim()) || '';
    if (!url) return false;
    const el = textEl({
      x: 200, y: 320, w: 880, h: 80,
      text: url,
      fontSize: 28, color: '#9cd0ff', align: 'center',
      hover: 'hover-glow',
      link: url,
    });
    slide.elements.push(el);
    state.selectedElementId = el.id;
    renderAll();
    return true;
  }

  async function triggerLinkCardInsert() {
    const slide = getCurrentSlide();
    if (!slide) return;
    let url = prompt('링크 URL을 입력하세요:', 'https://');
    if (url == null) return;
    url = url.trim();
    if (url === 'https://' || url === 'http://') url = '';

    const el = linkcardEl(url, {
      title: url ? 'Loading...' : 'New link card',
      description: url || '',
      domain: extractDomain(url),
    });
    slide.elements.push(el);
    state.selectedElementId = el.id;
    renderAll();
    if (!url) return;

    const data = await fetchLinkPreview(url);
    const slideStill = state.slides.find(s => s.id === slide.id);
    if (!slideStill || !slideStill.elements.find(e => e.id === el.id)) return;
    if (data) {
      el.title = data.title || '';
      el.description = data.description || '';
      el.image = data.image || '';
      el.domain = data.domain || extractDomain(url);
    } else {
      el.title = '';
      el.description = '';
      el.domain = extractDomain(url);
      el.image = screenshotUrl(url);
    }
    renderAll();

    // Re-fetch the screenshot once after mShots has had time to render the
    // real capture (it may serve a placeholder on first hit).
    setTimeout(() => {
      const slideStill2 = state.slides.find(s => s.id === slide.id);
      if (!slideStill2) return;
      const elStill = slideStill2.elements.find(e => e.id === el.id);
      if (!elStill || !elStill.link) return;
      // Only auto-refresh if the user has not replaced the image manually
      if (elStill.image && elStill.image.indexOf('mshots/v1/') !== -1) {
        elStill.image = screenshotUrl(elStill.link, { bust: true });
        renderAll();
      }
    }, 15000);
  }

  async function replaceElementMedia(elId, kind) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = kind === 'image' ? 'image/*' : 'video/*';
    input.style.display = 'none';
    input.addEventListener('change', async () => {
      const file = input.files && input.files[0];
      if (!file) return;
      const slide = getCurrentSlide();
      if (!slide) return;
      const el = slide.elements.find(e => e.id === elId);
      if (!el) return;
      const dataUrl = await readFileAsDataUrl(file);
      el.src = dataUrl;
      renderAll();
    });
    document.body.appendChild(input);
    input.click();
    setTimeout(() => document.body.removeChild(input), 0);
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
    // Collect Google fonts actually referenced in slides
    const usedGoogle = new Set();
    state.slides.forEach(s => {
      (s.elements || []).forEach(el => {
        if (el.font && GOOGLE_FONT_SET.has(el.font)) usedGoogle.add(el.font);
      });
    });
    let linksHtml = '';
    if (usedGoogle.size) {
      const families = [...usedGoogle].sort();
      const href = googleFontsBundleHref(families);
      linksHtml =
        '<link rel="preconnect" href="https://fonts.googleapis.com">\n' +
        '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n' +
        '<link rel="stylesheet" href="' + href + '">';
    }
    const safeJson = JSON.stringify(state.slides).replace(/</g, '\\u003c');
    const html = EXPORT_TEMPLATE
      .replace('__GOOGLE_FONTS_LINKS__', () => linksHtml)
      .replace('__SLIDES_JSON__', () => safeJson);
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

  async function loadFromFile(file) {
    if (!file) return;
    const name = (file.name || '').toLowerCase();
    const mime = file.type || '';
    try {
      // Project file: HTML or JSON
      if (/\.html?$/.test(name) || mime === 'text/html') {
        const text = await readFileAsText(file);
        return loadProjectFromHtml(text);
      }
      if (/\.json$/.test(name) || mime === 'application/json') {
        const text = await readFileAsText(file);
        return loadProjectFromJson(text);
      }
      // Image
      if (mime.startsWith('image/') || /\.(png|jpe?g|gif|webp|svg|bmp|avif)$/.test(name)) {
        return insertImageFile(file);
      }
      // Video
      if (mime.startsWith('video/') || /\.(mp4|webm|mov|m4v|ogv|mkv)$/.test(name)) {
        return insertVideoFile(file);
      }
      // URL shortcut files (Windows .url, macOS .webloc) and plain text with URL
      if (/\.(url|webloc|txt)$/.test(name) || mime === 'text/plain') {
        const text = await readFileAsText(file);
        const ok = await insertUrlFromText(text);
        if (!ok) alert('파일에서 URL을 찾지 못했습니다.');
        return;
      }
      // Last resort: try as text and look for URL or JSON
      const text = await readFileAsText(file);
      if (/^\s*[{\[]/.test(text)) {
        return loadProjectFromJson(text);
      }
      if (/<!DOCTYPE/i.test(text.slice(0, 200))) {
        return loadProjectFromHtml(text);
      }
      const ok = await insertUrlFromText(text);
      if (!ok) alert('지원하지 않는 파일 형식입니다.');
    } catch (e) {
      alert('파일을 불러오지 못했습니다: ' + (e && e.message ? e.message : 'unknown error'));
    }
  }

  function loadProjectFromHtml(text) {
    const m = text.match(/<script id="data" type="application\/json">([\s\S]*?)<\/script>/);
    if (!m) throw new Error('내장 슬라이드 데이터를 찾을 수 없습니다');
    applyLoadedSlides(JSON.parse(m[1]));
  }
  function loadProjectFromJson(text) {
    const data = JSON.parse(text);
    const slides = Array.isArray(data) ? data : data.slides;
    if (!Array.isArray(slides)) throw new Error('Invalid slide data');
    applyLoadedSlides(slides);
  }
  function applyLoadedSlides(slides) {
    state.slides = slides;
    state.currentSlideId = slides.length ? slides[0].id : null;
    state.selectedElementId = null;
    state.slides.forEach(s => {
      if (typeof s.bgImage !== 'string') s.bgImage = '';
      (s.elements || []).forEach(el => {
        if (typeof el.link !== 'string') el.link = '';
        if (el.type === 'text') {
          if (typeof el.letterSpacing !== 'number') el.letterSpacing = 0;
          if (typeof el.fontStretch !== 'number') el.fontStretch = 100;
        }
        if (el.type === 'linkcard') {
          if (typeof el.title !== 'string') el.title = '';
          if (typeof el.description !== 'string') el.description = '';
          if (typeof el.image !== 'string') el.image = '';
          if (typeof el.domain !== 'string') el.domain = extractDomain(el.link || '');
        }
        if (el.font && GOOGLE_FONT_SET.has(el.font)) loadGoogleFont(el.font);
      });
    });
    renderAll();
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
    stage.style.backgroundColor = slide.bg;
    stage.style.backgroundImage = slide.bgImage ? 'url("' + slide.bgImage + '")' : '';
    stage.style.backgroundSize = 'cover';
    stage.style.backgroundPosition = 'center';

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
      node.style.fontFamily = resolveFontFamily(el.font);
      node.style.fontSize = el.fontSize + 'px';
      node.style.fontWeight = String(el.fontWeight);
      node.style.letterSpacing = (el.letterSpacing || 0) + 'px';
      node.style.fontStretch = (el.fontStretch || 100) + '%';
      node.style.color = el.color;
      node.style.textAlign = el.align;
      node.style.display = 'flex';
      node.style.alignItems = 'center';
      const inner = document.createElement('div');
      inner.style.width = '100%';
      inner.textContent = el.text;
      node.appendChild(inner);
    } else if (el.type === 'image') {
      const img = document.createElement('img');
      img.src = el.src || '';
      img.draggable = false;
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.objectFit = el.fit || 'cover';
      img.style.display = 'block';
      node.appendChild(img);
    } else if (el.type === 'video') {
      const v = document.createElement('video');
      v.src = el.src || '';
      v.style.width = '100%';
      v.style.height = '100%';
      v.style.objectFit = el.fit || 'cover';
      v.style.display = 'block';
      v.playsInline = true;
      v.muted = el.muted !== false;
      v.loop = el.loop !== false;
      if (el.controls) v.controls = true;
      if (el.autoplay !== false) {
        v.autoplay = true;
        v.muted = true;
        setTimeout(() => { v.play && v.play().catch(() => {}); }, 0);
      }
      node.appendChild(v);
    } else if (el.type === 'linkcard') {
      buildLinkcardChildren(node, el);
    } else {
      node.style.background = el.fill;
    }
    if (el.link) {
      node.setAttribute('data-link', el.link);
      node.style.cursor = 'pointer';
      node.addEventListener('click', (e) => {
        e.stopPropagation();
        let u = el.link;
        if (!/^https?:\/\//i.test(u)) u = 'https://' + u;
        window.open(u, '_blank', 'noopener');
      });
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
      if (e.target === els.canvas) {
        if (state.editingElementId) {
          state.editingElementId = null;
          renderCanvas();
          renderProperties();
        } else {
          deselectElement();
        }
      }
    });

    document.addEventListener('keydown', (e) => {
      if (!els.presentOverlay.hidden) return;
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.target.isContentEditable) return;
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

    localFonts = loadLocalFontsCache();
    googleFontsUsed = loadGoogleFontsUsedCache();
    rehydrateUsedGoogleFonts();

    if (!restore() || !state.slides.length) {
      const intro = newSlide('title');
      const next = newSlide('titleBody');
      state.slides = [intro, next];
      state.currentSlideId = intro.id;
    }
    // Backfill new fields on slides loaded from older saves.
    state.slides.forEach(s => {
      if (typeof s.bgImage !== 'string') s.bgImage = '';
      (s.elements || []).forEach(el => {
        if (typeof el.link !== 'string') el.link = '';
        if (el.type === 'text') {
          if (typeof el.letterSpacing !== 'number') el.letterSpacing = 0;
          if (typeof el.fontStretch !== 'number') el.fontStretch = 100;
        }
        if (el.type === 'linkcard') {
          if (typeof el.title !== 'string') el.title = '';
          if (typeof el.description !== 'string') el.description = '';
          if (typeof el.image !== 'string') el.image = '';
          if (typeof el.domain !== 'string') el.domain = extractDomain(el.link || '');
        }
        if (el.font && GOOGLE_FONT_SET.has(el.font)) loadGoogleFont(el.font);
      });
    });
    renderAll();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

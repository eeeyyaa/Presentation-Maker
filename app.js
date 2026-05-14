/* ============================================================
   Presentation Generator ??App Logic
   Pure HTML/CSS/JS (no dependencies)
   ============================================================ */

(function () {
  'use strict';

  const STORAGE_KEY = 'pres-gen-state-v1';
  const VIEW_KEY = 'pres-gen-view-v1';
  const PROJECT_LIBRARY_DB = 'pres-gen-project-library-v1';
  const PROJECT_LIBRARY_STORE = 'projects';

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
html, body { margin: 0; padding: 0; height: 100%; background: #000000; color: #fff; overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Pretendard", "Helvetica Neue", Arial, sans-serif; }
.stage { position: fixed; inset: 0; display: flex; align-items: center; justify-content: center; }
/* Frame keeps the slide's aspect ratio. Any letterbox area outside the
   frame inherits the body bg, which we mirror to slide.bg/bgImage in
   render() — so the "bars" blend visually with the slide instead of
   showing as black margins. */
.frame { position: relative;
  width: min(100vw, calc(100vh * var(--cw, 1280) / var(--ch, 720)));
  height: min(100vh, calc(100vw * var(--ch, 720) / var(--cw, 1280)));
  overflow: hidden; }
.canvas { position: absolute; top: 50%; left: 50%;
  transform: translate(-50%, -50%); transform-origin: center center; }
.canvas-clone { pointer-events: none; z-index: 2; }
.el { position: absolute; user-select: none;
  transform: rotate(var(--rotation, 0deg));
  transition: transform 0.25s ease, filter 0.25s ease, opacity 0.25s ease, color 0.25s ease, background 0.25s ease; }
/* Match the editor's .el.text rule exactly. display:flex / align-items /
   font-family / weight / etc. are set per-element via inline JS at runtime
   (just like in the editor) so the cascade resolves identically. */
.el.text { padding: 4px; white-space: pre-wrap; word-break: break-word; line-height: 1.3; font-synthesis: none; }
.el.shape-rect { border-radius: 4px; }
.el.shape-circle { border-radius: 50%; }
.el[data-link] { cursor: pointer; }
.el.linkcard { background:#303030; border-radius:16px; overflow:hidden; }
.linkcard-image { position:absolute; inset:0; background-size:cover; background-position:top center; background-repeat:no-repeat; background-color:#303030; }
/* Hover effects fire on direct hover OR when a sibling in the same group is
   hovered (.group-hover class toggled by JS via data-group-id matching).
   Grouped members get an inline transform-origin pinned to the group's
   bounding-box center so they scale together as one block; ungrouped
   elements fall back to the default 50% 50% (their own center). */
.el.hover-scale:hover,
.el.hover-scale.group-hover { transform: rotate(var(--rotation, 0deg)) scale(calc(1 + 0.05 * var(--hover-strength, 1))); }
.el.hover-glow:hover,
.el.hover-glow.group-hover { filter: drop-shadow(0 0 calc(12px * var(--hover-strength, 1)) rgba(255,255,255,0.55)); }
.el.hover-lift:hover,
.el.hover-lift.group-hover { transform: rotate(var(--rotation, 0deg)) translateY(calc(-6px * var(--hover-strength, 1))); }
.el.hover-fade:hover,
.el.hover-fade.group-hover { opacity: max(0, calc(1 - 0.125 * var(--hover-strength, 1))); }
@keyframes fadeIn { from { opacity: calc(1 - var(--motion-strength, 1)); } to { opacity: 1; } }
@keyframes slideUp { from { opacity: 0; transform: rotate(var(--rotation, 0deg)) translateY(calc(60px * var(--motion-strength, 1))); } to { opacity: 1; transform: rotate(var(--rotation, 0deg)) translateY(0); } }
@keyframes slideLeft { from { opacity: 0; transform: rotate(var(--rotation, 0deg)) translateX(calc(-80px * var(--motion-strength, 1))); } to { opacity: 1; transform: rotate(var(--rotation, 0deg)) translateX(0); } }
@keyframes slideRight { from { opacity: 0; transform: rotate(var(--rotation, 0deg)) translateX(calc(80px * var(--motion-strength, 1))); } to { opacity: 1; transform: rotate(var(--rotation, 0deg)) translateX(0); } }
@keyframes scaleUp { from { opacity: 0; transform: rotate(var(--rotation, 0deg)) scale(max(0.05, calc(1 - 0.12 * var(--motion-strength, 1)))); } to { opacity: 1; transform: rotate(var(--rotation, 0deg)) scale(1); } }
@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: max(0, calc(1 - var(--motion-strength, 1))); } }
@keyframes flyFromLeft { from { opacity: 0; transform: rotate(var(--rotation, 0deg)) translateX(var(--fly-from-x, -100vw)); } to { opacity: 1; transform: rotate(var(--rotation, 0deg)) translateX(0); } }
@keyframes flyFromRight { from { opacity: 0; transform: rotate(var(--rotation, 0deg)) translateX(var(--fly-from-x, 100vw)); } to { opacity: 1; transform: rotate(var(--rotation, 0deg)) translateX(0); } }
@keyframes flyFromTop { from { opacity: 0; transform: rotate(var(--rotation, 0deg)) translateY(var(--fly-from-y, -100vh)); } to { opacity: 1; transform: rotate(var(--rotation, 0deg)) translateY(0); } }
@keyframes flyFromBottom { from { opacity: 0; transform: rotate(var(--rotation, 0deg)) translateY(var(--fly-from-y, 100vh)); } to { opacity: 1; transform: rotate(var(--rotation, 0deg)) translateY(0); } }
@keyframes customPath { from { opacity: 0; transform: rotate(var(--rotation, 0deg)) translate(var(--motion-from-x, 0px), var(--motion-from-y, 0px)); } to { opacity: 1; transform: rotate(var(--rotation, 0deg)) translate(0, 0); } }
.anim-fade { animation: fadeIn var(--motion-duration, .6s) ease both; }
.anim-up { animation: slideUp var(--motion-duration, .6s) cubic-bezier(.2,.8,.2,1) both; }
.anim-left { animation: slideLeft var(--motion-duration, .6s) cubic-bezier(.2,.8,.2,1) both; }
.anim-right { animation: slideRight var(--motion-duration, .6s) cubic-bezier(.2,.8,.2,1) both; }
.anim-scale { animation: scaleUp var(--motion-duration, .6s) cubic-bezier(.2,.8,.2,1) both; }
.anim-blink { animation: blink var(--blink-duration, 1s) ease-in-out infinite; }
.anim-fly-from-left { animation: flyFromLeft var(--motion-duration, .8s) cubic-bezier(.2,.8,.2,1) both; }
.anim-fly-from-right { animation: flyFromRight var(--motion-duration, .8s) cubic-bezier(.2,.8,.2,1) both; }
.anim-fly-from-top { animation: flyFromTop var(--motion-duration, .8s) cubic-bezier(.2,.8,.2,1) both; }
.anim-fly-from-bottom { animation: flyFromBottom var(--motion-duration, .8s) cubic-bezier(.2,.8,.2,1) both; }
.anim-custom { animation: customPath var(--motion-duration, .8s) cubic-bezier(.2,.8,.2,1) both; }
.hud { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); display: flex; gap: 4px;
  align-items: center; padding: 6px; background: rgba(20,20,20,0.75); backdrop-filter: blur(10px);
  border: 1px solid #333; border-radius: 999px; opacity: 0; transition: opacity .3s ease;
  font-size: 12px; z-index: 10; }
body:hover .hud, .hud:hover { opacity: 1; }
.hud button { background: transparent; border: none; color: #9a9a9a; padding: 6px 14px;
  cursor: pointer; border-radius: 999px; font: inherit; }
.hud button:hover { background: #303030; color: #fff; }
.hud .counter { padding: 0 10px; color: #9a9a9a; font-variant-numeric: tabular-nums; }
* { scrollbar-width: thin; scrollbar-color: #383838 transparent; }
*::-webkit-scrollbar { width: 8px; height: 8px; }
*::-webkit-scrollbar-track { background: transparent; }
*::-webkit-scrollbar-button,
*::-webkit-scrollbar-button:single-button,
*::-webkit-scrollbar-button:start,
*::-webkit-scrollbar-button:end,
*::-webkit-scrollbar-button:increment,
*::-webkit-scrollbar-button:decrement,
*::-webkit-scrollbar-button:vertical:start:decrement,
*::-webkit-scrollbar-button:vertical:end:increment,
*::-webkit-scrollbar-button:horizontal:start:decrement,
*::-webkit-scrollbar-button:horizontal:end:increment { width: 0 !important; height: 0 !important; min-width: 0 !important; min-height: 0 !important; display: none !important; background: transparent !important; background-image: none !important; -webkit-appearance: none !important; }
*::-webkit-scrollbar-thumb { background: rgba(255,255,255,.18); border: 2px solid transparent; border-radius: 999px; background-clip: padding-box; }
*::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,.28); border: 2px solid transparent; background-clip: padding-box; }
.nav-toggle { position:fixed; left:0; top:0; bottom:0; z-index:12; width:44px; padding:0;
  border:0; background:transparent; color:transparent; cursor:pointer; opacity:0; transition:opacity .16s ease; }
.nav-toggle::before { content:''; position:absolute; left:12px; top:16px; width:28px; height:28px;
  border:1px solid #363636; border-radius:50%; background:
  linear-gradient(#aaa,#aaa) center calc(50% - 5px) / 12px 1px no-repeat,
  linear-gradient(#aaa,#aaa) center center / 12px 1px no-repeat,
  linear-gradient(#aaa,#aaa) center calc(50% + 5px) / 12px 1px no-repeat,
  rgba(20,20,20,.74); backdrop-filter:blur(10px); }
.nav-toggle:hover,.nav-toggle.active { opacity:1; }
.nav-toggle.active { pointer-events:none; }
.nav-toggle.active::before { display:none; }
.slide-nav { position:fixed; left:0; top:0; bottom:0; z-index:11; width:280px; padding:56px 12px 14px;
  display:none; overflow-y:auto; border-right:1px solid #363636; background:rgba(18,18,18,.96); }
.slide-nav.open { display:block; }
.slide-nav .nav-handle { position:absolute; left:12px; top:16px; width:28px; height:28px; border:1px solid #363636;
  border-radius:50%; background:
  linear-gradient(#aaa,#aaa) center calc(50% - 5px) / 12px 1px no-repeat,
  linear-gradient(#aaa,#aaa) center center / 12px 1px no-repeat,
  linear-gradient(#aaa,#aaa) center calc(50% + 5px) / 12px 1px no-repeat; pointer-events:none; }
.slide-nav .nav-close { position:fixed; left:240px; top:12px; z-index:13; width:28px; height:28px; border:1px solid transparent;
  border-radius:50%; background:transparent; color:#777; cursor:pointer; font:inherit; font-size:0; line-height:0; padding:0; }
.slide-nav .nav-close::before,.slide-nav .nav-close::after { content:''; position:absolute; left:50%; top:50%;
  width:10px; height:1px; background:currentColor; transform-origin:center; }
.slide-nav .nav-close::before { transform:translate(-50%,-50%) rotate(45deg); }
.slide-nav .nav-close::after { transform:translate(-50%,-50%) rotate(-45deg); }
.slide-nav .nav-close:hover { color:#fff; border-color:#363636; background:rgba(255,255,255,.065); }
.slide-nav button { width:100%; display:block; padding:7px; border:1px solid rgba(255,255,255,.04); border-radius:16px; background:transparent;
  color:#aaa; text-align:left; cursor:pointer; font:inherit; font-size:12px; }
.slide-nav button:hover { color:#fff; background:rgba(255,255,255,.055); }
.slide-nav button.active { color:#fff; border-color:#d7f7ff; background:rgba(255,255,255,.08); }
.slide-nav .thumb { position:relative; width:100%; aspect-ratio:var(--cw,1280) / var(--ch,720); overflow:hidden;
  border-radius:10px; background:#000000; box-shadow:inset 0 0 0 1px rgba(255,255,255,.14); }
.slide-nav .thumb-inner { position:absolute; top:0; left:0; width:calc(var(--cw,1280) * 1px);
  height:calc(var(--ch,720) * 1px); transform-origin:top left; pointer-events:none; }
.slide-nav .meta { display:grid; grid-template-columns:28px minmax(0,1fr); align-items:center; gap:8px; margin-top:7px; }
.slide-nav .idx { color:#777; font-variant-numeric:tabular-nums; }
.slide-nav .title { overflow:hidden; white-space:nowrap; text-overflow:ellipsis; }
</style>
</head>
<body>
<div class="stage"><div class="frame"><div class="canvas" id="canvas"></div></div></div>
<button class="nav-toggle" id="navToggle" title="Slides" aria-label="Open slides"></button>
<aside class="slide-nav" id="slideNav" aria-label="Slides"></aside>
<div class="hud">
  <button id="prev" title="Prev">Prev</button>
  <span class="counter" id="counter">1 / 1</span>
  <button id="next" title="Next">Next</button>
  <button id="full" title="Fullscreen (F)">Full</button>
</div>
<script id="data" type="application/json">__SLIDES_JSON__</script>
<script>
(function(){
  var FF={
    sans:'-apple-system, BlinkMacSystemFont, "Segoe UI", "Pretendard", "Helvetica Neue", Arial, sans-serif',
    serif:'Georgia, "Times New Roman", "Nanum Myeongjo", serif',
    mono:'"SF Mono", Menlo, Monaco, "Courier New", monospace',
    display:'"Helvetica Neue", "Pretendard", Impact, Arial, sans-serif'
  };
  var WF = __WEBFONTS_FAMILY_JSON__;
  function fontFamily(name){ return (FF[name]) || (WF && WF[name]) || name || FF.sans; }
  function renderWhenFontsReady(){
    fit();
    if(document.fonts && document.fonts.ready){
      document.fonts.ready.then(function(){ fit(); render(); }).catch(function(){ render(); });
      setTimeout(function(){ if(!canvas.children.length) render(); }, 1200);
    } else {
      render();
    }
  }
  function clamp01(v){ return Math.max(0, Math.min(1, Number(v))); }
  function strokePaint(stroke){
    var color=(stroke&&stroke.color)||'#fff';
    var alpha=stroke&&stroke.opacity!=null?clamp01(stroke.opacity):1;
    var hex=String(color||'').trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
    if(hex){
      var h=hex[1];
      if(h.length===3) h=h.split('').map(function(ch){return ch+ch;}).join('');
      return 'rgba('+parseInt(h.slice(0,2),16)+','+parseInt(h.slice(2,4),16)+','+parseInt(h.slice(4,6),16)+','+alpha+')';
    }
    var rgba=String(color||'').match(/^rgba?\\(([^)]+)\\)$/i);
    if(rgba){
      var p=rgba[1].split(',').map(function(v){return v.trim();});
      var base=p[3]==null?1:clamp01(parseFloat(p[3]));
      return 'rgba('+p[0]+','+p[1]+','+p[2]+','+clamp01(base*alpha)+')';
    }
    return color;
  }
  function applyBrMargin(c, px){
    if(!c) return;
    var gap = px || 0;
    if (gap <= 0) return;
    var pxs = gap + 'px';
    c.querySelectorAll('br').forEach(function(br){
      if(br.style.marginBottom) return;
      br.style.display = 'block';
      br.style.marginBottom = pxs;
    });
    c.querySelectorAll('div, p').forEach(function(b){
      if(b.style.marginTop) return;
      var prev = b.previousSibling;
      while(prev && prev.nodeType === 3 && !prev.textContent.trim()) prev = prev.previousSibling;
      if(!prev) return;
      b.style.marginTop = pxs;
    });
  }
  var data=null;
  try { data=JSON.parse(document.getElementById('data').textContent); } catch(e) {}
  var slides = (data && (Array.isArray(data) ? data : data.slides)) || [];
  var CW = (data && data.canvasW) || 1280;
  var CH = (data && data.canvasH) || 720;
  if(!slides.length){slides=[{bg:'#000000',elements:[]}];}
  var idx=0;
  var canvas=document.getElementById('canvas');
  var frame=document.querySelector('.frame');
  var counter=document.getElementById('counter');
  var nav=document.getElementById('slideNav');
  var navToggle=document.getElementById('navToggle');
  var animating=false;
  canvas.style.width = CW + 'px';
  canvas.style.height = CH + 'px';
  document.documentElement.style.setProperty('--cw', CW);
  document.documentElement.style.setProperty('--ch', CH);
  function fit(){
    // Uniform scale preserves the slide's aspect ratio. The frame element
    // already constrains itself to the slide's ratio via CSS min(), so this
    // just scales the canvas to fit perfectly inside it.
    var s=Math.min(frame.clientWidth/CW, frame.clientHeight/CH);
    canvas.style.transform='translate(-50%, -50%) scale('+s+')';
  }
  function render(){
    var slide=slides[idx]; if(!slide) return;
    // Mirror the slide's background onto the body so the letterbox bars
    // (when monitor aspect != slide aspect) blend into the slide visually.
    // Note: using shorthand 'background' would wipe bgImage; set each long-
    // hand separately so color and image stay independent.
    document.body.style.backgroundColor=slide.bg||'#000000';
    document.body.style.backgroundImage=slide.bgImage?'url("'+slide.bgImage+'")':'';
    document.body.style.backgroundSize='cover';
    document.body.style.backgroundPosition='center';
    canvas.style.backgroundColor=slide.bg||'#000000';
    canvas.style.backgroundImage=slide.bgImage?'url("'+slide.bgImage+'")':'';
    canvas.style.backgroundSize='cover';
    canvas.style.backgroundPosition='center';
    canvas.innerHTML='';
    // Group-shared hover/motion: if any group member has a hover/motion
    // class, every member inherits it so the entire group animates as one
    // when any one is hovered. Also collect each group's bounding box so we
    // can pin every member's transform-origin to the same world-space point
    // — so scale transforms keep the whole group locked together as a unit.
    var __groupHover={}, __groupMotion={}, __groupBBox={};
    (slide.elements||[]).forEach(function(el){
      if(!el.groupId || el.hidden) return;
      if(el.hover && el.hover!=='none' && !__groupHover[el.groupId]) __groupHover[el.groupId]=el.hover;
      if(el.motion && el.motion!=='none' && !__groupMotion[el.groupId]) __groupMotion[el.groupId]=el.motion;
      if(!__groupBBox[el.groupId]) __groupBBox[el.groupId]={minX:Infinity,minY:Infinity,maxX:-Infinity,maxY:-Infinity};
      var bb=__groupBBox[el.groupId];
      bb.minX=Math.min(bb.minX,el.x); bb.minY=Math.min(bb.minY,el.y);
      bb.maxX=Math.max(bb.maxX,el.x+el.w); bb.maxY=Math.max(bb.maxY,el.y+el.h);
    });
    (slide.elements||[]).forEach(function(el,i){
      if(el.hidden) return;
      var node=document.createElement('div');
      var cls='el ';
      if(el.type==='text') cls+='text';
      else if(el.type==='image'||el.type==='vector') cls+='image';
      else if(el.type==='video') cls+='video';
      else if(el.type==='imageBanner') cls+='image-banner';
      else if(el.type==='linkcard') cls+='linkcard';
      else cls+='shape-'+el.type;
      node.className=cls;
      node.style.left=el.x+'px'; node.style.top=el.y+'px';
      node.style.width=el.w+'px'; node.style.height=el.h+'px';
      node.style.setProperty('--hover-strength', String(el.hoverStrength!=null?el.hoverStrength:1));
      node.style.setProperty('--motion-strength', String(el.motionStrength!=null?el.motionStrength:1));
      if(el.motion==='anim-blink'){
        node.style.setProperty('--blink-duration', (el.blinkDuration!=null?el.blinkDuration:1)+'s');
      }
      var __ms=el.motionStrength!=null?el.motionStrength:1;
      if(el.motion==='anim-fly-from-left'){
        node.style.setProperty('--fly-from-x', (-(el.x+el.w+20)*__ms)+'px');
      } else if(el.motion==='anim-fly-from-right'){
        node.style.setProperty('--fly-from-x', ((CW-el.x+20)*__ms)+'px');
      } else if(el.motion==='anim-fly-from-top'){
        node.style.setProperty('--fly-from-y', (-(el.y+el.h+20)*__ms)+'px');
      } else if(el.motion==='anim-fly-from-bottom'){
        node.style.setProperty('--fly-from-y', ((CH-el.y+20)*__ms)+'px');
      } else if(el.motion==='anim-custom'){
        node.style.setProperty('--motion-from-x', (el.motionFromX||0)+'px');
        node.style.setProperty('--motion-from-y', (el.motionFromY||0)+'px');
      }
      if(el.motion && el.motion!=='none' && el.motion!=='anim-blink' && typeof el.motionDuration==='number' && el.motionDuration>0){
        node.style.setProperty('--motion-duration', el.motionDuration+'s');
      }
      if(el.rotation) node.style.setProperty('--rotation', el.rotation+'deg');
      if(el.opacity!=null && el.opacity<1) node.style.opacity=String(el.opacity);
      if(el.type==='text'){
        node.style.fontFamily=fontFamily(el.font);
        node.style.fontSize=el.fontSize+'px';
        node.style.fontWeight=String(el.fontWeight);
        node.style.fontStyle=el.fontStyle||'normal';
        node.style.fontSynthesis='none';
        node.style.letterSpacing=(el.letterSpacing||0)+'px';
        node.style.fontStretch=(el.fontStretch||100)+'%';
        node.style.lineHeight=String(el.lineHeight!=null?el.lineHeight:1.3);
        node.style.color=el.color;
        if(el.bg) node.style.background=el.bg;
        node.style.textAlign=el.align;
        node.style.display='flex';
        var VAL={top:'flex-start',center:'center',bottom:'flex-end'};
        node.style.alignItems=VAL[el.verticalAlign||'center']||'center';
        if(el.textCase&&el.textCase!=='none') node.style.textTransform=el.textCase;
        var inner=document.createElement('div');
        inner.style.width='100%';
        inner.style.whiteSpace='pre-wrap';
        inner.style.wordBreak='break-word';
        inner.style.lineHeight=String(el.lineHeight!=null?el.lineHeight:1.3);
        inner.style.textTransform=el.textCase&&el.textCase!=='none'?el.textCase:'';
        var dcs=[];
        if(el.underline) dcs.push('underline');
        if(el.strikethrough) dcs.push('line-through');
        if(dcs.length) inner.style.textDecoration=dcs.join(' ');
        if(el.underline) inner.style.textUnderlineOffset=((el.underlineOffset!=null?el.underlineOffset:3))+'px';
        var stretch=(el.fontStretch||100)/100;
        if(stretch!==1){
          var ORG={left:'left',center:'center',right:'right',justify:'left'};
          inner.style.transformOrigin=(ORG[el.align]||'left')+' center';
          inner.style.transform='scaleX('+stretch+')';
        }
        inner.innerHTML=el.html||el.text||'';
        applyBrMargin(inner, el.paragraphSpacing||0);
        node.appendChild(inner);
      } else if(el.type==='image'||el.type==='vector'){
        var img=document.createElement('img');
        img.src=el.src||'';
        img.draggable=false;
        img.style.width='100%'; img.style.height='100%';
        img.style.objectFit=el.aspectLocked?(el.fit||'cover'):'fill';
        if(el.cropApplied){ img.style.objectPosition=(50+((el.cropX||0)/2))+'% '+(50+((el.cropY||0)/2))+'%'; if((el.cropZoom||1)!==1){ img.style.transform='scale('+Math.max(1,Math.min(6,el.cropZoom||1))+')'; img.style.transformOrigin='center center'; } } else { img.style.objectPosition='50% 50%'; }
        img.style.display='block';
        img.style.borderRadius=(el.radius||0)+'px';
        node.style.overflow='hidden';
        node.appendChild(img);
      } else if(el.type==='imageBanner'){
        var imgs=el.images||[];
        node.style.overflow='hidden';
        node.style.borderRadius=(el.radius||0)+'px';
        if(imgs.length){
          if((el.transition||'fade')==='slide'){
            var track=document.createElement('div');
            track.style.position='absolute';
            track.style.inset='0';
            track.style.display='flex';
            track.style.width=((imgs.length+1)*100)+'%';
            track.style.transform='translateX(0)';
            var tImgs=imgs.concat(imgs[0]);
            tImgs.forEach(function(src){
              var ti=document.createElement('img');
              ti.src=src||'';
              ti.draggable=false;
              ti.style.width=(100/(imgs.length+1))+'%';
              ti.style.height='100%';
              ti.style.objectFit=el.aspectLocked?(el.fit||'cover'):'fill';
              if(el.cropApplied){ ti.style.objectPosition=(50+((el.cropX||0)/2))+'% '+(50+((el.cropY||0)/2))+'%'; if((el.cropZoom||1)!==1){ ti.style.transform='scale('+Math.max(1,Math.min(6,el.cropZoom||1))+')'; ti.style.transformOrigin='center center'; } } else { ti.style.objectPosition='50% 50%'; }
              ti.style.flex='0 0 auto';
              track.appendChild(ti);
            });
            node.appendChild(track);
            if(imgs.length>1){
              var tii=0;
              setInterval(function(){
                if(!node.isConnected) return;
                tii+=1;
                track.style.transition='transform '+((el.fadeMs||350)/1000)+'s cubic-bezier(.2,.8,.2,1)';
                track.style.transform='translateX(-'+(tii*100/(imgs.length+1))+'%)';
                if(tii===imgs.length){
                  setTimeout(function(){
                    if(!node.isConnected) return;
                    track.style.transition='none';
                    track.style.transform='translateX(0)';
                    tii=0;
                  }, (el.fadeMs||350)+30);
                }
              }, Math.max(2000, Math.min(4500, el.interval || 2800)));
            }
          } else {
            imgs.forEach(function(src, bi){
              var bimg=document.createElement('img');
              bimg.src=src||'';
              bimg.draggable=false;
              bimg.style.position='absolute';
              bimg.style.inset='0';
              bimg.style.width='100%';
              bimg.style.height='100%';
              bimg.style.objectFit=el.aspectLocked?(el.fit||'cover'):'fill';
              if(el.cropApplied){ bimg.style.objectPosition=(50+((el.cropX||0)/2))+'% '+(50+((el.cropY||0)/2))+'%'; if((el.cropZoom||1)!==1){ bimg.style.transform='scale('+Math.max(1,Math.min(6,el.cropZoom||1))+')'; bimg.style.transformOrigin='center center'; } } else { bimg.style.objectPosition='50% 50%'; }
              bimg.style.opacity=bi===0?'1':'0';
              bimg.style.transition='opacity '+((el.fadeMs||350)/1000)+'s cubic-bezier(.2,.8,.2,1)';
              node.appendChild(bimg);
            });
            if(imgs.length>1){
              var idxB=0;
              setInterval(function(){
                if(!node.isConnected) return;
                var children=node.querySelectorAll('img');
                if(!children.length) return;
                var prev=idxB%children.length;
                idxB=(idxB+1)%children.length;
                children[prev].style.opacity='0';
                children[idxB].style.opacity='1';
              }, Math.max(2000, Math.min(4500, el.interval || 2800)));
            }
          }
        }
      } else if(el.type==='video'){
        var vid=document.createElement('video');
        vid.style.width='100%'; vid.style.height='100%';
        vid.style.objectFit=el.aspectLocked?(el.fit||'cover'):'fill';
        if(el.cropApplied){ vid.style.objectPosition=(50+((el.cropX||0)/2))+'% '+(50+((el.cropY||0)/2))+'%'; if((el.cropZoom||1)!==1){ vid.style.transform='scale('+Math.max(1,Math.min(6,el.cropZoom||1))+')'; vid.style.transformOrigin='center center'; } } else { vid.style.objectPosition='50% 50%'; }
        vid.style.display='block';
        vid.style.borderRadius=(el.radius||0)+'px';
        node.style.overflow='hidden';
        vid.playsInline=true;
        vid.preload='auto';
        if(el.poster) vid.poster=el.poster;
        vid.muted=el.muted!==false;
        vid.loop=el.loop!==false;
        if(el.controls) vid.controls=true;
        if(el.autoplay!==false){
          vid.autoplay=true; vid.muted=true;
          vid.addEventListener('canplay', function(){ vid.play && vid.play().catch(function(){}); }, { once:true });
        }
        vid.src=el.src||'';
        node.appendChild(vid);
      } else if(el.type==='linkcard'){
        var lcImg=document.createElement('div');
        lcImg.className='linkcard-image';
        if(el.image) lcImg.style.backgroundImage='url("'+el.image+'")';
        node.appendChild(lcImg);
      } else {
        node.style.background=el.fillEnabled===false?'transparent':(el.fill||'#fff');
      }
      if(el.type==='rect'){
        node.style.borderRadius=(el.radius!=null?el.radius:0)+'px';
      }
      if(el.stroke && el.stroke.width && el.type!=='line'){
        if(el.type==='text'){
          var tInner=node.querySelector(':scope > div');
          if(tInner) tInner.style.webkitTextStroke=el.stroke.width+'px '+strokePaint(el.stroke);
        } else if(el.type==='image' || el.type==='vector' || el.type==='video' || el.type==='imageBanner'){
          node.style.boxShadow=(node.style.boxShadow?node.style.boxShadow+', ':'')+
            'inset 0 0 0 '+el.stroke.width+'px '+strokePaint(el.stroke);
        } else {
          node.style.border=el.stroke.width+'px '+(el.stroke.style||'solid')+' '+strokePaint(el.stroke);
          node.style.boxSizing='border-box';
        }
      }
      if(el.shadow){
        var sx=(el.shadow.x||0)+'px ',sy=(el.shadow.y||0)+'px ',
            sb=Math.max(0,el.shadow.blur||0)+'px ',
            sc=el.shadow.color||'rgba(0,0,0,0.4)';
        if(el.type==='text'){
          var sInner=node.querySelector(':scope > div');
          if(sInner) sInner.style.textShadow=sx+sy+sb+sc;
        } else if(el.type==='image' || el.type==='vector' || el.type==='video' || el.type==='imageBanner' || el.type==='linkcard'){
          node.style.filter=(node.style.filter?node.style.filter+' ':'')+'drop-shadow('+sx+sy+sb+sc+')';
        } else {
          node.style.boxShadow=(node.style.boxShadow?node.style.boxShadow+', ':'')+sx+sy+sb+sc;
        }
      }
      var __effMotion = (el.motion && el.motion!=='none') ? el.motion : (el.groupId && __groupMotion[el.groupId]) || null;
      if(__effMotion){node.classList.add(__effMotion);node.style.animationDelay=(i*0.08)+'s';}
      var __effHover = (el.hover && el.hover!=='none') ? el.hover : (el.groupId && __groupHover[el.groupId]) || null;
      if(__effHover) node.classList.add(__effHover);
      if(el.groupId){
        node.setAttribute('data-group-id', el.groupId);
        var __gbb=__groupBBox[el.groupId];
        if(__gbb){
          var __gcx=(__gbb.minX+__gbb.maxX)/2, __gcy=(__gbb.minY+__gbb.maxY)/2;
          node.style.transformOrigin=(__gcx-el.x)+'px '+(__gcy-el.y)+'px';
        }
        // Group hover propagation — entering any member adds .group-hover to
        // every sibling so the entire cluster animates together.
        node.addEventListener('mouseenter', function(){
          var peers = canvas.querySelectorAll('[data-group-id="' + (window.CSS && CSS.escape ? CSS.escape(el.groupId) : el.groupId) + '"]');
          peers.forEach(function(n){ n.classList.add('group-hover'); });
        });
        node.addEventListener('mouseleave', function(){
          var peers = canvas.querySelectorAll('[data-group-id="' + (window.CSS && CSS.escape ? CSS.escape(el.groupId) : el.groupId) + '"]');
          peers.forEach(function(n){ n.classList.remove('group-hover'); });
        });
      }
      if(el.link) node.setAttribute('data-link',el.link);
      canvas.appendChild(node);
    });
    counter.textContent=(idx+1)+' / '+slides.length;
    renderNav();
    if(history&&history.replaceState) history.replaceState(null,'','#'+(idx+1));
  }
  function slideTitle(slide,n){
    var els=(slide&&slide.elements)||[];
    for(var i=0;i<els.length;i++){
      if(els[i].type==='text'){
        var t=(els[i].text||'').replace(/\\s+/g,' ').trim();
        if(t) return t.slice(0,36);
      }
    }
    return 'Slide '+n;
  }
  function navElClass(type){
      if(type==='text'||type==='image'||type==='vector'||type==='video'||type==='imageBanner'||type==='linkcard') return type;
    return 'shape-'+type;
  }
  function renderMiniElement(el){
    var node=document.createElement('div');
    node.className='el '+navElClass(el.type);
    node.style.left=el.x+'px'; node.style.top=el.y+'px';
    node.style.width=el.w+'px'; node.style.height=el.h+'px';
    if(el.rotation) node.style.setProperty('--rotation',el.rotation+'deg');
    if(el.opacity!=null&&el.opacity<1) node.style.opacity=String(el.opacity);
    if(el.type==='text'){
      node.style.fontFamily=fontFamily(el.font);
      node.style.fontSize=el.fontSize+'px';
      node.style.fontWeight=String(el.fontWeight);
      node.style.fontStyle=el.fontStyle||'normal';
      node.style.fontSynthesis='none';
      node.style.letterSpacing=(el.letterSpacing||0)+'px';
      node.style.lineHeight=String(el.lineHeight!=null?el.lineHeight:1.3);
      node.style.color=el.color||'#fff';
      if(el.bg) node.style.background=el.bg;
      node.style.textAlign=el.align||'left';
      node.innerHTML='<div>'+(el.html||el.text||'')+'</div>';
    }else if(el.type==='image'||el.type==='vector'){
      var img=document.createElement('img'); img.src=el.src||''; img.style.width='100%'; img.style.height='100%';
      img.style.objectFit=el.aspectLocked?(el.fit||'cover'):'fill';
      img.style.objectPosition=el.cropApplied?(50+((el.cropX||0)/2))+'% '+(50+((el.cropY||0)/2))+'%':'50% 50%';
      if(el.cropApplied && (el.cropZoom||1)!==1){ img.style.transform='scale('+Math.max(1,Math.min(6,el.cropZoom||1))+')'; img.style.transformOrigin='center center'; }
      img.style.display='block'; img.style.borderRadius=(el.radius||0)+'px'; node.style.overflow='hidden'; node.appendChild(img);
    }else if(el.type==='video'){
      if(el.poster){ var p=document.createElement('img'); p.src=el.poster; p.style.width='100%'; p.style.height='100%'; p.style.objectFit=el.aspectLocked?(el.fit||'cover'):'fill'; p.style.objectPosition=el.cropApplied?(50+((el.cropX||0)/2))+'% '+(50+((el.cropY||0)/2))+'%':'50% 50%'; if(el.cropApplied&&(el.cropZoom||1)!==1){ p.style.transform='scale('+Math.max(1,Math.min(6,el.cropZoom||1))+')'; p.style.transformOrigin='center center'; } node.style.overflow='hidden'; node.appendChild(p); }
      else node.style.background='#222';
    }else if(el.type==='imageBanner'){
      var src=(el.images&&el.images[0])||''; if(src){ var bi=document.createElement('img'); bi.src=src; bi.style.width='100%'; bi.style.height='100%'; bi.style.objectFit=el.aspectLocked?(el.fit||'cover'):'fill'; bi.style.objectPosition=el.cropApplied?(50+((el.cropX||0)/2))+'% '+(50+((el.cropY||0)/2))+'%':'50% 50%'; if(el.cropApplied&&(el.cropZoom||1)!==1){ bi.style.transform='scale('+Math.max(1,Math.min(6,el.cropZoom||1))+')'; bi.style.transformOrigin='center center'; } node.style.overflow='hidden'; node.appendChild(bi); }
    }else if(el.type==='linkcard'){
      node.style.backgroundImage=el.image?'url("'+el.image+'")':''; node.style.backgroundSize='cover'; node.style.backgroundPosition='top center';
    }else{
      node.style.background=el.fillEnabled===false?'transparent':(el.fill||'#fff');
    }
    if(el.type==='rect') node.style.borderRadius=(el.radius||0)+'px';
    if(el.stroke&&el.stroke.width&&el.type!=='line'&&el.type!=='text'){
      node.style.border=el.stroke.width+'px '+(el.stroke.style||'solid')+' '+strokePaint(el.stroke);
      node.style.boxSizing='border-box';
    }
    return node;
  }
  function buildNavThumb(slide){
    var thumb=document.createElement('div');
    thumb.className='thumb';
    var inner=document.createElement('div');
    inner.className='thumb-inner';
    inner.style.backgroundColor=slide.bg||'#000000';
    if(slide.bgImage){ inner.style.backgroundImage='url("'+slide.bgImage+'")'; inner.style.backgroundSize='cover'; inner.style.backgroundPosition='center'; }
    (slide.elements||[]).forEach(function(el){ if(!el.hidden) inner.appendChild(renderMiniElement(el)); });
    thumb.appendChild(inner);
    requestAnimationFrame(function(){ inner.style.transform='scale('+(thumb.clientWidth/CW)+')'; });
    return thumb;
  }
  function renderNav(){
    if(!nav) return;
    nav.innerHTML='';
    var close=document.createElement('button');
    close.className='nav-close';
    close.type='button';
    close.textContent='x';
    close.title='Close';
    close.addEventListener('click',function(e){
      e.stopPropagation();
      nav.classList.remove('open');
      if(navToggle) navToggle.classList.remove('active');
    });
    nav.appendChild(close);
    var handle=document.createElement('div');
    handle.className='nav-handle';
    nav.appendChild(handle);
    slides.forEach(function(slide,i){
      var b=document.createElement('button');
      b.className=i===idx?'active':'';
      b.appendChild(buildNavThumb(slide));
      var meta=document.createElement('div');
      meta.className='meta';
      meta.innerHTML='<span class="idx">'+String(i+1).padStart(2,'0')+'</span><span class="title"></span>';
      meta.querySelector('.title').textContent=slideTitle(slide,i+1);
      b.appendChild(meta);
      b.addEventListener('click',function(e){
        e.stopPropagation();
        transitionTo(i,i>idx?1:-1);
      });
      nav.appendChild(b);
    });
  }
  function transName(slide){ return (slide&&slide.transition)||'none'; }
  function transMs(slide){ return Math.max(150,Math.min(2000,(slide&&slide.transitionMs)||650)); }
  function transitionTo(nextIdx,dir){
    if(animating||nextIdx===idx||nextIdx<0||nextIdx>=slides.length) return;
    var nextSlide=slides[nextIdx];
    var effect=transName(nextSlide);
    var ms=transMs(nextSlide);
    if(effect==='none'){idx=nextIdx;render();return;}
    animating=true;
    var old=canvas.cloneNode(true);
    old.removeAttribute('id');
    old.classList.add('canvas-clone');
    old.style.width=canvas.style.width;
    old.style.height=canvas.style.height;
    old.style.transform=canvas.style.transform;
    frame.appendChild(old);
    idx=nextIdx;
    render();
    var base=canvas.style.transform;
    canvas.style.transition='none';
    old.style.transition='none';
    canvas.style.zIndex='3';
    old.style.zIndex='2';
    canvas.style.opacity='1';
    old.style.opacity='1';
    if(effect==='fade'){
      canvas.style.opacity='0';
    }else if(effect==='slideHorizontal'){
      canvas.style.transform=base+' translateX('+(dir>0?100:-100)+'%)';
    }else if(effect==='scrollVertical'){
      canvas.style.transform=base+' translateY('+(dir>0?100:-100)+'%)';
    }else if(effect==='zoom'){
      canvas.style.transform=base+' scale('+(dir>0?1.08:.94)+')';
      canvas.style.opacity='0';
    }
    requestAnimationFrame(function(){
      var ease=effect==='scrollVertical'?'cubic-bezier(.18,.72,.16,1)':'cubic-bezier(.2,.8,.2,1)';
      canvas.style.transition='transform '+ms+'ms '+ease+', opacity '+ms+'ms ease';
      old.style.transition='transform '+ms+'ms '+ease+', opacity '+ms+'ms ease';
      if(effect==='fade'){
        old.style.opacity='0';
        canvas.style.opacity='1';
      }else if(effect==='slideHorizontal'){
        old.style.transform=base+' translateX('+(dir>0?-100:100)+'%)';
        canvas.style.transform=base;
      }else if(effect==='scrollVertical'){
        old.style.transform=base+' translateY('+(dir>0?-100:100)+'%)';
        canvas.style.transform=base;
      }else if(effect==='zoom'){
        old.style.transform=base+' scale('+(dir>0?.94:1.08)+')';
        old.style.opacity='0';
        canvas.style.transform=base;
        canvas.style.opacity='1';
      }
    });
    setTimeout(function(){
      if(old&&old.parentNode) old.parentNode.removeChild(old);
      canvas.style.transition='';
      canvas.style.zIndex='';
      canvas.style.opacity='';
      animating=false;
    },ms+40);
  }
  function next(){ transitionTo(idx<slides.length-1?idx+1:0,1); }
  function prev(){ transitionTo(idx>0?idx-1:slides.length-1,-1); }
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
  document.addEventListener('wheel',function(e){
    if(animating||Math.abs(e.deltaY)<24) return;
    e.preventDefault();
    if(e.deltaY>0) next(); else prev();
  },{passive:false});
  document.getElementById('next').addEventListener('click',next);
  document.getElementById('prev').addEventListener('click',prev);
  document.getElementById('full').addEventListener('click',full);
  if(navToggle){
    navToggle.addEventListener('click',function(e){
      e.stopPropagation();
      nav.classList.toggle('open');
      navToggle.classList.toggle('active',nav.classList.contains('open'));
    });
  }
  document.addEventListener('click',function(e){
    var linked=e.target.closest&&e.target.closest('[data-link]');
    if(linked){
      var u=linked.getAttribute('data-link');
      if(u){
        if(u.indexOf('slide:')===0){
          var sid=u.slice(6);
          var newIdx=-1;
          for(var i=0;i<slides.length;i++){if(slides[i].id===sid){newIdx=i;break;}}
          if(newIdx>=0){transitionTo(newIdx,newIdx>idx?1:-1);}
        } else {
          if(!/^https?:\\/\\//i.test(u)) u='https://'+u;
          // Modifier/middle click opens a new tab; plain click navigates in-place
          // so the browser back button returns to the current slide.
          if(e.ctrlKey||e.metaKey||e.shiftKey||e.button===1){
            window.open(u,'_blank','noopener');
          } else {
            location.href=u;
          }
        }
      }
      e.stopPropagation();
      return;
    }
    if(e.target.closest('.hud')||e.target.closest('.slide-nav')||e.target.closest('.nav-toggle')) return;
    if(e.target.tagName==='VIDEO' && e.target.controls) return;
    next();
  });
  window.addEventListener('resize',fit);
  var h=parseInt((location.hash||'').replace('#',''),10);
  if(h&&h>=1&&h<=slides.length) idx=h-1;
  renderWhenFontsReady();
})();
</script>
</body>
</html>`;

  function uid(prefix) {
    return prefix + '_' + Math.random().toString(36).slice(2, 9);
  }

  // ---------- Visual effect helpers ----------
  function colorWithAlpha(color, opacity) {
    const rgba = cssColorToRgba(color);
    const alpha = clamp01(opacity == null ? 1 : Number(opacity));
    if (!rgba) return color || '#ffffff';
    return 'rgba(' + rgba.r + ', ' + rgba.g + ', ' + rgba.b + ', ' + clamp01(rgba.a * alpha) + ')';
  }

  function strokePaint(stroke) {
    return colorWithAlpha((stroke && stroke.color) || '#ffffff', stroke && stroke.opacity != null ? stroke.opacity : 1);
  }

  // Build the CSS border value for an element's stroke (rect/circle/text bg).
  // Returns '' when no stroke is configured.
  function strokeBorder(stroke) {
    if (!stroke || !stroke.width) return '';
    const style = stroke.style || 'solid';
    const color = strokePaint(stroke);
    return stroke.width + 'px ' + style + ' ' + color;
  }
  // Box-shadow string for non-text elements.
  function boxShadowStr(shadow) {
    if (!shadow) return '';
    return (shadow.x || 0) + 'px ' + (shadow.y || 0) + 'px ' +
      Math.max(0, shadow.blur || 0) + 'px ' + (shadow.color || 'rgba(0,0,0,0.4)');
  }
  // Filter drop-shadow for transparency-aware media (image/video/linkcard).
  function dropShadowFilter(shadow) {
    if (!shadow) return '';
    return 'drop-shadow(' + (shadow.x || 0) + 'px ' + (shadow.y || 0) + 'px ' +
      Math.max(0, shadow.blur || 0) + 'px ' + (shadow.color || 'rgba(0,0,0,0.4)') + ')';
  }
  function applyMediaCropStyle(node, el) {
    if (!node || !el) return;
    if (!el.cropApplied) {
      node.style.objectPosition = '50% 50%';
      node.style.transform = '';
      node.style.transformOrigin = '';
      return;
    }
    const x = Math.max(-100, Math.min(100, Number(el.cropX || 0)));
    const y = Math.max(-100, Math.min(100, Number(el.cropY || 0)));
    const zoom = Math.max(1, Math.min(6, Number(el.cropZoom || 1)));
    node.style.objectPosition = (50 + x / 2) + '% ' + (50 + y / 2) + '%';
    if (zoom !== 1) {
      node.style.transform = 'scale(' + zoom + ')';
      node.style.transformOrigin = 'center center';
    }
  }

  function mediaFit(el) {
    return el && el.aspectLocked ? (el.fit || 'cover') : 'fill';
  }

  function decodeHtmlEntities(text) {
    if (!text) return '';
    const t = document.createElement('textarea');
    t.innerHTML = String(text);
    return t.value;
  }

  function extractSvgDataUrl(text) {
    if (!text) return '';
    const raw = String(text);
    const match = raw.match(/data:image\/svg\+xml(?:;charset=[^;,]+)?(?:;base64)?,([^"'\s>)]+)/i);
    if (!match) return '';
    try {
      const whole = match[0];
      const payload = match[1];
      if (/;base64,/i.test(whole)) return atob(payload);
      return decodeURIComponent(decodeHtmlEntities(payload));
    } catch (_) { return ''; }
  }

  function buildInlineVector(el) {
    const svg = extractSvgMarkup(el.svg) || extractSvgMarkup(el.src) || '';
    if (!svg) return null;
    const wrap = document.createElement('div');
    wrap.className = 'vector-inline';
    wrap.innerHTML = svg;
    const svgNode = wrap.querySelector('svg');
    if (!svgNode) return null;
    svgNode.setAttribute('width', '100%');
    svgNode.setAttribute('height', '100%');
    const fit = el && el.aspectLocked ? (el.fit || 'contain') : 'fill';
    svgNode.setAttribute('preserveAspectRatio', fit === 'fill' ? 'none' : (fit === 'cover' ? 'xMidYMid slice' : 'xMidYMid meet'));
    return wrap;
  }
  let cropDraft = null;

  function isCroppable(el) {
    return el && (el.type === 'image' || el.type === 'vector');
  }

  function defaultCropRect() {
    return { x: 10, y: 10, w: 80, h: 80 };
  }

  function clampCropRect(r) {
    const out = {
      x: Math.max(0, Math.min(100, Number(r.x || 0))),
      y: Math.max(0, Math.min(100, Number(r.y || 0))),
      w: Math.max(5, Math.min(100, Number(r.w || 100))),
      h: Math.max(5, Math.min(100, Number(r.h || 100))),
    };
    if (out.x + out.w > 100) out.x = 100 - out.w;
    if (out.y + out.h > 100) out.y = 100 - out.h;
    return out;
  }
  // Text-shadow for text elements.
  function textShadowStr(shadow) {
    if (!shadow) return '';
    return (shadow.x || 0) + 'px ' + (shadow.y || 0) + 'px ' +
      Math.max(0, shadow.blur || 0) + 'px ' + (shadow.color || 'rgba(0,0,0,0.4)');
  }

  function applyTextCaseValue(text, mode) {
    const value = String(text == null ? '' : text);
    if (mode === 'uppercase') return value.toUpperCase();
    if (mode === 'lowercase') return value.toLowerCase();
    if (mode === 'capitalize') return value.replace(/\S+/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
    return value;
  }

  function editablePlainText(node) {
    if (!node) return '';
    const clone = node.cloneNode(true);
    clone.querySelectorAll('br').forEach(br => br.replaceWith(document.createTextNode('\n')));
    clone.querySelectorAll('div, p').forEach(block => {
      if (block.previousSibling) block.parentNode.insertBefore(document.createTextNode('\n'), block);
      if (block.nextSibling) block.parentNode.insertBefore(document.createTextNode('\n'), block.nextSibling);
    });
    return (clone.textContent || '').replace(/\n{3,}/g, '\n\n').replace(/^\n+|\n+$/g, '');
  }

  function maybeReleaseForcedTextCase(el, text) {
    if (!el || !el.textCase || el.textCase === 'none') return;
    if (/[a-z]/.test(String(text || ''))) el.textCase = 'none';
  }

  function clearParagraphGapNodes(root) {
    if (!root) return;
    root.querySelectorAll('br, div, p').forEach(node => {
      node.style.removeProperty('margin-bottom');
      node.style.removeProperty('margin-top');
      node.style.removeProperty('display');
      if (!node.getAttribute('style')) node.removeAttribute('style');
    });
  }

  function syncEditingTextBox(el, ce, patch) {
    if (!el || !ce) return;
    const node = ce.closest('.el');
    if (!node) return;
    node.style.left = el.x + 'px';
    node.style.top = el.y + 'px';
    node.style.width = el.w + 'px';
    node.style.height = el.h + 'px';
    node.style.fontFamily = resolveFontFamily(el.font);
    node.style.fontSize = el.fontSize + 'px';
    node.style.fontWeight = String(el.fontWeight);
    node.style.fontStyle = el.fontStyle || 'normal';
    node.style.fontSynthesis = 'none';
    node.style.letterSpacing = (el.letterSpacing || 0) + 'px';
    node.style.fontStretch = (el.fontStretch || 100) + '%';
    node.style.lineHeight = String(el.lineHeight != null ? el.lineHeight : 1.3);
    node.style.color = el.color;
    node.style.background = el.bg || '';
    node.style.textAlign = el.align;
    const VALIGN = { top: 'flex-start', center: 'center', bottom: 'flex-end' };
    node.style.alignItems = VALIGN[el.verticalAlign || 'center'] || 'center';
    const editing = ce.isContentEditable;
    node.style.textTransform = editing ? '' : (el.textCase && el.textCase !== 'none' ? el.textCase : '');
    ce.style.lineHeight = String(el.lineHeight != null ? el.lineHeight : 1.3);
    ce.style.textTransform = editing ? '' : (el.textCase && el.textCase !== 'none' ? el.textCase : '');
    const decos = [];
    if (el.underline) decos.push('underline');
    if (el.strikethrough) decos.push('line-through');
    ce.style.textDecoration = decos.join(' ');
    ce.style.textUnderlineOffset = el.underline
      ? ((el.underlineOffset != null ? el.underlineOffset : 3) + 'px')
      : '';
    const stretch = (el.fontStretch || 100) / 100;
    if (stretch !== 1) {
      const ORIGIN = { left: 'left', center: 'center', right: 'right', justify: 'left' };
      ce.style.transformOrigin = (ORIGIN[el.align] || 'left') + ' center';
      ce.style.transform = 'scaleX(' + stretch + ')';
    } else {
      ce.style.transform = '';
    }
    if (patch && Object.prototype.hasOwnProperty.call(patch, 'html') && ce.innerHTML !== el.html) {
      ce.innerHTML = el.html || escapeHtml(el.text || '');
    }
    if (patch && Object.prototype.hasOwnProperty.call(patch, 'paragraphSpacing')) {
      clearParagraphGapNodes(ce);
    }
    applyDefaultBrMargin(ce, el.paragraphSpacing || 0);
  }

  // Apply paragraph spacing to <br> elements within the saved selection.
  // Returns true on success; otherwise caller falls back to element-wide.
  function applyParagraphSpacingToSelection(spacing) {
    if (!state.editingElementId) return false;
    // Capture the focused Properties control so we can restore it after
    // restoreSelection() steals focus to the editable.
    const previouslyFocused = document.activeElement;
    const propsPanel = document.getElementById('propertiesPanel');
    const restoreFocusTarget = propsPanel && propsPanel.contains(previouslyFocused) ? previouslyFocused : null;
    let inputSelStart = null, inputSelEnd = null, inputSelDir = null;
    if (restoreFocusTarget && 'selectionStart' in restoreFocusTarget) {
      try {
        inputSelStart = restoreFocusTarget.selectionStart;
        inputSelEnd = restoreFocusTarget.selectionEnd;
        inputSelDir = restoreFocusTarget.selectionDirection;
      } catch (_) {}
    }
    function restoreInputFocus() {
      if (!restoreFocusTarget || !restoreFocusTarget.isConnected) return;
      if (typeof restoreFocusTarget.focus !== 'function') return;
      if (document.activeElement === restoreFocusTarget) return;
      try {
        restoreFocusTarget.focus({ preventScroll: true });
        if (inputSelStart != null && 'setSelectionRange' in restoreFocusTarget) {
          restoreFocusTarget.setSelectionRange(inputSelStart, inputSelEnd, inputSelDir || 'none');
        }
      } catch (_) {}
    }

    if (!restoreSelection() && !isInsideEditableText()) {
      restoreInputFocus();
      return false;
    }
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) { restoreInputFocus(); return false; }
    const range = sel.getRangeAt(0);
    if (range.collapsed) { restoreInputFocus(); return false; }
    const ce = document.querySelector('[contenteditable="true"][data-edit-id="' + state.editingElementId + '"]');
    if (!ce) { restoreInputFocus(); return false; }
    let modified = false;
    const px = (spacing || 0) + 'px';
    ce.querySelectorAll('br').forEach(br => {
      if (range.intersectsNode(br)) {
        br.style.display = 'block';
        br.style.marginBottom = px;
        modified = true;
      }
    });
    ce.querySelectorAll('div, p').forEach(b => {
      if (!range.intersectsNode(b)) return;
      let prev = b.previousSibling;
      while (prev && prev.nodeType === 3 && !prev.textContent.trim()) prev = prev.previousSibling;
      if (prev) {
        b.style.marginTop = px;
        modified = true;
        return;
      }
      let next = b.nextSibling;
      while (next && next.nodeType === 3 && !next.textContent.trim()) next = next.nextSibling;
      if (next && next.nodeType === 1 && /^(DIV|P)$/i.test(next.tagName)) {
        next.style.marginTop = px;
        modified = true;
      }
    });
    if (!modified) { restoreInputFocus(); return false; }
    restoreInputFocus();
    const slide = getCurrentSlide();
    const el = slide && slide.elements.find(e => e.id === state.editingElementId);
    if (el) {
      recordHistory();
      el.html = ce.innerHTML;
      el.text = editablePlainText(ce);
      maybeReleaseForcedTextCase(el, el.text);
      autoSizeTextElement(el);
      syncEditingTextBox(el, ce, { html: el.html });
      renderSlidesList();
      persist();
    }
    if (restoreFocusTarget) setTimeout(restoreInputFocus, 0);
    return true;
  }

  // Track selection continuously while a contenteditable is focused. Also
  // schedule a Properties re-render so the typography controls (Weight,
  // Size, Color, Underline, etc.) reflect the *resolved* style at the new
  // caret/selection — i.e., when the cursor lands inside a span with a
  // local font-weight or color, the panel snaps to that value instead of
  // showing the element-wide default. Debounced via rAF so dragging a
  // selection across long text doesn't cause render thrash.
  // Counter for active button presses inside the Properties panel. While > 0
  // we suppress selection-driven Properties re-renders so an in-flight
  // mousedown/mouseup pair on a swatch (or any other panel button) doesn't
  // get its element destroyed mid-interaction — which would prevent the
  // click handler from firing at all and silently swallow the user action.
  let propsButtonPressDepth = 0;
  function beginPropsButtonInteraction() { propsButtonPressDepth++; }
  function endPropsButtonInteraction() {
    propsButtonPressDepth = Math.max(0, propsButtonPressDepth - 1);
  }
  // Hard-reset the counter once mouse is released anywhere — runs after the
  // click handler so the apply chain still benefits from re-render
  // suppression. Using setTimeout 0 to land in the macrotask AFTER click.
  document.addEventListener('mouseup', () => {
    if (propsButtonPressDepth > 0) {
      setTimeout(() => { propsButtonPressDepth = 0; }, 0);
    }
  }, true);

  let activeStyleSyncRaf = 0;
  function scheduleActiveStyleSync() {
    if (activeStyleSyncRaf) return;
    activeStyleSyncRaf = requestAnimationFrame(() => {
      activeStyleSyncRaf = 0;
      if (!state.editingElementId) return;
      // Skip whenever the user is currently interacting with the Properties
      // panel — focus inside it, OR an active button press in flight.
      // Re-creating the panel mid-interaction yanks focus and (worse) for a
      // mousedown'd button, the click event won't fire because the original
      // element is destroyed before mouseup lands. The selection-driven
      // refresh is only useful when the caret is actually moving inside the
      // editable.
      if (propsButtonPressDepth > 0) return;
      const ae = document.activeElement;
      const props = document.getElementById('propertiesPanel');
      if (ae && props && props.contains(ae)) return;
      renderProperties();
    });
  }
  document.addEventListener('selectionchange', () => {
    if (!state.editingElementId) return;
    captureSelection();
    scheduleActiveStyleSync();
  });

  // ---------- Inline text selection tracking ----------
  // Saved selection range while editing; lets Properties panel controls apply
  // styles to whatever the user had selected before clicking the control.
  let savedSelection = null;
  // Pinned range captured at the start of a Properties-button mousedown.
  // Survives Properties panel re-renders that destroy the original button —
  // when the click handler eventually runs (on whatever button replaces the
  // original), this range is consumed to re-seat savedSelection so the
  // selection-aware apply still targets the user's original highlight.
  let pinnedSelectionRange = null;
  function captureRangeForButton() {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const r = sel.getRangeAt(0);
      if (!r.collapsed) {
        const node = r.commonAncestorContainer;
        const elNode = node.nodeType === 1 ? node : node.parentElement;
        if (elNode && elNode.closest && elNode.closest('[contenteditable="true"]')) {
          pinnedSelectionRange = r.cloneRange();
          return;
        }
      }
    }
    if (savedSelection) pinnedSelectionRange = savedSelection.cloneRange();
  }
  function consumePinnedRange() {
    if (pinnedSelectionRange) {
      savedSelection = pinnedSelectionRange;
      pinnedSelectionRange = null;
    }
  }

  function isInsideEditableText() {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return false;
    const range = sel.getRangeAt(0);
    const node = range.commonAncestorContainer;
    const elNode = node.nodeType === 1 ? node : node.parentElement;
    return !!(elNode && elNode.closest && elNode.closest('[contenteditable="true"]'));
  }

  function captureSelection() {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) {
      // No selection at all — keep savedSelection in case it was set earlier
      // (e.g., user dragged a selection then focused a Properties input).
      return;
    }
    const range = sel.getRangeAt(0);
    // Selection moved out of any contenteditable (e.g. user clicked a
    // Properties control). Keep the last non-collapsed range so controls
    // can still apply to it.
    if (!isInsideEditableText()) return;
    // Collapsed range inside the editable. Only treat it as an "intentional
    // caret move" (and clear savedSelection) if the editable actually has
    // focus. Otherwise the collapse is an artifact of the user clicking a
    // Properties button that incidentally collapsed the document selection,
    // and we must preserve savedSelection so the button's onChange can apply
    // selection-aware styling.
    if (range.collapsed) {
      const ae = document.activeElement;
      if (ae && ae.isContentEditable) savedSelection = null;
      return;
    }
    savedSelection = range.cloneRange();
  }

  function restoreSelection() {
    if (!savedSelection) return false;
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(savedSelection);
    return true;
  }

  function editableForRange(range) {
    if (!range) return null;
    const node = range.commonAncestorContainer;
    const elNode = node.nodeType === 1 ? node : node.parentElement;
    const ce = elNode && elNode.closest && elNode.closest('[contenteditable="true"]');
    if (!ce) return null;
    if (state.editingElementId && ce.getAttribute('data-edit-id') !== state.editingElementId) return null;
    return ce;
  }

  function rangeCoversEditable(range, ce) {
    if (!range || !ce) return false;
    const full = document.createRange();
    full.selectNodeContents(ce);
    try {
      return range.compareBoundaryPoints(Range.START_TO_START, full) <= 0 &&
        range.compareBoundaryPoints(Range.END_TO_END, full) >= 0;
    } catch (e) {
      return false;
    } finally {
      full.detach && full.detach();
    }
  }

  // Resolve the *effective* text style at the current caret/selection inside
  // an editable text element. Used to seed the Properties panel controls so
  // they reflect what's actually applied at the cursor — e.g. when the caret
  // is inside a `<span style="font-weight: 700">` run, the Weight slider
  // shows 700 instead of the element-wide default. Returns null when there's
  // no live editing context (panel falls back to element-wide values).
  function getActiveTextStyle(el) {
    if (!el || el.type !== 'text') return null;
    if (state.editingElementId !== el.id) return null;
    const ce = document.querySelector('[contenteditable="true"][data-edit-id="' + el.id + '"]');
    if (!ce) return null;
    // Prefer the live selection's start node; fall back to the savedSelection
    // (set when the user moved focus to a Properties control without clicking
    // back into the text). Either way we want the resolved CSS at the spot
    // the user was last working with.
    let node = null;
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      const startEl = range.startContainer.nodeType === 3 ? range.startContainer.parentElement : range.startContainer;
      if (startEl && ce.contains(startEl)) node = startEl;
    }
    if (!node && savedSelection) {
      const startEl = savedSelection.startContainer.nodeType === 3 ? savedSelection.startContainer.parentElement : savedSelection.startContainer;
      if (startEl && ce.contains(startEl)) node = startEl;
    }
    if (!node) return null;
    const cs = getComputedStyle(node);
    // Walk ancestors to derive flags that getComputedStyle smears (e.g.
    // text-decoration cascades but at the leaf it might be 'none' if a child
    // span overrides it).
    let cur = node;
    let underline = false;
    let strike = false;
    while (cur && cur !== ce) {
      const decoLine = (getComputedStyle(cur).textDecorationLine || '');
      if (decoLine.indexOf('underline') >= 0) underline = true;
      if (decoLine.indexOf('line-through') >= 0) strike = true;
      cur = cur.parentElement;
    }
    const fontSizePx = parseFloat(cs.fontSize) || 0;
    const lineHeightCss = cs.lineHeight;
    let lineHeightMul = el.lineHeight != null ? el.lineHeight : 1.3;
    if (lineHeightCss && lineHeightCss !== 'normal') {
      const lhPx = parseFloat(lineHeightCss);
      if (lhPx > 0 && fontSizePx > 0) lineHeightMul = lhPx / fontSizePx;
    }
    return {
      fontWeight: parseInt(cs.fontWeight, 10) || el.fontWeight || 400,
      fontSize: Math.round(fontSizePx) || el.fontSize || 32,
      letterSpacing: parseFloat(cs.letterSpacing) || 0,
      lineHeight: parseFloat(lineHeightMul.toFixed(2)),
      color: cs.color,
      backgroundColor: cs.backgroundColor === 'rgba(0, 0, 0, 0)' ? '' : cs.backgroundColor,
      fontStyle: cs.fontStyle || 'normal',
      textTransform: cs.textTransform || 'none',
      underline: underline,
      strikethrough: strike,
    };
  }

  // Apply CSS style props to the saved or current selection by wrapping it
  // in a <span> with the styles. Returns true if applied. Empty/collapsed
  // selections fall through so callers apply element-wide.
  function applyStyleToSelection(styleObj) {
    if (!state.editingElementId) return false;
    // CAPTURE BEFORE restoreSelection — restoreSelection() calls sel.addRange,
    // which moves focus to the contenteditable. If we captured after, we'd be
    // recording the editable as "previouslyFocused" and lose the actual input
    // the user was typing into.
    const previouslyFocused = document.activeElement;
    const propsPanel = document.getElementById('propertiesPanel');
    const restoreFocusTarget = propsPanel && propsPanel.contains(previouslyFocused) ? previouslyFocused : null;
    let inputSelStart = null, inputSelEnd = null, inputSelDir = null;
    if (restoreFocusTarget && 'selectionStart' in restoreFocusTarget) {
      try {
        inputSelStart = restoreFocusTarget.selectionStart;
        inputSelEnd = restoreFocusTarget.selectionEnd;
        inputSelDir = restoreFocusTarget.selectionDirection;
      } catch (_) {}
    }
    function restoreInputFocus() {
      if (!restoreFocusTarget || !restoreFocusTarget.isConnected) return;
      if (typeof restoreFocusTarget.focus !== 'function') return;
      if (document.activeElement === restoreFocusTarget) return;
      try {
        restoreFocusTarget.focus({ preventScroll: true });
        if (inputSelStart != null && 'setSelectionRange' in restoreFocusTarget) {
          restoreFocusTarget.setSelectionRange(inputSelStart, inputSelEnd, inputSelDir || 'none');
        }
      } catch (_) {}
    }

    if (!restoreSelection() && !isInsideEditableText()) {
      restoreInputFocus();
      return false;
    }
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) { restoreInputFocus(); return false; }
    const range = sel.getRangeAt(0);
    if (range.collapsed) { restoreInputFocus(); return false; }
    const ce = editableForRange(range);
    if (!ce) { restoreInputFocus(); return false; }
    // If the entire text box is selected, treat it as an element-wide change.
    // This prevents the initial auto-select in edit mode from trapping font
    // changes inside spans while el.font remains unchanged.
    if (rangeCoversEditable(range, ce)) { restoreInputFocus(); return false; }

    const span = document.createElement('span');
    Object.keys(styleObj).forEach(k => {
      const v = styleObj[k];
      if (v == null || v === '') return;
      span.style[k] = v;
    });
    if (!span.getAttribute('style')) return false;

    try {
      span.appendChild(range.extractContents());
      range.insertNode(span);
      const newRange = document.createRange();
      newRange.selectNodeContents(span);
      sel.removeAllRanges();
      sel.addRange(newRange);
      savedSelection = newRange.cloneRange();
    } catch (e) { restoreInputFocus(); return false; }

    // Synchronously yank focus back BEFORE any other work runs. sel.addRange
    // above handed focus to the contenteditable; if the user is auto-typing
    // (holding a key) the next keydown could fire before a setTimeout 0
    // would, sending the keystroke into the text content. Doing this sync
    // closes the race window entirely.
    restoreInputFocus();

    // Persist HTML back to the element
    const slide = getCurrentSlide();
    const el = slide && slide.elements.find(e => e.id === state.editingElementId);
    if (el) {
      if (ce) {
        recordHistory();
        el.html = ce.innerHTML;
        el.text = editablePlainText(ce);
        maybeReleaseForcedTextCase(el, el.text);
        autoSizeTextElement(el);
        syncEditingTextBox(el, ce, { html: el.html });
        renderSlidesList();
        persist();
      }
    }

    // Backup: in case any of the persistence work above re-stole focus (rare
    // but possible if a side-effect re-renders something), schedule another
    // restore as a setTimeout 0.
    if (restoreFocusTarget) setTimeout(restoreInputFocus, 0);
    return true;
  }

  // Strip a specific inline CSS property from every descendant of an HTML
  // string. Used when applying an element-wide typography change so spans
  // left behind by prior selection-based edits don't shadow the new value.
  // Walk every element with an inline style and clamp any out-of-range
  // typography values (and remove empty span / span-of-spans cruft from
  // accumulated drag operations). Returns the sanitized html string, or
  // the original if untouched. Without this, exported slides can carry
  // hundreds of nested spans with intermediate slider values that render
  // inconsistently across browsers and bloat the output.
  function sanitizeTextHtml(htmlString) {
    if (!htmlString) return htmlString;
    const tmp = document.createElement('div');
    tmp.innerHTML = htmlString;
    let touched = false;
    tmp.querySelectorAll('[style]').forEach(node => {
      const fw = node.style.fontWeight;
      if (fw) {
        const n = parseFloat(fw);
        if (!isNaN(n)) {
          const clamped = Math.max(100, Math.min(900, Math.round(n / 10) * 10));
          if (clamped !== n) {
            node.style.fontWeight = String(clamped);
            touched = true;
          }
        }
      }
      const fs = node.style.fontStretch;
      if (fs) {
        const n = parseFloat(fs);
        if (!isNaN(n)) {
          const clamped = Math.max(25, Math.min(200, Math.round(n)));
          if (clamped + '%' !== fs && clamped !== n) {
            node.style.fontStretch = clamped + '%';
            touched = true;
          }
        }
      }
      const lh = node.style.lineHeight;
      if (lh) {
        const n = parseFloat(lh);
        if (!isNaN(n)) {
          const clamped = Math.max(0.1, Math.min(3, parseFloat(n.toFixed(2))));
          if (clamped !== n) {
            node.style.lineHeight = String(clamped);
            touched = true;
          }
        }
      }
    });
    // Collapse same-property nested spans (e.g. font-weight 700 inside font-
    // weight 700) — only outermost meaningful style matters for the visible
    // text, and the inner duplicates just bloat the html.
    tmp.querySelectorAll('span[style]').forEach(span => {
      const child = span.firstElementChild;
      if (!child || child.nextSibling || child.tagName !== 'SPAN') return;
      // Only one child, also a span. If both have only the same style key,
      // unwrap the outer.
      const a = span.getAttribute('style') || '';
      const b = child.getAttribute('style') || '';
      if (a === b) {
        // Replace the outer span with its inner span (same effect).
        span.replaceWith(child);
        touched = true;
      }
    });
    // Drop fully-empty spans that have no text and no useful styles.
    tmp.querySelectorAll('span').forEach(span => {
      if (!span.firstChild && !span.attributes.length) {
        span.remove();
        touched = true;
      }
    });
    return touched ? tmp.innerHTML : htmlString;
  }

  function clearInlineStyleFromHtml(htmlString, cssProperty) {
    if (!htmlString) return htmlString;
    const tmp = document.createElement('div');
    tmp.innerHTML = htmlString;
    tmp.querySelectorAll('[style]').forEach(node => {
      const props = Array.isArray(cssProperty) ? cssProperty : [cssProperty];
      props.forEach(p => node.style.removeProperty(p));
      if (!node.getAttribute('style')) node.removeAttribute('style');
    });
    // Unwrap now-empty <span> elements (no attributes left after stripping).
    tmp.querySelectorAll('span').forEach(span => {
      if (span.attributes.length === 0) {
        while (span.firstChild) span.parentNode.insertBefore(span.firstChild, span);
        span.remove();
      }
    });
    return tmp.innerHTML;
  }

  // Build an updateElement patch that also strips conflicting inline styles
  // from el.html so the element-wide change wins over prior span overrides.
  function buildTextPatch(el, patch, cssProps) {
    const out = Object.assign({}, patch);
    if (el.html && cssProps && cssProps.length) {
      const cleaned = clearInlineStyleFromHtml(el.html, cssProps);
      if (cleaned !== el.html) out.html = cleaned;
    }
    return out;
  }

  // Reset paragraph-gap margins set by prior selection-based applies so the
  // element-wide value can re-take effect on next render.
  function clearParagraphGapsFromHtml(htmlString) {
    if (!htmlString) return htmlString;
    const tmp = document.createElement('div');
    tmp.innerHTML = htmlString;
    clearParagraphGapNodes(tmp);
    return tmp.innerHTML;
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/\n/g, '<br>');
  }

  // Apply paragraph-gap margin to line-break carriers (<br>) and to block
  // descendants that browsers create when Enter is pressed in contenteditable
  // (Chrome: <div>, some browsers: <p>). Skips elements with an inline
  // override so per-line customizations survive.
  function applyDefaultBrMargin(container, defaultPx) {
    if (!container) return;
    const gap = defaultPx || 0;
    // Only force `<br>` to display:block when there's an actual paragraph gap
    // to apply. With gap = 0, the inline-replaced `<br>` reliably produces a
    // line break in every renderer (including print). Forcing display:block
    // with margin-bottom: 0 was a no-op visually but caused some print engines
    // to drop the line break, merging adjacent lines into a single paragraph.
    if (gap > 0) {
      const px = gap + 'px';
      container.querySelectorAll('br').forEach(br => {
        if (br.style.marginBottom) return;
        br.style.display = 'block';
        br.style.marginBottom = px;
      });
      // Top-margin every block-paragraph except the first sibling.
      container.querySelectorAll('div, p').forEach(b => {
        if (b.style.marginTop) return;
        let prev = b.previousSibling;
        while (prev && prev.nodeType === 3 && !prev.textContent.trim()) prev = prev.previousSibling;
        if (!prev) return;
        b.style.marginTop = px;
      });
    }
  }

  // Common defaults shared by all element types ??extracted so adding a new
  // property in one place propagates to every factory.
  const COMMON_DEFAULTS = {
    opacity: 1,
    locked: false,
    hidden: false,
    stroke: null,    // { width, color, style: 'solid'|'dashed'|'dotted' }
    shadow: null,    // { x, y, blur, color }
  };

  function withCommon(obj) {
    return Object.assign({}, COMMON_DEFAULTS, obj);
  }

  function textEl(props) {
    return Object.assign(withCommon({
      id: uid('el'),
      type: 'text',
      x: 100, y: 100, w: 400, h: 80,
      text: 'Text',
      html: '',
      font: 'sans',
      fontSize: 32,
      fontWeight: 400,
      fontStyle: 'normal',
      letterSpacing: 0,
      fontStretch: 100,
      lineHeight: 1.3,
      paragraphSpacing: 0,
      color: '#ffffff',
      bg: '',
      align: 'left',
      verticalAlign: 'center',
      underline: false,
      underlineOffset: 3,
      strikethrough: false,
      textCase: 'none',
      hover: 'none',
      motion: 'none',
      hoverStrength: 1,
      motionStrength: 1,
      link: '',
    }), props);
  }

  function shapeEl(type, props) {
    return Object.assign(withCommon({
      id: uid('el'),
      type: type,
      x: 200, y: 200, w: 200, h: 200,
      fill: '#ffffff',
      fillEnabled: true,
      radius: type === 'rect' ? 4 : 0,
      hover: 'none',
      motion: 'none',
      hoverStrength: 1,
      motionStrength: 1,
      link: '',
    }), props);
  }

  function lineEl(props) {
    return Object.assign(withCommon({
      id: uid('el'),
      type: 'line',
      x: 240, y: 358, w: 800, h: 4,
      fill: '#ffffff',
      rotation: 0,
      hover: 'none',
      motion: 'none',
      hoverStrength: 1,
      motionStrength: 1,
      link: '',
    }), props);
  }

  function imageEl(src, props) {
    return Object.assign(withCommon({
      id: uid('el'),
      type: 'image',
      x: 240, y: 160, w: 800, h: 400,
      src: src || '',
      fit: 'cover',
      cropX: 0,
      cropY: 0,
      cropZoom: 1,
      cropApplied: false,
      aspectRatio: null,
      aspectLocked: false,
      radius: 0,
      hover: 'none',
      motion: 'none',
      hoverStrength: 1,
      motionStrength: 1,
      link: '',
    }), props);
  }

  function vectorEl(svg, props) {
    return Object.assign(imageEl(svgToDataUrl(svg || '<svg xmlns="http://www.w3.org/2000/svg"/>'), {
      type: 'vector',
      svg: svg || '',
      fit: 'contain',
      cropX: 0,
      cropY: 0,
      cropZoom: 1,
      cropApplied: false,
      aspectRatio: null,
      aspectLocked: true,
    }), props);
  }

  function imageBannerEl(images, props) {
    return Object.assign(withCommon({
      id: uid('el'),
      type: 'imageBanner',
      x: 240, y: 160, w: 800, h: 360,
      images: images || [],
      fit: 'cover',
      cropX: 0,
      cropY: 0,
      cropZoom: 1,
      cropApplied: false,
      aspectRatio: null,
      aspectLocked: false,
      radius: 0,
      interval: 2800,
      fadeMs: 350,
      transition: 'fade',
      hover: 'none',
      motion: 'none',
      hoverStrength: 1,
      motionStrength: 1,
      link: '',
    }), props);
  }

  function videoEl(src, props) {
    return Object.assign(withCommon({
      id: uid('el'),
      type: 'video',
      x: 240, y: 160, w: 800, h: 450,
      src: src || '',
      poster: '',
      fit: 'cover',
      cropX: 0,
      cropY: 0,
      cropZoom: 1,
      cropApplied: false,
      aspectRatio: null,
      aspectLocked: false,
      radius: 0,
      autoplay: true,
      loop: true,
      muted: true,
      controls: false,
      hover: 'none',
      motion: 'none',
      hoverStrength: 1,
      motionStrength: 1,
      link: '',
    }), props);
  }

  function linkcardEl(url, props) {
    return Object.assign(withCommon({
      id: uid('el'),
      type: 'linkcard',
      x: 320, y: 180, w: 640, h: 360,
      image: '',
      hover: 'hover-lift',
      motion: 'none',
      hoverStrength: 1,
      motionStrength: 1,
      link: url || '',
    }), props);
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

  // WordPress mShots ??free, no API key, returns a live screenshot of the URL.
  // First request kicks off rendering and may return a placeholder; the
  // screenshot becomes available within ~10-30s and is then cached.
  function screenshotUrl(url, opts) {
    const target = normalizeUrl(url);
    if (!target) return '';
    let q = '?w=1024';
    if (opts && opts.bust) q += '&_=' + Date.now();
    return 'https://s0.wp.com/mshots/v1/' + encodeURIComponent(target) + q;
  }

  function applyCornerStyle(node, el) {
    if (el.type !== 'rect') return;
    node.style.borderRadius = effectiveRadius(el) + 'px';
  }

  function maxElementRadius(el) {
    if (!el) return 400;
    return Math.max(0, Math.floor(Math.min(el.w || 0, el.h || 0) / 2));
  }

  function effectiveRadius(el) {
    return Math.max(0, Math.min(maxElementRadius(el), Math.round(el && el.radius || 0)));
  }

  function radiusPatch(el, value) {
    return { radius: Math.max(0, Math.min(maxElementRadius(el), Math.round(value))) };
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
      bg: '#000000',
      bgImage: '',
      layout: layout,
      hidden: false,
      transition: 'scrollVertical',
      transitionMs: 650,
      elements: LAYOUTS[layout].elements(),
    };
  }

  // ---------- State ----------
  const DEFAULT_GRID = {
    enabled: false,
    cols: 12,
    colGutter: 24,
    colMargin: 64,
    rows: 6,
    rowGutter: 24,
    rowMargin: 48,
    color: '#ff3d8c',
    opacity: 0.08,
  };

  const DEFAULT_GUIDES = {
    enabled: true,
    color: '#00d1ff',
    items: [],
  };

  const state = {
    slides: [],
    currentSlideId: null,
    selectedElementIds: new Set(),
    editingElementId: null,
    canvasW: 1280,
    canvasH: 720,
    grid: Object.assign({}, DEFAULT_GRID),
    guides: Object.assign({}, DEFAULT_GUIDES, { items: [] }),
    zoom: null, // null = auto-fit, otherwise number (1.0 = 100%)
    cropElementId: null,
  };
  let currentProjectLibraryId = null;

  // Backward-compatible alias: existing code reads/writes state.selectedElementId
  // as a single id; we map it to the Set so multi-select features can read all
  // selected ids via state.selectedElementIds while old code keeps working.
  Object.defineProperty(state, 'selectedElementId', {
    configurable: true,
    enumerable: true,
    get() {
      const it = this.selectedElementIds.values().next();
      return it.done ? null : it.value;
    },
    set(v) {
      this.selectedElementIds.clear();
      if (v) this.selectedElementIds.add(v);
    },
  });

  // ---------- Selection helpers ----------
  function getSelectedIds() { return Array.from(state.selectedElementIds); }
  function isSelected(id) { return state.selectedElementIds.has(id); }
  function selectClear() { state.selectedElementIds.clear(); }
  function selectOnly(id) {
    state.selectedElementIds.clear();
    if (id) state.selectedElementIds.add(id);
  }
  function selectToggle(id) {
    if (state.selectedElementIds.has(id)) state.selectedElementIds.delete(id);
    else state.selectedElementIds.add(id);
  }
  function getSelectedElements() {
    const slide = getCurrentSlide();
    if (!slide) return [];
    return slide.elements.filter(el => state.selectedElementIds.has(el.id));
  }
  function elementLabel(el, index) {
    if (!el) return 'Element';
    if (el.name) return el.name;
    if (el.type === 'text') {
      const txt = (el.text || '').replace(/\s+/g, ' ').trim();
      if (txt) return txt.slice(0, 32);
    }
    const names = {
      rect: 'Rectangle',
      circle: 'Circle',
      line: 'Line',
      image: 'Image',
      vector: 'Vector',
      imageBanner: 'Banner',
      video: 'Video',
      linkcard: 'Link Card',
      text: 'Text',
    };
    return (names[el.type] || 'Element') + (index != null ? ' ' + (index + 1) : '');
  }
  function groupName(groupId) {
    const slide = getCurrentSlide();
    if (!slide || !groupId) return 'Group';
    const first = slide.elements.find(el => el.groupId === groupId && el.groupName);
    return first ? first.groupName : 'Group';
  }
  function idsForElementSelection(id, additive) {
    const slide = getCurrentSlide();
    const el = slide && slide.elements.find(e => e.id === id);
    if (!el || additive || !el.groupId) return [id];
    return slide.elements.filter(e => e.groupId === el.groupId).map(e => e.id);
  }

  let draggingSlideId = null;
  const SIDE_WIDTH_KEY = 'pres-gen-side-w-v1';
  const RIGHT_WIDTH_KEY = 'pres-gen-right-w-v1';
  const CONTENT_HEIGHT_KEY = 'pres-gen-content-h-v1';

  function setupSidebarResizer() {
    const resizer = document.getElementById('resizerLeft');
    if (!resizer) return;
    let startX = 0;
    let startW = 240;
    let dragging = false;

    resizer.addEventListener('mousedown', (e) => {
      e.preventDefault();
      dragging = true;
      startX = e.clientX;
      const cs = getComputedStyle(document.documentElement).getPropertyValue('--side-w');
      startW = parseInt(cs, 10) || 240;
      resizer.classList.add('dragging');
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    });

    document.addEventListener('mousemove', (e) => {
      if (!dragging) return;
      let w = startW + (e.clientX - startX);
      w = Math.max(160, Math.min(560, w));
      document.documentElement.style.setProperty('--side-w', w + 'px');
      fitCanvas();
    });

    document.addEventListener('mouseup', () => {
      if (!dragging) return;
      dragging = false;
      resizer.classList.remove('dragging');
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      try {
        const w = document.documentElement.style.getPropertyValue('--side-w');
        if (w) localStorage.setItem(SIDE_WIDTH_KEY, w);
      } catch (_) {}
    });
  }

  function setupPropertiesResizer() {
    const resizer = document.getElementById('resizerRight');
    if (!resizer) return;
    let startX = 0;
    let startW = 280;
    let dragging = false;

    resizer.addEventListener('mousedown', (e) => {
      e.preventDefault();
      dragging = true;
      startX = e.clientX;
      const cs = getComputedStyle(document.documentElement).getPropertyValue('--right-w');
      startW = parseInt(cs, 10) || 280;
      resizer.classList.add('dragging');
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    });

    document.addEventListener('mousemove', (e) => {
      if (!dragging) return;
      let w = startW - (e.clientX - startX);
      w = Math.max(260, Math.min(620, w));
      document.documentElement.style.setProperty('--right-w', w + 'px');
      fitCanvas();
    });

    document.addEventListener('mouseup', () => {
      if (!dragging) return;
      dragging = false;
      resizer.classList.remove('dragging');
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      try {
        const w = document.documentElement.style.getPropertyValue('--right-w');
        if (w) localStorage.setItem(RIGHT_WIDTH_KEY, w);
      } catch (_) {}
    });
  }

  function restorePropertiesWidth() {
    try {
      const w = localStorage.getItem(RIGHT_WIDTH_KEY);
      if (w) document.documentElement.style.setProperty('--right-w', w);
    } catch (_) {}
  }

  function restoreSidebarWidth() {
    try {
      const w = localStorage.getItem(SIDE_WIDTH_KEY);
      if (w) document.documentElement.style.setProperty('--side-w', w);
    } catch (_) {}
  }

  function setupContentResizer() {
    const resizer = document.getElementById('contentResizer');
    if (!resizer) return;
    let startY = 0;
    let startH = 180;
    let dragging = false;

    resizer.addEventListener('mousedown', (e) => {
      e.preventDefault();
      dragging = true;
      startY = e.clientY;
      const cs = getComputedStyle(document.documentElement).getPropertyValue('--content-h');
      startH = parseInt(cs, 10) || 180;
      resizer.classList.add('dragging');
      document.body.style.cursor = 'row-resize';
      document.body.style.userSelect = 'none';
    });

    document.addEventListener('mousemove', (e) => {
      if (!dragging) return;
      let h = startH - (e.clientY - startY);
      h = Math.max(118, Math.min(Math.round(window.innerHeight * 0.52), h));
      document.documentElement.style.setProperty('--content-h', h + 'px');
      fitCanvas();
    });

    document.addEventListener('mouseup', () => {
      if (!dragging) return;
      dragging = false;
      resizer.classList.remove('dragging');
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      try {
        const h = document.documentElement.style.getPropertyValue('--content-h');
        if (h) localStorage.setItem(CONTENT_HEIGHT_KEY, h);
      } catch (_) {}
    });
  }

  function restoreContentHeight() {
    try {
      const h = localStorage.getItem(CONTENT_HEIGHT_KEY);
      if (h) document.documentElement.style.setProperty('--content-h', h);
    } catch (_) {}
  }

  function syncThumbSizes() {
    if (!els.slidesList) return;
    const thumbs = els.slidesList.querySelectorAll('.slide-thumb');
    if (!thumbs.length) return;
    // Use the slides-list inner content width (excludes padding + scrollbar).
    const list = els.slidesList;
    const cs = getComputedStyle(list);
    const padX = (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0);
    const w = Math.max(0, list.clientWidth - padX);
    if (w <= 0) return;
    const h = w * state.canvasH / state.canvasW;
    const s = w / state.canvasW;
    thumbs.forEach(thumb => {
      thumb.style.width = w + 'px';
      thumb.style.height = h + 'px';
      const inner = thumb.querySelector('.slide-thumb-inner');
      if (inner) inner.style.transform = 'scale(' + s + ')';
    });
  }

  function focusCurrentSlideThumb(opts) {
    opts = opts || {};
    const list = els.slidesList;
    if (!list || !state.currentSlideId) return;
    const thumb = list.querySelector('.slide-thumb.active');
    if (!thumb) return;
    const pad = 10;
    const top = thumb.offsetTop - pad;
    const bottom = thumb.offsetTop + thumb.offsetHeight + pad;
    const visibleTop = list.scrollTop;
    const visibleBottom = visibleTop + list.clientHeight;
    let next = visibleTop;
    if (top < visibleTop) next = top;
    else if (bottom > visibleBottom) next = bottom - list.clientHeight;
    const max = Math.max(0, list.scrollHeight - list.clientHeight);
    next = Math.max(0, Math.min(max, Math.round(next)));
    if (Math.abs(next - visibleTop) < 1) return;
    if (opts.smooth) list.scrollTo({ top: next, behavior: 'smooth' });
    else list.scrollTop = next;
  }

  function scheduleCurrentSlideThumbFocus(opts) {
    syncThumbSizes();
    requestAnimationFrame(() => focusCurrentSlideThumb(opts));
  }

  let slideListObserver = null;
  function setupSlideListObserver() {
    if (slideListObserver || !els.slidesList) return;
    slideListObserver = new ResizeObserver(() => syncThumbSizes());
    slideListObserver.observe(els.slidesList);
  }

  function reorderSlide(srcId, dstId, position) {
    const srcIdx = state.slides.findIndex(s => s.id === srcId);
    if (srcIdx < 0) return;
    recordHistory();
    const [moved] = state.slides.splice(srcIdx, 1);
    let dstIdx = state.slides.findIndex(s => s.id === dstId);
    if (dstIdx < 0) {
      state.slides.splice(srcIdx, 0, moved);
      return;
    }
    if (position === 'after') dstIdx += 1;
    state.slides.splice(dstIdx, 0, moved);
    renderAll();
  }

  function applyCanvasSize() {
    document.documentElement.style.setProperty('--canvas-w', state.canvasW + 'px');
    document.documentElement.style.setProperty('--canvas-h', state.canvasH + 'px');
    syncThumbSizes();
  }

  function normalizeSlideFields(slide) {
    if (!slide) return;
    if (typeof slide.bgImage !== 'string') slide.bgImage = '';
    if (typeof slide.hidden !== 'boolean') slide.hidden = false;
    if (typeof slide.transition !== 'string') slide.transition = 'scrollVertical';
    if (slide.transition === 'pushVertical') slide.transition = 'scrollVertical';
    // Migrate legacy 'none' default to scrollVertical — clicking through
    // slides should always feel like scrolling down to the next page.
    if (slide.transition === 'none') slide.transition = 'scrollVertical';
    if (typeof slide.transitionMs !== 'number') slide.transitionMs = 650;
    slide.transitionMs = Math.max(150, Math.min(2000, Math.round(slide.transitionMs)));
    if (!Array.isArray(slide.elements)) slide.elements = [];
    // Migrate legacy near-black defaults to pure black. The default slide
    // background was changed from #212121 / #0a0a0a to #000000; previously-
    // saved projects carry the old value, which makes the canvas look
    // slightly washed-out compared to a true black backdrop.
    if (slide.bg === '#0a0a0a' || slide.bg === '#212121') slide.bg = '#000000';
  }

  // ---------- Undo / Redo ----------
  // Snapshots are debounced 500ms so that a rapid stream of mutations
  // (slider drag, dragging an element, typing in a textarea) collapses
  // into a single history entry instead of flooding the stack.
  const history = { undo: [], redo: [], pending: null, timer: null, limit: 80 };

  function snapshotState() {
    return JSON.stringify({
      slides: state.slides,
      currentSlideId: state.currentSlideId,
      canvasW: state.canvasW,
      canvasH: state.canvasH,
      grid: state.grid,
      guides: state.guides,
      zoom: state.zoom,
    });
  }

  function recordHistory() {
    if (history.pending == null) {
      history.pending = snapshotState();
    }
    if (history.timer) clearTimeout(history.timer);
    history.timer = setTimeout(commitHistory, 500);
  }

  function commitHistory() {
    if (history.timer) { clearTimeout(history.timer); history.timer = null; }
    if (history.pending == null) return;
    const last = history.undo[history.undo.length - 1];
    if (history.pending !== last) {
      history.undo.push(history.pending);
      if (history.undo.length > history.limit) history.undo.shift();
      history.redo.length = 0;
    }
    history.pending = null;
  }

  function undo() {
    commitHistory();
    if (!history.undo.length) return;
    const current = snapshotState();
    history.redo.push(current);
    const prev = history.undo.pop();
    applySnapshot(prev);
  }

  function redo() {
    if (history.pending != null || history.timer) {
      // A new edit is pending ??it will be committed and clear redo, so
      // nothing to redo. Bail out without losing the in-flight snapshot.
      return;
    }
    if (!history.redo.length) return;
    const current = snapshotState();
    history.undo.push(current);
    const next = history.redo.pop();
    applySnapshot(next);
  }

  function applySnapshot(snap) {
    const data = JSON.parse(snap);
    state.slides = data.slides;
    state.currentSlideId = data.currentSlideId;
    state.canvasW = data.canvasW;
    state.canvasH = data.canvasH;
    state.grid = Object.assign({}, DEFAULT_GRID, data.grid || {});
    state.guides = Object.assign({}, DEFAULT_GUIDES, data.guides || {});
    if (!Array.isArray(state.guides.items)) state.guides.items = [];
    state.zoom = data.zoom == null ? null : data.zoom;
    state.selectedElementId = null;
    state.editingElementId = null;
    applyCanvasSize();
    fitCanvas();
    syncGridToggleButton();
    syncGuidesToggleButton();
    renderAll();
  }

  // Local fonts detected via Local Font Access API. Cached in localStorage.
  let localFonts = [];
  let localFontRecords = [];
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

  // Curated third-party web fonts (not on Google Fonts) loaded via free CDNs.
  // Each entry has its own CSS URL and CSS font-family stack.
  const WEBFONTS = {
    'Pretendard': {
      family: '"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
      cssUrl: 'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.css',
    },
    'Pretendard JP': {
      family: '"Pretendard JP Variable", "Pretendard JP", -apple-system, BlinkMacSystemFont, sans-serif',
      cssUrl: 'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-jp.css',
    },
    'SUIT': {
      family: '"SUIT Variable", SUIT, -apple-system, BlinkMacSystemFont, sans-serif',
      cssUrl: 'https://cdn.jsdelivr.net/gh/sunn-us/SUIT/fonts/variable/woff2/SUIT-Variable.css',
    },
    'Wanted Sans': {
      family: '"Wanted Sans Variable", "Wanted Sans", -apple-system, BlinkMacSystemFont, sans-serif',
      cssUrl: 'https://cdn.jsdelivr.net/gh/wanteddev/wanted-sans@v1.0.3/packages/wanted-sans/fonts/webfonts/variable/split/WantedSansVariable.min.css',
    },
    'Spoqa Han Sans Neo': {
      family: '"Spoqa Han Sans Neo", "Spoqa Han Sans", -apple-system, BlinkMacSystemFont, sans-serif',
      cssUrl: 'https://spoqa.github.io/spoqa-han-sans/css/SpoqaHanSansNeo.css',
    },
    'Paperlogy': {
      family: '"Paperlogy", -apple-system, BlinkMacSystemFont, sans-serif',
      cssUrl: 'https://cdn.jsdelivr.net/gh/projectnoonnu/2406-3@1.0/Paperlogy.css',
    },
    'Cafe24 Ohsquare': {
      family: '"Cafe24Ohsquare", -apple-system, BlinkMacSystemFont, sans-serif',
      cssUrl: 'https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2104@1.0/Cafe24Ohsquare.css',
    },
    'Cafe24 Ssurround': {
      family: '"Cafe24Ssurround", -apple-system, BlinkMacSystemFont, sans-serif',
      cssUrl: 'https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2105_2@1.0/Cafe24Ssurround.css',
    },
    'MaruBuri': {
      family: '"MaruBuri", "Noto Serif KR", serif',
      cssUrl: 'https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2107@1.1/MaruBuri-Regular.css',
    },
    'Maplestory': {
      family: '"Maplestory", -apple-system, BlinkMacSystemFont, sans-serif',
      cssUrl: 'https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_yspuhw@1.0/Maplestory-Bold.css',
    },
  };
  const WEBFONT_NAMES = Object.keys(WEBFONTS);
  const WEBFONT_SET = new Set(WEBFONT_NAMES);
  const WEBFONTS_USED_KEY = 'pres-gen-webfonts-used-v1';
  let webfontsUsed = new Set();
  let webfontsBundleLoaded = false;

  const PROJECT_FONTS = {
    'Cosmic Sans TRIAL': {
      hiddenFromPicker: true,
      family: '"Cosmic Sans TRIAL", sans-serif',
      faces: [
        { file: 'CosmicSansTRIAL-Thin.otf', weight: 100, style: 'normal' },
        { file: 'CosmicSansTRIAL-ThinItalic.otf', weight: 100, style: 'italic' },
        { file: 'CosmicSansTRIAL-ExtraLight.otf', weight: 200, style: 'normal' },
        { file: 'CosmicSansTRIAL-ExtraLightItalic.otf', weight: 200, style: 'italic' },
        { file: 'CosmicSansTRIAL-Light.otf', weight: 300, style: 'normal' },
        { file: 'CosmicSansTRIAL-LightItalic.otf', weight: 300, style: 'italic' },
        { file: 'CosmicSansTRIAL-Regular.otf', weight: 400, style: 'normal' },
        { file: 'CosmicSansTRIAL-Italic.otf', weight: 400, style: 'italic' },
        { file: 'CosmicSansTRIAL-Medium.otf', weight: 500, style: 'normal' },
        { file: 'CosmicSansTRIAL-MediumItalic.otf', weight: 500, style: 'italic' },
        { file: 'CosmicSansTRIAL-SemiBold.otf', weight: 600, style: 'normal' },
        { file: 'CosmicSansTRIAL-SemiBoldItalic.otf', weight: 600, style: 'italic' },
        { file: 'CosmicSansTRIAL-Bold.otf', weight: 700, style: 'normal' },
        { file: 'CosmicSansTRIAL-BoldItalic.otf', weight: 700, style: 'italic' },
        { file: 'CosmicSansTRIAL-ExtraBold.otf', weight: 800, style: 'normal' },
        { file: 'CosmicSansTRIAL-ExtraBoldItalic.otf', weight: 800, style: 'italic' },
      ],
    },
    'Roboto Local': {
      hiddenFromPicker: true,
      family: '"Roboto Local", sans-serif',
      faces: [
        { file: 'Roboto-BoldItalic.ttf', weight: 700, style: 'italic' },
        { file: 'Roboto-BoldItalic.ttf', weight: 700, style: 'normal' },
      ],
    },
  };
  function addSingleProjectFont(name, file) {
    PROJECT_FONTS[name] = {
      family: '"' + name + '", sans-serif',
      forceWeight: 400,
      forceStyle: 'normal',
      exactFile: true,
      faces: [{ file, weight: 400, style: 'normal' }],
    };
  }
  [
    ['Cosmic Sans TRIAL Thin', 'CosmicSansTRIAL-Thin.otf'],
    ['Cosmic Sans TRIAL Thin Italic', 'CosmicSansTRIAL-ThinItalic.otf'],
    ['Cosmic Sans TRIAL ExtraLight', 'CosmicSansTRIAL-ExtraLight.otf'],
    ['Cosmic Sans TRIAL ExtraLight Italic', 'CosmicSansTRIAL-ExtraLightItalic.otf'],
    ['Cosmic Sans TRIAL Light', 'CosmicSansTRIAL-Light.otf'],
    ['Cosmic Sans TRIAL Light Italic', 'CosmicSansTRIAL-LightItalic.otf'],
    ['Cosmic Sans TRIAL Regular', 'CosmicSansTRIAL-Regular.otf'],
    ['Cosmic Sans TRIAL Italic', 'CosmicSansTRIAL-Italic.otf'],
    ['Cosmic Sans TRIAL Medium', 'CosmicSansTRIAL-Medium.otf'],
    ['Cosmic Sans TRIAL Medium Italic', 'CosmicSansTRIAL-MediumItalic.otf'],
    ['Cosmic Sans TRIAL SemiBold', 'CosmicSansTRIAL-SemiBold.otf'],
    ['Cosmic Sans TRIAL SemiBold Italic', 'CosmicSansTRIAL-SemiBoldItalic.otf'],
    ['Cosmic Sans TRIAL Bold', 'CosmicSansTRIAL-Bold.otf'],
    ['Cosmic Sans TRIAL Bold Italic', 'CosmicSansTRIAL-BoldItalic.otf'],
    ['Cosmic Sans TRIAL ExtraBold', 'CosmicSansTRIAL-ExtraBold.otf'],
    ['Cosmic Sans TRIAL ExtraBold Italic', 'CosmicSansTRIAL-ExtraBoldItalic.otf'],
    ['Roboto Bold Italic', 'Roboto-BoldItalic.ttf'],
  ].forEach(([name, file]) => addSingleProjectFont(name, file));
  const PROJECT_FONT_NAMES = Object.keys(PROJECT_FONTS);
  const PROJECT_FONT_PICKER_NAMES = PROJECT_FONT_NAMES.filter(name => !PROJECT_FONTS[name].hiddenFromPicker);
  const PROJECT_FONT_SET = new Set(PROJECT_FONT_NAMES);

  function projectFontUrl(file) {
    return 'Public/Font/' + encodeURIComponent(file).replace(/%2F/g, '/');
  }

  function projectFontFaceCss(name) {
    const font = PROJECT_FONTS[name];
    if (!font) return '';
    const family = font.family.split(',')[0].trim();
    return font.faces.map(face => {
      const format = /\.ttf$/i.test(face.file) ? 'truetype' : 'opentype';
      return '@font-face{font-family:' + family + ';src:url("' + projectFontUrl(face.file) + '") format("' + format + '");font-weight:' + face.weight + ';font-style:' + face.style + ';font-display:block;}';
    }).join('\n');
  }

  const fontDataUrlCache = new Map();
  async function urlToDataUrl(url) {
    const abs = new URL(url, location.href).href;
    if (fontDataUrlCache.has(abs)) return fontDataUrlCache.get(abs);
    const promise = fetch(abs, { cache: 'force-cache' })
      .then(res => {
        if (!res.ok) throw new Error('Could not load font asset: ' + abs);
        return res.blob();
      })
      .then(blob => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      }));
    fontDataUrlCache.set(abs, promise);
    return promise;
  }

  async function projectFontFaceCssInline(name) {
    const font = PROJECT_FONTS[name];
    if (!font) return '';
    const family = font.family.split(',')[0].trim();
    const rules = [];
    for (const face of font.faces) {
      try {
        const format = /\.ttf$/i.test(face.file) ? 'truetype' : 'opentype';
        const src = await urlToDataUrl(projectFontUrl(face.file));
        rules.push('@font-face{font-family:' + family + ';src:url("' + src + '") format("' + format + '");font-weight:' + face.weight + ';font-style:' + face.style + ';font-display:block;}');
      } catch (e) {
        console.warn('Could not inline project font for PDF:', name, e);
        rules.push(projectFontFaceCss(name));
      }
    }
    return rules.join('\n');
  }

  function injectProjectFont(name) {
    if (!PROJECT_FONTS[name]) return;
    const id = 'project-font-' + name.replace(/\s+/g, '_');
    if (document.getElementById(id)) {
      scheduleFontReadyRefresh();
      return;
    }
    const style = document.createElement('style');
    style.id = id;
    style.textContent = projectFontFaceCss(name);
    document.head.appendChild(style);
    scheduleFontReadyRefresh();
  }

  function injectWebfontLink(name) {
    if (!WEBFONTS[name]) return;
    const id = 'webfont-' + name.replace(/\s+/g, '_');
    if (document.getElementById(id)) {
      scheduleFontReadyRefresh();
      return;
    }
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = WEBFONTS[name].cssUrl;
    document.head.appendChild(link);
    scheduleFontReadyRefresh();
  }

  function loadWebfont(name) {
    if (!WEBFONTS[name]) return;
    if (!webfontsUsed.has(name)) {
      webfontsUsed.add(name);
      saveWebfontsUsedCache();
    }
    injectWebfontLink(name);
  }

  function loadWebfontsUsedCache() {
    try {
      const raw = localStorage.getItem(WEBFONTS_USED_KEY);
      if (!raw) return new Set();
      const arr = JSON.parse(raw);
      return new Set(Array.isArray(arr) ? arr : []);
    } catch (e) { return new Set(); }
  }
  function saveWebfontsUsedCache() {
    try {
      localStorage.setItem(WEBFONTS_USED_KEY, JSON.stringify([...webfontsUsed]));
    } catch (e) {}
  }
  function rehydrateUsedWebfonts() {
    webfontsUsed.forEach(name => injectWebfontLink(name));
  }
  function cssString(value) {
    return String(value || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  }
  function localFontId(name) {
    let h = 0;
    String(name || '').split('').forEach(ch => {
      h = ((h << 5) - h + ch.charCodeAt(0)) | 0;
    });
    return 'LocalFont_' + Math.abs(h).toString(36);
  }
  function localFontRecordName(record) {
    if (!record) return '';
    return record.fullName || record.postscriptName || [record.family, record.style].filter(Boolean).join(' ').trim();
  }
  function localFontRecordFor(name) {
    return localFontRecords.find(record => localFontRecordName(record) === name) || null;
  }
  function localFontCssFamily(name) {
    const record = localFontRecordFor(name);
    if (!record) return name;
    return '"' + localFontId(name) + '", "' + cssString(record.fullName || name) + '", "' + cssString(record.postscriptName || name) + '", "' + cssString(record.family || name) + '", sans-serif';
  }
  function injectLocalFont(name) {
    const record = localFontRecordFor(name);
    if (!record) return;
    const id = 'local-font-' + localFontId(name);
    if (document.getElementById(id)) {
      scheduleFontReadyRefresh();
      return;
    }
    const locals = [record.fullName, record.postscriptName, record.family]
      .filter(Boolean)
      .map(v => 'local("' + cssString(v) + '")')
      .join(', ');
    const style = document.createElement('style');
    style.id = id;
    style.textContent = '@font-face{font-family:"' + localFontId(name) + '";src:' + locals + ';font-weight:100 900;font-style:normal italic;font-display:block;}';
    document.head.appendChild(style);
    scheduleFontReadyRefresh();
  }
  function localFontFaceCss(name) {
    const record = localFontRecordFor(name);
    if (!record) return '';
    const locals = [record.fullName, record.postscriptName, record.family]
      .filter(Boolean)
      .map(v => 'local("' + cssString(v) + '")')
      .join(', ');
    return '@font-face{font-family:"' + localFontId(name) + '";src:' + locals + ';font-weight:100 900;font-style:normal italic;font-display:block;}';
  }

  async function inlineCssUrlAssets(css, baseUrl) {
    const source = String(css || '');
    const urls = [];
    source.replace(/url\((['"]?)(?!data:)([^)'"]+)\1\)/gi, (_, quote, rawUrl) => {
      const clean = String(rawUrl || '').trim();
      if (!clean || /^#/.test(clean)) return '';
      urls.push(clean);
      return '';
    });
    const replacements = new Map();
    await Promise.all(urls.map(async rawUrl => {
      if (replacements.has(rawUrl)) return;
      try {
        const abs = new URL(rawUrl, baseUrl || location.href).href;
        replacements.set(rawUrl, await urlToDataUrl(abs));
      } catch (e) {
        console.warn('Could not inline CSS asset for PDF:', rawUrl, e);
      }
    }));
    return source.replace(/url\((['"]?)(?!data:)([^)'"]+)\1\)/gi, (match, quote, rawUrl) => {
      const dataUrl = replacements.get(String(rawUrl || '').trim());
      return dataUrl ? 'url("' + dataUrl + '")' : match;
    });
  }

  async function fetchInlineFontCss(url) {
    const abs = new URL(url, location.href).href;
    try {
      const res = await fetch(abs, { cache: 'force-cache' });
      if (!res.ok) throw new Error('Could not load font CSS: ' + abs);
      const css = await res.text();
      return inlineCssUrlAssets(css, abs);
    } catch (e) {
      console.warn('Could not inline font CSS for PDF:', abs, e);
      return '';
    }
  }
  function preloadAllWebfonts() {
    if (webfontsBundleLoaded) return;
    webfontsBundleLoaded = true;
    WEBFONT_NAMES.forEach(injectWebfontLink);
    PROJECT_FONT_NAMES.forEach(injectProjectFont);
    localFonts.forEach(injectLocalFont);
  }

  function collectFontsFromSlides(slides) {
    const google = new Set();
    const web = new Set();
    const project = new Set();
    function addFontName(name) {
      const clean = String(name || '').trim().replace(/^['"]|['"]$/g, '');
      if (!clean) return;
      if (GOOGLE_FONT_SET.has(clean)) google.add(clean);
      if (WEBFONT_SET.has(clean)) web.add(clean);
      if (PROJECT_FONT_SET.has(clean)) project.add(clean);
    }
    function collectHtmlFonts(html) {
      String(html || '').replace(/font-family\s*:\s*([^;"']+|"[^"]+"|'[^']+')/gi, (_, value) => {
        String(value || '').split(',').forEach(addFontName);
        return '';
      });
    }
    (slides || []).forEach(slide => {
      (slide.elements || []).forEach(el => {
        if (!el || el.type !== 'text') return;
        addFontName(el.font);
        collectHtmlFonts(el.html);
      });
    });
    return { google, web, project };
  }

  function ensureSlideFontsLoaded(slides) {
    const used = collectFontsFromSlides(slides);
    used.google.forEach(loadGoogleFont);
    used.web.forEach(loadWebfont);
    used.project.forEach(injectProjectFont);
  }

  function loadFontIfKnown(name) {
    if (GOOGLE_FONT_SET.has(name)) loadGoogleFont(name);
    if (WEBFONT_SET.has(name)) loadWebfont(name);
    if (PROJECT_FONT_SET.has(name)) injectProjectFont(name);
    if (localFontRecordFor(name)) injectLocalFont(name);
  }

  let fontReadyTimer = null;
  function scheduleFontReadyRefresh() {
    if (!document.fonts || fontReadyTimer) return;
    fontReadyTimer = setTimeout(() => {
      fontReadyTimer = null;
      document.fonts.ready.then(() => {
        // Re-render canvas/thumbnails so the loaded glyphs paint with the
        // right metrics, but DO NOT re-run autoSizeTextElement on existing
        // boxes. Re-fitting after fonts load shifts el.w/el.h slightly which
        // ripples into el.x/el.y via the alignment pin, and the user sees
        // text drift to a new position "on its own" every reload. The saved
        // el.w/el.h was correct when the user last interacted; trust it.
        renderSlidesList();
        renderCanvas();
      }).catch(() => {});
    }, 30);
  }

  const GOOGLE_FONTS_USED_KEY = 'pres-gen-gfonts-used-v1';
  let googleFontsUsed = new Set();
  let googleFontsBundleLoaded = false;

  function googleFontsBundleHref(families) {
    const weights = '100;200;300;400;500;600;700;800;900';
    const list = families.map(f => 'family=' + f.replace(/\s+/g, '+') + ':wght@' + weights);
    return 'https://fonts.googleapis.com/css2?' + list.join('&') + '&display=swap';
  }

  function injectGoogleFontLink(family) {
    const id = 'gfont-' + family.replace(/\s+/g, '_');
    if (document.getElementById(id)) {
      scheduleFontReadyRefresh();
      return;
    }
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = googleFontsBundleHref([family]);
    document.head.appendChild(link);
    scheduleFontReadyRefresh();
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
      if (!Array.isArray(arr)) return [];
      if (arr.length && typeof arr[0] === 'object') {
        localFontRecords = arr
          .map(record => ({
            family: String(record.family || ''),
            fullName: String(record.fullName || ''),
            postscriptName: String(record.postscriptName || ''),
            style: String(record.style || ''),
          }))
          .filter(record => localFontRecordName(record));
        return localFontRecords.map(localFontRecordName);
      }
      localFontRecords = arr.map(name => ({ family: String(name), fullName: String(name), postscriptName: '', style: '' }));
      return arr;
    } catch (e) { return []; }
  }
  function saveLocalFontsCache(records) {
    try { localStorage.setItem(FONT_CACHE_KEY, JSON.stringify(records)); } catch (e) {}
  }

  async function detectLocalFonts() {
    if (typeof window.queryLocalFonts !== 'function') {
      alert('This browser does not support Local Font Access API.\nType a font name manually, or use Chrome/Edge 103+.');
      return null;
    }
    try {
      const fonts = await window.queryLocalFonts();
      const seen = new Set();
      const records = [];
      fonts.forEach(f => {
        if (!f) return;
        const record = {
          family: String(f.family || ''),
          fullName: String(f.fullName || ''),
          postscriptName: String(f.postscriptName || ''),
          style: String(f.style || ''),
        };
        const name = localFontRecordName(record);
        if (!name || seen.has(name)) return;
        seen.add(name);
        records.push(record);
      });
      records.sort((a, b) => localFontRecordName(a).localeCompare(localFontRecordName(b)));
      localFontRecords = records;
      return records.map(localFontRecordName);
    } catch (e) {
      alert('Font access was denied or failed: ' + (e.message || e.name));
      return null;
    }
  }

  // Measure the natural size of a text element. Uses width: max-content so
  // the box hugs single-line text, but caps at canvasW (with pre-wrap fallback)
  // so very long text wraps to multiple lines instead of bleeding off the slide.
  // Mirrors the actual render's white-space: pre-wrap exactly.
  function measureText(el) {
    const probe = document.createElement('div');
    probe.style.position = 'fixed';
    probe.style.left = '-99999px';
    probe.style.top = '-99999px';
    probe.style.visibility = 'hidden';
    probe.style.boxSizing = 'border-box';
    probe.style.padding = '4px';
    probe.style.whiteSpace = 'pre-wrap';
    probe.style.wordBreak = 'break-word';
    probe.style.width = 'max-content';
    probe.style.maxWidth = (state.canvasW || 1280) + 'px';
    probe.style.fontFamily = resolveFontFamily(el.font);
    probe.style.fontSize = el.fontSize + 'px';
    probe.style.fontWeight = String(el.fontWeight);
    probe.style.fontStyle = el.fontStyle || 'normal';
    probe.style.fontSynthesis = 'none';
    probe.style.letterSpacing = (el.letterSpacing || 0) + 'px';
    probe.style.lineHeight = String(el.lineHeight != null ? el.lineHeight : 1.3);
    if (el.textCase && el.textCase !== 'none') probe.style.textTransform = el.textCase;
    probe.innerHTML = el.html || escapeHtml(el.text || ' ');
    applyDefaultBrMargin(probe, el.paragraphSpacing || 0);
    document.body.appendChild(probe);
    void probe.offsetHeight; // force layout
    const rect = probe.getBoundingClientRect();
    const w = Math.max(20, Math.ceil(rect.width));
    const h = Math.max(20, Math.ceil(rect.height));
    document.body.removeChild(probe);
    return { w: w, h: h };
  }

  function autoSizeTextElement(el) {
    if (!el || el.type !== 'text') return;
    const dims = measureText(el);
    const newW = dims.w;
    const newH = dims.h;
    // Pin based on alignment so the visual anchor doesn't drift as text grows.
    let xPin = el.x;
    if (el.align === 'right') xPin = el.x + el.w - newW;
    else if (el.align === 'center') xPin = el.x + (el.w - newW) / 2;
    let yPin = el.y;
    if (el.verticalAlign === 'bottom') yPin = el.y + el.h - newH;
    else if ((el.verticalAlign || 'center') === 'center') yPin = el.y + (el.h - newH) / 2;
    el.x = Math.round(xPin);
    el.y = Math.round(yPin);
    el.w = newW;
    el.h = newH;
  }

  const TEXT_AUTOSIZE_KEYS = new Set([
    'text', 'html', 'font', 'fontSize', 'fontWeight', 'fontStyle',
    'letterSpacing', 'lineHeight', 'paragraphSpacing',
    'fontStretch', 'textCase', 'align', 'verticalAlign',
  ]);

  function resolveFontFamily(font) {
    if (!font) return FONT_FAMILIES.sans;
    if (FONT_FAMILIES[font]) return FONT_FAMILIES[font];
    if (WEBFONTS[font]) return WEBFONTS[font].family;
    if (PROJECT_FONTS[font]) return PROJECT_FONTS[font].family;
    if (localFontRecordFor(font)) return localFontCssFamily(font);
    return font;
  }

  // ---------- Persistence ----------
  let librarySyncTimer = null;
  function scheduleLibrarySync() {
    if (!currentProjectLibraryId) return;
    if (librarySyncTimer) clearTimeout(librarySyncTimer);
    // Debounce so a burst of edits collapses into one IndexedDB write.
    librarySyncTimer = setTimeout(() => {
      librarySyncTimer = null;
      try {
        const data = buildProjectData();
        saveProjectToLibrary(data).catch(e => console.warn('Library sync failed', e));
      } catch (e) {
        console.warn('Library sync failed', e);
      }
    }, 800);
  }

  // IndexedDB-backed primary save. Fires IMMEDIATELY on every persist (no
  // debounce) so videos and big data URLs are durable even if the user
  // refreshes a moment after editing. localStorage has a tiny quota that
  // blows up on videos; IndexedDB has gigabytes available.
  let autosaveInFlight = false;
  let autosavePending = false;
  async function flushAutosave() {
    if (autosaveInFlight) { autosavePending = true; return; }
    autosaveInFlight = true;
    try {
      const data = buildProjectData();
      await writeAutosaveDraft(data);
    } catch (e) {
      console.warn('Autosave write failed', e);
    } finally {
      autosaveInFlight = false;
      if (autosavePending) { autosavePending = false; flushAutosave(); }
    }
  }

  function persist() {
    let lsOk = true;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        slides: state.slides,
        currentSlideId: state.currentSlideId,
        canvasW: state.canvasW,
        canvasH: state.canvasH,
        grid: state.grid,
        guides: state.guides,
        zoom: state.zoom,
      }));
    } catch (e) {
      // Typically QuotaExceededError when slides contain big data-URL videos
      // or images. Clear the stale entry so init() can't prefer it over the
      // (more recent + complete) IndexedDB autosave.
      lsOk = false;
      try { localStorage.removeItem(STORAGE_KEY); } catch (_) {}
    }
    // If this draft is bound to a saved library project, mirror the edit
    // back so the projects page card reflects the current state.
    scheduleLibrarySync();
    // Always autosave to IndexedDB — the authoritative source of truth.
    flushAutosave();
  }

  function restore() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      if (!data || !Array.isArray(data.slides) || !data.slides.length) return false;
      state.slides = data.slides;
      state.currentSlideId = data.currentSlideId || data.slides[0].id;
      if (typeof data.canvasW === 'number' && data.canvasW > 0) state.canvasW = data.canvasW;
      if (typeof data.canvasH === 'number' && data.canvasH > 0) state.canvasH = data.canvasH;
      if (data.grid && typeof data.grid === 'object') {
        state.grid = Object.assign({}, DEFAULT_GRID, data.grid);
      }
      if (data.guides && typeof data.guides === 'object') {
        state.guides = Object.assign({}, DEFAULT_GUIDES, data.guides, {
          items: Array.isArray(data.guides.items) ? data.guides.items : [],
        });
      }
      if (data.zoom === null || typeof data.zoom === 'number') state.zoom = data.zoom;
      ensureSlideFontsLoaded(state.slides);
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

  function getVisibleSlides() {
    const visible = state.slides.filter(slide => !slide.hidden);
    return visible.length ? visible : state.slides.slice(0, 1);
  }

  // ---------- DOM refs ----------
  const els = {};

  // ---------- Render ----------
  function renderAll() {
    ensureSlideFontsLoaded(state.slides);
    renderSlidesList();
    renderCanvas();
    renderProperties();
    refreshContentEditor();
    persist();
  }

  function refreshContentEditor() {
    const editor = document.getElementById('contentEditor');
    const ta = document.getElementById('contentEditorText');
    if (!editor || !ta) return;
    editor.hidden = false;
    const el = getSelectedElement();
    if (el && el.type === 'text') {
      // Don't overwrite while user is actively typing in the textarea.
      if (document.activeElement !== ta) {
        const value = el.text || '';
        ta.value = value;
        ta.dataset.autoValue = value;
        ta.dataset.userWritten = '0';
      }
    }
  }

  function getUserWrittenContentText(ta) {
    if (!ta) return '';
    const value = ta.value || '';
    if (ta.dataset.userWritten !== '1') return '';
    return value;
  }

  function renderSlidesList() {
    els.slidesList.innerHTML = '';
    els.slideCount.textContent = String(state.slides.length).padStart(2, '0');
    state.slides.forEach((slide, i) => {
      const thumb = document.createElement('div');
      thumb.className = 'slide-thumb' + (slide.id === state.currentSlideId ? ' active' : '') + (slide.hidden ? ' hidden-slide' : '');
      thumb.dataset.slideId = slide.id;
      thumb.draggable = true;
      thumb.tabIndex = 0;
      thumb.setAttribute('role', 'button');
      thumb.setAttribute('aria-label', 'Slide ' + (i + 1));

      thumb.addEventListener('dragstart', (e) => {
        draggingSlideId = slide.id;
        if (e.dataTransfer) {
          e.dataTransfer.effectAllowed = 'move';
          try { e.dataTransfer.setData('text/plain', slide.id); } catch (_) {}
        }
        thumb.classList.add('dragging');
      });
      thumb.addEventListener('dragend', () => {
        draggingSlideId = null;
        els.slidesList.querySelectorAll('.slide-thumb').forEach(el => {
          el.classList.remove('dragging', 'drop-above', 'drop-below');
        });
      });
      thumb.addEventListener('dragover', (e) => {
        if (!draggingSlideId || draggingSlideId === slide.id) return;
        e.preventDefault();
        if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
        const rect = thumb.getBoundingClientRect();
        const above = e.clientY < rect.top + rect.height / 2;
        thumb.classList.toggle('drop-above', above);
        thumb.classList.toggle('drop-below', !above);
      });
      thumb.addEventListener('dragleave', () => {
        thumb.classList.remove('drop-above', 'drop-below');
      });
      thumb.addEventListener('drop', (e) => {
        e.preventDefault();
        const srcId = draggingSlideId;
        thumb.classList.remove('drop-above', 'drop-below');
        if (!srcId || srcId === slide.id) return;
        const rect = thumb.getBoundingClientRect();
        const above = e.clientY < rect.top + rect.height / 2;
        reorderSlide(srcId, slide.id, above ? 'before' : 'after');
      });

      const num = document.createElement('span');
      num.className = 'slide-thumb-num';
      num.textContent = String(i + 1).padStart(2, '0');
      thumb.appendChild(num);

      const del = document.createElement('button');
      del.className = 'slide-thumb-del';
      del.textContent = 'x';
      del.title = 'Delete slide';
      del.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteSlide(slide.id);
      });
      thumb.appendChild(del);

      const hide = document.createElement('button');
      hide.className = 'slide-thumb-hide' + (slide.hidden ? ' is-hidden' : '');
      hide.textContent = slide.hidden ? 'Show' : 'Hide';
      hide.title = slide.hidden ? 'Show slide' : 'Hide slide';
      hide.setAttribute('aria-label', hide.title);
      hide.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleSlideHidden(slide.id);
      });
      thumb.appendChild(hide);

      const inner = document.createElement('div');
      inner.className = 'slide-thumb-inner';
      inner.style.width = state.canvasW + 'px';
      inner.style.height = state.canvasH + 'px';
      inner.style.backgroundColor = slide.bg;
      if (slide.bgImage) {
        inner.style.backgroundImage = 'url("' + slide.bgImage + '")';
        inner.style.backgroundSize = 'cover';
        inner.style.backgroundPosition = 'center';
      }
      slide.elements.forEach(el => inner.appendChild(buildElementNode(el, true)));
      thumb.appendChild(inner);

      thumb.addEventListener('click', () => selectSlide(slide.id));
      thumb.addEventListener('keydown', (e) => {
        if (e.key === 'Delete' || e.key === 'Backspace') {
          e.preventDefault();
          deleteSlide(slide.id);
        } else if (e.key.toLowerCase() === 'h') {
          e.preventDefault();
          toggleSlideHidden(slide.id);
        } else if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          selectSlide(slide.id);
        }
      });
      els.slidesList.appendChild(thumb);
    });
    scheduleCurrentSlideThumbFocus();
  }

  function formatProjectDate(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleString([], {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function buildProjectLibraryThumb(record) {
    const data = record.data || {};
    const cw = data.canvasW || record.canvasW || 1280;
    const ch = data.canvasH || record.canvasH || 720;
    const slide = (data.slides && data.slides[0]) || null;
    const thumb = document.createElement('div');
    thumb.className = 'project-thumb';
    thumb.style.setProperty('--project-cw', String(cw));
    thumb.style.setProperty('--project-ch', String(ch));

    const inner = document.createElement('div');
    inner.className = 'project-thumb-inner';
    inner.style.width = cw + 'px';
    inner.style.height = ch + 'px';
    inner.style.backgroundColor = slide && slide.bg ? slide.bg : '#000000';
    if (slide && slide.bgImage) {
      inner.style.backgroundImage = 'url("' + slide.bgImage + '")';
      inner.style.backgroundSize = 'cover';
      inner.style.backgroundPosition = 'center';
    }
    if (slide) {
      (slide.elements || []).forEach(el => {
        if (!el.hidden) inner.appendChild(buildElementNode(el, true));
      });
    }
    thumb.appendChild(inner);
    requestAnimationFrame(() => {
      inner.style.transform = 'scale(' + (thumb.clientWidth / cw) + ')';
    });
    return thumb;
  }

  async function openProjectLibrary() {
    if (!els.projectLibraryOverlay || !els.projectLibraryBody) return;
    try { sessionStorage.setItem(VIEW_KEY, 'projects'); } catch (e) {}
    els.projectLibraryOverlay.hidden = false;
    els.projectLibraryBody.innerHTML = '<div class="project-library-empty">Loading projects...</div>';
    updateProjectScrollTopButton();
    const records = await listProjectLibrary();
    renderProjectLibrary(records);
  }

  function closeProjectLibrary() {
    try { sessionStorage.setItem(VIEW_KEY, 'editor'); } catch (e) {}
    if (els.projectLibraryOverlay) els.projectLibraryOverlay.hidden = true;
    if (els.projectScrollTop) {
      els.projectScrollTop.hidden = true;
      els.projectScrollTop.classList.remove('is-visible');
    }
  }

  function updateProjectScrollTopButton() {
    const body = els.projectLibraryBody;
    const btn = els.projectScrollTop;
    if (!body || !btn || els.projectLibraryOverlay.hidden) return;
    const canScroll = body.scrollHeight > body.clientHeight + 24;
    const visible = canScroll && body.scrollTop > 120;
    btn.hidden = !canScroll;
    btn.classList.toggle('is-visible', visible);
  }

  function scrollProjectLibraryToTop() {
    if (!els.projectLibraryBody) return;
    els.projectLibraryBody.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(updateProjectScrollTopButton, 260);
  }

  function makeStarterProject() {
    const intro = newSlide('title');
    const next = newSlide('titleBody');
    return [intro, next];
  }

  async function startNewProject() {
    const hasWork = state.slides && state.slides.length;
    if (hasWork && !confirm('Start a new project? Unsaved edits in the current project will be replaced.')) return;
    commitHistory();
    history.undo.length = 0;
    history.redo.length = 0;
    history.pending = null;
    if (history.timer) {
      clearTimeout(history.timer);
      history.timer = null;
    }
    currentProjectLibraryId = null;
    state.canvasW = 1280;
    state.canvasH = 720;
    state.grid = Object.assign({}, DEFAULT_GRID);
    state.guides = Object.assign({}, DEFAULT_GUIDES, { items: [] });
    state.zoom = null;
    state.cropElementId = null;
    state.editingElementId = null;
    selectClear();
    state.slides = makeStarterProject();
    state.currentSlideId = state.slides[0].id;
    applyCanvasSize();
    renderAll();
    persist();
    // Seed a library entry so the new project shows on the projects page
    // immediately. persist() will keep it in sync as the user edits.
    try {
      const data = buildProjectData();
      await saveProjectToLibrary(data);
    } catch (e) {
      console.warn('Could not seed new project to library', e);
    }
    closeProjectLibrary();
  }

  function buildNewProjectCard() {
    const card = document.createElement('div');
    card.className = 'project-card project-card-new';
    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', 'Create new project');
    const inner = document.createElement('div');
    inner.className = 'project-new-inner';
    const plus = document.createElement('div');
    plus.className = 'project-new-plus';
    inner.appendChild(plus);
    const label = document.createElement('div');
    label.className = 'project-new-label';
    label.textContent = 'New Project';
    inner.appendChild(label);
    const sub = document.createElement('div');
    sub.className = 'project-new-sub';
    sub.textContent = 'Start from a clean deck';
    inner.appendChild(sub);
    card.appendChild(inner);
    card.addEventListener('click', startNewProject);
    card.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      startNewProject();
    });
    return card;
  }

  function renderProjectLibrary(records) {
    const body = els.projectLibraryBody;
    if (!body) return;
    body.innerHTML = '';
    const grid = document.createElement('div');
    grid.className = 'project-grid';
    grid.appendChild(buildNewProjectCard());
    if (!records.length) {
      const empty = document.createElement('div');
      empty.className = 'project-library-empty';
      empty.textContent = 'No saved projects yet. Start a new project or use Save Project to add one here.';
      grid.appendChild(empty);
      body.appendChild(grid);
      requestAnimationFrame(updateProjectScrollTopButton);
      return;
    }
    records.forEach(record => {
      const card = document.createElement('div');
      card.className = 'project-card';
      card.tabIndex = 0;
      card.setAttribute('role', 'button');
      card.appendChild(buildProjectLibraryThumb(record));

      const meta = document.createElement('div');
      meta.className = 'project-meta';
      const title = document.createElement('div');
      title.className = 'project-title';
      title.textContent = record.title || 'Untitled project';
      meta.appendChild(title);
      const sub = document.createElement('div');
      sub.className = 'project-sub';
      sub.textContent = (record.slideCount || 0) + ' slides · ' + formatProjectDate(record.updatedAt);
      meta.appendChild(sub);
      card.appendChild(meta);

      const actions = document.createElement('div');
      actions.className = 'project-actions';
      const openBtn = document.createElement('button');
      openBtn.type = 'button';
      openBtn.className = 'project-action';
      openBtn.textContent = 'Open';
      openBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        loadProjectLibraryRecord(record);
      });
      actions.appendChild(openBtn);
      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'project-action danger';
      delBtn.textContent = 'Delete';
      delBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (!confirm('Delete this saved project from the library?')) return;
        await deleteProjectFromLibrary(record.id);
        if (currentProjectLibraryId === record.id) currentProjectLibraryId = null;
        renderProjectLibrary(await listProjectLibrary());
      });
      actions.appendChild(delBtn);
      card.appendChild(actions);

      card.addEventListener('click', () => loadProjectLibraryRecord(record));
      card.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault();
        loadProjectLibraryRecord(record);
      });
      grid.appendChild(card);
    });
    body.appendChild(grid);
    requestAnimationFrame(updateProjectScrollTopButton);
  }

  function loadProjectLibraryRecord(record) {
    if (!record || !record.data) return;
    currentProjectLibraryId = record.id;
    applyLoadedData(JSON.parse(JSON.stringify(record.data)));
    closeProjectLibrary();
  }

  function renderCanvas() {
    els.canvas.innerHTML = '';
    const slide = getCurrentSlide();
    if (!slide) {
      const empty = document.createElement('div');
      empty.className = 'canvas-empty';
      empty.textContent = 'No slide selected';
      els.canvas.appendChild(empty);
      els.canvas.style.background = '#212121';
      syncSelectionAlignToolbar();
      return;
    }
    els.canvas.style.backgroundColor = slide.bg;
    els.canvas.style.backgroundImage = slide.bgImage ? 'url("' + slide.bgImage + '")' : '';
    els.canvas.style.backgroundSize = 'cover';
    els.canvas.style.backgroundPosition = 'center';
    slide.elements.forEach(el => {
      els.canvas.appendChild(buildElementNode(el, false));
    });
    const grid = buildGridOverlay();
    if (grid) els.canvas.appendChild(grid);
    const guides = buildGuidesOverlay();
    if (guides) els.canvas.appendChild(guides);
    const alignHints = buildSelectionAlignOverlay();
    if (alignHints) els.canvas.appendChild(alignHints);
    const motionPath = buildCustomMotionOverlay();
    if (motionPath) els.canvas.appendChild(motionPath);
    syncSelectionAlignToolbar();
  }

  // Visual editor for anim-custom motion: dashed line from START to END
  // plus a draggable filled handle at the start. Dragging the handle
  // updates el.motionFromX / motionFromY on the live element. Only drawn
  // when a single element with motion === 'anim-custom' is selected.
  function buildCustomMotionOverlay() {
    const slide = getCurrentSlide();
    if (!slide) return null;
    if (state.selectedElementIds.size !== 1) return null;
    const id = Array.from(state.selectedElementIds)[0];
    const el = slide.elements.find(e => e.id === id);
    if (!el || el.motion !== 'anim-custom') return null;

    const layer = document.createElement('div');
    layer.style.position = 'absolute';
    layer.style.left = '0';
    layer.style.top = '0';
    layer.style.width = '100%';
    layer.style.height = '100%';
    layer.style.pointerEvents = 'none';

    const endCx = el.x + el.w / 2;
    const endCy = el.y + el.h / 2;
    const startCx = endCx + (el.motionFromX || 0);
    const startCy = endCy + (el.motionFromY || 0);

    const dx = endCx - startCx;
    const dy = endCy - startCy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const angleDeg = Math.atan2(dy, dx) * 180 / Math.PI;

    if (dist > 0.5) {
      const line = document.createElement('div');
      line.className = 'motion-path-line';
      line.style.left = startCx + 'px';
      line.style.top = startCy + 'px';
      line.style.width = dist + 'px';
      line.style.transform = 'rotate(' + angleDeg + 'deg)';
      layer.appendChild(line);
    }

    const endMark = document.createElement('div');
    endMark.className = 'motion-end-marker';
    endMark.style.left = endCx + 'px';
    endMark.style.top = endCy + 'px';
    endMark.title = 'Destination (drag the element itself to move it)';
    layer.appendChild(endMark);

    const handle = document.createElement('div');
    handle.className = 'motion-start-handle';
    handle.style.left = startCx + 'px';
    handle.style.top = startCy + 'px';
    handle.title = 'Drag to set start position';
    handle.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const rect = els.canvas.getBoundingClientRect();
      const scale = rect.width / state.canvasW || 1;
      const startMx = e.clientX;
      const startMy = e.clientY;
      const baseFromX = el.motionFromX || 0;
      const baseFromY = el.motionFromY || 0;
      recordHistory();
      const onMove = (me) => {
        const ddx = (me.clientX - startMx) / scale;
        const ddy = (me.clientY - startMy) / scale;
        el.motionFromX = Math.round(baseFromX + ddx);
        el.motionFromY = Math.round(baseFromY + ddy);
        renderCanvas();
        renderProperties();
      };
      const onUp = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        persist();
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });
    layer.appendChild(handle);

    return layer;
  }

  // When 2+ elements are selected and any of their edges/centers align with
  // another selected element, draw thin dashed indicator lines so the user
  // can see whether widely-spaced elements share the same row/column. Drawn
  // only on the canvas (not in exports / present) — purely an editing aid.
  function buildSelectionAlignOverlay() {
    const slide = getCurrentSlide();
    if (!slide) return null;
    const selected = slide.elements.filter(el => isSelected(el.id) && !el.hidden);
    if (selected.length < 2) return null;

    const TOL = 1; // px tolerance — alignments within 1px are treated as the same

    // Build all edges for each element, grouped by axis.
    // vEdges (vertical lines / X coordinates): left, centerX, right
    // hEdges (horizontal lines / Y coordinates): top, centerY, bottom
    const vEdges = []; // { x, elTop, elBottom, kind: 'left' | 'center' | 'right' }
    const hEdges = []; // { y, elLeft, elRight, kind: 'top' | 'middle' | 'bottom' }
    selected.forEach(el => {
      const left = el.x, right = el.x + el.w;
      const top = el.y, bottom = el.y + el.h;
      const cx = el.x + el.w / 2, cy = el.y + el.h / 2;
      vEdges.push({ x: left, top, bottom, kind: 'left' });
      vEdges.push({ x: cx, top, bottom, kind: 'center' });
      vEdges.push({ x: right, top, bottom, kind: 'right' });
      hEdges.push({ y: top, left, right, kind: 'top' });
      hEdges.push({ y: cy, left, right, kind: 'middle' });
      hEdges.push({ y: bottom, left, right, kind: 'bottom' });
    });

    // Cluster edges where multiple elements share a coordinate.
    function cluster(edges, key) {
      const groups = [];
      edges.forEach(e => {
        let g = groups.find(gr => Math.abs(gr.coord - e[key]) <= TOL);
        if (!g) {
          g = { coord: e[key], members: [] };
          groups.push(g);
        }
        g.members.push(e);
      });
      return groups.filter(g => g.members.length >= 2);
    }

    const vMatches = cluster(vEdges, 'x');
    const hMatches = cluster(hEdges, 'y');
    if (!vMatches.length && !hMatches.length) return null;

    const layer = document.createElement('div');
    layer.className = 'sel-align-overlay';
    layer.style.position = 'absolute';
    layer.style.left = '0';
    layer.style.top = '0';
    layer.style.width = state.canvasW + 'px';
    layer.style.height = state.canvasH + 'px';
    layer.style.pointerEvents = 'none';
    layer.style.zIndex = '9998';

    vMatches.forEach(g => {
      const minTop = Math.min.apply(null, g.members.map(m => m.top));
      const maxBottom = Math.max.apply(null, g.members.map(m => m.bottom));
      const line = document.createElement('div');
      line.className = 'sel-align-line sel-align-v';
      line.style.left = g.coord + 'px';
      line.style.top = minTop + 'px';
      line.style.height = (maxBottom - minTop) + 'px';
      layer.appendChild(line);
    });
    hMatches.forEach(g => {
      const minLeft = Math.min.apply(null, g.members.map(m => m.left));
      const maxRight = Math.max.apply(null, g.members.map(m => m.right));
      const line = document.createElement('div');
      line.className = 'sel-align-line sel-align-h';
      line.style.top = g.coord + 'px';
      line.style.left = minLeft + 'px';
      line.style.width = (maxRight - minLeft) + 'px';
      layer.appendChild(line);
    });
    return layer;
  }

  function syncSelectionAlignToolbar() {
    if (!els.selectionAlignToolbar) return;
    const selected = getSelectedElements().filter(el => !el.locked && !el.hidden);
    const count = selected.length;
    els.selectionAlignToolbar.hidden = count < 2;
    if (count < 2) return;
    const groupBtn = els.selectionAlignToolbar.querySelector('[data-selection-action="group"]');
    const ungroupBtn = els.selectionAlignToolbar.querySelector('[data-selection-action="ungroup"]');
    const groupIds = new Set(selected.map(el => el.groupId).filter(Boolean));
    const isSingleGroup = groupIds.size === 1 && selected.every(el => el.groupId === [...groupIds][0]);
    if (groupBtn) {
      groupBtn.disabled = count < 2 || isSingleGroup;
      groupBtn.classList.toggle('is-active', isSingleGroup);
    }
    if (ungroupBtn) {
      ungroupBtn.disabled = !groupIds.size;
      ungroupBtn.classList.toggle('is-active', !!groupIds.size);
    }
    // Distribute buttons + gap inputs treat each group as a single unit.
    const distItems = selectionDistributeItems();
    const itemCount = distItems.length;
    const distBtns = els.selectionAlignToolbar.querySelectorAll('[data-distribute]');
    distBtns.forEach(btn => { btn.disabled = itemCount < 3; });
    const gapInputs = els.selectionAlignToolbar.querySelectorAll('[data-distribute-gap]');
    gapInputs.forEach(inp => {
      inp.disabled = itemCount < 2;
      // Don't clobber a value the user is currently editing.
      if (document.activeElement === inp) return;
      if (itemCount < 2) { inp.value = ''; return; }
      const axis = inp.dataset.distributeGap;
      const gap = computeSelectionGap(axis);
      inp.value = (gap == null) ? '' : String(Math.round(gap));
    });
  }

  // Editor-only grid overlay (not exported). Builds vertical column bands and
  // horizontal row bands as semi-transparent rectangles. Bands fill the inside
  // of margin/gutter regions; gutters and outer margins are left empty.
  function buildGridOverlay() {
    const g = state.grid;
    if (!g || !g.enabled) return null;
    const cw = state.canvasW || 1280;
    const ch = state.canvasH || 720;
    const overlay = document.createElement('div');
    overlay.className = 'grid-overlay';
    overlay.style.position = 'absolute';
    overlay.style.left = '0';
    overlay.style.top = '0';
    overlay.style.width = cw + 'px';
    overlay.style.height = ch + 'px';
    overlay.style.pointerEvents = 'none';

    const cols = Math.max(1, Math.round(g.cols || 1));
    const colMargin = Math.max(0, g.colMargin || 0);
    const colGutter = Math.max(0, g.colGutter || 0);
    const colsAvail = Math.max(0, cw - colMargin * 2);
    const colWidth = cols > 0 ? (colsAvail - colGutter * (cols - 1)) / cols : 0;
    if (colWidth > 0) {
      for (let i = 0; i < cols; i++) {
        const band = document.createElement('div');
        band.className = 'grid-col';
        band.style.position = 'absolute';
        band.style.top = '0';
        band.style.bottom = '0';
        band.style.left = (colMargin + i * (colWidth + colGutter)) + 'px';
        band.style.width = colWidth + 'px';
        band.style.background = g.color;
        band.style.opacity = String(g.opacity);
        overlay.appendChild(band);
      }
    }

    const rows = Math.max(1, Math.round(g.rows || 1));
    const rowMargin = Math.max(0, g.rowMargin || 0);
    const rowGutter = Math.max(0, g.rowGutter || 0);
    const rowsAvail = Math.max(0, ch - rowMargin * 2);
    const rowHeight = rows > 0 ? (rowsAvail - rowGutter * (rows - 1)) / rows : 0;
    if (rowHeight > 0) {
      for (let i = 0; i < rows; i++) {
        const band = document.createElement('div');
        band.className = 'grid-row';
        band.style.position = 'absolute';
        band.style.left = '0';
        band.style.right = '0';
        band.style.top = (rowMargin + i * (rowHeight + rowGutter)) + 'px';
        band.style.height = rowHeight + 'px';
        band.style.background = g.color;
        band.style.opacity = String(g.opacity);
        overlay.appendChild(band);
      }
    }

    return overlay;
  }

  function syncGridToggleButton() {
    if (!els.btnToggleGrid) return;
    els.btnToggleGrid.classList.toggle('active', !!state.grid.enabled);
  }

  function toggleGrid() {
    recordHistory();
    state.grid.enabled = !state.grid.enabled;
    syncGridToggleButton();
    renderCanvas();
    renderProperties();
    persist();
  }

  function updateGrid(patch) {
    recordHistory();
    Object.assign(state.grid, patch);
    syncGridToggleButton();
    renderCanvas();
    persist();
  }

  // Build draggable guide lines (vertical = full height at x; horizontal = full
  // width at y). Hit area is wider than the visible 1px line for easier grabbing.
  function buildGuidesOverlay() {
    const g = state.guides;
    if (!g || !g.enabled || !Array.isArray(g.items) || !g.items.length) return null;
    const cw = state.canvasW || 1280;
    const ch = state.canvasH || 720;
    const overlay = document.createElement('div');
    overlay.className = 'guides-overlay';
    overlay.style.position = 'absolute';
    overlay.style.left = '0';
    overlay.style.top = '0';
    overlay.style.width = cw + 'px';
    overlay.style.height = ch + 'px';
    overlay.style.pointerEvents = 'none';

    g.items.forEach(item => {
      const line = document.createElement('div');
      line.className = 'guide guide-' + item.axis;
      if (item.id === activeGuideId) line.classList.add('active');
      line.dataset.guideId = item.id;
      line.style.position = 'absolute';
      line.style.pointerEvents = 'auto';
      line.style.cursor = item.axis === 'v' ? 'ew-resize' : 'ns-resize';
      // Hit area: 7px band; visible line drawn via ::before in CSS
      if (item.axis === 'v') {
        const x = Math.max(0, Math.min(cw, item.position));
        line.style.top = '0';
        line.style.bottom = '0';
        line.style.width = '7px';
        line.style.left = (x - 3) + 'px';
        line.style.setProperty('--guide-color', g.color);
      } else {
        const y = Math.max(0, Math.min(ch, item.position));
        line.style.left = '0';
        line.style.right = '0';
        line.style.height = '7px';
        line.style.top = (y - 3) + 'px';
        line.style.setProperty('--guide-color', g.color);
      }
      line.addEventListener('mousedown', (e) => startGuideDrag(e, item.id));
      overlay.appendChild(line);
    });

    return overlay;
  }

  let guideDrag = null;
  // Currently-focused guide line. Set on guide mousedown; cleared when the
  // user clicks anywhere outside a guide. Used by the Delete keydown handler
  // to remove the guide the user just selected.
  let activeGuideId = null;
  function setActiveGuide(id) {
    if (activeGuideId === id) return;
    activeGuideId = id;
    if (els.canvas) {
      els.canvas.querySelectorAll('.guide.active').forEach(n => n.classList.remove('active'));
      if (id) {
        const target = els.canvas.querySelector('.guide[data-guide-id="' + CSS.escape(id) + '"]');
        if (target) target.classList.add('active');
      }
    }
  }
  function startGuideDrag(e, guideId) {
    e.preventDefault();
    e.stopPropagation();
    const item = state.guides.items.find(g => g.id === guideId);
    if (!item) return;
    setActiveGuide(guideId);
    const canvasRect = els.canvas.getBoundingClientRect();
    const scale = canvasRect.width / state.canvasW || 1;
    guideDrag = { id: guideId, axis: item.axis, scale, canvasRect };
    document.body.style.cursor = item.axis === 'v' ? 'ew-resize' : 'ns-resize';
    recordHistory();
  }

  function onGuideDragMove(e) {
    if (!guideDrag) return;
    const item = state.guides.items.find(g => g.id === guideDrag.id);
    if (!item) return;
    const r = guideDrag.canvasRect;
    if (item.axis === 'v') {
      const x = (e.clientX - r.left) / guideDrag.scale;
      item.position = Math.max(0, Math.min(state.canvasW, Math.round(x)));
    } else {
      const y = (e.clientY - r.top) / guideDrag.scale;
      item.position = Math.max(0, Math.min(state.canvasH, Math.round(y)));
    }
    renderCanvas();
  }

  function onGuideDragEnd() {
    if (!guideDrag) return;
    guideDrag = null;
    document.body.style.cursor = '';
    persist();
    renderProperties();
  }

  function syncGuidesToggleButton() {
    if (!els.btnToggleGuides) return;
    els.btnToggleGuides.classList.toggle('active', !!state.guides.enabled);
  }

  function toggleGuides() {
    recordHistory();
    state.guides.enabled = !state.guides.enabled;
    syncGuidesToggleButton();
    renderCanvas();
    renderProperties();
    persist();
  }

  function addGuide(axis) {
    recordHistory();
    const center = axis === 'v' ? Math.round(state.canvasW / 2) : Math.round(state.canvasH / 2);
    state.guides.items.push({ id: uid('gd'), axis: axis, position: center });
    if (!state.guides.enabled) {
      state.guides.enabled = true;
      syncGuidesToggleButton();
    }
    renderCanvas();
    renderProperties();
    persist();
  }

  function removeGuide(guideId) {
    recordHistory();
    state.guides.items = state.guides.items.filter(g => g.id !== guideId);
    if (activeGuideId === guideId) activeGuideId = null;
    renderCanvas();
    renderProperties();
    persist();
  }

  function updateGuide(guideId, patch) {
    const item = state.guides.items.find(g => g.id === guideId);
    if (!item) return;
    recordHistory();
    Object.assign(item, patch);
    renderCanvas();
    persist();
  }

  function clearGuides() {
    if (!state.guides.items.length) return;
    recordHistory();
    state.guides.items = [];
    renderCanvas();
    renderProperties();
    persist();
  }

  function buildElementNode(el, preview) {
    const node = document.createElement('div');
    node.className = 'el ' + elTypeClass(el.type);
    if (!preview && isSelected(el.id)) node.classList.add('selected');
    if (el.locked) node.classList.add('locked');
    node.style.left = el.x + 'px';
    node.style.top = el.y + 'px';
    node.style.width = el.w + 'px';
    node.style.height = el.h + 'px';
    node.style.setProperty('--hover-strength', String(el.hoverStrength != null ? el.hoverStrength : 1));
    node.style.setProperty('--motion-strength', String(el.motionStrength != null ? el.motionStrength : 1));
    if (el.motion === 'anim-blink') {
      node.style.setProperty('--blink-duration', (el.blinkDuration != null ? el.blinkDuration : 1) + 's');
    }
    if (el.rotation) node.style.setProperty('--rotation', el.rotation + 'deg');
    if (el.opacity != null && el.opacity < 1) node.style.opacity = String(el.opacity);
    // Hidden elements only render in the editor as a faded placeholder so the
    // user can still find them; previews/thumbnails skip them entirely.
    if (el.hidden) {
      if (preview) {
        node.style.display = 'none';
      } else {
        node.classList.add('el-hidden');
        node.style.opacity = '0.25';
        node.style.filter = 'grayscale(1)';
      }
    }

    if (el.type === 'text') {
      node.style.fontFamily = resolveFontFamily(el.font);
      node.style.fontSize = el.fontSize + 'px';
      node.style.fontWeight = String(el.fontWeight);
      node.style.fontStyle = el.fontStyle || 'normal';
      node.style.fontSynthesis = 'none';
      node.style.letterSpacing = (el.letterSpacing || 0) + 'px';
      node.style.fontStretch = (el.fontStretch || 100) + '%';
      node.style.lineHeight = String(el.lineHeight != null ? el.lineHeight : 1.3);
      node.style.color = el.color;
      if (el.bg) node.style.background = el.bg;
      node.style.textAlign = el.align;
      node.style.display = 'flex';
      const VALIGN = { top: 'flex-start', center: 'center', bottom: 'flex-end' };
      node.style.alignItems = VALIGN[el.verticalAlign || 'center'] || 'center';
      if (el.textCase && el.textCase !== 'none') node.style.textTransform = el.textCase;

      const inner = document.createElement('div');
      inner.style.width = '100%';
      inner.style.whiteSpace = 'pre-wrap';
      inner.style.wordBreak = 'break-word';
      inner.style.lineHeight = String(el.lineHeight != null ? el.lineHeight : 1.3);
      inner.style.textTransform = el.textCase && el.textCase !== 'none' ? el.textCase : '';
      const decos = [];
      if (el.underline) decos.push('underline');
      if (el.strikethrough) decos.push('line-through');
      if (decos.length) inner.style.textDecoration = decos.join(' ');
      if (el.underline) {
        inner.style.textUnderlineOffset = (el.underlineOffset != null ? el.underlineOffset : 3) + 'px';
      }
      const stretch = (el.fontStretch || 100) / 100;
      if (stretch !== 1) {
        const ORIGIN = { left: 'left', center: 'center', right: 'right', justify: 'left' };
        inner.style.transformOrigin = (ORIGIN[el.align] || 'left') + ' center';
        inner.style.transform = 'scaleX(' + stretch + ')';
      }
      inner.innerHTML = el.html || escapeHtml(el.text || '');
      applyDefaultBrMargin(inner, el.paragraphSpacing || 0);
      const isEditing = !preview && state.editingElementId === el.id;
      if (isEditing) {
        node.classList.add('editing');
        inner.contentEditable = 'true';
        inner.spellcheck = false;
        inner.setAttribute('data-edit-id', el.id);
        node.style.textTransform = '';
        inner.style.textTransform = '';
        inner.style.outline = 'none';
        inner.style.cursor = 'text';
        inner.style.userSelect = 'text';
        setTimeout(() => {
          inner.focus();
          const range = document.createRange();
          range.selectNodeContents(inner);
          const sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
        }, 0);
        inner.addEventListener('input', () => {
          recordHistory();
          el.html = inner.innerHTML;
          el.text = editablePlainText(inner);
          maybeReleaseForcedTextCase(el, el.text);
          autoSizeTextElement(el);
          node.style.left = el.x + 'px';
          node.style.top = el.y + 'px';
          node.style.width = el.w + 'px';
          node.style.height = el.h + 'px';
          renderSlidesList();
        });
        inner.addEventListener('blur', (be) => {
          if (state.editingElementId !== el.id) return;
          // Keep edit mode alive when focus moves into the Properties panel
          // (color pickers, sliders, dropdowns) ??otherwise the typography
          // controls can't apply per-selection styles.
          const next = be.relatedTarget;
          const props = document.getElementById('propertiesPanel');
          if (next && props && props.contains(next)) return;
          state.editingElementId = null;
          renderCanvas();
          renderProperties();
          persist();
        });
        inner.addEventListener('keydown', (ke) => {
          if (ke.key === 'Escape') {
            ke.preventDefault();
            ke.stopPropagation();
            inner.blur();
            return;
          }
          // Let typography shortcuts (Shift+Arrow, Ctrl+Shift+Arrow, Ctrl+B/I,
          // Alt+Arrow, etc.) reach the document handler so partial selections
          // can be styled. The document handler returns early at the
          // isContentEditable guard before destructive shortcuts (Delete,
          // nudge, etc.) would fire.
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
    } else if (el.type === 'image' || el.type === 'vector') {
      const clip = document.createElement('div');
      clip.className = 'media-clip';
      clip.style.borderRadius = effectiveRadius(el) + 'px';
      if (el.type === 'vector' && el.svg) {
        const vector = buildInlineVector(el);
        if (vector) {
          applyMediaCropStyle(vector, el);
          clip.appendChild(vector);
          node.appendChild(clip);
          if (!preview && state.cropElementId === el.id) {
            node.appendChild(buildCropOverlay(el));
          }
        }
      }
      if (!clip.firstChild) {
      const img = document.createElement('img');
      img.src = el.src || '';
      img.draggable = false;
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.objectFit = mediaFit(el);
      applyMediaCropStyle(img, el);
      img.style.display = 'block';
      img.style.pointerEvents = 'none';
      img.style.userSelect = 'none';
      img.style.borderRadius = effectiveRadius(el) + 'px';
      clip.appendChild(img);
      if (!clip.parentNode) node.appendChild(clip);
      if (!preview && state.cropElementId === el.id) {
        node.appendChild(buildCropOverlay(el));
      }
      }
    } else if (el.type === 'imageBanner') {
      buildImageBannerChildren(node, el, preview);
    } else if (el.type === 'video') {
      const clip = document.createElement('div');
      clip.className = 'media-clip';
      clip.style.borderRadius = effectiveRadius(el) + 'px';
      if (preview) {
        if (el.poster) {
          const poster = document.createElement('img');
          poster.src = el.poster;
          poster.draggable = false;
          poster.style.width = '100%';
          poster.style.height = '100%';
          poster.style.objectFit = mediaFit(el);
          applyMediaCropStyle(poster, el);
          poster.style.display = 'block';
          poster.style.pointerEvents = 'none';
          poster.style.borderRadius = effectiveRadius(el) + 'px';
          clip.appendChild(poster);
        } else {
          const still = document.createElement('div');
          still.style.width = '100%';
          still.style.height = '100%';
          still.style.background = '#212121';
          still.style.borderRadius = effectiveRadius(el) + 'px';
          clip.appendChild(still);
        }
        node.appendChild(clip);
      } else {
      const v = document.createElement('video');
      v.preload = 'auto';
      v.playsInline = true;
      v.crossOrigin = 'anonymous';
      if (el.poster) v.poster = el.poster;
      v.style.width = '100%';
      v.style.height = '100%';
      v.style.objectFit = mediaFit(el);
      applyMediaCropStyle(v, el);
      v.style.display = 'block';
      v.style.pointerEvents = 'none';
      v.style.background = '#212121';
      v.style.borderRadius = effectiveRadius(el) + 'px';
      if (preview) {
        v.muted = true;
        v.addEventListener('loadeddata', () => { try { v.currentTime = 0; } catch (e) {} });
      } else {
        v.muted = el.muted !== false;
        v.loop = el.loop !== false;
        if (el.controls) {
          v.controls = true;
          v.style.pointerEvents = 'auto';
        }
        if (el.autoplay !== false) {
          v.autoplay = true;
          v.muted = true;
          v.addEventListener('canplay', () => { v.play && v.play().catch(() => {}); }, { once: true });
        }
      }
      v.addEventListener('error', () => {
        console.warn('Video load error:', v.error && v.error.message, (v.src || '').slice(0, 64));
      });
      v.src = el.src || '';
      clip.appendChild(v);
      node.appendChild(clip);
      }
    } else if (el.type === 'linkcard') {
      buildLinkcardChildren(node, el);
    } else {
      node.style.background = el.fillEnabled === false ? 'transparent' : (el.fill || '#ffffff');
    }

    applyCornerStyle(node, el);

    // Stroke (skipped for line ??the line itself is the stroke).
    if (el.stroke && el.stroke.width && el.type !== 'line') {
      const border = strokeBorder(el.stroke);
      if (el.type === 'text') {
        // -webkit-text-stroke applies to text glyphs themselves; the box border
        // would overlap text content, which is rarely the intent for typography.
        const inner = node.querySelector(':scope > div');
        if (inner) {
          inner.style.webkitTextStroke = el.stroke.width + 'px ' + strokePaint(el.stroke);
        }
      } else if (el.type === 'image' || el.type === 'vector' || el.type === 'video' || el.type === 'imageBanner') {
        // Border overlays the radius cleanly via box-shadow inset.
        const r = effectiveRadius(el);
        const inset = '0 0 0 ' + el.stroke.width + 'px ' + strokePaint(el.stroke);
        node.style.boxShadow = (node.style.boxShadow ? node.style.boxShadow + ', ' : '') + 'inset ' + inset;
        if (r) node.style.borderRadius = r + 'px';
      } else {
        node.style.border = border;
        // Keep visual size consistent: shrink content area by border width.
        node.style.boxSizing = 'border-box';
      }
    }
    // Shadow.
    if (el.shadow) {
      if (el.type === 'text') {
        const inner = node.querySelector(':scope > div');
        if (inner) inner.style.textShadow = textShadowStr(el.shadow);
      } else if (el.type === 'image' || el.type === 'vector' || el.type === 'video' || el.type === 'imageBanner' || el.type === 'linkcard') {
        const f = dropShadowFilter(el.shadow);
        node.style.filter = (node.style.filter ? node.style.filter + ' ' : '') + f;
      } else {
        const s = boxShadowStr(el.shadow);
        node.style.boxShadow = (node.style.boxShadow ? node.style.boxShadow + ', ' : '') + s;
      }
    }

    if (el.link) node.setAttribute('data-link', el.link);

    if (!preview && !el.locked) {
      ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'].forEach(dir => {
        const handle = document.createElement('div');
        handle.className = 'resize-handle ' + dir;
        handle.addEventListener('mousedown', (e) => beginResize(e, el.id, dir));
        node.appendChild(handle);
      });
      const rotateHandle = document.createElement('div');
      rotateHandle.className = 'rotate-handle';
      rotateHandle.title = 'Drag to rotate (hold Shift to snap to 15 deg)';
      rotateHandle.addEventListener('mousedown', (e) => beginRotate(e, el.id));
      node.appendChild(rotateHandle);

      node.addEventListener('mousedown', (e) => {
        if (state.editingElementId === el.id) return;
        if (state.editingElementId) {
          state.editingElementId = null;
        }
        if (e.target.classList.contains('resize-handle') || e.target.classList.contains('rotate-handle')) return;
        const cloneDrag = (e.ctrlKey || e.metaKey) && e.shiftKey;
        const toggleOnly = !cloneDrag && (e.shiftKey || e.ctrlKey || e.metaKey);
        if (toggleOnly) {
          e.preventDefault();
          e.stopPropagation();
          toggleElementSelectionOnly(el.id);
          return;
        }
        // If already in a multi-selection that includes this element, don't
        // collapse to single ??preserve the group so drag moves them together.
        if (!isSelected(el.id)) {
          selectElement(el.id, false);
        }
        beginDrag(e, el.id);
      });
    } else if (!preview && el.locked) {
      // Locked element still allows selection (so Properties panel works) but
      // no drag/resize/rotate.
      node.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        if (e.shiftKey || e.ctrlKey || e.metaKey) toggleElementSelectionOnly(el.id);
        else selectElement(el.id, false);
      });
    }

    if (!preview && !el.locked && el.type === 'text') {
      node.addEventListener('dblclick', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (state.editingElementId === el.id) return;
        recordHistory();
        state.editingElementId = el.id;
        state.selectedElementId = el.id;
        renderCanvas();
        renderProperties();
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
    const selected = getSelectedElements();
    if (selected.length >= 2) body.appendChild(buildMultiSelectProps(selected));
    else if (selected.length === 1) body.appendChild(buildElementProps(selected[0]));
    else body.appendChild(buildSlideProps(slide));
  }

  // Multi-select Properties: show count, alignment, distribution, and common
  // batch operations (delete, duplicate, lock, hide, opacity).
  function buildMultiSelectProps(selected) {
    const frag = document.createDocumentFragment();

    const head = section(selected.length + ' elements selected');
    const headRow = row('');
    const grp = document.createElement('div');
    grp.className = 'pill-group';
    const copyBtnM = document.createElement('button');
    copyBtnM.className = 'pill';
    copyBtnM.textContent = 'Copy';
    copyBtnM.title = 'Ctrl+C';
    copyBtnM.addEventListener('click', copySelected);
    grp.appendChild(copyBtnM);
    const cutBtnM = document.createElement('button');
    cutBtnM.className = 'pill';
    cutBtnM.textContent = 'Cut';
    cutBtnM.title = 'Ctrl+X';
    cutBtnM.addEventListener('click', cutSelected);
    grp.appendChild(cutBtnM);
    const pasteBtnM = document.createElement('button');
    pasteBtnM.className = 'pill';
    pasteBtnM.textContent = 'Paste';
    pasteBtnM.title = 'Ctrl+V';
    pasteBtnM.addEventListener('click', pasteClipboard);
    grp.appendChild(pasteBtnM);
    const dupBtn = document.createElement('button');
    dupBtn.className = 'pill';
    dupBtn.textContent = 'Duplicate';
    dupBtn.title = 'Ctrl+D';
    dupBtn.addEventListener('click', duplicateSelected);
    grp.appendChild(dupBtn);
    const groupBtn = document.createElement('button');
    groupBtn.className = 'pill';
    groupBtn.textContent = 'Group';
    groupBtn.title = 'Group selected elements';
    groupBtn.addEventListener('click', groupSelected);
    grp.appendChild(groupBtn);
    const ungroupBtn = document.createElement('button');
    ungroupBtn.className = 'pill';
    ungroupBtn.textContent = 'Ungroup';
    ungroupBtn.title = 'Remove selected elements from their groups';
    ungroupBtn.addEventListener('click', ungroupSelected);
    grp.appendChild(ungroupBtn);
    const delBtn = document.createElement('button');
    delBtn.className = 'pill';
    delBtn.textContent = 'Delete';
    delBtn.title = 'Delete / Backspace';
    delBtn.addEventListener('click', deleteElement);
    grp.appendChild(delBtn);
    headRow.appendChild(grp);
    head.appendChild(headRow);
    frag.appendChild(head);

    // Align (relative to selection bounding box)
    const al = section('Align');
    const alRow1 = row('Horizontal');
    const alGrp1 = document.createElement('div');
    alGrp1.className = 'pill-group';
    [['left', 'align-left'], ['center', 'align-center'], ['right', 'align-right']].forEach(([k, icon]) => {
      const p = document.createElement('button');
      p.className = 'pill align-pill';
      p.innerHTML = '<span class="align-icon ' + icon + '"></span>';
      p.title = 'Align ' + k;
      p.setAttribute('aria-label', 'Align ' + k);
      p.addEventListener('click', () => alignSelected(k));
      alGrp1.appendChild(p);
    });
    alRow1.appendChild(alGrp1);
    al.appendChild(alRow1);
    const alRow2 = row('Vertical');
    const alGrp2 = document.createElement('div');
    alGrp2.className = 'pill-group';
    [['top', 'align-top'], ['middle', 'align-middle'], ['bottom', 'align-bottom']].forEach(([k, icon]) => {
      const p = document.createElement('button');
      p.className = 'pill align-pill';
      p.innerHTML = '<span class="align-icon ' + icon + '"></span>';
      p.title = 'Align ' + k;
      p.setAttribute('aria-label', 'Align ' + k);
      p.addEventListener('click', () => alignSelected(k));
      alGrp2.appendChild(p);
    });
    alRow2.appendChild(alGrp2);
    al.appendChild(alRow2);

    if (selected.length >= 3) {
      const distRow = row('Distribute');
      const distGrp = document.createElement('div');
      distGrp.className = 'pill-group';
      const dh = document.createElement('button');
      dh.className = 'pill';
      dh.textContent = 'Horizontal';
      dh.addEventListener('click', () => distributeSelected('h'));
      distGrp.appendChild(dh);
      const dv = document.createElement('button');
      dv.className = 'pill';
      dv.textContent = 'Vertical';
      dv.addEventListener('click', () => distributeSelected('v'));
      distGrp.appendChild(dv);
      distRow.appendChild(distGrp);
      al.appendChild(distRow);
    }
    frag.appendChild(al);

    // Batch opacity / lock / hide
    const bs = section('Batch state');
    const bsRow = row('');
    const bsGrp = document.createElement('div');
    bsGrp.className = 'pill-group';
    const lockAll = document.createElement('button');
    lockAll.className = 'pill';
    lockAll.textContent = 'Lock all';
    lockAll.addEventListener('click', () => batchUpdateSelected({ locked: true }));
    bsGrp.appendChild(lockAll);
    const unlockAll = document.createElement('button');
    unlockAll.className = 'pill';
    unlockAll.textContent = 'Unlock all';
    unlockAll.addEventListener('click', () => batchUpdateSelected({ locked: false }));
    bsGrp.appendChild(unlockAll);
    const hideAll = document.createElement('button');
    hideAll.className = 'pill';
    hideAll.textContent = 'Hide all';
    hideAll.addEventListener('click', () => batchUpdateSelected({ hidden: true }));
    bsGrp.appendChild(hideAll);
    const showAll = document.createElement('button');
    showAll.className = 'pill';
    showAll.textContent = 'Show all';
    showAll.addEventListener('click', () => batchUpdateSelected({ hidden: false }));
    bsGrp.appendChild(showAll);
    bsRow.appendChild(bsGrp);
    bs.appendChild(bsRow);
    bs.appendChild(buildNumSliderRow('Opacity', {
      min: 0, max: 1, step: 0.01, value: selected[0].opacity != null ? selected[0].opacity : 1,
      onChange: v => batchUpdateSelected({ opacity: Math.max(0, Math.min(1, v)) }, { skipPropsRender: true }),
    }));
    frag.appendChild(bs);

    // Multi-text controls — only when every selected element is a text box.
    // Mirrors the single-element Typography/Stroke/Shadow sections but every
    // change applies to all selected texts at once.
    const allText = selected.length > 0 && selected.every(el => el && el.type === 'text');
    if (allText) {
      frag.appendChild(buildMultiTextTypography(selected));
      frag.appendChild(buildMultiTextStroke(selected));
      frag.appendChild(buildMultiTextShadow(selected));
    }

    // Interaction (hover / motion / link) — works for any element type, so
    // it shows whenever 2+ are selected. Especially useful for grouped
    // elements: applying a hover effect to the group at once is the natural
    // companion to the group-hover propagation.
    frag.appendChild(buildMultiInteraction(selected));

    frag.appendChild(buildLayersSection());

    return frag;
  }

  // Interaction section for multi-select (and groups). Each control batch-
  // applies to every selected element. The first element's value seeds the
  // visible state (Figma-style "primary" display).
  function buildMultiInteraction(selected) {
    const ref = selected[0] || {};
    const ix = section('Interaction (' + selected.length + ')');

    const hr = row('Hover');
    hr.appendChild(selectInput(ref.hover || 'none', [
      ['none', 'None'],
      ['hover-scale', 'Scale up'],
      ['hover-glow', 'Glow'],
      ['hover-lift', 'Lift'],
      ['hover-fade', 'Fade'],
    ], v => batchUpdateSelected({ hover: v })));
    ix.appendChild(hr);

    if (ref.hover && ref.hover !== 'none') {
      const initialPct = Math.round((ref.hoverStrength != null ? ref.hoverStrength : 1) * 100);
      ix.appendChild(buildNumSliderRow('Strength', {
        min: 0, max: 800, step: 5, value: initialPct,
        onChange: pct => {
          batchUpdateSelected({ hoverStrength: parseFloat(pct) / 100 }, { skipPropsRender: true });
        },
      }));
    }

    const mr = row('Motion');
    mr.appendChild(selectInput(ref.motion || 'none', [
      ['none', 'None'],
      ['anim-fade', 'Fade in'],
      ['anim-up', 'Slide up'],
      ['anim-left', 'Slide left'],
      ['anim-right', 'Slide right'],
      ['anim-scale', 'Scale in'],
      ['anim-blink', 'Blink'],
      ['anim-fly-from-left', 'Fly in ← from off-slide left'],
      ['anim-fly-from-right', 'Fly in → from off-slide right'],
      ['anim-fly-from-top', 'Fly in ↓ from off-slide top'],
      ['anim-fly-from-bottom', 'Fly in ↑ from off-slide bottom'],
      ['anim-custom', 'Custom path (drag handle on canvas)'],
    ], v => batchUpdateSelected({ motion: v })));
    ix.appendChild(mr);

    if (ref.motion && ref.motion !== 'none') {
      const initialPct = Math.round((ref.motionStrength != null ? ref.motionStrength : 1) * 100);
      ix.appendChild(buildNumSliderRow('Strength', {
        min: 0, max: 800, step: 5, value: initialPct,
        onChange: pct => {
          batchUpdateSelected({ motionStrength: parseFloat(pct) / 100 }, { skipPropsRender: true });
        },
      }));
    }
    if (ref.motion === 'anim-blink') {
      const initialSec = ref.blinkDuration != null ? ref.blinkDuration : 1;
      ix.appendChild(buildNumSliderRow('Blink (s)', {
        min: 0.1, max: 10, step: 0.1, value: initialSec,
        onChange: sec => {
          const v = Math.max(0.05, parseFloat(sec) || 1);
          batchUpdateSelected({ blinkDuration: v }, { skipPropsRender: true });
        },
      }));
    } else if (ref.motion && ref.motion !== 'none') {
      // Duration applies to all entrance motions except blink (which has its
      // own cycle-time control above). Defaults to the motion's CSS default.
      const dflt = ref.motion === 'anim-custom' || (ref.motion || '').indexOf('anim-fly') === 0 ? 0.8 : 0.6;
      const initialSec = ref.motionDuration != null ? ref.motionDuration : dflt;
      ix.appendChild(buildNumSliderRow('Duration (s)', {
        min: 0.1, max: 10, step: 0.1, value: initialSec,
        onChange: sec => {
          const v = Math.max(0.05, parseFloat(sec) || dflt);
          batchUpdateSelected({ motionDuration: v }, { skipPropsRender: true });
        },
      }));
    }
    if (ref.motion === 'anim-custom') {
      ix.appendChild(buildNumSliderRow('From X (px)', {
        min: -2000, max: 2000, step: 1, value: ref.motionFromX || 0,
        onChange: v => batchUpdateSelected({ motionFromX: Math.round(v) }, { skipPropsRender: true }),
      }));
      ix.appendChild(buildNumSliderRow('From Y (px)', {
        min: -2000, max: 2000, step: 1, value: ref.motionFromY || 0,
        onChange: v => batchUpdateSelected({ motionFromY: Math.round(v) }, { skipPropsRender: true }),
      }));
    }

    // Group link target: only show if every selected element supports a link.
    const allowLink = selected.every(el => el && el.type !== 'linkcard');
    if (allowLink) {
      const isSlideLink = !!(ref.link && ref.link.indexOf('slide:') === 0);
      const lr = row('Link');
      const linkInput = document.createElement('input');
      linkInput.type = 'url';
      linkInput.className = 'prop-input';
      linkInput.placeholder = 'https://...';
      linkInput.value = isSlideLink ? '' : (ref.link || '');
      linkInput.addEventListener('change', () => {
        batchUpdateSelected({ link: linkInput.value.trim() });
      });
      lr.appendChild(linkInput);
      ix.appendChild(lr);

      const gr = row('Go to');
      const slideSel = document.createElement('select');
      slideSel.className = 'prop-select';
      const noneOpt = document.createElement('option');
      noneOpt.value = '';
      noneOpt.textContent = '(none)';
      slideSel.appendChild(noneOpt);
      state.slides.forEach((s, i) => {
        const opt = document.createElement('option');
        opt.value = 'slide:' + s.id;
        opt.textContent = 'Slide ' + (i + 1);
        if (ref.link === opt.value) opt.selected = true;
        slideSel.appendChild(opt);
      });
      slideSel.addEventListener('change', () => {
        if (slideSel.value) batchUpdateSelected({ link: slideSel.value });
        else if (isSlideLink) batchUpdateSelected({ link: '' });
      });
      gr.appendChild(slideSel);
      ix.appendChild(gr);
    }

    const hint = document.createElement('div');
    hint.style.fontSize = '11px';
    hint.style.color = 'var(--text-faint)';
    hint.style.marginTop = '6px';
    hint.textContent = 'Grouped elements share hover triggers — hovering one fires the effect on every member, all scaling around the GROUP center as a single block.';
    ix.appendChild(hint);

    return ix;
  }

  // ---------- Multi-text Properties ----------
  // Typography section that applies every change to all selected text elements
  // via batchUpdateSelectedText. The first selected element seeds the visible
  // values (Figma-style — single value shown, applies to all). The same color
  // input is reused so the recent-colors swatch palette and current-color
  // highlight work identically here.
  function buildMultiTextTypography(selected) {
    const ref = selected[0];
    const t = section('Typography (' + selected.length + ')');

    // Font picker — buildFontPicker patches via updateElement on a single el,
    // so we wrap it: build for ref, then intercept its updateElement-style
    // mutations by rerouting through batchUpdateSelectedText. Simpler: just
    // replicate the picker minimally for batch, calling batchUpdateSelectedText.
    const fr = row('Font');
    fr.appendChild(buildFontPickerForBatch(ref));
    t.appendChild(fr);

    t.appendChild(buildNumSliderRow('Weight', {
      min: 100, max: 900, step: 1, value: ref.fontWeight || 400,
      onChange: v => {
        const w = Math.round(v);
        batchUpdateSelectedText({ fontWeight: w }, ['font-weight'], { skipPropsRender: true });
      },
    }));

    const sr = row('Size');
    const range = document.createElement('input');
    range.type = 'range';
    range.className = 'prop-range';
    range.min = '8';
    range.max = '200';
    range.value = String(ref.fontSize);
    const sv = document.createElement('span');
    sv.className = 'prop-value';
    sv.textContent = ref.fontSize + 'px';
    range.addEventListener('input', () => {
      const px = parseInt(range.value, 10);
      sv.textContent = px + 'px';
      batchUpdateSelectedText({ fontSize: px }, ['font-size'], { skipPropsRender: true });
    });
    sr.appendChild(range);
    sr.appendChild(sv);
    t.appendChild(sr);

    t.appendChild(buildNumSliderRow('Tracking', {
      min: -5, max: 30, step: 0.1, value: ref.letterSpacing || 0,
      onChange: v => batchUpdateSelectedText({ letterSpacing: parseFloat(v.toFixed(1)) }, ['letter-spacing'], { skipPropsRender: true }),
    }));

    t.appendChild(buildNumSliderRow('Width', {
      min: 50, max: 200, step: 1, value: ref.fontStretch || 100,
      onChange: v => batchUpdateSelectedText({ fontStretch: Math.round(v) }, ['font-stretch'], { skipPropsRender: true }),
    }));

    t.appendChild(buildNumSliderRow('Line ht', {
      min: 0.5, max: 3.0, step: 0.05, value: ref.lineHeight != null ? ref.lineHeight : 1.3,
      onChange: v => batchUpdateSelectedText({ lineHeight: parseFloat(parseFloat(v).toFixed(2)) }, ['line-height'], { skipPropsRender: true }),
    }));

    t.appendChild(buildNumSliderRow('Para gap', {
      min: 0, max: 200, step: 1, value: ref.paragraphSpacing || 0,
      onChange: v => batchUpdateParagraphGap(Math.max(0, Math.round(v))),
    }));

    const ar = row('Align');
    const apills = document.createElement('div');
    apills.className = 'pill-group';
    [['left', 'L'], ['center', 'C'], ['right', 'R'], ['justify', 'J']].forEach(([a, label]) => {
      const p = document.createElement('button');
      p.className = 'pill' + (ref.align === a ? ' active' : '');
      p.textContent = label;
      p.addEventListener('click', () => batchUpdateSelectedText({ align: a }));
      apills.appendChild(p);
    });
    ar.appendChild(apills);
    t.appendChild(ar);

    const var_ = row('V-Align');
    const vpills = document.createElement('div');
    vpills.className = 'pill-group';
    [['top', 'Top'], ['center', 'Mid'], ['bottom', 'Bot']].forEach(([v, label]) => {
      const p = document.createElement('button');
      p.className = 'pill' + ((ref.verticalAlign || 'center') === v ? ' active' : '');
      p.textContent = label;
      p.addEventListener('click', () => batchUpdateSelectedText({ verticalAlign: v }));
      vpills.appendChild(p);
    });
    var_.appendChild(vpills);
    t.appendChild(var_);

    const caser = row('Case');
    const cpills = document.createElement('div');
    cpills.className = 'pill-group';
    [['none', 'Aa'], ['uppercase', 'AA'], ['lowercase', 'aa'], ['capitalize', 'Title']].forEach(([c, label]) => {
      const p = document.createElement('button');
      p.className = 'pill' + ((ref.textCase || 'none') === c ? ' active' : '');
      p.textContent = label;
      p.addEventListener('click', () => batchUpdateSelectedText({ textCase: c }, ['text-transform']));
      cpills.appendChild(p);
    });
    caser.appendChild(cpills);
    t.appendChild(caser);

    const decoR = row('Style');
    const dpills = document.createElement('div');
    dpills.className = 'pill-group';
    const uPill = document.createElement('button');
    uPill.className = 'pill' + (ref.underline ? ' active' : '');
    uPill.textContent = 'Underline';
    uPill.style.textDecoration = 'underline';
    uPill.style.textUnderlineOffset = '3px';
    uPill.addEventListener('click', () => batchUpdateSelectedText({ underline: !ref.underline }, ['text-decoration', 'text-decoration-line']));
    dpills.appendChild(uPill);
    const uOffsetInput = document.createElement('input');
    uOffsetInput.type = 'number';
    uOffsetInput.step = '1';
    uOffsetInput.className = 'pill-num';
    uOffsetInput.title = 'Underline offset (px)';
    uOffsetInput.value = String(ref.underlineOffset != null ? ref.underlineOffset : 3);
    uOffsetInput.disabled = !ref.underline;
    uOffsetInput.addEventListener('change', () => {
      const v = Number(uOffsetInput.value);
      if (!Number.isFinite(v)) return;
      batchUpdateSelectedText({ underlineOffset: v }, ['text-underline-offset']);
    });
    dpills.appendChild(uOffsetInput);
    const sPill = document.createElement('button');
    sPill.className = 'pill' + (ref.strikethrough ? ' active' : '');
    sPill.textContent = 'Strike';
    sPill.style.textDecoration = 'line-through';
    sPill.addEventListener('click', () => batchUpdateSelectedText({ strikethrough: !ref.strikethrough }, ['text-decoration', 'text-decoration-line']));
    dpills.appendChild(sPill);
    decoR.appendChild(dpills);
    t.appendChild(decoR);

    const colr = row('Text color');
    colr.appendChild(colorInput(ref.color, v => {
      batchUpdateSelectedText({ color: v }, ['color'], { skipPropsRender: true });
    }));
    t.appendChild(colr);

    const bgRow = row('BG color');
    bgRow.appendChild(colorInput(ref.bg || '#000000', v => {
      batchUpdateSelectedText({ bg: v }, ['background-color', 'background'], { skipPropsRender: true });
    }));
    const noBgBtn = document.createElement('button');
    noBgBtn.className = 'pill';
    noBgBtn.textContent = ref.bg ? 'None' : 'Off';
    noBgBtn.title = 'Remove background';
    noBgBtn.style.flex = '0 0 auto';
    if (!ref.bg) noBgBtn.disabled = true;
    noBgBtn.addEventListener('click', () => batchUpdateSelectedText({ bg: '' }));
    bgRow.appendChild(noBgBtn);
    t.appendChild(bgRow);

    return t;
  }

  // Slim font picker for multi-text: routes the chosen font through
  // batchUpdateSelectedText so all selected texts receive it. Keeps the same
  // popup UI as the per-element picker.
  function buildFontPickerForBatch(ref) {
    // Reuse the full font picker (search popup with Presets / Local / Project
    // / Web / Google sections) but redirect its apply step to batch-update
    // every selected text element instead of the single ref.
    return buildFontPicker(ref, {
      apply: (name, patch, cssProps) => {
        batchUpdateSelectedText(patch, cssProps);
      },
      // Hover preview must paint every selected text element so the user can
      // judge how a font looks across the whole multi-selection.
      getPreviewIds: () => {
        const slide = getCurrentSlide();
        if (!slide) return [];
        return Array.from(state.selectedElementIds || []).filter(id => {
          const t = slide.elements.find(x => x.id === id);
          return t && t.type === 'text';
        });
      },
    });
  }

  function buildMultiTextStroke(selected) {
    const ref = selected[0];
    const sk = section('Stroke (' + selected.length + ')');
    const strokeOn = !!(ref.stroke && ref.stroke.width);
    const toggleRow = row('');
    const togglePill = document.createElement('button');
    togglePill.className = 'pill' + (strokeOn ? ' active' : '');
    togglePill.textContent = strokeOn ? 'On' : 'Off';
    togglePill.addEventListener('click', () => {
      if (strokeOn) batchUpdateSelected({ stroke: null });
      else batchUpdateSelected({ stroke: { width: 2, color: '#ffffff', style: 'solid' } });
    });
    toggleRow.appendChild(togglePill);
    sk.appendChild(toggleRow);
    if (strokeOn) {
      sk.appendChild(buildNumSliderRow('Width', {
        min: 0, max: 40, step: 1, value: ref.stroke.width || 0,
        onChange: v => {
          const w = Math.max(0, Math.round(v));
          // Each selected text gets a fresh stroke object so they don't share
          // a reference (mutating one would mutate all otherwise).
          state.selectedElementIds.forEach(id => {
            const slide = getCurrentSlide();
            if (!slide) return;
            const el = slide.elements.find(e => e.id === id);
            if (!el || el.type !== 'text') return;
            el.stroke = Object.assign({}, el.stroke || { color: '#ffffff', style: 'solid' }, { width: w });
          });
          renderCanvas();
          renderSlidesList();
          persist();
        },
      }));
      const colorRow = row('Color');
      colorRow.appendChild(colorInput(ref.stroke.color || '#ffffff', v => {
        state.selectedElementIds.forEach(id => {
          const slide = getCurrentSlide();
          if (!slide) return;
          const el = slide.elements.find(e => e.id === id);
          if (!el || el.type !== 'text') return;
          el.stroke = Object.assign({}, el.stroke || { width: 2, style: 'solid' }, { color: v });
        });
        renderCanvas();
        renderSlidesList();
        persist();
      }));
      sk.appendChild(colorRow);
    }
    return sk;
  }

  function buildMultiTextShadow(selected) {
    const ref = selected[0];
    const sh = section('Shadow (' + selected.length + ')');
    const shadowOn = !!ref.shadow;
    const toggleRow = row('');
    const togglePill = document.createElement('button');
    togglePill.className = 'pill' + (shadowOn ? ' active' : '');
    togglePill.textContent = shadowOn ? 'On' : 'Off';
    togglePill.addEventListener('click', () => {
      if (shadowOn) batchUpdateSelected({ shadow: null });
      else batchUpdateSelected({ shadow: { x: 0, y: 8, blur: 24, color: 'rgba(0,0,0,0.4)' } });
    });
    toggleRow.appendChild(togglePill);
    sh.appendChild(toggleRow);
    if (shadowOn) {
      function patchAll(prop, value) {
        state.selectedElementIds.forEach(id => {
          const slide = getCurrentSlide();
          if (!slide) return;
          const el = slide.elements.find(e => e.id === id);
          if (!el || el.type !== 'text') return;
          el.shadow = Object.assign({}, el.shadow || { x: 0, y: 8, blur: 24, color: 'rgba(0,0,0,0.4)' }, { [prop]: value });
        });
        renderCanvas();
        renderSlidesList();
        persist();
      }
      const xy = row('X / Y');
      xy.appendChild(numInput(ref.shadow.x || 0, v => patchAll('x', Math.round(v))));
      xy.appendChild(numInput(ref.shadow.y || 0, v => patchAll('y', Math.round(v))));
      sh.appendChild(xy);
      sh.appendChild(buildNumSliderRow('Blur', {
        min: 0, max: 100, step: 1, value: ref.shadow.blur || 0,
        onChange: v => patchAll('blur', Math.max(0, Math.round(v))),
      }));
      const colorRow = row('Color');
      colorRow.appendChild(colorInput(ref.shadow.color || '#000000', v => patchAll('color', v)));
      sh.appendChild(colorRow);
    }
    return sh;
  }

  function groupSelected() {
    const selected = getSelectedElements();
    if (selected.length < 2) return;
    recordHistory();
    const id = uid('grp');
    const name = 'Group ' + (Date.now().toString(36).slice(-4).toUpperCase());
    selected.forEach(el => {
      el.groupId = id;
      el.groupName = name;
    });
    renderAll();
  }

  function ungroupSelected() {
    const selected = getSelectedElements();
    if (!selected.length) return;
    recordHistory();
    selected.forEach(el => {
      delete el.groupId;
      delete el.groupName;
    });
    renderAll();
  }

  // Apply same patch to every selected element (without per-call re-renders).
  function batchUpdateSelected(patch, opts) {
    opts = opts || {};
    const slide = getCurrentSlide();
    if (!slide) return;
    recordHistory();
    state.selectedElementIds.forEach(id => {
      const el = slide.elements.find(e => e.id === id);
      if (!el) return;
      Object.assign(el, patch);
    });
    renderCanvas();
    renderSlidesList();
    if (!opts.skipPropsRender) renderProperties();
    persist();
  }

  const TEXT_AUTOSIZE_KEY_SET = new Set([
    'text', 'html', 'font', 'fontSize', 'fontWeight', 'fontStyle',
    'letterSpacing', 'lineHeight', 'paragraphSpacing',
    'fontStretch', 'textCase', 'align', 'verticalAlign',
  ]);

  // Batch-apply a typography patch to every selected text element. cssProps
  // (optional) lists CSS properties to strip from each element's el.html so the
  // element-wide change wins over leftover spans from prior selection edits.
  // Re-runs auto-fit when the patch touches a metric that changes glyph
  // bounds. Skips non-text or hidden elements transparently.
  function batchUpdateSelectedText(patch, cssProps, opts) {
    opts = opts || {};
    const slide = getCurrentSlide();
    if (!slide) return;
    recordHistory();
    const triggers = Object.keys(patch).some(k => TEXT_AUTOSIZE_KEY_SET.has(k));
    state.selectedElementIds.forEach(id => {
      const el = slide.elements.find(e => e.id === id);
      if (!el || el.type !== 'text') return;
      const finalPatch = (cssProps && cssProps.length)
        ? buildTextPatch(el, patch, cssProps)
        : Object.assign({}, patch);
      Object.assign(el, finalPatch);
      if (triggers) autoSizeTextElement(el);
    });
    renderCanvas();
    renderSlidesList();
    if (!opts.skipPropsRender) renderProperties();
    persist();
  }

  // Like batchUpdateSelectedText but for paragraph gap — also strips inline
  // margins on br/div/p so the new spacing actually reapplies.
  function batchUpdateParagraphGap(px) {
    const slide = getCurrentSlide();
    if (!slide) return;
    recordHistory();
    state.selectedElementIds.forEach(id => {
      const el = slide.elements.find(e => e.id === id);
      if (!el || el.type !== 'text') return;
      const patch = { paragraphSpacing: px };
      if (el.html) {
        const cleaned = clearParagraphGapsFromHtml(el.html);
        if (cleaned !== el.html) patch.html = cleaned;
      }
      Object.assign(el, patch);
      autoSizeTextElement(el);
    });
    renderCanvas();
    renderSlidesList();
    persist();
  }

  // Compute selection bounding box (min/max in canvas coords).
  function selectionBBox() {
    const sels = getSelectedElements().filter(el => !el.locked && !el.hidden);
    if (!sels.length) return null;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    sels.forEach(el => {
      minX = Math.min(minX, el.x);
      minY = Math.min(minY, el.y);
      maxX = Math.max(maxX, el.x + el.w);
      maxY = Math.max(maxY, el.y + el.h);
    });
    return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
  }

  function alignSelected(mode) {
    const sels = getSelectedElements().filter(el => !el.locked && !el.hidden);
    if (!sels.length) return;
    const bb = selectionBBox();
    if (!bb) return;
    recordHistory();
    sels.forEach(el => {
      switch (mode) {
        case 'left':   el.x = bb.x; break;
        case 'center': el.x = bb.x + (bb.w - el.w) / 2; break;
        case 'right':  el.x = bb.x + bb.w - el.w; break;
        case 'top':    el.y = bb.y; break;
        case 'middle': el.y = bb.y + (bb.h - el.h) / 2; break;
        case 'bottom': el.y = bb.y + bb.h - el.h; break;
      }
      el.x = Math.round(el.x);
      el.y = Math.round(el.y);
    });
    renderCanvas();
    renderSlidesList();
    persist();
  }

  // Bucket the current selection into distribution items: each item is either a
  // single ungrouped element or the union bbox of all selected elements that
  // share a groupId. Grouped elements travel together when distributed.
  function selectionDistributeItems() {
    const sels = getSelectedElements().filter(el => !el.locked && !el.hidden);
    if (!sels.length) return [];
    const map = new Map();
    sels.forEach(el => {
      const key = el.groupId ? ('g:' + el.groupId) : ('s:' + el.id);
      let bucket = map.get(key);
      if (!bucket) {
        bucket = { elements: [], minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
        map.set(key, bucket);
      }
      bucket.elements.push(el);
      bucket.minX = Math.min(bucket.minX, el.x);
      bucket.minY = Math.min(bucket.minY, el.y);
      bucket.maxX = Math.max(bucket.maxX, el.x + el.w);
      bucket.maxY = Math.max(bucket.maxY, el.y + el.h);
    });
    return Array.from(map.values()).map(b => ({
      elements: b.elements,
      x: b.minX, y: b.minY,
      w: b.maxX - b.minX, h: b.maxY - b.minY,
    }));
  }

  // Average gap (px) between adjacent items along the axis, or null when not
  // distributable. Used to populate the toolbar gap input with the current
  // value so the user can edit it numerically.
  function computeSelectionGap(axis) {
    const items = selectionDistributeItems();
    if (items.length < 2) return null;
    items.sort((a, b) => axis === 'h' ? a.x - b.x : a.y - b.y);
    let total = 0;
    for (let i = 1; i < items.length; i++) {
      if (axis === 'h') total += items[i].x - (items[i - 1].x + items[i - 1].w);
      else total += items[i].y - (items[i - 1].y + items[i - 1].h);
    }
    return total / (items.length - 1);
  }

  function distributeSelected(axis, opts) {
    const items = selectionDistributeItems();
    if (items.length < 2) return false;
    const customGap = opts && opts.gap != null && Number.isFinite(opts.gap) ? opts.gap : null;
    // Default (equal spacing) needs 3+ items so the outermost two can stay put.
    // Custom-gap mode works with 2+ since we anchor the first and lay the rest
    // out using the explicit gap.
    if (items.length < 3 && customGap == null) return false;

    items.sort((a, b) => axis === 'h' ? a.x - b.x : a.y - b.y);
    let gap;
    if (customGap != null) {
      gap = customGap;
    } else {
      const first = items[0];
      const last = items[items.length - 1];
      const span = axis === 'h'
        ? (last.x + last.w - first.x)
        : (last.y + last.h - first.y);
      const totalSize = items.reduce((s, it) => s + (axis === 'h' ? it.w : it.h), 0);
      gap = (span - totalSize) / (items.length - 1);
    }

    recordHistory();
    let cursor = axis === 'h' ? items[0].x : items[0].y;
    items.forEach(it => {
      const target = Math.round(cursor);
      const delta = target - (axis === 'h' ? it.x : it.y);
      if (delta !== 0) {
        it.elements.forEach(el => {
          if (axis === 'h') el.x = Math.round(el.x + delta);
          else el.y = Math.round(el.y + delta);
        });
      }
      cursor += (axis === 'h' ? it.w : it.h) + gap;
    });

    renderCanvas();
    renderSlidesList();
    syncSelectionAlignToolbar();
    persist();
    return true;
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

  function buildLayersSection() {
    const slide = getCurrentSlide();
    const wrap = section('Layers');
    if (!slide || !slide.elements || !slide.elements.length) {
      const empty = document.createElement('div');
      empty.className = 'layers-empty';
      empty.textContent = 'No elements on this slide';
      wrap.appendChild(empty);
      return wrap;
    }

    const list = document.createElement('div');
    list.className = 'layers-list';
    const elements = slide.elements.map((el, index) => ({ el, index })).reverse();
    elements.forEach(({ el, index }) => {
      const item = document.createElement('div');
      item.className = 'layer-item';
      if (isSelected(el.id)) item.classList.add('active');
      if (el.hidden) item.classList.add('muted');

      const meta = document.createElement('button');
      meta.type = 'button';
      meta.className = 'layer-meta';
      meta.title = 'Select layer';
      meta.addEventListener('click', (e) => {
        e.preventDefault();
        selectElement(el.id, e.shiftKey);
      });

      const type = document.createElement('span');
      type.className = 'layer-type';
      type.textContent = el.groupId ? 'G' : (el.type === 'imageBanner' ? 'B' : (el.type === 'linkcard' ? 'L' : el.type.slice(0, 1).toUpperCase()));
      meta.appendChild(type);

      const label = document.createElement('span');
      label.className = 'layer-name';
      label.textContent = el.groupId ? groupName(el.groupId) + ' / ' + elementLabel(el, index) : elementLabel(el, index);
      meta.appendChild(label);
      item.appendChild(meta);

      const actions = document.createElement('div');
      actions.className = 'layer-actions';
      [
        ['Visibility', el.hidden ? 'Show' : 'Hide', el.hidden ? 'S' : 'H', () => updateElement(el.id, { hidden: !el.hidden })],
        ['Lock', el.locked ? 'Unlock' : 'Lock', el.locked ? 'U' : 'L', () => updateElement(el.id, { locked: !el.locked })],
        ['Bring forward', 'Bring forward', '^', () => moveElementZ(el.id, 'forward')],
        ['Send backward', 'Send backward', 'v', () => moveElementZ(el.id, 'backward')],
      ].forEach(([title, label, text, fn]) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'layer-action';
        btn.title = label || title;
        btn.setAttribute('aria-label', label || title);
        btn.textContent = text;
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          fn();
        });
        actions.appendChild(btn);
      });
      item.appendChild(actions);
      list.appendChild(item);
    });
    wrap.appendChild(list);
    return wrap;
  }

  function numInput(value, onChange) {
    const wrap = document.createElement('span');
    wrap.className = 'number-control';
    const i = document.createElement('input');
    i.type = 'number';
    i.className = 'prop-input';
    i.value = value;
    i.addEventListener('change', () => onChange(parseFloat(i.value) || 0));
    wrap.appendChild(i);
    wrap.appendChild(makeStepper(() => {
      i.stepUp();
      onChange(parseFloat(i.value) || 0);
    }, () => {
      i.stepDown();
      onChange(parseFloat(i.value) || 0);
    }));
    return wrap;
  }

  function makeStepper(onUp, onDown) {
    const stepper = document.createElement('span');
    stepper.className = 'number-stepper';
    const up = document.createElement('button');
    up.type = 'button';
    up.className = 'number-step number-step-up';
    up.textContent = '^';
    up.title = 'Increase';
    const down = document.createElement('button');
    down.type = 'button';
    down.className = 'number-step number-step-down';
    down.textContent = 'v';
    down.title = 'Decrease';
    up.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      onUp();
    });
    down.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      onDown();
    });
    stepper.appendChild(up);
    stepper.appendChild(down);
    return stepper;
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

  function elTypeClass(type) {
    if (type === 'text' || type === 'image' || type === 'vector' || type === 'video' || type === 'imageBanner' || type === 'linkcard') return type;
    return 'shape-' + type;
  }

  function buildStrengthRow(el, field) {
    // Strength values are stored as multipliers (1 == 100%); the UI shows %.
    const initialPct = Math.round((el[field] != null ? el[field] : 1) * 100);
    return buildNumSliderRow('Strength', {
      min: 0, max: 800, step: 5, value: initialPct,
      onChange: pct => {
        const patch = {};
        patch[field] = parseFloat(pct) / 100;
        updateElement(el.id, patch, { skipPropsRender: true });
      },
    });
  }

  function appendMediaEditControls(sectionNode, el, opts) {
    opts = opts || {};
    const sizeR = row('Size');
    sizeR.appendChild(numInput(el.w, v => {
      const w = Math.max(20, Math.round(v));
      if (el.aspectLocked) {
        const ratio = el.aspectRatio || (el.w || 1) / Math.max(1, el.h || 1);
        updateElement(el.id, { w, h: Math.max(20, Math.round(w / ratio)), aspectRatio: ratio });
      } else {
        updateElement(el.id, { w });
      }
    }));
    sizeR.appendChild(numInput(el.h, v => {
      const h = Math.max(20, Math.round(v));
      if (el.aspectLocked) {
        const ratio = el.aspectRatio || (el.w || 1) / Math.max(1, el.h || 1);
        updateElement(el.id, { h, w: Math.max(20, Math.round(h * ratio)), aspectRatio: ratio });
      } else {
        updateElement(el.id, { h });
      }
    }));
    sectionNode.appendChild(sizeR);

    const lockR = row('Ratio');
    const lockLabel = document.createElement('label');
    lockLabel.className = 'check-row';
    lockLabel.title = 'When locked, drag resize and W/H inputs keep the current ratio. Hold Shift while dragging for temporary ratio lock.';
    const lock = document.createElement('input');
    lock.type = 'checkbox';
    lock.checked = !!el.aspectLocked;
    lock.addEventListener('change', () => {
      const currentRatio = (el.w || 1) / Math.max(1, el.h || 1);
      updateElement(el.id, {
        aspectLocked: lock.checked,
        aspectRatio: lock.checked ? currentRatio : el.aspectRatio || currentRatio,
      });
    });
    const lockText = document.createElement('span');
    lockText.textContent = 'Keep ratio';
    lockLabel.appendChild(lock);
    lockLabel.appendChild(lockText);
    lockR.appendChild(lockLabel);
    sectionNode.appendChild(lockR);

    const radiusMax = Math.max(1, maxElementRadius(el));
    sectionNode.appendChild(buildNumSliderRow('Radius', {
      min: 0,
      max: radiusMax,
      step: 1,
      value: Math.min(radiusMax, el.radius || 0),
      onChange: v => updateElement(el.id, radiusPatch(el, v), { skipPropsRender: true }),
    }));

    if (isCroppable(el)) {
      const cropR = row('Crop');
      const cropBtn = document.createElement('button');
      cropBtn.className = 'pill' + (state.cropElementId === el.id ? ' active' : '');
      cropBtn.textContent = state.cropElementId === el.id ? 'Cropping' : 'Crop';
      cropBtn.addEventListener('click', () => {
        if (state.cropElementId === el.id) cancelCropMode();
        else startCropMode(el.id);
      });
      cropR.appendChild(cropBtn);
      sectionNode.appendChild(cropR);
    }

    const hint = document.createElement('div');
    hint.className = 'prop-help';
    hint.textContent = 'Resize with handles. Hold Shift to keep ratio. Crop opens a draggable crop frame on the image.';
    sectionNode.appendChild(hint);
  }

  function buildLinkcardChildren(node, el) {
    const r = effectiveRadius(el);
    node.style.borderRadius = r + 'px';
    const imgDiv = document.createElement('div');
    imgDiv.className = 'linkcard-image';
    imgDiv.style.borderRadius = r + 'px';
    if (el.image) imgDiv.style.backgroundImage = 'url("' + el.image + '")';
    node.appendChild(imgDiv);
  }

  function buildImageBannerChildren(node, el, staticPreview) {
    const imgs = Array.isArray(el.images) ? el.images : [];
    const r = effectiveRadius(el);
    node.style.borderRadius = r + 'px';
    node.style.background = '#212121';
    const clip = document.createElement('div');
    clip.className = 'media-clip';
    clip.style.borderRadius = r + 'px';
    node.appendChild(clip);
    if (!imgs.length) {
      const empty = document.createElement('div');
      empty.className = 'banner-empty';
      empty.textContent = 'Add images';
      clip.appendChild(empty);
      return;
    }
    if (staticPreview) {
      const img = document.createElement('img');
      img.src = imgs[0] || '';
      img.draggable = false;
      img.className = 'banner-image';
      img.style.opacity = '1';
      img.style.objectFit = mediaFit(el);
      img.style.transition = 'none';
      applyMediaCropStyle(img, el);
      clip.appendChild(img);
      return;
    }
    if ((el.transition || 'fade') === 'slide') {
      const track = document.createElement('div');
      track.className = 'banner-track';
      track.style.width = (imgs.length + 1) * 100 + '%';
      track.style.transform = 'translateX(0)';
      track.style.transitionDuration = Math.max(120, el.fadeMs || 350) + 'ms';
      track.style.transitionTimingFunction = 'cubic-bezier(.2,.8,.2,1)';
      const trackImages = imgs.concat(imgs[0]);
      trackImages.forEach(src => {
        const img = document.createElement('img');
        img.src = src || '';
        img.draggable = false;
        img.className = 'banner-track-image';
        img.style.width = (100 / (imgs.length + 1)) + '%';
        img.style.objectFit = mediaFit(el);
        applyMediaCropStyle(img, el);
        track.appendChild(img);
      });
      clip.appendChild(track);
      if (imgs.length > 1) {
        let idx = 0;
        const interval = Math.max(2000, Math.min(4500, el.interval || 2800));
        const timer = setInterval(() => {
          if (!node.isConnected) {
            clearInterval(timer);
            return;
          }
          idx += 1;
          track.style.transition = 'transform ' + Math.max(120, el.fadeMs || 350) + 'ms cubic-bezier(.2,.8,.2,1)';
          track.style.transform = 'translateX(-' + (idx * 100 / (imgs.length + 1)) + '%)';
          if (idx === imgs.length) {
            setTimeout(() => {
              if (!node.isConnected) return;
              track.style.transition = 'none';
              track.style.transform = 'translateX(0)';
              idx = 0;
            }, Math.max(120, el.fadeMs || 350) + 30);
          }
        }, interval);
      }
      return;
    }
    imgs.forEach((src, i) => {
      const img = document.createElement('img');
      img.src = src || '';
      img.draggable = false;
      img.className = 'banner-image';
      img.style.objectFit = mediaFit(el);
      applyMediaCropStyle(img, el);
      img.style.opacity = i === 0 ? '1' : '0';
      img.style.transitionDuration = Math.max(120, el.fadeMs || 350) + 'ms';
      img.style.transitionTimingFunction = 'cubic-bezier(.2,.8,.2,1)';
      clip.appendChild(img);
    });
    if (imgs.length > 1) {
      let idx = 0;
      const interval = Math.max(2000, Math.min(4500, el.interval || 2800));
      const timer = setInterval(() => {
        if (!node.isConnected) {
          clearInterval(timer);
          return;
        }
        const children = node.querySelectorAll('.banner-image');
        if (!children.length) return;
        const prev = idx % children.length;
        idx = (idx + 1) % children.length;
        children[prev].style.opacity = '0';
        children[idx].style.opacity = '1';
      }, interval);
    }
  }

  function buildCropOverlay(el) {
    if (!cropDraft || cropDraft.id !== el.id) cropDraft = { id: el.id, rect: defaultCropRect() };
    cropDraft.rect = clampCropRect(cropDraft.rect);
    const overlay = document.createElement('div');
    overlay.className = 'crop-overlay';
    overlay.addEventListener('mousedown', e => e.stopPropagation());

    const shade = document.createElement('div');
    shade.className = 'crop-shade';
    shade.addEventListener('mousedown', e => {
      e.preventDefault();
      e.stopPropagation();
      applyCropMode();
    });
    overlay.appendChild(shade);

    const box = document.createElement('div');
    box.className = 'crop-box';
    setCropBoxStyle(box, cropDraft.rect);
    box.addEventListener('mousedown', e => beginCropDrag(e, 'move', box));
    ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'].forEach(dir => {
      const h = document.createElement('div');
      h.className = 'crop-handle ' + dir;
      h.addEventListener('mousedown', e => beginCropDrag(e, dir, box));
      box.appendChild(h);
    });
    overlay.appendChild(box);

    const actions = document.createElement('div');
    actions.className = 'crop-actions';
    const apply = document.createElement('button');
    apply.type = 'button';
    apply.textContent = 'Apply';
    apply.addEventListener('mousedown', e => e.stopPropagation());
    apply.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      applyCropMode();
    });
    const cancel = document.createElement('button');
    cancel.type = 'button';
    cancel.textContent = 'Cancel';
    cancel.addEventListener('mousedown', e => e.stopPropagation());
    cancel.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      cancelCropMode();
    });
    actions.appendChild(apply);
    actions.appendChild(cancel);
    overlay.appendChild(actions);
    return overlay;
  }

  function setCropBoxStyle(box, r) {
    box.style.left = r.x + '%';
    box.style.top = r.y + '%';
    box.style.width = r.w + '%';
    box.style.height = r.h + '%';
  }

  function beginCropDrag(e, mode, box) {
    e.preventDefault();
    e.stopPropagation();
    const host = box.closest('.el');
    if (!host || !cropDraft) return;
    const hostRect = host.getBoundingClientRect();
    const start = Object.assign({}, cropDraft.rect);
    const startX = e.clientX;
    const startY = e.clientY;
    const min = 5;

    function move(ev) {
      const dx = (ev.clientX - startX) / Math.max(1, hostRect.width) * 100;
      const dy = (ev.clientY - startY) / Math.max(1, hostRect.height) * 100;
      let r = Object.assign({}, start);
      if (mode === 'move') {
        r.x = start.x + dx;
        r.y = start.y + dy;
      } else {
        if (mode.indexOf('w') !== -1) { r.x = start.x + dx; r.w = start.w - dx; }
        if (mode.indexOf('e') !== -1) { r.w = start.w + dx; }
        if (mode.indexOf('n') !== -1) { r.y = start.y + dy; r.h = start.h - dy; }
        if (mode.indexOf('s') !== -1) { r.h = start.h + dy; }
        r.w = Math.max(min, r.w);
        r.h = Math.max(min, r.h);
      }
      cropDraft.rect = clampCropRect(r);
      setCropBoxStyle(box, cropDraft.rect);
    }
    function up() {
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseup', up);
    }
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
  }

  function buildFontPicker(el, opts) {
    opts = opts || {};
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
    input.value = el ? (el.font || 'sans') : 'sans';
    input.placeholder = 'Search or choose a font';
    input.autocomplete = 'off';
    input.spellcheck = false;

    const popup = document.createElement('div');
    popup.className = 'font-popup';
    popup.hidden = true;
    document.body.appendChild(popup);

    // Hover-preview state. previewOriginals snapshots the un-previewed font
    // for each target element on the FIRST hover, so subsequent hovers can
    // swap the preview without losing the user's original choice.
    let previewOriginals = null;

    function getPreviewTargetIds() {
      if (typeof opts.getPreviewIds === 'function') {
        const ids = opts.getPreviewIds();
        return Array.isArray(ids) ? ids : [];
      }
      return el ? [el.id] : [];
    }

    function previewFont(name) {
      const slide = getCurrentSlide();
      if (!slide) return;
      const ids = getPreviewTargetIds();
      if (!ids.length) return;
      // Snapshot originals only on the first hover so we always revert to the
      // value the user actually had before opening the picker.
      if (!previewOriginals) {
        previewOriginals = new Map();
        ids.forEach(id => {
          const t = slide.elements.find(x => x.id === id);
          if (t && t.type === 'text') previewOriginals.set(id, t.font);
        });
      }
      ids.forEach(id => {
        const t = slide.elements.find(x => x.id === id);
        if (t && t.type === 'text') t.font = name;
      });
      loadFontIfKnown(name);
      renderCanvas();
    }

    function clearPreview(restore, skipRender) {
      if (!previewOriginals) return;
      if (restore !== false) {
        const slide = getCurrentSlide();
        if (slide) {
          previewOriginals.forEach((origFont, id) => {
            const t = slide.elements.find(x => x.id === id);
            if (t && t.type === 'text') t.font = origFont;
          });
          if (!skipRender) renderCanvas();
        }
      }
      previewOriginals = null;
    }

    function applyFontChoice(name) {
      loadFontIfKnown(name);
      input.value = name;
      // Revert preview state before committing — the real apply path below
      // goes through updateElement/batchUpdateSelectedText which records
      // history and updates state properly. Without the revert, the commit
      // would diff against the previewed value, not the user's original.
      // Skip the revert render: the commit re-renders with the new font, so
      // an interim render with the original would just flicker.
      clearPreview(true, true);
      hidePopup();

      const projectFont = PROJECT_FONTS[name];
      const patch = { font: name };
      const cssProps = ['font-family'];
      if (projectFont && projectFont.exactFile) {
        patch.fontWeight = projectFont.forceWeight || 400;
        patch.fontStyle = projectFont.forceStyle || 'normal';
        cssProps.push('font-weight', 'font-style');
      }
      // Custom apply hook for multi-select (one picker, applies to all
      // selected text elements); otherwise fall back to the single-element
      // updateElement path.
      if (typeof opts.apply === 'function') {
        opts.apply(name, patch, cssProps);
      } else {
        const slide = getCurrentSlide();
        const current = slide && slide.elements.find(item => item.id === el.id);
        if (!current || current.type !== 'text') return;
        updateElement(current.id, buildTextPatch(current, patch, cssProps));
      }
      scheduleFontReadyRefresh();
    }

    function rebuildPopup(filter) {
      popup.innerHTML = '';
      const f = (filter || '').toLowerCase().trim();
      const presetMatches = PRESETS.filter(n => !f || n.toLowerCase().includes(f));
      const localMatches = localFonts.filter(n => !f || n.toLowerCase().includes(f));
      const projectMatches = PROJECT_FONT_PICKER_NAMES.filter(n => !f || n.toLowerCase().includes(f));
      const webMatches = WEBFONT_NAMES.filter(n => !f || n.toLowerCase().includes(f));
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
      if (projectMatches.length) {
        appendSection('Project fonts (' + projectMatches.length + ')', projectMatches, { project: true });
      }
      if (webMatches.length) {
        appendSection('Web fonts (' + webMatches.length + ')', webMatches, { web: true });
      }
      if (googleMatches.length) {
        appendSection('Google Fonts (' + googleMatches.length + ')', googleMatches, { google: true });
      }

      if (!presetMatches.length && !localMatches.length && !projectMatches.length && !webMatches.length && !googleMatches.length) {
        const empty = document.createElement('div');
        empty.className = 'font-popup-empty';
        empty.textContent = 'No matching fonts';
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
      } else if (opts.project) {
        const tag = document.createElement('span');
        tag.className = 'font-popup-badge';
        tag.textContent = 'P';
        item.appendChild(tag);
      } else if (opts.web) {
        const tag = document.createElement('span');
        tag.className = 'font-popup-badge';
        tag.textContent = 'W';
        item.appendChild(tag);
      }

      item.addEventListener('mousedown', (e) => {
        e.preventDefault();
        applyFontChoice(name);
      });
      // Live preview: hovering an item applies its font to the selection
      // without committing, so the user can scan the list and see how each
      // font looks on their actual text. The preview is reverted on leave.
      item.addEventListener('mouseenter', () => previewFont(name));
      return item;
    }

    function positionPopup() {
      const rect = input.getBoundingClientRect();
      const gap = 6;
      const minW = 420;
      const maxW = Math.min(640, window.innerWidth - 24);
      const width = Math.max(rect.width, Math.min(minW, maxW));
      const left = Math.max(12, Math.min(window.innerWidth - width - 12, rect.left));
      const below = window.innerHeight - rect.bottom - 12;
      const above = rect.top - 12;
      const openUp = below < 320 && above > below;
      const maxH = Math.max(240, Math.min(620, (openUp ? above : below) - gap));
      popup.style.left = left + 'px';
      popup.style.width = width + 'px';
      popup.style.maxHeight = maxH + 'px';
      if (openUp) {
        popup.style.top = 'auto';
        popup.style.bottom = (window.innerHeight - rect.top + gap) + 'px';
      } else {
        popup.style.bottom = 'auto';
        popup.style.top = (rect.bottom + gap) + 'px';
      }
    }

    function showPopup() {
      preloadAllGoogleFontsForPreview();
      preloadAllWebfonts();
      rebuildPopup(input.value);
      positionPopup();
      popup.hidden = false;
      const propsBody = document.getElementById('propertiesBody');
      if (propsBody) propsBody.addEventListener('scroll', hidePopup, { once: true, passive: true });
      window.addEventListener('resize', hidePopup, { once: true });
    }

    function hidePopup() {
      popup.hidden = true;
      clearPreview(true);
    }

    function destroyPopup() {
      clearPreview(true);
      if (popup.parentNode) popup.parentNode.removeChild(popup);
    }

    // Pointer left the entire popup → revert any active hover preview.
    popup.addEventListener('mouseleave', () => clearPreview(true));

    input.addEventListener('focus', () => {
      input.value = '';
      showPopup();
      // Pre-select existing text so users can type to filter immediately,
      // or click an item without disturbing the value.
      setTimeout(() => input.select(), 0);
    });
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
        applyFontChoice(v);
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
    detectBtn.title = 'Load installed fonts from this PC';
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
        saveLocalFontsCache(localFontRecords);
        alert(list.length + ' fonts loaded. Click the Font field to choose one.');
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
        if (!confirm('This image is ' + (file.size / 1024 / 1024).toFixed(1) + 'MB. The exported file may become large. Continue?')) {
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

  function buildNumSliderRow(label, opts) {
    const r = row(label);
    const range = document.createElement('input');
    range.type = 'range';
    range.className = 'prop-range';
    range.min = String(opts.min);
    range.max = String(opts.max);
    range.step = String(opts.step || 1);
    range.value = String(opts.value);

    const numI = document.createElement('input');
    numI.type = 'number';
    numI.className = 'prop-input prop-num';
    numI.value = String(opts.value);
    numI.min = String(opts.min);
    numI.max = String(opts.max);
    numI.step = String(opts.step || 1);
    numI.style.textAlign = 'right';
    const numWrap = document.createElement('span');
    numWrap.className = 'number-control number-control-compact';
    numWrap.appendChild(numI);
    numWrap.appendChild(makeStepper(() => {
      numI.stepUp();
      const v = parseFloat(numI.value);
      range.value = String(clampForSlider(v));
      emit(v);
    }, () => {
      numI.stepDown();
      const v = parseFloat(numI.value);
      range.value = String(clampForSlider(v));
      emit(v);
    }));

    function emit(v) { if (opts.onChange) opts.onChange(v); }
    function clampForSlider(v) {
      return Math.max(opts.min, Math.min(opts.max, v));
    }

    range.addEventListener('input', () => {
      const v = parseFloat(range.value);
      numI.value = String(v);
      emit(v);
    });
    numI.addEventListener('input', () => {
      const v = parseFloat(numI.value);
      if (isNaN(v)) return;
      range.value = String(clampForSlider(v));
      emit(v);
    });
    numI.addEventListener('change', () => {
      let v = parseFloat(numI.value);
      if (isNaN(v)) v = opts.value;
      numI.value = String(v);
      range.value = String(clampForSlider(v));
      emit(v);
    });

    r.appendChild(range);
    r.appendChild(numWrap);
    return r;
  }

  function clamp01(v) { return Math.max(0, Math.min(1, v)); }
  function clamp255(v) { return Math.max(0, Math.min(255, Math.round(v))); }
  function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(v => clamp255(v).toString(16).padStart(2, '0')).join('');
  }
  function parseHexColor(raw) {
    const v = String(raw || '').trim();
    const m = v.match(/^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i);
    if (!m) return null;
    let h = m[1];
    if (h.length === 3 || h.length === 4) h = h.split('').map(ch => ch + ch).join('');
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
      a: h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1,
    };
  }
  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        default: h = (r - g) / d + 4; break;
      }
      h *= 60;
    }
    return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
  }
  function hslToRgb(h, s, l) {
    h = ((h % 360) + 360) % 360;
    s = clamp01(s / 100);
    l = clamp01(l / 100);
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = l - c / 2;
    let r = 0, g = 0, b = 0;
    if (h < 60) { r = c; g = x; }
    else if (h < 120) { r = x; g = c; }
    else if (h < 180) { g = c; b = x; }
    else if (h < 240) { g = x; b = c; }
    else if (h < 300) { r = x; b = c; }
    else { r = c; b = x; }
    return { r: clamp255((r + m) * 255), g: clamp255((g + m) * 255), b: clamp255((b + m) * 255) };
  }
  function cssColorToRgba(value) {
    const raw = String(value || '').trim();
    if (!raw) return null;
    const hex = parseHexColor(raw);
    if (hex) return hex;
    if (raw.toLowerCase() === 'transparent') return { r: 0, g: 0, b: 0, a: 0 };
    const probe = document.createElement('span');
    probe.style.color = '';
    probe.style.color = raw;
    if (!probe.style.color) return null;
    document.body.appendChild(probe);
    const computed = getComputedStyle(probe).color;
    document.body.removeChild(probe);
    const m = computed.match(/rgba?\(([^)]+)\)/i);
    if (!m) return null;
    const parts = m[1].split(',').map(v => v.trim());
    return {
      r: clamp255(parseFloat(parts[0])),
      g: clamp255(parseFloat(parts[1])),
      b: clamp255(parseFloat(parts[2])),
      a: parts[3] == null ? 1 : clamp01(parseFloat(parts[3])),
    };
  }

  // ---------- Recent colors palette ----------
  // Cross-input palette of the most recently picked colors. Persists in
  // localStorage so the user's swatches survive a refresh and follow them
  // across slides / projects. Stored as normalized strings (#hex or rgba(...))
  // so the same color picked from different inputs collapses to one chip.
  const RECENT_COLORS_KEY = 'pres-gen-recent-colors-v1';
  const RECENT_COLORS_LIMIT = 12;
  let recentColors = (function loadRecentColors() {
    try {
      const raw = localStorage.getItem(RECENT_COLORS_KEY);
      if (!raw) return [];
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr.filter(v => typeof v === 'string').slice(0, RECENT_COLORS_LIMIT) : [];
    } catch (_) { return []; }
  })();
  const recentColorListeners = new Set();
  function saveRecentColors() {
    try { localStorage.setItem(RECENT_COLORS_KEY, JSON.stringify(recentColors)); } catch (_) {}
  }
  function normalizeColorForPalette(value) {
    const rgba = cssColorToRgba(value);
    if (!rgba) return '';
    if (rgba.a >= 1) return rgbToHex(rgba.r, rgba.g, rgba.b).toLowerCase();
    const a = +rgba.a.toFixed(3);
    return 'rgba(' + rgba.r + ', ' + rgba.g + ', ' + rgba.b + ', ' + a + ')';
  }
  function pushRecentColor(value) {
    const norm = normalizeColorForPalette(value);
    if (!norm) return;
    const idx = recentColors.indexOf(norm);
    if (idx >= 0) recentColors.splice(idx, 1);
    recentColors.unshift(norm);
    if (recentColors.length > RECENT_COLORS_LIMIT) recentColors.length = RECENT_COLORS_LIMIT;
    saveRecentColors();
    recentColorListeners.forEach(fn => { try { fn(); } catch (_) {} });
  }

  function colorInput(value, onChange) {
    const initial = cssColorToRgba(value) || { r: 255, g: 255, b: 255, a: 1 };
    let hsl = rgbToHsl(initial.r, initial.g, initial.b);
    let alpha = initial.a;
    // Normalized form of the picker's current value, used to mark the matching
    // swatch as "active" so the user can see which palette chip equals their
    // current selection. Updated by every code path that mutates the color.
    let currentNorm = normalizeColorForPalette(value);
    const wrap = document.createElement('span');
    wrap.className = 'color-input-wrap';
    const main = document.createElement('div');
    main.className = 'color-main-row';
    const c = document.createElement('input');
    c.type = 'color';
    c.className = 'prop-color';
    c.value = rgbToHex(initial.r, initial.g, initial.b);
    const eye = document.createElement('button');
    eye.type = 'button';
    eye.className = 'color-eyedropper';
    eye.title = 'Pick color from screen';
    eye.setAttribute('aria-label', 'Pick color');
    eye.textContent = '⌖';
    if (!window.EyeDropper) eye.hidden = true;
    const t = document.createElement('input');
    t.type = 'text';
    t.className = 'prop-input prop-color-code';
    t.value = value;

    const mixer = document.createElement('details');
    mixer.className = 'color-mixer';
    const summary = document.createElement('summary');
    summary.textContent = 'Mixer';
    mixer.appendChild(summary);

    function mixerRow(label, min, max, step, val, suffix) {
      const r = document.createElement('div');
      r.className = 'color-mixer-row';
      const l = document.createElement('span');
      l.textContent = label;
      const range = document.createElement('input');
      range.type = 'range';
      range.min = String(min);
      range.max = String(max);
      range.step = String(step);
      range.value = String(val);
      const out = document.createElement('input');
      out.type = 'number';
      out.className = 'color-mixer-value';
      out.min = String(min);
      out.max = String(max);
      out.step = String(step);
      out.value = String(val);
      out.title = label + suffix;
      r.appendChild(l);
      r.appendChild(range);
      r.appendChild(out);
      mixer.appendChild(r);
      return { range, out, suffix };
    }

    const hue = mixerRow('Hue', 0, 360, 1, hsl.h, '');
    const sat = mixerRow('Sat', 0, 100, 1, hsl.s, '%');
    const light = mixerRow('Light', 0, 100, 1, hsl.l, '%');
    const alp = mixerRow('Alpha', 0, 100, 1, Math.round(alpha * 100), '%');

    function syncMixer() {
      hue.range.value = String(hsl.h); hue.out.value = String(hsl.h);
      sat.range.value = String(hsl.s); sat.out.value = String(hsl.s);
      light.range.value = String(hsl.l); light.out.value = String(hsl.l);
      alp.range.value = String(Math.round(alpha * 100)); alp.out.value = String(Math.round(alpha * 100));
    }
    function emitFromMixer() {
      hsl = {
        h: parseInt(hue.range.value, 10) || 0,
        s: parseInt(sat.range.value, 10) || 0,
        l: parseInt(light.range.value, 10) || 0,
      };
      alpha = clamp01((parseInt(alp.range.value, 10) || 0) / 100);
      const rgb = hslToRgb(hsl.h, hsl.s, hsl.l);
      const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
      const css = alpha < 1 ? 'rgba(' + rgb.r + ', ' + rgb.g + ', ' + rgb.b + ', ' + alpha.toFixed(2).replace(/0$/, '').replace(/\.$/, '') + ')' : hex;
      c.value = hex;
      t.value = css;
      syncMixer();
      emitColor(css);
    }

    let emitRaf = 0;
    let pendingColor = '';
    let recentDebounce = 0;
    function emitColor(css) {
      pendingColor = css;
      currentNorm = normalizeColorForPalette(css);
      syncActiveSwatch();
      if (emitRaf) return;
      emitRaf = requestAnimationFrame(() => {
        emitRaf = 0;
        onChange(pendingColor);
      });
      // Debounce palette updates so dragging the alpha slider doesn't spam
      // the recent list with every intermediate color.
      if (recentDebounce) clearTimeout(recentDebounce);
      recentDebounce = setTimeout(() => {
        recentDebounce = 0;
        if (pendingColor) pushRecentColor(pendingColor);
      }, 600);
    }
    function applyExternalColor(css) {
      const rgba = cssColorToRgba(css);
      if (!rgba) return;
      hsl = rgbToHsl(rgba.r, rgba.g, rgba.b);
      alpha = rgba.a;
      c.value = rgbToHex(rgba.r, rgba.g, rgba.b);
      const out = alpha < 1
        ? 'rgba(' + rgba.r + ', ' + rgba.g + ', ' + rgba.b + ', ' + alpha.toFixed(2).replace(/0$/, '').replace(/\.$/, '') + ')'
        : c.value;
      t.value = out;
      syncMixer();
      currentNorm = normalizeColorForPalette(out);
      onChange(out);
      pushRecentColor(out);
    }

    c.addEventListener('input', () => {
      const rgba = cssColorToRgba(c.value);
      if (rgba) {
        hsl = rgbToHsl(rgba.r, rgba.g, rgba.b);
        const css = alpha < 1 ? 'rgba(' + rgba.r + ', ' + rgba.g + ', ' + rgba.b + ', ' + alpha.toFixed(2).replace(/0$/, '').replace(/\.$/, '') + ')' : c.value;
        t.value = css;
        syncMixer();
        emitColor(css);
      }
    });
    eye.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!window.EyeDropper) return;
      try {
        const result = await new EyeDropper().open();
        const rgba = cssColorToRgba(result.sRGBHex);
        if (!rgba) return;
        hsl = rgbToHsl(rgba.r, rgba.g, rgba.b);
        alpha = 1;
        c.value = result.sRGBHex;
        t.value = result.sRGBHex;
        syncMixer();
        currentNorm = normalizeColorForPalette(result.sRGBHex);
        onChange(result.sRGBHex);
        pushRecentColor(result.sRGBHex);
        syncActiveSwatch();
      } catch (_) {}
    });
    t.addEventListener('change', () => {
      const rgba = cssColorToRgba(t.value);
      if (!rgba) return;
      hsl = rgbToHsl(rgba.r, rgba.g, rgba.b);
      alpha = rgba.a;
      c.value = rgbToHex(rgba.r, rgba.g, rgba.b);
      syncMixer();
      const v = t.value.trim();
      currentNorm = normalizeColorForPalette(v);
      onChange(v);
      pushRecentColor(v);
      syncActiveSwatch();
    });
    [hue.range, sat.range, light.range, alp.range].forEach(range => {
      range.addEventListener('input', emitFromMixer);
    });
    [hue, sat, light, alp].forEach(ctrl => {
      ctrl.out.addEventListener('input', () => {
        const v = parseFloat(ctrl.out.value);
        if (isNaN(v)) return;
        ctrl.range.value = String(Math.max(parseFloat(ctrl.range.min), Math.min(parseFloat(ctrl.range.max), v)));
        emitFromMixer();
      });
    });

    main.appendChild(c);
    main.appendChild(eye);
    main.appendChild(t);
    wrap.appendChild(main);

    // Recent-color swatch strip — rebuilt every time the global recent list
    // changes so all open color inputs stay in sync.
    const swatchRow = document.createElement('div');
    swatchRow.className = 'color-swatches';
    // syncActiveSwatch flips the .active class on whichever chip matches the
    // picker's current value. Cheap (just toggles classes), so it's safe to
    // call on every emit / mixer move.
    function syncActiveSwatch() {
      swatchRow.querySelectorAll('.color-swatch').forEach(chip => {
        const norm = chip.getAttribute('data-norm') || '';
        chip.classList.toggle('active', !!currentNorm && norm === currentNorm);
      });
    }
    function renderSwatches() {
      swatchRow.innerHTML = '';
      if (!recentColors.length) {
        swatchRow.hidden = true;
        return;
      }
      swatchRow.hidden = false;
      recentColors.forEach(col => {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'color-swatch';
        chip.title = col;
        chip.setAttribute('data-norm', col);
        // The visible color is painted by ::before via --swatch-color, so the
        // checker pattern stays visible behind semi-transparent picks.
        chip.style.setProperty('--swatch-color', col);
        // Prevent focus theft on mousedown so the contenteditable keeps its
        // selection. Without this, clicking a swatch blurs the text element
        // and collapses the user's range — meaning applyStyleToSelection
        // (which the parent onChange invokes) would silently fall through to
        // an element-wide change instead of decorating just the highlighted
        // text. We still preventDefault on click to swallow form submit, etc.
        // Pin the editable's selection at mousedown so the click handler
        // below can re-seat it just before the apply chain runs. We also
        // bump propsButtonPressDepth — without it, a selection-driven
        // re-render between mousedown and mouseup would destroy this chip
        // and the click event would never fire on the original element
        // (it would land on the common ancestor of mousedown/mouseup
        // targets instead, silently swallowing the user's action).
        chip.addEventListener('mousedown', (e) => {
          e.preventDefault();
          beginPropsButtonInteraction();
          captureRangeForButton();
        });
        chip.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          consumePinnedRange();
          applyExternalColor(col);
        });
        swatchRow.appendChild(chip);
      });
      syncActiveSwatch();
    }
    renderSwatches();
    recentColorListeners.add(renderSwatches);
    // Detach the listener when the input is detached so we don't leak.
    const detachObserver = new MutationObserver(() => {
      if (!wrap.isConnected) {
        recentColorListeners.delete(renderSwatches);
        detachObserver.disconnect();
      }
    });
    setTimeout(() => {
      if (wrap.parentNode) detachObserver.observe(wrap.parentNode, { childList: true, subtree: false });
    }, 0);
    wrap.appendChild(swatchRow);

    wrap.appendChild(mixer);
    return wrap;
  }

  function buildSlideProps(slide) {
    const frag = document.createDocumentFragment();

    frag.appendChild(buildLayersSection());

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
    bgRow.classList.add('prop-row-bg-color');
    const bgControls = document.createElement('div');
    bgControls.className = 'inline-prop-actions';
    bgRow.appendChild(colorInput(slide.bg, v => {
      slide.bg = v;
      renderCanvas();
      renderSlidesList();
      persist();
    }));
    const applyAllBg = document.createElement('button');
    applyAllBg.className = 'pill';
    applyAllBg.type = 'button';
    applyAllBg.textContent = 'Apply all';
    applyAllBg.title = 'Apply this background color to every slide';
    applyAllBg.addEventListener('click', () => applySlideBackgroundToAll(slide.bg));
    bgControls.appendChild(applyAllBg);
    bgRow.appendChild(bgControls);
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

    const view = section('View');
    const zoomRow = row('Zoom');
    const zoomPills = document.createElement('div');
    zoomPills.className = 'pill-group';
    const zoomOut = document.createElement('button');
    zoomOut.className = 'pill';
    zoomOut.textContent = '-';
    zoomOut.title = 'Zoom out';
    zoomOut.addEventListener('click', () => zoomBy(0.8));
    zoomPills.appendChild(zoomOut);
    const zoomFit = document.createElement('button');
    zoomFit.className = 'pill' + (state.zoom == null ? ' active' : '');
    zoomFit.textContent = state.zoom == null ? 'Fit' : Math.round((state.zoom || 1) * 100) + '%';
    zoomFit.title = 'Fit canvas';
    zoomFit.addEventListener('click', () => setZoom(null));
    zoomPills.appendChild(zoomFit);
    const zoomIn = document.createElement('button');
    zoomIn.className = 'pill';
    zoomIn.textContent = '+';
    zoomIn.title = 'Zoom in';
    zoomIn.addEventListener('click', () => zoomBy(1.25));
    zoomPills.appendChild(zoomIn);
    zoomRow.appendChild(zoomPills);
    view.appendChild(zoomRow);
    frag.appendChild(view);

    // Slide transition
    const tr = section('Slide transition');
    const trType = row('Effect');
    trType.appendChild(selectInput(slide.transition || 'none', [
      ['none', 'None'],
      ['fade', 'Fade'],
      ['scrollVertical', 'Vertical scroll'],
      ['slideHorizontal', 'Slide horizontal'],
      ['zoom', 'Zoom'],
    ], v => {
      recordHistory();
      slide.transition = v;
      renderProperties();
      persist();
    }));
    tr.appendChild(trType);
    tr.appendChild(buildNumSliderRow('Duration', {
      min: 0.15,
      max: 2,
      step: 0.05,
      value: ((slide.transitionMs || 650) / 1000),
      onChange: v => {
        recordHistory();
        slide.transitionMs = Math.max(150, Math.min(2000, Math.round(v * 1000)));
        persist();
      },
    }));
    const hint = document.createElement('div');
    hint.className = 'prop-help';
    hint.textContent = 'Applied when this slide appears in Preview, Present, and saved HTML.';
    tr.appendChild(hint);
    frag.appendChild(tr);

    // Add element
    const add = section('Add element');
    const addPills = document.createElement('div');
    addPills.className = 'pill-group';
    [['Text', 'text'], ['Rectangle', 'rect'], ['Circle', 'circle'], ['Line', 'line'], ['Image', 'image'], ['Banner', 'imageBanner'], ['Video', 'video'], ['Link Card', 'linkcard']].forEach(opt => {
      const p = document.createElement('button');
      p.className = 'pill';
      p.textContent = '+ ' + opt[0];
      p.addEventListener('click', () => addElement(opt[1]));
      addPills.appendChild(p);
    });
    add.appendChild(addPills);
    frag.appendChild(add);

    // Canvas size (applies to all slides)
    const cv = section('Canvas (all slides)');
    const presetRow = document.createElement('div');
    presetRow.className = 'prop-row';
    const presetPills = document.createElement('div');
    presetPills.className = 'pill-group';
    const PRESETS = [
      ['16:9', 1280, 720],
      ['HD', 1920, 1080],
      ['4:3', 1024, 768],
      ['1:1', 1080, 1080],
      ['9:16', 720, 1280],
    ];
    PRESETS.forEach(([label, w, h]) => {
      const p = document.createElement('button');
      p.className = 'pill';
      if (state.canvasW === w && state.canvasH === h) p.classList.add('active');
      p.textContent = label;
      p.title = w + ' x ' + h;
      p.addEventListener('click', () => {
        recordHistory();
        state.canvasW = w;
        state.canvasH = h;
        applyCanvasSize();
        fitCanvas();
        renderAll();
      });
      presetPills.appendChild(p);
    });
    presetRow.appendChild(presetPills);
    cv.appendChild(presetRow);

    const wRow = row('Width');
    wRow.appendChild(numInput(state.canvasW, v => {
      const n = Math.max(100, Math.min(8000, Math.round(v) || 0));
      if (!n) return;
      recordHistory();
      state.canvasW = n;
      applyCanvasSize();
      fitCanvas();
      renderAll();
    }));
    cv.appendChild(wRow);

    const hRow = row('Height');
    hRow.appendChild(numInput(state.canvasH, v => {
      const n = Math.max(100, Math.min(8000, Math.round(v) || 0));
      if (!n) return;
      recordHistory();
      state.canvasH = n;
      applyCanvasSize();
      fitCanvas();
      renderAll();
    }));
    cv.appendChild(hRow);

    frag.appendChild(cv);

    // Grid overlay (editor-only design aid; not exported)
    const gs = section('Grid (editor only)');

    const enableRow = row('Show grid');
    const enablePill = document.createElement('button');
    enablePill.className = 'pill' + (state.grid.enabled ? ' active' : '');
    enablePill.textContent = state.grid.enabled ? 'On' : 'Off';
    enablePill.addEventListener('click', () => {
      toggleGrid();
      renderProperties();
    });
    enableRow.appendChild(enablePill);
    const resetPill = document.createElement('button');
    resetPill.className = 'pill';
    resetPill.textContent = 'Reset';
    resetPill.title = 'Restore defaults';
    resetPill.addEventListener('click', () => {
      const wasEnabled = state.grid.enabled;
      state.grid = Object.assign({}, DEFAULT_GRID, { enabled: wasEnabled });
      syncGridToggleButton();
      renderCanvas();
      renderProperties();
      persist();
    });
    enableRow.appendChild(resetPill);
    gs.appendChild(enableRow);

    const colsRow = row('Columns');
    colsRow.appendChild(numInput(state.grid.cols, v => {
      const n = Math.max(1, Math.min(48, Math.round(v) || 1));
      updateGrid({ cols: n });
    }));
    gs.appendChild(colsRow);

    const colGutRow = row('Col gutter');
    colGutRow.appendChild(numInput(state.grid.colGutter, v => {
      const n = Math.max(0, Math.round(v) || 0);
      updateGrid({ colGutter: n });
    }));
    gs.appendChild(colGutRow);

    const colMarRow = row('Col margin');
    colMarRow.appendChild(numInput(state.grid.colMargin, v => {
      const n = Math.max(0, Math.round(v) || 0);
      updateGrid({ colMargin: n });
    }));
    gs.appendChild(colMarRow);

    const rowsRow = row('Rows');
    rowsRow.appendChild(numInput(state.grid.rows, v => {
      const n = Math.max(1, Math.min(48, Math.round(v) || 1));
      updateGrid({ rows: n });
    }));
    gs.appendChild(rowsRow);

    const rowGutRow = row('Row gutter');
    rowGutRow.appendChild(numInput(state.grid.rowGutter, v => {
      const n = Math.max(0, Math.round(v) || 0);
      updateGrid({ rowGutter: n });
    }));
    gs.appendChild(rowGutRow);

    const rowMarRow = row('Row margin');
    rowMarRow.appendChild(numInput(state.grid.rowMargin, v => {
      const n = Math.max(0, Math.round(v) || 0);
      updateGrid({ rowMargin: n });
    }));
    gs.appendChild(rowMarRow);

    const colorRow = row('Color');
    colorRow.appendChild(colorInput(state.grid.color, v => updateGrid({ color: v })));
    gs.appendChild(colorRow);

    gs.appendChild(buildNumSliderRow('Opacity', {
      min: 0, max: 1, step: 0.01, value: state.grid.opacity,
      onChange: v => updateGrid({ opacity: Math.max(0, Math.min(1, v)) }),
    }));

    frag.appendChild(gs);

    // Guides (editor-only design aid; not exported)
    const gd = section('Guides (editor only)');

    const gdEnableRow = row('Show guides');
    const gdEnablePill = document.createElement('button');
    gdEnablePill.className = 'pill' + (state.guides.enabled ? ' active' : '');
    gdEnablePill.textContent = state.guides.enabled ? 'On' : 'Off';
    gdEnablePill.addEventListener('click', () => {
      toggleGuides();
    });
    gdEnableRow.appendChild(gdEnablePill);
    gd.appendChild(gdEnableRow);

    const gdAddRow = row('Add');
    const gdAddPills = document.createElement('div');
    gdAddPills.className = 'pill-group';
    const addV = document.createElement('button');
    addV.className = 'pill';
    addV.textContent = '+ Vertical';
    addV.title = 'Add vertical guide at center';
    addV.addEventListener('click', () => addGuide('v'));
    gdAddPills.appendChild(addV);
    const addH = document.createElement('button');
    addH.className = 'pill';
    addH.textContent = '+ Horizontal';
    addH.title = 'Add horizontal guide at center';
    addH.addEventListener('click', () => addGuide('h'));
    gdAddPills.appendChild(addH);
    gdAddRow.appendChild(gdAddPills);
    gd.appendChild(gdAddRow);

    const gdColorRow = row('Color');
    gdColorRow.appendChild(colorInput(state.guides.color, v => {
      state.guides.color = v;
      renderCanvas();
      persist();
    }));
    gd.appendChild(gdColorRow);

    if (state.guides.items.length) {
      const listWrap = document.createElement('div');
      listWrap.className = 'guides-list';
      state.guides.items.forEach((gItem, idx) => {
        const r = row(gItem.axis === 'v' ? ('V' + (idx + 1) + ' (X)') : ('H' + (idx + 1) + ' (Y)'));
        const ni = numInput(gItem.position, v => {
          const max = gItem.axis === 'v' ? state.canvasW : state.canvasH;
          const n = Math.max(0, Math.min(max, Math.round(v) || 0));
          updateGuide(gItem.id, { position: n });
        });
        r.appendChild(ni);
        const del = document.createElement('button');
        del.className = 'pill';
        del.textContent = 'x';
        del.title = 'Delete guide';
        del.style.flex = '0 0 auto';
        del.addEventListener('click', () => removeGuide(gItem.id));
        r.appendChild(del);
        listWrap.appendChild(r);
      });
      gd.appendChild(listWrap);

      const clearRow = row('');
      const clearBtn = document.createElement('button');
      clearBtn.className = 'pill';
      clearBtn.textContent = 'Clear all';
      clearBtn.addEventListener('click', clearGuides);
      clearRow.appendChild(clearBtn);
      gd.appendChild(clearRow);
    } else {
      const hint = document.createElement('div');
      hint.className = 'empty-hint';
      hint.style.padding = '4px 0';
      hint.textContent = 'Drag guide lines on canvas to reposition';
      gd.appendChild(hint);
    }

    frag.appendChild(gd);

    return frag;
  }

  function buildElementProps(el) {
    const frag = document.createDocumentFragment();

    if (el.groupId) {
      const group = section(groupName(el.groupId));
      const groupRow = row('');
      const groupPills = document.createElement('div');
      groupPills.className = 'pill-group';
      const selectGroup = document.createElement('button');
      selectGroup.className = 'pill active';
      selectGroup.textContent = 'Group';
      selectGroup.title = 'Select entire group';
      selectGroup.addEventListener('click', () => selectElement(el.id, false));
      groupPills.appendChild(selectGroup);
      const ungroup = document.createElement('button');
      ungroup.className = 'pill';
      ungroup.textContent = 'Ungroup';
      ungroup.addEventListener('click', ungroupSelected);
      groupPills.appendChild(ungroup);
      groupRow.appendChild(groupPills);
      group.appendChild(groupRow);
      frag.appendChild(group);
    }

    // Visibility / Lock toggles + Opacity
    const cm = section('Layer state');
    const stateRow = row('');
    const stateGroup = document.createElement('div');
    stateGroup.className = 'pill-group';
    const lockPill = document.createElement('button');
    lockPill.className = 'pill' + (el.locked ? ' active' : '');
    lockPill.textContent = el.locked ? 'Locked' : 'Lock';
    lockPill.addEventListener('click', () => updateElement(el.id, { locked: !el.locked }));
    stateGroup.appendChild(lockPill);
    const hidePill = document.createElement('button');
    hidePill.className = 'pill' + (el.hidden ? ' active' : '');
    hidePill.textContent = el.hidden ? 'Hidden' : 'Show';
    hidePill.addEventListener('click', () => updateElement(el.id, { hidden: !el.hidden }));
    stateGroup.appendChild(hidePill);
    stateRow.appendChild(stateGroup);
    cm.appendChild(stateRow);
    cm.appendChild(buildNumSliderRow('Opacity', {
      min: 0, max: 1, step: 0.01, value: el.opacity != null ? el.opacity : 1,
      onChange: v => updateElement(el.id, { opacity: Math.max(0, Math.min(1, v)) }, { skipPropsRender: true }),
    }));
    const deleteRow = row('');
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'pill danger-pill';
    deleteBtn.textContent = 'Delete element';
    deleteBtn.addEventListener('click', deleteElement);
    deleteRow.appendChild(deleteBtn);
    cm.appendChild(deleteRow);
    frag.appendChild(cm);

    // Position & size
    const pos = section('Position & size');
    const r1 = row('X / Y');
    r1.appendChild(numInput(el.x, v => updateElement(el.id, { x: v })));
    r1.appendChild(numInput(el.y, v => updateElement(el.id, { y: v })));
    pos.appendChild(r1);
    const r2 = row('W / H');
    const mediaKeepsRatio = () => (el.type === 'image' || el.type === 'vector' || el.type === 'video' || el.type === 'imageBanner') && el.aspectLocked;
    r2.appendChild(numInput(el.w, v => {
      const w = Math.max(20, Math.round(v));
      if (mediaKeepsRatio()) {
        const ratio = el.aspectRatio || (el.w || 1) / Math.max(1, el.h || 1);
        updateElement(el.id, { w, h: Math.max(20, Math.round(w / ratio)), aspectRatio: ratio });
      } else {
        updateElement(el.id, { w });
      }
    }));
    r2.appendChild(numInput(el.h, v => {
      const h = Math.max(20, Math.round(v));
      if (mediaKeepsRatio()) {
        const ratio = el.aspectRatio || (el.w || 1) / Math.max(1, el.h || 1);
        updateElement(el.id, { h, w: Math.max(20, Math.round(h * ratio)), aspectRatio: ratio });
      } else {
        updateElement(el.id, { h });
      }
    }));
    pos.appendChild(r2);
    frag.appendChild(pos);

    // Layer order
    const slideForLayer = getCurrentSlide();
    const elsCount = slideForLayer ? slideForLayer.elements.length : 1;
    const elIdx = slideForLayer ? slideForLayer.elements.findIndex(e => e.id === el.id) : 0;
    const lyr = section('Layer  ' + (elIdx + 1) + ' / ' + elsCount);
    const lyrRow = document.createElement('div');
    lyrRow.className = 'pill-group';
    [
      ['To back', 'back', 'Send to back'],
      ['Down', 'backward', 'Send backward (Ctrl+[)'],
      ['Up', 'forward', 'Bring forward (Ctrl+])'],
      ['To front', 'front', 'Bring to front (Ctrl+Shift+])'],
    ].forEach(([label, op, title]) => {
      const p = document.createElement('button');
      p.className = 'pill';
      p.textContent = label;
      p.title = title;
      // Disable when already at boundary
      if ((op === 'back' || op === 'backward') && elIdx === 0) p.disabled = true;
      if ((op === 'front' || op === 'forward') && elIdx === elsCount - 1) p.disabled = true;
      p.addEventListener('click', () => moveElementZ(el.id, op));
      lyrRow.appendChild(p);
    });
    lyr.appendChild(lyrRow);
    frag.appendChild(lyr);
    frag.appendChild(buildLayersSection());

    if (el.type === 'text') {
      // Typography
      const t = section('Typography');
      const fr = row('Font');
      fr.appendChild(buildFontPicker(el));
      t.appendChild(fr);

      // Resolved style at the current caret/selection. When non-null, the
      // typography controls below display the *local* values (e.g. the bold
      // span the cursor sits in) instead of the element-wide defaults — so
      // the panel always reflects what's actually applied where the user is
      // working. Falls back to el.* when no edit context is active.
      const active = getActiveTextStyle(el);
      const valOr = (k, fallback) => active && active[k] != null ? active[k] : fallback;

      t.appendChild(buildNumSliderRow('Weight', {
        min: 100, max: 900, step: 1, value: valOr('fontWeight', el.fontWeight || 400),
        onChange: v => {
          const w = Math.round(v);
          if (applyStyleToSelection({ fontWeight: String(w) })) return;
          updateElement(el.id, buildTextPatch(el, { fontWeight: w }, ['font-weight']), { skipPropsRender: true });
        },
      }));

      t.appendChild(buildNumSliderRow('Size', {
        min: 1, max: 300, step: 1, value: valOr('fontSize', el.fontSize || 32),
        onChange: v => {
          const px = Math.max(1, Math.min(300, Math.round(v)));
          if (applyStyleToSelection({ fontSize: px + 'px' })) return;
          updateElement(el.id, buildTextPatch(el, { fontSize: px }, ['font-size']), { skipPropsRender: true });
        },
      }));

      // Letter spacing (?먭컙)
      t.appendChild(buildNumSliderRow('Tracking', {
        min: -20, max: 80, step: 0.1, value: valOr('letterSpacing', el.letterSpacing || 0),
        onChange: raw => {
          const v = Math.max(-20, Math.min(80, parseFloat(parseFloat(raw).toFixed(1))));
          if (applyStyleToSelection({ letterSpacing: v + 'px' })) return;
          updateElement(el.id, buildTextPatch(el, { letterSpacing: v }, ['letter-spacing']), { skipPropsRender: true });
        },
      }));

      // Font stretch / character width (湲????
      t.appendChild(buildNumSliderRow('Width', {
        min: 25, max: 200, step: 1, value: el.fontStretch || 100,
        onChange: raw => {
          const v = Math.max(25, Math.min(200, Math.round(raw)));
          if (applyStyleToSelection({ fontStretch: v + '%' })) return;
          updateElement(el.id, buildTextPatch(el, { fontStretch: v }, ['font-stretch']), { skipPropsRender: true });
        },
      }));

      // Line height (multiplier)
      t.appendChild(buildNumSliderRow('Line ht', {
        min: 0.1, max: 3.0, step: 0.01, value: valOr('lineHeight', el.lineHeight != null ? el.lineHeight : 1.3),
        onChange: v => {
          const lh = parseFloat(parseFloat(v).toFixed(2));
          if (applyStyleToSelection({ lineHeight: String(lh) })) return;
          updateElement(el.id, buildTextPatch(el, { lineHeight: lh }, ['line-height']), { skipPropsRender: true });
        },
      }));

      // Paragraph gap (extra space between hard line breaks)
      t.appendChild(buildNumSliderRow('Para gap', {
        min: -80, max: 200, step: 1, value: el.paragraphSpacing || 0,
        onChange: v => {
          const px = Math.max(-80, Math.min(200, Math.round(v)));
          if (applyParagraphSpacingToSelection(px)) return;
          const patch = { paragraphSpacing: px };
          if (el.html) {
            const cleaned = clearParagraphGapsFromHtml(el.html);
            if (cleaned !== el.html) patch.html = cleaned;
          }
          updateElement(el.id, patch, { skipPropsRender: true });
        },
      }));

      const ar = row('Align');
      const apills = document.createElement('div');
      apills.className = 'pill-group';
      [['left', 'L'], ['center', 'C'], ['right', 'R'], ['justify', 'J']].forEach(([a, label]) => {
        const p = document.createElement('button');
        p.className = 'pill' + (el.align === a ? ' active' : '');
        p.textContent = label;
        p.title = a;
        p.addEventListener('click', () => updateElement(el.id, { align: a }));
        apills.appendChild(p);
      });
      ar.appendChild(apills);
      t.appendChild(ar);

      const var_ = row('V-Align');
      const vpills = document.createElement('div');
      vpills.className = 'pill-group';
      [['top', 'Top'], ['center', 'Mid'], ['bottom', 'Bot']].forEach(([v, label]) => {
        const p = document.createElement('button');
        p.className = 'pill' + ((el.verticalAlign || 'center') === v ? ' active' : '');
        p.textContent = label;
        p.addEventListener('click', () => updateElement(el.id, { verticalAlign: v }));
        vpills.appendChild(p);
      });
      var_.appendChild(vpills);
      t.appendChild(var_);

      const caser = row('Case');
      const cpills = document.createElement('div');
      cpills.className = 'pill-group';
      const activeCase = active && active.textTransform ? active.textTransform : (el.textCase || 'none');
      [['none', 'Aa'], ['uppercase', 'AA'], ['lowercase', 'aa'], ['capitalize', 'Title']].forEach(([c, label]) => {
        const p = document.createElement('button');
        p.className = 'pill' + (activeCase === c ? ' active' : '');
        p.textContent = label;
        p.addEventListener('click', () => {
          if (applyStyleToSelection({ textTransform: c === 'none' ? 'none' : c })) return;
          updateElement(el.id, buildTextPatch(el, { textCase: c }, ['text-transform']), { skipPropsRender: true });
        });
        cpills.appendChild(p);
      });
      caser.appendChild(cpills);
      t.appendChild(caser);

      const decoR = row('Style');
      const dpills = document.createElement('div');
      dpills.className = 'pill-group';
      const activeItalic = active ? active.fontStyle === 'italic' : (el.fontStyle || 'normal') === 'italic';
      const activeUnderline = active ? active.underline : !!el.underline;
      const activeStrike = active ? active.strikethrough : !!el.strikethrough;
      const iPill = document.createElement('button');
      iPill.className = 'pill' + (activeItalic ? ' active' : '');
      iPill.textContent = 'Italic';
      iPill.style.fontStyle = 'italic';
      iPill.addEventListener('click', () => {
        const next = activeItalic ? 'normal' : 'italic';
        if (applyStyleToSelection({ fontStyle: next })) return;
        updateElement(el.id, buildTextPatch(el, { fontStyle: next }, ['font-style']));
      });
      dpills.appendChild(iPill);
      const uPill = document.createElement('button');
      uPill.className = 'pill' + (activeUnderline ? ' active' : '');
      uPill.textContent = 'Underline';
      uPill.style.textDecoration = 'underline';
      uPill.style.textUnderlineOffset = '3px';
      uPill.addEventListener('click', () => {
        if (applyStyleToSelection({ textDecoration: activeUnderline ? 'none' : 'underline' })) return;
        updateElement(el.id, buildTextPatch(el, { underline: !el.underline }, ['text-decoration', 'text-decoration-line']));
      });
      dpills.appendChild(uPill);
      // Inline numeric offset input — only enabled while underline is on.
      const uOffsetInput = document.createElement('input');
      uOffsetInput.type = 'number';
      uOffsetInput.step = '1';
      uOffsetInput.className = 'pill-num';
      uOffsetInput.title = 'Underline offset (px)';
      uOffsetInput.value = String(el.underlineOffset != null ? el.underlineOffset : 3);
      uOffsetInput.disabled = !activeUnderline;
      uOffsetInput.addEventListener('change', () => {
        const v = Number(uOffsetInput.value);
        if (!Number.isFinite(v)) return;
        updateElement(el.id, buildTextPatch(el, { underlineOffset: v }, ['text-underline-offset']));
      });
      dpills.appendChild(uOffsetInput);
      const sPill = document.createElement('button');
      sPill.className = 'pill' + (activeStrike ? ' active' : '');
      sPill.textContent = 'Strike';
      sPill.style.textDecoration = 'line-through';
      sPill.addEventListener('click', () => {
        if (applyStyleToSelection({ textDecoration: activeStrike ? 'none' : 'line-through' })) return;
        updateElement(el.id, buildTextPatch(el, { strikethrough: !el.strikethrough }, ['text-decoration', 'text-decoration-line']));
      });
      dpills.appendChild(sPill);
      decoR.appendChild(dpills);
      t.appendChild(decoR);

      const colr = row('Text color');
      colr.appendChild(colorInput(valOr('color', el.color), v => {
        if (applyStyleToSelection({ color: v })) return;
        updateElement(el.id, buildTextPatch(el, { color: v }, ['color']), { skipPropsRender: true });
      }));
      t.appendChild(colr);

      const bgRow = row('BG color');
      bgRow.appendChild(colorInput(valOr('backgroundColor', el.bg || '#212121'), v => {
        if (applyStyleToSelection({ backgroundColor: v })) return;
        updateElement(el.id, buildTextPatch(el, { bg: v }, ['background-color', 'background']), { skipPropsRender: true });
      }));
      const noBgBtn = document.createElement('button');
      noBgBtn.className = 'pill';
      noBgBtn.textContent = el.bg ? 'None' : 'Off';
      noBgBtn.title = 'Remove background (transparent)';
      noBgBtn.style.flex = '0 0 auto';
      if (!el.bg) {
        noBgBtn.disabled = true;
      }
      noBgBtn.addEventListener('click', () => updateElement(el.id, { bg: '' }));
      bgRow.appendChild(noBgBtn);
      t.appendChild(bgRow);

      frag.appendChild(t);
    } else if (el.type === 'image' || el.type === 'vector') {
      const s = section(el.type === 'vector' ? 'Vector' : 'Image');
      appendMediaEditControls(s, el);
      frag.appendChild(s);
    } else if (el.type === 'imageBanner') {
      const s = section('Image banner');
      const countRow = row('Images');
      const countWrap = document.createElement('div');
      countWrap.className = 'pill-group';
      const count = document.createElement('span');
      count.className = 'pill is-static';
      count.textContent = (el.images || []).length + ' images';
      countWrap.appendChild(count);
      const replaceBtn = document.createElement('button');
      replaceBtn.className = 'pill';
      replaceBtn.textContent = 'Replace';
      replaceBtn.addEventListener('click', () => uploadBannerImages(el.id, 'replace'));
      countWrap.appendChild(replaceBtn);
      const appendBtn = document.createElement('button');
      appendBtn.className = 'pill';
      appendBtn.textContent = 'Add';
      appendBtn.addEventListener('click', () => uploadBannerImages(el.id, 'append'));
      countWrap.appendChild(appendBtn);
      countRow.appendChild(countWrap);
      s.appendChild(countRow);

      appendMediaEditControls(s, el);

      const transitionR = row('Transition');
      const transitionPills = document.createElement('div');
      transitionPills.className = 'pill-group';
      [['fade', 'Fade'], ['slide', 'Slide']].forEach(([value, label]) => {
        const p = document.createElement('button');
        p.className = 'pill' + ((el.transition || 'fade') === value ? ' active' : '');
        p.textContent = label;
        p.addEventListener('click', () => updateElement(el.id, { transition: value }));
        transitionPills.appendChild(p);
      });
      transitionR.appendChild(transitionPills);
      s.appendChild(transitionR);

      s.appendChild(buildNumSliderRow('Interval', {
        min: 2, max: 4.5, step: 0.1, value: Number(((el.interval || 2800) / 1000).toFixed(1)),
        onChange: v => {
          const seconds = Math.max(2, Math.min(4.5, parseFloat(v) || 2.8));
          updateElement(el.id, { interval: Math.round(seconds * 1000) }, { skipPropsRender: true });
        },
      }));
      s.appendChild(buildNumSliderRow('Fade', {
        min: 0.1, max: 0.8, step: 0.1, value: Number(((el.fadeMs || 350) / 1000).toFixed(1)),
        onChange: v => {
          const seconds = Math.max(0.1, Math.min(0.8, parseFloat(v) || 0.4));
          updateElement(el.id, { fadeMs: Math.round(seconds * 1000) }, { skipPropsRender: true });
        },
      }));
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
        const patch = { link: v };
        // If image is still the screenshot of an old URL (or empty), regenerate
        if (!el.image || el.image.indexOf('mshots/v1/') !== -1) {
          patch.image = v ? screenshotUrl(v) : '';
        }
        updateElement(el.id, patch);
      });
      ur.appendChild(urlInput);
      s.appendChild(ur);

      const refreshR = row('');
      const refreshBtn = document.createElement('button');
      refreshBtn.className = 'pill';
      refreshBtn.textContent = 'Refresh screenshot';
      refreshBtn.addEventListener('click', () => {
        if (!el.link) { alert('Enter a URL first.'); return; }
        updateElement(el.id, { image: screenshotUrl(el.link, { bust: true }) });
      });
      refreshR.appendChild(refreshBtn);
      s.appendChild(refreshR);

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
      appendMediaEditControls(s, el);

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

      // Custom poster (thumbnail shown until video plays)
      const posterR = row('Poster');
      const posterBtns = document.createElement('div');
      posterBtns.className = 'image-upload-row';
      const posterBtn = document.createElement('button');
      posterBtn.className = 'pill';
      posterBtn.textContent = el.poster ? 'Replace' : 'Upload';
      posterBtn.addEventListener('click', () => uploadElementField(el.id, 'poster'));
      posterBtns.appendChild(posterBtn);
      if (el.poster) {
        const clearBtn = document.createElement('button');
        clearBtn.className = 'pill';
        clearBtn.textContent = 'Clear';
        clearBtn.addEventListener('click', () => updateElement(el.id, { poster: '' }));
        posterBtns.appendChild(clearBtn);
      }
      posterR.appendChild(posterBtns);
      s.appendChild(posterR);
      if (el.poster) {
        const preview = document.createElement('div');
        preview.className = 'bg-image-preview';
        preview.style.backgroundImage = 'url("' + el.poster + '")';
        s.appendChild(preview);
      }

      frag.appendChild(s);
    } else if (el.type === 'line') {
      const s = section('Line');

      s.appendChild(buildNumSliderRow('Length', {
        min: 20, max: 1280, step: 1, value: el.w,
        onChange: v => updateElement(el.id, { w: Math.round(v) }, { skipPropsRender: true }),
      }));
      s.appendChild(buildNumSliderRow('Thickness', {
        min: 1, max: 50, step: 1, value: el.h,
        onChange: v => updateElement(el.id, { h: Math.round(v) }, { skipPropsRender: true }),
      }));
      s.appendChild(buildNumSliderRow('Rotation', {
        min: -180, max: 180, step: 1, value: el.rotation || 0,
        onChange: v => updateElement(el.id, { rotation: Math.round(v) }, { skipPropsRender: true }),
      }));

      const cr = row('Color');
      cr.appendChild(colorInput(el.fill, v => updateElement(el.id, { fill: v }, { skipPropsRender: true })));
      s.appendChild(cr);

      frag.appendChild(s);
    } else {
      const s = section('Shape');
      if (el.type === 'rect' || el.type === 'circle') {
        const fillToggleRow = row('Fill');
        const fillToggle = document.createElement('button');
        const fillOn = el.fillEnabled !== false;
        fillToggle.className = 'pill' + (fillOn ? ' active' : '');
        fillToggle.textContent = fillOn ? 'On' : 'Off';
        fillToggle.addEventListener('click', () => {
          updateElement(el.id, { fillEnabled: !fillOn });
        });
        fillToggleRow.appendChild(fillToggle);
        s.appendChild(fillToggleRow);
      }
      const fr = row(el.type === 'rect' || el.type === 'circle' ? 'Color' : 'Fill');
      fr.appendChild(colorInput(el.fill, v => updateElement(el.id, { fill: v }, { skipPropsRender: true })));
      s.appendChild(fr);
      if (el.type === 'rect') {
        const radiusMax = Math.max(1, maxElementRadius(el));
        s.appendChild(buildNumSliderRow('Radius', {
          min: 0, max: radiusMax, step: 1, value: Math.min(radiusMax, el.radius || 0),
          onChange: v => updateElement(el.id, radiusPatch(el, v), { skipPropsRender: true }),
        }));
      }
      frag.appendChild(s);
    }

    // Stroke (skipped for line ??line is its own stroke)
    if (el.type !== 'line') {
      const sk = section('Stroke');
      const strokeOn = !!(el.stroke && el.stroke.width);
      const skToggleRow = row('');
      const skTogglePill = document.createElement('button');
      skTogglePill.className = 'pill' + (strokeOn ? ' active' : '');
      skTogglePill.textContent = strokeOn ? 'On' : 'Off';
      skTogglePill.addEventListener('click', () => {
        if (strokeOn) {
          updateElement(el.id, { stroke: null });
        } else {
          updateElement(el.id, { stroke: { width: 2, color: '#ffffff', opacity: 1, style: 'solid' } });
        }
      });
      skToggleRow.appendChild(skTogglePill);
      sk.appendChild(skToggleRow);
      if (strokeOn) {
        sk.appendChild(buildNumSliderRow('Width', {
          min: 0, max: 40, step: 1, value: el.stroke.width || 0,
          onChange: v => {
            const w = Math.max(0, Math.round(v));
            updateElement(el.id, { stroke: Object.assign({}, el.stroke, { width: w }) }, { skipPropsRender: true });
          },
        }));
        const skColorRow = row('Color');
        skColorRow.appendChild(colorInput(el.stroke.color || '#ffffff', v => {
          updateElement(el.id, { stroke: Object.assign({}, el.stroke, { color: v }) }, { skipPropsRender: true });
        }));
        sk.appendChild(skColorRow);
        sk.appendChild(buildNumSliderRow('Opacity', {
          min: 0, max: 100, step: 1, value: Math.round((el.stroke.opacity == null ? 1 : el.stroke.opacity) * 100),
          onChange: v => {
            const op = Math.max(0, Math.min(1, Number(v) / 100));
            updateElement(el.id, { stroke: Object.assign({}, el.stroke, { opacity: op }) }, { skipPropsRender: true });
          },
        }));
        // Style only meaningful for non-text borders
        if (el.type !== 'text' && el.type !== 'image' && el.type !== 'video') {
          const skStyleRow = row('Style');
          const skStyleGroup = document.createElement('div');
          skStyleGroup.className = 'pill-group';
          [['solid', 'Solid'], ['dashed', 'Dashed'], ['dotted', 'Dotted']].forEach(([v, label]) => {
            const p = document.createElement('button');
            p.className = 'pill' + ((el.stroke.style || 'solid') === v ? ' active' : '');
            p.textContent = label;
            p.addEventListener('click', () => {
              updateElement(el.id, { stroke: Object.assign({}, el.stroke, { style: v }) });
            });
            skStyleGroup.appendChild(p);
          });
          skStyleRow.appendChild(skStyleGroup);
          sk.appendChild(skStyleRow);
        }
      }
      frag.appendChild(sk);
    }

    // Shadow
    {
      const sh = section('Shadow');
      const shadowOn = !!el.shadow;
      const shToggleRow = row('');
      const shTogglePill = document.createElement('button');
      shTogglePill.className = 'pill' + (shadowOn ? ' active' : '');
      shTogglePill.textContent = shadowOn ? 'On' : 'Off';
      shTogglePill.addEventListener('click', () => {
        if (shadowOn) {
          updateElement(el.id, { shadow: null });
        } else {
          updateElement(el.id, { shadow: { x: 0, y: 8, blur: 24, color: 'rgba(0,0,0,0.4)' } });
        }
      });
      shToggleRow.appendChild(shTogglePill);
      sh.appendChild(shToggleRow);
      if (shadowOn) {
        const xy = row('X / Y');
        xy.appendChild(numInput(el.shadow.x || 0, v => {
          updateElement(el.id, { shadow: Object.assign({}, el.shadow, { x: Math.round(v) }) }, { skipPropsRender: true });
        }));
        xy.appendChild(numInput(el.shadow.y || 0, v => {
          updateElement(el.id, { shadow: Object.assign({}, el.shadow, { y: Math.round(v) }) }, { skipPropsRender: true });
        }));
        sh.appendChild(xy);
        sh.appendChild(buildNumSliderRow('Blur', {
          min: 0, max: 100, step: 1, value: el.shadow.blur || 0,
          onChange: v => {
            updateElement(el.id, { shadow: Object.assign({}, el.shadow, { blur: Math.max(0, Math.round(v)) }) }, { skipPropsRender: true });
          },
        }));
        const shColorRow = row('Color');
        shColorRow.appendChild(colorInput(el.shadow.color || '#212121', v => {
          updateElement(el.id, { shadow: Object.assign({}, el.shadow, { color: v }) }, { skipPropsRender: true });
        }));
        sh.appendChild(shColorRow);
      }
      frag.appendChild(sh);
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

    if (el.hover && el.hover !== 'none') {
      ix.appendChild(buildStrengthRow(el, 'hoverStrength'));
    }

    const mr = row('Motion');
    mr.appendChild(selectInput(el.motion, [
      ['none', 'None'],
      ['anim-fade', 'Fade in'],
      ['anim-up', 'Slide up'],
      ['anim-left', 'Slide left'],
      ['anim-right', 'Slide right'],
      ['anim-scale', 'Scale in'],
      ['anim-blink', 'Blink'],
      ['anim-fly-from-left', 'Fly in ← from off-slide left'],
      ['anim-fly-from-right', 'Fly in → from off-slide right'],
      ['anim-fly-from-top', 'Fly in ↓ from off-slide top'],
      ['anim-fly-from-bottom', 'Fly in ↑ from off-slide bottom'],
      ['anim-custom', 'Custom path (drag handle on canvas)'],
    ], v => updateElement(el.id, { motion: v })));
    ix.appendChild(mr);

    if (el.motion && el.motion !== 'none') {
      ix.appendChild(buildStrengthRow(el, 'motionStrength'));
    }
    if (el.motion === 'anim-blink') {
      const initialSec = el.blinkDuration != null ? el.blinkDuration : 1;
      ix.appendChild(buildNumSliderRow('Blink (s)', {
        min: 0.1, max: 10, step: 0.1, value: initialSec,
        onChange: sec => {
          const v = Math.max(0.05, parseFloat(sec) || 1);
          updateElement(el.id, { blinkDuration: v }, { skipPropsRender: true });
        },
      }));
    } else if (el.motion && el.motion !== 'none') {
      // Duration applies to all entrance motions except blink (cycle time has
      // its own control above). Defaults to the matching CSS default.
      const dflt = el.motion === 'anim-custom' || (el.motion || '').indexOf('anim-fly') === 0 ? 0.8 : 0.6;
      const initialSec = el.motionDuration != null ? el.motionDuration : dflt;
      ix.appendChild(buildNumSliderRow('Duration (s)', {
        min: 0.1, max: 10, step: 0.1, value: initialSec,
        onChange: sec => {
          const v = Math.max(0.05, parseFloat(sec) || dflt);
          updateElement(el.id, { motionDuration: v }, { skipPropsRender: true });
        },
      }));
    }
    if (el.motion === 'anim-custom') {
      ix.appendChild(buildNumSliderRow('From X (px)', {
        min: -2000, max: 2000, step: 1, value: el.motionFromX || 0,
        onChange: v => updateElement(el.id, { motionFromX: Math.round(v) }, { skipPropsRender: true }),
      }));
      ix.appendChild(buildNumSliderRow('From Y (px)', {
        min: -2000, max: 2000, step: 1, value: el.motionFromY || 0,
        onChange: v => updateElement(el.id, { motionFromY: Math.round(v) }, { skipPropsRender: true }),
      }));
    }

    if (el.type !== 'linkcard') {
      const isSlideLink = !!(el.link && el.link.indexOf('slide:') === 0);
      const lr = row('Link');
      const linkInput = document.createElement('input');
      linkInput.type = 'url';
      linkInput.className = 'prop-input';
      linkInput.placeholder = 'https://...';
      linkInput.value = isSlideLink ? '' : (el.link || '');
      linkInput.disabled = isSlideLink;
      linkInput.addEventListener('change', () => {
        updateElement(el.id, { link: linkInput.value.trim() });
      });
      lr.appendChild(linkInput);
      ix.appendChild(lr);

      const gr = row('Go to');
      const slideSel = document.createElement('select');
      slideSel.className = 'prop-select';
      const noneOpt = document.createElement('option');
      noneOpt.value = '';
      noneOpt.textContent = '(none)';
      slideSel.appendChild(noneOpt);
      state.slides.forEach((s, i) => {
        const opt = document.createElement('option');
        opt.value = 'slide:' + s.id;
        opt.textContent = 'Slide ' + (i + 1);
        if (el.link === opt.value) opt.selected = true;
        slideSel.appendChild(opt);
      });
      slideSel.addEventListener('change', () => {
        if (slideSel.value) {
          updateElement(el.id, { link: slideSel.value });
        } else if (isSlideLink) {
          updateElement(el.id, { link: '' });
        }
      });
      gr.appendChild(slideSel);
      ix.appendChild(gr);
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
    recordHistory();
    const slide = newSlide('titleBody');
    state.slides.push(slide);
    state.currentSlideId = slide.id;
    state.selectedElementId = null;
    renderAll();
  }

  function applySlideBackgroundToAll(color) {
    if (!state.slides.length) return;
    recordHistory();
    state.slides.forEach(s => {
      s.bg = color;
    });
    renderAll();
  }

  function deleteSlide(id) {
    const idx = state.slides.findIndex(s => s.id === id);
    if (idx === -1) return;
    if (state.slides.length <= 1) return;
    recordHistory();
    state.slides.splice(idx, 1);
    if (state.currentSlideId === id) {
      const next = state.slides[idx] || state.slides[idx - 1] || null;
      state.currentSlideId = next ? next.id : null;
      state.selectedElementId = null;
    }
    renderAll();
  }

  function toggleSlideHidden(id) {
    const slide = state.slides.find(s => s.id === id);
    if (!slide) return;
    const willHide = !slide.hidden;
    if (willHide && state.slides.filter(s => !s.hidden).length <= 1) return;
    recordHistory();
    slide.hidden = willHide;
    renderAll();
  }

  function selectSlide(id) {
    state.currentSlideId = id;
    state.selectedElementId = null;
    renderAll();
  }

  function cloneSlideDeep(slide) {
    if (!slide) return null;
    const oldSlideId = slide.id;
    const copy = JSON.parse(JSON.stringify(slide));
    copy.id = uid('slide');
    const idMap = new Map();
    const groupMap = new Map();
    (copy.elements || []).forEach(el => {
      const oldId = el.id;
      el.id = uid('el');
      if (oldId) idMap.set(oldId, el.id);
      if (el.groupId) {
        if (!groupMap.has(el.groupId)) groupMap.set(el.groupId, uid('grp'));
        el.groupId = groupMap.get(el.groupId);
      }
      if (el.link === 'slide:' + oldSlideId) el.link = 'slide:' + copy.id;
    });
    return copy;
  }

  function insertSlideCopyAfterCurrent(slideData) {
    if (!slideData) return;
    const slide = cloneSlideDeep(slideData);
    if (!slide) return;
    recordHistory();
    const idx = Math.max(0, state.slides.findIndex(s => s.id === state.currentSlideId));
    state.slides.splice(idx + 1, 0, slide);
    state.currentSlideId = slide.id;
    state.selectedElementId = null;
    renderAll();
  }

  function applyLayout(slideId, layout) {
    const slide = state.slides.find(s => s.id === slideId);
    if (!slide) return;
    recordHistory();
    slide.layout = layout;
    slide.elements = LAYOUTS[layout].elements();
    state.selectedElementId = null;
    renderAll();
  }

  function addElement(type) {
    const slide = getCurrentSlide();
    if (!slide) return;
    if (type === 'image') return triggerMediaInsert('image');
    if (type === 'imageBanner') return triggerBannerInsert();
    if (type === 'video') return triggerMediaInsert('video');
    if (type === 'linkcard') return triggerLinkCardInsert();
    recordHistory();
    let el;
    if (type === 'text') {
      el = textEl({ x: 200, y: 200, w: 480, h: 80, text: 'New text' });
      autoSizeTextElement(el);
    } else if (type === 'circle') {
      el = shapeEl('circle', { x: 540, y: 260, w: 200, h: 200 });
    } else if (type === 'line') {
      el = lineEl();
    } else {
      el = shapeEl('rect', { x: 440, y: 260, w: 400, h: 200 });
    }
    slide.elements.push(el);
    state.selectedElementId = el.id;
    renderAll();
  }

  function cleanContentLine(line) {
    return String(line || '')
      .replace(/^\s{0,3}#{1,6}\s+/, '')
      .replace(/^\s*[-*•]\s+/, '')
      .replace(/^\s*\d+[.)]\s+/, '')
      .trim();
  }

  function parseGeneratedContent(raw) {
    const text = String(raw || '').replace(/\r/g, '').trim();
    if (!text) return null;
    const lines = text.split('\n');
    const nonEmpty = lines.map(l => l.trim()).filter(Boolean);
    if (!nonEmpty.length) return null;
    const title = cleanContentLine(nonEmpty[0]) || 'Untitled';
    const rest = nonEmpty.slice(1);
    const bullets = [];
    const bodyLines = [];
    rest.forEach(line => {
      if (/^\s*([-*•]|\d+[.)])\s+/.test(line)) bullets.push(cleanContentLine(line));
      else bodyLines.push(cleanContentLine(line));
    });
    if (!bullets.length && bodyLines.length > 2 && bodyLines.every(l => l.length <= 72)) {
      bullets.push(...bodyLines);
      bodyLines.length = 0;
    }
    return {
      title,
      body: bodyLines.join('\n').trim(),
      bullets: bullets.filter(Boolean),
    };
  }

  function createGeneratedText(props) {
    return textEl(Object.assign({
      font: 'sans',
      color: '#f2f2f2',
      bg: '',
      motion: 'fade',
      motionStrength: 1,
    }, props));
  }

  function generatedContentStats(parsed) {
    const bodyChars = (parsed.body || '').length;
    const bulletChars = parsed.bullets.reduce((sum, item) => sum + item.length, 0);
    const totalChars = (parsed.title || '').length + bodyChars + bulletChars;
    const paragraphs = (parsed.body || '').split(/\n+/).map(s => s.trim()).filter(Boolean);
    const avgBulletChars = parsed.bullets.length ? bulletChars / parsed.bullets.length : 0;
    return {
      totalChars,
      titleChars: (parsed.title || '').length,
      bodyChars,
      paragraphCount: paragraphs.length,
      bulletCount: parsed.bullets.length,
      avgBulletChars,
      hasBody: !!parsed.body,
      hasBullets: parsed.bullets.length > 0,
    };
  }

  function chooseGeneratedLayout(parsed) {
    const stats = generatedContentStats(parsed);
    if (!stats.hasBody && !stats.hasBullets) return stats.titleChars > 42 ? 'statement' : 'cover';
    if (stats.bulletCount >= 10) return 'index';
    if (stats.bulletCount >= 7) return 'listCompact';
    if (stats.bulletCount >= 3) return stats.avgBulletChars > 42 ? 'listNarrative' : 'list';
    if (stats.bodyChars > 760) return 'essayWide';
    if (stats.bodyChars > 420) return 'essay';
    if (stats.paragraphCount >= 3) return 'manifesto';
    if (stats.titleChars > 46) return 'sidebar';
    return 'feature';
  }

  function generatedTextBlock(props) {
    const el = createGeneratedText(props);
    if (!el.html) el.html = escapeHtml(el.text || '');
    return el;
  }

  function addGeneratedChrome(elements, ctx, label, alignRight) {
    const { m, ch, titleW, labelSize, issueNo, bodyFont, mutedColor, accentColor } = ctx;
    const topY = Math.round(Math.max(38, ch * 0.062));
    elements.push(lineEl({ x: m, y: topY + 30, w: titleW, h: 1, fill: accentColor, opacity: 0.68 }));
    elements.push(generatedTextBlock({
      x: m,
      y: topY,
      w: Math.round(Math.min(360, titleW * 0.45)),
      h: 22,
      text: 'ISSUE ' + issueNo + ' / PRESENTATION',
      font: bodyFont,
      fontSize: labelSize,
      fontWeight: 650,
      letterSpacing: 1.8,
      color: mutedColor,
      lineHeight: 1,
      verticalAlign: 'center',
    }));
    elements.push(generatedTextBlock({
      x: m + Math.round(titleW * 0.58),
      y: topY,
      w: Math.round(titleW * 0.42),
      h: 22,
      text: label,
      font: bodyFont,
      fontSize: labelSize,
      fontWeight: 650,
      letterSpacing: 1.8,
      color: mutedColor,
      align: alignRight === false ? 'left' : 'right',
      lineHeight: 1,
      verticalAlign: 'center',
    }));
  }

  function buildCoverGeneratedLayout(parsed, ctx) {
    const { cw, ch, m, titleW, titleSize, labelSize, issueNo, bodyFont, accentColor, mutedColor } = ctx;
    const elements = [];
    addGeneratedChrome(elements, ctx, 'COVER STORY', true);
    const titleY = Math.round(ch * 0.27);
    elements.push(generatedTextBlock({
      x: m,
      y: titleY,
      w: Math.round(titleW * 0.86),
      h: Math.round(titleSize * 2.35),
      text: parsed.title,
      font: bodyFont,
      fontSize: Math.round(titleSize * 1.08),
      fontWeight: 820,
      fontStretch: 90,
      lineHeight: 0.88,
      color: accentColor,
      verticalAlign: 'top',
    }));
    elements.push(shapeEl('rect', {
      x: cw - m - Math.round(titleW * 0.18),
      y: Math.round(ch * 0.36),
      w: Math.round(titleW * 0.18),
      h: Math.round(ch * 0.34),
      fill: 'rgba(255,255,255,0.055)',
      radius: 0,
      opacity: 1,
    }));
    elements.push(generatedTextBlock({
      x: m,
      y: ch - Math.round(Math.max(64, ch * 0.09)),
      w: Math.round(titleW * 0.5),
      h: 28,
      text: 'PRES / EDITORIAL / ' + issueNo,
      font: bodyFont,
      fontSize: labelSize,
      fontWeight: 650,
      letterSpacing: 1.6,
      color: mutedColor,
      verticalAlign: 'center',
    }));
    return elements;
  }

  function buildFeatureGeneratedLayout(parsed, ctx) {
    const { ch, m, gutter, colW, titleW, titleSize, bodySize, labelSize, issueNo, bodyFont, accentColor, mutedColor, bodyColor } = ctx;
    const elements = [];
    addGeneratedChrome(elements, ctx, 'FEATURE NOTE', true);
    const titleY = Math.round(Math.max(96, ch * 0.17));
    elements.push(generatedTextBlock({
      x: m,
      y: titleY,
      w: Math.round(colW * 2.55 + gutter),
      h: Math.round(titleSize * 1.55),
      text: parsed.title,
      font: bodyFont,
      fontSize: titleSize,
      fontWeight: 780,
      fontStretch: 92,
      lineHeight: 0.92,
      color: accentColor,
      verticalAlign: 'top',
    }));
    const sideX = m + Math.round(colW * 3 + gutter * 3);
    elements.push(generatedTextBlock({
      x: sideX,
      y: titleY + Math.round(titleSize * 0.08),
      w: Math.round(colW),
      h: Math.round(titleSize * 0.8),
      text: issueNo,
      font: bodyFont,
      fontSize: Math.round(titleSize * 0.72),
      fontWeight: 760,
      color: accentColor,
      align: 'right',
      lineHeight: 0.9,
      verticalAlign: 'top',
    }));
    const dividerY = Math.round(titleY + titleSize * 1.85);
    elements.push(lineEl({ x: m, y: dividerY, w: titleW, h: 1, fill: accentColor, opacity: 0.32 }));
    const content = parsed.body || parsed.bullets.join('\n');
    elements.push(generatedTextBlock({
      x: m + Math.round(colW + gutter),
      y: dividerY + Math.round(ch * 0.055),
      w: Math.round(colW * 2.05),
      h: Math.round(ch - dividerY - ch * 0.16),
      text: content,
      font: bodyFont,
      fontSize: bodySize,
      fontWeight: 430,
      lineHeight: 1.6,
      paragraphSpacing: 16,
      color: bodyColor,
      verticalAlign: 'top',
    }));
    elements.push(generatedTextBlock({
      x: sideX,
      y: ch - Math.round(Math.max(46, ch * 0.06)),
      w: colW,
      h: 22,
      text: 'PRES / EDITORIAL',
      font: bodyFont,
      fontSize: labelSize,
      fontWeight: 650,
      letterSpacing: 1.4,
      color: mutedColor,
      align: 'right',
      verticalAlign: 'center',
    }));
    return elements;
  }

  function buildEssayGeneratedLayout(parsed, ctx) {
    const { ch, m, gutter, colW, titleW, titleSize, bodySize, labelSize, issueNo, bodyFont, accentColor, mutedColor, bodyColor } = ctx;
    const elements = [];
    addGeneratedChrome(elements, ctx, 'LONG FORM', true);
    const titleY = Math.round(Math.max(76, ch * 0.13));
    elements.push(generatedTextBlock({
      x: m,
      y: titleY,
      w: Math.round(colW * 1.7),
      h: Math.round(titleSize * 2.15),
      text: parsed.title,
      font: bodyFont,
      fontSize: Math.round(titleSize * 0.72),
      fontWeight: 780,
      fontStretch: 94,
      lineHeight: 0.96,
      color: accentColor,
      verticalAlign: 'top',
    }));
    elements.push(lineEl({ x: m, y: titleY + Math.round(titleSize * 2.35), w: Math.round(colW * 1.45), h: 1, fill: accentColor, opacity: 0.4 }));
    const body = parsed.body || parsed.bullets.join('\n');
    const splitAt = Math.ceil(body.length / 2);
    const firstBreak = body.indexOf('\n', splitAt);
    const cut = firstBreak > 0 ? firstBreak : splitAt;
    const cols = [body.slice(0, cut).trim(), body.slice(cut).trim()].filter(Boolean);
    cols.forEach((txt, i) => {
      elements.push(generatedTextBlock({
        x: m + Math.round((colW + gutter) * (1.95 + i)),
        y: titleY,
        w: colW,
        h: Math.round(ch - titleY - ch * 0.12),
        text: txt,
        font: bodyFont,
        fontSize: Math.round(bodySize * 0.9),
        fontWeight: 420,
        lineHeight: 1.72,
        paragraphSpacing: 18,
        color: bodyColor,
        verticalAlign: 'top',
      }));
    });
    elements.push(generatedTextBlock({
      x: m,
      y: ch - Math.round(Math.max(46, ch * 0.06)),
      w: titleW,
      h: 22,
      text: 'PRES / TEXT STUDY / ' + issueNo,
      font: bodyFont,
      fontSize: labelSize,
      fontWeight: 650,
      letterSpacing: 1.5,
      color: mutedColor,
      align: 'right',
      verticalAlign: 'center',
    }));
    return elements;
  }

  function buildListGeneratedLayout(parsed, ctx) {
    const { ch, m, gutter, colW, titleW, titleSize, bodySize, labelSize, issueNo, bodyFont, accentColor, mutedColor, bodyColor } = ctx;
    const elements = [];
    addGeneratedChrome(elements, ctx, 'KEY POINTS', true);
    const titleY = Math.round(Math.max(86, ch * 0.15));
    elements.push(generatedTextBlock({
      x: m,
      y: titleY,
      w: Math.round(colW * 2.7),
      h: Math.round(titleSize * 1.35),
      text: parsed.title,
      font: bodyFont,
      fontSize: Math.round(titleSize * 0.88),
      fontWeight: 800,
      fontStretch: 91,
      lineHeight: 0.9,
      color: accentColor,
      verticalAlign: 'top',
    }));
    const listTop = titleY + Math.round(titleSize * 1.55);
    const split = Math.ceil(parsed.bullets.length / 2);
    [parsed.bullets.slice(0, split), parsed.bullets.slice(split)].forEach((items, col) => {
      items.forEach((item, idx) => {
        const n = col === 0 ? idx + 1 : split + idx + 1;
        const y = listTop + idx * Math.round(Math.max(72, bodySize * 3.4));
        const x = m + col * Math.round(colW * 2 + gutter);
        elements.push(lineEl({ x, y: y - 14, w: Math.round(colW * 1.75), h: 1, fill: accentColor, opacity: 0.26 }));
        elements.push(generatedTextBlock({
          x,
          y,
          w: 42,
          h: 28,
          text: String(n).padStart(2, '0'),
          font: bodyFont,
          fontSize: labelSize + 2,
          fontWeight: 760,
          color: mutedColor,
          lineHeight: 1,
          verticalAlign: 'top',
        }));
        elements.push(generatedTextBlock({
          x: x + 58,
          y: y - 2,
          w: Math.round(colW * 1.55),
          h: Math.round(bodySize * 3.2),
          text: item,
          font: bodyFont,
          fontSize: bodySize,
          fontWeight: 450,
          lineHeight: 1.34,
          color: bodyColor,
          verticalAlign: 'top',
        }));
      });
    });
    elements.push(generatedTextBlock({
      x: m,
      y: ch - Math.round(Math.max(46, ch * 0.06)),
      w: titleW,
      h: 22,
      text: 'PRES / LIST / ' + issueNo,
      font: bodyFont,
      fontSize: labelSize,
      fontWeight: 650,
      letterSpacing: 1.5,
      color: mutedColor,
      align: 'right',
      verticalAlign: 'center',
    }));
    return elements;
  }

  function buildIndexGeneratedLayout(parsed, ctx) {
    const { ch, m, gutter, colW, titleW, titleSize, bodySize, labelSize, issueNo, bodyFont, accentColor, mutedColor, bodyColor } = ctx;
    const elements = [];
    addGeneratedChrome(elements, ctx, 'INDEX MAP', true);
    const titleY = Math.round(Math.max(78, ch * 0.13));
    elements.push(generatedTextBlock({
      x: m,
      y: titleY,
      w: Math.round(titleW * 0.82),
      h: Math.round(titleSize * 1.22),
      text: parsed.title,
      font: bodyFont,
      fontSize: Math.round(titleSize * 0.72),
      fontWeight: 820,
      fontStretch: 90,
      lineHeight: 0.9,
      color: accentColor,
      verticalAlign: 'top',
    }));
    const listTop = titleY + Math.round(titleSize * 1.45);
    const rows = Math.ceil(parsed.bullets.length / 3);
    parsed.bullets.forEach((item, idx) => {
      const col = Math.floor(idx / rows);
      const row = idx % rows;
      const x = m + col * Math.round(colW + gutter);
      const y = listTop + row * Math.round(Math.max(44, bodySize * 2.15));
      elements.push(generatedTextBlock({
        x,
        y,
        w: Math.round(colW * 0.32),
        h: 22,
        text: String(idx + 1).padStart(2, '0'),
        font: bodyFont,
        fontSize: labelSize,
        fontWeight: 750,
        color: mutedColor,
        verticalAlign: 'top',
      }));
      elements.push(generatedTextBlock({
        x: x + Math.round(colW * 0.34),
        y: y - 2,
        w: Math.round(colW * 0.65),
        h: Math.round(Math.max(34, bodySize * 1.9)),
        text: item,
        font: bodyFont,
        fontSize: Math.round(bodySize * 0.82),
        fontWeight: 430,
        lineHeight: 1.26,
        color: bodyColor,
        verticalAlign: 'top',
      }));
    });
    elements.push(lineEl({ x: m, y: ch - Math.round(Math.max(70, ch * 0.095)), w: titleW, h: 1, fill: accentColor, opacity: 0.25 }));
    elements.push(generatedTextBlock({
      x: m,
      y: ch - Math.round(Math.max(46, ch * 0.06)),
      w: titleW,
      h: 22,
      text: 'PRES / DIRECTORY / ' + issueNo,
      font: bodyFont,
      fontSize: labelSize,
      fontWeight: 650,
      letterSpacing: 1.5,
      color: mutedColor,
      align: 'right',
      verticalAlign: 'center',
    }));
    return elements;
  }

  function splitTextByWords(text, count) {
    const words = String(text || '').trim().split(/\s+/).filter(Boolean);
    if (!words.length || count <= 1) return [String(text || '').trim()].filter(Boolean);
    const parts = [];
    const per = Math.ceil(words.length / count);
    for (let i = 0; i < count; i++) {
      const part = words.slice(i * per, (i + 1) * per).join(' ').trim();
      if (part) parts.push(part);
    }
    return parts;
  }

  function splitItems(items, count) {
    const rows = Math.ceil(items.length / count);
    const out = [];
    for (let i = 0; i < count; i++) {
      const part = items.slice(i * rows, (i + 1) * rows);
      if (part.length) out.push(part);
    }
    return out;
  }

  function buildContentOnlyGeneratedLayout(parsed, ctx, kind) {
    const { ch, m, gutter, colW, titleW, titleSize, bodySize, bodyFont, accentColor, bodyColor } = ctx;
    const elements = [];
    const title = (opts) => elements.push(generatedTextBlock(Object.assign({
      x: m,
      y: Math.round(ch * 0.14),
      w: Math.round(titleW * 0.76),
      h: Math.round(titleSize * 1.35),
      text: parsed.title,
      font: bodyFont,
      fontSize: titleSize,
      fontWeight: 800,
      fontStretch: 91,
      lineHeight: 0.9,
      color: accentColor,
      verticalAlign: 'top',
    }, opts || {})));
    const body = (text, opts) => {
      if (!text) return;
      elements.push(generatedTextBlock(Object.assign({
        x: m,
        y: Math.round(ch * 0.48),
        w: Math.round(colW * 2.3),
        h: Math.round(ch * 0.36),
        text,
        font: bodyFont,
        fontSize: bodySize,
        fontWeight: 430,
        lineHeight: 1.58,
        paragraphSpacing: 16,
        color: bodyColor,
        verticalAlign: 'top',
      }, opts || {})));
    };

    if (kind === 'cover') {
      title({
        y: Math.round(ch * 0.29),
        w: Math.round(titleW * 0.86),
        h: Math.round(titleSize * 2.25),
        fontSize: Math.round(titleSize * 1.1),
        fontWeight: 830,
        fontStretch: 88,
        lineHeight: 0.86,
      });
      return elements;
    }

    if (kind === 'statement') {
      title({
        y: Math.round(ch * 0.18),
        w: Math.round(titleW * 0.94),
        h: Math.round(titleSize * 3.2),
        fontSize: Math.round(titleSize * 0.96),
        fontWeight: 760,
        fontStretch: 96,
        lineHeight: 1.02,
      });
      return elements;
    }

    if (kind === 'sidebar') {
      title({
        y: Math.round(ch * 0.15),
        w: Math.round(colW * 1.45),
        h: Math.round(ch * 0.6),
        fontSize: Math.round(titleSize * 0.62),
        fontWeight: 810,
        fontStretch: 93,
        lineHeight: 0.94,
      });
      body(parsed.body || parsed.bullets.join('\n'), {
        x: m + Math.round((colW + gutter) * 1.72),
        y: Math.round(ch * 0.18),
        w: Math.round(colW * 1.9),
        h: Math.round(ch * 0.56),
        lineHeight: 1.68,
      });
      return elements;
    }

    if (kind === 'essay' || kind === 'essayWide') {
      title({
        y: Math.round(ch * 0.12),
        w: kind === 'essayWide' ? Math.round(colW * 1.25) : Math.round(colW * 1.55),
        h: Math.round(ch * 0.52),
        fontSize: Math.round(titleSize * (kind === 'essayWide' ? 0.54 : 0.66)),
        fontWeight: 800,
        fontStretch: 94,
        lineHeight: 0.97,
      });
      const cols = splitTextByWords(parsed.body || parsed.bullets.join('\n'), kind === 'essayWide' ? 3 : 2);
      cols.forEach((txt, i) => body(txt, {
        x: m + Math.round((colW + gutter) * (kind === 'essayWide' ? 1.45 + i * 0.85 : 1.85 + i)),
        y: Math.round(ch * 0.13),
        w: kind === 'essayWide' ? Math.round(colW * 0.78) : colW,
        h: Math.round(ch * 0.72),
        fontSize: Math.round(bodySize * 0.88),
        lineHeight: 1.74,
        paragraphSpacing: 18,
      }));
      return elements;
    }

    if (kind === 'manifesto') {
      title({
        y: Math.round(ch * 0.1),
        w: Math.round(titleW * 0.72),
        h: Math.round(titleSize * 1.2),
        fontSize: Math.round(titleSize * 0.72),
        fontWeight: 820,
      });
      const paragraphs = parsed.body.split(/\n+/).map(s => s.trim()).filter(Boolean);
      paragraphs.slice(0, 4).forEach((txt, i) => body(txt, {
        x: m + (i % 2) * Math.round(colW * 2 + gutter),
        y: Math.round(ch * 0.35) + Math.floor(i / 2) * Math.round(ch * 0.22),
        w: Math.round(colW * 1.7),
        h: Math.round(ch * 0.16),
        fontSize: Math.round(bodySize * 0.96),
        lineHeight: 1.45,
      }));
      return elements;
    }

    if (kind === 'list' || kind === 'listNarrative' || kind === 'listCompact' || kind === 'index') {
      title({
        y: Math.round(ch * 0.12),
        w: kind === 'index' ? Math.round(titleW * 0.92) : Math.round(colW * 2.7),
        h: Math.round(titleSize * 1.25),
        fontSize: Math.round(titleSize * (kind === 'index' ? 0.68 : 0.82)),
        fontWeight: 820,
        fontStretch: 90,
      });
      const top = Math.round(ch * (kind === 'index' ? 0.34 : 0.38));
      const colCount = kind === 'index' ? 3 : (parsed.bullets.length >= 4 ? 2 : 1);
      splitItems(parsed.bullets, colCount).forEach((items, col) => {
        const x = m + col * Math.round((titleW + gutter) / colCount);
        const w = Math.round((titleW - gutter * (colCount - 1)) / colCount);
        body(items.join('\n'), {
          x,
          y: top,
          w,
          h: Math.round(ch - top - ch * 0.1),
          fontSize: Math.round(bodySize * (kind === 'index' ? 0.82 : 1)),
          lineHeight: kind === 'listNarrative' ? 1.45 : 1.34,
          paragraphSpacing: kind === 'listCompact' || kind === 'index' ? 10 : 18,
        });
      });
      return elements;
    }

    title({
      y: Math.round(ch * 0.17),
      w: Math.round(colW * 2.55 + gutter),
      h: Math.round(titleSize * 1.45),
      fontSize: Math.round(titleSize * 0.88),
      fontWeight: 820,
      fontStretch: 91,
    });
    body(parsed.body || parsed.bullets.join('\n'), {
      x: m + Math.round(colW + gutter),
      y: Math.round(ch * 0.48),
      w: Math.round(colW * 2.05),
      h: Math.round(ch * 0.34),
      lineHeight: 1.62,
    });
    return elements;
  }

  function generateContentLayout() {
    const ta = document.getElementById('contentEditorText');
    const slide = getCurrentSlide();
    if (!ta || !slide) return;
    const parsed = parseGeneratedContent(getUserWrittenContentText(ta));
    if (!parsed) {
      alert('Write content in the bottom Content area first.');
      return;
    }
    if (slide.elements.length && !confirm('Replace current slide elements with generated layout?')) return;

    recordHistory();
    const cw = state.canvasW;
    const ch = state.canvasH;
    const m = Math.round(Math.max(56, cw * 0.075));
    const gutter = Math.round(Math.max(24, cw * 0.026));
    const titleW = Math.max(320, cw - m * 2);
    const colW = Math.round((titleW - gutter * 3) / 4);
    const titleSize = Math.round(Math.max(56, Math.min(118, cw * 0.074)));
    const bodySize = Math.round(Math.max(15, Math.min(23, cw * 0.0155)));
    const labelSize = Math.round(Math.max(9, Math.min(12, cw * 0.0085)));
    const bodyFont = WEBFONT_SET.has('Pretendard') ? 'Pretendard' : 'sans';
    if (bodyFont === 'Pretendard') loadWebfont('Pretendard');
    slide.bg = '#050505';

    const issueNo = String(state.slides.findIndex(s => s.id === slide.id) + 1).padStart(2, '0');
    const accentColor = '#f2f2ee';
    const mutedColor = '#8d8d87';
    const bodyColor = '#d8d7cf';
    const ctx = {
      cw, ch, m, gutter, titleW, colW, titleSize, bodySize, labelSize,
      issueNo, bodyFont, accentColor, mutedColor, bodyColor,
    };
    const layoutKind = chooseGeneratedLayout(parsed);
    const elements = buildContentOnlyGeneratedLayout(parsed, ctx, layoutKind);

    slide.layout = 'generated-' + layoutKind;
    slide.elements = elements;
    selectClear();
    renderAll();
    scheduleCurrentSlideThumbFocus({ smooth: true });
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

  function triggerBannerInsert() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.style.display = 'none';
    input.addEventListener('change', async () => {
      const files = Array.from(input.files || []);
      if (!files.length) return;
      const total = files.reduce((sum, f) => sum + f.size, 0);
      if (total > 20 * 1024 * 1024) {
        if (!confirm((total / 1048576).toFixed(1) + 'MB images. The saved file may become large. Continue?')) return;
      }
      const images = [];
      for (const file of files) {
        images.push(await readFileAsDataUrl(file));
      }
      const slide = getCurrentSlide();
      if (!slide) return;
      recordHistory();
      const el = imageBannerEl(images);
      slide.elements.push(el);
      state.selectedElementId = el.id;
      renderAll();
    });
    document.body.appendChild(input);
    input.click();
    setTimeout(() => document.body.removeChild(input), 0);
  }

  async function insertImageFile(file) {
    if (file.size > 10 * 1024 * 1024) {
      if (!confirm((file.size / 1048576).toFixed(1) + 'MB image. The saved file may become large. Continue?')) return;
    }
    const dataUrl = await readFileAsDataUrl(file);
    const meta = await loadImageMetadata(dataUrl);
    const slide = getCurrentSlide();
    if (!slide) return;
    recordHistory();
    const fit = fitToCanvas(meta.w, meta.h);
    const el = imageEl(dataUrl, {
      x: Math.round((state.canvasW - fit.w) / 2),
      y: Math.round((state.canvasH - fit.h) / 2),
      w: fit.w, h: fit.h,
      aspectRatio: meta.w && meta.h ? meta.w / meta.h : null,
    });
    slide.elements.push(el);
    state.selectedElementId = el.id;
    renderAll();
  }

  async function insertVideoFile(file) {
    if (file.size > 30 * 1024 * 1024) {
      if (!confirm((file.size / 1048576).toFixed(1) + 'MB video. The saved file may become large. Continue?')) return;
    }
    const dataUrl = await readFileAsDataUrl(file);
    const meta = await loadVideoMetadata(dataUrl);
    const slide = getCurrentSlide();
    if (!slide) return;
    recordHistory();
    const fit = fitToCanvas(meta.w || 1280, meta.h || 720);
    const el = videoEl(dataUrl, {
      x: Math.round((state.canvasW - fit.w) / 2),
      y: Math.round((state.canvasH - fit.h) / 2),
      w: fit.w, h: fit.h,
      aspectRatio: meta.w && meta.h ? meta.w / meta.h : null,
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

  function insertTextBoxFromClipboardText(text) {
    const clean = String(text || '').replace(/\r/g, '').trim();
    if (!clean) return false;
    const slide = getCurrentSlide();
    if (!slide) return false;
    const source = (state.editingElementId && slide.elements.find(el => el.id === state.editingElementId && el.type === 'text'))
      || getSelectedElements().find(el => el.type === 'text');
    const patch = source ? {
      font: source.font,
      fontSize: source.fontSize,
      fontWeight: source.fontWeight,
      fontStyle: source.fontStyle || 'normal',
      color: source.color,
      align: source.align,
      verticalAlign: source.verticalAlign,
      letterSpacing: source.letterSpacing,
      fontStretch: source.fontStretch,
      lineHeight: source.lineHeight,
      paragraphSpacing: source.paragraphSpacing,
      textCase: source.textCase,
      underline: source.underline,
      strikethrough: source.strikethrough,
      bg: source.bg || '',
      stroke: source.stroke ? JSON.parse(JSON.stringify(source.stroke)) : null,
    } : {};
    recordHistory();
    const el = textEl(Object.assign({
      x: 200,
      y: 200,
      w: Math.min(720, Math.max(260, state.canvasW - 400)),
      h: 80,
      text: clean,
      html: escapeHtml(clean),
    }, patch));
    autoSizeTextElement(el);
    slide.elements.push(el);
    state.selectedElementId = el.id;
    state.editingElementId = null;
    renderAll();
    return true;
  }

  function triggerLinkCardInsert() {
    const slide = getCurrentSlide();
    if (!slide) return;
    let url = prompt('Enter link URL:', 'https://');
    if (url == null) return;
    url = url.trim();
    if (url === 'https://' || url === 'http://') url = '';

    recordHistory();
    const el = linkcardEl(url, {
      image: url ? screenshotUrl(url) : '',
    });
    slide.elements.push(el);
    state.selectedElementId = el.id;
    renderAll();
    if (!url) return;

    // mShots may serve a placeholder on the first hit; re-request with a
    // cache-buster after a short delay so the real screenshot replaces it.
    setTimeout(() => {
      const slideStill = state.slides.find(s => s.id === slide.id);
      if (!slideStill) return;
      const elStill = slideStill.elements.find(e => e.id === el.id);
      if (!elStill || !elStill.link) return;
      if (elStill.image && elStill.image.indexOf('mshots/v1/') !== -1) {
        elStill.image = screenshotUrl(elStill.link, { bust: true });
        renderAll();
      }
    }, 15000);
  }

  function uploadElementField(elId, field) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.style.display = 'none';
    input.addEventListener('change', async () => {
      const file = input.files && input.files[0];
      if (!file) return;
      if (file.size > 8 * 1024 * 1024) {
        if (!confirm((file.size / 1048576).toFixed(1) + 'MB image. The saved file may become large. Continue?')) return;
      }
      const dataUrl = await readFileAsDataUrl(file);
      const patch = {};
      patch[field] = dataUrl;
      updateElement(elId, patch);
    });
    document.body.appendChild(input);
    input.click();
    setTimeout(() => document.body.removeChild(input), 0);
  }

  function uploadBannerImages(elId, mode) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.style.display = 'none';
    input.addEventListener('change', async () => {
      const files = Array.from(input.files || []);
      if (!files.length) return;
      const images = [];
      for (const file of files) images.push(await readFileAsDataUrl(file));
      const slide = getCurrentSlide();
      const el = slide && slide.elements.find(e => e.id === elId);
      if (!el) return;
      const next = mode === 'append' ? (el.images || []).concat(images) : images;
      updateElement(elId, { images: next });
    });
    document.body.appendChild(input);
    input.click();
    setTimeout(() => document.body.removeChild(input), 0);
  }

  async function replaceElementMedia(elId, kind) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = kind === 'video' ? 'video/*' : (kind === 'vector' ? 'image/svg+xml,.svg' : 'image/*');
    input.style.display = 'none';
    input.addEventListener('change', async () => {
      const file = input.files && input.files[0];
      if (!file) return;
      const slide = getCurrentSlide();
      if (!slide) return;
      const el = slide.elements.find(e => e.id === elId);
      if (!el) return;
      let dataUrl = await readFileAsDataUrl(file);
      const patch = {
        cropX: 0,
        cropY: 0,
        cropZoom: 1,
        cropApplied: false,
      };
      if (kind === 'vector') {
        const svg = await readFileAsText(file);
        const clean = extractSvgMarkup(svg) || svg;
        dataUrl = svgToDataUrl(clean);
        patch.svg = clean;
      }
      const meta = kind === 'video' ? await loadVideoMetadata(dataUrl) : await loadImageMetadata(dataUrl);
      patch.src = dataUrl;
      patch.aspectRatio = meta.w && meta.h ? meta.w / meta.h : el.aspectRatio || null;
      if (kind === 'vector' && patch.aspectRatio) patch.aspectLocked = true;
      updateElement(elId, {
        ...patch,
      });
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
    recordHistory();
    Object.assign(el, patch);
    if (Object.prototype.hasOwnProperty.call(patch, 'radius')) {
      el.radius = effectiveRadius(el);
    }
    // Auto-fit text element to its content unless the user is doing a manual
    // resize (which sends w/h) or a pure move (x/y only).
    if (el.type === 'text') {
      const keys = Object.keys(patch);
      const hasManualSize = keys.indexOf('w') >= 0 || keys.indexOf('h') >= 0;
      const triggers = !hasManualSize && keys.some(k => TEXT_AUTOSIZE_KEYS.has(k));
      if (triggers) autoSizeTextElement(el);
      if (state.editingElementId === id && triggers) {
        const ce = document.querySelector('[contenteditable="true"][data-edit-id="' + id + '"]');
        if (ce) {
          syncEditingTextBox(el, ce, patch);
          renderSlidesList();
          if (!opts.skipPropsRender) renderProperties();
          persist();
          return;
        }
      }
    }
    renderCanvas();
    renderSlidesList();
    if (!opts.skipPropsRender) renderProperties();
    persist();
  }

  function clampTypographyValue(field, value) {
    if (field === 'fontSize') return Math.max(1, Math.min(300, Math.round(value)));
    if (field === 'fontWeight') return Math.max(100, Math.min(900, Math.round(value / 10) * 10));
    if (field === 'letterSpacing') return Math.max(-20, Math.min(80, parseFloat(value.toFixed(1))));
    if (field === 'fontStretch') return Math.max(25, Math.min(200, Math.round(value)));
    if (field === 'lineHeight') return Math.max(0.1, Math.min(3, parseFloat(value.toFixed(2))));
    if (field === 'paragraphSpacing') return Math.max(-80, Math.min(200, Math.round(value)));
    return value;
  }

  function cssTypographyPatch(field, value) {
    if (field === 'fontSize') return { fontSize: value + 'px' };
    if (field === 'fontWeight') return { fontWeight: String(value) };
    if (field === 'fontStyle') return { fontStyle: value };
    if (field === 'letterSpacing') return { letterSpacing: value + 'px' };
    if (field === 'fontStretch') return { fontStretch: value + '%' };
    if (field === 'lineHeight') return { lineHeight: String(value) };
    return null;
  }

  function cssPropsForTypographyField(field) {
    return {
      fontSize: ['font-size'],
      fontWeight: ['font-weight'],
      fontStyle: ['font-style'],
      letterSpacing: ['letter-spacing'],
      fontStretch: ['font-stretch'],
      lineHeight: ['line-height'],
    }[field] || [];
  }

  function adjustSelectedTextTypography(field, delta) {
    const slide = getCurrentSlide();
    if (!slide) return false;
    const activeText = state.editingElementId
      ? slide.elements.find(el => el.id === state.editingElementId && el.type === 'text')
      : null;
    const selected = activeText ? [activeText] : getSelectedElements().filter(el => el.type === 'text');
    if (!selected.length) return false;

    const fallback = field === 'fontWeight' ? 400
      : field === 'fontStretch' ? 100
        : field === 'lineHeight' ? 1.3
          : field === 'paragraphSpacing' ? 0
            : 0;

    if (activeText) {
      // For partial selection inside an editing text element, use the
      // *resolved* style at the caret/selection as the base. Without this,
      // repeatedly pressing Shift+Right would always restart from
      // el.fontSize (element-wide) and the partial selection would never
      // accumulate increments — every press would wrap the same value.
      const active = getActiveTextStyle(activeText);
      const activeBase = (active && active[field] != null) ? active[field] : activeText[field];
      const partialNext = clampTypographyValue(field, (activeBase == null ? fallback : activeBase) + delta);
      if (field === 'paragraphSpacing' && applyParagraphSpacingToSelection(partialNext)) return true;
      const style = cssTypographyPatch(field, partialNext);
      if (style && applyStyleToSelection(style)) return true;
    }

    const base = selected[0][field];
    const next = clampTypographyValue(field, (base == null ? fallback : base) + delta);

    recordHistory();
    selected.forEach(el => {
      const elBase = el[field];
      const elNext = clampTypographyValue(field, (elBase == null ? fallback : elBase) + delta);
      if (field === 'paragraphSpacing') {
        el.paragraphSpacing = elNext;
        if (el.html) el.html = clearParagraphGapsFromHtml(el.html);
      } else {
        const patch = {};
        patch[field] = elNext;
        const cleaned = buildTextPatch(el, patch, cssPropsForTypographyField(field));
        Object.assign(el, cleaned);
      }
      autoSizeTextElement(el);
    });
    renderCanvas();
    renderSlidesList();
    renderProperties();
    refreshContentEditor();
    persist();
    return true;
  }

  function toggleSelectedTextWeight() {
    const slide = getCurrentSlide();
    if (!slide) return false;
    const activeText = state.editingElementId
      ? slide.elements.find(el => el.id === state.editingElementId && el.type === 'text')
      : null;
    const selected = activeText ? [activeText] : getSelectedElements().filter(el => el.type === 'text');
    if (!selected.length) return false;
    const current = selected[0].fontWeight || 400;
    const next = current >= 650 ? 400 : 700;
    if (activeText && applyStyleToSelection({ fontWeight: String(next) })) return true;
    recordHistory();
    selected.forEach(el => {
      Object.assign(el, buildTextPatch(el, { fontWeight: next }, ['font-weight']));
      autoSizeTextElement(el);
    });
    renderCanvas();
    renderSlidesList();
    renderProperties();
    refreshContentEditor();
    persist();
    return true;
  }

  function toggleSelectedTextItalic() {
    const slide = getCurrentSlide();
    if (!slide) return false;
    const activeText = state.editingElementId
      ? slide.elements.find(el => el.id === state.editingElementId && el.type === 'text')
      : null;
    const selected = activeText ? [activeText] : getSelectedElements().filter(el => el.type === 'text');
    if (!selected.length) return false;
    const next = (selected[0].fontStyle || 'normal') === 'italic' ? 'normal' : 'italic';
    if (activeText && applyStyleToSelection({ fontStyle: next })) return true;
    recordHistory();
    selected.forEach(el => {
      Object.assign(el, buildTextPatch(el, { fontStyle: next }, ['font-style']));
      autoSizeTextElement(el);
    });
    renderCanvas();
    renderSlidesList();
    renderProperties();
    refreshContentEditor();
    persist();
    return true;
  }

  function startCropMode(id) {
    const slide = getCurrentSlide();
    const el = slide && slide.elements.find(e => e.id === id);
    if (!isCroppable(el)) return;
    state.cropElementId = id;
    cropDraft = { id, rect: defaultCropRect() };
    selectOnly(id);
    renderCanvas();
    renderProperties();
  }

  function cancelCropMode() {
    state.cropElementId = null;
    cropDraft = null;
    renderCanvas();
    renderProperties();
  }

  function applyCropMode() {
    const slide = getCurrentSlide();
    const el = slide && slide.elements.find(e => e.id === state.cropElementId);
    if (!isCroppable(el) || !cropDraft || cropDraft.id !== el.id) return cancelCropMode();
    const r = clampCropRect(cropDraft.rect);
    const oldW = Math.max(1, el.w || 1);
    const oldH = Math.max(1, el.h || 1);
    const cropX = oldW * r.x / 100;
    const cropY = oldH * r.y / 100;
    const cropW = Math.max(20, oldW * r.w / 100);
    const cropH = Math.max(20, oldH * r.h / 100);
    const oldCenterX = (el.x || 0) + oldW / 2;
    const oldCenterY = (el.y || 0) + oldH / 2;
    const localCenterX = cropX + cropW / 2 - oldW / 2;
    const localCenterY = cropY + cropH / 2 - oldH / 2;
    const theta = (el.rotation || 0) * Math.PI / 180;
    const cos = Math.cos(theta);
    const sin = Math.sin(theta);
    const newCenterX = oldCenterX + localCenterX * cos - localCenterY * sin;
    const newCenterY = oldCenterY + localCenterX * sin + localCenterY * cos;
    const zoomFactor = Math.max(oldW / cropW, oldH / cropH);
    const nextZoom = Math.max(1, Math.min(6, (el.cropZoom || 1) * zoomFactor));
    const nextCropX = Math.max(-100, Math.min(100, (el.cropX || 0) + ((cropX + cropW / 2 - oldW / 2) / oldW) * 200));
    const nextCropY = Math.max(-100, Math.min(100, (el.cropY || 0) + ((cropY + cropH / 2 - oldH / 2) / oldH) * 200));
    recordHistory();
    Object.assign(el, {
      x: Math.round(newCenterX - cropW / 2),
      y: Math.round(newCenterY - cropH / 2),
      w: Math.round(cropW),
      h: Math.round(cropH),
      cropX: nextCropX,
      cropY: nextCropY,
      cropZoom: nextZoom,
      cropApplied: true,
      aspectRatio: cropW / Math.max(1, cropH),
    });
    state.cropElementId = null;
    cropDraft = null;
    renderCanvas();
    renderSlidesList();
    renderProperties();
    persist();
  }

  function selectElement(id, additive) {
    if (additive) {
      selectToggle(id);
    } else {
      const ids = idsForElementSelection(id, false);
      if (ids.length === state.selectedElementIds.size && ids.every(selId => isSelected(selId))) return;
      selectClear();
      ids.forEach(selId => state.selectedElementIds.add(selId));
    }
    renderCanvas();
    renderProperties();
    refreshContentEditor();
  }

  function toggleElementSelectionOnly(id) {
    selectToggle(id);
    renderCanvas();
    renderProperties();
    refreshContentEditor();
  }

  function deselectElement() {
    if (!state.selectedElementIds.size) return;
    selectClear();
    renderCanvas();
    renderProperties();
    refreshContentEditor();
  }

  function deleteElement() {
    const slide = getCurrentSlide();
    const ids = getSelectedIds();
    if (!slide || !ids.length) return;
    recordHistory();
    slide.elements = slide.elements.filter(e => !ids.includes(e.id));
    selectClear();
    renderAll();
  }

  // ---------- Copy / Paste / Cut / Duplicate ----------
  // Two clipboards used together:
  //   - internalClipboard: in-memory snapshot, instant and lossless across slides
  //     in the same tab (pasted across slides without async work).
  //   - System clipboard: async write of a tagged JSON payload so paste survives
  //     a refresh and works across browser tabs/windows. On paste we try system
  //     first and fall back to internal.
  // The deep clone via JSON.stringify preserves every element property
  // (rich-text html, fonts, weight, color, stroke, shadow, opacity, etc.) — the
  // pasted element is a regular element with a fresh id, fully editable.
  let internalClipboard = null;
  let internalSlideClipboard = null;
  const CLIPBOARD_TAG = 'presgen-clipboard:v1:';
  const SLIDE_CLIPBOARD_TAG = 'presgen-slide:v1:';

  function cloneElement(el) {
    const c = JSON.parse(JSON.stringify(el));
    c.id = uid('el');
    return c;
  }

  function snapshotSelectedAsClipboard() {
    const slide = getCurrentSlide();
    if (!slide) return null;
    const ids = getSelectedIds();
    const items = ids
      .map(id => slide.elements.find(e => e.id === id))
      .filter(Boolean)
      .map(el => JSON.parse(JSON.stringify(el)));
    if (!items.length) return null;
    return {
      sourceSlideId: slide.id,
      items,
    };
  }

  function normalizeClipboardPayload(payload) {
    if (!payload) return { sourceSlideId: null, items: [] };
    if (Array.isArray(payload)) return { sourceSlideId: null, items: payload };
    if (Array.isArray(payload.items)) {
      return {
        sourceSlideId: typeof payload.sourceSlideId === 'string' ? payload.sourceSlideId : null,
        items: payload.items,
      };
    }
    return { sourceSlideId: null, items: [] };
  }

  function writeSystemClipboard(payload) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(CLIPBOARD_TAG + JSON.stringify(payload)).catch(() => {});
      }
    } catch (_) {}
  }

  function writeSystemSlideClipboard(slide) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(SLIDE_CLIPBOARD_TAG + JSON.stringify(slide)).catch(() => {});
      }
    } catch (_) {}
  }

  function parseInternalClipboardText(txt) {
    try {
      if (!txt || !txt.startsWith(CLIPBOARD_TAG)) return null;
      const payload = JSON.parse(txt.slice(CLIPBOARD_TAG.length));
      const normalized = normalizeClipboardPayload(payload);
      return normalized.items.length ? normalized : null;
    } catch (_) { return null; }
  }

  function parseSlideClipboardText(txt) {
    try {
      if (!txt || !txt.startsWith(SLIDE_CLIPBOARD_TAG)) return null;
      const slide = JSON.parse(txt.slice(SLIDE_CLIPBOARD_TAG.length));
      return slide && typeof slide === 'object' && Array.isArray(slide.elements) ? slide : null;
    } catch (_) { return null; }
  }

  async function readSystemClipboard() {
    try {
      if (!navigator.clipboard || !navigator.clipboard.readText) return null;
      const txt = await navigator.clipboard.readText();
      return parseInternalClipboardText(txt);
    } catch (_) { return null; }
  }

  async function readSystemSlideClipboard() {
    try {
      if (!navigator.clipboard || !navigator.clipboard.readText) return null;
      const txt = await navigator.clipboard.readText();
      return parseSlideClipboardText(txt);
    } catch (_) { return null; }
  }

  function copyCurrentSlide() {
    const slide = getCurrentSlide();
    if (!slide) return;
    internalSlideClipboard = JSON.parse(JSON.stringify(slide));
    internalClipboard = null;
    writeSystemSlideClipboard(internalSlideClipboard);
  }

  async function pasteSlideClipboard() {
    const slide = internalSlideClipboard || await readSystemSlideClipboard();
    insertSlideCopyAfterCurrent(slide);
  }

  function copySelected() {
    const payload = snapshotSelectedAsClipboard();
    if (!payload || !payload.items.length) return;
    internalClipboard = payload;
    internalSlideClipboard = null;
    writeSystemClipboard(payload);
  }

  function cutSelected() {
    const payload = snapshotSelectedAsClipboard();
    if (!payload || !payload.items.length) return;
    internalClipboard = payload;
    internalSlideClipboard = null;
    writeSystemClipboard(payload);
    deleteElement();
  }

  function insertClipboardItems(payload) {
    const normalized = normalizeClipboardPayload(payload);
    const items = normalized.items;
    if (!items.length) return;
    const slide = getCurrentSlide();
    if (!slide) return;
    recordHistory();
    const offset = normalized.sourceSlideId && normalized.sourceSlideId !== slide.id ? 0 : 20;
    const newIds = [];
    items.forEach(src => {
      const c = cloneElement(src);
      c.x = (c.x || 0) + offset;
      c.y = (c.y || 0) + offset;
      slide.elements.push(c);
      newIds.push(c.id);
    });
    selectClear();
    newIds.forEach(id => state.selectedElementIds.add(id));
    renderAll();
  }

  function isEditableTarget(target) {
    const tag = target && target.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || !!(target && target.isContentEditable);
  }

  function extractSvgMarkup(text) {
    if (!text) return '';
    const decoded = decodeHtmlEntities(String(text));
    const match = decoded.match(/<svg[\s\S]*?<\/svg>/i);
    if (match) return match[0];
    const fromData = extractSvgDataUrl(decoded);
    if (fromData) return extractSvgMarkup(fromData);
    const rawMatch = String(text).match(/<svg[\s\S]*?<\/svg>/i);
    if (rawMatch) return rawMatch[0];
    const rawData = extractSvgDataUrl(text);
    if (rawData) return extractSvgMarkup(rawData);
    return '';
  }

  function svgToDataUrl(svg) {
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  async function insertImageDataUrl(dataUrl) {
    const slide = getCurrentSlide();
    if (!slide || !dataUrl) return false;
    const meta = await loadImageMetadata(dataUrl);
    recordHistory();
    const fit = fitToCanvas(meta.w || 1280, meta.h || 720);
    const el = imageEl(dataUrl, {
      x: Math.round((state.canvasW - fit.w) / 2),
      y: Math.round((state.canvasH - fit.h) / 2),
      w: fit.w,
      h: fit.h,
      aspectRatio: meta.w && meta.h ? meta.w / meta.h : null,
    });
    slide.elements.push(el);
    state.selectedElementId = el.id;
    renderAll();
    return true;
  }

  async function insertSvgText(svg) {
    const clean = extractSvgMarkup(svg);
    if (!clean) return false;
    const slide = getCurrentSlide();
    if (!slide) return false;
    const dataUrl = svgToDataUrl(clean);
    const meta = await loadImageMetadata(dataUrl);
    recordHistory();
    const fit = fitToCanvas(meta.w || 1280, meta.h || 720);
    const el = vectorEl(clean, {
      x: Math.round((state.canvasW - fit.w) / 2),
      y: Math.round((state.canvasH - fit.h) / 2),
      w: fit.w,
      h: fit.h,
      aspectRatio: meta.w && meta.h ? meta.w / meta.h : fit.w / Math.max(1, fit.h),
      aspectLocked: true,
    });
    slide.elements.push(el);
    state.selectedElementId = el.id;
    renderAll();
    return true;
  }

  async function handleClipboardData(data) {
    if (!data) return false;
    const text = data.getData ? data.getData('text/plain') : '';
    const slideItem = parseSlideClipboardText(text);
    if (slideItem) {
      insertSlideCopyAfterCurrent(slideItem);
      return true;
    }
    const internalItems = parseInternalClipboardText(text);
    if (internalItems && internalItems.items.length) {
      insertClipboardItems(internalItems);
      return true;
    }

    const html = data.getData ? data.getData('text/html') : '';
    // Figma/Adobe often place both SVG and PNG on the clipboard. Prefer the
    // SVG/HTML payload before bitmap file items so vectors stay crisp.
    if (await insertSvgText(html)) return true;
    if (await insertSvgText(text)) return true;

    const items = Array.from(data.items || []);
    for (const item of items) {
      if (item.kind === 'file' && item.type === 'image/svg+xml') {
        const file = item.getAsFile();
        if (!file) continue;
        const svg = await readFileAsText(file);
        return insertSvgText(svg);
      }
      if (item.kind === 'file' && item.type && item.type.indexOf('image/') === 0) {
        const file = item.getAsFile();
        if (!file) continue;
        const dataUrl = await readFileAsDataUrl(file);
        return insertImageDataUrl(dataUrl);
      }
    }
    if (insertTextBoxFromClipboardText(text)) return true;
    return false;
  }

  async function pasteFromNavigatorClipboard() {
    if (!navigator.clipboard) return false;
    try {
      if (navigator.clipboard.read) {
        const items = await navigator.clipboard.read();
        for (const item of items) {
          const svgType = item.types.find(type => type === 'image/svg+xml');
          if (svgType) {
            const blob = await item.getType(svgType);
            const svg = await readFileAsText(blob);
            if (await insertSvgText(svg)) return true;
          }
          for (const type of ['text/html', 'text/plain']) {
            if (!item.types.includes(type)) continue;
            const blob = await item.getType(type);
            const text = await readFileAsText(blob);
            const slideItem = parseSlideClipboardText(text);
            if (slideItem) {
              insertSlideCopyAfterCurrent(slideItem);
              return true;
            }
            const internalItems = parseInternalClipboardText(text);
            if (internalItems && internalItems.items.length) {
              insertClipboardItems(internalItems);
              return true;
            }
            if (await insertSvgText(text)) return true;
            if (type === 'text/plain' && insertTextBoxFromClipboardText(text)) return true;
          }
          const imageType = item.types.find(type => type.indexOf('image/') === 0);
          if (imageType) {
            const blob = await item.getType(imageType);
            const dataUrl = await readFileAsDataUrl(blob);
            if (await insertImageDataUrl(dataUrl)) return true;
          }
        }
      }
    } catch (_) {}
    return false;
  }

  async function pasteClipboard() {
    // Internal copies first — this path never asks the browser for clipboard
    // permission. Ctrl+V flows through the native `paste` event listener
    // instead, where `e.clipboardData` gives synchronous access to images
    // and external content without a prompt. So this function (used by the
    // Properties "Paste" button) only needs to handle the in-app fallback.
    const payload = internalClipboard;
    if (payload && payload.items && payload.items.length) {
      insertClipboardItems(payload);
      return;
    }
    if (internalSlideClipboard) {
      insertSlideCopyAfterCurrent(internalSlideClipboard);
      return;
    }
    // No in-app clipboard? Try the prompt-free text-only read so users can
    // still paste a previously-copied internal payload from another tab
    // without the image permission dialog. readText is gated by the same
    // user gesture rules but, unlike clipboard.read, doesn't show a popup
    // in Chromium for same-origin text reads.
    const systemItems = await readSystemClipboard();
    if (systemItems && systemItems.items.length) {
      insertClipboardItems(systemItems);
      return;
    }
    const systemSlide = await readSystemSlideClipboard();
    if (systemSlide) insertSlideCopyAfterCurrent(systemSlide);
  }

  function duplicateSelected() {
    const slide = getCurrentSlide();
    if (!slide) return;
    const payload = snapshotSelectedAsClipboard();
    if (!payload || !payload.items.length) return;
    insertClipboardItems(payload);
  }

  function selectAllOnSlide() {
    const slide = getCurrentSlide();
    if (!slide) return;
    selectClear();
    slide.elements.forEach(el => {
      if (!el.locked && !el.hidden) state.selectedElementIds.add(el.id);
    });
    renderAll();
  }

  function selectNextSlide(delta) {
    if (!state.slides.length) return false;
    const cur = Math.max(0, state.slides.findIndex(s => s.id === state.currentSlideId));
    const next = Math.max(0, Math.min(state.slides.length - 1, cur + delta));
    if (next === cur) return false;
    selectSlide(state.slides[next].id);
    return true;
  }

  function selectEdgeSlide(edge) {
    if (!state.slides.length) return false;
    selectSlide(state.slides[edge === 'last' ? state.slides.length - 1 : 0].id);
    return true;
  }

  function nudgeSelected(dx, dy) {
    const slide = getCurrentSlide();
    const ids = getSelectedIds();
    if (!slide || !ids.length) return false;
    recordHistory();
    ids.forEach(id => {
      const el = slide.elements.find(x => x.id === id);
      if (!el || el.locked) return;
      el.x = Math.round((el.x || 0) + dx);
      el.y = Math.round((el.y || 0) + dy);
    });
    renderCanvas();
    renderSlidesList();
    renderProperties();
    persist();
    return true;
  }

  function resizeSelectedBy(dw, dh) {
    const slide = getCurrentSlide();
    const ids = getSelectedIds();
    if (!slide || !ids.length) return false;
    recordHistory();
    ids.forEach(id => {
      const el = slide.elements.find(x => x.id === id);
      if (!el || el.locked) return;
      el.w = Math.max(1, Math.round((el.w || 1) + dw));
      el.h = Math.max(1, Math.round((el.h || 1) + dh));
      if (Object.prototype.hasOwnProperty.call(el, 'radius')) el.radius = effectiveRadius(el);
    });
    renderCanvas();
    renderSlidesList();
    renderProperties();
    persist();
    return true;
  }

  function toggleSelectedFlag(field) {
    const selected = getSelectedElements();
    if (!selected.length) return false;
    const next = !selected.every(el => !!el[field]);
    recordHistory();
    selected.forEach(el => { el[field] = next; });
    renderAll();
    return true;
  }

  function alignSelectedToCanvas(mode) {
    const sels = getSelectedElements();
    if (!sels.length) return false;
    recordHistory();
    sels.forEach(el => {
      switch (mode) {
        case 'left': el.x = 0; break;
        case 'center': el.x = (state.canvasW - el.w) / 2; break;
        case 'right': el.x = state.canvasW - el.w; break;
        case 'top': el.y = 0; break;
        case 'middle': el.y = (state.canvasH - el.h) / 2; break;
        case 'bottom': el.y = state.canvasH - el.h; break;
      }
      el.x = Math.round(el.x);
      el.y = Math.round(el.y);
    });
    renderCanvas();
    renderSlidesList();
    renderProperties();
    persist();
    return true;
  }

  function alignSelectedSmart(mode) {
    const sels = getSelectedElements().filter(el => !el.locked && !el.hidden);
    if (!sels.length) return false;
    if (sels.length > 1) {
      alignSelected(mode);
      return true;
    }
    return alignSelectedToCanvas(mode);
  }

  // Z-order: elements rendered later in the array sit on top, since render()
  // appendChild()s them in order. Front == end of array, back == start.
  function moveElementZ(elId, where) {
    const slide = getCurrentSlide();
    if (!slide || !elId) return;
    const idx = slide.elements.findIndex(e => e.id === elId);
    if (idx < 0) return;
    let newIdx = idx;
    if (where === 'front') newIdx = slide.elements.length - 1;
    else if (where === 'back') newIdx = 0;
    else if (where === 'forward') newIdx = Math.min(slide.elements.length - 1, idx + 1);
    else if (where === 'backward') newIdx = Math.max(0, idx - 1);
    if (newIdx === idx) return;
    recordHistory();
    const [moved] = slide.elements.splice(idx, 1);
    slide.elements.splice(newIdx, 0, moved);
    renderAll();
  }

  // ---------- Drag / Resize ----------
  let dragState = null;

  // Snap threshold in canvas pixels (so it scales with zoom).
  const SNAP_THRESHOLD = 6;
  const GUIDE_SNAP_THRESHOLD = 14;

  function outlineBoxFromRect(x, y, w, h, rotation) {
    const r = (rotation || 0) * Math.PI / 180;
    if (!r) return { x: x, y: y, w: w, h: h };
    const cx = x + w / 2;
    const cy = y + h / 2;
    const cos = Math.cos(r);
    const sin = Math.sin(r);
    const pts = [
      [-w / 2, -h / 2],
      [w / 2, -h / 2],
      [w / 2, h / 2],
      [-w / 2, h / 2],
    ].map(([px, py]) => ({
      x: cx + px * cos - py * sin,
      y: cy + px * sin + py * cos,
    }));
    const xs = pts.map(p => p.x);
    const ys = pts.map(p => p.y);
    const minX = Math.min.apply(null, xs);
    const maxX = Math.max.apply(null, xs);
    const minY = Math.min.apply(null, ys);
    const maxY = Math.max.apply(null, ys);
    return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
  }

  function outlineBox(el) {
    return outlineBoxFromRect(el.x, el.y, el.w, el.h, el.rotation || 0);
  }

  function inflatedHitBox(el) {
    const box = outlineBox(el);
    const minHit = el.type === 'line' ? 18 : 14;
    const addX = Math.max(0, minHit - box.w) / 2;
    const addY = Math.max(0, minHit - box.h) / 2;
    const pad = el.type === 'line' ? 6 : 4;
    return {
      x: box.x - addX - pad,
      y: box.y - addY - pad,
      w: box.w + addX * 2 + pad * 2,
      h: box.h + addY * 2 + pad * 2,
    };
  }

  function findSmallElementHitAt(x, y) {
    const slide = getCurrentSlide();
    if (!slide) return null;
    for (let i = slide.elements.length - 1; i >= 0; i--) {
      const el = slide.elements[i];
      if (!el || el.hidden || el.locked) continue;
      const box = outlineBox(el);
      const small = box.w < 24 || box.h < 24 || el.type === 'line';
      if (!small) continue;
      const hit = inflatedHitBox(el);
      if (x >= hit.x && x <= hit.x + hit.w && y >= hit.y && y <= hit.y + hit.h) return el;
    }
    return null;
  }

  function snapCoord(v) {
    return Math.round(v * 1000) / 1000;
  }

  // Find candidate alignment targets and compute (dx, dy) snap correction.
  // The returned `guides` array describes pink alignment lines to draw.
  function computeSnapDelta(targetBox, draggedIds) {
    const slide = getCurrentSlide();
    if (!slide) return { dx: 0, dy: 0, guides: [] };
    const ids = new Set(draggedIds || []);
    const others = slide.elements.filter(el => !ids.has(el.id) && !el.hidden);
    const cw = state.canvasW, ch = state.canvasH;

    const tLeft = targetBox.x;
    const tRight = targetBox.x + targetBox.w;
    const tCx = targetBox.x + targetBox.w / 2;
    const tTop = targetBox.y;
    const tBottom = targetBox.y + targetBox.h;
    const tCy = targetBox.y + targetBox.h / 2;

    // X-axis candidates: each candidate is { value, edge }.
    const xCands = [
      { value: 0, edge: 'canvas-left', threshold: SNAP_THRESHOLD, kind: 'snap' },
      { value: cw, edge: 'canvas-right', threshold: SNAP_THRESHOLD, kind: 'snap' },
      { value: cw / 2, edge: 'canvas-cx', threshold: SNAP_THRESHOLD, kind: 'snap' },
    ];
    const yCands = [
      { value: 0, edge: 'canvas-top', threshold: SNAP_THRESHOLD, kind: 'snap' },
      { value: ch, edge: 'canvas-bottom', threshold: SNAP_THRESHOLD, kind: 'snap' },
      { value: ch / 2, edge: 'canvas-cy', threshold: SNAP_THRESHOLD, kind: 'snap' },
    ];
    others.forEach(el => {
      const b = outlineBox(el);
      xCands.push({ value: b.x, edge: 'el-left', el: el, threshold: SNAP_THRESHOLD, kind: 'snap' });
      xCands.push({ value: b.x + b.w, edge: 'el-right', el: el, threshold: SNAP_THRESHOLD, kind: 'snap' });
      xCands.push({ value: b.x + b.w / 2, edge: 'el-cx', el: el, threshold: SNAP_THRESHOLD, kind: 'snap' });
      yCands.push({ value: b.y, edge: 'el-top', el: el, threshold: SNAP_THRESHOLD, kind: 'snap' });
      yCands.push({ value: b.y + b.h, edge: 'el-bottom', el: el, threshold: SNAP_THRESHOLD, kind: 'snap' });
      yCands.push({ value: b.y + b.h / 2, edge: 'el-cy', el: el, threshold: SNAP_THRESHOLD, kind: 'snap' });
    });
    // Vertical guide lines (snap user guides too)
    if (state.guides && state.guides.enabled) {
      state.guides.items.forEach(g => {
        if (g.axis === 'v') xCands.push({ value: g.position, edge: 'guide-v', threshold: GUIDE_SNAP_THRESHOLD, kind: 'guide' });
        else yCands.push({ value: g.position, edge: 'guide-h', threshold: GUIDE_SNAP_THRESHOLD, kind: 'guide' });
      });
    }

    function pickSnap(targets, edges) {
      let best = { delta: Infinity, snapTo: null, source: null };
      targets.forEach(c => {
        edges.forEach(edge => {
          if (c.kind === 'guide' && edge.role === 'center') return;
          const d = c.value - edge.value;
          const threshold = c.threshold || SNAP_THRESHOLD;
          if (Math.abs(d) <= threshold && Math.abs(d) < Math.abs(best.delta)) {
            best = { delta: d, snapTo: c.value, source: c };
          }
        });
      });
      return best;
    }
    const xSnap = pickSnap(xCands, [
      { value: tLeft, role: 'edge' },
      { value: tRight, role: 'edge' },
      { value: tCx, role: 'center' }
    ]);
    const ySnap = pickSnap(yCands, [
      { value: tTop, role: 'edge' },
      { value: tBottom, role: 'edge' },
      { value: tCy, role: 'center' }
    ]);
    const dx = xSnap.snapTo != null ? xSnap.delta : 0;
    const dy = ySnap.snapTo != null ? ySnap.delta : 0;

    const guides = [];
    if (dx !== 0 && xSnap.snapTo != null) {
      guides.push({ axis: 'v', value: snapCoord(xSnap.snapTo), kind: xSnap.source && xSnap.source.kind });
    }
    if (dy !== 0 && ySnap.snapTo != null) {
      guides.push({ axis: 'h', value: snapCoord(ySnap.snapTo), kind: ySnap.source && ySnap.source.kind });
    }
    return { dx: dx, dy: dy, guides: guides };
  }

  // Draw transient pink alignment lines on the canvas.
  function renderSnapGuides(guides) {
    let layer = els.canvas.querySelector(':scope > .snap-guides');
    if (!guides || !guides.length) {
      if (layer) layer.remove();
      return;
    }
    if (!layer) {
      layer = document.createElement('div');
      layer.className = 'snap-guides';
      layer.style.position = 'absolute';
      layer.style.left = '0';
      layer.style.top = '0';
      layer.style.width = state.canvasW + 'px';
      layer.style.height = state.canvasH + 'px';
      layer.style.pointerEvents = 'none';
      layer.style.zIndex = '10001';
      els.canvas.appendChild(layer);
    }
    layer.innerHTML = '';
    guides.forEach(g => {
      const line = document.createElement('div');
      line.style.position = 'absolute';
      line.style.background = g.kind === 'guide' ? (state.guides.color || '#00d1ff') : '#ff3d8c';
      line.style.boxShadow = g.kind === 'guide' ? '0 0 0 1px rgba(255,255,255,0.12)' : '';
      if (g.axis === 'v') {
        line.style.left = g.value + 'px';
        line.style.top = '0';
        line.style.bottom = '0';
        line.style.width = '1px';
      } else {
        line.style.top = g.value + 'px';
        line.style.left = '0';
        line.style.right = '0';
        line.style.height = '1px';
      }
      layer.appendChild(line);
    });
  }
  function clearSnapGuides() {
    const layer = els.canvas && els.canvas.querySelector(':scope > .snap-guides');
    if (layer) layer.remove();
  }

  // Marquee (rubber-band) selection: drag on empty canvas to select all
  // elements whose bounding box intersects the marquee rectangle.
  let marqueeState = null;
  function beginMarquee(e) {
    const rect = els.canvas.getBoundingClientRect();
    const scale = rect.width / state.canvasW || 1;
    const startX = (e.clientX - rect.left) / scale;
    const startY = (e.clientY - rect.top) / scale;
    const initialSelection = e.shiftKey ? new Set(state.selectedElementIds) : new Set();
    marqueeState = { startX, startY, scale, rect, initialSelection };
    document.addEventListener('mousemove', onMarqueeMove);
    document.addEventListener('mouseup', endMarquee);
  }
  function onMarqueeMove(e) {
    if (!marqueeState) return;
    const r = marqueeState.rect;
    const s = marqueeState.scale;
    const x = (e.clientX - r.left) / s;
    const y = (e.clientY - r.top) / s;
    const minX = Math.min(marqueeState.startX, x);
    const minY = Math.min(marqueeState.startY, y);
    const maxX = Math.max(marqueeState.startX, x);
    const maxY = Math.max(marqueeState.startY, y);
    drawMarquee(minX, minY, maxX - minX, maxY - minY);
    // Live-update selection while dragging.
    const slide = getCurrentSlide();
    if (!slide) return;
    state.selectedElementIds = new Set(marqueeState.initialSelection);
    slide.elements.forEach(el => {
      if (el.locked || el.hidden) return;
      const box = inflatedHitBox(el);
      const overlaps = !(box.x + box.w < minX || box.x > maxX || box.y + box.h < minY || box.y > maxY);
      if (overlaps) state.selectedElementIds.add(el.id);
    });
    renderCanvas();
    drawMarquee(minX, minY, maxX - minX, maxY - minY); // re-add over re-rendered canvas
  }
  function drawMarquee(x, y, w, h) {
    let m = els.canvas.querySelector(':scope > .marquee');
    if (!m) {
      m = document.createElement('div');
      m.className = 'marquee';
      m.style.position = 'absolute';
      m.style.border = '1px solid #4a90e2';
      m.style.background = 'rgba(74, 144, 226, 0.1)';
      m.style.pointerEvents = 'none';
      m.style.zIndex = '10002';
      els.canvas.appendChild(m);
    }
    m.style.left = x + 'px';
    m.style.top = y + 'px';
    m.style.width = w + 'px';
    m.style.height = h + 'px';
  }
  function endMarquee() {
    document.removeEventListener('mousemove', onMarqueeMove);
    document.removeEventListener('mouseup', endMarquee);
    marqueeState = null;
    const m = els.canvas && els.canvas.querySelector(':scope > .marquee');
    if (m) m.remove();
    renderProperties();
  }

  function beginDrag(e, id) {
    e.preventDefault();
    const slide = getCurrentSlide();
    if (!slide) return;
    const el = slide.elements.find(x => x.id === id);
    if (!el) return;
    recordHistory();
    // If multiple elements are selected and the dragged one is part of the
    // selection, move all selected elements together.
    let ids = isSelected(id) && state.selectedElementIds.size > 1
      ? getSelectedIds()
      : [id];
    let dragId = id;
    const cloneDrag = e.altKey || ((e.ctrlKey || e.metaKey) && e.shiftKey);
    if (cloneDrag) {
      const cloneIds = [];
      const idMap = new Map();
      ids.forEach(srcId => {
        const src = slide.elements.find(x => x.id === srcId);
        if (!src || src.locked || src.hidden) return;
        const c = cloneElement(src);
        idMap.set(srcId, c.id);
        slide.elements.push(c);
        cloneIds.push(c.id);
      });
      if (cloneIds.length) {
        dragId = idMap.get(id) || cloneIds[0];
        ids = cloneIds;
        selectClear();
        cloneIds.forEach(cloneId => state.selectedElementIds.add(cloneId));
        renderCanvas();
      }
    }
    const dragEl = slide.elements.find(x => x.id === dragId) || el;
    dragState = {
      mode: 'move', id: dragId,
      ids: ids,
      origs: ids.map(i => {
        const e2 = slide.elements.find(x => x.id === i);
        return e2 ? { id: i, origX: e2.x, origY: e2.y, w: e2.w, h: e2.h, rotation: e2.rotation || 0 } : null;
      }).filter(Boolean),
      startX: e.clientX, startY: e.clientY,
      origX: dragEl.x, origY: dragEl.y,
    };
    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', endDrag);
  }

  const RESIZE_SIGNS = {
    nw: [-1, -1], n: [0, -1], ne: [1, -1],
    w: [-1, 0],                e: [1, 0],
    sw: [-1, 1],  s: [0, 1],   se: [1, 1],
  };

  function beginResize(e, id, dir) {
    e.preventDefault();
    e.stopPropagation();
    const slide = getCurrentSlide();
    if (!slide) return;
    const el = slide.elements.find(x => x.id === id);
    if (!el) return;
    selectElement(id);
    recordHistory();
    dragState = {
      mode: 'resize', id: id, dir: dir || 'se',
      signs: RESIZE_SIGNS[dir] || [1, 1],
      startX: e.clientX, startY: e.clientY,
      origX: el.x, origY: el.y,
      origW: el.w, origH: el.h,
      origRotation: el.rotation || 0,
    };
    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', endDrag);
  }

  function beginRotate(e, id) {
    e.preventDefault();
    e.stopPropagation();
    const slide = getCurrentSlide();
    if (!slide) return;
    const el = slide.elements.find(x => x.id === id);
    if (!el) return;
    selectElement(id);
    recordHistory();
    const handleEl = e.currentTarget;
    const elNode = handleEl && handleEl.parentNode;
    if (!elNode) return;
    const rect = elNode.getBoundingClientRect();
    // Rotation around the box center; AABB center matches local center for
    // a center-anchored rotation transform.
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const startAngle = Math.atan2(e.clientY - cy, e.clientX - cx) * 180 / Math.PI;
    dragState = {
      mode: 'rotate', id: id,
      cx: cx, cy: cy,
      startAngle: startAngle,
      origRotation: el.rotation || 0,
    };
    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', endDrag);
  }

  function onDrag(e) {
    if (!dragState) return;
    const rect = els.canvas.getBoundingClientRect();
    const scale = rect.width / state.canvasW || 1;
    const dx = (e.clientX - dragState.startX) / scale;
    const dy = (e.clientY - dragState.startY) / scale;
    if (dragState.mode === 'move') {
      // Snapping: compute primary element's target box, find snap deltas, then
      // apply the same world-space dx/dy adjustment to all dragged elements.
      let adjDx = dx;
      let adjDy = dy;
      let activeSnapGuides = [];
      const primary = dragState.origs.find(o => o.id === dragState.id);
      if (primary) {
        const targetBox = outlineBoxFromRect(
          primary.origX + dx,
          primary.origY + dy,
          primary.w,
          primary.h,
          primary.rotation || 0
        );
        const snap = computeSnapDelta(targetBox, dragState.ids);
        adjDx = dx + snap.dx;
        adjDy = dy + snap.dy;
        activeSnapGuides = snap.guides;
      }
      // Move every dragged element by the same (snapped) delta.
      dragState.origs.forEach(o => {
        const slide = getCurrentSlide();
        if (!slide) return;
        const el = slide.elements.find(x => x.id === o.id);
        if (!el) return;
        if (activeSnapGuides.length) {
          el.x = snapCoord(o.origX + adjDx);
          el.y = snapCoord(o.origY + adjDy);
        } else {
          el.x = Math.round(o.origX + adjDx);
          el.y = Math.round(o.origY + adjDy);
        }
      });
      renderCanvas();
      renderSnapGuides(activeSnapGuides);
      renderSlidesList();
    } else if (dragState.mode === 'resize') {
      // Transform world delta to element-local frame so resize feels right
      // even when rotated, then keep the opposite corner pinned in world.
      const theta = (dragState.origRotation || 0) * Math.PI / 180;
      const cos = Math.cos(theta), sin = Math.sin(theta);
      const localDx = dx * cos + dy * sin;
      const localDy = -dx * sin + dy * cos;
      const sx = dragState.signs[0];
      const sy = dragState.signs[1];
      let newW = Math.max(20, Math.round(dragState.origW + sx * localDx));
      let newH = Math.max(20, Math.round(dragState.origH + sy * localDy));
      const slide = getCurrentSlide();
      const targetEl = slide && slide.elements.find(x => x.id === dragState.id);
      const ratio = (targetEl && targetEl.aspectLocked && targetEl.aspectRatio) || (e.shiftKey ? (dragState.origW / Math.max(1, dragState.origH)) : 0);
      if (ratio) {
        if (sx && sy) {
          if (Math.abs(localDx) >= Math.abs(localDy)) newH = Math.max(20, Math.round(newW / ratio));
          else newW = Math.max(20, Math.round(newH * ratio));
        } else if (sx) {
          newH = Math.max(20, Math.round(newW / ratio));
        } else if (sy) {
          newW = Math.max(20, Math.round(newH * ratio));
        }
      }
      const dw = newW - dragState.origW;
      const dh = newH - dragState.origH;
      const oldCx = dragState.origX + dragState.origW / 2;
      const oldCy = dragState.origY + dragState.origH / 2;
      const cdx = (sx * dw / 2) * cos - (sy * dh / 2) * sin;
      const cdy = (sx * dw / 2) * sin + (sy * dh / 2) * cos;
      const newCx = oldCx + cdx;
      const newCy = oldCy + cdy;
      updateElement(dragState.id, {
        x: Math.round(newCx - newW / 2),
        y: Math.round(newCy - newH / 2),
        w: newW,
        h: newH,
      }, { skipPropsRender: true });
    } else if (dragState.mode === 'rotate') {
      const angle = Math.atan2(e.clientY - dragState.cy, e.clientX - dragState.cx) * 180 / Math.PI;
      let rotation = dragState.origRotation + (angle - dragState.startAngle);
      if (e.shiftKey) rotation = Math.round(rotation / 15) * 15;
      while (rotation > 180) rotation -= 360;
      while (rotation < -180) rotation += 360;
      updateElement(dragState.id, { rotation: Math.round(rotation) }, { skipPropsRender: true });
    }
  }

  function endDrag() {
    if (!dragState) return;
    dragState = null;
    document.removeEventListener('mousemove', onDrag);
    document.removeEventListener('mouseup', endDrag);
    clearSnapGuides();
    renderProperties();
    persist();
  }

  // ---------- Save / Load ----------
  // Save = export a single self-contained HTML file ready to deploy on GH Pages.
  // The file embeds slide data inside <script id="data" type="application/json">,
  // so the same exported file can also be re-imported via Load.
  function openProjectLibraryDb() {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        reject(new Error('IndexedDB is not supported in this browser.'));
        return;
      }
      const req = indexedDB.open(PROJECT_LIBRARY_DB, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(PROJECT_LIBRARY_STORE)) {
          const store = db.createObjectStore(PROJECT_LIBRARY_STORE, { keyPath: 'id' });
          store.createIndex('updatedAt', 'updatedAt');
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error || new Error('Could not open project library.'));
    });
  }

  async function projectLibraryTx(mode, fn) {
    const db = await openProjectLibraryDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(PROJECT_LIBRARY_STORE, mode);
      const store = tx.objectStore(PROJECT_LIBRARY_STORE);
      let result;
      tx.oncomplete = () => {
        db.close();
        resolve(result);
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error || new Error('Project library transaction failed.'));
      };
      result = fn(store);
    });
  }

  function getAllFromStore(store) {
    return new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  function slideTitleForProject(slide, fallback) {
    const els = (slide && slide.elements) || [];
    for (const el of els) {
      if (el.type !== 'text') continue;
      const t = (el.text || '').replace(/\s+/g, ' ').trim();
      if (t) return t.slice(0, 52);
    }
    return fallback || 'Untitled project';
  }

  function projectMetaFromData(data) {
    const first = data && data.slides && data.slides[0];
    return {
      title: slideTitleForProject(first, 'Untitled project'),
      slideCount: Array.isArray(data && data.slides) ? data.slides.length : 0,
      canvasW: data && data.canvasW || 1280,
      canvasH: data && data.canvasH || 720,
    };
  }

  async function saveProjectToLibrary(data) {
    if (!data || !Array.isArray(data.slides)) return null;
    const id = data.projectId || currentProjectLibraryId || uid('project');
    data.projectId = id;
    currentProjectLibraryId = id;
    const now = new Date().toISOString();
    const meta = projectMetaFromData(data);
    const record = {
      id,
      title: meta.title,
      slideCount: meta.slideCount,
      canvasW: meta.canvasW,
      canvasH: meta.canvasH,
      updatedAt: now,
      data,
    };
    await projectLibraryTx('readwrite', store => store.put(record));
    return record;
  }

  async function listProjectLibrary() {
    try {
      const all = await projectLibraryTx('readonly', store => getAllFromStore(store));
      return all
        .filter(r => !r || !r.isAutosave) // hide the autosave-draft slot
        .sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')));
    } catch (e) {
      console.warn(e);
      return [];
    }
  }

  // Single fixed slot in IndexedDB that persist() mirrors to on every edit.
  // Acts as a recovery point if localStorage gets wiped/throws (quota, preview
  // iframe scope, browser clear, etc.). Excluded from listProjectLibrary so
  // it never shows up as a card on the projects page.
  const AUTOSAVE_DRAFT_ID = '__pres_autosave_draft__';

  async function writeAutosaveDraft(data) {
    if (!data || !Array.isArray(data.slides) || !data.slides.length) return;
    try {
      const meta = projectMetaFromData(data);
      const record = {
        id: AUTOSAVE_DRAFT_ID,
        title: meta.title || 'Working draft',
        slideCount: meta.slideCount,
        canvasW: meta.canvasW,
        canvasH: meta.canvasH,
        updatedAt: new Date().toISOString(),
        isAutosave: true,
        data,
      };
      await projectLibraryTx('readwrite', store => store.put(record));
    } catch (e) {
      // Storage errors are recoverable — we'll try again on the next edit.
      console.warn('Autosave draft write failed', e);
    }
  }

  async function readAutosaveDraft() {
    try {
      return await projectLibraryTx('readonly', store => new Promise((resolve, reject) => {
        const req = store.get(AUTOSAVE_DRAFT_ID);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      }));
    } catch (e) {
      return null;
    }
  }

  async function deleteProjectFromLibrary(id) {
    await projectLibraryTx('readwrite', store => store.delete(id));
  }

  function buildProjectData() {
    return {
      fileType: 'presentation-generator-project',
      version: 2,
      projectId: currentProjectLibraryId,
      savedAt: new Date().toISOString(),
      canvasW: state.canvasW,
      canvasH: state.canvasH,
      currentSlideId: state.currentSlideId,
      slides: state.slides,
      grid: state.grid,
      guides: state.guides,
      zoom: state.zoom,
    };
  }

  function downloadTextFile(filename, content, type) {
    const blob = new Blob([content], { type: type || 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function downloadBlobFile(filename, blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async function saveBlobFileWithPicker(filename, blob, pickerOptions) {
    if (typeof window.showSaveFilePicker === 'function') {
      try {
        const handle = await window.showSaveFilePicker(Object.assign({
          suggestedName: filename,
        }, pickerOptions || {}));
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        return true;
      } catch (e) {
        if (e && e.name === 'AbortError') return false;
        console.warn('Save picker failed, falling back to download.', e);
      }
    }
    downloadBlobFile(filename, blob);
    return true;
  }

  async function saveTextFileWithPicker(filename, content, type, pickerOptions) {
    if (typeof window.showSaveFilePicker === 'function') {
      try {
        const handle = await window.showSaveFilePicker(Object.assign({
          suggestedName: filename,
        }, pickerOptions || {}));
        const writable = await handle.createWritable();
        await writable.write(new Blob([content], { type: type || 'text/plain;charset=utf-8' }));
        await writable.close();
        return true;
      } catch (e) {
        if (e && e.name === 'AbortError') return false;
        console.warn('Save picker failed, falling back to download.', e);
      }
    }
    downloadTextFile(filename, content, type);
    return true;
  }

  async function saveProjectFile() {
    if (!state.slides.length) { alert('No project to save.'); return; }
    persist();
    const data = buildProjectData();
    try {
      await saveProjectToLibrary(data);
    } catch (e) {
      console.warn('Could not save to project library.', e);
      alert('Could not save this project to the in-app library. The file save will still continue.');
    }
    const json = JSON.stringify(data, null, 2);
    await saveTextFileWithPicker(
      'presentation-project.pres.json',
      json,
      'application/json;charset=utf-8',
      {
        types: [{
          description: 'Presentation project',
          accept: { 'application/json': ['.pres.json', '.json'] },
        }],
      }
    );
  }

  function collectUsedFontAssets(slides) {
    const usedGoogle = new Set();
    const usedWebfonts = new Set();
    const usedProjectFonts = new Set();
    const usedLocalFonts = new Set();
    function addFontName(name) {
      const clean = String(name || '').trim().replace(/^['"]|['"]$/g, '');
      if (!clean) return;
      if (GOOGLE_FONT_SET.has(clean)) usedGoogle.add(clean);
      if (WEBFONT_SET.has(clean)) usedWebfonts.add(clean);
      if (PROJECT_FONT_SET.has(clean)) usedProjectFonts.add(clean);
      if (localFontRecordFor(clean)) usedLocalFonts.add(clean);
    }
    function collectHtmlFonts(html) {
      String(html || '').replace(/font-family\s*:\s*([^;"']+|"[^"]+"|'[^']+')/gi, (_, value) => {
        String(value || '').split(',').forEach(addFontName);
        return '';
      });
    }
    (slides || state.slides).forEach(s => {
      (s.elements || []).forEach(el => {
        if (!el || el.type !== 'text') return;
        addFontName(el.font);
        collectHtmlFonts(el.html);
      });
    });
    return { usedGoogle, usedWebfonts, usedProjectFonts, usedLocalFonts };
  }

  function buildFontLinksHtml() {
    const { usedGoogle, usedWebfonts, usedProjectFonts } = collectUsedFontAssets();
    let linksHtml = '';
    if (usedGoogle.size) {
      const families = [...usedGoogle].sort();
      const href = googleFontsBundleHref(families);
      linksHtml =
        '<link rel="preconnect" href="https://fonts.googleapis.com">\n' +
        '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n' +
        '<link rel="stylesheet" href="' + href + '">';
    }
    if (usedWebfonts.size) {
      [...usedWebfonts].forEach(name => {
        if (linksHtml) linksHtml += '\n';
        linksHtml += '<link rel="stylesheet" href="' + WEBFONTS[name].cssUrl + '">';
      });
    }
    if (usedProjectFonts.size) {
      if (linksHtml) linksHtml += '\n';
      linksHtml += '<style>\n' + [...usedProjectFonts].map(projectFontFaceCss).join('\n') + '\n</style>';
    }
    return linksHtml;
  }

  async function buildPdfFontCss(slides) {
    const { usedGoogle, usedWebfonts, usedProjectFonts, usedLocalFonts } = collectUsedFontAssets(slides);
    const chunks = [];
    if (usedGoogle.size) {
      chunks.push(await fetchInlineFontCss(googleFontsBundleHref([...usedGoogle].sort())));
    }
    for (const name of usedWebfonts) {
      chunks.push(await fetchInlineFontCss(WEBFONTS[name].cssUrl));
    }
    for (const name of usedProjectFonts) {
      chunks.push(await projectFontFaceCssInline(name));
    }
    usedLocalFonts.forEach(name => chunks.push(localFontFaceCss(name)));
    return chunks.filter(Boolean).join('\n');
  }

  function buildWebfontsFamilyJson() {
    return JSON.stringify(
      Object.assign(
        Object.keys(WEBFONTS).reduce((acc, k) => { acc[k] = WEBFONTS[k].family; return acc; }, {}),
        Object.keys(PROJECT_FONTS).reduce((acc, k) => { acc[k] = PROJECT_FONTS[k].family; return acc; }, {}),
        localFonts.reduce((acc, k) => { acc[k] = localFontCssFamily(k); return acc; }, {})
      )
    ).replace(/</g, '\\u003c');
  }

  // Build the <link>/<style> head fragment for an export. Project fonts
  // (Cosmic Sans, etc. — local OTF/TTF files) are fetched and embedded as
  // base64 data URLs so the exported HTML stays self-contained — letter-
  // spacing, font-stretch, and any glyph-width-dependent layout looks
  // exactly like the editor regardless of where the file is opened or
  // shared. Google Fonts and jsDelivr-hosted webfonts keep their CDN
  // <link> tags (they resolve from any location).
  async function buildExportFontHead() {
    const { usedGoogle, usedWebfonts, usedProjectFonts, usedLocalFonts } = collectUsedFontAssets();
    const parts = [];
    if (usedGoogle.size) {
      const families = [...usedGoogle].sort();
      const href = googleFontsBundleHref(families);
      parts.push(
        '<link rel="preconnect" href="https://fonts.googleapis.com">\n' +
        '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n' +
        '<link rel="stylesheet" href="' + href + '">'
      );
    }
    [...usedWebfonts].forEach(name => {
      parts.push('<link rel="stylesheet" href="' + WEBFONTS[name].cssUrl + '">');
    });
    if (usedProjectFonts.size) {
      const inlined = [];
      for (const name of usedProjectFonts) {
        try {
          inlined.push(await projectFontFaceCssInline(name));
        } catch (e) {
          console.warn('Could not inline project font, falling back to relative URL:', name, e);
          inlined.push(projectFontFaceCss(name));
        }
      }
      parts.push('<style>\n' + inlined.filter(Boolean).join('\n') + '\n</style>');
    }
    if (usedLocalFonts.size) {
      // Local-font-access fonts can't be inlined (no file system handle), so
      // fall back to the page-installed @font-face rule. The font name still
      // resolves if the viewer has it installed; otherwise system fallback.
      const rules = [...usedLocalFonts].map(localFontFaceCss).filter(Boolean);
      if (rules.length) parts.push('<style>\n' + rules.join('\n') + '\n</style>');
    }
    return parts.join('\n');
  }

  async function buildExportHtml() {
    const linksHtml = await buildExportFontHead();
    const exportData = {
      canvasW: state.canvasW,
      canvasH: state.canvasH,
      slides: getVisibleSlides(),
    };
    const safeJson = JSON.stringify(exportData).replace(/</g, '\\u003c');
    const webfontsFamilyJson = buildWebfontsFamilyJson();
    return EXPORT_TEMPLATE
      .replace('__GOOGLE_FONTS_LINKS__', () => linksHtml)
      .replace('__WEBFONTS_FAMILY_JSON__', () => webfontsFamilyJson)
      .replace('__SLIDES_JSON__', () => safeJson);
  }

  async function saveToFile() {
    if (!state.slides.length) { alert('No slides to export.'); return; }
    // Make sure every text element's box is sized against the *actually loaded*
    // fonts before we serialize — covers projects opened with project fonts
    // mid-load when the boxes were last measured against system fallbacks.
    if (document.fonts && document.fonts.ready) {
      try { await document.fonts.ready; } catch (_) {}
    }
    state.slides.forEach(slide => {
      (slide.elements || []).forEach(el => {
        if (el && el.type === 'text' && !el.hidden) autoSizeTextElement(el);
      });
    });
    const html = await buildExportHtml();
    await saveTextFileWithPicker(
      'presentation.html',
      html,
      'text/html;charset=utf-8',
      {
        types: [{
          description: 'HTML presentation',
          accept: { 'text/html': ['.html', '.htm'] },
        }],
      }
    );
  }

  function waitForNodeImages(root) {
    const imgs = Array.from(root.querySelectorAll('img'));
    return Promise.all(imgs.map(img => {
      if (img.complete) return Promise.resolve();
      return new Promise(resolve => {
        img.onload = resolve;
        img.onerror = resolve;
      });
    }));
  }

  function isPdfSafeAssetUrl(url) {
    if (!url) return true;
    const s = String(url).trim();
    if (!s || s === 'none') return true;
    if (/^(data:|blob:)/i.test(s)) return true;
    try {
      const parsed = new URL(s, location.href);
      return parsed.origin === location.origin;
    } catch (e) {
      return false;
    }
  }

  function extractCssUrl(value) {
    const m = String(value || '').match(/url\((['"]?)(.*?)\1\)/i);
    return m ? m[2] : '';
  }

  function makePdfImagePlaceholder(label) {
    const box = document.createElement('div');
    box.style.width = '100%';
    box.style.height = '100%';
    box.style.display = 'flex';
    box.style.alignItems = 'center';
    box.style.justifyContent = 'center';
    box.style.background = '#303030';
    box.style.color = '#777';
    box.style.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    box.style.letterSpacing = '0';
    box.textContent = label || 'Image unavailable';
    return box;
  }

  function sanitizePdfRenderAssets(root) {
    root.querySelectorAll('img').forEach(img => {
      const src = img.currentSrc || img.getAttribute('src') || '';
      if (isPdfSafeAssetUrl(src)) return;
      const fallback = makePdfImagePlaceholder('External image');
      fallback.style.cssText += ';' + img.style.cssText;
      fallback.style.background = '#303030';
      img.replaceWith(fallback);
    });

    root.querySelectorAll('*').forEach(node => {
      const bg = node.style && node.style.backgroundImage;
      const url = extractCssUrl(bg);
      if (url && !isPdfSafeAssetUrl(url)) {
        node.style.backgroundImage = 'none';
        node.style.backgroundColor = node.classList && node.classList.contains('linkcard-image') ? '#303030' : (node.style.backgroundColor || '#303030');
        if (node.classList && node.classList.contains('linkcard-image') && !node.textContent) {
          node.textContent = 'External thumbnail';
          node.style.display = 'flex';
          node.style.alignItems = 'center';
          node.style.justifyContent = 'center';
          node.style.color = '#777';
          node.style.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
        }
      }
    });

    root.querySelectorAll('image').forEach(image => {
      ['href', 'xlink:href'].forEach(attr => {
        const v = image.getAttribute(attr);
        if (v && !isPdfSafeAssetUrl(v)) image.removeAttribute(attr);
      });
    });
  }

  function plainTextFromElement(el) {
    if (!el) return '';
    let text = '';
    if (el.html) {
      const tmp = document.createElement('div');
      tmp.innerHTML = el.html;
      text = tmp.innerText || tmp.textContent || '';
    } else {
      text = el.text || '';
    }
    return applyTextCaseValue(text, el.textCase);
  }

  function loadPdfSafeImage(src) {
    if (!isPdfSafeAssetUrl(src)) return Promise.resolve(null);
    if (/^data:image\/svg\+xml/i.test(String(src || ''))) return Promise.resolve(null);
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src || '';
    });
  }

  function roundedRectPath(ctx, x, y, w, h, r) {
    r = Math.max(0, Math.min(r || 0, Math.min(w, h) / 2));
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function drawObjectFitImage(ctx, img, x, y, w, h, fit) {
    if (!img || !img.naturalWidth || !img.naturalHeight) return false;
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;
    if (fit === 'fill') {
      ctx.drawImage(img, x, y, w, h);
      return true;
    }
    const scale = fit === 'contain' ? Math.min(w / iw, h / ih) : Math.max(w / iw, h / ih);
    const dw = iw * scale;
    const dh = ih * scale;
    ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
    return true;
  }

  function drawPdfPlaceholder(ctx, el, label) {
    const r = effectiveRadius(el);
    ctx.save();
    roundedRectPath(ctx, 0, 0, el.w || 0, el.h || 0, r);
    ctx.clip();
    ctx.fillStyle = '#303030';
    ctx.fillRect(0, 0, el.w || 0, el.h || 0);
    ctx.fillStyle = '#777';
    ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label || 'Unsupported media', (el.w || 0) / 2, (el.h || 0) / 2);
    ctx.restore();
  }

  // Wrap text to fit within maxW using canvas measurement. Splits hard breaks
  // first, then tries to wrap by whitespace; if a single token (e.g. a long
  // Korean run with no spaces) still exceeds maxW, falls back to character-
  // level break so CJK content wraps instead of overflowing.
  function wrapCanvasText(ctx, text, maxW) {
    const lines = [];
    function pushChunkBreakingChars(chunk) {
      // Break a single chunk at character boundaries.
      let buf = '';
      for (const ch of chunk) {
        const test = buf + ch;
        if (buf && ctx.measureText(test).width > maxW) {
          lines.push(buf);
          buf = ch;
        } else {
          buf = test;
        }
      }
      if (buf) lines.push(buf);
    }
    String(text || '').split(/\r?\n/).forEach(raw => {
      // Empty hard-break line — preserve as blank line.
      if (raw === '') { lines.push(''); return; }
      const tokens = raw.split(/(\s+)/).filter(Boolean);
      let line = '';
      tokens.forEach(token => {
        const test = line + token;
        if (line && ctx.measureText(test).width > maxW) {
          lines.push(line.trimEnd());
          line = '';
          // If the token itself is wider than maxW, char-break it.
          if (ctx.measureText(token).width > maxW) {
            const chunks = [];
            pushChunkBreakingChars(token);
            // pushChunkBreakingChars already pushed lines; the last char-line
            // becomes our new line buffer so subsequent tokens append to it.
            line = lines.pop() || '';
          } else {
            line = token.trimStart();
          }
        } else if (!line && ctx.measureText(token).width > maxW) {
          // Token alone exceeds maxW from an empty line: char-break it.
          pushChunkBreakingChars(token);
          line = lines.pop() || '';
        } else {
          line = test;
        }
      });
      lines.push(line);
    });
    return lines.length ? lines : [''];
  }

  function drawPdfText(ctx, el) {
    const fontSize = el.fontSize || 24;
    const lineHeight = fontSize * (el.lineHeight != null ? el.lineHeight : 1.3);
    const weight = el.fontWeight || 400;
    const style = (el.fontStyle || 'normal') === 'italic' ? 'italic ' : '';
    ctx.font = style + weight + ' ' + fontSize + 'px ' + resolveFontFamily(el.font);
    // Apply letter-spacing when supported (Chrome 99+, no-op on older browsers).
    if ('letterSpacing' in ctx) {
      try { ctx.letterSpacing = (el.letterSpacing || 0) + 'px'; } catch (_) {}
    }
    ctx.textAlign = el.align === 'center' ? 'center' : (el.align === 'right' ? 'right' : 'left');
    ctx.textBaseline = 'top';
    if (el.bg) {
      ctx.fillStyle = el.bg;
      ctx.fillRect(0, 0, el.w || 0, el.h || 0);
    }
    const pad = 4;
    const maxW = Math.max(1, (el.w || 0) - pad * 2);
    const lines = wrapCanvasText(ctx, plainTextFromElement(el), maxW);
    const totalH = lines.length * lineHeight;
    let y = pad;
    if (el.verticalAlign === 'bottom') y = Math.max(pad, (el.h || 0) - totalH - pad);
    else if ((el.verticalAlign || 'center') === 'center') y = Math.max(pad, ((el.h || 0) - totalH) / 2);
    const x = el.align === 'center' ? (el.w || 0) / 2 : (el.align === 'right' ? (el.w || 0) - pad : pad);

    // Drop-shadow → set canvas shadow before fillText/strokeText.
    if (el.shadow) {
      ctx.shadowColor = el.shadow.color || 'rgba(0,0,0,0.4)';
      ctx.shadowOffsetX = el.shadow.x || 0;
      ctx.shadowOffsetY = el.shadow.y || 0;
      ctx.shadowBlur = Math.max(0, el.shadow.blur || 0);
    }

    ctx.fillStyle = el.color || '#fff';
    lines.forEach((line, i) => ctx.fillText(line, x, y + i * lineHeight));

    // Reset shadow before stroke so it doesn't double-up.
    if (el.shadow) {
      ctx.shadowColor = 'transparent';
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      ctx.shadowBlur = 0;
    }

    // Text stroke (the editor uses -webkit-text-stroke; canvas equivalent is
    // strokeText drawn underneath the fill). Only kicks in if width > 0.
    if (el.stroke && el.stroke.width > 0) {
      ctx.lineWidth = el.stroke.width;
      ctx.strokeStyle = strokePaint(el.stroke);
      ctx.lineJoin = 'round';
      lines.forEach((line, i) => ctx.strokeText(line, x, y + i * lineHeight));
    }

    // Underline / strikethrough — draw as a horizontal rule per line.
    if (el.underline || el.strikethrough) {
      ctx.fillStyle = el.color || '#fff';
      const thickness = Math.max(1, Math.round(fontSize / 16));
      const underlineExtra = el.underlineOffset != null ? el.underlineOffset : 3;
      lines.forEach((line, i) => {
        const w = ctx.measureText(line).width;
        let lineX = x;
        if (ctx.textAlign === 'center') lineX = x - w / 2;
        else if (ctx.textAlign === 'right') lineX = x - w;
        const baseY = y + i * lineHeight;
        if (el.underline) ctx.fillRect(lineX, baseY + fontSize * 0.95 + underlineExtra, w, thickness);
        if (el.strikethrough) ctx.fillRect(lineX, baseY + fontSize * 0.55, w, thickness);
      });
    }
  }

  async function renderSlideToCanvasJpeg(slide) {
    const scale = Math.min(1, Math.max(0.6, 1280 / Math.max(state.canvasW, state.canvasH)));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(state.canvasW * scale);
    canvas.height = Math.round(state.canvasH * scale);
    const ctx = canvas.getContext('2d');
    ctx.scale(scale, scale);
    ctx.fillStyle = slide.bg || '#000000';
    ctx.fillRect(0, 0, state.canvasW, state.canvasH);
    const bg = slide.bgImage && await loadPdfSafeImage(slide.bgImage);
    if (bg) drawObjectFitImage(ctx, bg, 0, 0, state.canvasW, state.canvasH, 'cover');

    for (const el of (slide.elements || [])) {
      if (!el || el.hidden) continue;
      ctx.save();
      ctx.globalAlpha = el.opacity != null ? el.opacity : 1;
      ctx.translate((el.x || 0) + (el.w || 0) / 2, (el.y || 0) + (el.h || 0) / 2);
      ctx.rotate(((el.rotation || 0) * Math.PI) / 180);
      ctx.translate(-(el.w || 0) / 2, -(el.h || 0) / 2);

      if (el.type === 'text') {
        drawPdfText(ctx, el);
      } else if (el.type === 'rect') {
        roundedRectPath(ctx, 0, 0, el.w || 0, el.h || 0, effectiveRadius(el));
        if (el.fillEnabled !== false) {
          ctx.fillStyle = el.fill || '#fff';
          ctx.fill();
        }
      } else if (el.type === 'circle') {
        ctx.beginPath();
        ctx.ellipse((el.w || 0) / 2, (el.h || 0) / 2, (el.w || 0) / 2, (el.h || 0) / 2, 0, 0, Math.PI * 2);
        if (el.fillEnabled !== false) {
          ctx.fillStyle = el.fill || '#fff';
          ctx.fill();
        }
      } else if (el.type === 'line') {
        ctx.fillStyle = (el.stroke && el.stroke.color) || el.fill || '#fff';
        ctx.fillRect(0, Math.max(0, ((el.h || 2) - ((el.stroke && el.stroke.width) || el.h || 2)) / 2), el.w || 0, (el.stroke && el.stroke.width) || el.h || 2);
      } else if (el.type === 'image' || el.type === 'vector') {
        const img = await loadPdfSafeImage(el.src);
        roundedRectPath(ctx, 0, 0, el.w || 0, el.h || 0, effectiveRadius(el));
        ctx.clip();
        if (!drawObjectFitImage(ctx, img, 0, 0, el.w || 0, el.h || 0, mediaFit(el))) drawPdfPlaceholder(ctx, el, el.type === 'vector' ? 'Vector unavailable' : 'Image unavailable');
      } else if (el.type === 'imageBanner') {
        const img = await loadPdfSafeImage((el.images && el.images[0]) || '');
        roundedRectPath(ctx, 0, 0, el.w || 0, el.h || 0, effectiveRadius(el));
        ctx.clip();
        if (!drawObjectFitImage(ctx, img, 0, 0, el.w || 0, el.h || 0, mediaFit(el))) drawPdfPlaceholder(ctx, el, 'Banner image');
      } else if (el.type === 'video') {
        const img = await loadPdfSafeImage(el.poster || '');
        roundedRectPath(ctx, 0, 0, el.w || 0, el.h || 0, effectiveRadius(el));
        ctx.clip();
        if (!drawObjectFitImage(ctx, img, 0, 0, el.w || 0, el.h || 0, mediaFit(el))) drawPdfPlaceholder(ctx, el, 'Video');
      } else if (el.type === 'linkcard') {
        const img = await loadPdfSafeImage(el.image || '');
        roundedRectPath(ctx, 0, 0, el.w || 0, el.h || 0, effectiveRadius(el));
        ctx.clip();
        if (!drawObjectFitImage(ctx, img, 0, 0, el.w || 0, el.h || 0, 'cover')) drawPdfPlaceholder(ctx, el, 'Link thumbnail');
      }
      if (el.stroke && el.stroke.width && el.type !== 'text' && el.type !== 'line') {
        if (el.type === 'circle') {
          ctx.beginPath();
          ctx.ellipse((el.w || 0) / 2, (el.h || 0) / 2, (el.w || 0) / 2, (el.h || 0) / 2, 0, 0, Math.PI * 2);
        } else {
          roundedRectPath(ctx, 0, 0, el.w || 0, el.h || 0, effectiveRadius(el));
        }
        ctx.lineWidth = el.stroke.width;
        ctx.strokeStyle = strokePaint(el.stroke);
        ctx.stroke();
      }
      ctx.restore();
    }

    try {
      return {
        dataUrl: canvas.toDataURL('image/jpeg', 0.88),
        w: canvas.width,
        h: canvas.height,
      };
    } catch (e) {
      const fallback = document.createElement('canvas');
      fallback.width = Math.round(state.canvasW * scale);
      fallback.height = Math.round(state.canvasH * scale);
      const fctx = fallback.getContext('2d');
      fctx.scale(scale, scale);
      fctx.fillStyle = slide.bg || '#000000';
      fctx.fillRect(0, 0, state.canvasW, state.canvasH);
      fctx.fillStyle = '#777';
      fctx.font = '18px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      fctx.textAlign = 'center';
      fctx.fillText('Slide media could not be embedded in PDF', state.canvasW / 2, state.canvasH / 2);
      return {
        dataUrl: fallback.toDataURL('image/jpeg', 0.86),
        w: fallback.width,
        h: fallback.height,
      };
    }
  }

  function dataUrlToBytes(dataUrl) {
    const base64 = String(dataUrl).split(',')[1] || '';
    const raw = atob(base64);
    const bytes = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
    return bytes;
  }

  function xmlEscape(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  let crcTable = null;
  function crc32(bytes) {
    if (!crcTable) {
      crcTable = new Uint32Array(256);
      for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
        crcTable[n] = c >>> 0;
      }
    }
    let crc = 0xffffffff;
    for (let i = 0; i < bytes.length; i++) crc = crcTable[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
    return (crc ^ 0xffffffff) >>> 0;
  }

  function createStoreZip(files) {
    const encoder = new TextEncoder();
    const chunks = [];
    const central = [];
    let offset = 0;
    const now = new Date();
    const dosTime = (now.getHours() << 11) | (now.getMinutes() << 5) | Math.floor(now.getSeconds() / 2);
    const dosDate = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();
    const push = bytes => {
      chunks.push(bytes);
      offset += bytes.byteLength;
    };
    const u16 = (arr, v) => { arr.push(v & 255, (v >>> 8) & 255); };
    const u32 = (arr, v) => { arr.push(v & 255, (v >>> 8) & 255, (v >>> 16) & 255, (v >>> 24) & 255); };
    files.forEach(file => {
      const nameBytes = encoder.encode(file.name);
      const data = typeof file.data === 'string' ? encoder.encode(file.data) : file.data;
      const crc = crc32(data);
      const start = offset;
      const local = [];
      u32(local, 0x04034b50); u16(local, 20); u16(local, 0); u16(local, 0);
      u16(local, dosTime); u16(local, dosDate); u32(local, crc); u32(local, data.byteLength); u32(local, data.byteLength);
      u16(local, nameBytes.byteLength); u16(local, 0);
      push(new Uint8Array(local)); push(nameBytes); push(data);
      central.push({ nameBytes, crc, size: data.byteLength, start });
    });
    const centralStart = offset;
    central.forEach(file => {
      const c = [];
      u32(c, 0x02014b50); u16(c, 20); u16(c, 20); u16(c, 0); u16(c, 0);
      u16(c, dosTime); u16(c, dosDate); u32(c, file.crc); u32(c, file.size); u32(c, file.size);
      u16(c, file.nameBytes.byteLength); u16(c, 0); u16(c, 0); u16(c, 0); u16(c, 0); u32(c, 0); u32(c, file.start);
      push(new Uint8Array(c)); push(file.nameBytes);
    });
    const centralSize = offset - centralStart;
    const end = [];
    u32(end, 0x06054b50); u16(end, 0); u16(end, 0); u16(end, central.length); u16(end, central.length);
    u32(end, centralSize); u32(end, centralStart); u16(end, 0);
    push(new Uint8Array(end));
    const bytes = new Uint8Array(offset);
    let p = 0;
    chunks.forEach(chunk => { bytes.set(chunk, p); p += chunk.byteLength; });
    return new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' });
  }

  function pptColorHex(color, fallback) {
    const rgba = cssColorToRgba(color);
    if (!rgba) return fallback || 'FFFFFF';
    return [rgba.r, rgba.g, rgba.b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('').toUpperCase();
  }

  function pptFontName(font) {
    if (!font || FONT_FAMILIES[font]) return font === 'serif' ? 'Georgia' : (font === 'mono' ? 'Courier New' : 'Arial');
    return String(font).replace(/^['"]|['"]$/g, '');
  }

  function buildPptTextShape(el, shapeId, pageW, pageH, cx, cy) {
    const x = Math.round((el.x || 0) / pageW * cx);
    const y = Math.round((el.y || 0) / pageH * cy);
    const w = Math.round((el.w || 1) / pageW * cx);
    const h = Math.round((el.h || 1) / pageH * cy);
    const rot = Math.round((el.rotation || 0) * 60000);
    const fontSize = Math.max(1, Math.round((el.fontSize || 24) * 100));
    const weight = Number(el.fontWeight || 400);
    const color = pptColorHex(el.color || '#ffffff', 'FFFFFF');
    const font = xmlEscape(pptFontName(el.font));
    const align = el.align === 'center' ? 'ctr' : (el.align === 'right' ? 'r' : (el.align === 'justify' ? 'just' : 'l'));
    const anchor = el.verticalAlign === 'top' ? 't' : (el.verticalAlign === 'bottom' ? 'b' : 'ctr');
    const lines = plainTextFromElement(el).replace(/\r/g, '').split('\n');
    const paragraphs = (lines.length ? lines : ['']).map(line =>
      '<a:p><a:pPr algn="' + align + '"/><a:r><a:rPr lang="ko-KR" sz="' + fontSize + '"' +
      (weight >= 600 ? ' b="1"' : '') +
      ((el.fontStyle || 'normal') === 'italic' ? ' i="1"' : '') +
      (el.underline ? ' u="sng"' : '') + '>' +
      '<a:solidFill><a:srgbClr val="' + color + '"/></a:solidFill>' +
      '<a:latin typeface="' + font + '"/><a:ea typeface="' + font + '"/>' +
      '</a:rPr><a:t>' + xmlEscape(line || ' ') + '</a:t></a:r></a:p>'
    ).join('');
    const fill = el.bg ? '<a:solidFill><a:srgbClr val="' + pptColorHex(el.bg, '000000') + '"/></a:solidFill>' : '<a:noFill/>';
    const stroke = el.stroke && el.stroke.width
      ? '<a:ln w="' + Math.round(el.stroke.width * 12700) + '"><a:solidFill><a:srgbClr val="' + pptColorHex(el.stroke.color || '#ffffff', 'FFFFFF') + '"/></a:solidFill></a:ln>'
      : '<a:ln><a:noFill/></a:ln>';
    return '<p:sp><p:nvSpPr><p:cNvPr id="' + shapeId + '" name="Text ' + shapeId + '"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr>' +
      '<p:spPr><a:xfrm' + (rot ? ' rot="' + rot + '"' : '') + '><a:off x="' + x + '" y="' + y + '"/><a:ext cx="' + w + '" cy="' + h + '"/></a:xfrm>' +
      '<a:prstGeom prst="rect"><a:avLst/></a:prstGeom>' + fill + stroke + '</p:spPr>' +
      '<p:txBody><a:bodyPr wrap="square" anchor="' + anchor + '" lIns="50800" tIns="50800" rIns="50800" bIns="50800"/><a:lstStyle/>' + paragraphs + '</p:txBody></p:sp>';
  }

  function buildPptxFromJpegs(pages, pageW, pageH, slidesForText) {
    const cx = 12192000;
    const cy = Math.round(cx * pageH / Math.max(1, pageW));
    const files = [];
    const slideIds = pages.map((_, i) =>
      '<p:sldId id="' + (256 + i) + '" r:id="rId' + (i + 2) + '"/>'
    ).join('');
    const slideRels = pages.map((_, i) =>
      '<Relationship Id="rId' + (i + 2) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide' + (i + 1) + '.xml"/>'
    ).join('');
    const overrides = pages.map((_, i) =>
      '<Override PartName="/ppt/slides/slide' + (i + 1) + '.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>'
    ).join('');
    files.push({ name: '[Content_Types].xml', data:
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
      '<Default Extension="xml" ContentType="application/xml"/>' +
      '<Default Extension="jpeg" ContentType="image/jpeg"/>' +
      '<Default Extension="jpg" ContentType="image/jpeg"/>' +
      '<Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>' +
      '<Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>' +
      '<Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>' +
      '<Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>' +
      '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>' +
      '<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>' +
      overrides + '</Types>' });
    files.push({ name: '_rels/.rels', data:
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>' +
      '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>' +
      '<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>' +
      '</Relationships>' });
    files.push({ name: 'docProps/core.xml', data:
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">' +
      '<dc:title>Presentation</dc:title><dc:creator>Presentation Generator</dc:creator>' +
      '<dcterms:created xsi:type="dcterms:W3CDTF">' + new Date().toISOString() + '</dcterms:created>' +
      '</cp:coreProperties>' });
    files.push({ name: 'docProps/app.xml', data:
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">' +
      '<Application>Presentation Generator</Application><Slides>' + pages.length + '</Slides></Properties>' });
    files.push({ name: 'ppt/presentation.xml', data:
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">' +
      '<p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst><p:sldIdLst>' + slideIds + '</p:sldIdLst>' +
      '<p:sldSz cx="' + cx + '" cy="' + cy + '" type="custom"/><p:notesSz cx="6858000" cy="9144000"/></p:presentation>' });
    files.push({ name: 'ppt/_rels/presentation.xml.rels', data:
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>' +
      slideRels + '<Relationship Id="rId' + (pages.length + 2) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="theme/theme1.xml"/>' +
      '</Relationships>' });
    files.push({ name: 'ppt/slideMasters/slideMaster1.xml', data:
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/></p:spTree></p:cSld><p:sldLayoutIdLst><p:sldLayoutId id="1" r:id="rId1"/></p:sldLayoutIdLst><p:txStyles><p:titleStyle/><p:bodyStyle/><p:otherStyle/></p:txStyles></p:sldMaster>' });
    files.push({ name: 'ppt/slideMasters/_rels/slideMaster1.xml.rels', data:
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/></Relationships>' });
    files.push({ name: 'ppt/slideLayouts/slideLayout1.xml', data:
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" type="blank" preserve="1"><p:cSld name="Blank"><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/></p:spTree></p:cSld></p:sldLayout>' });
    files.push({ name: 'ppt/slideLayouts/_rels/slideLayout1.xml.rels', data:
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/></Relationships>' });
    files.push({ name: 'ppt/theme/theme1.xml', data:
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="Office Theme"><a:themeElements><a:clrScheme name="Default"><a:dk1><a:sysClr val="windowText" lastClr="000000"/></a:dk1><a:lt1><a:sysClr val="window" lastClr="FFFFFF"/></a:lt1><a:dk2><a:srgbClr val="1F1F1F"/></a:dk2><a:lt2><a:srgbClr val="F2F2F2"/></a:lt2><a:accent1><a:srgbClr val="FFFFFF"/></a:accent1><a:accent2><a:srgbClr val="999999"/></a:accent2><a:accent3><a:srgbClr val="666666"/></a:accent3><a:accent4><a:srgbClr val="333333"/></a:accent4><a:accent5><a:srgbClr val="111111"/></a:accent5><a:accent6><a:srgbClr val="000000"/></a:accent6><a:hlink><a:srgbClr val="FFFFFF"/></a:hlink><a:folHlink><a:srgbClr val="999999"/></a:folHlink></a:clrScheme><a:fontScheme name="Default"><a:majorFont><a:latin typeface="Arial"/></a:majorFont><a:minorFont><a:latin typeface="Arial"/></a:minorFont></a:fontScheme><a:fmtScheme name="Default"><a:fillStyleLst/><a:lnStyleLst/><a:effectStyleLst/><a:bgFillStyleLst/></a:fmtScheme></a:themeElements></a:theme>' });
    pages.forEach((page, i) => {
      const n = i + 1;
      const slide = slidesForText && slidesForText[i];
      const textShapes = ((slide && slide.elements) || [])
        .filter(el => el && !el.hidden && el.type === 'text')
        .map((el, ti) => buildPptTextShape(el, 3 + ti, pageW, pageH, cx, cy))
        .join('');
      files.push({ name: 'ppt/media/slide' + n + '.jpeg', data: dataUrlToBytes(page.dataUrl) });
      files.push({ name: 'ppt/slides/slide' + n + '.xml', data:
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">' +
        '<p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/>' +
        '<p:pic><p:nvPicPr><p:cNvPr id="2" name="' + xmlEscape('Slide ' + n) + '"/><p:cNvPicPr/><p:nvPr/></p:nvPicPr>' +
        '<p:blipFill><a:blip r:embed="rId1"/><a:stretch><a:fillRect/></a:stretch></p:blipFill>' +
        '<p:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="' + cx + '" cy="' + cy + '"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr>' +
        '</p:pic>' + textShapes + '</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>' });
      files.push({ name: 'ppt/slides/_rels/slide' + n + '.xml.rels', data:
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/slide' + n + '.jpeg"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/></Relationships>' });
    });
    return createStoreZip(files);
  }

  function buildPdfFromJpegs(pages, pageW, pageH) {
    const encoder = new TextEncoder();
    const objects = [null];
    const reserveObject = () => {
      objects.push(null);
      return objects.length - 1;
    };
    const addObject = value => {
      objects.push(value);
      return objects.length - 1;
    };
    const catalogId = reserveObject();
    const pagesId = reserveObject();
    const pageIds = [];

    pages.forEach((jpeg, i) => {
      const imageBytes = dataUrlToBytes(jpeg.dataUrl);
      const imageId = addObject([
        '<< /Type /XObject /Subtype /Image /Width ' + Math.round(jpeg.w) +
        ' /Height ' + Math.round(jpeg.h) +
        ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + imageBytes.byteLength +
        ' >>\nstream\n',
        imageBytes,
        '\nendstream\n'
      ]);
      const stream = 'q\n' + pageW + ' 0 0 ' + pageH + ' 0 0 cm\n/Im' + (i + 1) + ' Do\nQ';
      const contentBytes = encoder.encode(stream);
      const contentId = addObject([
        '<< /Length ' + contentBytes.byteLength + ' >>\nstream\n',
        contentBytes,
        '\nendstream\n'
      ]);
      const pageId = addObject(
        '<< /Type /Page /Parent ' + pagesId + ' 0 R /MediaBox [0 0 ' + pageW + ' ' + pageH + '] ' +
        '/Resources << /ProcSet [/PDF /ImageC] /XObject << /Im' + (i + 1) + ' ' + imageId + ' 0 R >> >> ' +
        '/Contents ' + contentId + ' 0 R >>'
      );
      pageIds.push(pageId);
    });

    objects[catalogId] = '<< /Type /Catalog /Pages ' + pagesId + ' 0 R >>';
    objects[pagesId] = '<< /Type /Pages /Kids [' + pageIds.map(id => id + ' 0 R').join(' ') + '] /Count ' + pageIds.length + ' >>';

    const chunks = [];
    const offsets = [0];
    let length = 0;
    const pushBytes = bytes => {
      chunks.push(bytes);
      length += bytes.byteLength;
    };
    const pushText = text => pushBytes(encoder.encode(text));
    const pushPart = part => {
      if (part instanceof Uint8Array) pushBytes(part);
      else pushText(String(part));
    };
    pushText('%PDF-1.4\n');
    pushBytes(new Uint8Array([0x25, 0xe2, 0xe3, 0xcf, 0xd3, 0x0a]));
    for (let i = 1; i < objects.length; i++) {
      const obj = objects[i];
      offsets.push(length);
      pushText(i + ' 0 obj\n');
      if (Array.isArray(obj)) obj.forEach(pushPart);
      else pushPart(obj);
      pushText('\nendobj\n');
    }
    const xref = length;
    pushText('xref\n0 ' + objects.length + '\n');
    pushText('0000000000 65535 f \n');
    for (let i = 1; i < offsets.length; i++) {
      pushText(String(offsets[i]).padStart(10, '0') + ' 00000 n \n');
    }
    pushText('trailer\n<< /Size ' + objects.length + ' /Root ' + catalogId + ' 0 R >>\n');
    pushText('startxref\n' + xref + '\n%%EOF\n');
    const bytes = new Uint8Array(length);
    let offset = 0;
    chunks.forEach(chunk => {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    });
    return new Blob([bytes], { type: 'application/pdf' });
  }

  async function renderSlideToJpeg(slide, fontCss) {
    const scale = Math.min(2, Math.max(1, 1920 / Math.max(state.canvasW, state.canvasH)));
    const host = document.createElement('div');
    host.style.position = 'fixed';
    host.style.left = '-100000px';
    host.style.top = '0';
    host.style.width = state.canvasW + 'px';
    host.style.height = state.canvasH + 'px';
    host.style.overflow = 'hidden';
    host.style.background = slide.bg || '#000000';
    host.style.backgroundImage = slide.bgImage ? 'url("' + slide.bgImage + '")' : '';
    host.style.backgroundSize = 'cover';
    host.style.backgroundPosition = 'center';
    host.style.fontFamily = FONT_FAMILIES.sans;
    host.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
    (slide.elements || []).forEach(el => {
      if (!el.hidden) host.appendChild(buildElementNode(el, true));
    });
    sanitizePdfRenderAssets(host);
    document.body.appendChild(host);
    await waitForNodeImages(host);
    host.querySelectorAll('video').forEach(video => {
      const poster = video.getAttribute('poster') || '';
      const fallback = document.createElement(poster ? 'img' : 'div');
      fallback.style.cssText = video.style.cssText;
      fallback.style.width = '100%';
      fallback.style.height = '100%';
      fallback.style.display = 'block';
      if (poster) {
        fallback.src = poster;
      } else {
        fallback.style.background = '#212121';
      }
      video.replaceWith(fallback);
    });
    sanitizePdfRenderAssets(host);
    await waitForNodeImages(host);
    if (document.fonts && document.fonts.ready) {
      try { await document.fonts.ready; } catch (e) {}
    }
    const css = `
      ${fontCss || ''}
      *,*::before,*::after{box-sizing:border-box}
      .el{position:absolute;user-select:none;transform:rotate(var(--rotation,0deg));transform-origin:center center}
      .el.text{display:flex;padding:4px;word-break:break-word;font-synthesis:none}
      .el.text>div{width:100%;white-space:pre-wrap;word-break:break-word}
      .media-clip,.media-clip img,.media-clip video,.media-clip svg{width:100%;height:100%;display:block;overflow:hidden}
      .linkcard-image{position:absolute;inset:0;background-size:cover;background-position:top center;background-repeat:no-repeat}
      .banner-image{position:absolute;inset:0;width:100%;height:100%;display:block}
      .banner-track{position:absolute;inset:0;display:flex;height:100%}
      .banner-track-image{height:100%;display:block;flex:0 0 auto}
      .shape-circle{border-radius:50%}
    `;
    const serialized = new XMLSerializer().serializeToString(host);
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + state.canvasW + '" height="' + state.canvasH + '">' +
      '<foreignObject width="100%" height="100%"><style xmlns="http://www.w3.org/1999/xhtml">' + css + '</style>' +
      serialized + '</foreignObject></svg>';
    const img = new Image();
    const svgUrl = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
    try {
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = svgUrl;
      });
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(state.canvasW * scale);
      canvas.height = Math.round(state.canvasH * scale);
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = slide.bg || '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      return {
        dataUrl: canvas.toDataURL('image/jpeg', 0.92),
        w: canvas.width,
        h: canvas.height,
      };
    } finally {
      URL.revokeObjectURL(svgUrl);
      host.remove();
    }
  }

  function ensurePrintPdfStyle() {
    let style = document.getElementById('print-pdf-style');
    if (style) return style;
    style = document.createElement('style');
    style.id = 'print-pdf-style';
    document.head.appendChild(style);
    return style;
  }

  function printPdfFromDom(slidesToExport) {
    const oldRoot = document.getElementById('printPdfRoot');
    if (oldRoot) oldRoot.remove();
    const root = document.createElement('div');
    root.id = 'printPdfRoot';
    root.setAttribute('aria-hidden', 'true');
    root.style.setProperty('--print-cw', state.canvasW + 'px');
    root.style.setProperty('--print-ch', state.canvasH + 'px');

    slidesToExport.forEach(slide => {
      const page = document.createElement('section');
      page.className = 'print-pdf-page';
      const canvas = document.createElement('div');
      canvas.className = 'canvas print-pdf-canvas';
      canvas.style.width = state.canvasW + 'px';
      canvas.style.height = state.canvasH + 'px';
      canvas.style.backgroundColor = slide.bg || '#000000';
      canvas.style.backgroundImage = slide.bgImage ? 'url("' + slide.bgImage + '")' : '';
      canvas.style.backgroundSize = 'cover';
      canvas.style.backgroundPosition = 'center';
      (slide.elements || []).forEach(el => {
        if (!el || el.hidden) return;
        canvas.appendChild(buildElementNode(el, true));
      });
      page.appendChild(canvas);
      root.appendChild(page);
    });
    document.body.appendChild(root);

    const style = ensurePrintPdfStyle();
    style.textContent = `
@page { size: ${state.canvasW}px ${state.canvasH}px; margin: 0; }
#printPdfRoot { display: none; }
@media print {
  html, body { width: ${state.canvasW}px; height: ${state.canvasH}px; margin: 0 !important; padding: 0 !important; background: #212121 !important; overflow: visible !important; }
  body > :not(#printPdfRoot) { display: none !important; }
  /* Disable all animations/transitions globally so the print rasterization
     never captures an element mid-keyframe (which would shift its position
     or opacity and create the "shifted/overlapping" look). */
  #printPdfRoot, #printPdfRoot * { animation: none !important; transition: none !important; }
  #printPdfRoot { display: block !important; position: static !important; width: ${state.canvasW}px !important; background: #212121 !important; }
  .print-pdf-page { width: ${state.canvasW}px !important; height: ${state.canvasH}px !important; margin: 0 !important; padding: 0 !important; overflow: hidden !important; break-after: page; page-break-after: always; background: #212121 !important; position: relative !important; }
  .print-pdf-page:last-child { break-after: auto; page-break-after: auto; }
  .print-pdf-canvas { position: relative !important; left: 0 !important; top: 0 !important; transform: none !important; transform-origin: top left !important; overflow: hidden !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  .print-pdf-canvas .el { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  /* Selection outlines from the editor must not bleed into print. */
  .print-pdf-canvas .el { outline: none !important; }
}`;

    const cleanup = () => {
      window.removeEventListener('afterprint', cleanup);
      setTimeout(() => {
        const current = document.getElementById('printPdfRoot');
        if (current) current.remove();
      }, 250);
    };
    window.addEventListener('afterprint', cleanup);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => window.print());
    });
  }

  // Pull every @font-face block out of the inlined PDF font CSS and register
  // each one with document.fonts via the FontFace API. This guarantees the
  // browser has the font in its loaded-font cache before the SVG rasterizer
  // picks it up — covers the case where the foreignObject `<style>` block is
  // not honored by the SVG-as-image path (Chromium behavior varies).
  async function registerInlinedFontFaces(fontCss) {
    if (!fontCss || !document.fonts || typeof FontFace === 'undefined') return;
    // /m flag so ^ matches each @font-face block start.
    const blockRe = /@font-face\s*\{([^}]*)\}/g;
    const matches = [];
    let m;
    while ((m = blockRe.exec(fontCss)) !== null) matches.push(m[1]);
    if (!matches.length) return;
    function getProp(body, prop) {
      const re = new RegExp(prop + '\\s*:\\s*([^;]+)', 'i');
      const r = body.match(re);
      return r ? r[1].trim() : '';
    }
    const tasks = matches.map(async body => {
      const familyRaw = getProp(body, 'font-family');
      if (!familyRaw) return;
      const family = familyRaw.replace(/^['"]|['"]$/g, '');
      const srcRaw = getProp(body, 'src');
      if (!srcRaw) return;
      const descriptors = {
        weight: getProp(body, 'font-weight') || 'normal',
        style: getProp(body, 'font-style') || 'normal',
        stretch: getProp(body, 'font-stretch') || 'normal',
        display: 'block',
      };
      const unicodeRange = getProp(body, 'unicode-range');
      if (unicodeRange) descriptors.unicodeRange = unicodeRange;
      try {
        const face = new FontFace(family, srcRaw, descriptors);
        await face.load();
        document.fonts.add(face);
      } catch (e) {
        // Some src strings have multiple entries; if FontFace can't parse one
        // it'll throw. Best-effort — don't fail the whole export.
      }
    });
    await Promise.all(tasks);
    if (document.fonts.ready) {
      try { await document.fonts.ready; } catch (_) {}
    }
  }

  // Force-load every (font-family, weight, size) combo used by the visible
  // text elements so the upcoming render path doesn't fall back to the system
  // sans (which has wider glyphs and causes overlap/cut-off in the output).
  async function preloadTextFontsFor(slides) {
    ensureSlideFontsLoaded(slides);
    if (document.fonts && document.fonts.ready) {
      try { await document.fonts.ready; } catch (_) {}
    }
    if (document.fonts && document.fonts.load) {
      const specs = new Set();
      slides.forEach(slide => {
        (slide.elements || []).forEach(el => {
          if (!el || el.type !== 'text' || el.hidden) return;
          const family = resolveFontFamily(el.font);
          const size = (el.fontSize || 24) + 'px';
          const weight = el.fontWeight || 400;
          const style = (el.fontStyle || 'normal') === 'italic' ? 'italic' : 'normal';
          specs.add(style + ' ' + weight + ' ' + size + ' ' + family);
        });
      });
      try {
        await Promise.all(Array.from(specs).map(spec =>
          document.fonts.load(spec).catch(() => null)
        ));
      } catch (_) {}
    }
  }

  // PDF export uses the browser's print engine. It's the only path that
  // preserves text as searchable/selectable text in the output, with correct
  // webfont rendering, Korean shaping, letter-spacing, and pre-wrap line
  // wrapping — Chrome layouts the print medium with the same engine that lays
  // out the editor canvas, so the PDF is pixel-equivalent to what the user
  // sees. The trade-off is a one-time print dialog where the user picks
  // "Save as PDF". The underlying CSS fixes (font preload, <br> preservation,
  // animation disable) ensure the print output isn't shifted mid-keyframe or
  // missing line breaks.
  async function exportPdfFile() {
    if (!state.slides.length) { alert('No slides to export.'); return; }
    const slidesToExport = getVisibleSlides();
    try {
      await preloadTextFontsFor(slidesToExport);
      // Re-fit text now that fonts are loaded so each box matches its actual
      // rendered glyphs — covers projects where the box was sized against the
      // system fallback before the webfont arrived.
      state.slides.forEach(slide => {
        (slide.elements || []).forEach(el => {
          if (el && el.type === 'text' && !el.hidden) autoSizeTextElement(el);
        });
      });
      printPdfFromDom(slidesToExport);
      // Wait once more so any subset glyphs lazy-fetched by the print DOM are
      // ready when the user confirms in the dialog.
      if (document.fonts && document.fonts.ready) {
        try { await document.fonts.ready; } catch (_) {}
      }
    } catch (e) {
      console.error(e);
      alert('Could not prepare PDF export. Try again after fonts finish loading.');
    }
  }

  async function exportPptxFile() {
    if (!state.slides.length) { alert('No slides to export.'); return; }
    const slidesToExport = getVisibleSlides();
    let handle = null;
    if (typeof window.showSaveFilePicker === 'function') {
      try {
        handle = await window.showSaveFilePicker({
          suggestedName: 'presentation.pptx',
          types: [{
            description: 'PowerPoint presentation',
            accept: { 'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'] },
          }],
        });
      } catch (e) {
        if (e && e.name === 'AbortError') return;
        console.warn('PPTX save picker failed, falling back to download.', e);
      }
    }
    try {
      ensureSlideFontsLoaded(slidesToExport);
      if (document.fonts && document.fonts.ready) {
        try { await document.fonts.ready; } catch (_) {}
      }
      const pages = [];
      for (const slide of slidesToExport) {
        const bgSlide = Object.assign({}, slide, {
          elements: (slide.elements || []).map(el => el && el.type === 'text' ? Object.assign({}, el, { hidden: true }) : el),
        });
        try {
          pages.push(await renderSlideToJpeg(bgSlide));
        } catch (e) {
          console.warn('Falling back for PPTX slide render.', e);
          pages.push(await renderSlideToCanvasJpeg(bgSlide));
        }
      }
      const pptx = buildPptxFromJpegs(pages, state.canvasW, state.canvasH, slidesToExport);
      if (handle) {
        const writable = await handle.createWritable();
        await writable.write(pptx);
        await writable.close();
      } else {
        downloadBlobFile('presentation.pptx', pptx);
      }
    } catch (e) {
      console.error(e);
      alert('Could not export PPTX. Try removing unsupported media or very large images, then export again.');
    }
  }

  function closeExportMenu() {
    const menu = document.getElementById('exportMenu');
    if (menu) menu.hidden = true;
  }

  function toggleExportMenu(e) {
    e.stopPropagation();
    const menu = document.getElementById('exportMenu');
    if (!menu) return;
    menu.hidden = !menu.hidden;
  }

  let previewWindow = null;
  async function previewExport() {
    if (!state.slides.length) { alert('No slides to preview.'); return; }
    const html = await buildExportHtml();
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    if (previewWindow && !previewWindow.closed) {
      previewWindow.location.replace(url);
      previewWindow.focus();
    } else {
      previewWindow = window.open(url, 'pres-preview');
      if (!previewWindow) {
        alert('Popup was blocked. Please allow popups and try Preview again.');
        URL.revokeObjectURL(url);
        return;
      }
    }
    setTimeout(() => URL.revokeObjectURL(url), 60000);
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
      if (mime === 'image/svg+xml' || /\.svg$/.test(name)) {
        const text = await readFileAsText(file);
        return insertSvgText(text);
      }
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
        if (!ok) alert('Could not find a URL in this file.');
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
      if (!ok) alert('Unsupported file format.');
    } catch (e) {
      alert('Could not load file: ' + (e && e.message ? e.message : 'unknown error'));
    }
  }

  function loadProjectFromHtml(text) {
    const m = text.match(/<script id="data" type="application\/json">([\s\S]*?)<\/script>/);
    if (!m) throw new Error('Could not find embedded slide data.');
    applyLoadedData(JSON.parse(m[1]));
  }
  function loadProjectFromJson(text) {
    const parsed = JSON.parse(text);
    applyLoadedData(parsed);
  }
  function applyLoadedData(parsed) {
    let slides;
    let currentSlideId = null;
    if (Array.isArray(parsed)) {
      slides = parsed;
      currentProjectLibraryId = null;
    } else if (parsed && typeof parsed === 'object') {
      slides = parsed.slides;
      currentProjectLibraryId = typeof parsed.projectId === 'string' ? parsed.projectId : null;
      if (typeof parsed.canvasW === 'number' && parsed.canvasW > 0) state.canvasW = parsed.canvasW;
      if (typeof parsed.canvasH === 'number' && parsed.canvasH > 0) state.canvasH = parsed.canvasH;
      if (typeof parsed.currentSlideId === 'string') currentSlideId = parsed.currentSlideId;
      if (parsed.grid && typeof parsed.grid === 'object') {
        state.grid = Object.assign({}, DEFAULT_GRID, parsed.grid);
      }
      if (parsed.guides && typeof parsed.guides === 'object') {
        state.guides = Object.assign({}, DEFAULT_GUIDES, parsed.guides, {
          items: Array.isArray(parsed.guides.items) ? parsed.guides.items : [],
        });
      }
      if (parsed.zoom === null || typeof parsed.zoom === 'number') state.zoom = parsed.zoom;
    }
    if (!Array.isArray(slides)) throw new Error('Invalid slide data');
    applyCanvasSize();
    ensureSlideFontsLoaded(slides);
    applyLoadedSlides(slides, { currentSlideId });
  }
  function applyLoadedSlides(slides, opts) {
    opts = opts || {};
    recordHistory();
    state.slides = slides;
    state.currentSlideId = opts.currentSlideId && slides.some(s => s.id === opts.currentSlideId)
      ? opts.currentSlideId
      : (slides.length ? slides[0].id : null);
    state.selectedElementId = null;
    state.slides.forEach(s => {
      normalizeSlideFields(s);
      (s.elements || []).forEach(el => {
        if (typeof el.link !== 'string') el.link = '';
        if (typeof el.hoverStrength !== 'number') el.hoverStrength = 1;
        if (typeof el.motionStrength !== 'number') el.motionStrength = 1;
        if (typeof el.blinkDuration !== 'number' || !(el.blinkDuration > 0)) el.blinkDuration = 1;
        if (typeof el.motionFromX !== 'number') el.motionFromX = 0;
        if (typeof el.motionFromY !== 'number') el.motionFromY = 0;
        if (el.motionDuration != null && (typeof el.motionDuration !== 'number' || !(el.motionDuration > 0))) el.motionDuration = null;
        if (typeof el.opacity !== 'number') el.opacity = 1;
        if (typeof el.locked !== 'boolean') el.locked = false;
        if (typeof el.hidden !== 'boolean') el.hidden = false;
        if (el.stroke !== null && typeof el.stroke !== 'object') el.stroke = null;
        if (el.stroke && typeof el.stroke.opacity !== 'number') el.stroke.opacity = 1;
        if (el.shadow !== null && typeof el.shadow !== 'object') el.shadow = null;
        if ((el.type === 'rect' || el.type === 'circle') && typeof el.fillEnabled !== 'boolean') el.fillEnabled = true;
        if (el.type === 'text') {
          if (typeof el.letterSpacing !== 'number') el.letterSpacing = 0;
          if (typeof el.fontStretch !== 'number') el.fontStretch = 100;
          if (typeof el.fontStyle !== 'string') el.fontStyle = 'normal';
          if (typeof el.bg !== 'string') el.bg = '';
          if (typeof el.lineHeight !== 'number') el.lineHeight = 1.3;
          if (typeof el.verticalAlign !== 'string') el.verticalAlign = 'center';
          if (typeof el.underline !== 'boolean') el.underline = false;
          if (typeof el.underlineOffset !== 'number') el.underlineOffset = 3;
          if (typeof el.strikethrough !== 'boolean') el.strikethrough = false;
          if (typeof el.textCase !== 'string') el.textCase = 'none';
          if (typeof el.paragraphSpacing !== 'number') el.paragraphSpacing = 0;
          if (typeof el.html !== 'string' || !el.html) el.html = escapeHtml(el.text || '');
          else el.html = sanitizeTextHtml(el.html);
          // Clamp out-of-range typography values that may have leaked in via
          // unbounded number-input typing (e.g. fontWeight: 7400 or 0).
          if (typeof el.fontWeight !== 'number') el.fontWeight = 400;
          el.fontWeight = clampTypographyValue('fontWeight', el.fontWeight);
          el.fontSize = clampTypographyValue('fontSize', el.fontSize || 32);
          el.letterSpacing = clampTypographyValue('letterSpacing', el.letterSpacing);
          el.fontStretch = clampTypographyValue('fontStretch', el.fontStretch);
          el.lineHeight = clampTypographyValue('lineHeight', el.lineHeight);
          el.paragraphSpacing = clampTypographyValue('paragraphSpacing', el.paragraphSpacing);
          // Only auto-fit when dimensions are missing (legacy data without
          // saved w/h). For projects that already carry valid box sizes,
          // trust them — re-measuring against partially-loaded fonts on
          // every load would let positions drift over time.
          if (!(el.w > 0) || !(el.h > 0)) autoSizeTextElement(el);
        }
        if (el.type === 'rect' && typeof el.radius !== 'number') el.radius = 4;
        if (el.type === 'image' || el.type === 'vector' || el.type === 'video' || el.type === 'imageBanner') {
          if (typeof el.radius !== 'number') el.radius = 0;
          if (typeof el.cropX !== 'number') el.cropX = 0;
          if (typeof el.cropY !== 'number') el.cropY = 0;
          if (typeof el.cropZoom !== 'number') el.cropZoom = 1;
          if (typeof el.cropApplied !== 'boolean') el.cropApplied = false;
          if (typeof el.aspectLocked !== 'boolean') el.aspectLocked = el.type === 'vector' ? true : false;
          if (typeof el.aspectRatio !== 'number') el.aspectRatio = null;
          if (el.type === 'vector') {
            if (typeof el.svg !== 'string') el.svg = '';
            if (!el.src && el.svg) el.src = svgToDataUrl(el.svg);
          }
          el.cropX = Math.max(-100, Math.min(100, el.cropX));
          el.cropY = Math.max(-100, Math.min(100, el.cropY));
          el.cropZoom = Math.max(1, Math.min(6, el.cropZoom));
        }
        if (el.type === 'imageBanner') {
          if (!Array.isArray(el.images)) el.images = [];
          if (typeof el.fit !== 'string') el.fit = 'cover';
          if (typeof el.transition !== 'string') el.transition = 'fade';
          if (typeof el.interval !== 'number') el.interval = 2800;
          if (typeof el.fadeMs !== 'number') el.fadeMs = 350;
          el.interval = Math.max(2000, Math.min(4500, Math.round(el.interval)));
          el.fadeMs = Math.max(100, Math.min(800, Math.round(el.fadeMs)));
        }
        if (el.type === 'video' && typeof el.poster !== 'string') el.poster = '';
        if (el.type === 'linkcard') {
          if (typeof el.title !== 'string') el.title = '';
          if (typeof el.description !== 'string') el.description = '';
          if (typeof el.image !== 'string') el.image = '';
          if (typeof el.domain !== 'string') el.domain = extractDomain(el.link || '');
        }
        if (el.font && GOOGLE_FONT_SET.has(el.font)) loadGoogleFont(el.font);
        if (el.font && WEBFONT_SET.has(el.font)) loadWebfont(el.font);
      });
    });
    renderAll();
  }

  // ---------- Present mode ----------
  let presentIndex = 0;
  let presentAnimating = false;
  let presentSlides = [];

  function enterPresent() {
    if (!state.slides.length) return;
    presentSlides = getVisibleSlides();
    presentIndex = Math.max(0, presentSlides.findIndex(s => s.id === state.currentSlideId));
    if (presentIndex < 0) presentIndex = 0;
    els.presentOverlay.hidden = false;
    requestAnimationFrame(renderPresent);
    renderPresentNav();
    document.addEventListener('keydown', onPresentKey);
    els.presentOverlay.addEventListener('wheel', onPresentWheel, { passive: false });
  }

  function exitPresent() {
    els.presentOverlay.hidden = true;
    document.removeEventListener('keydown', onPresentKey);
    els.presentOverlay.removeEventListener('wheel', onPresentWheel);
    presentAnimating = false;
    presentSlides = [];
  }

  function nextPresent() {
    transitionPresentTo(presentIndex < presentSlides.length - 1 ? presentIndex + 1 : 0, 1);
  }
  function prevPresent() {
    transitionPresentTo(presentIndex > 0 ? presentIndex - 1 : presentSlides.length - 1, -1);
  }

  function slideNavTitle(slide, index) {
    const firstText = slide && (slide.elements || []).find(el => el.type === 'text' && (el.text || '').trim());
    if (firstText) return (firstText.text || '').replace(/\s+/g, ' ').trim().slice(0, 36);
    return 'Slide ' + (index + 1);
  }

  function renderPresentNav() {
    if (!els.presentNav) return;
    els.presentNav.innerHTML = '';
    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'present-nav-close';
    close.textContent = 'x';
    close.title = 'Close';
    close.addEventListener('click', (e) => {
      e.stopPropagation();
      els.presentNav.classList.remove('open');
      if (els.presentNavToggle) els.presentNavToggle.classList.remove('active');
    });
    els.presentNav.appendChild(close);
    const handle = document.createElement('div');
    handle.className = 'present-nav-handle';
    els.presentNav.appendChild(handle);
    presentSlides.forEach((slide, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'present-nav-item' + (i === presentIndex ? ' active' : '');
      btn.appendChild(buildPresentNavThumb(slide));
      const meta = document.createElement('div');
      meta.className = 'present-nav-meta';
      meta.innerHTML = '<span class="present-nav-index"></span><span class="present-nav-title"></span>';
      meta.querySelector('.present-nav-index').textContent = String(i + 1).padStart(2, '0');
      meta.querySelector('.present-nav-title').textContent = slideNavTitle(slide, i);
      btn.appendChild(meta);
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        transitionPresentTo(i, i > presentIndex ? 1 : -1);
      });
      els.presentNav.appendChild(btn);
    });
  }

  function buildPresentNavThumb(slide) {
    const thumb = document.createElement('div');
    thumb.className = 'present-nav-thumb';
    const inner = document.createElement('div');
    inner.className = 'present-nav-thumb-inner';
    inner.style.backgroundColor = slide.bg || '#000000';
    if (slide.bgImage) {
      inner.style.backgroundImage = 'url("' + slide.bgImage + '")';
      inner.style.backgroundSize = 'cover';
      inner.style.backgroundPosition = 'center';
    }
    (slide.elements || []).forEach(el => {
      if (!el.hidden) inner.appendChild(buildElementNode(el, true));
    });
    thumb.appendChild(inner);
    requestAnimationFrame(() => {
      inner.style.transform = 'scale(' + (thumb.clientWidth / state.canvasW) + ')';
    });
    return thumb;
  }

  function onPresentKey(e) {
    if (e.key === 'Escape') { exitPresent(); }
    else if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
      e.preventDefault(); nextPresent();
    } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
      e.preventDefault(); prevPresent();
    }
  }

  function onPresentWheel(e) {
    if (presentAnimating) return;
    if (Math.abs(e.deltaY) < 24) return;
    e.preventDefault();
    if (e.deltaY > 0) nextPresent();
    else prevPresent();
  }

  function slideTransitionName(slide) {
    return (slide && slide.transition) || 'none';
  }

  function slideTransitionDuration(slide) {
    return Math.max(150, Math.min(2000, (slide && slide.transitionMs) || 650));
  }

  function applySlideFrameTransition(oldFrame, newFrame, effect, dir, ms) {
    const ease = effect === 'scrollVertical' ? 'cubic-bezier(.18,.72,.16,1)' : 'cubic-bezier(.2,.8,.2,1)';
    [oldFrame, newFrame].forEach(frame => {
      if (!frame) return;
      frame.style.transition = 'transform ' + ms + 'ms ' + ease + ', opacity ' + ms + 'ms ease';
      frame.style.willChange = 'transform, opacity';
    });

    if (effect === 'fade') {
      oldFrame.style.opacity = '1';
      newFrame.style.opacity = '0';
      newFrame.style.transform = 'translate(0, 0) scale(1)';
      requestAnimationFrame(() => {
        oldFrame.style.opacity = '0';
        newFrame.style.opacity = '1';
      });
      return;
    }

    if (effect === 'slideHorizontal') {
      newFrame.style.transform = 'translateX(' + (dir > 0 ? 100 : -100) + '%)';
      requestAnimationFrame(() => {
        oldFrame.style.transform = 'translateX(' + (dir > 0 ? -100 : 100) + '%)';
        newFrame.style.transform = 'translateX(0)';
      });
      return;
    }

    if (effect === 'scrollVertical') {
      const offset = dir > 0 ? 100 : -100;
      newFrame.style.transform = 'translateY(' + offset + '%)';
      requestAnimationFrame(() => {
        oldFrame.style.transform = 'translateY(' + (-offset) + '%)';
        newFrame.style.transform = 'translateY(0)';
      });
      return;
    }

    if (effect === 'zoom') {
      oldFrame.style.transform = 'scale(1)';
      newFrame.style.transform = 'scale(' + (dir > 0 ? 1.08 : 0.94) + ')';
      newFrame.style.opacity = '0';
      requestAnimationFrame(() => {
        oldFrame.style.transform = 'scale(' + (dir > 0 ? 0.94 : 1.08) + ')';
        oldFrame.style.opacity = '0';
        newFrame.style.transform = 'scale(1)';
        newFrame.style.opacity = '1';
      });
    }
  }

  function transitionPresentTo(nextIndex, dir) {
    if (presentAnimating || nextIndex === presentIndex || nextIndex < 0 || nextIndex >= presentSlides.length) return;
    const prevIndex = presentIndex;
    const oldSlide = presentSlides[prevIndex];
    const newSlide = presentSlides[nextIndex];
    const effect = slideTransitionName(newSlide);
    const ms = slideTransitionDuration(newSlide);
    presentIndex = nextIndex;
    if (effect === 'none') {
      renderPresent();
      return;
    }
    const stage = els.presentStage;
    stage.innerHTML = '';
    const oldFrame = buildPresentSlideFrame(oldSlide, false);
    const newFrame = buildPresentSlideFrame(newSlide, true);
    oldFrame.classList.add('present-slide-frame', 'is-exiting');
    newFrame.classList.add('present-slide-frame', 'is-entering');
    stage.appendChild(oldFrame);
    stage.appendChild(newFrame);
    els.presentCounter.textContent = (presentIndex + 1) + ' / ' + presentSlides.length;
    renderPresentNav();
    presentAnimating = true;
    applySlideFrameTransition(oldFrame, newFrame, effect, dir || 1, ms);
    setTimeout(() => {
      presentAnimating = false;
      renderPresent();
    }, ms + 40);
  }

  function renderPresent() {
    if (!presentSlides.length) presentSlides = getVisibleSlides();
    const slide = presentSlides[presentIndex];
    if (!slide) return;
    const stage = els.presentStage;
    stage.innerHTML = '';
    stage.appendChild(buildPresentSlideFrame(slide, true));
    els.presentCounter.textContent = (presentIndex + 1) + ' / ' + presentSlides.length;
    renderPresentNav();
  }

  function buildPresentSlideFrame(slide, animateElements) {
    const stage = els.presentStage;
    const sw = stage.clientWidth;
    const sh = stage.clientHeight;
    const scale = Math.min(sw / state.canvasW, sh / state.canvasH);

    const frame = document.createElement('div');
    frame.className = 'present-slide-frame';
    frame.style.backgroundColor = slide.bg;
    frame.style.backgroundImage = slide.bgImage ? 'url("' + slide.bgImage + '")' : '';
    frame.style.backgroundSize = 'cover';
    frame.style.backgroundPosition = 'center';

    const inner = document.createElement('div');
    inner.style.position = 'absolute';
    inner.style.left = '50%';
    inner.style.top = '50%';
    inner.style.width = state.canvasW + 'px';
    inner.style.height = state.canvasH + 'px';
    inner.style.transform = 'translate(-50%, -50%) scale(' + scale + ')';
    inner.style.transformOrigin = 'center center';

    // Pre-compute, per group:
    //   - the shared hover/motion effect (any one member's setting applies to
    //     every member, so a text-only hover-scale also scales the backing
    //     rect that's grouped with it)
    //   - the group's bounding-box center, so each member's transform-origin
    //     can be pinned to that shared point. Same scale value at the same
    //     anchor → the group expands and contracts as one solid block.
    const groupHover = {};
    const groupMotion = {};
    const groupBBox = {};
    slide.elements.forEach(el => {
      if (!el.groupId || el.hidden) return;
      if (el.hover && el.hover !== 'none' && !groupHover[el.groupId]) groupHover[el.groupId] = el.hover;
      if (el.motion && el.motion !== 'none' && !groupMotion[el.groupId]) groupMotion[el.groupId] = el.motion;
      if (!groupBBox[el.groupId]) groupBBox[el.groupId] = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
      const bb = groupBBox[el.groupId];
      bb.minX = Math.min(bb.minX, el.x);
      bb.minY = Math.min(bb.minY, el.y);
      bb.maxX = Math.max(bb.maxX, el.x + el.w);
      bb.maxY = Math.max(bb.maxY, el.y + el.h);
    });

    slide.elements.forEach((el, i) => {
      if (el.hidden) return;
      const node = buildPresentElementNode(el);
      const effectiveMotion = (el.motion && el.motion !== 'none')
        ? el.motion
        : (el.groupId && groupMotion[el.groupId]) || null;
      if (animateElements && effectiveMotion) {
        node.classList.add(effectiveMotion);
        node.style.animationDelay = (i * 0.08) + 's';
      }
      const effectiveHover = (el.hover && el.hover !== 'none')
        ? el.hover
        : (el.groupId && groupHover[el.groupId]) || null;
      if (effectiveHover) node.classList.add(effectiveHover);
      if (el.groupId) {
        node.setAttribute('data-group-id', el.groupId);
        // Pin transform-origin to the GROUP's bounding-box center (in the
        // element's local px coords). With every group member sharing the
        // same world-space anchor, scale/translate transforms keep them
        // locked together as one block.
        const bb = groupBBox[el.groupId];
        if (bb) {
          const cx = (bb.minX + bb.maxX) / 2;
          const cy = (bb.minY + bb.maxY) / 2;
          node.style.transformOrigin = (cx - el.x) + 'px ' + (cy - el.y) + 'px';
        }
        node.addEventListener('mouseenter', () => {
          const peers = inner.querySelectorAll('[data-group-id="' + CSS.escape(el.groupId) + '"]');
          peers.forEach(n => n.classList.add('group-hover'));
        });
        node.addEventListener('mouseleave', () => {
          const peers = inner.querySelectorAll('[data-group-id="' + CSS.escape(el.groupId) + '"]');
          peers.forEach(n => n.classList.remove('group-hover'));
        });
      }
      inner.appendChild(node);
    });
    frame.appendChild(inner);
    return frame;
  }

  function buildPresentElementNode(el) {
    const node = document.createElement('div');
    node.className = 'el ' + elTypeClass(el.type);
    node.style.left = el.x + 'px';
    node.style.top = el.y + 'px';
    node.style.width = el.w + 'px';
    node.style.height = el.h + 'px';
    node.style.setProperty('--hover-strength', String(el.hoverStrength != null ? el.hoverStrength : 1));
    node.style.setProperty('--motion-strength', String(el.motionStrength != null ? el.motionStrength : 1));
    if (el.motion === 'anim-blink') {
      node.style.setProperty('--blink-duration', (el.blinkDuration != null ? el.blinkDuration : 1) + 's');
    }
    {
      const ms = el.motionStrength != null ? el.motionStrength : 1;
      const cw = state.canvasW;
      const ch = state.canvasH;
      if (el.motion === 'anim-fly-from-left') {
        node.style.setProperty('--fly-from-x', (-(el.x + el.w + 20) * ms) + 'px');
      } else if (el.motion === 'anim-fly-from-right') {
        node.style.setProperty('--fly-from-x', ((cw - el.x + 20) * ms) + 'px');
      } else if (el.motion === 'anim-fly-from-top') {
        node.style.setProperty('--fly-from-y', (-(el.y + el.h + 20) * ms) + 'px');
      } else if (el.motion === 'anim-fly-from-bottom') {
        node.style.setProperty('--fly-from-y', ((ch - el.y + 20) * ms) + 'px');
      } else if (el.motion === 'anim-custom') {
        node.style.setProperty('--motion-from-x', (el.motionFromX || 0) + 'px');
        node.style.setProperty('--motion-from-y', (el.motionFromY || 0) + 'px');
      }
      if (el.motion && el.motion !== 'none' && el.motion !== 'anim-blink' && typeof el.motionDuration === 'number' && el.motionDuration > 0) {
        node.style.setProperty('--motion-duration', el.motionDuration + 's');
      }
    }
    if (el.rotation) node.style.setProperty('--rotation', el.rotation + 'deg');
    if (el.opacity != null && el.opacity < 1) node.style.opacity = String(el.opacity);
    if (el.type === 'text') {
      node.style.fontFamily = resolveFontFamily(el.font);
      node.style.fontSize = el.fontSize + 'px';
      node.style.fontWeight = String(el.fontWeight);
      node.style.fontStyle = el.fontStyle || 'normal';
      node.style.fontSynthesis = 'none';
      node.style.letterSpacing = (el.letterSpacing || 0) + 'px';
      node.style.fontStretch = (el.fontStretch || 100) + '%';
      node.style.lineHeight = String(el.lineHeight != null ? el.lineHeight : 1.3);
      node.style.color = el.color;
      if (el.bg) node.style.background = el.bg;
      node.style.textAlign = el.align;
      node.style.display = 'flex';
      const VALIGN = { top: 'flex-start', center: 'center', bottom: 'flex-end' };
      node.style.alignItems = VALIGN[el.verticalAlign || 'center'] || 'center';
      if (el.textCase && el.textCase !== 'none') node.style.textTransform = el.textCase;

      const inner = document.createElement('div');
      inner.style.width = '100%';
      inner.style.whiteSpace = 'pre-wrap';
      inner.style.wordBreak = 'break-word';
      // line-height also on inner as a defensive measure
      inner.style.lineHeight = String(el.lineHeight != null ? el.lineHeight : 1.3);
      inner.style.textTransform = el.textCase && el.textCase !== 'none' ? el.textCase : '';
      // Text decoration must be on the actual text-bearing element. CSS
      // decorations don't paint across block-level descendants of a flex
      // container.
      const decos = [];
      if (el.underline) decos.push('underline');
      if (el.strikethrough) decos.push('line-through');
      if (decos.length) inner.style.textDecoration = decos.join(' ');
      if (el.underline) {
        inner.style.textUnderlineOffset = (el.underlineOffset != null ? el.underlineOffset : 3) + 'px';
      }
      // Width axis: font-stretch (above) handles variable fonts; scaleX is a
      // visual fallback so the slider actually does something on every font.
      const stretch = (el.fontStretch || 100) / 100;
      if (stretch !== 1) {
        const ORIGIN = { left: 'left', center: 'center', right: 'right', justify: 'left' };
        inner.style.transformOrigin = (ORIGIN[el.align] || 'left') + ' center';
        inner.style.transform = 'scaleX(' + stretch + ')';
      }
      inner.innerHTML = el.html || escapeHtml(el.text || '');
      applyDefaultBrMargin(inner, el.paragraphSpacing || 0);
      node.appendChild(inner);
    } else if (el.type === 'image' || el.type === 'vector') {
      if (el.type === 'vector' && el.svg) {
        const vector = buildInlineVector(el);
        if (vector) {
          applyMediaCropStyle(vector, el);
          node.style.overflow = 'hidden';
          node.appendChild(vector);
        }
      }
      if (!node.firstChild) {
      const img = document.createElement('img');
      img.src = el.src || '';
      img.draggable = false;
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.objectFit = mediaFit(el);
      applyMediaCropStyle(img, el);
      img.style.display = 'block';
      img.style.borderRadius = (el.radius || 0) + 'px';
      node.style.overflow = 'hidden';
      node.appendChild(img);
      }
    } else if (el.type === 'imageBanner') {
      buildImageBannerChildren(node, el);
    } else if (el.type === 'video') {
      const v = document.createElement('video');
      v.style.width = '100%';
      v.style.height = '100%';
      v.style.objectFit = mediaFit(el);
      applyMediaCropStyle(v, el);
      v.style.display = 'block';
      v.style.borderRadius = (el.radius || 0) + 'px';
      node.style.overflow = 'hidden';
      v.playsInline = true;
      v.preload = 'auto';
      if (el.poster) v.poster = el.poster;
      v.muted = el.muted !== false;
      v.loop = el.loop !== false;
      if (el.controls) v.controls = true;
      if (el.autoplay !== false) {
        v.autoplay = true;
        v.muted = true;
        v.addEventListener('canplay', () => { v.play && v.play().catch(() => {}); }, { once: true });
      }
      v.src = el.src || '';
      node.appendChild(v);
    } else if (el.type === 'linkcard') {
      buildLinkcardChildren(node, el);
    } else {
      node.style.background = el.fill;
    }
    applyCornerStyle(node, el);
    if (el.stroke && el.stroke.width && el.type !== 'line') {
      if (el.type === 'text') {
        const inner = node.querySelector(':scope > div');
        if (inner) inner.style.webkitTextStroke = el.stroke.width + 'px ' + (el.stroke.color || '#fff');
      } else if (el.type === 'image' || el.type === 'vector' || el.type === 'video' || el.type === 'imageBanner') {
        node.style.boxShadow = (node.style.boxShadow ? node.style.boxShadow + ', ' : '') +
          'inset 0 0 0 ' + el.stroke.width + 'px ' + (el.stroke.color || '#fff');
      } else {
        node.style.border = strokeBorder(el.stroke);
        node.style.boxSizing = 'border-box';
      }
    }
    if (el.shadow) {
      if (el.type === 'text') {
        const inner = node.querySelector(':scope > div');
        if (inner) inner.style.textShadow = textShadowStr(el.shadow);
      } else if (el.type === 'image' || el.type === 'vector' || el.type === 'video' || el.type === 'imageBanner' || el.type === 'linkcard') {
        node.style.filter = (node.style.filter ? node.style.filter + ' ' : '') + dropShadowFilter(el.shadow);
      } else {
        node.style.boxShadow = (node.style.boxShadow ? node.style.boxShadow + ', ' : '') + boxShadowStr(el.shadow);
      }
    }
    if (el.link) {
      node.setAttribute('data-link', el.link);
      node.style.cursor = 'pointer';
      node.addEventListener('click', (e) => {
        e.stopPropagation();
        const u = el.link;
        if (u.indexOf('slide:') === 0) {
          const sid = u.slice(6);
          const i = state.slides.findIndex(s => s.id === sid);
          if (i >= 0) {
            transitionPresentTo(i, i > presentIndex ? 1 : -1);
          }
          return;
        }
        let url = u;
        if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(url)) url = 'https://' + url;
        window.open(url, '_blank', 'noopener');
      });
    }
    return node;
  }

  // ---------- Canvas fit ----------
  function updateCanvasScrollSpace(scale) {
    const wrap = document.getElementById('canvasWrap');
    const frame = document.getElementById('canvasFrame');
    if (!wrap || !frame) return;

    // Generous off-slide margin so elements positioned outside the slide are
    // still rendered, visible, and hit-testable. The canvas-wrap is overflow:
    // auto, so this margin participates in the scrollable area.
    const gap = 600;
    const scaledW = state.canvasW * scale;
    const scaledH = state.canvasH * scale;
    const xGap = Math.max(gap, Math.floor((wrap.clientWidth - scaledW) / 2));
    const yGap = Math.max(gap, Math.floor((wrap.clientHeight - scaledH) / 2));

    frame.style.margin = yGap + 'px ' + xGap + 'px';
  }

  // Position the wrap's scroll so the slide (not the surrounding off-slide
  // margin) sits centered in view. Required because the larger off-slide
  // margin pushes the slide away from the wrap's top-left default scroll.
  function centerCanvasScroll() {
    const wrap = document.getElementById('canvasWrap');
    const frame = document.getElementById('canvasFrame');
    if (!wrap || !frame) return;
    const cs = getComputedStyle(document.documentElement).getPropertyValue('--canvas-scale');
    const scale = parseFloat(cs) || 1;
    const slideCenterX = frame.offsetLeft + (state.canvasW * scale) / 2;
    const slideCenterY = frame.offsetTop + (state.canvasH * scale) / 2;
    wrap.scrollLeft = Math.max(0, Math.round(slideCenterX - wrap.clientWidth / 2));
    wrap.scrollTop = Math.max(0, Math.round(slideCenterY - wrap.clientHeight / 2));
  }

  function fitCanvas() {
    const wrap = document.getElementById('canvasWrap');
    if (!wrap) return;
    let scale;
    if (state.zoom != null) {
      // Manual zoom: clamp to a sane range so the user can't lose the canvas.
      scale = Math.max(0.1, Math.min(8, state.zoom));
    } else {
      const padding = 64;
      const sx = (wrap.clientWidth - padding) / state.canvasW;
      const sy = (wrap.clientHeight - padding) / state.canvasH;
      scale = Math.max(0.2, Math.min(1, sx, sy));
    }
    document.documentElement.style.setProperty('--canvas-scale', String(scale));
    updateCanvasScrollSpace(scale);
  }

  function setZoom(z) {
    recordHistory();
    state.zoom = z; // null = auto-fit; otherwise number
    fitCanvas();
    requestAnimationFrame(centerCanvasScroll);
    renderProperties();
    persist();
  }

  function zoomBy(factor, originEvent) {
    // Compute current effective scale, then multiply.
    let cur = state.zoom;
    if (cur == null) {
      const cs = getComputedStyle(document.documentElement).getPropertyValue('--canvas-scale');
      cur = parseFloat(cs) || 1;
    }
    const next = Math.max(0.1, Math.min(8, cur * factor));

    const wrap = document.getElementById('canvasWrap');
    const frame = document.getElementById('canvasFrame');
    const canvasRect = els.canvas && els.canvas.getBoundingClientRect();
    const wrapRect = wrap && wrap.getBoundingClientRect();
    let localX = null;
    let localY = null;
    if (originEvent && canvasRect && wrapRect && cur) {
      localX = (originEvent.clientX - canvasRect.left) / cur;
      localY = (originEvent.clientY - canvasRect.top) / cur;
    }

    setZoom(next);

    if (originEvent && wrap && frame && wrapRect && localX != null && localY != null) {
      const targetX = frame.offsetLeft + localX * next - (originEvent.clientX - wrapRect.left);
      const targetY = frame.offsetTop + localY * next - (originEvent.clientY - wrapRect.top);
      wrap.scrollLeft = Math.max(0, targetX);
      wrap.scrollTop = Math.max(0, targetY);
    }
  }

  // ---------- Init ----------
  async function init() {
    els.slidesList = document.getElementById('slidesList');
    els.slideCount = document.getElementById('slideCount');
    els.canvas = document.getElementById('canvas');
    els.selectionAlignToolbar = document.getElementById('selectionAlignToolbar');
    els.propertiesBody = document.getElementById('propertiesBody');
    els.presentOverlay = document.getElementById('presentOverlay');
    els.presentStage = document.getElementById('presentStage');
    els.presentCounter = document.getElementById('presentCounter');
    els.presentNav = document.getElementById('presentNav');
    els.presentNavToggle = document.getElementById('presentNavToggle');
    els.fileLoader = document.getElementById('fileLoader');
    els.projectLibraryOverlay = document.getElementById('projectLibraryOverlay');
    els.projectLibraryBody = document.getElementById('projectLibraryBody');
    els.projectScrollTop = document.getElementById('btnProjectScrollTop');

    document.getElementById('btnAddSlide').addEventListener('click', addSlide);
    document.getElementById('btnPresent').addEventListener('click', enterPresent);
    document.getElementById('btnPreview').addEventListener('click', previewExport);
    document.getElementById('btnProjects').addEventListener('click', openProjectLibrary);
    document.getElementById('btnCloseProjects').addEventListener('click', closeProjectLibrary);
    if (els.selectionAlignToolbar) {
      els.selectionAlignToolbar.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-align-selection]');
        const actionBtn = e.target.closest('[data-selection-action]');
        const distBtn = e.target.closest('[data-distribute]');
        if (!btn && !actionBtn && !distBtn) return;
        e.preventDefault();
        if (btn) {
          alignSelected(btn.dataset.alignSelection);
          return;
        }
        if (distBtn) {
          distributeSelected(distBtn.dataset.distribute);
          return;
        }
        if (actionBtn.dataset.selectionAction === 'group') groupSelected();
        if (actionBtn.dataset.selectionAction === 'ungroup') ungroupSelected();
      });
      const applyGapFromInput = (inp) => {
        const axis = inp.dataset.distributeGap;
        const raw = inp.value.trim();
        if (raw === '') { syncSelectionAlignToolbar(); return; }
        const v = Number(raw);
        if (!Number.isFinite(v)) { syncSelectionAlignToolbar(); return; }
        distributeSelected(axis, { gap: v });
      };
      els.selectionAlignToolbar.addEventListener('change', (e) => {
        const inp = e.target.closest('[data-distribute-gap]');
        if (!inp) return;
        applyGapFromInput(inp);
      });
      els.selectionAlignToolbar.addEventListener('keydown', (e) => {
        const inp = e.target.closest('[data-distribute-gap]');
        if (!inp) return;
        if (e.key === 'Enter') {
          e.preventDefault();
          applyGapFromInput(inp);
          inp.blur();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          inp.blur();
          syncSelectionAlignToolbar();
        }
      });
      // Mousedown on the toolbar shouldn't clear the canvas selection (clicking
      // an input would otherwise blur the canvas focus path and drop selection
      // on some platforms).
      els.selectionAlignToolbar.addEventListener('mousedown', (e) => {
        e.stopPropagation();
      });
    }
    if (els.projectLibraryOverlay) {
      els.projectLibraryOverlay.addEventListener('click', (e) => {
        if (e.target === els.projectLibraryOverlay) closeProjectLibrary();
      });
    }
    if (els.projectLibraryBody) {
      els.projectLibraryBody.addEventListener('scroll', updateProjectScrollTopButton, { passive: true });
    }
    if (els.projectScrollTop) {
      els.projectScrollTop.addEventListener('click', scrollProjectLibraryToTop);
    }
    document.getElementById('btnSaveProject').addEventListener('click', saveProjectFile);
    document.getElementById('btnExport').addEventListener('click', toggleExportMenu);
    document.getElementById('btnExportHtml').addEventListener('click', () => {
      closeExportMenu();
      saveToFile();
    });
    document.getElementById('btnExportPdf').addEventListener('click', () => {
      closeExportMenu();
      exportPdfFile();
    });
    document.getElementById('btnExportPptx').addEventListener('click', () => {
      closeExportMenu();
      exportPptxFile();
    });
    document.addEventListener('click', (e) => {
      const wrap = document.getElementById('exportWrap');
      if (wrap && !wrap.contains(e.target)) closeExportMenu();
    });
    document.getElementById('btnLoad').addEventListener('click', () => els.fileLoader.click());
    els.fileLoader.addEventListener('change', (e) => {
      if (e.target.files[0]) loadFromFile(e.target.files[0]);
      e.target.value = '';
    });
    document.getElementById('btnPrev').addEventListener('click', prevPresent);
    document.getElementById('btnNext').addEventListener('click', nextPresent);
    document.getElementById('btnExitPresent').addEventListener('click', exitPresent);
    if (els.presentNavToggle) {
      els.presentNavToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        els.presentNav.classList.toggle('open');
        els.presentNavToggle.classList.toggle('active', els.presentNav.classList.contains('open'));
      });
    }
    els.btnToggleGrid = document.getElementById('btnToggleGrid');
    if (els.btnToggleGrid) {
      els.btnToggleGrid.addEventListener('click', toggleGrid);
      syncGridToggleButton();
    }

    els.btnToggleGuides = document.getElementById('btnToggleGuides');
    if (els.btnToggleGuides) {
      els.btnToggleGuides.addEventListener('click', toggleGuides);
      syncGuidesToggleButton();
    }

    const canvasWrapEl = document.getElementById('canvasWrap');
    if (canvasWrapEl) {
      canvasWrapEl.addEventListener('wheel', (e) => {
        if (!e.ctrlKey && !e.metaKey) return;
        e.preventDefault();
        zoomBy(e.deltaY < 0 ? 1.1 : 0.9, e);
      }, { passive: false });
    }

    document.addEventListener('mousemove', onGuideDragMove);
    document.addEventListener('mouseup', onGuideDragEnd);

    document.querySelectorAll('[data-add]').forEach(b => {
      b.addEventListener('click', () => addElement(b.dataset.add));
    });

    const ceTextarea = document.getElementById('contentEditorText');
    if (ceTextarea) {
      ceTextarea.addEventListener('focus', () => scheduleCurrentSlideThumbFocus({ smooth: true }));
      ceTextarea.addEventListener('click', () => scheduleCurrentSlideThumbFocus({ smooth: true }));
      ceTextarea.addEventListener('input', () => {
        ceTextarea.dataset.userWritten = '1';
        scheduleCurrentSlideThumbFocus({ smooth: true });
        const el = getSelectedElement();
        if (!el || el.type !== 'text') return;
        const v = ceTextarea.value;
        updateElement(el.id, { text: v, html: escapeHtml(v) }, { skipPropsRender: true });
      });
    }
    const btnGenerateContent = document.getElementById('btnGenerateContent');
    if (btnGenerateContent) {
      btnGenerateContent.addEventListener('click', generateContentLayout);
    }

    // Listen on canvas-wrap (outermost) so the off-slide margin around the
    // canvas is also hit-testable / marquee-startable. Element nodes receive
    // their own mousedown deeper in the tree and bubble up to here; we only
    // act when the click landed on empty canvas chrome.
    const canvasFrameEl = document.getElementById('canvasFrame');
    const canvasWrapElForMd = document.getElementById('canvasWrap');
    (canvasWrapElForMd || els.canvas).addEventListener('mousedown', (e) => {
      // Clicking anywhere that's not a guide line should drop the active
      // guide selection so a follow-up Delete key doesn't surprise the user.
      if (!e.target.closest || !e.target.closest('.guide')) setActiveGuide(null);
      // Only treat clicks on bare canvas chrome (canvas, canvas-frame margin,
      // or the wrap's off-slide area) as empty clicks. Element clicks have a
      // deeper target and fall through here without matching.
      const t = e.target;
      const isEmptyArea = (t === els.canvas)
        || (t === canvasFrameEl)
        || (t === canvasWrapElForMd);
      if (!isEmptyArea) return;
      if (state.cropElementId) {
        applyCropMode();
        return;
      }
      const rect = els.canvas.getBoundingClientRect();
      const scale = rect.width / state.canvasW || 1;
      // Slide-space coordinates — can be negative or > canvasW when the user
      // clicks outside the slide boundary, which is intentional so off-slide
      // elements are still hit-testable.
      const sx = (e.clientX - rect.left) / scale;
      const sy = (e.clientY - rect.top) / scale;
      const hit = findSmallElementHitAt(sx, sy);
      if (hit) {
        if (state.editingElementId) state.editingElementId = null;
        if (e.shiftKey || e.ctrlKey || e.metaKey) {
          toggleElementSelectionOnly(hit.id);
          return;
        }
        if (!isSelected(hit.id)) selectElement(hit.id, false);
        beginDrag(e, hit.id);
        return;
      }
      if (state.editingElementId) {
        state.editingElementId = null;
        renderCanvas();
        renderProperties();
      } else if (!e.shiftKey) {
        deselectElement();
      }
      beginMarquee(e);
    });

    document.addEventListener('keydown', (e) => {
      if (!els.presentOverlay.hidden) return;
      if (els.projectLibraryOverlay && !els.projectLibraryOverlay.hidden) {
        if (e.key === 'Escape') {
          e.preventDefault();
          closeProjectLibrary();
        }
        return;
      }
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if ((e.ctrlKey || e.metaKey) && !e.altKey && e.key.toLowerCase() === 'b') {
        if (toggleSelectedTextWeight()) {
          e.preventDefault();
          return;
        }
      }
      if ((e.ctrlKey || e.metaKey) && !e.altKey && e.key.toLowerCase() === 'i') {
        if (toggleSelectedTextItalic()) {
          e.preventDefault();
          return;
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && !e.altKey) {
        const k = e.key;
        let handled = false;
        if (k === '.' || k === '>') handled = adjustSelectedTextTypography('fontSize', 1);
        else if (k === ',' || k === '<') handled = adjustSelectedTextTypography('fontSize', -1);
        if (handled) {
          e.preventDefault();
          return;
        }
      }
      if (e.altKey && !e.ctrlKey && !e.metaKey) {
        const k = e.key;
        let handled = false;
        if (k === 'ArrowRight') handled = adjustSelectedTextTypography('letterSpacing', e.shiftKey ? 1 : 0.1);
        else if (k === 'ArrowLeft') handled = adjustSelectedTextTypography('letterSpacing', e.shiftKey ? -1 : -0.1);
        else if (k === 'ArrowUp') handled = adjustSelectedTextTypography(e.shiftKey ? 'paragraphSpacing' : 'lineHeight', e.shiftKey ? 1 : 0.01);
        else if (k === 'ArrowDown') handled = adjustSelectedTextTypography(e.shiftKey ? 'paragraphSpacing' : 'lineHeight', e.shiftKey ? -1 : -0.01);
        if (handled) {
          e.preventDefault();
          return;
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.altKey) {
        const k = e.key;
        let handled = false;
        if (k === '.' || k === '>') handled = adjustSelectedTextTypography('fontSize', e.shiftKey ? 2 : 1);
        else if (k === ',' || k === '<') handled = adjustSelectedTextTypography('fontSize', e.shiftKey ? -2 : -1);
        else if (k === 'ArrowRight') handled = adjustSelectedTextTypography('letterSpacing', e.shiftKey ? 1 : 0.1);
        else if (k === 'ArrowLeft') handled = adjustSelectedTextTypography('letterSpacing', e.shiftKey ? -1 : -0.1);
        else if (k === 'ArrowUp') handled = adjustSelectedTextTypography(e.shiftKey ? 'paragraphSpacing' : 'lineHeight', e.shiftKey ? 1 : 0.01);
        else if (k === 'ArrowDown') handled = adjustSelectedTextTypography(e.shiftKey ? 'paragraphSpacing' : 'lineHeight', e.shiftKey ? -1 : -0.01);
        else if (k === ']' || k === '}') handled = adjustSelectedTextTypography('fontWeight', e.shiftKey ? 100 : 10);
        else if (k === '[' || k === '{') handled = adjustSelectedTextTypography('fontWeight', e.shiftKey ? -100 : -10);
        else if (k === '=' || k === '+') handled = adjustSelectedTextTypography('fontStretch', e.shiftKey ? 10 : 1);
        else if (k === '-' || k === '_') handled = adjustSelectedTextTypography('fontStretch', e.shiftKey ? -10 : -1);
        if (handled) {
          e.preventDefault();
          return;
        }
      }
      // Shift + Left/Right → font size ±1. Ctrl(/Cmd) + Shift + Left/Right →
      // font size ±10 (larger step). Both run BEFORE the contentEditable
      // early-return so a partial selection inside an editing text element
      // is wrapped via applyStyleToSelection. Fall through when no text
      // target is in play, so the existing arrow nudge / element-resize
      // shortcuts below still kick in for shape / image selections.
      if (e.shiftKey && !e.altKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
        const base = e.key === 'ArrowLeft' ? -1 : 1;
        const delta = (e.ctrlKey || e.metaKey) ? base * 10 : base;
        if (adjustSelectedTextTypography('fontSize', delta)) {
          e.preventDefault();
          return;
        }
      }
      if (e.target.isContentEditable) return;
      if (state.cropElementId) {
        if (e.key === 'Enter') {
          e.preventDefault();
          applyCropMode();
          return;
        }
        if (e.key === 'Escape') {
          e.preventDefault();
          cancelCropMode();
          return;
        }
      }
      if ((e.ctrlKey || e.metaKey) && !e.altKey) {
        const k = e.key.toLowerCase();
        if (k === 'n') {
          e.preventDefault();
          if (e.shiftKey) addSlide();
          else startNewProject();
          return;
        }
        if (k === 's') {
          e.preventDefault();
          saveProjectFile();
          return;
        }
        if (k === 'e') {
          e.preventDefault();
          saveToFile();
          return;
        }
        if (e.key === 'Enter') {
          e.preventDefault();
          previewExport();
          return;
        }
        if (k === '=' || k === '+') {
          e.preventDefault();
          zoomBy(1.1);
          return;
        }
        if (k === '-' || k === '_') {
          e.preventDefault();
          zoomBy(0.9);
          return;
        }
        if (k === '0') {
          e.preventDefault();
          setZoom(null);
          return;
        }
        if (k === '1') {
          e.preventDefault();
          setZoom(1);
          return;
        }
        if (e.shiftKey && k === 'l' && state.selectedElementId) {
          e.preventDefault();
          toggleSelectedFlag('locked');
          return;
        }
        if (e.shiftKey && k === 'h' && state.selectedElementId) {
          e.preventDefault();
          toggleSelectedFlag('hidden');
          return;
        }
      }
      if (e.altKey && !e.ctrlKey && !e.metaKey && state.selectedElementId) {
        const k = e.key.toLowerCase();
        const alignMap = {
          a: 'left',
          d: 'right',
          w: 'top',
          s: 'bottom',
          h: 'center',
          v: 'middle',
        };
        if (alignMap[k]) {
          e.preventDefault();
          alignSelectedSmart(alignMap[k]);
          return;
        }
      }
      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        const k = e.key.toLowerCase();
        if (k === 't') {
          e.preventDefault();
          addElement('text');
          return;
        }
        if (k === 'r') {
          e.preventDefault();
          addElement('rect');
          return;
        }
        if (k === 'o') {
          e.preventDefault();
          addElement('circle');
          return;
        }
        if (k === 'l') {
          e.preventDefault();
          addElement('line');
          return;
        }
        if (k === 'i') {
          e.preventDefault();
          addElement('image');
          return;
        }
        if (k === 'b') {
          e.preventDefault();
          addElement('imageBanner');
          return;
        }
        if (e.key === 'PageDown') {
          e.preventDefault();
          selectNextSlide(1);
          return;
        }
        if (e.key === 'PageUp') {
          e.preventDefault();
          selectNextSlide(-1);
          return;
        }
        if (e.key === 'Home') {
          e.preventDefault();
          selectEdgeSlide('first');
          return;
        }
        if (e.key === 'End') {
          e.preventDefault();
          selectEdgeSlide('last');
          return;
        }
      }
      if ((e.ctrlKey || e.metaKey) && !e.altKey) {
        const k = e.key.toLowerCase();
        if (k === 'z') {
          e.preventDefault();
          if (e.shiftKey) redo(); else undo();
          return;
        }
        if (k === 'y') {
          e.preventDefault();
          redo();
          return;
        }
        if (k === 'c' && state.selectedElementId) {
          e.preventDefault();
          copySelected();
          return;
        }
        if (k === 'c' && !state.selectedElementId && state.currentSlideId) {
          e.preventDefault();
          copyCurrentSlide();
          return;
        }
        if (k === 'x' && state.selectedElementId) {
          e.preventDefault();
          cutSelected();
          return;
        }
        // Ctrl+V is intentionally NOT handled here — letting it fall through
        // means the browser dispatches a `paste` event with `e.clipboardData`
        // attached. That gives synchronous access to images, SVG, text, and
        // our internal JSON tag without ever triggering the async
        // navigator.clipboard.read() permission prompt. The document-level
        // paste listener (below in init) routes the data through
        // handleClipboardData, which already understands every payload type
        // including screenshots and in-app element JSON.
        if (k === 'd' && state.selectedElementId) {
          e.preventDefault();
          duplicateSelected();
          return;
        }
        if (k === 'g' && state.selectedElementId) {
          e.preventDefault();
          if (e.shiftKey) ungroupSelected();
          else groupSelected();
          return;
        }
        if (k === 'a') {
          e.preventDefault();
          selectAllOnSlide();
          return;
        }
      }
      if ((e.ctrlKey || e.metaKey) && state.selectedElementId) {
        if (e.key === ']') {
          e.preventDefault();
          moveElementZ(state.selectedElementId, e.shiftKey ? 'front' : 'forward');
          return;
        }
        if (e.key === '[') {
          e.preventDefault();
          moveElementZ(state.selectedElementId, e.shiftKey ? 'back' : 'backward');
          return;
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && state.selectedElementId && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        e.preventDefault();
        const step = 10;
        const dw = e.key === 'ArrowLeft' ? -step : (e.key === 'ArrowRight' ? step : 0);
        const dh = e.key === 'ArrowUp' ? -step : (e.key === 'ArrowDown' ? step : 0);
        resizeSelectedBy(dw, dh);
        return;
      }
      if (state.selectedElementId && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        const slide = getCurrentSlide();
        const el = slide && slide.elements.find(x => x.id === state.selectedElementId);
        if (el) {
          e.preventDefault();
          const step = e.shiftKey ? 10 : 1;
          const dx = e.key === 'ArrowLeft' ? -step : (e.key === 'ArrowRight' ? step : 0);
          const dy = e.key === 'ArrowUp' ? -step : (e.key === 'ArrowDown' ? step : 0);
          if (e.altKey && (el.type === 'image' || el.type === 'vector' || el.type === 'video' || el.type === 'imageBanner')) {
            updateElement(el.id, {
              cropX: Math.max(-100, Math.min(100, (el.cropX || 0) + dx)),
              cropY: Math.max(-100, Math.min(100, (el.cropY || 0) + dy)),
            }, { skipPropsRender: true });
          } else if (!e.altKey) {
            nudgeSelected(dx, dy);
          }
          return;
        }
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && activeGuideId) {
        // Active guide line takes priority over selected element — the user
        // most recently interacted with the guide, so Delete removes it.
        e.preventDefault();
        const id = activeGuideId;
        setActiveGuide(null);
        removeGuide(id);
        return;
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && state.selectedElementId) {
        e.preventDefault();
        deleteElement();
      } else if (e.key === 'Escape') {
        if (activeGuideId) setActiveGuide(null);
        deselectElement();
      }
    });

    document.addEventListener('paste', (e) => {
      if (!els.presentOverlay.hidden) return;
      if (isEditableTarget(e.target)) return;
      if (!e.clipboardData) return;
      e.preventDefault();
      handleClipboardData(e.clipboardData).then(handled => {
        if (!handled) insertClipboardItems(internalClipboard);
      }).catch(() => insertClipboardItems(internalClipboard));
    });

    window.addEventListener('beforeunload', persist);
    window.addEventListener('resize', () => {
      fitCanvas();
      renderSlidesList();
      if (!els.presentOverlay.hidden) renderPresent();
    });
    fitCanvas();
    // After first layout, scroll the wrap so the slide is centered in view.
    requestAnimationFrame(centerCanvasScroll);

    localFonts = loadLocalFontsCache();
    googleFontsUsed = loadGoogleFontsUsedCache();
    webfontsUsed = loadWebfontsUsedCache();
    rehydrateUsedGoogleFonts();
    rehydrateUsedWebfonts();
    restoreSidebarWidth();
    restorePropertiesWidth();
    restoreContentHeight();
    setupSidebarResizer();
    setupPropertiesResizer();
    setupContentResizer();
    setupSlideListObserver();

    // IndexedDB autosave is the authoritative source of truth — it has the
    // most-recent state (including videos / big data URLs that wouldn't fit
    // in localStorage). Only fall back to localStorage if no autosave exists
    // (e.g., fresh install before any edits happened), and to a fresh starter
    // project if neither exists.
    let restored = false;
    try {
      const draftRecord = await readAutosaveDraft();
      const parsed = draftRecord && draftRecord.data;
      if (parsed && Array.isArray(parsed.slides) && parsed.slides.length) {
        applyLoadedData(JSON.parse(JSON.stringify(parsed)));
        restored = true;
      }
    } catch (e) {
      console.warn('Autosave restore failed, falling back to localStorage', e);
    }
    if (!restored) {
      if (!restore() || !state.slides.length) {
        const intro = newSlide('title');
        const next = newSlide('titleBody');
        state.slides = [intro, next];
        state.currentSlideId = intro.id;
      }
    }
    // Backfill new fields on slides loaded from older saves.
    state.slides.forEach(s => {
      normalizeSlideFields(s);
      (s.elements || []).forEach(el => {
        if (typeof el.link !== 'string') el.link = '';
        if (typeof el.hoverStrength !== 'number') el.hoverStrength = 1;
        if (typeof el.motionStrength !== 'number') el.motionStrength = 1;
        if (typeof el.blinkDuration !== 'number' || !(el.blinkDuration > 0)) el.blinkDuration = 1;
        if (typeof el.motionFromX !== 'number') el.motionFromX = 0;
        if (typeof el.motionFromY !== 'number') el.motionFromY = 0;
        if (el.motionDuration != null && (typeof el.motionDuration !== 'number' || !(el.motionDuration > 0))) el.motionDuration = null;
        if (typeof el.opacity !== 'number') el.opacity = 1;
        if (typeof el.locked !== 'boolean') el.locked = false;
        if (typeof el.hidden !== 'boolean') el.hidden = false;
        if (el.stroke !== null && typeof el.stroke !== 'object') el.stroke = null;
        if (el.stroke && typeof el.stroke.opacity !== 'number') el.stroke.opacity = 1;
        if (el.shadow !== null && typeof el.shadow !== 'object') el.shadow = null;
        if ((el.type === 'rect' || el.type === 'circle') && typeof el.fillEnabled !== 'boolean') el.fillEnabled = true;
        if (el.type === 'text') {
          if (typeof el.letterSpacing !== 'number') el.letterSpacing = 0;
          if (typeof el.fontStretch !== 'number') el.fontStretch = 100;
          if (typeof el.fontStyle !== 'string') el.fontStyle = 'normal';
          if (typeof el.bg !== 'string') el.bg = '';
          if (typeof el.lineHeight !== 'number') el.lineHeight = 1.3;
          if (typeof el.verticalAlign !== 'string') el.verticalAlign = 'center';
          if (typeof el.underline !== 'boolean') el.underline = false;
          if (typeof el.underlineOffset !== 'number') el.underlineOffset = 3;
          if (typeof el.strikethrough !== 'boolean') el.strikethrough = false;
          if (typeof el.textCase !== 'string') el.textCase = 'none';
          if (typeof el.paragraphSpacing !== 'number') el.paragraphSpacing = 0;
          if (typeof el.html !== 'string' || !el.html) el.html = escapeHtml(el.text || '');
          else el.html = sanitizeTextHtml(el.html);
          // Clamp out-of-range typography values that may have leaked in via
          // unbounded number-input typing (e.g. fontWeight: 7400 or 0).
          if (typeof el.fontWeight !== 'number') el.fontWeight = 400;
          el.fontWeight = clampTypographyValue('fontWeight', el.fontWeight);
          el.fontSize = clampTypographyValue('fontSize', el.fontSize || 32);
          el.letterSpacing = clampTypographyValue('letterSpacing', el.letterSpacing);
          el.fontStretch = clampTypographyValue('fontStretch', el.fontStretch);
          el.lineHeight = clampTypographyValue('lineHeight', el.lineHeight);
          el.paragraphSpacing = clampTypographyValue('paragraphSpacing', el.paragraphSpacing);
          // Only auto-fit when dimensions are missing (legacy data without
          // saved w/h). For projects that already carry valid box sizes,
          // trust them — re-measuring against partially-loaded fonts on
          // every load would let positions drift over time.
          if (!(el.w > 0) || !(el.h > 0)) autoSizeTextElement(el);
        }
        if (el.type === 'rect' && typeof el.radius !== 'number') el.radius = 4;
        if (el.type === 'image' || el.type === 'vector' || el.type === 'video' || el.type === 'imageBanner') {
          if (typeof el.radius !== 'number') el.radius = 0;
          if (typeof el.cropX !== 'number') el.cropX = 0;
          if (typeof el.cropY !== 'number') el.cropY = 0;
          if (typeof el.cropZoom !== 'number') el.cropZoom = 1;
          if (typeof el.cropApplied !== 'boolean') el.cropApplied = false;
          if (typeof el.aspectLocked !== 'boolean') el.aspectLocked = el.type === 'vector' ? true : false;
          if (typeof el.aspectRatio !== 'number') el.aspectRatio = null;
          if (el.type === 'vector') {
            if (typeof el.svg !== 'string') el.svg = '';
            if (!el.src && el.svg) el.src = svgToDataUrl(el.svg);
          }
          el.cropX = Math.max(-100, Math.min(100, el.cropX));
          el.cropY = Math.max(-100, Math.min(100, el.cropY));
          el.cropZoom = Math.max(1, Math.min(6, el.cropZoom));
        }
        if (el.type === 'imageBanner') {
          if (!Array.isArray(el.images)) el.images = [];
          if (typeof el.fit !== 'string') el.fit = 'cover';
          if (typeof el.transition !== 'string') el.transition = 'fade';
          if (typeof el.interval !== 'number') el.interval = 2800;
          if (typeof el.fadeMs !== 'number') el.fadeMs = 350;
          el.interval = Math.max(2000, Math.min(4500, Math.round(el.interval)));
          el.fadeMs = Math.max(100, Math.min(800, Math.round(el.fadeMs)));
        }
        if (el.type === 'video' && typeof el.poster !== 'string') el.poster = '';
        if (el.type === 'linkcard') {
          if (typeof el.title !== 'string') el.title = '';
          if (typeof el.description !== 'string') el.description = '';
          if (typeof el.image !== 'string') el.image = '';
          if (typeof el.domain !== 'string') el.domain = extractDomain(el.link || '');
        }
        if (el.font && GOOGLE_FONT_SET.has(el.font)) loadGoogleFont(el.font);
        if (el.font && WEBFONT_SET.has(el.font)) loadWebfont(el.font);
      });
    });
    applyCanvasSize();
    renderAll();
    try {
      if (sessionStorage.getItem(VIEW_KEY) === 'projects') {
        openProjectLibrary();
      }
    } catch (e) {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

/* ============================================================
   Presentation Generator ??App Logic
   Pure HTML/CSS/JS (no dependencies)
   ============================================================ */

(function () {
  'use strict';

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
.frame { position: relative;
  width: min(100vw, calc(100vh * var(--cw, 1280) / var(--ch, 720)));
  height: min(100vh, calc(100vw * var(--ch, 720) / var(--cw, 1280)));
  overflow: hidden; }
.canvas { position: absolute; top: 50%; left: 50%;
  transform: translate(-50%, -50%); transform-origin: center center; }
.el { position: absolute; user-select: none;
  transform: rotate(var(--rotation, 0deg));
  transition: transform 0.25s ease, filter 0.25s ease, opacity 0.25s ease, color 0.25s ease, background 0.25s ease; }
.el.text { display: flex; align-items: center; line-height: 1.3; padding: 4px; word-break: break-word; }
.el.text > div { width: 100%; }
.el.shape-rect { border-radius: 4px; }
.el.shape-circle { border-radius: 50%; }
.el[data-link] { cursor: pointer; }
.el.linkcard { background:#1f1f1f; border-radius:8px; overflow:hidden; }
.linkcard-image { position:absolute; inset:0; background-size:cover; background-position:top center; background-repeat:no-repeat; background-color:#1f1f1f; }
.el.hover-scale:hover { transform: rotate(var(--rotation, 0deg)) scale(calc(1 + 0.05 * var(--hover-strength, 1))); }
.el.hover-glow:hover { filter: drop-shadow(0 0 calc(12px * var(--hover-strength, 1)) rgba(255,255,255,0.55)); }
.el.hover-lift:hover { transform: rotate(var(--rotation, 0deg)) translateY(calc(-6px * var(--hover-strength, 1))); }
.el.hover-fade:hover { opacity: calc(1 - 0.4 * var(--hover-strength, 1)); }
@keyframes fadeIn { from { opacity: calc(1 - var(--motion-strength, 1)); } to { opacity: 1; } }
@keyframes slideUp { from { opacity: 0; transform: rotate(var(--rotation, 0deg)) translateY(calc(60px * var(--motion-strength, 1))); } to { opacity: 1; transform: rotate(var(--rotation, 0deg)) translateY(0); } }
@keyframes slideLeft { from { opacity: 0; transform: rotate(var(--rotation, 0deg)) translateX(calc(-80px * var(--motion-strength, 1))); } to { opacity: 1; transform: rotate(var(--rotation, 0deg)) translateX(0); } }
@keyframes slideRight { from { opacity: 0; transform: rotate(var(--rotation, 0deg)) translateX(calc(80px * var(--motion-strength, 1))); } to { opacity: 1; transform: rotate(var(--rotation, 0deg)) translateX(0); } }
@keyframes scaleUp { from { opacity: 0; transform: rotate(var(--rotation, 0deg)) scale(calc(1 - 0.3 * var(--motion-strength, 1))); } to { opacity: 1; transform: rotate(var(--rotation, 0deg)) scale(1); } }
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
  function applyBrMargin(c, px){
    if(!c) return;
    var pxs = (px || 0) + 'px';
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
  if(!slides.length){slides=[{bg:'#0a0a0a',elements:[]}];}
  var idx=0;
  var canvas=document.getElementById('canvas');
  var counter=document.getElementById('counter');
  canvas.style.width = CW + 'px';
  canvas.style.height = CH + 'px';
  document.documentElement.style.setProperty('--cw', CW);
  document.documentElement.style.setProperty('--ch', CH);
  function fit(){
    var frame=document.querySelector('.frame');
    var s=Math.min(frame.clientWidth/CW, frame.clientHeight/CH);
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
      if(el.hidden) return;
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
      node.style.setProperty('--hover-strength', String(el.hoverStrength!=null?el.hoverStrength:1));
      node.style.setProperty('--motion-strength', String(el.motionStrength!=null?el.motionStrength:1));
      if(el.rotation) node.style.setProperty('--rotation', el.rotation+'deg');
      if(el.opacity!=null && el.opacity<1) node.style.opacity=String(el.opacity);
      if(el.type==='text'){
        node.style.fontFamily=fontFamily(el.font);
        node.style.fontSize=el.fontSize+'px';
        node.style.fontWeight=String(el.fontWeight);
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
        inner.style.lineHeight=String(el.lineHeight!=null?el.lineHeight:1.3);
        var dcs=[];
        if(el.underline) dcs.push('underline');
        if(el.strikethrough) dcs.push('line-through');
        if(dcs.length) inner.style.textDecoration=dcs.join(' ');
        var stretch=(el.fontStretch||100)/100;
        if(stretch!==1){
          var ORG={left:'left',center:'center',right:'right',justify:'left'};
          inner.style.transformOrigin=(ORG[el.align]||'left')+' center';
          inner.style.transform='scaleX('+stretch+')';
        }
        inner.innerHTML=el.html||el.text||'';
        applyBrMargin(inner, el.paragraphSpacing||0);
        node.appendChild(inner);
      } else if(el.type==='image'){
        var img=document.createElement('img');
        img.src=el.src||'';
        img.draggable=false;
        img.style.width='100%'; img.style.height='100%';
        img.style.objectFit=el.fit||'cover';
        img.style.display='block';
        img.style.borderRadius=(el.radius||0)+'px';
        node.appendChild(img);
      } else if(el.type==='video'){
        var vid=document.createElement('video');
        vid.style.width='100%'; vid.style.height='100%';
        vid.style.objectFit=el.fit||'cover';
        vid.style.display='block';
        vid.style.borderRadius=(el.radius||0)+'px';
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
        node.style.background=el.fill;
      }
      if(el.type==='rect'){
        node.style.borderRadius=(el.radius!=null?el.radius:0)+'px';
      }
      if(el.stroke && el.stroke.width && el.type!=='line'){
        if(el.type==='text'){
          var tInner=node.querySelector(':scope > div');
          if(tInner) tInner.style.webkitTextStroke=el.stroke.width+'px '+(el.stroke.color||'#fff');
        } else if(el.type==='image' || el.type==='video'){
          node.style.boxShadow=(node.style.boxShadow?node.style.boxShadow+', ':'')+
            'inset 0 0 0 '+el.stroke.width+'px '+(el.stroke.color||'#fff');
        } else {
          node.style.border=el.stroke.width+'px '+(el.stroke.style||'solid')+' '+(el.stroke.color||'#fff');
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
        } else if(el.type==='image' || el.type==='video' || el.type==='linkcard'){
          node.style.filter=(node.style.filter?node.style.filter+' ':'')+'drop-shadow('+sx+sy+sb+sc+')';
        } else {
          node.style.boxShadow=(node.style.boxShadow?node.style.boxShadow+', ':'')+sx+sy+sb+sc;
        }
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
        if(u.indexOf('slide:')===0){
          var sid=u.slice(6);
          var newIdx=-1;
          for(var i=0;i<slides.length;i++){if(slides[i].id===sid){newIdx=i;break;}}
          if(newIdx>=0){idx=newIdx;render();}
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

  // ---------- Visual effect helpers ----------
  // Build the CSS border value for an element's stroke (rect/circle/text bg).
  // Returns '' when no stroke is configured.
  function strokeBorder(stroke) {
    if (!stroke || !stroke.width) return '';
    const style = stroke.style || 'solid';
    const color = stroke.color || '#ffffff';
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
  // Text-shadow for text elements.
  function textShadowStr(shadow) {
    if (!shadow) return '';
    return (shadow.x || 0) + 'px ' + (shadow.y || 0) + 'px ' +
      Math.max(0, shadow.blur || 0) + 'px ' + (shadow.color || 'rgba(0,0,0,0.4)');
  }

  // Apply paragraph spacing to <br> elements within the saved selection.
  // Returns true on success; otherwise caller falls back to element-wide.
  function applyParagraphSpacingToSelection(spacing) {
    if (!state.editingElementId) return false;
    if (!restoreSelection() && !isInsideEditableText()) return false;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return false;
    const range = sel.getRangeAt(0);
    if (range.collapsed) return false;
    const ce = document.querySelector('[contenteditable="true"][data-edit-id="' + state.editingElementId + '"]');
    if (!ce) return false;
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
      if (!prev) return;
      b.style.marginTop = px;
      modified = true;
    });
    if (!modified) return false;
    const slide = getCurrentSlide();
    const el = slide && slide.elements.find(e => e.id === state.editingElementId);
    if (el) {
      recordHistory();
      el.html = ce.innerHTML;
      el.text = ce.innerText;
      autoSizeTextElement(el);
      renderSlidesList();
      persist();
    }
    return true;
  }

  // Track selection continuously while a contenteditable is focused.
  document.addEventListener('selectionchange', () => {
    if (!state.editingElementId) return;
    captureSelection();
  });

  // ---------- Inline text selection tracking ----------
  // Saved selection range while editing; lets Properties panel controls apply
  // styles to whatever the user had selected before clicking the control.
  let savedSelection = null;

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
      savedSelection = null;
      return;
    }
    const range = sel.getRangeAt(0);
    // Selection moved out of any contenteditable (e.g. user clicked a
    // Properties control). Don't touch savedSelection ??keep the last
    // non-collapsed range so controls can still apply to it.
    if (!isInsideEditableText()) return;
    // User clicked / arrowed inside the editable, collapsing the selection.
    // Clear so subsequent control changes apply element-wide instead of to
    // a stale previous range.
    if (range.collapsed) {
      savedSelection = null;
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

  // Apply CSS style props to the saved or current selection by wrapping it
  // in a <span> with the styles. Returns true if applied. Empty/collapsed
  // selections fall through so callers apply element-wide.
  function applyStyleToSelection(styleObj) {
    if (!state.editingElementId) return false;
    if (!restoreSelection() && !isInsideEditableText()) return false;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return false;
    const range = sel.getRangeAt(0);
    if (range.collapsed) return false;

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
    } catch (e) { return false; }

    // Persist HTML back to the element
    const slide = getCurrentSlide();
    const el = slide && slide.elements.find(e => e.id === state.editingElementId);
    if (el) {
      const ce = document.querySelector('[contenteditable="true"][data-edit-id="' + state.editingElementId + '"]');
      if (ce) {
        recordHistory();
        el.html = ce.innerHTML;
        el.text = ce.innerText;
        autoSizeTextElement(el);
        renderSlidesList();
        persist();
      }
    }
    return true;
  }

  // Strip a specific inline CSS property from every descendant of an HTML
  // string. Used when applying an element-wide typography change so spans
  // left behind by prior selection-based edits don't shadow the new value.
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
    tmp.querySelectorAll('br, div, p').forEach(node => {
      node.style.removeProperty('margin-bottom');
      node.style.removeProperty('margin-top');
      node.style.removeProperty('display');
      if (!node.getAttribute('style')) node.removeAttribute('style');
    });
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
    const px = (defaultPx || 0) + 'px';
    container.querySelectorAll('br').forEach(br => {
      if (br.style.marginBottom) return;
      br.style.display = 'block';
      br.style.marginBottom = px;
    });
    // Top-margin every block-paragraph except the first sibling.
    const blocks = container.querySelectorAll('div, p');
    blocks.forEach(b => {
      if (b.style.marginTop) return;
      // Only apply if not the first child of its parent (skip leading paragraph)
      let prev = b.previousSibling;
      while (prev && prev.nodeType === 3 && !prev.textContent.trim()) prev = prev.previousSibling;
      if (!prev) return;
      b.style.marginTop = px;
    });
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
      letterSpacing: 0,
      fontStretch: 100,
      lineHeight: 1.3,
      paragraphSpacing: 0,
      color: '#ffffff',
      bg: '',
      align: 'left',
      verticalAlign: 'center',
      underline: false,
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
      radius: 0,
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
    node.style.borderRadius = (el.radius != null ? el.radius : 0) + 'px';
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
  };

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

  let draggingSlideId = null;
  const SIDE_WIDTH_KEY = 'pres-gen-side-w-v1';

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

  function restoreSidebarWidth() {
    try {
      const w = localStorage.getItem(SIDE_WIDTH_KEY);
      if (w) document.documentElement.style.setProperty('--side-w', w);
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

  function injectWebfontLink(name) {
    if (!WEBFONTS[name]) return;
    const id = 'webfont-' + name.replace(/\s+/g, '_');
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = WEBFONTS[name].cssUrl;
    document.head.appendChild(link);
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
  function preloadAllWebfonts() {
    if (webfontsBundleLoaded) return;
    webfontsBundleLoaded = true;
    WEBFONT_NAMES.forEach(injectWebfontLink);
  }
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
      alert('This browser does not support Local Font Access API.\nType a font name manually, or use Chrome/Edge 103+.');
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
    'text', 'html', 'font', 'fontSize', 'fontWeight',
    'letterSpacing', 'lineHeight', 'paragraphSpacing',
    'fontStretch', 'textCase', 'align', 'verticalAlign',
  ]);

  function resolveFontFamily(font) {
    if (!font) return FONT_FAMILIES.sans;
    if (FONT_FAMILIES[font]) return FONT_FAMILIES[font];
    if (WEBFONTS[font]) return WEBFONTS[font].family;
    return font;
  }

  // ---------- Persistence ----------
  function persist() {
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
    refreshContentEditor();
    persist();
  }

  function refreshContentEditor() {
    const editor = document.getElementById('contentEditor');
    const ta = document.getElementById('contentEditorText');
    if (!editor || !ta) return;
    const el = getSelectedElement();
    if (el && el.type === 'text') {
      editor.hidden = false;
      // Don't overwrite while user is actively typing in the textarea.
      if (document.activeElement !== ta) {
        ta.value = el.text || '';
      }
    } else {
      editor.hidden = true;
    }
  }

  function renderSlidesList() {
    els.slidesList.innerHTML = '';
    els.slideCount.textContent = String(state.slides.length).padStart(2, '0');
    state.slides.forEach((slide, i) => {
      const thumb = document.createElement('div');
      thumb.className = 'slide-thumb' + (slide.id === state.currentSlideId ? ' active' : '');
      thumb.draggable = true;

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
      del.textContent = '횞';
      del.title = 'Delete slide';
      del.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteSlide(slide.id);
      });
      thumb.appendChild(del);

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
      els.slidesList.appendChild(thumb);
    });
    requestAnimationFrame(syncThumbSizes);
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
    const grid = buildGridOverlay();
    if (grid) els.canvas.appendChild(grid);
    const guides = buildGuidesOverlay();
    if (guides) els.canvas.appendChild(guides);
    els.btnDeleteElement.disabled = !state.selectedElementId;
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
  function startGuideDrag(e, guideId) {
    e.preventDefault();
    e.stopPropagation();
    const item = state.guides.items.find(g => g.id === guideId);
    if (!item) return;
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
      const decos = [];
      if (el.underline) decos.push('underline');
      if (el.strikethrough) decos.push('line-through');
      if (decos.length) inner.style.textDecoration = decos.join(' ');
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
          el.text = inner.innerText;
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
      img.style.borderRadius = (el.radius || 0) + 'px';
      node.appendChild(img);
    } else if (el.type === 'video') {
      const v = document.createElement('video');
      v.preload = 'auto';
      v.playsInline = true;
      v.crossOrigin = 'anonymous';
      if (el.poster) v.poster = el.poster;
      v.style.width = '100%';
      v.style.height = '100%';
      v.style.objectFit = el.fit || 'cover';
      v.style.display = 'block';
      v.style.pointerEvents = 'none';
      v.style.background = '#000';
      v.style.borderRadius = (el.radius || 0) + 'px';
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
      node.appendChild(v);
    } else if (el.type === 'linkcard') {
      buildLinkcardChildren(node, el);
    } else {
      node.style.background = el.fill;
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
          inner.style.webkitTextStroke = el.stroke.width + 'px ' + (el.stroke.color || '#fff');
        }
      } else if (el.type === 'image' || el.type === 'video') {
        // Border overlays the radius cleanly via box-shadow inset.
        const r = el.radius || 0;
        const inset = '0 0 0 ' + el.stroke.width + 'px ' + (el.stroke.color || '#fff');
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
      } else if (el.type === 'image' || el.type === 'video' || el.type === 'linkcard') {
        const f = dropShadowFilter(el.shadow);
        node.style.filter = (node.style.filter ? node.style.filter + ' ' : '') + f;
      } else {
        const s = boxShadowStr(el.shadow);
        node.style.boxShadow = (node.style.boxShadow ? node.style.boxShadow + ', ' : '') + s;
      }
    }

    if (el.link) node.setAttribute('data-link', el.link);

    if (!preview && !el.locked) {
      ['nw', 'ne', 'sw', 'se'].forEach(dir => {
        const handle = document.createElement('div');
        handle.className = 'resize-handle ' + dir;
        handle.addEventListener('mousedown', (e) => beginResize(e, el.id, dir));
        node.appendChild(handle);
      });
      const rotateHandle = document.createElement('div');
      rotateHandle.className = 'rotate-handle';
      rotateHandle.title = 'Drag to rotate (hold Shift to snap to 15째)';
      rotateHandle.addEventListener('mousedown', (e) => beginRotate(e, el.id));
      node.appendChild(rotateHandle);

      node.addEventListener('mousedown', (e) => {
        if (state.editingElementId === el.id) return;
        if (state.editingElementId) {
          state.editingElementId = null;
        }
        if (e.target.classList.contains('resize-handle') || e.target.classList.contains('rotate-handle')) return;
        // If already in a multi-selection that includes this element, don't
        // collapse to single ??preserve the group so drag moves them together.
        if (e.shiftKey) {
          selectElement(el.id, true);
        } else if (!isSelected(el.id)) {
          selectElement(el.id, false);
        }
        beginDrag(e, el.id);
      });
    } else if (!preview && el.locked) {
      // Locked element still allows selection (so Properties panel works) but
      // no drag/resize/rotate.
      node.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        selectElement(el.id, e.shiftKey);
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
    const dupBtn = document.createElement('button');
    dupBtn.className = 'pill';
    dupBtn.textContent = 'Duplicate';
    dupBtn.addEventListener('click', duplicateSelected);
    grp.appendChild(dupBtn);
    const delBtn = document.createElement('button');
    delBtn.className = 'pill';
    delBtn.textContent = 'Delete';
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
    [['left', 'L'], ['center', 'C'], ['right', 'R']].forEach(([k, label]) => {
      const p = document.createElement('button');
      p.className = 'pill';
      p.textContent = label;
      p.title = 'Align ' + k;
      p.addEventListener('click', () => alignSelected(k));
      alGrp1.appendChild(p);
    });
    alRow1.appendChild(alGrp1);
    al.appendChild(alRow1);
    const alRow2 = row('Vertical');
    const alGrp2 = document.createElement('div');
    alGrp2.className = 'pill-group';
    [['top', 'T'], ['middle', 'M'], ['bottom', 'B']].forEach(([k, label]) => {
      const p = document.createElement('button');
      p.className = 'pill';
      p.textContent = label;
      p.title = 'Align ' + k;
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

    return frag;
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

  // Compute selection bounding box (min/max in canvas coords).
  function selectionBBox() {
    const sels = getSelectedElements();
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
    const sels = getSelectedElements();
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

  function distributeSelected(axis) {
    const sels = getSelectedElements().slice();
    if (sels.length < 3) return;
    recordHistory();
    if (axis === 'h') {
      sels.sort((a, b) => a.x - b.x);
      const first = sels[0];
      const last = sels[sels.length - 1];
      const totalSpan = (last.x + last.w) - first.x;
      const widths = sels.reduce((s, e) => s + e.w, 0);
      const gap = (totalSpan - widths) / (sels.length - 1);
      let cursor = first.x;
      sels.forEach((el, i) => {
        el.x = Math.round(cursor);
        cursor += el.w + gap;
      });
    } else {
      sels.sort((a, b) => a.y - b.y);
      const first = sels[0];
      const last = sels[sels.length - 1];
      const totalSpan = (last.y + last.h) - first.y;
      const heights = sels.reduce((s, e) => s + e.h, 0);
      const gap = (totalSpan - heights) / (sels.length - 1);
      let cursor = first.y;
      sels.forEach((el, i) => {
        el.y = Math.round(cursor);
        cursor += el.h + gap;
      });
    }
    renderCanvas();
    renderSlidesList();
    persist();
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

  function elTypeClass(type) {
    if (type === 'text' || type === 'image' || type === 'video' || type === 'linkcard') return type;
    return 'shape-' + type;
  }

  function buildStrengthRow(el, field) {
    const r = row('Strength');
    const range = document.createElement('input');
    range.type = 'range';
    range.className = 'prop-range';
    range.min = '0';
    range.max = '400';
    range.step = '5';
    const current = (el[field] != null ? el[field] : 1) * 100;
    range.value = String(current);
    const val = document.createElement('span');
    val.className = 'prop-value';
    val.textContent = Math.round(current) + '%';
    range.addEventListener('input', () => {
      const v = parseFloat(range.value) / 100;
      val.textContent = range.value + '%';
      const patch = {};
      patch[field] = v;
      updateElement(el.id, patch, { skipPropsRender: true });
    });
    r.appendChild(range);
    r.appendChild(val);
    return r;
  }

  function buildLinkcardChildren(node, el) {
    const imgDiv = document.createElement('div');
    imgDiv.className = 'linkcard-image';
    if (el.image) imgDiv.style.backgroundImage = 'url("' + el.image + '")';
    node.appendChild(imgDiv);
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
    input.placeholder = '?대┃?섏뿬 ?고듃 ?좏깮';
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
      if (webMatches.length) {
        appendSection('Web fonts (' + webMatches.length + ')', webMatches, { web: true });
      }
      if (googleMatches.length) {
        appendSection('Google Fonts (' + googleMatches.length + ')', googleMatches, { google: true });
      }

      if (!presetMatches.length && !localMatches.length && !webMatches.length && !googleMatches.length) {
        const empty = document.createElement('div');
        empty.className = 'font-popup-empty';
        empty.textContent = '?쇱튂?섎뒗 ?고듃 ?놁쓬';
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
      } else if (opts.web) {
        const tag = document.createElement('span');
        tag.className = 'font-popup-badge';
        tag.textContent = 'W';
        item.appendChild(tag);
      }

      item.addEventListener('mousedown', (e) => {
        e.preventDefault();
        if (opts.google) loadGoogleFont(name);
        if (opts.web) loadWebfont(name);
        input.value = name;
        hidePopup();
        if (applyStyleToSelection({ fontFamily: resolveFontFamily(name) })) return;
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
      preloadAllWebfonts();
      // Always show the full list when opening; only the user actively typing
      // should filter. Otherwise reopening after a selection narrows the list
      // to that font and hides everything else.
      rebuildPopup('');
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

    input.addEventListener('focus', () => {
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
        saveLocalFontsCache(localFonts);
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
    numI.step = String(opts.step || 1);
    numI.style.flex = '0 0 64px';
    numI.style.textAlign = 'right';

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
    r.appendChild(numI);
    return r;
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
    [['Text', 'text'], ['Rectangle', 'rect'], ['Circle', 'circle'], ['Line', 'line'], ['Image', 'image'], ['Video', 'video'], ['Link Card', 'linkcard']].forEach(opt => {
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
      p.title = w + ' 횞 ' + h;
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
        del.textContent = '횞';
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
    frag.appendChild(cm);

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

    if (el.type === 'text') {
      // Typography
      const t = section('Typography');
      const fr = row('Font');
      fr.appendChild(buildFontPicker(el));
      t.appendChild(fr);

      t.appendChild(buildNumSliderRow('Weight', {
        min: 100, max: 900, step: 1, value: el.fontWeight || 400,
        onChange: v => {
          const w = Math.round(v);
          if (applyStyleToSelection({ fontWeight: String(w) })) return;
          updateElement(el.id, buildTextPatch(el, { fontWeight: w }, ['font-weight']), { skipPropsRender: true });
        },
      }));

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
        const px = parseInt(range.value, 10);
        if (applyStyleToSelection({ fontSize: px + 'px' })) return;
        updateElement(el.id, buildTextPatch(el, { fontSize: px }, ['font-size']), { skipPropsRender: true });
      });
      sr.appendChild(range);
      sr.appendChild(sv);
      t.appendChild(sr);

      // Letter spacing (?먭컙)
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
        if (applyStyleToSelection({ letterSpacing: v + 'px' })) return;
        updateElement(el.id, buildTextPatch(el, { letterSpacing: v }, ['letter-spacing']), { skipPropsRender: true });
      });
      lsR.appendChild(lsRange);
      lsR.appendChild(lsVal);
      t.appendChild(lsR);

      // Font stretch / character width (湲????
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
        if (applyStyleToSelection({ fontStretch: v + '%' })) return;
        updateElement(el.id, buildTextPatch(el, { fontStretch: v }, ['font-stretch']), { skipPropsRender: true });
      });
      fsR.appendChild(fsRange);
      fsR.appendChild(fsVal);
      t.appendChild(fsR);

      // Line height (multiplier)
      t.appendChild(buildNumSliderRow('Line ht', {
        min: 0.5, max: 3.0, step: 0.05, value: el.lineHeight != null ? el.lineHeight : 1.3,
        onChange: v => {
          const lh = parseFloat(parseFloat(v).toFixed(2));
          if (applyStyleToSelection({ lineHeight: String(lh) })) return;
          updateElement(el.id, buildTextPatch(el, { lineHeight: lh }, ['line-height']), { skipPropsRender: true });
        },
      }));

      // Paragraph gap (extra space between hard line breaks)
      t.appendChild(buildNumSliderRow('Para gap', {
        min: 0, max: 200, step: 1, value: el.paragraphSpacing || 0,
        onChange: v => {
          const px = Math.max(0, Math.round(v));
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
      [['none', 'Aa'], ['uppercase', 'AA'], ['lowercase', 'aa'], ['capitalize', 'Title']].forEach(([c, label]) => {
        const p = document.createElement('button');
        p.className = 'pill' + ((el.textCase || 'none') === c ? ' active' : '');
        p.textContent = label;
        p.addEventListener('click', () => {
          if (applyStyleToSelection({ textTransform: c === 'none' ? 'none' : c })) return;
          updateElement(el.id, buildTextPatch(el, { textCase: c }, ['text-transform']));
        });
        cpills.appendChild(p);
      });
      caser.appendChild(cpills);
      t.appendChild(caser);

      const decoR = row('Style');
      const dpills = document.createElement('div');
      dpills.className = 'pill-group';
      const uPill = document.createElement('button');
      uPill.className = 'pill' + (el.underline ? ' active' : '');
      uPill.textContent = 'Underline';
      uPill.style.textDecoration = 'underline';
      uPill.addEventListener('click', () => {
        if (applyStyleToSelection({ textDecoration: 'underline' })) return;
        updateElement(el.id, buildTextPatch(el, { underline: !el.underline }, ['text-decoration', 'text-decoration-line']));
      });
      dpills.appendChild(uPill);
      const sPill = document.createElement('button');
      sPill.className = 'pill' + (el.strikethrough ? ' active' : '');
      sPill.textContent = 'Strike';
      sPill.style.textDecoration = 'line-through';
      sPill.addEventListener('click', () => {
        if (applyStyleToSelection({ textDecoration: 'line-through' })) return;
        updateElement(el.id, buildTextPatch(el, { strikethrough: !el.strikethrough }, ['text-decoration', 'text-decoration-line']));
      });
      dpills.appendChild(sPill);
      decoR.appendChild(dpills);
      t.appendChild(decoR);

      const colr = row('Text color');
      colr.appendChild(colorInput(el.color, v => {
        if (applyStyleToSelection({ color: v })) return;
        updateElement(el.id, buildTextPatch(el, { color: v }, ['color']), { skipPropsRender: true });
      }));
      t.appendChild(colr);

      const bgRow = row('BG color');
      bgRow.appendChild(colorInput(el.bg || '#000000', v => {
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
      s.appendChild(buildNumSliderRow('Radius', {
        min: 0, max: 400, step: 1, value: el.radius || 0,
        onChange: v => updateElement(el.id, { radius: Math.max(0, Math.round(v)) }, { skipPropsRender: true }),
      }));
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
      s.appendChild(buildNumSliderRow('Radius', {
        min: 0, max: 400, step: 1, value: el.radius || 0,
        onChange: v => updateElement(el.id, { radius: Math.max(0, Math.round(v)) }, { skipPropsRender: true }),
      }));

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
      const fr = row('Fill');
      fr.appendChild(colorInput(el.fill, v => updateElement(el.id, { fill: v }, { skipPropsRender: true })));
      s.appendChild(fr);
      if (el.type === 'rect') {
        s.appendChild(buildNumSliderRow('Radius', {
          min: 0, max: 400, step: 1, value: el.radius || 0,
          onChange: v => updateElement(el.id, { radius: Math.max(0, Math.round(v)) }, { skipPropsRender: true }),
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
          updateElement(el.id, { stroke: { width: 2, color: '#ffffff', style: 'solid' } });
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
        shColorRow.appendChild(colorInput(el.shadow.color || '#000000', v => {
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
    ], v => updateElement(el.id, { motion: v })));
    ix.appendChild(mr);

    if (el.motion && el.motion !== 'none') {
      ix.appendChild(buildStrengthRow(el, 'motionStrength'));
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

  function deleteSlide(id) {
    recordHistory();
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
    recordHistory();
    Object.assign(el, patch);
    // Auto-fit text element to its content unless the user is doing a manual
    // resize (which sends w/h) or a pure move (x/y only).
    if (el.type === 'text') {
      const keys = Object.keys(patch);
      const hasManualSize = keys.indexOf('w') >= 0 || keys.indexOf('h') >= 0;
      const triggers = !hasManualSize && keys.some(k => TEXT_AUTOSIZE_KEYS.has(k));
      if (triggers) autoSizeTextElement(el);
    }
    renderCanvas();
    renderSlidesList();
    if (!opts.skipPropsRender) renderProperties();
    persist();
  }

  function selectElement(id, additive) {
    if (additive) {
      selectToggle(id);
    } else {
      if (state.selectedElementIds.size === 1 && isSelected(id)) return;
      selectOnly(id);
    }
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

  // ---------- Copy / Paste / Duplicate ----------
  // Internal clipboard ??system clipboard would require async permission and
  // doesn't preserve our element schema cleanly, so we keep an in-memory copy.
  let internalClipboard = null;

  function cloneElement(el) {
    const c = JSON.parse(JSON.stringify(el));
    c.id = uid('el');
    return c;
  }

  function copySelected() {
    const slide = getCurrentSlide();
    if (!slide) return;
    const ids = getSelectedIds();
    if (!ids.length) return;
    internalClipboard = ids
      .map(id => slide.elements.find(e => e.id === id))
      .filter(Boolean)
      .map(el => JSON.parse(JSON.stringify(el)));
  }

  function pasteClipboard() {
    if (!internalClipboard || !internalClipboard.length) return;
    const slide = getCurrentSlide();
    if (!slide) return;
    recordHistory();
    const offset = 20;
    const newIds = [];
    internalClipboard.forEach(src => {
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

  function duplicateSelected() {
    const slide = getCurrentSlide();
    if (!slide) return;
    const ids = getSelectedIds();
    if (!ids.length) return;
    recordHistory();
    const offset = 20;
    const newIds = [];
    ids.forEach(id => {
      const src = slide.elements.find(e => e.id === id);
      if (!src) return;
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

  function selectAllOnSlide() {
    const slide = getCurrentSlide();
    if (!slide) return;
    selectClear();
    slide.elements.forEach(el => {
      if (!el.locked && !el.hidden) state.selectedElementIds.add(el.id);
    });
    renderAll();
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
      { value: 0, edge: 'canvas-left' },
      { value: cw, edge: 'canvas-right' },
      { value: cw / 2, edge: 'canvas-cx' },
    ];
    const yCands = [
      { value: 0, edge: 'canvas-top' },
      { value: ch, edge: 'canvas-bottom' },
      { value: ch / 2, edge: 'canvas-cy' },
    ];
    others.forEach(el => {
      xCands.push({ value: el.x, edge: 'el-left', el: el });
      xCands.push({ value: el.x + el.w, edge: 'el-right', el: el });
      xCands.push({ value: el.x + el.w / 2, edge: 'el-cx', el: el });
      yCands.push({ value: el.y, edge: 'el-top', el: el });
      yCands.push({ value: el.y + el.h, edge: 'el-bottom', el: el });
      yCands.push({ value: el.y + el.h / 2, edge: 'el-cy', el: el });
    });
    // Vertical guide lines (snap user guides too)
    if (state.guides && state.guides.enabled) {
      state.guides.items.forEach(g => {
        if (g.axis === 'v') xCands.push({ value: g.position, edge: 'guide-v' });
        else yCands.push({ value: g.position, edge: 'guide-h' });
      });
    }

    function pickSnap(targets, edges) {
      // edges = [leftValue, centerValue, rightValue] of dragged box on this axis
      let best = { delta: Infinity, snapTo: null, source: null };
      targets.forEach(c => {
        edges.forEach(eVal => {
          const d = c.value - eVal;
          if (Math.abs(d) < Math.abs(best.delta)) {
            best = { delta: d, snapTo: c.value, source: c };
          }
        });
      });
      return best;
    }
    const xSnap = pickSnap(xCands, [tLeft, tCx, tRight]);
    const ySnap = pickSnap(yCands, [tTop, tCy, tBottom]);
    const dx = Math.abs(xSnap.delta) <= SNAP_THRESHOLD ? xSnap.delta : 0;
    const dy = Math.abs(ySnap.delta) <= SNAP_THRESHOLD ? ySnap.delta : 0;

    const guides = [];
    if (dx !== 0 && xSnap.snapTo != null) {
      guides.push({ axis: 'v', value: xSnap.snapTo });
    }
    if (dy !== 0 && ySnap.snapTo != null) {
      guides.push({ axis: 'h', value: ySnap.snapTo });
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
      line.style.background = '#ff3d8c';
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
      const elRight = el.x + el.w;
      const elBottom = el.y + el.h;
      const overlaps = !(elRight < minX || el.x > maxX || elBottom < minY || el.y > maxY);
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
    const ids = isSelected(id) && state.selectedElementIds.size > 1
      ? getSelectedIds()
      : [id];
    dragState = {
      mode: 'move', id: id,
      ids: ids,
      origs: ids.map(i => {
        const e2 = slide.elements.find(x => x.id === i);
        return e2 ? { id: i, origX: e2.x, origY: e2.y, w: e2.w, h: e2.h } : null;
      }).filter(Boolean),
      startX: e.clientX, startY: e.clientY,
      origX: el.x, origY: el.y,
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
      const primary = dragState.origs.find(o => o.id === dragState.id);
      if (primary) {
        const targetBox = {
          x: primary.origX + dx,
          y: primary.origY + dy,
          w: primary.w,
          h: primary.h,
        };
        const snap = computeSnapDelta(targetBox, dragState.ids);
        adjDx = dx + snap.dx;
        adjDy = dy + snap.dy;
        renderSnapGuides(snap.guides);
      }
      // Move every dragged element by the same (snapped) delta.
      dragState.origs.forEach(o => {
        const slide = getCurrentSlide();
        if (!slide) return;
        const el = slide.elements.find(x => x.id === o.id);
        if (!el) return;
        el.x = Math.round(o.origX + adjDx);
        el.y = Math.round(o.origY + adjDy);
      });
      renderCanvas();
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
  function buildExportHtml() {
    const usedGoogle = new Set();
    const usedWebfonts = new Set();
    state.slides.forEach(s => {
      (s.elements || []).forEach(el => {
        if (el.font && GOOGLE_FONT_SET.has(el.font)) usedGoogle.add(el.font);
        if (el.font && WEBFONT_SET.has(el.font)) usedWebfonts.add(el.font);
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
    if (usedWebfonts.size) {
      [...usedWebfonts].forEach(name => {
        if (linksHtml) linksHtml += '\n';
        linksHtml += '<link rel="stylesheet" href="' + WEBFONTS[name].cssUrl + '">';
      });
    }
    const exportData = {
      canvasW: state.canvasW,
      canvasH: state.canvasH,
      slides: state.slides,
    };
    const safeJson = JSON.stringify(exportData).replace(/</g, '\\u003c');
    const webfontsFamilyJson = JSON.stringify(
      Object.keys(WEBFONTS).reduce((acc, k) => { acc[k] = WEBFONTS[k].family; return acc; }, {})
    ).replace(/</g, '\\u003c');
    return EXPORT_TEMPLATE
      .replace('__GOOGLE_FONTS_LINKS__', () => linksHtml)
      .replace('__WEBFONTS_FAMILY_JSON__', () => webfontsFamilyJson)
      .replace('__SLIDES_JSON__', () => safeJson);
  }

  function saveToFile() {
    if (!state.slides.length) { alert('No slides to export.'); return; }
    const html = buildExportHtml();
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

  let previewWindow = null;
  function previewExport() {
    if (!state.slides.length) { alert('No slides to preview.'); return; }
    const html = buildExportHtml();
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
    if (Array.isArray(parsed)) {
      slides = parsed;
    } else if (parsed && typeof parsed === 'object') {
      slides = parsed.slides;
      if (typeof parsed.canvasW === 'number' && parsed.canvasW > 0) state.canvasW = parsed.canvasW;
      if (typeof parsed.canvasH === 'number' && parsed.canvasH > 0) state.canvasH = parsed.canvasH;
    }
    if (!Array.isArray(slides)) throw new Error('Invalid slide data');
    applyCanvasSize();
    applyLoadedSlides(slides);
  }
  function applyLoadedSlides(slides) {
    recordHistory();
    state.slides = slides;
    state.currentSlideId = slides.length ? slides[0].id : null;
    state.selectedElementId = null;
    state.slides.forEach(s => {
      if (typeof s.bgImage !== 'string') s.bgImage = '';
      (s.elements || []).forEach(el => {
        if (typeof el.link !== 'string') el.link = '';
        if (typeof el.hoverStrength !== 'number') el.hoverStrength = 1;
        if (typeof el.motionStrength !== 'number') el.motionStrength = 1;
        if (typeof el.opacity !== 'number') el.opacity = 1;
        if (typeof el.locked !== 'boolean') el.locked = false;
        if (typeof el.hidden !== 'boolean') el.hidden = false;
        if (el.stroke !== null && typeof el.stroke !== 'object') el.stroke = null;
        if (el.shadow !== null && typeof el.shadow !== 'object') el.shadow = null;
        if (el.type === 'text') {
          if (typeof el.letterSpacing !== 'number') el.letterSpacing = 0;
          if (typeof el.fontStretch !== 'number') el.fontStretch = 100;
          if (typeof el.bg !== 'string') el.bg = '';
          if (typeof el.lineHeight !== 'number') el.lineHeight = 1.3;
          if (typeof el.verticalAlign !== 'string') el.verticalAlign = 'center';
          if (typeof el.underline !== 'boolean') el.underline = false;
          if (typeof el.strikethrough !== 'boolean') el.strikethrough = false;
          if (typeof el.textCase !== 'string') el.textCase = 'none';
          if (typeof el.paragraphSpacing !== 'number') el.paragraphSpacing = 0;
          if (typeof el.html !== 'string' || !el.html) el.html = escapeHtml(el.text || '');
          autoSizeTextElement(el);
        }
        if (el.type === 'rect' && typeof el.radius !== 'number') el.radius = 4;
        if ((el.type === 'image' || el.type === 'video') && typeof el.radius !== 'number') el.radius = 0;
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
    const scale = Math.min(sw / state.canvasW, sh / state.canvasH);

    const inner = document.createElement('div');
    inner.style.position = 'absolute';
    inner.style.left = '50%';
    inner.style.top = '50%';
    inner.style.width = state.canvasW + 'px';
    inner.style.height = state.canvasH + 'px';
    inner.style.transform = 'translate(-50%, -50%) scale(' + scale + ')';
    inner.style.transformOrigin = 'center center';

    slide.elements.forEach((el, i) => {
      if (el.hidden) return;
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
    node.className = 'el ' + elTypeClass(el.type);
    node.style.left = el.x + 'px';
    node.style.top = el.y + 'px';
    node.style.width = el.w + 'px';
    node.style.height = el.h + 'px';
    node.style.setProperty('--hover-strength', String(el.hoverStrength != null ? el.hoverStrength : 1));
    node.style.setProperty('--motion-strength', String(el.motionStrength != null ? el.motionStrength : 1));
    if (el.rotation) node.style.setProperty('--rotation', el.rotation + 'deg');
    if (el.opacity != null && el.opacity < 1) node.style.opacity = String(el.opacity);
    if (el.type === 'text') {
      node.style.fontFamily = resolveFontFamily(el.font);
      node.style.fontSize = el.fontSize + 'px';
      node.style.fontWeight = String(el.fontWeight);
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
      // Text decoration must be on the actual text-bearing element. CSS
      // decorations don't paint across block-level descendants of a flex
      // container.
      const decos = [];
      if (el.underline) decos.push('underline');
      if (el.strikethrough) decos.push('line-through');
      if (decos.length) inner.style.textDecoration = decos.join(' ');
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
    } else if (el.type === 'image') {
      const img = document.createElement('img');
      img.src = el.src || '';
      img.draggable = false;
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.objectFit = el.fit || 'cover';
      img.style.display = 'block';
      img.style.borderRadius = (el.radius || 0) + 'px';
      node.appendChild(img);
    } else if (el.type === 'video') {
      const v = document.createElement('video');
      v.style.width = '100%';
      v.style.height = '100%';
      v.style.objectFit = el.fit || 'cover';
      v.style.display = 'block';
      v.style.borderRadius = (el.radius || 0) + 'px';
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
      } else if (el.type === 'image' || el.type === 'video') {
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
      } else if (el.type === 'image' || el.type === 'video' || el.type === 'linkcard') {
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
            presentIndex = i;
            renderPresent();
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
    syncZoomLabel(scale);
  }

  function setZoom(z) {
    recordHistory();
    state.zoom = z; // null = auto-fit; otherwise number
    fitCanvas();
    persist();
  }

  function zoomBy(factor) {
    // Compute current effective scale, then multiply.
    let cur = state.zoom;
    if (cur == null) {
      const cs = getComputedStyle(document.documentElement).getPropertyValue('--canvas-scale');
      cur = parseFloat(cs) || 1;
    }
    const next = Math.max(0.1, Math.min(8, cur * factor));
    setZoom(next);
  }

  function syncZoomLabel(scale) {
    if (!els.zoomLabel) return;
    if (state.zoom == null) {
      els.zoomLabel.textContent = 'Fit ' + Math.round(scale * 100) + '%';
    } else {
      els.zoomLabel.textContent = Math.round(scale * 100) + '%';
    }
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
    document.getElementById('btnPreview').addEventListener('click', previewExport);
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

    els.zoomLabel = document.getElementById('btnZoomLabel');
    if (els.zoomLabel) {
      els.zoomLabel.addEventListener('click', () => {
        // Cycle: Fit ??50 ??100 ??150 ??200 ??Fit
        const seq = [null, 0.5, 1, 1.5, 2];
        const cur = state.zoom;
        const idx = seq.findIndex(v => v === cur);
        setZoom(seq[(idx + 1) % seq.length]);
      });
    }
    const btnZoomIn = document.getElementById('btnZoomIn');
    if (btnZoomIn) {
      btnZoomIn.addEventListener('click', () => zoomBy(1.25));
    }
    const btnZoomOut = document.getElementById('btnZoomOut');
    if (btnZoomOut) {
      btnZoomOut.addEventListener('click', () => zoomBy(0.8));
    }
    const canvasWrapEl = document.getElementById('canvasWrap');
    if (canvasWrapEl) {
      canvasWrapEl.addEventListener('wheel', (e) => {
        if (!e.ctrlKey && !e.metaKey) return;
        e.preventDefault();
        zoomBy(e.deltaY < 0 ? 1.1 : 0.9);
      }, { passive: false });
    }

    document.addEventListener('mousemove', onGuideDragMove);
    document.addEventListener('mouseup', onGuideDragEnd);

    document.querySelectorAll('[data-add]').forEach(b => {
      b.addEventListener('click', () => addElement(b.dataset.add));
    });

    const ceTextarea = document.getElementById('contentEditorText');
    if (ceTextarea) {
      ceTextarea.addEventListener('input', () => {
        const el = getSelectedElement();
        if (!el || el.type !== 'text') return;
        const v = ceTextarea.value;
        updateElement(el.id, { text: v, html: escapeHtml(v) }, { skipPropsRender: true });
      });
    }

    els.canvas.addEventListener('mousedown', (e) => {
      // Click on empty canvas: deselect (or exit edit mode), then start marquee.
      if (e.target === els.canvas) {
        if (state.editingElementId) {
          state.editingElementId = null;
          renderCanvas();
          renderProperties();
        } else if (!e.shiftKey) {
          deselectElement();
        }
        beginMarquee(e);
      }
    });

    document.addEventListener('keydown', (e) => {
      if (!els.presentOverlay.hidden) return;
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.target.isContentEditable) return;
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
        if (k === 'v') {
          e.preventDefault();
          pasteClipboard();
          return;
        }
        if (k === 'd' && state.selectedElementId) {
          e.preventDefault();
          duplicateSelected();
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
    webfontsUsed = loadWebfontsUsedCache();
    rehydrateUsedGoogleFonts();
    rehydrateUsedWebfonts();
    restoreSidebarWidth();
    setupSidebarResizer();
    setupSlideListObserver();

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
        if (typeof el.hoverStrength !== 'number') el.hoverStrength = 1;
        if (typeof el.motionStrength !== 'number') el.motionStrength = 1;
        if (typeof el.opacity !== 'number') el.opacity = 1;
        if (typeof el.locked !== 'boolean') el.locked = false;
        if (typeof el.hidden !== 'boolean') el.hidden = false;
        if (el.stroke !== null && typeof el.stroke !== 'object') el.stroke = null;
        if (el.shadow !== null && typeof el.shadow !== 'object') el.shadow = null;
        if (el.type === 'text') {
          if (typeof el.letterSpacing !== 'number') el.letterSpacing = 0;
          if (typeof el.fontStretch !== 'number') el.fontStretch = 100;
          if (typeof el.bg !== 'string') el.bg = '';
          if (typeof el.lineHeight !== 'number') el.lineHeight = 1.3;
          if (typeof el.verticalAlign !== 'string') el.verticalAlign = 'center';
          if (typeof el.underline !== 'boolean') el.underline = false;
          if (typeof el.strikethrough !== 'boolean') el.strikethrough = false;
          if (typeof el.textCase !== 'string') el.textCase = 'none';
          if (typeof el.paragraphSpacing !== 'number') el.paragraphSpacing = 0;
          if (typeof el.html !== 'string' || !el.html) el.html = escapeHtml(el.text || '');
          autoSizeTextElement(el);
        }
        if (el.type === 'rect' && typeof el.radius !== 'number') el.radius = 4;
        if ((el.type === 'image' || el.type === 'video') && typeof el.radius !== 'number') el.radius = 0;
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
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();


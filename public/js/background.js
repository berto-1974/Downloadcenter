(function () {
  'use strict';

  var style = document.createElement('style');
  style.textContent = [
    '@keyframes blob1{0%,100%{transform:translate(0,0) scale(1)}20%{transform:translate(180px,-140px) scale(1.18)}45%{transform:translate(-160px,200px) scale(0.88)}70%{transform:translate(200px,120px) scale(1.12)}85%{transform:translate(-80px,-100px) scale(0.95)}}',
    '@keyframes blob2{0%,100%{transform:translate(0,0) scale(1)}25%{transform:translate(-220px,160px) scale(0.85)}50%{transform:translate(180px,-180px) scale(1.15)}75%{transform:translate(-120px,-140px) scale(0.92)}}',
    '@keyframes blob3{0%,100%{transform:translate(0,0) scale(1)}30%{transform:translate(160px,200px) scale(1.14)}60%{transform:translate(-200px,-120px) scale(0.88)}85%{transform:translate(120px,-80px) scale(1.08)}}',
  ].join('');
  document.head.appendChild(style);

  var wrapper = document.createElement('div');
  wrapper.id = 'dc-bg';
  wrapper.style.cssText = 'position:fixed;inset:0;z-index:-1;pointer-events:none;overflow:hidden;transition:opacity 0.5s ease;';

  [
    'top:-20%;left:5%;width:1000px;height:1000px;background:radial-gradient(circle,rgba(139,92,246,0.32) 0%,rgba(139,92,246,0.12) 40%,transparent 70%);animation:blob1 22s ease-in-out infinite;',
    'bottom:-20%;right:5%;width:950px;height:950px;background:radial-gradient(circle,rgba(99,102,241,0.28) 0%,rgba(99,102,241,0.10) 40%,transparent 70%);animation:blob2 28s ease-in-out infinite;',
    'top:20%;right:15%;width:700px;height:700px;background:radial-gradient(circle,rgba(217,70,239,0.22) 0%,rgba(217,70,239,0.08) 40%,transparent 70%);animation:blob3 19s ease-in-out infinite;',
  ].forEach(function (s) {
    var el = document.createElement('div');
    el.style.cssText = 'position:absolute;border-radius:50%;will-change:transform;' + s;
    wrapper.appendChild(el);
  });

  document.body.insertBefore(wrapper, document.body.firstChild);

  function syncTheme() {
    var dark = document.documentElement.getAttribute('data-bs-theme') !== 'light';
    wrapper.style.opacity = dark ? '1' : '0';
  }
  syncTheme();
  new MutationObserver(syncTheme).observe(document.documentElement, {
    attributes: true, attributeFilter: ['data-bs-theme']
  });
})();

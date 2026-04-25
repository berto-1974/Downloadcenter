(function () {
  'use strict';

  var style = document.createElement('style');
  style.textContent = [
    '@keyframes blob1{0%,100%{transform:translate(0,0) scale(1)}25%{transform:translate(80px,-60px) scale(1.12)}50%{transform:translate(-50px,80px) scale(0.92)}75%{transform:translate(60px,40px) scale(1.06)}}',
    '@keyframes blob2{0%,100%{transform:translate(0,0) scale(1)}25%{transform:translate(-90px,55px) scale(0.90)}50%{transform:translate(70px,-70px) scale(1.10)}75%{transform:translate(-40px,-50px) scale(0.96)}}',
    '@keyframes blob3{0%,100%{transform:translate(0,0) scale(1)}30%{transform:translate(55px,75px) scale(1.08)}60%{transform:translate(-65px,-45px) scale(0.94)}90%{transform:translate(30px,-30px) scale(1.04)}}',
  ].join('');
  document.head.appendChild(style);

  var wrapper = document.createElement('div');
  wrapper.id = 'dc-bg';
  wrapper.style.cssText = 'position:fixed;inset:0;z-index:-1;pointer-events:none;overflow:hidden;transition:opacity 0.5s ease;';

  [
    'top:-12%;left:12%;width:750px;height:750px;background:radial-gradient(circle,rgba(139,92,246,0.28) 0%,rgba(139,92,246,0.10) 40%,transparent 70%);animation:blob1 20s ease-in-out infinite;',
    'bottom:-12%;right:10%;width:700px;height:700px;background:radial-gradient(circle,rgba(99,102,241,0.24) 0%,rgba(99,102,241,0.08) 40%,transparent 70%);animation:blob2 25s ease-in-out infinite;',
    'top:25%;right:22%;width:500px;height:500px;background:radial-gradient(circle,rgba(217,70,239,0.18) 0%,rgba(217,70,239,0.06) 40%,transparent 70%);animation:blob3 17s ease-in-out infinite;',
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

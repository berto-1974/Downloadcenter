(function () {
  'use strict';

  var wrapper = document.createElement('div');
  wrapper.id = 'dc-bg';
  wrapper.style.cssText =
    'position:fixed;inset:0;z-index:-1;pointer-events:none;overflow:hidden;transition:opacity 0.5s ease;';

  var blobs = [
    'position:absolute;top:-8%;left:18%;width:640px;height:640px;background:radial-gradient(circle,rgba(139,92,246,0.13) 0%,transparent 68%);animation:dc-pulse 10s ease-in-out infinite;',
    'position:absolute;bottom:-8%;right:18%;width:600px;height:600px;background:radial-gradient(circle,rgba(99,102,241,0.11) 0%,transparent 68%);animation:dc-pulse 13s ease-in-out infinite 2s;',
    'position:absolute;top:28%;right:28%;width:380px;height:380px;background:radial-gradient(circle,rgba(217,70,239,0.07) 0%,transparent 68%);animation:dc-pulse 9s ease-in-out infinite 1s;',
  ];

  blobs.forEach(function (s) {
    var el = document.createElement('div');
    el.style.cssText = s;
    wrapper.appendChild(el);
  });

  var style = document.createElement('style');
  style.textContent = '@keyframes dc-pulse{0%,100%{opacity:1}50%{opacity:0.65}}';
  document.head.appendChild(style);

  document.body.insertBefore(wrapper, document.body.firstChild);

  function syncTheme() {
    var dark = document.documentElement.getAttribute('data-bs-theme') !== 'light';
    wrapper.style.opacity = dark ? '1' : '0';
  }

  syncTheme();
  new MutationObserver(syncTheme).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-bs-theme'],
  });
})();

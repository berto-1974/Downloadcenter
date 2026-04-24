(function () {
  'use strict';

  const canvas = document.createElement('canvas');
  canvas.id = 'mesh-bg';
  canvas.style.cssText =
    'position:fixed;top:0;left:0;width:100%;height:100%;z-index:-1;pointer-events:none;transition:opacity 0.6s ease;';
  document.body.insertBefore(canvas, document.body.firstChild);

  const ctx = canvas.getContext('2d');
  let W = 0, H = 0;

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  // Orbs — monochrome dark palette, mirroring the demo colors
  // (["#000000", "#1a1a1a", "#333333", "#ffffff"])
  const orbs = [
    { bx: 0.25, by: 0.30, r: 0.62, color: '#1a1a1a', sx: 0.00022, sy: 0.00017 },
    { bx: 0.72, by: 0.55, r: 0.58, color: '#252525', sx: 0.00015, sy: 0.00028 },
    { bx: 0.48, by: 0.78, r: 0.55, color: '#2e2e2e', sx: 0.00031, sy: 0.00013 },
    { bx: 0.15, by: 0.62, r: 0.50, color: '#111111', sx: 0.00018, sy: 0.00036 },
    { bx: 0.82, by: 0.22, r: 0.48, color: '#333333', sx: 0.00038, sy: 0.00021 },
    // Brighter highlight orbs for the white glints
    { bx: 0.42, by: 0.38, r: 0.22, color: '#4a4a4a', sx: 0.00052, sy: 0.00041 },
    { bx: 0.63, by: 0.70, r: 0.18, color: '#404040', sx: 0.00029, sy: 0.00055 },
    { bx: 0.58, by: 0.18, r: 0.16, color: '#555555', sx: 0.00044, sy: 0.00032 },
  ];

  function drawFrame(ts) {
    const t = ts * 0.001; // seconds

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, W, H);

    ctx.globalCompositeOperation = 'screen';

    for (const orb of orbs) {
      const x = (orb.bx + Math.sin(t * orb.sx * 2000) * 0.20) * W;
      const y = (orb.by + Math.cos(t * orb.sy * 2000) * 0.16) * H;
      const r = orb.r * Math.min(W, H);

      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0,   orb.color);
      g.addColorStop(0.4, orb.color + 'bb');
      g.addColorStop(1,   'transparent');

      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = g;
      ctx.fill();
    }

    ctx.globalCompositeOperation = 'source-over';
    requestAnimationFrame(drawFrame);
  }

  requestAnimationFrame(drawFrame);

  // Nur im Dark-Mode sichtbar
  function syncTheme() {
    const dark = document.documentElement.getAttribute('data-bs-theme') !== 'light';
    canvas.style.opacity = dark ? '1' : '0';
  }

  syncTheme();

  new MutationObserver(syncTheme).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-bs-theme'],
  });
})();

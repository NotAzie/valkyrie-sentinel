const canvas = document.getElementById('radarCanvas');
if (canvas) {
  const ctx = canvas.getContext('2d');
  const cx = 200, cy = 200, radius = 180;

  function drawRadar() {
    ctx.clearRect(0, 0, 400, 400);

    // Range rings
    ctx.strokeStyle = '#21262d';
    ctx.lineWidth = 1;
    [0.25, 0.5, 0.75, 1.0].forEach(factor => {
      ctx.beginPath();
      ctx.arc(cx, cy, radius * factor, 0, Math.PI * 2);
      ctx.stroke();
    });

    // Crosshairs
    ctx.beginPath();
    ctx.moveTo(cx, cy - radius); ctx.lineTo(cx, cy + radius);
    ctx.moveTo(cx - radius, cy); ctx.lineTo(cx + radius, cy);
    ctx.stroke();

    // Center bot blip
    ctx.fillStyle = '#58a6ff';
    ctx.beginPath();
    ctx.arc(cx, cy, 4, 0, Math.PI * 2);
    ctx.fill();

    requestAnimationFrame(drawRadar);
  }
  drawRadar();
}

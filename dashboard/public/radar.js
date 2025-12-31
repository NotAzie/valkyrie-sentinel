const canvas = document.getElementById('radarCanvas');
if (canvas) {
  const ctx = canvas.getContext('2d');
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const maxRadius = 200;

  let scanAngle = 0;
  let sweepSpeed = 0.035;

  let simulatedEntities = [
    { name: 'Hostile_01', x: 55, y: -40, vx: -0.8, vy: 0.5, hostile: true, isTarget: true },
    { name: 'Hostile_02', x: -85, y: -60, vx: 0.6, vy: 0.4, hostile: true, isTarget: false },
    { name: 'Hostile_03', x: 30, y: 110, vx: -0.2, vy: -0.7, hostile: true, isTarget: false },
    { name: 'Friendly_Sentry', x: -40, y: 70, vx: 0.1, vy: -0.1, hostile: false, isTarget: false }
  ];

  function drawRadar() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Range Rings
    ctx.lineWidth = 1;
    [0.2, 0.4, 0.6, 0.8, 1.0].forEach((factor, idx) => {
      ctx.strokeStyle = '#1e2630';
      ctx.beginPath();
      ctx.arc(cx, cy, maxRadius * factor, 0, Math.PI * 2);
      ctx.stroke();

      // Range text
      ctx.fillStyle = '#484f58';
      ctx.font = '9px monospace';
      ctx.fillText(`${(factor * 50).toFixed(0)}m`, cx + 4, cy - (maxRadius * factor) + 10);
    });

    // 2. Crosshairs
    ctx.strokeStyle = '#21262d';
    ctx.beginPath();
    ctx.moveTo(cx, cy - maxRadius); ctx.lineTo(cx, cy + maxRadius);
    ctx.moveTo(cx - maxRadius, cy); ctx.lineTo(cx + maxRadius, cy);
    ctx.stroke();

    // 3. Rotating Scan Sweep
    scanAngle = (scanAngle + sweepSpeed) % (Math.PI * 2);
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxRadius);
    grad.addColorStop(0, 'rgba(88, 166, 255, 0.12)');
    grad.addColorStop(1, 'rgba(88, 166, 255, 0.0)');

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, maxRadius, scanAngle - 0.4, scanAngle);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.restore();

    // 4. Center Bot (Self)
    ctx.fillStyle = '#58a6ff';
    ctx.shadowColor = '#58a6ff';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Self 3.0m reach boundary circle
    const reachPixelRadius = (3.0 / 50.0) * maxRadius;
    ctx.strokeStyle = 'rgba(88, 166, 255, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    ctx.arc(cx, cy, reachPixelRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // 5. Entities & CHI Reach Cone
    simulatedEntities.forEach(ent => {
      // Scale position drift slightly for realism
      ent.x += ent.vx * 0.1;
      ent.y += ent.vy * 0.1;

      // Bounce within radius
      const d = Math.hypot(ent.x, ent.y);
      if (d > maxRadius - 10) {
        ent.vx *= -1;
        ent.vy *= -1;
      }

      const ex = cx + ent.x;
      const ey = cy + ent.y;

      if (ent.isTarget) {
        // Draw Causal Horizon Inversion (CHI) predicted future reach cone
        const predX = ex + ent.vx * 15;
        const predY = ey + ent.vy * 15;

        ctx.strokeStyle = 'rgba(188, 140, 255, 0.7)';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(ex, ey);
        ctx.lineTo(predX, predY);
        ctx.stroke();

        ctx.fillStyle = 'rgba(188, 140, 255, 0.3)';
        ctx.beginPath();
        ctx.arc(predX, predY, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.setLineDash([]);

        // Primary Target Blip
        ctx.fillStyle = '#ff7b72';
        ctx.shadowColor = '#ff7b72';
        ctx.shadowBlur = 6;
      } else if (ent.hostile) {
        ctx.fillStyle = '#d29922';
        ctx.shadowBlur = 0;
      } else {
        ctx.fillStyle = '#3fb950';
        ctx.shadowBlur = 0;
      }

      ctx.beginPath();
      ctx.arc(ex, ey, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Velocity trail
      ctx.strokeStyle = ctx.fillStyle;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(ex, ey);
      ctx.lineTo(ex + ent.vx * 8, ey + ent.vy * 8);
      ctx.stroke();

      // Label
      ctx.fillStyle = '#8b949e';
      ctx.font = '8px monospace';
      ctx.fillText(ent.name, ex + 7, ey + 3);
    });

    requestAnimationFrame(drawRadar);
  }
  drawRadar();

  // Telemetry Polling
  async function fetchTelemetry() {
    try {
      const res = await fetch('/api/telemetry');
      if (res.ok) {
        const data = await res.json();
        const stateEl = document.getElementById('telemetry-state');
        const healthEl = document.getElementById('telemetry-health');
        const healthBar = document.getElementById('health-bar-fill');
        const latencyEl = document.getElementById('telemetry-latency');
        const targetsEl = document.getElementById('telemetry-targets');
        const lockEl = document.getElementById('telemetry-lock');

        if (stateEl) stateEl.textContent = data.state || 'STANDBY';
        if (healthEl) healthEl.textContent = `${(data.health || 20).toFixed(1)} / 20.0 HP`;
        if (healthBar) healthBar.style.width = `${((data.health || 20) / 20.0) * 100}%`;
        if (latencyEl) latencyEl.textContent = `${(data.tickLatencyMs || 0).toFixed(2)} ms`;
        if (targetsEl) targetsEl.textContent = String(data.activeTargets || 0);
        if (lockEl) lockEl.textContent = data.targetLock || 'NONE';
      }
    } catch (_) {}
    setTimeout(fetchTelemetry, 200);
  }
  fetchTelemetry();

  // Clock
  setInterval(() => {
    const clockEl = document.getElementById('hud-clock');
    if (clockEl) {
      clockEl.textContent = new Date().toISOString().substring(11, 19) + ' UTC';
    }
  }, 1000);
}

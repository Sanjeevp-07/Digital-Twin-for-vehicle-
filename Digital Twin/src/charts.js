// Real-time Multi-Channel Rolling Telemetry Time-Series Oscilloscope

export class TelemetryCharts {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.maxPoints = 80;

    this.history = {
      rpm: [],
      speed: [],
      coolant: [],
      oilPress: [],
      boost: [],
      fuelFlow: []
    };
  }

  pushSample(telemetry) {
    if (!telemetry) return;

    this.history.rpm.push(telemetry.rpm || 0);
    this.history.speed.push(telemetry.speedKmh || 0);
    this.history.coolant.push(telemetry.coolantTemp || 25);
    this.history.oilPress.push(telemetry.oilPressure || 0);
    this.history.boost.push(telemetry.boostPressure || 0);
    this.history.fuelFlow.push(telemetry.fuelFlowRate || 0);

    for (let key in this.history) {
      if (this.history[key].length > this.maxPoints) {
        this.history[key].shift();
      }
    }

    this.render();
  }

  render() {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.clearRect(0, 0, w, h);

    // Grid
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 35) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 22) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    const drawTrace = (dataArray, minVal, maxVal, strokeColor, lineWidth = 1.8) => {
      if (dataArray.length < 2) return;
      ctx.beginPath();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = lineWidth;

      for (let i = 0; i < dataArray.length; i++) {
        const val = dataArray[i];
        const x = (i / (this.maxPoints - 1)) * w;
        const norm = Math.max(0, Math.min(1, (val - minVal) / (maxVal - minVal)));
        const y = h - 6 - norm * (h - 14);

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Glowing live dot
      const lastX = ((dataArray.length - 1) / (this.maxPoints - 1)) * w;
      const lastVal = dataArray[dataArray.length - 1];
      const lastNorm = Math.max(0, Math.min(1, (lastVal - minVal) / (maxVal - minVal)));
      const lastY = h - 6 - lastNorm * (h - 14);

      ctx.beginPath();
      ctx.arc(lastX, lastY, 3, 0, Math.PI * 2);
      ctx.fillStyle = strokeColor;
      ctx.fill();
    };

    // Traces
    drawTrace(this.history.rpm, 0, 8000, '#00e5ff', 2.0);
    drawTrace(this.history.coolant, 20, 120, '#ef4444', 1.6);
    drawTrace(this.history.boost, -1.0, 2.0, '#f59e0b', 1.6);
    drawTrace(this.history.oilPress, 0, 6.0, '#38bdf8', 1.4);
  }
}


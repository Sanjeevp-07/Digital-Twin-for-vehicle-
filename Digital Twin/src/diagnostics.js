// Connected Vehicle Health Diagnostics & Predictive Analytics Manager

export class DiagnosticsManager {
  constructor() {
    this.dtcListEl = document.getElementById('dtc-list');
    this.terminalEl = document.getElementById('ingest-log');
  }

  logTerminal(msg, type = 'normal') {
    if (!this.terminalEl) return;
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds().toString().padStart(3, '0')}`;
    
    const entry = document.createElement('div');
    entry.className = `term-entry ${type}`;
    entry.innerHTML = `<span style="color:#64748b;">[${timeStr}]</span> ${msg}`;
    this.terminalEl.appendChild(entry);
    this.terminalEl.scrollTop = this.terminalEl.scrollHeight;

    if (this.terminalEl.children.length > 100) {
      this.terminalEl.removeChild(this.terminalEl.children[0]);
    }
  }

  updateHealthMatrix(health) {
    if (!health) return;

    // Overall Health
    const overallEl = document.getElementById('val-health-overall');
    const overallBar = document.getElementById('bar-health-overall');
    if (overallEl) {
      overallEl.innerText = `${health.overall}%`;
      overallEl.style.color = health.overall > 80 ? 'var(--color-green)' : health.overall > 60 ? 'var(--color-amber)' : 'var(--color-red)';
    }
    if (overallBar) {
      overallBar.style.width = `${health.overall}%`;
      overallBar.style.backgroundColor = overallEl ? overallEl.style.color : 'var(--color-green)';
    }

    // Powertrain
    const ptEl = document.getElementById('val-health-powertrain');
    const ptBar = document.getElementById('bar-health-powertrain');
    if (ptEl) ptEl.innerText = `${health.powertrain}%`;
    if (ptBar) ptBar.style.width = `${health.powertrain}%`;

    // Cooling
    const coolEl = document.getElementById('val-health-cooling');
    const coolBar = document.getElementById('bar-health-cooling');
    if (coolEl) coolEl.innerText = `${health.cooling}%`;
    if (coolBar) coolBar.style.width = `${health.cooling}%`;

    // Fuel System
    const fuelEl = document.getElementById('val-health-fuel');
    const fuelBar = document.getElementById('bar-health-fuel');
    if (fuelEl) fuelEl.innerText = `${health.fuelSystem}%`;
    if (fuelBar) fuelBar.style.width = `${health.fuelSystem}%`;

    // Status pill
    const statusPill = document.getElementById('vehicle-health-badge');
    if (statusPill) {
      statusPill.innerText = health.status;
      statusPill.style.color = health.overall > 80 ? 'var(--color-green)' : health.overall > 60 ? 'var(--color-amber)' : 'var(--color-red)';
      statusPill.style.borderColor = statusPill.style.color;
    }
  }

  updateDTCList(dtcs) {
    if (!this.dtcListEl) return;
    this.dtcListEl.innerHTML = '';

    if (!dtcs || dtcs.length === 0) {
      this.dtcListEl.innerHTML = `
        <div style="text-align:center; padding:18px 0; color:#10b981; font-family:var(--font-mono); font-size:11px;">
          ✓ NO ACTIVE FAULT CODES DETECTED (ECU OBD-II OK)
        </div>
      `;
      return;
    }

    for (let dtc of dtcs) {
      const item = document.createElement('div');
      item.className = `dtc-item ${dtc.severity.toLowerCase()}`;
      item.innerHTML = `
        <div style="display:flex; align-items:center; gap:8px;">
          <span class="dtc-code" style="color:${dtc.severity === 'CRITICAL' ? '#ef4444' : '#f59e0b'};">${dtc.code}</span>
          <span style="font-size:9px; background:rgba(255,255,255,0.08); padding:2px 5px; border-radius:3px;">${dtc.system}</span>
          <span class="dtc-desc">${dtc.description}</span>
        </div>
        <div style="font-family:var(--font-mono); font-size:9px; color:#94a3b8;">${dtc.severity}</div>
      `;
      this.dtcListEl.appendChild(item);
    }
  }
}


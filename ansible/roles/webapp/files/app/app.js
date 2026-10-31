// Fetch live metadata and backend API health
async function fetchMetadata() {
  try {
    // 1. Check host metadata
    const res = await fetch('/healthz');
    if (res.ok) {
      const data = await res.json();
      if (document.getElementById('val-webserver')) {
        document.getElementById('val-webserver').textContent = (data.frontend || 'NGINX').toUpperCase();
      }
    }
  } catch (err) {
    // offline or local
  }

  // 2. Query 3-Tier Backend API (/api/health)
  try {
    const apiRes = await fetch('/api/health');
    if (apiRes.ok) {
      const apiData = await apiRes.json();
      const backendEl = document.getElementById('backend-status');
      if (backendEl) {
        backendEl.textContent = `${apiData.framework || 'Backend API'} (Active)`;
        backendEl.className = 'status-badge ok';
      }
    }
  } catch (err) {
    const backendEl = document.getElementById('backend-status');
    if (backendEl) {
      backendEl.textContent = 'API Offline';
      backendEl.className = 'status-badge warning';
    }
  }

  // 3. Query Backend Data records (/api/data)
  try {
    const dataRes = await fetch('/api/data');
    if (dataRes.ok) {
      const payload = await dataRes.json();
      const recordsContainer = document.getElementById('api-records-list');
      if (recordsContainer && payload.records) {
        recordsContainer.innerHTML = payload.records.map(r => `
          <div style="display:flex; justify-content:space-between; padding:0.5rem 0; border-bottom:1px solid rgba(255,255,255,0.05); font-size:0.83rem;">
            <span>${r.task || r.service || r.name}</span>
            <span style="color:#38bdf8; font-family:monospace;">${r.status || 'OK'}</span>
          </div>
        `).join('');
      }
    }
  } catch (err) {
    // static mode
  }
}

document.addEventListener('DOMContentLoaded', () => {
  fetchMetadata();
  setInterval(fetchMetadata, 8000);
});

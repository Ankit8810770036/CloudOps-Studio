// Fetch live metadata from healthz.json
async function fetchMetadata() {
  try {
    const res = await fetch('/healthz.json');
    if (res.ok) {
      const data = await res.json();
      document.getElementById('val-webserver').textContent = data.web_server?.toUpperCase() || 'NGINX';
      document.getElementById('node-hostname').textContent = data.hostname || window.location.hostname;
      document.getElementById('node-os').textContent = data.os || 'Ubuntu Linux 22.04 LTS';
      document.getElementById('node-ip').textContent = window.location.host;
      document.getElementById('node-timestamp').textContent = new Date().toLocaleTimeString();
    }
  } catch (err) {
    // Fallback if accessed locally
    document.getElementById('node-hostname').textContent = window.location.hostname || 'cloud-ec2-node';
    document.getElementById('node-ip').textContent = window.location.host || '80 (TCP)';
    document.getElementById('node-timestamp').textContent = new Date().toLocaleTimeString();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  fetchMetadata();
  setInterval(fetchMetadata, 10000);
});

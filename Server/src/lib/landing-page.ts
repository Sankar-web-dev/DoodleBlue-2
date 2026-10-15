/** Renders the branded landing page served at GET /. */
export function renderLandingPage(opts: {
  version: string;
  uptimeSeconds: number;
  docsEnabled: boolean;
}): string {
  const { version, uptimeSeconds, docsEnabled } = opts;
  const uptime = formatUptime(uptimeSeconds);

  const docsLink = docsEnabled
    ? `<a class="btn primary" href="/api-docs">API Docs</a>`
    : "";

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>CampusConnect API</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    background: #12101c;
    color: #eceaf4;
    background-image:
      radial-gradient(at 0% 0%, oklch(0.52 0.22 275 / 0.25) 0px, transparent 48%),
      radial-gradient(at 100% 0%, oklch(0.74 0.16 72 / 0.15) 0px, transparent 45%),
      radial-gradient(at 50% 100%, oklch(0.65 0.15 220 / 0.15) 0px, transparent 48%);
  }
  .card {
    text-align: center;
    padding: 48px 56px;
    border-radius: 24px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(255, 255, 255, 0.03);
    backdrop-filter: blur(16px);
    box-shadow: 0 24px 60px -12px rgba(0, 0, 0, 0.5);
  }
  .mark {
    width: 56px; height: 56px;
    margin: 0 auto 20px;
    border-radius: 16px;
    display: flex; align-items: center; justify-content: center;
    font-weight: 800; font-size: 20px; letter-spacing: -0.02em;
    color: #fff;
    background: linear-gradient(135deg, oklch(0.52 0.22 275), oklch(0.65 0.15 220));
    box-shadow: 0 8px 24px -4px oklch(0.52 0.22 275 / 0.5);
  }
  h1 {
    font-size: 28px; font-weight: 800; letter-spacing: -0.02em;
    background: linear-gradient(135deg, oklch(0.75 0.15 275), oklch(0.78 0.14 72));
    -webkit-background-clip: text; background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  .sub { margin-top: 6px; font-size: 14px; color: rgba(236, 234, 244, 0.55); }
  .status {
    display: inline-flex; align-items: center; gap: 8px;
    margin-top: 24px; padding: 6px 14px;
    border-radius: 999px; font-size: 13px; font-weight: 600;
    color: #4ade80; background: rgba(74, 222, 128, 0.1);
    border: 1px solid rgba(74, 222, 128, 0.25);
  }
  .dot { width: 8px; height: 8px; border-radius: 50%; background: #4ade80; animation: pulse 2s infinite; }
  @keyframes pulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(74, 222, 128, 0.5); }
    50% { box-shadow: 0 0 0 6px rgba(74, 222, 128, 0); }
  }
  .meta {
    margin-top: 20px; font-size: 12px; color: rgba(236, 234, 244, 0.4);
    font-family: ui-monospace, "JetBrains Mono", monospace;
  }
  .meta span { margin: 0 8px; }
  .actions { margin-top: 28px; display: flex; gap: 10px; justify-content: center; }
  .btn {
    padding: 10px 20px; border-radius: 12px;
    font-size: 13px; font-weight: 600; text-decoration: none;
    transition: transform 0.15s ease, box-shadow 0.15s ease;
  }
  .btn:hover { transform: translateY(-1px); }
  .btn.primary {
    color: #fff;
    background: linear-gradient(135deg, oklch(0.52 0.22 275), oklch(0.60 0.19 275));
    box-shadow: 0 6px 20px -4px oklch(0.52 0.22 275 / 0.5);
  }
  .btn.ghost {
    color: rgba(236, 234, 244, 0.75);
    border: 1px solid rgba(255, 255, 255, 0.12);
    background: rgba(255, 255, 255, 0.04);
  }
</style>
</head>
<body>
  <div class="card">
    <div class="mark">CC</div>
    <h1>CampusConnect API</h1>
    <p class="sub">Clubs, events, attendance &amp; certificates service</p>
    <div><span class="status"><span class="dot"></span>Operational</span></div>
    <p class="meta"><span>v${version}</span><span>&middot;</span><span>uptime ${uptime}</span></p>
    <div class="actions">
      ${docsLink}
      <a class="btn ghost" href="/api/v1/health">Health check</a>
    </div>
  </div>
</body>
</html>`;
}

function formatUptime(seconds: number): string {
  const s = Math.floor(seconds);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}

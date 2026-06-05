
export default async function handler(req, res) {
  // Define os cabeçalhos para o dashboard de logs
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  
  const logs = global.webhookLogs || [];
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>VAPEX Webhook Logs</title>
        <style>
          body { font-family: -apple-system, system-ui, sans-serif; background: #050505; color: #eee; padding: 20px; }
          .container { max-width: 1000px; margin: 0 auto; }
          .log-entry { background: #111; border: 1px solid #222; border-radius: 12px; padding: 20px; margin-bottom: 20px; }
          .timestamp { color: #888; font-size: 0.8rem; margin-bottom: 10px; }
          .status { display: inline-block; padding: 3px 10px; border-radius: 5px; font-size: 0.75rem; font-weight: bold; margin-bottom: 10px; }
          .status-paid { background: #065f46; color: #34d399; }
          .status-pending { background: #1e3a8a; color: #60a5fa; }
          .json { background: #000; padding: 15px; border-radius: 8px; font-family: monospace; font-size: 0.85rem; overflow-x: auto; white-space: pre-wrap; margin-top: 10px; }
          h1 { color: #fff; border-bottom: 1px solid #333; pb: 10px; }
          .label { font-weight: bold; color: #aaa; margin-top: 15px; display: block; }
          .badge { background: #333; color: #fff; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; margin-right: 5px; }
          .badge-success { background: #059669; }
          .badge-error { background: #dc2626; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Dashboard de Webhooks (Últimos 20)</h1>
          ${logs.length === 0 ? '<p>Nenhum log registrado ainda.</p>' : logs.map((log, index) => `
            <div class="log-entry">
              <div class="timestamp">#${logs.length - index} - ${new Date(log.timestamp).toLocaleString('pt-BR')}</div>
              <div class="status ${log.isPaidChecked ? 'status-paid' : 'status-pending'}">
                ${log.isPaidChecked ? 'PAGAMENTO APROVADO' : 'NOTIFICAÇÃO RECEBIDA'}
              </div>
              
              <div>
                <span class="badge ${log.utmifyCalled ? 'badge-success' : ''}">Utmify: ${log.utmifyCalled ? 'ENVIADO' : 'PULADO'}</span>
                <span class="badge ${log.dialogCalled ? 'badge-success' : ''}">DiaLOG: ${log.dialogCalled ? 'ENVIADO' : 'PULADO'}</span>
                ${log.error ? `<span class="badge badge-error">ERRO: ${log.error}</span>` : ''}
              </div>

              <span class="label">Webhook Body:</span>
              <div class="json">${JSON.stringify(log.body, null, 2)}</div>

              ${log.utmifyResult ? `
                <span class="label">Utmify Response:</span>
                <div class="json">${JSON.stringify(log.utmifyResult, null, 2)}</div>
              ` : ''}
              
              ${log.utmifyPayloadSent ? `
                <span class="label">Payload Enviado Utmify:</span>
                <div class="json">${JSON.stringify(log.utmifyPayloadSent, null, 2)}</div>
              ` : ''}
            </div>
          `).join('')}
        </div>
      </body>
    </html>
  `;
  
  return res.status(200).send(html);
}

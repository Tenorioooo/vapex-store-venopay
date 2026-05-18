import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { Play, Save, CheckCircle, AlertTriangle, Terminal, RefreshCw, Globe } from 'lucide-react';

export default function IntegrationsPage() {
  const [webhookUrl, setWebhookUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ status: number; body: string } | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Carregar dados na inicialização
  useEffect(() => {
    async function loadData() {
      if (!import.meta.env.VITE_SUPABASE_URL) {
        setLoadingLogs(false);
        return;
      }

      try {
        // Carrega a configuração atual
        const { data: settingData } = await (supabase as any)
          .from('system_settings')
          .select('value')
          .eq('key', 'DIALOG_WEBHOOK_URL')
          .maybeSingle();

        if (settingData) {
          setWebhookUrl(settingData.value);
        }

        // Carrega histórico de logs
        await loadLogs();
      } catch (err) {
        console.error("Erro ao carregar dados do DiaLOG:", err);
      } finally {
        setLoadingLogs(false);
      }
    }

    loadData();
  }, []);

  async function loadLogs() {
    if (!import.meta.env.VITE_SUPABASE_URL) return;
    try {
      const { data } = await (supabase as any)
        .from('dialog_webhook_logs')
        .select('*')
        .order('sent_at', { ascending: false })
        .limit(10);

      if (data) {
        setLogs(data);
      }
    } catch (err) {
      console.error("Erro ao carregar logs:", err);
    }
  }

  async function handleSave() {
    if (!import.meta.env.VITE_SUPABASE_URL) {
      setMessage({ type: 'error', text: 'Supabase não está configurado neste ambiente.' });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const { error } = await (supabase as any)
        .from('system_settings')
        .upsert({
          key: 'DIALOG_WEBHOOK_URL',
          value: webhookUrl.trim(),
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      setMessage({ type: 'success', text: 'Configuração salva com sucesso!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      setMessage({ type: 'error', text: `Erro ao salvar: ${err.message}` });
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    if (!webhookUrl.trim()) {
      setMessage({ type: 'error', text: 'Por favor, insira uma URL de webhook válida para testar.' });
      return;
    }

    setTesting(true);
    setTestResult(null);
    setMessage(null);

    try {
      const response = await fetch('/api/dialog-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhookUrl: webhookUrl.trim() }),
      });

      const data = await response.json();
      setTestResult(data);

      if (response.ok && data.status >= 200 && data.status < 300) {
        setMessage({ type: 'success', text: 'Teste de conexão concluído com sucesso!' });
        await loadLogs();
      } else {
        setMessage({ type: 'error', text: `O servidor de webhook retornou status ${data.status || response.status}` });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: `Erro na requisição de teste: ${err.message}` });
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#050505] pt-32 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Cabeçalho */}
        <div className="mb-8 flex items-center gap-3">
          <div className="p-3 bg-cyan-500/10 rounded-2xl text-cyan-400">
            <Globe size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white font-sans">Integrações Externas</h1>
            <p className="text-gray-400 text-sm mt-0.5">Gerencie conexões do sistema e rastreamento de logística.</p>
          </div>
        </div>

        {/* Card DiaLOG */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }} 
          animate={{ opacity: 1, y: 0 }}
          className="p-6 sm:p-8 bg-[#0a0a0a] rounded-3xl border border-white/5 shadow-xl shadow-black/40 mb-8"
        >
          <div className="flex items-center gap-2 mb-6">
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-500 animate-ping" />
            <h2 className="text-xl font-bold text-white">DiaLOG Rastreios</h2>
          </div>

          <p className="text-sm text-gray-400 mb-6 leading-relaxed">
            Envie automaticamente dados de pedidos aprovados e informações de entrega diretamente para o DiaLOG Rastreios. 
            Isso permite a emissão de etiquetas e rastreamento imediato do frete do seu e-commerce.
          </p>

          {message && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-xl mb-6 flex items-start gap-2.5 text-sm ${
                message.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'
              }`}
            >
              {message.type === 'success' ? <CheckCircle size={16} className="mt-0.5 shrink-0" /> : <AlertTriangle size={16} className="mt-0.5 shrink-0" />}
              <span>{message.text}</span>
            </motion.div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">
                URL do Webhook DiaLOG
              </label>
              <input 
                type="text" 
                value={webhookUrl}
                onChange={e => setWebhookUrl(e.target.value)}
                placeholder="https://<dialog>/functions/v1/webhook-checkout/universal/<MEU_USER_ID>"
                className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-2xl text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 transition-all font-mono text-xs"
              />
              <p className="text-[10px] text-gray-500 mt-2 ml-1">
                ⚠️ Mantenha esta URL em absoluto segredo. Ela é processada de forma ultra-segura no servidor e nunca será exposta nos arquivos públicos (bundle) do cliente.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 pt-4">
              <button
                onClick={handleSave}
                disabled={saving || testing}
                className="px-5 py-2.5 bg-cyan-500 text-black font-bold text-xs rounded-xl flex items-center gap-2 hover:bg-cyan-400 transition-all disabled:opacity-50 cursor-pointer"
              >
                {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                {saving ? 'Salvando...' : 'Salvar configurações'}
              </button>

              <button
                onClick={handleTest}
                disabled={saving || testing}
                className="px-5 py-2.5 bg-white/5 border border-white/10 text-white font-bold text-xs rounded-xl flex items-center gap-2 hover:bg-white/10 transition-all disabled:opacity-50 cursor-pointer"
              >
                {testing ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} />}
                Testar conexão
              </button>
            </div>
          </div>
        </motion.div>

        {/* Painel do Terminal de Resposta de Teste */}
        {testResult && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="p-6 bg-[#0a0a0a] rounded-3xl border border-white/5 mb-8 overflow-hidden"
          >
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Terminal size={16} className="text-cyan-400" /> Terminal de Resposta
            </h3>
            <div className="space-y-3 font-mono text-xs">
              <div className="flex gap-2">
                <span className="text-gray-500">Status Http:</span>
                <span className={testResult.status >= 200 && testResult.status < 300 ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                  {testResult.status}
                </span>
              </div>
              <div className="bg-black/50 border border-white/5 rounded-xl p-4 overflow-x-auto text-gray-400 max-h-40">
                <pre>{testResult.body || 'Sem resposta do corpo'}</pre>
              </div>
            </div>
          </motion.div>
        )}

        {/* Logs de Auditoria */}
        <div className="p-6 sm:p-8 bg-[#0a0a0a] rounded-3xl border border-white/5">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-white">Histórico de disparos (Auditoria)</h3>
            <button 
              onClick={loadLogs} 
              disabled={loadingLogs}
              className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-all cursor-pointer"
            >
              <RefreshCw size={14} className={loadingLogs ? 'animate-spin' : ''} />
            </button>
          </div>

          {loadingLogs ? (
            <div className="py-12 flex justify-center">
              <RefreshCw className="animate-spin text-cyan-400" size={24} />
            </div>
          ) : logs.length === 0 ? (
            <div className="py-12 text-center text-gray-500 text-sm">
              Nenhum disparo registrado ainda.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-gray-500 pb-3">
                    <th className="font-semibold py-3 pl-1">Pedido ID</th>
                    <th className="font-semibold py-3">Status Http</th>
                    <th className="font-semibold py-3">Data/Hora</th>
                    <th className="font-semibold py-3 pr-1">Retorno do servidor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {logs.map(log => (
                    <tr key={log.id} className="text-gray-300 hover:bg-white/[0.01] transition-all">
                      <td className="py-3.5 pl-1 font-mono font-medium">{log.order_id}</td>
                      <td className="py-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          log.status_code >= 200 && log.status_code < 300 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                          {log.status_code}
                        </span>
                      </td>
                      <td className="py-3.5 text-gray-500">
                        {new Date(log.sent_at).toLocaleString('pt-BR')}
                      </td>
                      <td className="py-3.5 pr-1 max-w-[200px] truncate text-gray-500 font-mono text-[10px]" title={log.response_body}>
                        {log.response_body || 'Nenhum corpo de resposta'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

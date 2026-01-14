import { useState, useEffect } from 'react';
import { fetchAgentLogs } from '../services/api';
import { Loader2, Activity, Clock, Database, MessageSquare } from 'lucide-react';

const AdminActivity = () => {
    const [logs, setLogs] = useState([]);
    const [selectedLog, setSelectedLog] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadLogs();
    }, []);

    const loadLogs = async () => {
        setLoading(true);
        try {
            const data = await fetchAgentLogs();
            console.log("Fetched logs:", data);
            if (Array.isArray(data)) {
                setLogs(data);
            } else {
                console.error("Logs data is not an array:", data);
                setLogs([]);
            }
        } catch (error) {
            console.error("Failed to load logs:", error);
            setLogs([]);
        } finally {
            setLoading(false);
        }
    };

    const formatDuration = (ms) => {
        if (ms < 1000) return `${ms}ms`;
        const seconds = (ms / 1000).toFixed(2);
        if (ms < 60000) return `${seconds}s`;
        const minutes = (ms / 60000).toFixed(2);
        return `${minutes}m`;
    };

    return (
        <div className="space-y-8 animate-fade-in text-white/90 p-8">
            <header>
                <h2 className="text-3xl font-light tracking-wide text-white flex items-center gap-3">
                    <Activity className="text-opal" />
                    Activité des Agents
                </h2>
                <p className="text-slate-400 font-light mt-2">
                    Traçabilité des interactions avec les modèles IA.
                </p>
            </header>

            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 size={32} className="animate-spin text-opal" />
                </div>
            ) : (
                <div className="glass-panel overflow-hidden rounded-xl border border-white/5">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-400">
                            <thead className="bg-white/5 text-xs uppercase font-medium text-slate-300">
                                <tr>
                                    <th className="px-6 py-4">Timestamp</th>
                                    <th className="px-6 py-4">Agent</th>
                                    <th className="px-6 py-4">Question</th>
                                    <th className="px-6 py-4">Réponse (Extrait)</th>
                                    <th className="px-6 py-4 text-center">Tokens</th>
                                    <th className="px-6 py-4 text-center">Durée</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {logs.map((log) => (
                                    <tr
                                        key={log.id}
                                        className="hover:bg-white/5 transition-colors cursor-pointer"
                                        onClick={() => setSelectedLog(log)}
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-slate-500">
                                            {new Date(log.created_at).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-white font-medium">{log.agent_name}</span>
                                                <span className="text-xs text-slate-500">v{log.agent_version}</span>
                                                <span className="text-[10px] text-slate-600 font-mono">{log.model_name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 max-w-[200px] truncate" title={log.input_content}>
                                            <span className="text-slate-300">{log.input_content}</span>
                                        </td>
                                        <td className="px-6 py-4 max-w-[200px] truncate" title={log.response_content}>
                                            {log.response_content}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex flex-col items-center gap-1 text-xs">
                                                <span className="text-emerald-400/80" title="Input">{log.input_tokens} In</span>
                                                <span className="text-blue-400/80" title="Output">{log.output_tokens} Out</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center font-mono text-xs">
                                            {formatDuration(log.duration_ms)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modal Detail */}
            {selectedLog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedLog(null)}>
                    <div className="bg-[#0f172a] border border-white/10 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                            <div>
                                <h3 className="text-xl font-light text-white flex items-center gap-2">
                                    <Activity size={20} className="text-opal" />
                                    Détails Interaction
                                </h3>
                                <div className="text-xs text-slate-400 mt-1 font-mono">
                                    ID: {selectedLog.id} • {new Date(selectedLog.created_at).toLocaleString()}
                                </div>
                            </div>
                            <button onClick={() => setSelectedLog(null)} className="text-slate-400 hover:text-white transition-colors">
                                ✕
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-6">
                            {/* Prompt Complet */}
                            <div className="space-y-2">
                                <h4 className="text-sm font-medium text-slate-300 uppercase tracking-wider flex items-center gap-2">
                                    <MessageSquare size={14} /> Prompt Complet (System + User)
                                </h4>
                                <div className="bg-black/50 p-4 rounded-lg border border-white/10 font-mono text-xs text-slate-300 whitespace-pre-wrap max-h-[300px] overflow-auto hover:border-opal/30 transition-colors">
                                    {selectedLog.full_prompt || selectedLog.input_content}
                                </div>
                            </div>

                            {/* Réponse Complète */}
                            <div className="space-y-2">
                                <h4 className="text-sm font-medium text-slate-300 uppercase tracking-wider flex items-center gap-2">
                                    <Database size={14} /> Réponse Modèle
                                </h4>
                                <div className="bg-black/50 p-4 rounded-lg border border-white/10 font-mono text-xs text-emerald-400/90 whitespace-pre-wrap max-h-[300px] overflow-auto hover:border-opal/30 transition-colors">
                                    {selectedLog.response_content}
                                </div>
                            </div>

                            {/* Metadata & Performance - Moved to bottom for summary feeling or use a dedicated section */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-white/5 pt-6">
                                <div className="bg-white/5 p-4 rounded-lg border border-white/5 flex flex-col gap-1">
                                    <div className="text-xs text-slate-500 uppercase font-medium">Agent & Modèle</div>
                                    <div className="text-white font-medium">{selectedLog.agent_name} <span className="opacity-50">v{selectedLog.agent_version}</span></div>
                                    <div className="text-xs text-blue-400 font-mono">{selectedLog.model_name}</div>
                                </div>

                                <div className="bg-white/5 p-4 rounded-lg border border-white/5 flex flex-col gap-1">
                                    <div className="text-xs text-slate-500 uppercase font-medium">Performance</div>
                                    <div className="flex justify-between items-end">
                                        <span className="text-slate-400 text-sm">Durée</span>
                                        <span className="text-amber-400 font-mono font-bold text-lg">{formatDuration(selectedLog.duration_ms)}</span>
                                    </div>
                                    <div className="w-full bg-white/10 h-1 mt-2 rounded-full overflow-hidden">
                                        <div className="bg-amber-400 h-full" style={{ width: Math.min((selectedLog.duration_ms / 10000) * 100, 100) + '%' }}></div>
                                    </div>
                                </div>

                                <div className="bg-white/5 p-4 rounded-lg border border-white/5 flex flex-col gap-1">
                                    <div className="text-xs text-slate-500 uppercase font-medium">Consommation Tokens</div>
                                    <div className="flex justify-between text-sm mt-1">
                                        <span className="text-emerald-400">Input</span>
                                        <span className="font-mono">{selectedLog.input_tokens}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-blue-400">Output</span>
                                        <span className="font-mono">{selectedLog.output_tokens}</span>
                                    </div>
                                    <div className="flex justify-between text-sm border-t border-white/10 pt-1 mt-1 font-bold">
                                        <span className="text-slate-300">Total</span>
                                        <span className="font-mono text-purple-400">{selectedLog.input_tokens + selectedLog.output_tokens}</span>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminActivity;

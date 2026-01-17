import { useState, useEffect } from 'react';
import { Loader2, Activity, Database, Cpu, Search, X, CheckCircle, AlertOctagon, Trash2 } from 'lucide-react';
import ConfirmationModal from '../components/ConfirmationModal';

const AdminLLMLogs = () => {
    const [conversations, setConversations] = useState([]);
    const [logs, setLogs] = useState([]);
    const [selectedSessionId, setSelectedSessionId] = useState(null);
    const [selectedLog, setSelectedLog] = useState(null);
    const [loadingLogs, setLoadingLogs] = useState(false);

    // Delete Confirmation State
    const [pendingDeleteId, setPendingDeleteId] = useState(null);

    // Load conversations on mount
    useEffect(() => {
        loadConversations();
    }, []);

    // Load logs when a session is selected
    useEffect(() => {
        if (selectedSessionId) {
            loadSessionLogs(selectedSessionId);
        } else {
            setLogs([]);
        }
    }, [selectedSessionId]);

    const loadConversations = async () => {
        try {
            const apiUrl = `http://${window.location.hostname}:8000/admin/conversations?limit=20`;
            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error("Failed to fetch conversations");
            const data = await response.json();
            setConversations(data);

            // Auto-select first if available and none selected
            if (data.length > 0 && !selectedSessionId) setSelectedSessionId(data[0].id);
        } catch (error) {
            console.error("Failed to load conversations:", error);
        }
    };

    const loadSessionLogs = async (sessionId) => {
        setLoadingLogs(true);
        try {
            const apiUrl = `http://${window.location.hostname}:8000/admin/llm_logs?limit=50&conversation_id=${sessionId}`;
            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error("Failed to fetch logs");
            const data = await response.json();
            setLogs(data);
        } catch (error) {
            console.error("Failed to load logs:", error);
            setLogs([]);
        } finally {
            setLoadingLogs(false);
        }
    };

    const requestDeleteSession = (cId, e) => {
        e.stopPropagation();
        setPendingDeleteId(cId);
    };

    const confirmDeleteSession = async () => {
        if (!pendingDeleteId) return;
        const cId = pendingDeleteId;

        try {
            const apiUrl = `http://${window.location.hostname}:8000/admin/conversations/${cId}`;
            const response = await fetch(apiUrl, { method: "DELETE" });
            if (response.ok) {
                // Refresh list
                const newConvs = conversations.filter(c => c.id !== cId);
                setConversations(newConvs);

                // If selected was deleted, clear selection
                if (selectedSessionId === cId) {
                    setSelectedSessionId(null);
                    setLogs([]);
                    // Optional: select next
                    if (newConvs.length > 0) setSelectedSessionId(newConvs[0].id);
                } else {
                    // Reload full list to be safe (or just rely on filter above)
                    loadConversations();
                }
            }
        } catch (error) {
            console.error("Delete failed", error);
        } finally {
            setPendingDeleteId(null);
        }
    };

    const formatDuration = (ms) => {
        if (!ms) return "-";
        if (ms < 1000) return `${ms}ms`;
        return `${(ms / 1000).toFixed(2)}s`;
    };

    const JsonViewer = ({ data, title }) => {
        if (!data) return <div className="text-gray-500 italic">Vide</div>;
        return (
            <div className="bg-[#0b1221] p-4 rounded-lg border border-white/10 overflow-x-auto">
                <h5 className="text-xs uppercase font-bold text-slate-500 mb-2">{title}</h5>
                <pre className="text-xs font-mono text-emerald-400 whitespace-pre-wrap">
                    {JSON.stringify(data, null, 2)}
                </pre>
            </div>
        );
    };

    return (
        <div className="flex h-[calc(100vh-4rem)] bg-[#0b1221]">
            <ConfirmationModal
                isOpen={!!pendingDeleteId}
                onClose={() => setPendingDeleteId(null)}
                onConfirm={confirmDeleteSession}
                title="Supprimer la conversation ?"
                message="Cette action supprimera définitivement la conversation et tous les logs associés."
                confirmText="Supprimer définitivement"
                isDanger={true}
            />

            {/* SIDEBAR: CONVERSATIONS */}
            <div className="w-[400px] border-r border-white/5 flex flex-col bg-[#0f172a]">
                <div className="p-4 border-b border-white/5">
                    <h2 className="text-sm uppercase tracking-wide text-slate-400 font-bold flex items-center gap-2">
                        <Activity size={14} className="text-indigo-400" />
                        Conversations
                    </h2>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {conversations.map(conv => (
                        <div
                            key={conv.id}
                            onClick={() => setSelectedSessionId(conv.id)}
                            className={`group p-4 border-b border-white/5 cursor-pointer hover:bg-white/5 transition-colors ${selectedSessionId === conv.id ? 'bg-indigo-500/10 border-l-2 border-l-indigo-500' : 'border-l-2 border-l-transparent'}`}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <span className="text-xs font-mono text-slate-500">{new Date(conv.latest_at).toLocaleTimeString()}</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] bg-white/10 px-1.5 rounded text-slate-300">{conv.interaction_count} échanges</span>
                                    <button
                                        onClick={(e) => requestDeleteSession(conv.id, e)}
                                        className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-0.5"
                                        title="Supprimer la conversation"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
// ... existing rest of file (JsonViewer and Main Panel) unchanged logic, just moved down
                            <div className="flex justify-between items-end">
                                <div className="text-xs text-indigo-300 font-mono truncate max-w-[200px]" title={conv.id}>
                                    {conv.id}
                                </div>
                                <div className="flex gap-1 text-[10px] items-center">
                                    <span className="text-emerald-400/80" title="Total Input">{conv.total_input_tokens || 0}</span>
                                    <span className="text-slate-600">/</span>
                                    <span className="text-blue-400/80" title="Total Output">{conv.total_output_tokens || 0}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* MAIN PANEL: LOGS */}
            <div className="flex-1 flex flex-col bg-slate-900/50">
                <div className="p-6 border-b border-white/5 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-light text-white flex items-center gap-3">
                            <Database className="text-indigo-400" />
                            Détail de la Session
                        </h2>
                        <div className="text-slate-400 font-mono text-xs mt-1">
                            {selectedSessionId || "Sélectionnez une conversation"}
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-hidden p-6">
                    {loadingLogs ? (
                        <div className="flex justify-center py-12">
                            <Loader2 size={32} className="animate-spin text-indigo-500" />
                        </div>
                    ) : (
                        <div className="glass-panel overflow-hidden rounded-xl border border-white/5 h-full flex flex-col">
                            <div className="overflow-x-auto overflow-y-auto flex-1">
                                <table className="w-full text-left text-sm text-slate-400">
                                    <thead className="bg-white/5 text-xs uppercase font-medium text-slate-300 sticky top-0 backdrop-blur-md">
                                        <tr>
                                            <th className="px-6 py-4">Heure</th>
                                            <th className="px-6 py-4">Trace ID</th>
                                            <th className="px-6 py-4">Opération</th>
                                            <th className="px-6 py-4 text-center">I/O Tokens</th>
                                            <th className="px-6 py-4 text-center">Durée</th>
                                            <th className="px-6 py-4 text-center">État</th>
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
                                                    {new Date(log.created_at).toLocaleTimeString()}
                                                </td>
                                                <td className="px-6 py-4 font-mono text-[10px] text-slate-600">
                                                    {log.trace_id ? log.trace_id.split('-').slice(1).join('-') : '-'}
                                                </td>
                                                <td className="px-6 py-4 font-mono text-xs text-indigo-300">
                                                    {log.method_name}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex gap-2 justify-center text-[10px]">
                                                        <span className="text-emerald-400">{log.input_tokens}</span>
                                                        <span className="text-slate-600">/</span>
                                                        <span className="text-blue-400">{log.output_tokens}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center font-mono text-xs text-amber-400">
                                                    {formatDuration(log.duration_ms)}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    {log.error_message ? <AlertOctagon size={16} className="text-red-500 mx-auto" /> : <CheckCircle size={16} className="text-green-500/20 mx-auto" />}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Detail */}
            {selectedLog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedLog(null)}>
                    <div className="bg-[#0f172a] border border-white/10 rounded-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                            <div>
                                <h3 className="text-xl font-light text-white flex items-center gap-2">
                                    <Cpu size={20} className="text-indigo-400" />
                                    Détails Appel Gemini
                                </h3>
                                <div className="text-xs text-slate-400 mt-1 font-mono">
                                    ID: {selectedLog.id}
                                </div>
                            </div>
                            <button onClick={() => setSelectedLog(null)} className="text-slate-400 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-6 flex-1">

                            {/* Error Header */}
                            {selectedLog.error_message && (
                                <div className="p-4 bg-red-900/20 border border-red-500/50 rounded-lg text-red-200">
                                    <h4 className="font-bold flex items-center gap-2"><AlertOctagon size={16} /> Erreur</h4>
                                    <pre className="text-xs mt-2 whitespace-pre-wrap">{selectedLog.error_message}</pre>
                                </div>
                            )}

                            {/* Two Columns for Input/Output */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <JsonViewer data={selectedLog.input_payload} title="📥 Payload Envoyé (Input)" />
                                </div>
                                <div className="space-y-2">
                                    <JsonViewer data={selectedLog.output_payload} title="📤 Payload Reçu (Output)" />
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminLLMLogs;

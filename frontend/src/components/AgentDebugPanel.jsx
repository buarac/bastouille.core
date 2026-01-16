import React, { useEffect, useRef } from 'react';

const AgentDebugPanel = ({ logs = [] }) => {
    const scrollRef = useRef(null);

    // Auto-scroll to bottom directly
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs]);

    if (!logs || logs.length === 0) {
        return (
            <div className="h-full flex items-center justify-center text-gray-500 italic p-4 text-sm bg-[#1e293b]">
                En attente d'activité de l'agent...
            </div>
        );
    }

    return (
        <div
            ref={scrollRef}
            className="h-full overflow-y-auto bg-[#0f172a] text-gray-300 font-mono text-xs p-4 border-l border-gray-700 shadow-inner"
        >
            <div className="space-y-4">
                {logs.map((log, index) => (
                    <div key={index} className="animate-fade-in">
                        {/* TIMESTAMP */}
                        <div className="text-[10px] text-gray-600 mb-1">
                            {log.timestamp || new Date().toLocaleTimeString()}
                        </div>

                        {/* CONTENT BASED ON TYPE */}

                        {/* TYPE: THOUGHT (Pensée) */}
                        {log.type === 'thought' && (
                            <div className="pl-2 border-l-2 border-yellow-500/30 text-yellow-100/80 italic">
                                <span className="text-yellow-500 font-bold not-italic mr-2">⚡ PENSÉE:</span>
                                {log.content}
                            </div>
                        )}

                        {/* TYPE: TOOL CALL (Action) */}
                        {log.type === 'tool_call' && (
                            <div className="bg-[#1e293b] rounded border border-blue-500/30 p-2 text-blue-100">
                                <div className="flex items-center gap-2 mb-1 text-blue-400 font-bold">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                    OUTIL: {log.tool}
                                </div>
                                {log.args && (
                                    <pre className="text-[10px] text-gray-400 overflow-x-auto p-1 bg-black/20 rounded">
                                        {JSON.stringify(log.args, null, 2)}
                                    </pre>
                                )}
                            </div>
                        )}

                        {/* TYPE: TOOL RESULT (Résultat) */}
                        {log.type === 'tool_result' && (
                            <div className="pl-4 pt-1 text-[10px]">
                                <div className="flex items-center gap-2 text-green-500 mb-1">
                                    <span>↳ RÉSULTAT ({log.duration}ms)</span>
                                </div>
                                <div className="bg-[#111827] text-gray-400 p-2 rounded border border-gray-800 break-words whitespace-pre-wrap">
                                    {log.result && log.result.length > 300
                                        ? log.result.substring(0, 300) + '... (tronqué)'
                                        : log.result}
                                </div>
                            </div>
                        )}

                        {/* TYPE: FINAL ANSWER (Réponse) */}
                        {log.type === 'answer' && (
                            <div className="pl-2 border-l-2 border-green-500/50 text-green-100/90 mt-4">
                                <span className="text-green-500 font-bold mr-2">💬 RÉPONSE FINALE:</span>
                                {log.content}
                            </div>
                        )}

                        {/* TYPE: ERROR */}
                        {log.type === 'error' && (
                            <div className="bg-red-900/20 text-red-400 p-2 rounded border border-red-900/50 flex items-center gap-2">
                                ⚠️ {log.content}
                            </div>
                        )}
                    </div>
                ))}
                <div ref={scrollRef} />
            </div>
        </div>
    );
};

export default AgentDebugPanel;

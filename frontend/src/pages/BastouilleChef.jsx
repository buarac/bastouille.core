import { useState, useEffect, useRef } from "react";
import { Send, Trash2, Bot, Cpu } from "lucide-react";
// import ReactMarkdown from 'react-markdown';
// import remarkGfm from 'remark-gfm';
import AgentDebugPanel from "../components/AgentDebugPanel";
import ConfirmationModal from "../components/ConfirmationModal";

export default function BastouilleChef() {
    // Safe UUID Generator
    const generateUUID = () => {
        if (window.crypto && window.crypto.randomUUID) {
            return crypto.randomUUID();
        }
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    };

    // Chat History
    const [messages, setMessages] = useState(() => {
        try {
            const saved = localStorage.getItem("chat_history_v2_native");
            return saved ? JSON.parse(saved) : [];
        } catch (e) { return []; }
    });

    // Session ID
    const [sessionId, setSessionId] = useState(() => {
        return localStorage.getItem("bastouille_session_id") || generateUUID();
    });

    // Debug Logs
    const [logs, setLogs] = useState([]);

    // Modal State
    const [isResetModalOpen, setIsResetModalOpen] = useState(false);

    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const chatContainerRef = useRef(null);

    // Persist Chat & Session
    useEffect(() => {
        localStorage.setItem("chat_history_v2_native", JSON.stringify(messages));
        localStorage.setItem("bastouille_session_id", sessionId);
    }, [messages, sessionId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages, logs, loading]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMessage = { role: "user", content: input };
        setMessages((prev) => [...prev, userMessage]);

        // Log User Action
        setLogs(prev => [...prev, {
            type: 'info',
            content: `👤 USER: ${input}`,
            timestamp: new Date().toLocaleTimeString()
        }]);

        setInput("");
        setLoading(true);

        // Placeholder for Assistant Response
        const botMessageId = Date.now();
        setMessages((prev) => [
            ...prev,
            { role: "assistant", content: "", id: botMessageId }
        ]);

        try {
            const apiUrl = `http://${window.location.hostname}:8000/bastouille/chat`;

            // Prepare history (Assistants mapped to 'model' handled by backend default)
            const history = messages
                .filter(m => !m.content.includes("⚠️ Erreur")) // Filter errors
                .map(m => ({
                    role: m.role,
                    content: m.content
                }));

            const response = await fetch(apiUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Conversation-ID": sessionId
                },
                body: JSON.stringify({
                    message: userMessage.content,
                    history: history
                }),
            });

            if (!response.ok) throw new Error(response.statusText);

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split("\n").filter(line => line.trim() !== "");

                for (const line of lines) {
                    try {
                        const data = JSON.parse(line);
                        const timestamp = new Date().toLocaleTimeString();

                        // --- LOG LOGIC ---
                        setLogs(prev => {
                            const newLogs = [...prev];
                            const lastLog = newLogs[newLogs.length - 1];

                            if (data.type === "step_start") {
                                // Tool Call Started
                                return [...newLogs, {
                                    type: 'tool_call',
                                    tool: data.tool,
                                    args: data.args,
                                    timestamp
                                }];
                            }
                            else if (data.type === "step_end") {
                                // Tool Call Finished
                                return [...newLogs, {
                                    type: 'tool_result',
                                    tool: data.tool,
                                    result: data.result,
                                    timestamp
                                }];
                            }
                            else if (data.type === "thought_token") {
                                // Thought / Reasoning
                                return [...newLogs, {
                                    type: 'thought',
                                    content: data.content,
                                    timestamp
                                }];
                            }
                            else if (data.type === "message_token") {
                                // Streaming Text
                                if (lastLog && lastLog.type === 'answer') {
                                    lastLog.content += data.content;
                                    return [...newLogs];
                                } else {
                                    return [...newLogs, { type: 'answer', content: data.content, timestamp }];
                                }
                            }
                            return newLogs;
                        });

                        // --- CHAT LOGIC ---
                        if (data.type === "message_token") {
                            setMessages((prev) => prev.map(msg => {
                                if (msg.id !== botMessageId) return msg;
                                return { ...msg, content: (msg.content || "") + data.content };
                            }));
                        }

                    } catch (e) {
                        console.warn("Parse Error:", e, line);
                    }
                }
            }

        } catch (error) {
            console.error(error);
            setMessages((prev) => prev.map(msg => {
                if (msg.id !== botMessageId) return msg;
                return { ...msg, content: msg.content + "\n⚠️ Erreur technique : " + error.message };
            }));
            setLogs(prev => [...prev, { type: 'error', content: error.message }]);
        } finally {
            setLoading(false);
        }
    };

    const confirmReset = () => {
        setMessages([]);
        setLogs([]);
        const newSessionId = generateUUID();
        setSessionId(newSessionId);
        localStorage.setItem("bastouille_session_id", newSessionId);
        localStorage.removeItem("chat_history_v2_native");
        setIsResetModalOpen(false);
    };

    return (
        <div className="flex h-[calc(100vh-4rem)] max-w-[1920px] mx-auto bg-[#0b1221]">
            <ConfirmationModal
                isOpen={isResetModalOpen}
                onClose={() => setIsResetModalOpen(false)}
                onConfirm={confirmReset}
                title="Nouvelle conversation ?"
                message="Attention, cela effacera tout l'historique de la session actuelle. Cette action est irréversible."
                confirmText="Effacer"
                isDanger={true}
            />

            {/* LEFT PANEL: CHAT (45%) */}
            <div className="w-[45%] flex flex-col border-r border-white/5 bg-[#0b1221]">
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-white/5 bg-[#0f172a]">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                            <Cpu className="w-6 h-6 text-indigo-400" />
                        </div>
                        <div>
                            <h1 className="text-xl font-light text-white tracking-wide">Baštouille Chef</h1>
                            <div className="flex items-center gap-2">
                                <span className="px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-mono border border-indigo-500/30">NATIVE</span>
                                <p className="text-xs text-slate-500 font-mono">Gemini 2.0</p>
                            </div>
                        </div>
                    </div>
                    <button onClick={() => setIsResetModalOpen(true)} className="p-2 text-slate-500 hover:text-red-400 transition-all">
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>

                {/* Messages */}
                <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-6">
                    {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-slate-600 opacity-50">
                            <Cpu className="w-16 h-16 mb-2 text-indigo-500/20" />
                            <p>Prêt à jardiner avec des outils natifs...</p>
                        </div>
                    )}
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[85%] rounded-2xl px-5 py-3 text-sm leading-relaxed shadow-lg ${msg.role === "user"
                                ? "bg-indigo-600 text-white rounded-tr-sm"
                                : "bg-[#1e293b] text-gray-100 rounded-tl-sm border border-white/5"
                                }`}>
                                <div className="whitespace-pre-wrap">{msg.content}</div>
                            </div>
                        </div>
                    ))}

                    {/* Loading Indicator */}
                    {loading && (
                        <div className="flex justify-start animate-fade-in">
                            <div className="bg-[#1e293b] text-indigo-300 rounded-2xl rounded-tl-sm px-5 py-3 text-sm border border-white/5 flex items-center gap-3">
                                <div className="flex gap-1">
                                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></div>
                                </div>
                                <span className="text-xs font-mono opacity-70">Bastouille cuisine...</span>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 border-t border-white/5 bg-[#0f172a]">
                    <div className="relative flex gap-2 items-end bg-[#1e293b] border border-white/10 rounded-xl p-2 focus-within:border-indigo-500/50 transition-colors">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSend())}
                            placeholder="Demander ou faire..."
                            className="flex-1 bg-transparent border-none text-white focus:ring-0 resize-none py-2 px-3 min-h-[44px] max-h-[120px]"
                            rows={1}
                        />
                        <button
                            onClick={handleSend}
                            disabled={loading || !input.trim()}
                            className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg disabled:opacity-50 transition-all shadow-lg shadow-indigo-500/20"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* RIGHT PANEL: DEBUG LOGS (55%) */}
            <div className="w-[55%] flex flex-col bg-[#0f172a] shadow-inner">
                <div className="p-2 px-4 border-b border-white/5 bg-[#1e293b]/50 text-xs font-mono text-gray-400 uppercase tracking-wider flex justify-between items-center h-[73px]">
                    <div className="flex items-center gap-2">
                        <span>Console Système</span>
                    </div>
                    <span className={loading ? "text-indigo-400 animate-pulse" : "text-gray-600"}>
                        {loading ? "● PROCESSING" : "○ READY"}
                    </span>
                </div>
                <div className="flex-1 overflow-hidden relative">
                    <AgentDebugPanel logs={logs} />
                </div>
            </div>

        </div>
    );
}

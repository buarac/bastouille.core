import { useState, useEffect, useRef } from "react";
import { Send, Trash2, Bot } from "lucide-react";
import AgentDebugPanel from "../components/AgentDebugPanel";

export default function AgentChat() {
    // Chat History (Clean, for Left Panel)
    const [messages, setMessages] = useState(() => {
        try {
            const saved = localStorage.getItem("chat_history_v2");
            return saved ? JSON.parse(saved) : [];
        } catch (e) { return []; }
    });

    // Debug Logs (Raw, for Right Panel)
    const [logs, setLogs] = useState([]);

    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const chatContainerRef = useRef(null);

    // Save Chat to localStorage
    useEffect(() => {
        localStorage.setItem("chat_history_v2", JSON.stringify(messages));
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, loading]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMessage = { role: "user", content: input };
        setMessages((prev) => [...prev, userMessage]);

        // Add User action to logs
        setLogs(prev => [...prev, { type: 'info', content: `👤 USER: ${input}`, timestamp: new Date().toLocaleTimeString() }]);

        setInput("");
        setLoading(true);

        // Prepare placeholder for bot response
        const botMessageId = Date.now();
        setMessages((prev) => [
            ...prev,
            { role: "assistant", content: "", id: botMessageId }
        ]);

        try {
            const historyPayload = messages.map(m => ({ role: m.role, content: m.content }));
            const apiUrl = `http://${window.location.hostname}:8000/agents/culture/chat`;

            const response = await fetch(apiUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    query: userMessage.content,
                    history: historyPayload
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

                        // --- LOG LOGIC (Right Panel) ---
                        setLogs(prev => {
                            const newLogs = [...prev];
                            const lastLog = newLogs[newLogs.length - 1];

                            if (data.type === "thought_token") {
                                if (lastLog && lastLog.type === 'thought') {
                                    lastLog.content += data.content;
                                    return [...newLogs];
                                } else {
                                    return [...newLogs, { type: 'thought', content: data.content, timestamp }];
                                }
                            }
                            else if (data.type === "step_start") {
                                return [...newLogs, { type: 'tool_call', tool: data.tool, args: data.args, timestamp }];
                            }
                            else if (data.type === "step_end") {
                                return [...newLogs, { type: 'tool_result', tool: data.tool, result: data.result, duration: data.duration, timestamp }];
                            }
                            else if (data.type === "message_token") {
                                if (lastLog && lastLog.type === 'answer') {
                                    lastLog.content += data.content;
                                    return [...newLogs];
                                } else {
                                    return [...newLogs, { type: 'answer', content: data.content, timestamp }];
                                }
                            }
                            return newLogs;
                        });

                        // --- CHAT LOGIC (Left Panel) ---
                        if (data.type === "message_token") {
                            setMessages((prev) => prev.map(msg => {
                                if (msg.id !== botMessageId) return msg;
                                return { ...msg, content: (msg.content || "") + data.content };
                            }));
                        }

                    } catch (e) {
                        console.warn("Stream parse error", e);
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

    const handleReset = () => {
        if (confirm("Effacer tout l'historique ?")) {
            setMessages([]);
            setLogs([]);
            localStorage.removeItem("chat_history_v2");
        }
    };

    return (
        <div className="flex h-[calc(100vh-4rem)] max-w-[1920px] mx-auto bg-[#0b1221]">

            {/* LEFT PANEL: CHAT (45%) */}
            <div className="w-[45%] flex flex-col border-r border-white/5 bg-[#0b1221]">
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-green-900/40 to-emerald-900/20 rounded-xl border border-white/5">
                            <Bot className="w-6 h-6 text-emerald-400" />
                        </div>
                        <div>
                            <h1 className="text-xl font-light text-white tracking-wide">Chef de Culture</h1>
                            <p className="text-xs text-emerald-500 font-mono">v1.5-history</p>
                        </div>
                    </div>
                    <button onClick={handleReset} className="p-2 text-slate-500 hover:text-red-400 transition-all">
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>

                {/* Messages */}
                <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-6">
                    {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-slate-600 opacity-50">
                            <Bot className="w-16 h-16 mb-2" />
                            <p>Posez votre question...</p>
                        </div>
                    )}
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[85%] rounded-2xl px-5 py-3 text-sm leading-relaxed shadow-lg ${msg.role === "user"
                                    ? "bg-emerald-600 text-white rounded-tr-sm"
                                    : "bg-[#1e293b] text-gray-100 rounded-tl-sm border border-white/5"
                                }`}>
                                <div className="whitespace-pre-wrap">{msg.content}</div>
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 border-t border-white/5 bg-[#0b1221]">
                    <div className="relative flex gap-2 items-end bg-[#1e293b] border border-white/10 rounded-xl p-2">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSend())}
                            placeholder="Message..."
                            className="flex-1 bg-transparent border-none text-white focus:ring-0 resize-none py-2 px-3 min-h-[44px] max-h-[120px]"
                            rows={1}
                        />
                        <button
                            onClick={handleSend}
                            disabled={loading || !input.trim()}
                            className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg disabled:opacity-50 transition-all"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* RIGHT PANEL: DEBUG LOGS (55%) */}
            <div className="w-[55%] flex flex-col bg-[#0f172a] shadow-inner">
                <div className="p-2 px-4 border-b border-white/5 bg-[#1e293b]/50 text-xs font-mono text-gray-400 uppercase tracking-wider flex justify-between">
                    <span>Console Système</span>
                    <span className={loading ? "text-emerald-400 animate-pulse" : "text-gray-600"}>
                        {loading ? "● LIVE" : "○ IDLE"}
                    </span>
                </div>
                <div className="flex-1 overflow-hidden relative">
                    <AgentDebugPanel logs={logs} />
                </div>
            </div>

        </div>
    );
}

import { useState, useEffect, useRef } from "react";
import { Send, Trash2, Bot, Loader2, CheckCircle2, Clock } from "lucide-react";

export default function AgentChat() {
    // Load initial state from localStorage
    const [messages, setMessages] = useState(() => {
        try {
            const saved = localStorage.getItem("chat_history");
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.error("Failed to load chat history", e);
            return [];
        }
    });

    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const chatContainerRef = useRef(null);

    // Save to localStorage
    useEffect(() => {
        localStorage.setItem("chat_history", JSON.stringify(messages));
    }, [messages]);

    // Scroll to bottom
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
        setInput("");
        setLoading(true);

        // Prepare placeholder for bot response
        const botMessageId = Date.now();
        setMessages((prev) => [
            ...prev,
            {
                role: "assistant",
                content: "",
                id: botMessageId,
                steps: [] // Array of { tool, status: "pending"|"done", duration, result }
            }
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

            // Stream Reader
            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split("\n").filter(line => line.trim() !== "");

                for (const line of lines) {
                    try {
                        // Sometimes lines might be concatenated or prefixed/suffixed?
                        // Usually SSE is clean but let's just parse JSON directly as we send pure JSONs
                        // NOTE: If using strict SSE format "data: ...", we need to strip "data: "
                        // But our backend sends raw JSON bytes in StreamingResponse without "data:" prefix usually unless formatted manually?
                        // Actually, StreamingResponse(generator()) sends raw chunks.
                        // So the generator yields raw JSON strings.

                        // Handle potential multiple JSONs in one chunk
                        // This simplistic split might break if JSON contains newlines.
                        // Ideally we should process the buffer. 
                        // For this MVP, assuming the backend yields simple line-delimited JSONs or chunks are distinct.

                        const data = JSON.parse(line);

                        setMessages((prev) => prev.map(msg => {
                            if (msg.id !== botMessageId) return msg;

                            // Update logic based on event type
                            if (data.type === "step_start") {
                                return {
                                    ...msg,
                                    steps: [...(msg.steps || []), { tool: data.tool, status: "pending" }]
                                };
                            }
                            else if (data.type === "step_end") {
                                // Find step and update it
                                const newSteps = [...(msg.steps || [])];
                                const stepIndex = newSteps.findIndex(s => s.tool === data.tool && s.status === "pending");
                                if (stepIndex !== -1) {
                                    newSteps[stepIndex] = { ...newSteps[stepIndex], status: "done", duration: data.duration, result: data.result };
                                }
                                return { ...msg, steps: newSteps };
                            }
                            else if (data.type === "message") {
                                return { ...msg, content: (msg.content || "") + data.content };
                            }
                            return msg;
                        }));

                    } catch (e) {
                        console.warn("Error parsing stream chunk", e, line);
                    }
                }
            }

        } catch (error) {
            console.error(error);
            setMessages((prev) => [...prev, { role: "assistant", content: "⚠️ Erreur technique : " + error.message }]);
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        if (confirm("Voulez-vous vraiment effacer l'historique ?")) {
            setMessages([]);
            localStorage.removeItem("chat_history");
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-6rem)] max-w-4xl mx-auto p-4 font-sans">
            {/* Header */}
            <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-green-900/40 to-emerald-900/20 rounded-2xl border border-white/5 shadow-inner">
                        <Bot className="w-8 h-8 text-emerald-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-light text-white tracking-wide">Chef de Culture</h1>
                        <p className="text-sm text-slate-400 font-light flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            Assistant Connecté
                        </p>
                    </div>
                </div>
                <button
                    onClick={handleReset}
                    className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                    title="Effacer la conversation"
                >
                    <Trash2 className="w-5 h-5" />
                </button>
            </div>

            {/* Chat Area */}
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto mb-6 space-y-6 pr-4 custom-scrollbar">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-slate-600 space-y-4">
                        <Bot className="w-20 h-20 opacity-20" />
                        <p className="font-light text-lg">Prêt à jardiner ? Posez votre question.</p>
                    </div>
                )}

                {messages.map((msg, index) => (
                    <div key={index} className={`flex flex-col gap-2 ${msg.role === "user" ? "items-end" : "items-start"}`}>

                        {/* Internal Steps (Gray Box) */}
                        {msg.steps && msg.steps.length > 0 && (
                            <div className="bg-slate-900/50 border border-white/5 rounded-xl p-3 mb-1 max-w-[85%] sm:max-w-[70%] space-y-2 backdrop-blur-sm">
                                {msg.steps.map((step, i) => (
                                    <div key={i} className="flex items-center gap-3 text-xs font-mono text-slate-400">
                                        {step.status === "pending" ? (
                                            <Loader2 className="w-3 h-3 animate-spin text-amber-500/80" />
                                        ) : (
                                            <CheckCircle2 className="w-3 h-3 text-emerald-500/50" />
                                        )}
                                        <span className="opacity-90 flex-1 truncate">
                                            Outil: <span className="text-slate-300">{step.tool}</span>
                                        </span>
                                        {step.duration && (
                                            <span className="flex items-center gap-1 opacity-50 bg-white/5 px-1.5 py-0.5 rounded">
                                                <Clock className="w-3 h-3" /> {step.duration}ms
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Message Bubble */}
                        {(msg.content || msg.role === 'user') && (
                            <div
                                className={`max-w-[85%] rounded-2xl px-6 py-4 shadow-xl text-sm leading-relaxed ${msg.role === "user"
                                        ? "bg-emerald-600 text-white rounded-tr-sm border border-emerald-500/50"
                                        : "bg-slate-800 text-slate-200 rounded-tl-sm border border-slate-700/50"
                                    }`}
                            >
                                <div className="whitespace-pre-wrap">{msg.content}</div>
                            </div>
                        )}
                    </div>
                ))}

                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="relative group">
                <div className="absolute inset-0 bg-emerald-500/5 rounded-2xl blur-md group-hover:bg-emerald-500/10 transition-all"></div>
                <div className="relative flex gap-2 items-end bg-slate-900/80 border border-white/10 rounded-2xl p-2 backdrop-blur-xl">
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ex: Planter 10 salades..."
                        className="flex-1 bg-transparent border-none text-white placeholder-slate-500 focus:ring-0 resize-none py-3 px-4 min-h-[50px] max-h-[150px]"
                        rows={1}
                    />
                    <button
                        onClick={handleSend}
                        disabled={loading || !input.trim()}
                        className="p-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-emerald-500/20 hover:scale-105 active:scale-95"
                    >
                        <Send className="w-5 h-5 mx-auto" />
                    </button>
                </div>
            </div>
        </div>
    );
}

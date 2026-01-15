import { useState, useEffect, useRef } from "react";
import { Send, Trash2, Bot } from "lucide-react";

export default function AgentChat() {
    // Load initial state from localStorage if available
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

    // Save to localStorage whenever messages change
    useEffect(() => {
        localStorage.setItem("chat_history", JSON.stringify(messages));
    }, [messages]);

    // Auto-scroll to bottom directly, or when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMessage = { role: "user", content: input };
        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setLoading(true);

        try {
            // Build history excluding the current new message
            const historyPayload = messages.map(m => ({ role: m.role, content: m.content }));

            // Dynamic API URL based on current host (handles localhost vs LAN IP)
            const apiUrl = `http://${window.location.hostname}:8000/agents/culture/chat`;

            const response = await fetch(apiUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    query: userMessage.content,
                    history: historyPayload
                }),
            });

            if (!response.ok) {
                throw new Error("Erreur HTTP: " + response.statusText);
            }

            const data = await response.json();
            const botMessage = { role: "assistant", content: data.response };

            setMessages((prev) => [...prev, botMessage]);
        } catch (error) {
            console.error(error);
            setMessages((prev) => [...prev, { role: "assistant", content: "⚠️ Erreur technique : " + error.message }]);
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        if (confirm("Voulez-vous vraiment effacer l'historique de la conversation ?")) {
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
        <div className="flex flex-col h-[calc(100vh-6rem)] max-w-4xl mx-auto p-4">
            {/* Header */}
            <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-900/40 rounded-full border border-green-500/30">
                        <Bot className="w-6 h-6 text-green-400" />
                    </div>
                    <div>
                        <h1 className="text-xl font-semibold text-white">Chef de Culture</h1>
                        <p className="text-sm text-slate-400">Assistant Cultivateur</p>
                    </div>
                </div>
                <button
                    onClick={handleReset}
                    className="p-2 text-red-400 hover:bg-red-900/20 rounded-full transition-colors border border-transparent hover:border-red-900/30"
                    title="Réinitialiser la conversation"
                >
                    <Trash2 className="w-5 h-5" />
                </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-2 custom-scrollbar">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500 opacity-60">
                        <Bot className="w-16 h-16 mb-4" />
                        <p className="text-center">Bonjour ! Je suis prêt pour vos semis et entretiens.</p>
                    </div>
                )}

                {messages.map((msg, index) => (
                    <div
                        key={index}
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                        <div
                            className={`max-w-[85%] rounded-2xl px-5 py-3 shadow-md whitespace-pre-wrap ${msg.role === "user"
                                ? "bg-emerald-600 text-white rounded-tr-none border border-emerald-500"
                                : "bg-slate-800/80 text-slate-100 border border-slate-700 rounded-tl-none backdrop-blur-sm"
                                }`}
                        >
                            {msg.content}
                        </div>
                    </div>
                ))}

                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-slate-800/50 rounded-2xl px-4 py-3 rounded-tl-none border border-slate-700/50 flex gap-1.5 items-center">
                            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area - Flex Layout */}
            <div className="flex gap-2 items-end">
                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ex: Semis de 50 radis..."
                    className="flex-1 bg-slate-900/50 border border-slate-700 text-white rounded-xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none shadow-inner py-3 px-4 transition-all"
                    rows={1}
                    style={{ minHeight: "3rem", maxHeight: "8rem" }}
                />
                <button
                    onClick={handleSend}
                    disabled={loading || !input.trim()}
                    className="p-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-emerald-900/20 mb-px"
                >
                    <Send className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}

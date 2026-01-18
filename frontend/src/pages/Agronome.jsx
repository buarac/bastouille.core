import { useState, useEffect } from "react";
import { Send, Sprout, Sun, Droplets, Thermometer, Calendar, BookOpen, AlertCircle, CheckCircle, RefreshCw, Cpu, Book, Info } from "lucide-react";
import ConfirmationModal from "../components/ConfirmationModal";

export default function Agronome() {
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [sessionId, setSessionId] = useState("");

    // Load State from LocalStorage
    useEffect(() => {
        const savedInput = localStorage.getItem("agronome_v1_input");
        const savedResult = localStorage.getItem("agronome_v1_result");
        if (savedInput) setInput(savedInput);
        if (savedResult) setResult(JSON.parse(savedResult));
    }, []);

    // Save State to LocalStorage
    useEffect(() => {
        localStorage.setItem("agronome_v1_input", input);
    }, [input]);

    useEffect(() => {
        if (result) {
            localStorage.setItem("agronome_v1_result", JSON.stringify(result));
        }
    }, [result]);

    // Session Management
    useEffect(() => {
        let storedSession = localStorage.getItem("agronome_session_id");
        if (!storedSession || storedSession.startsWith("sess_")) {
            storedSession = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
            localStorage.setItem("agronome_session_id", storedSession);
        }
        setSessionId(storedSession);
    }, []);

    const handleAnalyze = async () => {
        if (!input.trim()) return;
        setLoading(true);
        setResult(null);
        setError(null);

        try {
            const response = await fetch(`http://${window.location.hostname}:8000/agronome/v1/analyze`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Conversation-ID": sessionId
                },
                body: JSON.stringify({ question: input })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.detail || "Erreur d'analyse");
            }

            const data = await response.json();
            setResult(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // JSON Modal State
    const [showJson, setShowJson] = useState(false);

    return (
        <div className="min-h-screen bg-[#0b1221] text-slate-200 pb-20 relative">
            {/* HER0 & INPUT */}
            <div className="max-w-4xl mx-auto pt-10 px-6">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-light text-white flex items-center justify-center gap-3">
                        <Sprout className="text-emerald-400 w-8 h-8" />
                        Agronome <span className="text-emerald-500/50 text-base font-mono mt-2">v1.0</span>
                    </h1>
                    <p className="text-slate-500 mt-2">Expertise botanique et agronomique avancée</p>
                </div>

                <div className="flex gap-3 mb-10 shadow-2xl shadow-emerald-900/10">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
                        placeholder="Quelle plante souhaitez-vous étudier ?"
                        className="flex-1 bg-[#1e293b] border border-white/10 rounded-xl py-4 px-6 text-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 placeholder-slate-600 transition-all"
                        autoFocus
                    />
                    <button
                        onClick={handleAnalyze}
                        disabled={loading || !input.trim()}
                        className="px-8 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl disabled:opacity-50 transition-colors flex items-center gap-2 font-medium text-lg shadow-lg shadow-emerald-600/20"
                    >
                        {loading ? <RefreshCw className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
                        {loading ? "Analyse..." : "Lancer"}
                    </button>

                    {/* JSON Button */}
                    {result && (
                        <button
                            onClick={() => setShowJson(true)}
                            className="px-4 bg-[#1e293b] text-slate-400 hover:text-white hover:bg-white/5 border border-white/10 rounded-xl transition-all"
                            title="Voir le JSON source"
                        >
                            <Cpu className="w-6 h-6" />
                        </button>
                    )}
                </div>
            </div>

            {/* ERROR */}
            {error && (
                <div className="max-w-4xl mx-auto px-6 mb-10">
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3 text-red-400">
                        <AlertCircle className="w-5 h-5" />
                        {error}
                    </div>
                </div>
            )}

            {/* RESULT GRID */}
            {result && (
                <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 animate-fade-in-up">

                    {/* IDENTITY CARD (Col Span 5) */}
                    <div className="lg:col-span-5 bg-[#1e293b] border border-white/5 rounded-2xl p-6 relative overflow-hidden group hover:border-emerald-500/30 transition-colors">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Info className="w-24 h-24 text-emerald-500" />
                        </div>
                        <h2 className="text-xs font-bold text-emerald-500 uppercase tracking-widest mb-4">Identité</h2>

                        <div className="mb-6">
                            <h3 className="text-3xl font-serif text-white">{result.identite.nom}</h3>
                            <p className="text-slate-400 italic text-lg mt-1">{result.identite.espece}</p>
                        </div>

                        <div className="space-y-3 text-sm text-slate-300">
                            <div className="flex justify-between border-b border-white/5 pb-2">
                                <span className="text-slate-500">Variété</span>
                                <span className="font-medium text-white">{result.identite.variete}</span>
                            </div>
                            <div className="flex justify-between border-b border-white/5 pb-2">
                                <span className="text-slate-500">Nom Latin</span>
                                <span className="font-mono text-emerald-200">{result.identite.botanique.genre} {result.identite.botanique.espece}</span>
                            </div>
                            <div className="flex justify-between border-b border-white/5 pb-2">
                                <span className="text-slate-500">Ordre</span>
                                <span>{result.identite.botanique.ordre}</span>
                            </div>
                            <div className="flex justify-between border-b border-white/5 pb-2">
                                <span className="text-slate-500">Famille</span>
                                <span>{result.identite.botanique.famille}</span>
                            </div>
                            <div className="flex justify-between border-b border-white/5 pb-2">
                                <span className="text-slate-500">Type</span>
                                <span>{result.identite.type}</span>
                            </div>
                            <div className="flex justify-between border-b border-white/5 pb-2">
                                <span className="text-slate-500">Catégorie</span>
                                <span>{result.identite.categorie}</span>
                            </div>
                        </div>

                        <div className="mt-6 flex flex-wrap gap-2">
                            {result.identite.pollinisateurs.map((p, i) => (
                                <span key={i} className="px-2 py-1 bg-white/5 text-xs text-slate-400 rounded-md border border-white/5">
                                    🐝 {p}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* PORTRAIT CARD (Col Span 7) */}
                    <div className="lg:col-span-7 bg-[#1e293b] border border-white/5 rounded-2xl p-6 relative overflow-hidden group hover:border-amber-500/30 transition-colors">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Book className="w-24 h-24 text-amber-500" />
                        </div>
                        <h2 className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-4">Portrait</h2>

                        <blockquote className="text-lg text-slate-200 leading-relaxed mb-6 font-light border-l-2 border-amber-500/50 pl-4">
                            "{result.portrait.description}"
                        </blockquote>

                        <div className="bg-[#0f172a] rounded-xl p-4 mb-6 border border-white/5 italic text-slate-400 font-serif text-center">
                            {result.portrait.poeme}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                            <div className="bg-white/5 p-3 rounded-lg">
                                <div className="text-slate-500 text-xs mb-1">Origine</div>
                                <div>{result.portrait.pays_origine}</div>
                            </div>
                            <div className="bg-white/5 p-3 rounded-lg">
                                <div className="text-slate-500 text-xs mb-1">Couleur</div>
                                <div>{result.portrait.morphologie.couleur}</div>
                            </div>
                            <div className="bg-white/5 p-3 rounded-lg">
                                <div className="text-slate-500 text-xs mb-1">Forme</div>
                                <div>{result.portrait.morphologie.forme}</div>
                            </div>
                            <div className="bg-white/5 p-3 rounded-lg">
                                <div className="text-slate-500 text-xs mb-1">Texture</div>
                                <div>{result.portrait.morphologie.texture}</div>
                            </div>
                            <div className="bg-white/5 p-3 rounded-lg">
                                <div className="text-slate-500 text-xs mb-1">Goût</div>
                                <div>{result.portrait.morphologie.gout}</div>
                            </div>
                            <div className="bg-white/5 p-3 rounded-lg">
                                <div className="text-slate-500 text-xs mb-1">Calibre</div>
                                <div>{result.portrait.morphologie.calibre}</div>
                            </div>
                        </div>
                    </div>

                    {/* AGRONOMY STRIP (Full Width) */}
                    <div className="lg:col-span-12 grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div className="bg-[#1e293b] p-4 rounded-xl border border-white/5 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-500"><Sun className="w-5 h-5" /></div>
                            <div>
                                <div className="text-xs text-slate-500 uppercase">Exposition</div>
                                <div className="text-sm font-medium">{result.agronomie.exposition}</div>
                            </div>
                        </div>
                        <div className="bg-[#1e293b] p-4 rounded-xl border border-white/5 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500"><Droplets className="w-5 h-5" /></div>
                            <div>
                                <div className="text-xs text-slate-500 uppercase">Eau</div>
                                <div className="text-sm font-medium">{result.agronomie.besoin_eau}</div>
                            </div>
                        </div>
                        <div className="bg-[#1e293b] p-4 rounded-xl border border-white/5 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-stone-500/20 flex items-center justify-center text-stone-500"><BookOpen className="w-5 h-5" /></div>
                            <div>
                                <div className="text-xs text-slate-500 uppercase">Sol ({result.agronomie.sol_ideal_ph[0]}-{result.agronomie.sol_ideal_ph[1]} pH)</div>
                                <div className="text-sm font-medium truncate" title={result.agronomie.sol_ideal}>{result.agronomie.sol_ideal}</div>
                            </div>
                        </div>
                        <div className="bg-[#1e293b] p-4 rounded-xl border border-white/5 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center text-red-500"><Thermometer className="w-5 h-5" /></div>
                            <div>
                                <div className="text-xs text-slate-500 uppercase">Rusticité</div>
                                <div className="text-sm font-medium">{result.agronomie.rusticite}</div>
                            </div>
                        </div>
                        <div className="bg-[#1e293b] p-4 rounded-xl border border-white/5 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500"><Sprout className="w-5 h-5" /></div>
                            <div>
                                <div className="text-xs text-slate-500 uppercase">Densité</div>
                                <div className="text-sm font-medium">{result.agronomie.densite}</div>
                            </div>
                        </div>
                    </div>

                    {/* CALENDAR (Full Width) */}
                    <div className="lg:col-span-12 bg-[#1e293b] border border-white/5 rounded-2xl p-6">
                        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                            <Calendar className="w-4 h-4" /> Calendrier Cultural
                        </h2>

                        <div className="grid grid-cols-12 gap-1 text-center text-xs text-slate-500 mb-2">
                            {[...Array(12)].map((_, i) => <div key={i}>{new Date(0, i).toLocaleString('fr', { month: 'short' }).slice(0, 3)}.</div>)}
                        </div>

                        {/* Semis */}
                        <div className="grid grid-cols-12 gap-1 mb-2">
                            {[...Array(12)].map((_, i) => (
                                <div key={i} className={`h-8 rounded ${result.calendrier.semis.includes(i + 1) ? 'bg-emerald-500/50' : 'bg-white/5'}`} title="Semis"></div>
                            ))}
                        </div>
                        {/* Plantation */}
                        <div className="grid grid-cols-12 gap-1 mb-2">
                            {[...Array(12)].map((_, i) => (
                                <div key={i} className={`h-8 rounded ${result.calendrier.plantation.includes(i + 1) ? 'bg-amber-500/50' : 'bg-white/5'}`} title="Plantation"></div>
                            ))}
                        </div>
                        {/* Floraison */}
                        <div className="grid grid-cols-12 gap-1 mb-2">
                            {[...Array(12)].map((_, i) => (
                                <div key={i} className={`h-8 rounded ${result.calendrier.floraison.includes(i + 1) ? 'bg-pink-500/50' : 'bg-white/5'}`} title="Floraison"></div>
                            ))}
                        </div>
                        {/* Récolte */}
                        <div className="grid grid-cols-12 gap-1 mb-2">
                            {[...Array(12)].map((_, i) => (
                                <div key={i} className={`h-8 rounded ${result.calendrier.recolte.includes(i + 1) ? 'bg-red-500/50' : 'bg-white/5'}`} title="Récolte"></div>
                            ))}
                        </div>
                        {/* Taille */}
                        <div className="grid grid-cols-12 gap-1">
                            {[...Array(12)].map((_, i) => (
                                <div key={i} className={`h-8 rounded ${result.calendrier.taille.includes(i + 1) ? 'bg-blue-500/50' : 'bg-white/5'}`} title="Taille"></div>
                            ))}
                        </div>

                        <div className="flex gap-4 mt-4 justify-end text-xs text-slate-400 flex-wrap">
                            <div className="flex items-center gap-2"><div className="w-3 h-3 bg-emerald-500/50 rounded"></div> Semis</div>
                            <div className="flex items-center gap-2"><div className="w-3 h-3 bg-amber-500/50 rounded"></div> Plantation</div>
                            <div className="flex items-center gap-2"><div className="w-3 h-3 bg-pink-500/50 rounded"></div> Floraison</div>
                            <div className="flex items-center gap-2"><div className="w-3 h-3 bg-red-500/50 rounded"></div> Récolte</div>
                            <div className="flex items-center gap-2"><div className="w-3 h-3 bg-blue-500/50 rounded"></div> Taille</div>
                        </div>
                    </div>

                    {/* GUIDE & TECH (Col Span 12) */}
                    <div className="lg:col-span-12 bg-[#1e293b] border border-white/5 rounded-2xl p-6">
                        <h2 className="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" /> Guide Technique
                        </h2>
                        <div className="grid md:grid-cols-3 gap-6">
                            <div className="space-y-4">
                                <h3 className="text-white font-medium border-b border-indigo-500/30 pb-2">Installation</h3>
                                <p className="text-sm text-slate-400 leading-relaxed">{result.guide.installation}</p>
                            </div>
                            <div className="space-y-4">
                                <h3 className="text-white font-medium border-b border-indigo-500/30 pb-2">Entretien</h3>
                                <p className="text-sm text-slate-400 leading-relaxed">{result.guide.entretien}</p>
                            </div>
                            <div className="space-y-4">
                                <h3 className="text-white font-medium border-b border-indigo-500/30 pb-2">Arrosage</h3>
                                <p className="text-sm text-slate-400 leading-relaxed">{result.guide.arrosage}</p>
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-white/5 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div>
                                <h4 className="text-xs text-red-400 uppercase mb-2 font-bold">Vigilance Maladies</h4>
                                <ul className="list-disc list-inside text-sm text-slate-400">
                                    {result.guide.maladies.map((m, i) => <li key={i}>{m}</li>)}
                                </ul>
                            </div>
                            <div>
                                <h4 className="text-xs text-amber-500 uppercase mb-2 font-bold">Signes d'Alerte</h4>
                                <ul className="list-disc list-inside text-sm text-slate-400">
                                    {result.guide.signes_alerte.map((m, i) => <li key={i}>{m}</li>)}
                                </ul>
                            </div>
                            <div>
                                <h4 className="text-xs text-blue-400 uppercase mb-2 font-bold">Actions Sanitaires</h4>
                                <ul className="list-disc list-inside text-sm text-slate-400">
                                    {result.guide.actions_sanitaire.map((m, i) => <li key={i}>{m}</li>)}
                                </ul>
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-white/5 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div>
                                <h4 className="text-xs text-emerald-400 uppercase mb-2 font-bold">Valorisation</h4>
                                <p className="text-sm text-slate-400"><span className="text-white font-medium">Récolte après:</span> {result.valorisation.nombre_jour_recolte ? result.valorisation.nombre_jour_recolte + ' jours' : 'N/A'}</p>
                                <p className="text-sm text-slate-400 mt-1"><span className="text-white font-medium">Conservation:</span> {result.valorisation.conservation}</p>
                            </div>
                            <div>
                                <h4 className="text-xs text-purple-400 uppercase mb-2 font-bold">Signes de Maturité</h4>
                                <ul className="list-disc list-inside text-sm text-slate-400">
                                    {result.valorisation.signes_maturite.map((m, i) => <li key={i}>{m}</li>)}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* JSON OVERLAY */}
            {showJson && result && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
                    <div className="bg-[#0f172a] border border-white/10 rounded-2xl w-full max-w-4xl h-[80vh] flex flex-col shadow-2xl">
                        <div className="p-4 border-b border-white/5 flex justify-between items-center">
                            <h3 className="text-lg font-mono text-emerald-400 flex items-center gap-2">
                                <Cpu className="w-4 h-4" />
                                Source JSON
                            </h3>
                            <button
                                onClick={() => setShowJson(false)}
                                className="text-slate-400 hover:text-white transition-colors"
                            >
                                Fermer
                            </button>
                        </div>
                        <div className="flex-1 overflow-auto p-6 bg-[#0b1221]">
                            <pre className="font-mono text-xs text-emerald-100 leading-relaxed">
                                {JSON.stringify(result, null, 2)}
                            </pre>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

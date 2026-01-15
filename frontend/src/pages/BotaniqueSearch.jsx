import { useState, useEffect } from 'react';
import { Search, Loader2, Sprout, CloudRain, ShoppingBasket, Sun, Droplets, Ruler, Palette, Shapes, Wind, Leaf, Tag, Utensils, Save, Trash2, ArrowLeft, Bookmark, Globe, Feather, MoveHorizontal, ArrowLeftRight } from 'lucide-react';
import { fetchBotaniqueInfo, savePlant, getSavedPlants, updatePlant } from '../services/api';

// --- Helper Components (Duplicated) ---
// Note: Ideally these should be in a separate file.

const Badge = ({ text, color, icon: Icon }) => (
    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border flex items-center gap-2 ${color}`}>
        {Icon && <Icon size={12} />}
        {text}
    </span>
);

const FeatureCard = ({ icon: Icon, label, value, fullWidth }) => {
    if (!value) return null;
    return (
        <div className={`bg-white/5 border border-white/5 rounded-xl p-4 flex flex-col gap-2 hover:bg-white/10 transition-colors ${fullWidth ? 'col-span-2' : ''}`}>
            <div className="flex items-center gap-2 text-opal">
                <Icon size={16} />
                <span className="text-xs font-medium uppercase tracking-wide opacity-80">{label}</span>
            </div>
            <span className="text-white font-light text-lg leading-tight">{value}</span>
        </div>
    );
};

const CalendarGrid = ({ title, months, icon: Icon, colorClass }) => {
    const allMonths = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
    const fullMonths = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2 text-slate-300">
                <Icon size={16} className="text-slate-400" />
                <span className="text-xs font-bold uppercase tracking-wider">{title}</span>
            </div>

            <div className="flex justify-between items-center bg-black/20 p-2 rounded-xl border border-white/5">
                {allMonths.map((m, index) => {
                    const isMonthActive = (months || []).some(activeMonth => activeMonth.toLowerCase().startsWith(fullMonths[index].toLowerCase().slice(0, 3)));

                    return (
                        <div key={index} className="flex flex-col items-center gap-1 group relative">
                            <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-medium transition-all duration-300 ${isMonthActive
                                ? `${colorClass} shadow-[0_0_10px_rgba(255,255,255,0.2)] scale-110`
                                : 'text-slate-600 bg-white/5'
                                }`}>
                                {m}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// --- Main Component ---

const BotaniqueSearch = () => {
    const [query, setQuery] = useState('');
    const [data, setData] = useState(null);
    const [usage, setUsage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [savedPlants, setSavedPlants] = useState([]);
    const [error, setError] = useState(null);
    const [existingPlantId, setExistingPlantId] = useState(null);

    // Initial load of saved plants for duplicate detection ONLY
    useEffect(() => {
        loadSavedPlants();
    }, []);

    const loadSavedPlants = async () => {
        try {
            const plants = await getSavedPlants();
            setSavedPlants(plants || []);
        } catch (err) {
            console.error(err);
        }
    };

    const triggerSearch = async (q) => {
        if (!q.trim()) return;

        setLoading(true);
        setError(null);
        setData(null);
        setUsage(null);
        setExistingPlantId(null);

        try {
            const result = await fetchBotaniqueInfo(q);
            const resultData = result.data;
            setData(resultData);
            setUsage(result.usage);

            // Duplicate Detection
            checkDuplicate(resultData);

        } catch (err) {
            console.error(err);
            setError(`Erreur: ${err.message || "Impossible de récupérer les informations."}`);
        } finally {
            setLoading(false);
        }
    };

    const checkDuplicate = (resultData) => {
        const duplicate = savedPlants.find(p => {
            const pVariete = (p.variete || '').toLowerCase().trim();
            const pNom = (p.nom_commun || '').toLowerCase().trim();
            const rVariete = (resultData.taxonomie.variete || '').toLowerCase().trim();
            const rNom = (resultData.taxonomie.nom_commun || '').toLowerCase().trim();

            if (rVariete && pVariete === rVariete && pNom === rNom) return true;
            if (!rVariete && !pVariete && pNom === rNom) return true;
            return false;
        });

        if (duplicate) {
            setExistingPlantId(duplicate.id);
        }
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        triggerSearch(query);
    };

    const handleSave = async () => {
        if (!data) return;
        setSaving(true);
        try {
            if (existingPlantId) {
                // UPDATE Mode
                await updatePlant(existingPlantId, data);
            } else {
                // CREATE Mode
                await savePlant(data);
            }

            // Reload list for future duplicate checks
            await loadSavedPlants();
            // We usually clear data or stay? 
            // Better to show "Saved" state.
            // For now, let's just alert or change button state.
            alert("Plante sauvegardée !");
        } catch (err) {
            console.error(err);
            setError(err.message || "Erreur lors de la sauvegarde.");
        } finally {
            setSaving(false);
        }
    };

    const clearSearch = () => {
        setData(null);
        setUsage(null);
        setQuery("");
        setError(null);
    };

    return (
        <div className="space-y-8 animate-fade-in text-white/90">
            {/* Global Loader Overlay */}
            {loading && (
                <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-black/40 p-8 rounded-2xl border border-white/10 flex flex-col items-center gap-4 shadow-2xl">
                        <Loader2 size={48} className="text-opal animate-spin" />
                        <div className="text-center space-y-1">
                            <h3 className="text-xl font-light text-white">Analyse en cours...</h3>
                            <p className="text-sm text-slate-400">L'agent explore la base de connaissances.</p>
                        </div>
                    </div>
                </div>
            )}

            <header className="flex justify-between items-start">
                <div>
                    <h2 className="text-3xl font-light tracking-wide text-white">Agent Botanique</h2>
                    <p className="text-slate-300 font-light mt-2 flex items-center gap-2">
                        Recherchez des variétés pour obtenir leur fiche technique.
                        {usage && (
                            <span className="ml-4 px-2 py-1 bg-white/5 border border-white/10 rounded-md text-xs font-mono text-emerald-400/80 flex items-center gap-2">
                                <span title="Input Tokens">In: {usage.input}</span>
                                <span className="text-slate-600">|</span>
                                <span title="Output Tokens">Out: {usage.output}</span>
                            </span>
                        )}
                    </p>
                </div>
            </header>

            {/* Search Bar */}
            <div className="glass-panel p-4 rounded-2xl max-w-2xl border border-white/5 flex gap-4">
                {data && (
                    <button
                        onClick={clearSearch}
                        className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-slate-300 transition-colors"
                        title="Nouvelle recherche"
                    >
                        <ArrowLeft size={20} />
                    </button>
                )}

                <form onSubmit={handleSearch} className="flex-1 flex gap-4">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Ex: Tomate Marmande, Rosier..."
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-opal/50 text-white placeholder-slate-500 font-light"
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-emerald-600/80 hover:bg-emerald-500/80 text-white px-6 py-3 rounded-xl font-medium transition-colors flex items-center gap-2 shadow-lg shadow-emerald-900/20 backdrop-blur-sm"
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />}
                        <span className="hidden sm:inline">Rechercher</span>
                    </button>
                </form>
            </div>

            {error && (
                <div className="bg-red-500/10 text-red-200 p-4 rounded-xl border border-red-500/20 backdrop-blur-md">
                    {error}
                </div>
            )}

            {!data && !loading && !error && (
                <div className="text-center py-24 text-slate-500 italic font-light">
                    Lancez une recherche pour afficher les informations d'une plante.
                </div>
            )}

            {data && (
                <div className="space-y-6 animate-slide-up">
                    {/* Carte Identité */}
                    <div className="glass p-0 rounded-2xl relative overflow-hidden bg-gradient-to-br from-white/10 to-transparent">
                        <div className="absolute -right-10 -bottom-10 opacity-5 pointer-events-none">
                            <Leaf size={300} strokeWidth={0.5} />
                        </div>
                        <div className="absolute top-6 right-6 flex gap-2 z-20">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className={`px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-medium transition-colors backdrop-blur-md border ${existingPlantId
                                    ? 'bg-blue-500/20 text-blue-100 border-blue-500/30 hover:bg-blue-500/30'
                                    : 'bg-white/10 hover:bg-white/20 text-white border-white/10'
                                    }`}
                            >
                                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                {existingPlantId ? 'Mettre à jour' : 'Sauvegarder'}
                            </button>
                        </div>

                        <div className="p-8 pb-4 relative z-10">
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mr-4">
                                <div className="space-y-2">
                                    <h1 className="text-5xl font-extralight text-white tracking-tight flex flex-wrap items-baseline gap-3">
                                        {data.taxonomie.variete ? (
                                            <>
                                                {data.taxonomie.variete}
                                                <span className="text-2xl text-opal/80 font-thin italic">
                                                    {data.taxonomie.nom_commun}
                                                </span>
                                            </>
                                        ) : (
                                            data.taxonomie.nom_commun
                                        )}
                                    </h1>
                                    <h2 className="text-lg text-slate-400 font-mono italic">
                                        {data.taxonomie.genre} {data.taxonomie.espece}
                                    </h2>
                                </div>
                            </div>
                        </div>
                        <div className="h-1 w-full bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="glass p-6 rounded-2xl space-y-6 h-full flex flex-col">
                            <h3 className="text-sm font-medium text-opal border-b border-white/10 pb-2 tracking-wider uppercase flex items-center gap-2">
                                <Sun size={16} /> Recommandations de Culture
                            </h3>
                            <div className="space-y-8 pt-2 flex-grow">
                                <CalendarGrid title="Semis (Abri)" months={data.calendrier.semis_sous_abri} icon={Sprout} colorClass="bg-blue-500 text-blue-100" />
                                <CalendarGrid title="Semis (Pleine Terre)" months={data.calendrier.semis_pleine_terre} icon={CloudRain} colorClass="bg-emerald-500 text-emerald-100" />
                                <CalendarGrid title="Récolte" months={data.calendrier.recolte} icon={ShoppingBasket} colorClass="bg-orange-500 text-orange-100" />
                            </div>
                        </div>

                        <div className="glass p-6 rounded-2xl space-y-6 h-full">
                            <h3 className="text-sm font-medium text-opal border-b border-white/10 pb-2 tracking-wider uppercase flex items-center gap-2">
                                <Droplets size={16} /> Caractéristiques
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <FeatureCard icon={Utensils} label="Saveur" value={data.caracteristiques.saveur} />
                                <FeatureCard icon={Feather} label="Texture" value={data.caracteristiques.texture} />
                                <FeatureCard icon={Ruler} label="Calibre" value={data.caracteristiques.calibre} />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BotaniqueSearch;

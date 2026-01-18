import { useState, useEffect } from 'react';
import { Loader2, Sprout, CloudRain, ShoppingBasket, Sun, Droplets, Ruler, Palette, Shapes, Wind, Leaf, Tag, Utensils, Save, Trash2, ArrowLeft, Bookmark, Globe, Feather, MoveHorizontal, ArrowLeftRight, RefreshCcw } from 'lucide-react';
import { fetchBotaniqueInfo, savePlant, getSavedPlants, deletePlant, updatePlant } from '../services/api';
import FicheDetail from '../components/FicheDetail';

// --- Helper Components Definition (Duplicated for isolation) ---

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

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2 text-slate-300">
                <Icon size={16} className="text-slate-400" />
                <span className="text-xs font-bold uppercase tracking-wider">{title}</span>
            </div>

            <div className="flex justify-between items-center bg-black/20 p-2 rounded-xl border border-white/5">
                {allMonths.map((m, index) => {
                    // Handle both Integers (1-based) and Strings
                    // index is 0-based. So Jan = 0 (chk 1), Feb = 1 (chk 2).
                    const monthIndex = index + 1;

                    let isActive = false;
                    if (Array.isArray(months)) {
                        isActive = months.some(val => {
                            if (typeof val === 'number') return val === monthIndex;
                            if (typeof val === 'string') {
                                // Fallback for old string data "Janvier" etc
                                const fullMonths = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
                                return val.toLowerCase().startsWith(fullMonths[index].slice(0, 3));
                            }
                            return false;
                        });
                    }

                    return (
                        <div key={index} className="flex flex-col items-center gap-1 group relative">
                            <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-medium transition-all duration-300 ${isActive
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

const PlantCard = ({ plant, onClick, onDelete, onUpdate, isOutdated }) => (
    <div
        onClick={onClick}
        className="glass-panel p-6 rounded-xl border border-white/5 hover:bg-white/10 hover:border-opal/30 transition-all cursor-pointer group relative overflow-hidden"
    >
        {/* Action Top Right (Badges & Delete) */}
        <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-2 text-right">
            <div className="flex gap-1">
                {isOutdated && (
                    <button
                        onClick={(e) => onUpdate(plant, e)}
                        className="text-amber-400 hover:text-amber-300 p-1 mb-1 bg-amber-500/10 rounded-md border border-amber-500/20 shadow-[0_0_10px_rgba(251,191,36,0.1)] transition-colors animate-pulse"
                        title="Nouvelle version de l'IA disponible"
                    >
                        <RefreshCcw size={16} />
                    </button>
                )}
                {/* Delete Button */}
                <button
                    onClick={(e) => onDelete(plant.id, e)}
                    className="text-slate-500 hover:text-red-400 p-1 mb-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    <Trash2 size={16} />
                </button>
            </div>

            {plant.categorie && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide bg-teal-500/20 text-teal-200 border border-teal-500/20 shadow-sm backdrop-blur-sm">
                    {plant.categorie}
                </span>
            )}
            {plant.cycle_vie_type && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide bg-indigo-500/20 text-indigo-200 border border-indigo-500/20 shadow-sm backdrop-blur-sm">
                    {plant.cycle_vie_type}
                </span>
            )}
        </div>

        <div className="space-y-1 relative z-10 pr-14 mt-1">
            {plant.variete ? (
                <>
                    <h4 className="text-xl font-light text-white leading-tight break-words">{plant.variete}</h4>
                    <p className="text-sm text-opal/80 italic">{plant.nom_commun}</p>
                </>
            ) : (
                <h4 className="text-xl font-light text-white leading-tight break-words">{plant.nom_commun}</h4>
            )}

            <div className="pt-2 mt-2 border-t border-white/5 opacity-60 flex justify-between items-center">
                <p className="text-xs text-slate-500 font-mono italic truncate">{plant.espece}</p>
            </div>
        </div>

        <div className="absolute -bottom-4 -right-4 text-white/5 transform rotate-[-15deg] pointer-events-none">
            <Leaf size={80} strokeWidth={0.5} />
        </div>
    </div>
);

// --- Main Component ---

// --- Main Component ---

const FichesList = () => {
    const [fiches, setFiches] = useState([]);
    const [data, setData] = useState(null); // Detail View Data (Full Fiche)
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [viewMode, setViewMode] = useState('grid');
    const [editingId, setEditingId] = useState(null);

    // Initial load
    useEffect(() => {
        loadFiches();
    }, []);

    const loadFiches = async () => {
        setLoading(true);
        try {
            const res = await fetch(`http://${window.location.hostname}:8000/botanique/fiches/summary?limit=100`);
            if (!res.ok) throw new Error("Erreur chargement fiches");
            const list = await res.json();
            setFiches(list || []);
        } catch (err) {
            console.error("Failed to load fiches", err);
            setError("Impossible de charger la liste des fiches.");
        } finally {
            setLoading(false);
        }
    };

    const handleSelectFiche = async (id) => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`http://${window.location.hostname}:8000/botanique/fiches/${id}`);
            if (!res.ok) throw new Error("Erreur chargement fiche");
            const fiche = await res.json();
            // Wrap in expected structure if needed, or adapt UI.
            // DB returns FicheBotaniqueDB: { id, data: {...}, nom, ... }
            // UI expects 'data' to be the content of the fiche (identite, portrait...)
            // So we set data = fiche.data (plus top level id injection if needed)
            setData({ ...fiche.data, id: fiche.id });
            setEditingId(fiche.id);
        } catch (err) {
            setError("Impossible de charger le détail de la fiche.");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async () => {
        if (!data || !editingId) return;
        setSaving(true);
        try {
            // Re-wrap to FichePlant structure ? 
            // DB expects FichePlant. data from state IS FichePlant structure logic.
            const res = await fetch(`http://${window.location.hostname}:8000/botanique/fiches/${editingId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });

            if (!res.ok) throw new Error("Erreur sauvegarde");

            await loadFiches();
            setData(null);
            setEditingId(null);
        } catch (err) {
            console.error(err);
            setError(err.message || "Erreur lors de la sauvegarde.");
        } finally {
            setSaving(false);
        }
    };

    const handleRefreshSmart = async (e, fiche) => {
        e.stopPropagation();
        alert("La mise à jour IA n'est pas encore câblée sur ce nouvel écran.");
    };

    const handleDelete = async (id, e) => {
        e.stopPropagation();
        alert("La suppression n'est pas encore implémentée sur l'API.");
    };

    const closeDetail = () => {
        setData(null);
        setEditingId(null);
        setError(null);
    };

    return (
        <div className="space-y-8 animate-fade-in text-white/90">
            {loading && (
                <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
                    <Loader2 size={48} className="text-opal animate-spin" />
                </div>
            )}

            <header className="flex justify-between items-start">
                <div>
                    <h2 className="text-3xl font-light tracking-wide text-white">Mes Fiches</h2>
                    <p className="text-slate-300 font-light mt-2">
                        Référentiel botanique (Sauvegardé en Base).
                    </p>
                </div>
            </header>

            {error && (
                <div className="bg-red-500/10 text-red-200 p-4 rounded-xl border border-red-500/20 backdrop-blur-md">
                    {error}
                </div>
            )}

            {!data ? (
                /* Fiche List */
                <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                        <h3 className="text-xl font-light text-opal">Inventaire ({fiches.length})</h3>
                        <div className="flex bg-white/5 rounded-lg p-1 border border-white/10">
                            <button
                                onClick={() => loadFiches()}
                                className="px-3 py-1.5 rounded-md text-xs font-medium text-slate-400 hover:text-white flex items-center gap-2"
                            >
                                <RefreshCcw size={14} /> Actualiser
                            </button>
                        </div>
                    </div>

                    {fiches.length === 0 ? (
                        <div className="text-center py-12 text-slate-500 italic font-light bg-white/5 rounded-2xl border border-white/5 border-dashed">
                            Aucune fiche trouvée. Créez-en une via l'Agent Botanique.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {fiches.map((fiche) => (
                                <PlantCard
                                    key={fiche.id}
                                    plant={{
                                        id: fiche.id,
                                        nom_commun: fiche.nom,
                                        variete: fiche.variete,
                                        espece: fiche.espece
                                        // categorie/type missing for badge, optional
                                    }}
                                    onClick={() => handleSelectFiche(fiche.id)}
                                    onDelete={(e) => handleDelete(fiche.id, e)}
                                    onUpdate={(e) => handleRefreshSmart(e, fiche)}
                                    isOutdated={false}
                                />
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                /* Detail View */
                <div className="space-y-6 animate-slide-up">
                    <button
                        onClick={closeDetail}
                        className="bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl text-slate-300 transition-colors flex items-center gap-2 mb-4"
                    >
                        <ArrowLeft size={16} /> Retour à la liste
                    </button>

                    <FicheDetail
                        data={data}
                        headerActions={
                            <button
                                onClick={handleUpdate}
                                disabled={saving}
                                className="px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-medium transition-colors backdrop-blur-md border bg-blue-500/20 text-blue-100 border-blue-500/30 hover:bg-blue-500/30"
                            >
                                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                Mettre à jour
                            </button>
                        }
                    />
                </div>
            )}
        </div>
    );
};

export default FichesList;

import { useState, useEffect } from 'react';
import { Loader2, Sprout, CloudRain, ShoppingBasket, Sun, Droplets, Ruler, Palette, Shapes, Wind, Leaf, Tag, Utensils, Save, Trash2, ArrowLeft, Bookmark, Globe, Feather, MoveHorizontal, ArrowLeftRight, RefreshCcw } from 'lucide-react';
import { fetchBotaniqueInfo, savePlant, getSavedPlants, deletePlant, updatePlant } from '../services/api';

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

const PlantsList = () => {
    const [data, setData] = useState(null); // Used to show Detail View
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [savedPlants, setSavedPlants] = useState([]);
    const [error, setError] = useState(null);
    const [viewMode, setViewMode] = useState('grid');
    const [existingPlantId, setExistingPlantId] = useState(null);

    // Initial load
    useEffect(() => {
        loadSavedPlants();
    }, []);

    const loadSavedPlants = async () => {
        try {
            const plants = await getSavedPlants();
            setSavedPlants(plants || []);
        } catch (err) {
            console.error("Failed to load saved plants", err);
        }
    };

    // Note: Update Logic requires fetching info from AI.
    // Since we removed search bar, `handleRefreshPlant` needs to perform `fetchBotaniqueInfo`.
    // We can keep a hidden query or simple function.
    const handleRefreshPlant = async (plant, e) => {
        e.stopPropagation();
        setLoading(true);
        try {
            const name = plant.nom_commun;
            const variety = plant.variete;
            const searchQuery = variety ? `${name} ${variety}` : name;

            // Fetch fresh info
            const result = await fetchBotaniqueInfo(searchQuery);
            const resultData = result.data;

            // Now show details and prepare ONLY for update (as it already exists)
            setData(resultData);
            setExistingPlantId(plant.id);
        } catch (err) {
            setError("Erreur mise à jour: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!data || !existingPlantId) return; // Only Update allowed here mostly, unless we add "Create New"? User said "List Only".
        setSaving(true);
        try {
            await updatePlant(existingPlantId, data);
            await loadSavedPlants();
            setData(null); // Close details after save
            setExistingPlantId(null);
        } catch (err) {
            console.error(err);
            setError(err.message || "Erreur lors de la sauvegarde.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id, e) => {
        e.stopPropagation();
        if (!window.confirm("Supprimer cette plante ?")) return;
        try {
            await deletePlant(id);
            setSavedPlants(prev => prev.filter(p => p.id !== id));
            if (data && existingPlantId === id) {
                setData(null); // Close detail if deleted
            }
        } catch (err) {
            console.error("Deletion failed", err);
        }
    };

    const handleSelectPlant = async (plantId) => {
        setLoading(true);
        try {
            const response = await fetch(`/api/botanique/plantes/${plantId}`);
            if (!response.ok) throw new Error("Erreur chargement");
            const plant = await response.json();
            setData(plant.data);
            setExistingPlantId(plant.id); // Mark as editing this ID
        } catch (err) {
            setError("Impossible de charger la plante.");
        } finally {
            setLoading(false);
        }
    };

    const closeDetail = () => {
        setData(null);
        setExistingPlantId(null);
        setError(null);
    };

    // Helper to group plants
    const getGroupedPlants = () => {
        const groups = {};
        if (!savedPlants) return groups;
        savedPlants.forEach(plant => {
            const cat = plant.categorie || 'Autres';
            const type = plant.cycle_vie_type || '';
            const key = type ? `${cat} • ${type}` : cat;
            if (!groups[key]) groups[key] = [];
            groups[key].push(plant);
        });
        return groups;
    };

    const groupedPlants = getGroupedPlants();

    return (
        <div className="space-y-8 animate-fade-in text-white/90">
            {loading && (
                <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
                    <Loader2 size={48} className="text-opal animate-spin" />
                </div>
            )}

            <header className="flex justify-between items-start">
                <div>
                    <h2 className="text-3xl font-light tracking-wide text-white">Mes Variétés</h2>
                    <p className="text-slate-300 font-light mt-2">
                        Référentiel de vos variétés cultivées.
                    </p>
                </div>
            </header>

            {error && (
                <div className="bg-red-500/10 text-red-200 p-4 rounded-xl border border-red-500/20 backdrop-blur-md">
                    {error}
                </div>
            )}

            {!data ? (
                /* Saved Plants List */
                <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                        <h3 className="text-xl font-light text-opal">Inventaire</h3>
                        <div className="flex bg-white/5 rounded-lg p-1 border border-white/10">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-2 ${viewMode === 'grid' ? 'bg-opal/20 text-opal shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                            >
                                <Shapes size={14} /> Grille
                            </button>
                            <button
                                onClick={() => setViewMode('grouped')}
                                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-2 ${viewMode === 'grouped' ? 'bg-opal/20 text-opal shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                            >
                                <Tag size={14} /> Groupé
                            </button>
                        </div>
                    </div>

                    {savedPlants.length === 0 ? (
                        <div className="text-center py-12 text-slate-500 italic font-light bg-white/5 rounded-2xl border border-white/5 border-dashed">
                            Aucune plante définie. Utilisez l'Agent Botanique pour en ajouter.
                        </div>
                    ) : (
                        <>
                            {viewMode === 'grid' ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {savedPlants.map((plant) => (
                                        <PlantCard
                                            key={plant.id}
                                            plant={plant}
                                            onClick={() => handleSelectPlant(plant.id)}
                                            onDelete={handleDelete}
                                            onUpdate={handleRefreshPlant}
                                            isOutdated={plant.needs_update}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-8">
                                    {Object.entries(groupedPlants).sort().map(([groupTitle, plants]) => (
                                        <div key={groupTitle} className="space-y-3">
                                            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 pl-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-opal"></div>
                                                {groupTitle}
                                                <span className="text-xs font-normal opacity-50">({plants.length})</span>
                                            </h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {plants.map((plant) => (
                                                    <PlantCard
                                                        key={plant.id}
                                                        plant={plant}
                                                        onClick={() => handleSelectPlant(plant.id)}
                                                        onDelete={handleDelete}
                                                        onUpdate={handleRefreshPlant}
                                                        isOutdated={plant.needs_update}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            ) : (
                /* Detail View (Simplified for Reference Viewing) */
                <div className="space-y-6 animate-slide-up">
                    <button
                        onClick={closeDetail}
                        className="bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl text-slate-300 transition-colors flex items-center gap-2 mb-4"
                    >
                        <ArrowLeft size={16} /> Retour à la liste
                    </button>

                    {/* Carte Identité */}
                    <div className="glass p-0 rounded-2xl relative overflow-hidden bg-gradient-to-br from-white/10 to-transparent">
                        <div className="absolute -right-10 -bottom-10 opacity-5 pointer-events-none">
                            <Leaf size={300} strokeWidth={0.5} />
                        </div>
                        {/* Save/Update Button */}
                        <div className="absolute top-6 right-6 flex gap-2 z-20">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-medium transition-colors backdrop-blur-md border bg-blue-500/20 text-blue-100 border-blue-500/30 hover:bg-blue-500/30"
                            >
                                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                Mettre à jour
                            </button>
                        </div>

                        <div className="p-8 pb-4 relative z-10">
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mr-4">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Badge text={data.cycle_vie.type} color="bg-indigo-500/30 text-indigo-100 border-indigo-400/20" icon={Sun} />
                                        <Badge text={data.categorisation.categorie} color="bg-teal-500/30 text-teal-100 border-teal-400/20" icon={Tag} />
                                    </div>
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
                        {/* Carte Culture */}
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

                        {/* Carte Caractéristiques */}
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

export default PlantsList;

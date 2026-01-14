import { useState, useEffect } from 'react';
import { Search, Loader2, Sprout, CloudRain, ShoppingBasket, Sun, Droplets, Ruler, Palette, Shapes, Wind, Leaf, Tag, Utensils, Save, Trash2, ArrowLeft, Bookmark, Globe, Feather } from 'lucide-react';
import { fetchBotaniqueInfo, savePlant, getSavedPlants, deletePlant } from '../services/api';

// --- Helper Components Definition (Before main component) ---

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

    // Normalisation basique
    const normalizedActiveMonths = (months || []).map(m => m.toLowerCase().slice(0, 3));

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

const PlantCard = ({ plant, onClick, onDelete }) => (
    <div
        onClick={onClick}
        className="glass-panel p-6 rounded-xl border border-white/5 hover:bg-white/10 hover:border-opal/30 transition-all cursor-pointer group relative overflow-hidden"
    >
        {/* Action Top Right (Badges & Delete) */}
        <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-2 text-right">
            {/* Delete Button */}
            <button
                onClick={(e) => onDelete(plant.id, e)}
                className="text-slate-500 hover:text-red-400 p-1 mb-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity"
            >
                <Trash2 size={16} />
            </button>

            {/* Badges Stacked Vertical */}
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

        {/* Main Content (Left with padding to avoid overlap) */}
        <div className="space-y-1 relative z-10 pr-14 mt-1">
            {/* Logic: Variété highlighted if exists, otherwise Common Name */}
            {plant.variete ? (
                <>
                    <h4 className="text-xl font-light text-white leading-tight break-words">{plant.variete}</h4>
                    <p className="text-sm text-opal/80 italic">{plant.nom_commun}</p>
                </>
            ) : (
                <h4 className="text-xl font-light text-white leading-tight break-words">{plant.nom_commun}</h4>
            )}

            <div className="pt-2 mt-2 border-t border-white/5 opacity-60">
                <p className="text-xs text-slate-500 font-mono italic truncate">{plant.espece}</p>
            </div>
        </div>

        {/* Decorative BG Icon */}
        <div className="absolute -bottom-4 -right-4 text-white/5 transform rotate-[-15deg] pointer-events-none">
            <Leaf size={80} strokeWidth={0.5} />
        </div>
    </div>
);

// --- Main Component ---

const Botanique = () => {
    const [query, setQuery] = useState('');
    const [data, setData] = useState(null);
    const [usage, setUsage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [savedPlants, setSavedPlants] = useState([]);
    const [error, setError] = useState(null);
    const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'grouped'
    const [isSavedView, setIsSavedView] = useState(false);
    const [existingPlantId, setExistingPlantId] = useState(null); // ID of potentially duplicate plant

    // Initial load of saved plants
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

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        setError(null);
        setData(null);
        setUsage(null);
        setIsSavedView(false);
        setExistingPlantId(null);

        try {
            const result = await fetchBotaniqueInfo(query);
            // result = { data: {...}, usage: {...} }
            const resultData = result.data;
            setData(resultData);
            setUsage(result.usage);

            // Duplicate Detection Logic
            // We verify if a plant with same (variete + nom_commun) OR (nom_commun if no variete) already exists
            const duplicate = savedPlants.find(p => {
                const pVariete = (p.variete || '').toLowerCase().trim();
                const pNom = (p.nom_commun || '').toLowerCase().trim();
                const rVariete = (resultData.taxonomie.variete || '').toLowerCase().trim();
                const rNom = (resultData.taxonomie.nom_commun || '').toLowerCase().trim();
                const rEspece = (resultData.taxonomie.espece || '').toLowerCase().trim(); // Added extra check for species safety
                const pEspece = (p.espece || '').toLowerCase().trim();

                // 1. Variete Match (Strongest)
                if (rVariete && pVariete === rVariete && pNom === rNom) return true;

                // 2. No Variete? Match Name + Species
                if (!rVariete && !pVariete && pNom === rNom) return true;

                return false;
            });

            if (duplicate) {
                setExistingPlantId(duplicate.id);
            }

        } catch (err) {
            console.error(err);
            setError(`Erreur: ${err.message || "Impossible de récupérer les informations."}`);
        } finally {
            setLoading(false);
        }
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

            await loadSavedPlants();
            setIsSavedView(true); // Mark as saved/viewed
            setExistingPlantId(null); // Reset update state as it is now "viewed"
        } catch (err) {
            setError("Erreur lors de la sauvegarde.");
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
            if (data && isSavedView) {
                // Return to list if we delete the currently viewed saved plant
                clearSearch();
            }
        } catch (err) {
            console.error("Deletion failed", err);
        }
    };

    const handleSelectPlant = async (plantId) => {
        setLoading(true);
        setUsage(null); // No usage stats for saved items
        setIsSavedView(true);
        try {
            const response = await fetch(`/api/botanique/plantes/${plantId}`);
            if (!response.ok) throw new Error("Erreur chargement");
            const plant = await response.json();
            setData(plant.data);
            setQuery("");
        } catch (err) {
            setError("Impossible de charger la plante sauvegardée.");
        } finally {
            setLoading(false);
        }
    };

    const clearSearch = () => {
        setData(null);
        setUsage(null);
        setQuery("");
        setError(null);
        setIsSavedView(false);
    };

    // Helper to group plants
    const getGroupedPlants = () => {
        const groups = {};
        if (!savedPlants) return groups;

        savedPlants.forEach(plant => {
            // Key: "Fruitier - Vivace" or just "Fruitier" if type missing
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
            <header className="flex justify-between items-start">
                <div>
                    <h2 className="text-3xl font-light tracking-wide text-white">Agent Botanique</h2>
                    <p className="text-slate-300 font-light mt-2 flex items-center gap-2">
                        Interrogez l'IA pour obtenir la fiche technique de vos plantes.
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

            {/* Search Bar & Navigation */}
            <div className="glass-panel p-4 rounded-2xl max-w-2xl border border-white/5 flex gap-4">
                {data && (
                    <button
                        onClick={clearSearch}
                        className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-slate-300 transition-colors"
                        title="Retour à la liste"
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

            {/* Error Message */}
            {error && (
                <div className="bg-red-500/10 text-red-200 p-4 rounded-xl border border-red-500/20 backdrop-blur-md">
                    {error}
                </div>
            )}

            {/* DATA DISPLAY OR LIST */}
            {!data ? (
                /* Saved Plants List */
                <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                        <h3 className="text-xl font-light text-opal">Mes Plantes Sauvegardées</h3>

                        {/* View Toggle */}
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
                            Aucune plante sauvegardée pour le moment.
                        </div>
                    ) : (
                        <>
                            {viewMode === 'grid' ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {savedPlants.map((plant) => (
                                        <PlantCard key={plant.id} plant={plant} onClick={() => handleSelectPlant(plant.id)} onDelete={handleDelete} />
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
                                                    <PlantCard key={plant.id} plant={plant} onClick={() => handleSelectPlant(plant.id)} onDelete={handleDelete} />
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
                /* Detail View */
                <div className="space-y-6 animate-slide-up">

                    {/* Carte Identité (Full Width) */}
                    <div className="glass p-0 rounded-2xl relative overflow-hidden bg-gradient-to-br from-white/10 to-transparent">
                        {/* Background Decoratif */}
                        <div className="absolute -right-10 -bottom-10 opacity-5 pointer-events-none">
                            <Leaf size={300} strokeWidth={0.5} />
                        </div>
                        {/* Action Header on Card */}
                        <div className="absolute top-6 right-6 flex gap-2 z-20">
                            <button
                                onClick={handleSave}
                                disabled={saving || isSavedView}
                                className={`px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-medium transition-colors backdrop-blur-md border ${saving || isSavedView
                                    ? 'bg-white/5 text-slate-400 border-white/5 cursor-not-allowed'
                                    : existingPlantId
                                        ? 'bg-blue-500/20 text-blue-100 border-blue-500/30 hover:bg-blue-500/30' // Update Style
                                        : 'bg-white/10 hover:bg-white/20 text-white border-white/10' // Save Style
                                    }`}
                            >
                                {saving ? <Loader2 size={16} className="animate-spin" /> : (
                                    isSavedView ? <Bookmark size={16} /> : (existingPlantId ? <Save size={16} /> : <Save size={16} />)
                                )}
                                {isSavedView ? 'Enregistré' : (saving ? '...' : (existingPlantId ? 'Mettre à jour' : 'Sauvegarder'))}
                            </button>
                        </div>

                        {/* Contenu Header */}
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

                                {/* Taxonomie Visuelle (Avec Marge Top pour éviter le bouton) */}
                                <div className="bg-black/20 p-4 rounded-xl border border-white/5 backdrop-blur-sm flex flex-col gap-2 min-w-[200px] mt-12 md:mt-16">
                                    <div className="flex items-center justify-between text-xs text-slate-400 uppercase tracking-wider">
                                        <span>Ordre</span>
                                        <span className="text-white font-medium">{data.taxonomie.ordre || '?'}</span>
                                    </div>
                                    <div className="w-full h-px bg-white/10"></div>
                                    <div className="flex items-center justify-between text-xs text-slate-400 uppercase tracking-wider">
                                        <span>Famille</span>
                                        <span className="text-white font-medium">{data.taxonomie.famille || '?'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Divider intégré */}
                        <div className="h-1 w-full bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                        {/* Carte Calendrier (Gauche) */}
                        <div className="glass p-6 rounded-2xl space-y-6 h-full">
                            <h3 className="text-sm font-medium text-opal border-b border-white/10 pb-2 tracking-wider uppercase flex items-center gap-2">
                                <Sun size={16} /> Calendrier Cultural
                            </h3>
                            <div className="space-y-8 pt-2">
                                <CalendarGrid title="Semis (Abri)" months={data.calendrier.semis_sous_abri} icon={Sprout} colorClass="bg-blue-500 text-blue-100" />
                                <CalendarGrid title="Semis (Pleine Terre)" months={data.calendrier.semis_pleine_terre} icon={CloudRain} colorClass="bg-emerald-500 text-emerald-100" />
                                <CalendarGrid title="Récolte" months={data.calendrier.recolte} icon={ShoppingBasket} colorClass="bg-orange-500 text-orange-100" />
                                {data.cycle_vie.type === 'VIVACE' && (
                                    <CalendarGrid title="Floraison" months={data.calendrier.floraison} icon={Palette} colorClass="bg-pink-500 text-pink-100" />
                                )}
                            </div>
                        </div>

                        {/* Carte Caractéristiques (Droite) */}
                        <div className="glass p-6 rounded-2xl space-y-6 h-full">
                            <h3 className="text-sm font-medium text-opal border-b border-white/10 pb-2 tracking-wider uppercase flex items-center gap-2">
                                <Droplets size={16} /> Caractéristiques
                            </h3>

                            <div className="grid grid-cols-2 gap-4">
                                <FeatureCard icon={Utensils} label="Saveur" value={data.caracteristiques.saveur} />
                                <FeatureCard icon={Feather} label="Texture" value={data.caracteristiques.texture} />
                                <FeatureCard icon={Palette} label="Couleur" value={data.caracteristiques.couleur} />
                                <FeatureCard icon={Ruler} label="Calibre" value={data.caracteristiques.calibre} />
                                <FeatureCard icon={Globe} label="Origine" value={data.caracteristiques.origine} fullWidth />
                                <FeatureCard icon={Shapes} label="Forme" value={data.caracteristiques.forme} />
                                <FeatureCard icon={Wind} label="Pollinisateurs" value={data.caracteristiques.pollinisateurs} fullWidth />
                            </div>

                            {data.caracteristiques.autres?.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-white/10">
                                    <span className="text-xs font-medium text-slate-400 block mb-3 uppercase tracking-wide">Autres infos</span>
                                    <div className="flex flex-wrap gap-2">
                                        {data.caracteristiques.autres.map((tag, i) => (
                                            <span key={i} className="px-3 py-1 bg-white/5 text-slate-300 rounded-full text-xs border border-white/5">{tag}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
};

export default Botanique;

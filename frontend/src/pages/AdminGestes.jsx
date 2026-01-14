import { useState, useEffect } from 'react';
import { fetchGestes, fetchFamillesGestes } from '../services/api';
import { Loader2, Filter, Info, Eye, Shovel, Trees, Heart, Sprout } from 'lucide-react';
import clsx from 'clsx';

// Icon mapping based on current known families from JSON
const FAMILY_ICONS = {
    'Observabilité': Eye,
    'Plantation & Installation': Sprout,
    'Entretien des Plantes': Trees,
    'Soins & Santé': Heart,
    'Travail du Sol': Shovel,
    'Récolte': Sprout,
};

const AdminGestes = () => {
    const [gestes, setGestes] = useState([]);
    const [familles, setFamilles] = useState([]);
    const [selectedFamille, setSelectedFamille] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [gestesData, famillesData] = await Promise.all([
                fetchGestes(),
                fetchFamillesGestes()
            ]);
            setGestes(gestesData);
            setFamilles(famillesData);
        } catch (error) {
            console.error("Failed to load referentiel:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleFilter = async (famille) => {
        setLoading(true);
        setSelectedFamille(famille);
        try {
            const data = await fetchGestes(famille);
            setGestes(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 animate-fade-in text-white/90 p-8">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-light tracking-wide text-white flex items-center gap-3">
                        <Shovel className="text-opal" />
                        Gestes du Jardinier
                    </h2>
                    <p className="text-slate-400 font-light mt-2">
                        Référentiel des savoir-faire et interactions.
                    </p>
                </div>
            </header>

            {/* Filter Pills */}
            <div className="flex flex-wrap gap-2 pb-4 border-b border-white/5">
                <button
                    onClick={() => handleFilter(null)}
                    className={clsx(
                        "px-4 py-2 rounded-full text-sm font-medium transition-all duration-300",
                        selectedFamille === null
                            ? "bg-opal text-slate-900 shadow-[0_0_15px_rgba(168,213,186,0.3)]"
                            : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
                    )}
                >
                    Tous
                </button>
                {familles.map(f => (
                    <button
                        key={f}
                        onClick={() => handleFilter(f)}
                        className={clsx(
                            "px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2",
                            selectedFamille === f
                                ? "bg-opal text-slate-900 shadow-[0_0_15px_rgba(168,213,186,0.3)]"
                                : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
                        )}
                    >
                        {(() => {
                            const Icon = FAMILY_ICONS[f];
                            return Icon ? <Icon size={14} /> : null;
                        })()}
                        {f}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 size={32} className="animate-spin text-opal" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {gestes.map((geste) => {
                        const FamIcon = FAMILY_ICONS[geste.famille] || Info;
                        return (
                            <div key={geste.id} className="glass-panel p-6 rounded-xl border border-white/5 hover:border-opal/30 transition-all duration-300 group">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="bg-white/5 p-2 rounded-lg text-opal group-hover:bg-opal/10 transition-colors">
                                        <FamIcon size={24} />
                                    </div>
                                    <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 border border-white/10 px-2 py-1 rounded">
                                        {geste.famille}
                                    </span>
                                </div>
                                <h3 className="text-xl font-medium text-white mb-1">
                                    {geste.verbe}
                                </h3>
                                <div className="text-sm text-opal/80 font-medium mb-3">
                                    {geste.action}
                                </div>
                                <p className="text-sm text-slate-400 leading-relaxed">
                                    {geste.obj_principal}
                                </p>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default AdminGestes;

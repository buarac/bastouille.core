import { useState, useEffect } from 'react';
import { Loader2, ArrowLeft, Leaf, LayoutList, Calendar, Ruler, Hash, Activity } from 'lucide-react';
import { fetchSujets, fetchSujetDetails } from '../services/api';

const SujetCard = ({ sujet, onClick }) => (
    <div
        onClick={onClick}
        className="glass-panel p-5 rounded-xl border border-white/5 hover:bg-white/10 hover:border-opal/30 transition-all cursor-pointer group relative overflow-hidden"
    >
        <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest bg-black/20 px-2 py-0.5 rounded">
                {sujet.tracking_id}
            </span>
            <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${getStadeColor(sujet.stade)}`}>
                {sujet.stade}
            </span>
        </div>

        <h3 className="text-lg font-light text-white leading-tight mb-1">{sujet.nom}</h3>
        {sujet.variete_nom && sujet.variete_nom !== sujet.nom && (
            <p className="text-xs text-opal/60 italic">{sujet.variete_nom}</p>
        )}

        <div className="mt-4 pt-3 border-t border-white/5 flex gap-4 items-center">
            <div className="flex items-center gap-2">
                <Hash size={14} className="text-slate-500" />
                <span className="text-sm font-medium text-white">{sujet.quantite}</span>
                <span className="text-xs text-slate-500 lowercase">{sujet.unite}</span>
            </div>
        </div>
    </div>
);

const getStadeColor = (stade) => {
    switch (stade) {
        case 'SEMIS': return 'bg-blue-500/20 text-blue-200 border border-blue-500/20';
        case 'PLANTULE': return 'bg-teal-500/20 text-teal-200 border border-teal-500/20';
        case 'EN_PLACE': return 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/20'; // Green
        case 'RECOLTE': return 'bg-amber-500/20 text-amber-200 border border-amber-500/20';
        case 'TERMINE': return 'bg-slate-500/20 text-slate-300 border border-slate-500/20';
        default: return 'bg-white/10 text-slate-300';
    }
};

export default function Sujets() {
    const [sujets, setSujets] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedId, setSelectedId] = useState(null);
    const [detail, setDetail] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadSujets();
    }, []);

    const loadSujets = async () => {
        setLoading(true);
        try {
            const data = await fetchSujets();
            setSujets(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = async (id) => {
        setSelectedId(id);
        setDetail(null); // Clear previous
        setLoading(true);
        try {
            const data = await fetchSujetDetails(id);
            setDetail(data);
        } catch (err) {
            setError("Impossible de charger le détail.");
        } finally {
            setLoading(false);
        }
    };

    const closeDetail = () => {
        setSelectedId(null);
        setDetail(null);
    };

    return (
        <div className="space-y-6 animate-fade-in text-white/90">
            {loading && !detail && sujets.length === 0 && (
                <div className="flex justify-center p-12">
                    <Loader2 size={32} className="text-opal animate-spin" />
                </div>
            )}

            {!selectedId ? (
                /* List View */
                <div className="space-y-6">
                    <header className="flex justify-between items-end border-b border-white/5 pb-4">
                        <div>
                            <h2 className="text-3xl font-light tracking-wide text-white">Mes Sujets</h2>
                            <p className="text-slate-300 font-light mt-1">
                                Plants actifs au jardin ({sujets.length}).
                            </p>
                        </div>
                        <button onClick={loadSujets} className="text-xs text-opal hover:text-white transition-colors">
                            Actualiser
                        </button>
                    </header>

                    {error && (
                        <div className="bg-red-500/10 text-red-200 p-4 rounded-xl border border-red-500/20">{error}</div>
                    )}

                    {sujets.length === 0 && !loading ? (
                        <div className="text-center py-12 text-slate-500 italic font-light bg-white/5 rounded-2xl border border-white/5 border-dashed">
                            Aucun sujet actif. Utilisez le Chef de Culture pour en créer.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {sujets.map(s => (
                                <SujetCard key={s.id} sujet={s} onClick={() => handleSelect(s.id)} />
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                /* Detail View */
                <div className="animate-slide-up space-y-6">
                    <button
                        onClick={closeDetail}
                        className="bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl text-slate-300 transition-colors flex items-center gap-2"
                    >
                        <ArrowLeft size={16} /> Retour à la liste
                    </button>

                    {loading && !detail ? (
                        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-opal" /></div>
                    ) : detail ? (
                        <div className="space-y-6">
                            {/* Header Card */}
                            <div className="glass p-8 rounded-2xl relative overflow-hidden">
                                <div className="absolute top-6 right-6 opacity-30">
                                    <Leaf size={100} />
                                </div>
                                <div className="relative z-10 space-y-2">
                                    <span className="font-mono text-xs text-opal bg-opal/10 px-2 py-1 rounded inline-block mb-2">
                                        {detail.tracking_id}
                                    </span>
                                    <h1 className="text-4xl font-light text-white">{detail.nom}</h1>
                                    <div className="flex gap-4 mt-4">
                                        <Badge label="Stade" value={detail.stade} color={getStadeColor(detail.stade)} />
                                        <Badge label="Quantité" value={`${detail.quantite} ${detail.unite}`} color="bg-white/10 border-white/20" />
                                    </div>
                                </div>
                            </div>

                            {/* Additional Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="glass p-6 rounded-2xl">
                                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Informations</h3>
                                    <div className="space-y-4">
                                        <InfoRow label="Créé le" value={new Date(detail.created_at).toLocaleDateString()} icon={Calendar} />
                                        <InfoRow label="Dernière mise à jour" value={new Date(detail.updated_at).toLocaleDateString()} icon={Activity} />
                                        <InfoRow label="Saison Origine" value={detail.saison_origine_id} icon={LayoutList} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div>Erreur de chargement.</div>
                    )}
                </div>
            )}
        </div>
    );
}

const Badge = ({ label, value, color }) => (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${color}`}>
        <span className="text-[10px] uppercase font-bold opacity-70">{label}</span>
        <span className="font-medium text-sm">{value}</span>
    </div>
);

const InfoRow = ({ label, value, icon: Icon }) => (
    <div className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-400">
            <Icon size={14} />
        </div>
        <div>
            <p className="text-xs text-slate-500 uppercase">{label}</p>
            <p className="text-white font-light">{value}</p>
        </div>
    </div>
);

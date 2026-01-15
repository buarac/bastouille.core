import { useState, useEffect } from 'react';
import { Loader2, ArrowLeft, Calendar, User, Activity, Clock, Box, FileText, Anchor } from 'lucide-react';
import { fetchEvenements } from '../services/api';

const EventCard = ({ event, onClick }) => (
    <div
        onClick={onClick}
        className="glass-panel p-5 rounded-xl border border-white/5 hover:bg-white/10 hover:border-opal/30 transition-all cursor-pointer group relative overflow-hidden flex flex-col gap-3"
    >
        <div className="flex justify-between items-center border-b border-white/5 pb-2">
            <div className="flex items-center gap-2">
                <TypeIcon type={event.type_geste} />
                <span className="font-bold text-xs uppercase tracking-wider text-white">{event.type_geste}</span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">
                {new Date(event.date).toLocaleDateString()}
            </span>
        </div>

        <div>
            <p className="text-xs text-slate-500 mb-0.5 uppercase tracking-wide">Sujet</p>
            <p className="text-sm font-medium text-white line-clamp-1">{event.sujet_nom}</p>
        </div>

        {event.data && event.data.observation && (
            <div className="mt-auto pt-2">
                <p className="text-xs text-slate-400 italic line-clamp-2">"{event.data.observation}"</p>
            </div>
        )}
    </div>
);

const TypeIcon = ({ type }) => {
    // SEMIS, REPIQUAGE, PLANTATION, SOIN, TAILLE, RECOLTE, OBSERVATION
    switch (type) {
        case 'SEMIS': return <span className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_5px_theme(colors.blue.400)]" />;
        case 'PLANTATION': return <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_5px_theme(colors.emerald.400)]" />;
        case 'RECOLTE': return <span className="w-2 h-2 rounded-full bg-orange-400 shadow-[0_0_5px_theme(colors.orange.400)]" />;
        case 'OBSERVATION': return <span className="w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_5px_theme(colors.purple.400)]" />;
        case 'PERTE': return <span className="w-2 h-2 rounded-full bg-red-400 shadow-[0_0_5px_theme(colors.red.400)]" />;
        default: return <span className="w-2 h-2 rounded-full bg-slate-400" />;
    }
};

export default function Evenements() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadEvents();
    }, []);

    const loadEvents = async () => {
        setLoading(true);
        try {
            const data = await fetchEvenements();
            setEvents(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in text-white/90">
            {loading && events.length === 0 && (
                <div className="flex justify-center p-12">
                    <Loader2 size={32} className="text-opal animate-spin" />
                </div>
            )}

            {!selectedEvent ? (
                /* List View */
                <div className="space-y-6">
                    <header className="flex justify-between items-end border-b border-white/5 pb-4">
                        <div>
                            <h2 className="text-3xl font-light tracking-wide text-white">Journal du Jardin</h2>
                            <p className="text-slate-300 font-light mt-1">
                                Historique des interventions ({events.length}).
                            </p>
                        </div>
                        <button onClick={loadEvents} className="text-xs text-opal hover:text-white transition-colors">
                            Actualiser
                        </button>
                    </header>

                    {error && (
                        <div className="bg-red-500/10 text-red-200 p-4 rounded-xl border border-red-500/20">{error}</div>
                    )}

                    {events.length === 0 && !loading ? (
                        <div className="text-center py-12 text-slate-500 italic font-light bg-white/5 rounded-2xl border border-white/5 border-dashed">
                            Aucun événement enregistré.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {events.map(e => (
                                <EventCard key={e.id} event={e} onClick={() => setSelectedEvent(e)} />
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                /* Detail View */
                <div className="animate-slide-up space-y-6">
                    <button
                        onClick={() => setSelectedEvent(null)}
                        className="bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl text-slate-300 transition-colors flex items-center gap-2"
                    >
                        <ArrowLeft size={16} /> Retour au journal
                    </button>

                    <div className="glass p-8 rounded-2xl relative overflow-hidden max-w-3xl mx-auto">
                        <div className="flex flex-col md:flex-row gap-8">
                            {/* Date Badge */}
                            <div className="flex flex-col items-center bg-white/5 rounded-xl p-4 border border-white/5 min-w-[100px]">
                                <span className="text-3xl font-bold text-white mb-1">
                                    {new Date(selectedEvent.date).getDate()}
                                </span>
                                <span className="text-xs uppercase tracking-widest text-slate-400">
                                    {new Date(selectedEvent.date).toLocaleString('default', { month: 'short' })}
                                </span>
                                <span className="text-[10px] text-slate-500 mt-2 font-mono">
                                    {new Date(selectedEvent.date).getFullYear()}
                                </span>
                            </div>

                            <div className="flex-1 space-y-6">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                        <TypeIcon type={selectedEvent.type_geste} />
                                        <span className="text-sm font-bold text-opal uppercase tracking-widest">{selectedEvent.type_geste}</span>
                                    </div>
                                    <h2 className="text-2xl font-light text-white leading-tight">
                                        Sur : {selectedEvent.sujet_nom}
                                    </h2>
                                    {selectedEvent.sujet_tracking && (
                                        <p className="text-xs font-mono text-slate-500 bg-black/20 px-2 py-1 rounded inline-block">
                                            Tracking: {selectedEvent.sujet_tracking}
                                        </p>
                                    )}
                                </div>

                                <div className="border-t border-white/10 pt-6">
                                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <FileText size={14} /> Détails de l'intervention
                                    </h3>

                                    <div className="bg-black/20 rounded-xl p-4 space-y-3 font-mono text-sm border border-white/5">
                                        {Object.entries(selectedEvent.data || {}).map(([key, value]) => (
                                            <div key={key} className="flex flex-col sm:flex-row sm:justify-between border-b border-white/5 last:border-0 pb-2 last:pb-0">
                                                <span className="text-slate-500 opacity-70 capitalize">{key.replace(/_/g, ' ')}:</span>
                                                <span className="text-white text-right break-words">{String(value)}</span>
                                            </div>
                                        ))}
                                        {(!selectedEvent.data || Object.keys(selectedEvent.data).length === 0) && (
                                            <span className="text-slate-600 italic">Aucune donnée supplémentaire.</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

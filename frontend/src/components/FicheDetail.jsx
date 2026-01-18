import React from 'react';
import {
    Sprout, Sun, Droplets, Thermometer, Calendar, BookOpen,
    CheckCircle, Info, Book, Database, MapPin, Ruler,
    Palette, Activity, Layers, Shapes, Utensils
} from "lucide-react";

/**
 * FicheDetail Component
 * Displays the full detail of a botanical fiche.
 * Reuses the layout from Agronome search results.
 * 
 * @param {Object} data - The FichePlant data structure
 * @param {React.ReactNode} headerActions - Optional actions to render in the top-right of identity card
 */
const FicheDetail = ({ data, headerActions = null }) => {
    if (!data) return null;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 animate-fade-in-up text-left">

            {/* IDENTITY CARD (Col Span 5) */}
            <div className="lg:col-span-5 bg-[#1e293b] border border-white/5 rounded-2xl p-6 relative overflow-hidden group hover:border-emerald-500/30 transition-colors">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                    <Info className="w-24 h-24 text-emerald-500" />
                </div>

                <div className="flex justify-between items-start mb-4">
                    <h2 className="text-xs font-bold text-emerald-500 uppercase tracking-widest">Identité</h2>
                    {headerActions && (
                        <div className="z-20 relative">
                            {headerActions}
                        </div>
                    )}
                </div>

                <div className="mb-6 relative z-10">
                    <h3 className="text-3xl font-serif text-white leading-tight">{data.identite.nom}</h3>
                    <p className="text-slate-400 italic text-lg mt-1">{data.identite.espece}</p>
                </div>

                <div className="space-y-3 text-sm text-slate-300 relative z-10">
                    <div className="flex justify-between border-b border-white/5 pb-2">
                        <span className="text-slate-500">Variété</span>
                        <span className="font-medium text-white">{data.identite.variete || '-'}</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2">
                        <span className="text-slate-500">Nom Latin</span>
                        <span className="font-mono text-emerald-200">{data.identite.botanique?.genre} {data.identite.botanique?.espece}</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2">
                        <span className="text-slate-500">Ordre</span>
                        <span>{data.identite.botanique?.ordre || '-'}</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2">
                        <span className="text-slate-500">Famille</span>
                        <span>{data.identite.botanique?.famille || '-'}</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2">
                        <span className="text-slate-500">Type</span>
                        <span>{data.identite.type}</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2">
                        <span className="text-slate-500">Catégorie</span>
                        <span>{data.identite.categorie}</span>
                    </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-2 relative z-10">
                    {data.identite.pollinisateurs?.map((p, i) => (
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
                    "{data.portrait.description}"
                </blockquote>

                {data.portrait.poeme && (
                    <div className="bg-[#0f172a] rounded-xl p-4 mb-6 border border-white/5 italic text-slate-400 font-serif text-center">
                        {data.portrait.poeme}
                    </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm relative z-10">
                    {/* Morphologie Details */}
                    <div className="bg-white/5 p-3 rounded-lg">
                        <div className="text-slate-500 text-xs mb-1 flex items-center gap-1"><MapPin size={10} /> Origine</div>
                        <div>{data.portrait.pays_origine || '-'}</div>
                    </div>
                    <div className="bg-white/5 p-3 rounded-lg">
                        <div className="text-slate-500 text-xs mb-1 flex items-center gap-1"><Palette size={10} /> Couleur</div>
                        <div>{data.portrait.morphologie?.couleur || '-'}</div>
                    </div>
                    <div className="bg-white/5 p-3 rounded-lg">
                        <div className="text-slate-500 text-xs mb-1 flex items-center gap-1"><Shapes size={10} /> Forme</div>
                        <div>{data.portrait.morphologie?.forme || '-'}</div>
                    </div>
                    <div className="bg-white/5 p-3 rounded-lg">
                        <div className="text-slate-500 text-xs mb-1 flex items-center gap-1"><Layers size={10} /> Texture</div>
                        <div>{data.portrait.morphologie?.texture || '-'}</div>
                    </div>
                    <div className="bg-white/5 p-3 rounded-lg">
                        <div className="text-slate-500 text-xs mb-1 flex items-center gap-1"><Utensils size={10} /> Goût</div>
                        <div>{data.portrait.morphologie?.gout || '-'}</div>
                    </div>
                    <div className="bg-white/5 p-3 rounded-lg">
                        <div className="text-slate-500 text-xs mb-1 flex items-center gap-1"><Ruler size={10} /> Calibre</div>
                        <div>{data.portrait.morphologie?.calibre || '-'}</div>
                    </div>
                </div>
            </div>

            {/* AGRONOMY STRIP (Full Width) */}
            <div className="col-span-full grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-[#1e293b] p-4 rounded-xl border border-white/5 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-500"><Sun className="w-5 h-5" /></div>
                    <div>
                        <div className="text-xs text-slate-500 uppercase">Exposition</div>
                        <div className="text-sm font-medium">{data.agronomie.exposition}</div>
                    </div>
                </div>
                <div className="bg-[#1e293b] p-4 rounded-xl border border-white/5 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500"><Droplets className="w-5 h-5" /></div>
                    <div>
                        <div className="text-xs text-slate-500 uppercase">Eau</div>
                        <div className="text-sm font-medium">{data.agronomie.besoin_eau}</div>
                    </div>
                </div>
                <div className="bg-[#1e293b] p-4 rounded-xl border border-white/5 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-stone-500/20 flex items-center justify-center text-stone-500"><BookOpen className="w-5 h-5" /></div>
                    <div>
                        <div className="text-xs text-slate-500 uppercase">Sol ({data.agronomie.sol_ideal_ph?.[0]}-{data.agronomie.sol_ideal_ph?.[1]} pH)</div>
                        <div className="text-sm font-medium truncate" title={data.agronomie.sol_ideal}>{data.agronomie.sol_ideal}</div>
                    </div>
                </div>
                <div className="bg-[#1e293b] p-4 rounded-xl border border-white/5 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center text-red-500"><Thermometer className="w-5 h-5" /></div>
                    <div>
                        <div className="text-xs text-slate-500 uppercase">Rusticité</div>
                        <div className="text-sm font-medium">{data.agronomie.rusticite}</div>
                    </div>
                </div>
                <div className="bg-[#1e293b] p-4 rounded-xl border border-white/5 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500"><Sprout className="w-5 h-5" /></div>
                    <div>
                        <div className="text-xs text-slate-500 uppercase">Densité</div>
                        <div className="text-sm font-medium">{data.agronomie.densite}</div>
                    </div>
                </div>
            </div>

            {/* CALENDAR (Full Width) */}
            <div className="col-span-full bg-[#1e293b] border border-white/5 rounded-2xl p-6">
                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> Calendrier Cultural
                </h2>

                <div className="grid grid-cols-12 gap-1 text-center text-xs text-slate-500 mb-2">
                    {[...Array(12)].map((_, i) => <div key={i}>{new Date(0, i).toLocaleString('fr', { month: 'short' }).slice(0, 3)}.</div>)}
                </div>

                {/* Calendar Rows Helper */}
                {[
                    { title: "Semis", data: data.calendrier.semis, color: "bg-emerald-500/50" },
                    { title: "Plantation", data: data.calendrier.plantation, color: "bg-amber-500/50" },
                    { title: "Floraison", data: data.calendrier.floraison, color: "bg-pink-500/50" },
                    { title: "Récolte", data: data.calendrier.recolte, color: "bg-red-500/50" },
                    { title: "Taille", data: data.calendrier.taille, color: "bg-blue-500/50" }
                ].map((row, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-1 mb-2 group relative">
                        {[...Array(12)].map((_, i) => (
                            <div key={i} className={`h-8 rounded transition-colors ${row.data?.includes(i + 1) ? row.color : 'bg-white/5'}`} title={`${row.title} - ${new Date(0, i).toLocaleString('fr', { month: 'long' })}`}></div>
                        ))}
                        {/* Tooltip-ish hint on hover? Optional */}
                    </div>
                ))}

                <div className="flex gap-4 mt-4 justify-end text-xs text-slate-400 flex-wrap">
                    <div className="flex items-center gap-2"><div className="w-3 h-3 bg-emerald-500/50 rounded"></div> Semis</div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 bg-amber-500/50 rounded"></div> Plantation</div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 bg-pink-500/50 rounded"></div> Floraison</div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 bg-red-500/50 rounded"></div> Récolte</div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 bg-blue-500/50 rounded"></div> Taille</div>
                </div>
            </div>

            {/* GUIDE & TECH (Col Span 12) */}
            <div className="col-span-full bg-[#1e293b] border border-white/5 rounded-2xl p-6">
                <h2 className="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" /> Guide Technique
                </h2>
                <div className="grid md:grid-cols-3 gap-6">
                    <div className="space-y-4">
                        <h3 className="text-white font-medium border-b border-indigo-500/30 pb-2">Installation</h3>
                        <p className="text-sm text-slate-400 leading-relaxed">{data.guide.installation}</p>
                    </div>
                    <div className="space-y-4">
                        <h3 className="text-white font-medium border-b border-indigo-500/30 pb-2">Entretien</h3>
                        <p className="text-sm text-slate-400 leading-relaxed">{data.guide.entretien}</p>
                    </div>
                    <div className="space-y-4">
                        <h3 className="text-white font-medium border-b border-indigo-500/30 pb-2">Arrosage</h3>
                        <p className="text-sm text-slate-400 leading-relaxed">{data.guide.arrosage}</p>
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-white/5 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div>
                        <h4 className="text-xs text-red-400 uppercase mb-2 font-bold">Vigilance Maladies</h4>
                        <ul className="list-disc list-inside text-sm text-slate-400">
                            {data.guide.maladies?.map((m, i) => <li key={i}>{m}</li>)}
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-xs text-amber-500 uppercase mb-2 font-bold">Signes d'Alerte</h4>
                        <ul className="list-disc list-inside text-sm text-slate-400">
                            {data.guide.signes_alerte?.map((m, i) => <li key={i}>{m}</li>)}
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-xs text-blue-400 uppercase mb-2 font-bold">Actions Sanitaires</h4>
                        <ul className="list-disc list-inside text-sm text-slate-400">
                            {data.guide.actions_sanitaire?.map((m, i) => <li key={i}>{m}</li>)}
                        </ul>
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-white/5 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div>
                        <h4 className="text-xs text-emerald-400 uppercase mb-2 font-bold">Valorisation</h4>
                        <p className="text-sm text-slate-400"><span className="text-white font-medium">Récolte après:</span> {data.valorisation.nombre_jour_recolte ? data.valorisation.nombre_jour_recolte + ' jours' : 'N/A'}</p>
                        <p className="text-sm text-slate-400 mt-1"><span className="text-white font-medium">Conservation:</span> {data.valorisation.conservation}</p>
                    </div>
                    <div>
                        <h4 className="text-xs text-purple-400 uppercase mb-2 font-bold">Signes de Maturité</h4>
                        <ul className="list-disc list-inside text-sm text-slate-400">
                            {data.valorisation.signes_maturite?.map((m, i) => <li key={i}>{m}</li>)}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FicheDetail;

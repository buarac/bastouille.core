import { Leaf, Activity, Bot, Calendar, LayoutList, Sprout, ClipboardList, Cpu, Search } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import clsx from 'clsx';

const Sidebar = () => {
    const sections = [
        {
            title: "Jardin",
            items: [
                { name: 'Fiches', path: '/fiches', icon: Sprout },
                { name: 'Sujets', path: '/sujets', icon: LayoutList },
                { name: 'Événements', path: '/evenements', icon: Calendar },
            ]
        },
        {
            title: "Agents",
            title: "Agents",
            items: [
                { name: 'Botanique', path: '/agent-botanique', icon: Leaf },
                { name: 'Chef de Culture', path: '/chat', icon: Bot },
                { name: 'Chef V2 (Natif)', path: '/bastouille-chef', icon: Cpu },
                { name: 'Agronome IA', path: '/agents/agronome-v1', icon: Sprout },
            ]
        },
        {
            title: "Traçabilité",
            items: [
                { name: 'Appels IA', path: '/admin/llm-logs', icon: Activity },
                // Keeping 'Gestes' (previously existed) or removing? User didn't explicitly say remove 'Gestes' but "Refacteur les menus...". 
                // However, "Gestes" was in "Admin". 
                // The prompt says "Section Tracabilités: Appels IA -> renvoies vers l'écran Activité IA".
                // Doesn't mention Gestes. I'll disable Gestes from menu for now strictly following instruction to "Refacteur".
                // If user wants Gestes back, they will ask. Or I can check if Gestes is "Jardin"?
                // Let's stick to the prompt.
            ]
        }
    ];

    return (
        <aside className="w-64 h-screen fixed left-0 top-0 glass border-r border-white/10 flex flex-col p-6 z-10 overflow-y-auto custom-scrollbar">
            <div className="mb-8">
                <h1 className="text-2xl font-light text-white tracking-tight">
                    Baštouille<span className="text-opal font-semibold">.Core</span>
                </h1>
            </div>

            <nav className="flex-1 space-y-8">
                {sections.map((section, idx) => (
                    <div key={idx}>
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 pl-3">
                            {section.title}
                        </h3>
                        <div className="space-y-2">
                            {section.items.map((item) => (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    end={item.path === '/botanique'} // Prevents partial match conflicts if queries differ
                                    className={({ isActive }) =>
                                        clsx(
                                            'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-light text-sm',
                                            isActive
                                                ? 'bg-opal/20 text-white shadow-[0_0_15px_rgba(168,213,186,0.2)] border border-opal/30'
                                                : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                        )
                                    }
                                >
                                    {({ isActive }) => (
                                        <>
                                            <item.icon size={18} className={clsx(isActive ? "text-opal" : "text-slate-500")} />
                                            <span>{item.name}</span>
                                        </>
                                    )}
                                </NavLink>
                            ))}
                        </div>
                    </div>
                ))}
            </nav>

            <div className="text-xs text-slate-600 mt-auto text-center font-light pt-6 border-t border-white/5">
                v0.2.0 • Gemini Inside
            </div>
        </aside>
    );
};

export default Sidebar;

import { Leaf, Home, Activity, Shovel } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import clsx from 'clsx';

const Sidebar = () => {
    const navItems = [
        { name: 'Accueil', path: '/', icon: Home },
        { name: 'Botanique', path: '/botanique', icon: Leaf },
        { name: 'Gestes', path: '/admin/gestes', icon: Shovel },
        { name: 'Activités IA', path: '/admin/activity', icon: Activity },
    ];

    return (
        <aside className="w-64 h-screen fixed left-0 top-0 glass border-r border-white/10 flex flex-col p-6 z-10">
            <div className="mb-10">
                <h1 className="text-2xl font-light text-white tracking-tight">
                    Baštouille<span className="text-opal font-semibold">.Core</span>
                </h1>
            </div>

            <nav className="flex-1 space-y-2">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            clsx(
                                'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-light',
                                isActive
                                    ? 'bg-opal/20 text-white shadow-[0_0_15px_rgba(168,213,186,0.3)] border border-opal/30'
                                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                            )
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <item.icon size={20} className={clsx(isActive ? "text-opal" : "text-slate-400")} />
                                <span>{item.name}</span>
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            <div className="text-xs text-slate-500 mt-auto text-center font-light">
                v0.1.0 • Gemini Inside
            </div>
        </aside>
    );
};

export default Sidebar;

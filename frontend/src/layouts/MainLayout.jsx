import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

const MainLayout = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white font-light selection:bg-opal selection:text-slate-900">
            <Sidebar />
            <main className="ml-64 p-8 min-h-screen">
                <div className="max-w-7xl mx-auto">
                    {/* Outlet pour le contenu dynamique des pages */}
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default MainLayout;

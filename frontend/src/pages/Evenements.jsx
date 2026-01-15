import { Calendar } from 'lucide-react';

export default function Evenements() {
    return (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)] text-slate-500">
            <Calendar className="w-16 h-16 mb-4 text-opal/50" />
            <h2 className="text-2xl font-light text-white mb-2">Calendrier & Événements</h2>
            <p className="max-w-md text-center">
                Cette fonctionnalité est en cours de développement.
                Bientôt, vous pourrez suivre les interventions au jardin.
            </p>
        </div>
    );
}

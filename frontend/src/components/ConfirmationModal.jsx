import { AlertTriangle, X } from "lucide-react";

export default function ConfirmationModal({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirmer", cancelText = "Annuler", isDanger = false }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-md transform overflow-hidden rounded-2xl bg-[#1e293b] p-6 text-left align-middle shadow-xl transition-all border border-white/10 scale-100 animate-scale-in">

                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${isDanger ? 'bg-red-500/10 text-red-400' : 'bg-indigo-500/10 text-indigo-400'}`}>
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-medium leading-6 text-white">
                            {title}
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="mt-2">
                    <p className="text-sm text-slate-300">
                        {message}
                    </p>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <button
                        type="button"
                        className="inline-flex justify-center rounded-lg border border-white/10 bg-[#0f172a] px-4 py-2 text-sm font-medium text-slate-300 hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 transition-colors"
                        onClick={onClose}
                    >
                        {cancelText}
                    </button>
                    <button
                        type="button"
                        className={`inline-flex justify-center rounded-lg border border-transparent px-4 py-2 text-sm font-medium text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 transition-colors ${isDanger
                                ? 'bg-red-600 hover:bg-red-700 focus-visible:ring-red-500'
                                : 'bg-indigo-600 hover:bg-indigo-700 focus-visible:ring-indigo-500'
                            }`}
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}

import { useState, useEffect } from "react";
import { Copy, X } from "lucide-react"; // Using Copy icon or Edit icon as generic input specific one

export default function InputModal({ isOpen, onClose, onConfirm, title, message, placeholder = "", confirmText = "Valider", initialValue = "" }) {
    const [value, setValue] = useState(initialValue);

    useEffect(() => {
        if (isOpen) setValue(initialValue);
    }, [isOpen, initialValue]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-md transform overflow-hidden rounded-2xl bg-[#1e293b] p-6 text-left align-middle shadow-xl transition-all border border-white/10 scale-100 animate-scale-in">

                <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-medium leading-6 text-white">
                        {title}
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="mt-2">
                    <p className="text-sm text-slate-300 mb-4">
                        {message}
                    </p>
                    <input
                        type="text"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        placeholder={placeholder}
                        className="w-full bg-[#0f172a] border border-white/10 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 transition-colors"
                        autoFocus
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                onConfirm(value);
                                onClose();
                            }
                        }}
                    />
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <button
                        type="button"
                        className="inline-flex justify-center rounded-lg border border-white/10 bg-[#0f172a] px-4 py-2 text-sm font-medium text-slate-300 hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 transition-colors"
                        onClick={onClose}
                    >
                        Annuler
                    </button>
                    <button
                        type="button"
                        className="inline-flex justify-center rounded-lg border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => {
                            if (value.trim()) {
                                onConfirm(value);
                                onClose();
                            }
                        }}
                        disabled={!value.trim()}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}

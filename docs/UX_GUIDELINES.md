# UX Guidelines & Best Practices

## Modal & Warnings
All confirmation modals and critical user interactions must follow the specific design pattern established in `ConfirmationModal.jsx`. 
This ensures visual consistency across the application.

### Design Specs (Alert/Confirmation Style)
- **Background**: `bg-[#1e293b]` (Dark Slate)
- **Overlay**: `bg-black/50 backdrop-blur-sm` (Glassmorphism)
- **Border**: `border border-white/10`
- **Rounding**: `rounded-2xl`
- **Shadow**: `shadow-xl`
- **Animation**: `animate-scale-in`
- **Typography**:
  - Title: `text-lg font-medium text-white`
  - Body: `text-sm text-slate-300`
- **Icons**: Lucide React icons, wrapped in a colored circle (`rounded-full bg-color/10 text-color`).

### Usage Rule
> "Mets la boite qui s'affiche pour confirmer [...] au gout comme le reste de l'application. C'est une demande déjà faite pour Alert et les autres."

When implementing new interactive dialogs (save confirmation, delete warning, etc.), **always reuse or replicate the `ConfirmationModal` aesthetic.**
Do not invent new modal styles.

## General UI
- **Primary Action**: Emerald Green (`emerald-600` / `emerald-500`)
- **Danger Action**: Red (`red-600` / `red-500`)
- **Background**: Deep Dark Blue (`#0b1221`)

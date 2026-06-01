import type { CustomAlert as CustomAlertType } from '../types';

interface Props {
  alert: CustomAlertType;
}

export default function CustomAlert({ alert }: Props) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9999] flex items-center justify-center animate-fade" onClick={alert.onCancel}>
      <div className="bg-white/[0.12] backdrop-blur-2xl border border-accent/15 rounded-2xl p-10 w-[90%] max-w-[420px] text-center shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.05)] animate-modal" onClick={e => e.stopPropagation()}>
        <h3 className="text-white text-2xl font-light mb-3 font-[Outfit] tracking-tight">{alert.title}</h3>
        <p className="text-zinc-400 text-sm mb-8 leading-relaxed font-light">{alert.text}</p>
        <div className="flex justify-center gap-4">
          <button
            className="px-6 py-2.5 rounded-xl bg-white/[0.05] text-white/95 border border-white/10 text-sm cursor-pointer transition-all hover:bg-white/10"
            onClick={alert.onCancel}
          >
            {alert.cancelText || 'Cancelar'}
          </button>
          <button
            className={`px-6 py-2.5 rounded-xl text-sm font-medium cursor-pointer transition-all hover:-translate-y-0.5 ${
              alert.isDanger
                ? 'bg-red-500/15 text-red-500 border border-red-500/30 hover:bg-red-500/25 hover:shadow-[0_4px_15px_rgba(239,68,68,0.2)]'
                : 'bg-gradient-to-br from-accent to-accent-light text-black hover:opacity-90 hover:shadow-[0_4px_15px_rgba(212,175,55,0.2)]'
            }`}
            onClick={alert.onConfirm}
          >
            {alert.confirmText || 'Aceptar'}
          </button>
        </div>
      </div>
    </div>
  );
}

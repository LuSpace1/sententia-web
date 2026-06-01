import type { CustomAlert as CustomAlertType } from '../types';

interface Props {
  alert: CustomAlertType;
}

export default function CustomAlert({ alert }: Props) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center animate-fade-in" onClick={alert.onCancel}>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative glass-panel-strong rounded-2xl p-8 w-[90%] max-w-[400px] text-center animate-modal"
        onClick={e => e.stopPropagation()}>
        <h3 className="font-serif text-xl font-[400] text-text-main mb-3 tracking-[-0.01em]">{alert.title}</h3>
        <p className="text-text-sub text-sm font-[350] mb-7 leading-relaxed">{alert.text}</p>
        <div className="flex justify-center gap-3">
          <button
            className="px-5 py-2.5 rounded-xl bg-white/[0.04] border border-glass-border text-text-sub text-sm cursor-pointer transition-all hover:bg-white/[0.08] hover:text-text-main font-[350]"
            onClick={alert.onCancel}>
            {alert.cancelText || 'Cancelar'}
          </button>
          <button
            className={`px-5 py-2.5 rounded-xl text-sm font-[450] cursor-pointer transition-all ${
              alert.isDanger
                ? 'bg-danger/10 border border-danger/20 text-danger hover:bg-danger/15 hover:border-danger/30'
                : 'bg-accent/10 border border-accent/20 text-accent hover:bg-accent/15 hover:border-accent/30'
            }`}
            onClick={alert.onConfirm}>
            {alert.confirmText || 'Aceptar'}
          </button>
        </div>
      </div>
    </div>
  );
}

import type { DownloadState } from '../types';

interface Props {
  downloadStates: Record<string, DownloadState>;
  onCancel: (modelName: string) => void;
}

export default function ModelDownloadBanner({ downloadStates, onCancel }: Props) {
  return (
    <>
      {Object.entries(downloadStates).map(([modelName, state]) => (
        <div key={modelName} className="mt-4 p-4 rounded-2xl bg-white/[0.05] border border-white/10">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <p className="text-sm font-bold text-white/95 m-0">Descargando modelo</p>
              <p className="text-sm text-zinc-400 mt-1 m-0">
                {modelName} · {state.purpose}
              </p>
              <p className="text-xs text-white/72 mt-1.5 m-0">{state.status}</p>
            </div>
            <button
              type="button"
              className="shrink-0 min-h-[44px] px-4 py-2.5 rounded-full border border-white/15 bg-white/[0.04] text-white/95 font-semibold cursor-pointer transition-all hover:bg-white/10 text-sm"
              onClick={() => onCancel(modelName)}
            >
              Cancelar
            </button>
          </div>
          <div className="relative h-2.5 overflow-hidden rounded-full bg-white/[0.08]" aria-hidden="true">
            <div
              className={`absolute inset-0 rounded-full bg-gradient-to-r from-accent/20 via-accent/95 to-accent-light/20 transition-[width] duration-180 ${
                state.indeterminate
                  ? 'w-[45%] animate-[downloadPulse_1.2s_ease-in-out_infinite]'
                  : ''
              }`}
              style={state.indeterminate ? undefined : { width: `${state.progress}%` }}
            />
          </div>
          {!state.indeterminate && (
            <div className="mt-1.5 text-xs text-zinc-400 text-right">{state.progress}%</div>
          )}
        </div>
      ))}
    </>
  );
}

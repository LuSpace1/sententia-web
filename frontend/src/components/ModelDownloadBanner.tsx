import type { DownloadState } from '../types';

interface Props {
  downloadStates: Record<string, DownloadState>;
  onCancel: (modelName: string) => void;
}

export default function ModelDownloadBanner({ downloadStates, onCancel }: Props) {
  return (
    <>
      {Object.entries(downloadStates).map(([modelName, state]) => (
        <div key={modelName} className="mt-2 p-4 rounded-2xl glass-panel">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <p className="text-sm font-[450] text-text-main m-0">Descargando modelo</p>
              <p className="text-sm text-text-sub font-[350] mt-0.5 m-0">
                {modelName} · {state.purpose}
              </p>
              <p className="text-xs text-text-muted font-[350] mt-1.5 m-0">{state.status}</p>
            </div>
            <button
              type="button"
              className="shrink-0 min-h-[40px] px-4 py-2 rounded-full glass-panel-light text-text-sub font-[350] cursor-pointer transition-all hover:bg-white/[0.08] hover:text-text-main text-sm"
              onClick={() => onCancel(modelName)}>
              Cancelar
            </button>
          </div>
          <div className="relative h-2 overflow-hidden rounded-full bg-white/[0.06]" aria-hidden="true">
            <div
              className={`absolute inset-0 rounded-full bg-gradient-to-r from-accent/20 via-accent to-accent-light/20 transition-[width] duration-200 ${
                state.indeterminate
                  ? 'w-[45%] animate-[downloadPulse_1.4s_ease-in-out_infinite]'
                  : ''
              }`}
              style={state.indeterminate ? undefined : { width: `${state.progress}%` }}
            />
          </div>
          {!state.indeterminate && (
            <div className="mt-1 text-xs text-text-muted font-[350] text-right">{state.progress}%</div>
          )}
        </div>
      ))}
    </>
  );
}

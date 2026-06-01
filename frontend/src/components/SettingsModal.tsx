import { useState } from 'react';
import {
  X, Database, UploadCloud, Settings as SettingsIcon,
  Palette, EyeOff, Trash2,
} from 'lucide-react';
import type { Chat, TrainingStatus } from '../types';
import { chatService } from '../services/api';

interface Props {
  chats: Chat[];
  isSettingsOpen: boolean;
  isTraining?: boolean;
  trainingStatus?: TrainingStatus | null;
  onClose: () => void;
  onSetHiddenMode: () => void;
  onDeleteChat: (e: React.MouseEvent, id: string) => void;
  onRestoreChat: (id: string) => void;
}

export default function SettingsModal({
  chats,
  isSettingsOpen,
  isTraining,
  trainingStatus,
  onClose,
  onSetHiddenMode,
  onDeleteChat,
  onRestoreChat,
}: Props) {
  const [settingsTab, setSettingsTab] = useState('general');
  const [trainingFile, setTrainingFile] = useState<File | null>(null);
  const [localTrainingStatus, setLocalTrainingStatus] = useState<TrainingStatus | null>(null);
  const [localIsTraining, setLocalIsTraining] = useState(false);

  const resolvedTrainingStatus = trainingStatus || localTrainingStatus;
  const resolvedIsTraining = isTraining || localIsTraining;

  const handleTrainFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setTrainingFile(file);
      setLocalTrainingStatus(null);
    }
  };

  const handleTrainSubmit = async () => {
    if (!trainingFile) return;

    setLocalIsTraining(true);
    setLocalTrainingStatus(null);

    try {
      const response = await chatService.train(trainingFile);
      setLocalTrainingStatus({ type: 'success', message: response.data.message });
      setTrainingFile(null);
    } catch (err) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setLocalTrainingStatus({
        type: 'error',
        message: axiosErr?.response?.data?.error || 'Error al procesar el documento legal.',
      });
    } finally {
      setLocalIsTraining(false);
    }
  };

  if (!isSettingsOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[1000] flex items-center justify-center animate-fade" onClick={() => !resolvedIsTraining && onClose()}>
      <div className="flex flex-row w-[900px] max-w-[92vw] h-[650px] overflow-hidden bg-[#18181b] border border-white/10 rounded-2xl shadow-2xl animate-modal" onClick={(e) => e.stopPropagation()}>
        <nav className="w-[300px] min-w-[300px] bg-white/[0.03] border-r border-white/10 flex flex-col p-4 gap-1">
          <div className="flex items-center justify-between px-5 pb-4 mb-2 border-b border-white/[0.05]">
            <h3 className="m-0 text-sm font-medium text-white/95">Configuración</h3>
            <button className="bg-none border-none text-zinc-400 cursor-pointer flex items-center justify-center rounded-full p-1 transition-all hover:bg-white/10 hover:text-white/95" onClick={onClose} title="Cerrar">
              <X size={18} />
            </button>
          </div>

          {[
            { id: 'general', icon: <SettingsIcon size={18} />, label: 'General' },
            { id: 'train', icon: <Database size={18} />, label: 'Entrenar' },
            { id: 'customization', icon: <Palette size={18} />, label: 'Personalización' },
            { id: 'hidden', icon: <EyeOff size={18} />, label: 'Ocultos' },
          ].map(tab => (
            <button
              key={tab.id}
              className={`flex items-center gap-3 bg-none border-none text-zinc-400 px-4 py-2.5 w-[calc(100%-1.5rem)] mx-auto rounded-lg cursor-pointer text-xs font-medium text-left transition-all hover:bg-white/[0.06] hover:text-white/95 ${
                settingsTab === tab.id ? '!bg-white/[0.08] !text-white/95' : ''
              }`}
              onClick={() => setSettingsTab(tab.id)}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>

        <div className="flex-1 p-8 overflow-y-auto max-h-[80vh] scrollbar-thin">
          {settingsTab === 'general' && (
            <div className="flex flex-col gap-6">
              <h3 className="text-sm font-medium text-white/95">General</h3>
              <p className="bg-accent/10 border border-accent/20 p-4 rounded-xl text-sm text-zinc-400 leading-relaxed">
                Ajustes generales de la aplicación. (En construcción)
              </p>
            </div>
          )}

          {settingsTab === 'train' && (
            <div className="flex flex-col gap-6">
              <h3 className="text-sm font-medium text-white/95">Entrenar Sententia</h3>
              <p className="bg-accent/10 border border-accent/20 p-4 rounded-xl text-sm text-zinc-400 leading-relaxed">
                Sube documentos legales para alimentar la base de conocimiento del asistente.
                Sententia soportará más formatos de archivo en el futuro. Por ahora, soporta archivos <strong className="text-white">PDF, TXT y MD</strong>.
                La IA se ve más beneficiada por los archivos MD debido a que separan mejor los párrafos en base a los saltos de línea.
              </p>

              <div className={`border-2 border-dashed border-white/10 rounded-2xl p-10 text-center transition-all cursor-pointer flex flex-col items-center gap-4 relative hover:border-accent hover:bg-white/[0.02] ${
                trainingFile ? '!border-solid !border-accent !bg-accent/[0.05]' : ''
              }`}>
                <input
                  type="file"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  accept=".pdf,.txt,.md"
                  onChange={handleTrainFileChange}
                  disabled={resolvedIsTraining}
                />
                <UploadCloud size={40} strokeWidth={1.5} color={trainingFile ? '#c3a564' : 'rgba(255,255,255,0.4)'} />
                {trainingFile ? (
                  <span className="font-medium text-accent text-sm break-all">{trainingFile.name}</span>
                ) : (
                  <div>
                    <p className="text-sm text-zinc-400">Haga clic para seleccionar archivo</p>
                    <small className="text-xs text-zinc-500">PDF, TXT o MD</small>
                  </div>
                )}
              </div>

              <button
                className="w-full py-3.5 rounded-xl bg-white text-zinc-900 font-semibold cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-[0_5px_15px_rgba(255,255,255,0.1)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                onClick={handleTrainSubmit}
                disabled={!trainingFile || resolvedIsTraining}
              >
                {resolvedIsTraining ? (
                  <div className="flex gap-1.5 py-0">
                    {[0, 1, 2].map(i => (
                      <span key={i} className="w-1.5 h-1.5 rounded-full bg-zinc-900 animate-bounce"
                        style={{ animationDelay: `${i * 0.16}s` }} />
                    ))}
                  </div>
                ) : (
                  <>Procesar Documento Legales</>
                )}
              </button>

              {resolvedTrainingStatus && (
                <div className={`mt-4 text-sm text-center p-3 rounded-lg ${
                  resolvedTrainingStatus.type === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                }`}>
                  {resolvedTrainingStatus.message}
                </div>
              )}
            </div>
          )}

          {settingsTab === 'customization' && (
            <div className="flex flex-col gap-6">
              <h3 className="text-sm font-medium text-white/95">Personalización</h3>
              <p className="bg-accent/10 border border-accent/20 p-4 rounded-xl text-sm text-zinc-400 leading-relaxed">
                Ajustes de apariencia y personalización del asistente. (En construcción)
              </p>
            </div>
          )}

          {settingsTab === 'hidden' && (
            <div className="flex flex-col gap-4">
              <h3 className="flex items-center gap-2 text-sm font-medium text-white/95">
                <EyeOff size={16} /> Chats Ocultos
              </h3>
              <p className="bg-accent/10 border border-accent/20 p-4 rounded-xl text-sm text-zinc-400 leading-relaxed">
                Los chats ocultos no aparecen en el historial ni en la búsqueda.
              </p>
              <button className="w-full py-3.5 rounded-xl bg-white text-zinc-900 font-semibold cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-[0_5px_15px_rgba(255,255,255,0.1)] flex items-center justify-center gap-3 text-sm" onClick={onSetHiddenMode}>
                <EyeOff size={15} /> Ver chats ocultos
              </button>

              <div className="flex flex-col gap-1.5 max-h-[260px] overflow-y-auto scrollbar-thin">
                {chats.filter(c => c.isHidden).length === 0 ? (
                  <p className="text-sm text-zinc-400 mt-4">No hay chats ocultos.</p>
                ) : (
                  chats.filter(c => c.isHidden).map(chat => (
                    <div key={chat.id} className="flex items-center gap-4 p-3 bg-white/[0.02] border border-white/10 rounded-xl">
                      <span className="flex-1 text-sm text-white/95 truncate">{chat.title}</span>
                      <div className="flex gap-2 shrink-0">
                        <button
                          className="px-3 py-1.5 rounded-lg bg-accent text-white text-xs font-medium cursor-pointer transition-all hover:shadow-[0_0_16px_rgba(212,175,55,0.4)]"
                          onClick={() => onRestoreChat(chat.id)}
                        >
                          Mostrar
                        </button>
                        <button
                          className="px-2 py-1.5 rounded-lg border border-red-500/25 text-rose-400 text-xs cursor-pointer transition-all hover:bg-red-500/15"
                          onClick={(e) => onDeleteChat(e, chat.id)}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

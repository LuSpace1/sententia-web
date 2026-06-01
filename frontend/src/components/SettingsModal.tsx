import { useState } from 'react';
import {
  X, Database, UploadCloud, Settings as SettingsIcon,
  Palette, EyeOff, Trash2, Scale,
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

  const tabs = [
    { id: 'general', icon: <SettingsIcon size={16} />, label: 'General' },
    { id: 'train', icon: <Database size={16} />, label: 'Entrenar' },
    { id: 'customization', icon: <Palette size={16} />, label: 'Personalizar' },
    { id: 'hidden', icon: <EyeOff size={16} />, label: 'Ocultos' },
  ];

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center animate-fade-in"
      onClick={() => !resolvedIsTraining && onClose()}>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative flex flex-row w-[840px] max-w-[94vw] h-[600px] overflow-hidden bg-surface border border-white/[0.04] rounded-2xl shadow-[0_32px_80px_rgba(0,0,0,0.6)] animate-modal"
        onClick={(e) => e.stopPropagation()}>
        <nav className="w-[200px] min-w-[200px] bg-white/[0.01] border-r border-white/[0.03] flex flex-col p-3 gap-0.5">
          <div className="flex items-center justify-between px-3 pb-3 mb-2 border-b border-white/[0.03]">
            <div className="flex items-center gap-2.5">
              <Scale size={15} className="text-accent" />
              <span className="font-serif text-sm font-emphasized text-text-main">Configuración</span>
            </div>
            <button
              className="bg-none border-none text-text-muted/50 cursor-pointer flex items-center justify-center rounded-lg p-1 transition-all hover:bg-white/[0.04] hover:text-text-main"
              onClick={onClose}
              title="Cerrar">
              <X size={14} />
            </button>
          </div>
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`flex items-center gap-2.5 bg-none border-none text-text-sub px-3 py-[9px] w-full rounded-xl cursor-pointer text-[12px] font-normal text-left transition-all hover:bg-white/[0.02] hover:text-text-main ${
                settingsTab === tab.id ? '!bg-accent/8 !text-accent' : ''
              }`}
              onClick={() => setSettingsTab(tab.id)}>
              <span className={settingsTab === tab.id ? 'text-accent' : 'text-text-muted/50'}>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>

        <div className="flex-1 p-8 overflow-y-auto max-h-[80vh] scrollbar-thin">
          {settingsTab === 'general' && (
            <div className="flex flex-col gap-5 max-w-[520px]">
              <h3 className="font-serif text-lg font-normal text-text-main tracking-[-0.01em]">General</h3>
              <div className="bg-white/[0.01] border border-white/[0.04] rounded-xl p-5">
                <p className="text-sm text-text-sub font-subtle leading-relaxed">
                  Ajustes generales de la aplicación. Más opciones próximamente.
                </p>
              </div>
            </div>
          )}

          {settingsTab === 'train' && (
            <div className="flex flex-col gap-5 max-w-[520px]">
              <h3 className="font-serif text-lg font-normal text-text-main tracking-[-0.01em]">Entrenar Sententia</h3>
              <div className="bg-accent/[0.02] border border-accent/8 rounded-xl p-5">
                <p className="text-sm text-text-sub font-subtle leading-relaxed">
                  Sube documentos legales chilenos para alimentar la base de conocimiento del asistente.
                  Sententia soporta archivos <span className="text-text-main font-normal">PDF, TXT y MD</span>.
                </p>
              </div>
              <div className={`border-2 border-dashed border-white/[0.04] rounded-xl p-8 text-center transition-all cursor-pointer flex flex-col items-center gap-3 relative hover:border-accent/20 hover:bg-accent/[0.01] ${
                trainingFile ? '!border-solid !border-accent/20 !bg-accent/[0.02]' : ''
              }`}>
                <input
                  type="file"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  accept=".pdf,.txt,.md"
                  onChange={handleTrainFileChange}
                  disabled={resolvedIsTraining}
                />
                <UploadCloud size={28} strokeWidth={1.5} className={trainingFile ? 'text-accent' : 'text-text-muted/30'} />
                {trainingFile ? (
                  <span className="font-normal text-accent text-sm break-all">{trainingFile.name}</span>
                ) : (
                  <div>
                    <p className="text-sm text-text-sub font-subtle">Haga clic para seleccionar archivo</p>
                    <small className="text-micro text-text-muted/50 font-subtle">PDF, TXT o MD</small>
                  </div>
                )}
              </div>
              <button
                className="w-full py-3 rounded-xl bg-accent/8 border border-accent/15 text-accent font-emphasized cursor-pointer transition-all hover:bg-accent/12 hover:border-accent/22 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 text-sm"
                onClick={handleTrainSubmit}
                disabled={!trainingFile || resolvedIsTraining}>
                {resolvedIsTraining ? (
                  <div className="flex gap-1.5 py-0">
                    {[0, 1, 2].map(i => (
                      <span key={i} className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce"
                        style={{ animationDelay: `${i * 0.16}s` }} />
                    ))}
                  </div>
                ) : (
                  <>Procesar Documento Legal</>
                )}
              </button>
              {resolvedTrainingStatus && (
                <div className={`text-sm text-center p-3.5 rounded-xl font-subtle ${
                  resolvedTrainingStatus.type === 'success'
                    ? 'bg-accent/6 text-accent'
                    : 'bg-danger/8 text-danger/80'
                }`}>
                  {resolvedTrainingStatus.message}
                </div>
              )}
            </div>
          )}

          {settingsTab === 'customization' && (
            <div className="flex flex-col gap-5 max-w-[520px]">
              <h3 className="font-serif text-lg font-normal text-text-main tracking-[-0.01em]">Personalización</h3>
              <div className="bg-white/[0.01] border border-white/[0.04] rounded-xl p-5">
                <p className="text-sm text-text-sub font-subtle leading-relaxed">
                  Ajustes de apariencia y personalización. Más opciones próximamente.
                </p>
              </div>
            </div>
          )}

          {settingsTab === 'hidden' && (
            <div className="flex flex-col gap-4 max-w-[520px]">
              <h3 className="flex items-center gap-2 font-serif text-lg font-normal text-text-main tracking-[-0.01em]">
                <EyeOff size={16} className="text-text-muted/50" /> Chats Ocultos
              </h3>
              <div className="bg-white/[0.01] border border-white/[0.04] rounded-xl p-5">
                <p className="text-sm text-text-sub font-subtle leading-relaxed">
                  Los chats ocultos no aparecen en el historial ni en la búsqueda.
                </p>
              </div>
              <button
                className="w-full py-2.5 rounded-xl bg-accent/8 border border-accent/12 text-accent font-emphasized cursor-pointer transition-all hover:bg-accent/12 hover:border-accent/18 flex items-center justify-center gap-2 text-sm"
                onClick={onSetHiddenMode}>
                <EyeOff size={13} /> Ver chats ocultos
              </button>
              <div className="flex flex-col gap-1 max-h-[240px] overflow-y-auto scrollbar-thin mt-2">
                {chats.filter(c => c.isHidden).length === 0 ? (
                  <p className="text-sm text-text-muted/50 font-subtle">No hay chats ocultos.</p>
                ) : (
                  chats.filter(c => c.isHidden).map(chat => (
                    <div key={chat.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.01] border border-white/[0.03]">
                      <span className="flex-1 text-sm text-text-main font-subtle truncate">{chat.title}</span>
                      <div className="flex gap-1.5 shrink-0">
                        <button
                          className="px-3 py-1.5 rounded-lg bg-accent/8 border border-accent/12 text-accent text-micro font-emphasized cursor-pointer transition-all hover:bg-accent/12 hover:border-accent/18"
                          onClick={() => onRestoreChat(chat.id)}>
                          Mostrar
                        </button>
                        <button
                          className="px-2 py-1.5 rounded-lg border border-danger/12 text-danger/50 text-micro cursor-pointer transition-all hover:bg-danger/6"
                          onClick={(e) => onDeleteChat(e, chat.id)}>
                          <Trash2 size={11} />
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

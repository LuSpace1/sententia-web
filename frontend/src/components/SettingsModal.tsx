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
  const { preferences, updatePreference, resetPreferences } = usePreferences();
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
    { id: 'general', icon: <SettingsIcon size={17} />, label: 'General' },
    { id: 'train', icon: <Database size={17} />, label: 'Entrenar' },
    { id: 'customization', icon: <Palette size={17} />, label: 'Personalización' },
    { id: 'hidden', icon: <EyeOff size={17} />, label: 'Ocultos' },
  ];

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center animate-fade-in"
      onClick={() => !resolvedIsTraining && onClose()}>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative flex flex-row w-[860px] max-w-[92vw] h-[620px] overflow-hidden glass-panel-strong rounded-2xl shadow-2xl animate-modal"
        onClick={(e) => e.stopPropagation()}>
        {/* Sidebar */}
        <nav className="w-[240px] min-w-[240px] bg-white/[0.02] border-r border-glass-border flex flex-col p-4 gap-1">
          <div className="flex items-center justify-between px-4 pb-4 mb-3 border-b border-glass-border">
            <div className="flex items-center gap-2.5">
              <Scale size={16} className="text-accent" />
              <h3 className="font-serif text-sm font-[450] text-text-main">Configuración</h3>
            </div>
            <button
              className="bg-none border-none text-text-muted cursor-pointer flex items-center justify-center rounded-lg p-1.5 transition-all hover:bg-white/[0.06] hover:text-text-main"
              onClick={onClose}
              title="Cerrar">
              <X size={16} />
            </button>
          </div>
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`flex items-center gap-3 bg-none border-none text-text-sub px-4 py-2.5 w-full rounded-xl cursor-pointer text-xs font-[450] text-left transition-all hover:bg-white/[0.04] hover:text-text-main ${
                settingsTab === tab.id ? '!bg-accent-muted !text-accent' : ''
              }`}
              onClick={() => setSettingsTab(tab.id)}>
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="flex-1 p-8 overflow-y-auto max-h-[80vh] scrollbar-thin">
          {settingsTab === 'general' && (
            <div className="flex flex-col gap-5">
              <h3 className="font-serif text-base font-[450] text-text-main">General</h3>
              <p className="bg-accent-muted border border-accent/15 p-4 rounded-xl text-sm text-text-sub font-[350] leading-relaxed">
                Ajustes generales de la aplicación. Más opciones próximamente.
              </p>
            </div>
          )}

          {settingsTab === 'train' && (
            <div className="flex flex-col gap-5">
              <h3 className="font-serif text-base font-[450] text-text-main">Entrenar Sententia</h3>
              <p className="bg-accent-muted border border-accent/15 p-4 rounded-xl text-sm text-text-sub font-[350] leading-relaxed">
                Sube documentos legales chilenos para alimentar la base de conocimiento del asistente.
                Sententia soporta archivos <strong className="text-text-main font-[450]">PDF, TXT y MD</strong>.
              </p>
              <div className={`border-2 border-dashed border-glass-border rounded-2xl p-10 text-center transition-all cursor-pointer flex flex-col items-center gap-4 relative hover:border-accent/30 hover:bg-accent-muted ${
                trainingFile ? '!border-solid !border-accent/30 !bg-accent-muted' : ''
              }`}>
                <input
                  type="file"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  accept=".pdf,.txt,.md"
                  onChange={handleTrainFileChange}
                  disabled={resolvedIsTraining}
                />
                <UploadCloud size={36} strokeWidth={1.5} color={trainingFile ? '#c9a84c' : 'rgba(255,255,255,0.25)'} />
                {trainingFile ? (
                  <span className="font-[450] text-accent text-sm break-all">{trainingFile.name}</span>
                ) : (
                  <div>
                    <p className="text-sm text-text-sub font-[350]">Haga clic para seleccionar archivo</p>
                    <small className="text-xs text-text-muted font-[350]">PDF, TXT o MD</small>
                  </div>
                )}
              </div>
              <button
                className="w-full py-3.5 rounded-xl bg-accent/10 border border-accent/20 text-accent font-[450] cursor-pointer transition-all hover:bg-accent/15 hover:border-accent/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
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
                <div className={`mt-2 text-sm text-center p-3 rounded-xl font-[350] ${
                  resolvedTrainingStatus.type === 'success'
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'bg-danger/10 text-danger'
                }`}>
                  {resolvedTrainingStatus.message}
                </div>
              )}
            </div>
          )}

          {settingsTab === 'customization' && (
            <div className="flex flex-col gap-5">
              <h3 className="font-serif text-base font-[450] text-text-main">Personalización</h3>
              <p className="bg-accent-muted border border-accent/15 p-4 rounded-xl text-sm text-text-sub font-[350] leading-relaxed">
                Ajustes de apariencia y personalización. Más opciones próximamente.
              </p>
            </div>
          )}

          {settingsTab === 'hidden' && (
            <div className="flex flex-col gap-4">
              <h3 className="flex items-center gap-2 font-serif text-base font-[450] text-text-main">
                <EyeOff size={16} /> Chats Ocultos
              </h3>
              <p className="bg-accent-muted border border-accent/15 p-4 rounded-xl text-sm text-text-sub font-[350] leading-relaxed">
                Los chats ocultos no aparecen en el historial ni en la búsqueda.
              </p>
              <button
                className="w-full py-3 rounded-xl bg-accent/10 border border-accent/20 text-accent font-[450] cursor-pointer transition-all hover:bg-accent/15 hover:border-accent/30 flex items-center justify-center gap-2 text-sm"
                onClick={onSetHiddenMode}>
                <EyeOff size={14} /> Ver chats ocultos
              </button>
              <div className="flex flex-col gap-1.5 max-h-[240px] overflow-y-auto scrollbar-thin">
                {chats.filter(c => c.isHidden).length === 0 ? (
                  <p className="text-sm text-text-muted font-[350] mt-4">No hay chats ocultos.</p>
                ) : (
                  chats.filter(c => c.isHidden).map(chat => (
                    <div key={chat.id} className="flex items-center gap-4 p-3 glass-panel rounded-xl">
                      <span className="flex-1 text-sm text-text-main font-[350] truncate">{chat.title}</span>
                      <div className="flex gap-2 shrink-0">
                        <button
                          className="px-3 py-1.5 rounded-lg bg-accent/10 border border-accent/20 text-accent text-xs font-[450] cursor-pointer transition-all hover:bg-accent/15 hover:border-accent/30"
                          onClick={() => onRestoreChat(chat.id)}>
                          Mostrar
                        </button>
                        <button
                          className="px-2 py-1.5 rounded-lg border border-danger/20 text-danger/70 text-xs cursor-pointer transition-all hover:bg-danger/10"
                          onClick={(e) => onDeleteChat(e, chat.id)}>
                          <Trash2 size={12} />
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

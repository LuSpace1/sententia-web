import { useState } from 'react';
import {
  X, Database, UploadCloud, Settings as SettingsIcon,
  Palette, EyeOff, Trash2, Scale, ToggleLeft,
  Gavel, BookOpen, SlidersHorizontal,
} from 'lucide-react';
import type { Chat, TrainingStatus } from '../types';
import { chatService } from '../services/api';
import { usePreferences } from '../context/usePreferences';

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
  const [chunkSize, setChunkSize] = useState('1000');
  const [chunkOverlap, setChunkOverlap] = useState('200');
  const [trainingJurisdiction, setTrainingJurisdiction] = useState(preferences.defaultJurisdiction || '');

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
    setLocalTrainingStatus({ type: 'info', message: 'Subiendo documento...', progress: 10, file: trainingFile.name, createdAt: Date.now() });
    try {
      const config = {
        chunkSize: parseInt(chunkSize) || 1000,
        chunkOverlap: parseInt(chunkOverlap) || 200,
        jurisdiction: trainingJurisdiction || undefined,
      };
      const response = await chatService.train(trainingFile, config);
      setLocalTrainingStatus({
        type: 'success',
        message: response.data.message,
        progress: 100,
        file: trainingFile.name,
        createdAt: Date.now(),
      });
      setTrainingFile(null);
    } catch (err) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setLocalTrainingStatus({
        type: 'error',
        message: axiosErr?.response?.data?.error || 'Error al procesar el documento legal.',
        file: trainingFile.name,
        createdAt: Date.now(),
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
              <div className="bg-accent-muted border border-accent/15 p-5 rounded-xl space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-text-main text-sm font-[450]">Historial máximo</p>
                    <p className="text-text-muted text-xs font-[350] mt-0.5">Turnos enviados al modelo por consulta</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <input type="range" min="2" max="20" value={preferences.maxHistoryTurns ?? 8}
                      onChange={(e) => updatePreference('maxHistoryTurns', Number(e.target.value))}
                      className="w-24 h-1.5 rounded-full appearance-none cursor-pointer bg-glass-border accent-accent
                        [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5
                        [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:border-none
                        [&::-webkit-slider-thumb]:shadow-none" />
                    <span className="text-accent text-sm font-[450] min-w-[2ch] text-right">{preferences.maxHistoryTurns}</span>
                  </div>
                </div>
                <div className="h-px bg-glass-border" />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-text-main text-sm font-[450]">Jurisdicción por defecto</p>
                    <p className="text-text-muted text-xs font-[350] mt-0.5">Filtra resultados por país</p>
                  </div>
                  <select value={preferences.defaultJurisdiction || 'Chile'}
                    onChange={(e) => updatePreference('defaultJurisdiction', e.target.value)}
                    className="bg-white/[0.04] border border-glass-border rounded-lg px-3 py-1.5 text-text-main text-xs outline-none
                      focus:border-accent/30 transition-all font-[350] cursor-pointer">
                    <option value="Chile" className="bg-surface text-text-main">Chile</option>
                    <option value="Argentina" className="bg-surface text-text-main">Argentina</option>
                    <option value="Perú" className="bg-surface text-text-main">Perú</option>
                    <option value="Colombia" className="bg-surface text-text-main">Colombia</option>
                    <option value="México" className="bg-surface text-text-main">México</option>
                    <option value="España" className="bg-surface text-text-main">España</option>
                  </select>
                </div>
                <div className="h-px bg-glass-border" />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-text-main text-sm font-[450]">Área legal predilecta</p>
                    <p className="text-text-muted text-xs font-[350] mt-0.5">Ej: Civil, Penal, Laboral</p>
                  </div>
                  <input type="text" value={preferences.defaultPracticeArea || ''}
                    onChange={(e) => updatePreference('defaultPracticeArea', e.target.value)}
                    placeholder="Todas"
                    className="bg-white/[0.04] border border-glass-border rounded-lg px-3 py-1.5 text-text-main text-xs outline-none
                      w-28 text-right focus:border-accent/30 transition-all font-[350] placeholder:text-text-muted" />
                </div>
              </div>
            </div>
          )}

          {settingsTab === 'train' && (
            <div className="flex flex-col gap-5">
              <h3 className="font-serif text-base font-[450] text-text-main">Entrenar Sententia</h3>
              <p className="bg-accent-muted border border-accent/15 p-4 rounded-xl text-sm text-text-sub font-[350] leading-relaxed">
                Sube documentos legales para alimentar la base de conocimiento del asistente.
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

              <details className="group">
                <summary className="flex items-center gap-2 text-xs text-text-muted font-[450] cursor-pointer hover:text-text-main transition-colors list-none">
                  <SlidersHorizontal size={13} className="transition-transform group-open:rotate-90" />
                  Configuración avanzada
                </summary>
                <div className="mt-3 p-4 bg-white/[0.02] border border-glass-border rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-text-muted text-xs font-[350]">Chunk size</label>
                    <input type="number" min="100" max="5000" step="100" value={chunkSize}
                      onChange={(e) => setChunkSize(e.target.value)}
                      className="bg-white/[0.04] border border-glass-border rounded-lg px-3 py-1.5 text-text-main text-xs outline-none
                        w-20 text-right focus:border-accent/30 transition-all font-[350]" />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-text-muted text-xs font-[350]">Solapamiento (overlap)</label>
                    <input type="number" min="0" max="1000" step="50" value={chunkOverlap}
                      onChange={(e) => setChunkOverlap(e.target.value)}
                      className="bg-white/[0.04] border border-glass-border rounded-lg px-3 py-1.5 text-text-main text-xs outline-none
                        w-20 text-right focus:border-accent/30 transition-all font-[350]" />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-text-muted text-xs font-[350]">Jurisdicción</label>
                    <input type="text" value={trainingJurisdiction}
                      onChange={(e) => setTrainingJurisdiction(e.target.value)}
                      placeholder={preferences.defaultJurisdiction || 'Chile'}
                      className="bg-white/[0.04] border border-glass-border rounded-lg px-3 py-1.5 text-text-main text-xs outline-none
                        w-28 text-right focus:border-accent/30 transition-all font-[350] placeholder:text-text-muted" />
                  </div>
                </div>
              </details>

              <button
                className="w-full py-3.5 rounded-xl bg-accent/10 border border-accent/20 text-accent font-[450] cursor-pointer transition-all hover:bg-accent/15 hover:border-accent/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                onClick={handleTrainSubmit}
                disabled={!trainingFile || resolvedIsTraining}>
                {resolvedIsTraining ? (
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1.5 py-0">
                      {[0, 1, 2].map(i => (
                        <span key={i} className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce"
                          style={{ animationDelay: `${i * 0.16}s` }} />
                      ))}
                    </div>
                    <span className="text-text-muted text-xs font-[350]">
                      {resolvedTrainingStatus?.progress ? `${resolvedTrainingStatus.progress}%` : 'Procesando...'}
                    </span>
                  </div>
                ) : (
                  <>Procesar Documento Legal</>
                )}
              </button>
              {resolvedTrainingStatus && (
                <div className={`text-sm p-3 rounded-xl font-[350] flex flex-col gap-1 ${
                  resolvedTrainingStatus.type === 'success'
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : resolvedTrainingStatus.type === 'error'
                    ? 'bg-danger/10 text-danger'
                    : 'bg-accent/8 text-accent'
                }`}>
                  <span>{resolvedTrainingStatus.message}</span>
                  {resolvedTrainingStatus.file && (
                    <span className="text-xs opacity-70 font-[350]">{resolvedTrainingStatus.file}</span>
                  )}
                  {resolvedTrainingStatus.progress !== undefined && !resolvedIsTraining && (
                    <div className="w-full h-1 rounded-full bg-white/[0.06] mt-1 overflow-hidden">
                      <div className="h-full rounded-full bg-accent transition-all duration-500"
                        style={{ width: `${resolvedTrainingStatus.progress}%` }} />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {settingsTab === 'customization' && (
            <div className="flex flex-col gap-5">
              <h3 className="font-serif text-base font-[450] text-text-main">Personalización</h3>
              <div className="bg-accent-muted border border-accent/15 p-5 rounded-xl space-y-4">

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-text-main text-sm font-[450]">Tema</p>
                    <p className="text-text-muted text-xs font-[350] mt-0.5">Oscuro / Claro</p>
                  </div>
                  <div className="flex items-center gap-2 bg-white/[0.04] border border-glass-border rounded-lg p-0.5">
                    <button
                      onClick={() => updatePreference('theme', 'dark')}
                      className={`px-3 py-1.5 rounded-md text-xs font-[450] transition-all cursor-pointer border-none ${
                        preferences.theme === 'dark'
                          ? 'bg-accent/15 text-accent shadow-sm'
                          : 'text-text-muted hover:text-text-main bg-transparent'
                      }`}>
                      Oscuro
                    </button>
                    <button
                      onClick={() => updatePreference('theme', 'light')}
                      className={`px-3 py-1.5 rounded-md text-xs font-[450] transition-all cursor-pointer border-none ${
                        preferences.theme === 'light'
                          ? 'bg-accent/15 text-accent shadow-sm'
                          : 'text-text-muted hover:text-text-main bg-transparent'
                      }`}>
                      Claro
                    </button>
                  </div>
                </div>

                <div className="h-px bg-glass-border" />

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-text-main text-sm font-[450]">Citas legales</p>
                    <p className="text-text-muted text-xs font-[350] mt-0.5">Mostrar fuentes y citas en respuestas</p>
                  </div>
                  <button
                    onClick={() => updatePreference('citationsEnabled', !preferences.citationsEnabled)}
                    className={`relative w-10 h-5 rounded-full transition-all cursor-pointer border-none ${
                      preferences.citationsEnabled ? 'bg-accent/40' : 'bg-white/[0.08]'
                    }`}>
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${
                      preferences.citationsEnabled ? 'left-[22px]' : 'left-0.5'
                    }`} />
                  </button>
                </div>

                <div className="h-px bg-glass-border" />

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-text-main text-sm font-[450]">Streaming</p>
                    <p className="text-text-muted text-xs font-[350] mt-0.5">Ver respuesta mientras se genera</p>
                  </div>
                  <button
                    onClick={() => updatePreference('streamingEnabled', !preferences.streamingEnabled)}
                    className={`relative w-10 h-5 rounded-full transition-all cursor-pointer border-none ${
                      preferences.streamingEnabled ? 'bg-accent/40' : 'bg-white/[0.08]'
                    }`}>
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${
                      preferences.streamingEnabled ? 'left-[22px]' : 'left-0.5'
                    }`} />
                  </button>
                </div>

                <div className="h-px bg-glass-border" />

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-text-main text-sm font-[450]">Notificaciones</p>
                    <p className="text-text-muted text-xs font-[350] mt-0.5">Alertas de entrenamiento completado</p>
                  </div>
                  <button
                    onClick={() => updatePreference('notificationsEnabled', !preferences.notificationsEnabled)}
                    className={`relative w-10 h-5 rounded-full transition-all cursor-pointer border-none ${
                      preferences.notificationsEnabled ? 'bg-accent/40' : 'bg-white/[0.08]'
                    }`}>
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${
                      preferences.notificationsEnabled ? 'left-[22px]' : 'left-0.5'
                    }`} />
                  </button>
                </div>

              </div>

              <button
                onClick={resetPreferences}
                className="self-start px-4 py-2 rounded-xl border border-glass-border text-text-muted text-xs font-[350] cursor-pointer transition-all hover:border-danger/20 hover:text-danger/80 hover:bg-danger/5">
                Restablecer valores predeterminados
              </button>
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

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Menu, PanelLeftOpen, FileText, Search, X } from 'lucide-react';
import { chatService } from '../services/api';
import { generateId } from '../utils';
import ChatSidebar from '../components/ChatSidebar';
import ChatMessages from '../components/ChatMessages';
import ChatInput from '../components/ChatInput';
import SettingsModal from '../components/SettingsModal';
import CustomAlert from '../components/CustomAlert';
import type {
  Chat as ChatType,
  Message,
  DownloadState,
  CustomAlert as CustomAlertType,
  ModelPrompt,
} from '../types';

const createInitialChat = (): ChatType => ({
  id: generateId(),
  title: 'Nueva Consulta Legal',
  isPinned: false,
  isHidden: false,
  updatedAt: Date.now(),
  messages: [],
});

export default function Chat() {
  const [chats, setChats] = useState<ChatType[]>([createInitialChat()]);
  const [activeChatId, setActiveChatId] = useState(chats[0].id);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [downloadStates, setDownloadStates] = useState<Record<string, DownloadState>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [isHiddenMode, setIsHiddenMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [hiddenSearchQuery, setHiddenSearchQuery] = useState('');
  const [renameModal, setRenameModal] = useState<{ id: string } | null>(null);
  const [renameBuffer, setRenameBuffer] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [customAlert, setCustomAlert] = useState<CustomAlertType | null>(null);
  const downloadAbortRefs = useRef<Record<string, AbortController>>({});

  const activeChat = chats.find(c => c.id === activeChatId) || chats[0];
  const messages = useMemo(() => activeChat?.messages || [], [activeChat?.messages]);

  useEffect(() => {
    document.body.setAttribute('data-theme', 'dark-liquid');
  }, []);

  const handleNewChat = useCallback(() => {
    if (activeChat.messages.length <= 1 && activeChat.title === 'Nueva Consulta Legal') {
      setIsSearchMode(false);
      return;
    }
    const newChat = createInitialChat();
    setChats(prev => [newChat, ...prev]);
    setActiveChatId(newChat.id);
    setIsSearchMode(false);
    if (window.innerWidth <= 860) setIsMobileOpen(false);
  }, [activeChat]);

  const handleSelectChat = useCallback((id: string) => {
    setActiveChatId(id);
    setIsSearchMode(false);
    if (window.innerWidth <= 860) setIsMobileOpen(false);
  }, []);

  const handleTogglePin = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setChats(prev => prev.map(chat =>
      chat.id === id ? { ...chat, isPinned: !chat.isPinned } : chat
    ));
  }, []);

  const handleDeleteChat = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setCustomAlert({
      title: '¿Eliminar chat?',
      text: 'Esta acción es permanente y no se puede deshacer.',
      confirmText: 'Sí, eliminar',
      isDanger: true,
      onConfirm: () => {
        const newChats = chats.filter(c => c.id !== id);
        if (newChats.length === 0) {
          const initial = createInitialChat();
          setChats([initial]);
          setActiveChatId(initial.id);
        } else {
          setChats(newChats);
          if (activeChatId === id) setActiveChatId(newChats.find(c => !c.isHidden)?.id || newChats[0].id);
        }
        setCustomAlert(null);
      },
      onCancel: () => setCustomAlert(null),
    });
  }, [chats, activeChatId]);

  const handleHideChat = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setCustomAlert({
      title: '¿Ocultar conversación?',
      text: 'Podrás recuperarla en Configuración → Chats Ocultos.',
      confirmText: 'Sí, ocultar',
      isDanger: false,
      onConfirm: () => {
        setChats(prev => prev.map(chat =>
          chat.id === id ? { ...chat, isHidden: true } : chat
        ));
        if (activeChatId === id) {
          const available = chats.filter(c => c.id !== id && !c.isHidden);
          if (available.length > 0) setActiveChatId(available[0].id);
          else handleNewChat();
        }
        setCustomAlert(null);
      },
      onCancel: () => setCustomAlert(null),
    });
  }, [chats, activeChatId, handleNewChat]);

  const startRenameModal = useCallback((_e: React.MouseEvent, chat: ChatType) => {
    setRenameModal({ id: chat.id });
    setRenameBuffer(chat.title);
  }, []);

  const confirmRename = useCallback(() => {
    if (!renameBuffer.trim() || !renameModal) return;
    setChats(prev => prev.map(chat =>
      chat.id === renameModal.id ? { ...chat, title: renameBuffer.trim() } : chat
    ));
    setRenameModal(null);
    setRenameBuffer('');
  }, [renameBuffer, renameModal]);

  const copyToClipboard = useCallback(async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Error al copiar:', err);
    }
  }, []);

  const handleModelDownload = useCallback(async (modelName: string, purpose: string) => {
    if (!modelName || downloadStates[modelName]) return;

    const abortController = new AbortController();
    downloadAbortRefs.current[modelName] = abortController;

    setDownloadStates(prev => ({
      ...prev,
      [modelName]: { purpose, status: 'Conectando con Ollama...', progress: 0, indeterminate: true },
    }));

    try {
      const finalEvent = await chatService.pullModel(modelName, {
        signal: abortController.signal,
        onProgress: (event) => {
          const completed = Number(event.completed);
          const total = Number(event.total);
          const hasProgress = Number.isFinite(completed) && Number.isFinite(total) && total > 0;

          setDownloadStates(prev => ({
            ...prev,
            [modelName]: {
              purpose,
              status: event.status || prev[modelName]?.status || 'Descargando...',
              progress: hasProgress ? Math.max(0, Math.min(100, Math.round((completed / total) * 100))) : (prev[modelName]?.progress ?? 0),
              indeterminate: !hasProgress,
            },
          }));
        },
      });

      if (finalEvent?.status !== 'success') {
        throw new Error('Ollama no confirmó la descarga del modelo.');
      }

      const successMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: `### Modelo instalado\nEl modelo **${modelName}** ya quedó disponible.\n\nSe usa para ${purpose || 'habilitar esta parte del sistema'}.\n\nHaz tu consulta nuevamente y el RAG podrá continuar.`,
      };

      setChats(prev => prev.map(c => {
        if (c.id === activeChatId) {
          return { ...c, messages: [...c.messages, successMessage], updatedAt: Date.now() };
        }
        return c;
      }));
    } catch (err) {
      const error = err as Error & { name?: string; code?: string; response?: { data?: { error?: string } } };
      if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') {
        const cancelMessage: Message = {
          id: generateId(),
          role: 'assistant',
          content: `### Descarga cancelada\nNo se descargó **${modelName}**. Puedes volver a intentarlo cuando quieras.`,
        };
        setChats(prev => prev.map(c => {
          if (c.id === activeChatId) {
            return { ...c, messages: [...c.messages, cancelMessage], updatedAt: Date.now() };
          }
          return c;
        }));
        return;
      }

      const downloadError: Message = {
        id: generateId(),
        role: 'assistant',
        content: `### No se pudo descargar el modelo\n${error.response?.data?.error || 'Ocurrió un error al intentar descargarlo.'}`,
      };
      setChats(prev => prev.map(c => {
        if (c.id === activeChatId) {
          return { ...c, messages: [...c.messages, downloadError], updatedAt: Date.now() };
        }
        return c;
      }));
    } finally {
      delete downloadAbortRefs.current[modelName];
      setDownloadStates(prev => {
        const next = { ...prev };
        delete next[modelName];
        return next;
      });
    }
  }, [downloadStates, activeChatId]);

  const handleMultipleModelsDownload = useCallback((models: ModelPrompt[]) => {
    models.forEach(({ model, purpose }) => handleModelDownload(model, purpose));
  }, [handleModelDownload]);

  const handleCancelModelDownload = useCallback((modelName: string) => {
    downloadAbortRefs.current[modelName]?.abort();
  }, []);

  const handleSkipModelDownload = useCallback((modelName: string) => {
    const skipMessage: Message = {
      id: generateId(),
      role: 'assistant',
      content: `### Entendido\nNo descargaré **${modelName}** por ahora.\n\nCuando quieras, puedes volver a intentar la consulta o instalar el modelo desde este mismo chat.`,
    };
    setChats(prev => prev.map(c => {
      if (c.id === activeChatId) {
        return { ...c, messages: [...c.messages, skipMessage], updatedAt: Date.now() };
      }
      return c;
    }));
  }, [activeChatId]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsgContent = input;
    const userMessage: Message = { id: generateId(), role: 'user', content: userMsgContent };

    let newTitle = activeChat.title;
    if (messages.length === 1 && newTitle === 'Nueva Consulta Legal') {
      newTitle = userMsgContent.substring(0, 30) + (userMsgContent.length > 30 ? '...' : '');
    }

    setChats(prev => prev.map(c => {
      if (c.id === activeChatId) {
        return { ...c, title: newTitle, messages: [...c.messages, userMessage], updatedAt: Date.now() };
      }
      return c;
    }));

    setInput('');
    setLoading(true);

    try {
      const historyMessages = messages
        .filter(m => m.role === 'user' || m.role === 'assistant')
        .slice(-8)
        .map(m => ({ role: m.role, content: m.content }));

      const response = await chatService.sendMessage(userMsgContent, historyMessages);
      const assistantMessage: Message = { id: generateId(), role: 'assistant', content: response.data.answer };

      setChats(prev => prev.map(c => {
        if (c.id === activeChatId) {
          return { ...c, messages: [...c.messages, assistantMessage], updatedAt: Date.now() };
        }
        return c;
      }));
    } catch (err) {
      const axiosErr = err as {
        response?: {
          status?: number;
          data?: {
            code?: string;
            model?: string;
            purpose?: string;
            error?: string;
            models?: ModelPrompt[];
          };
        };
      };
      const statusCode = axiosErr?.response?.status;
      const errorCode = axiosErr?.response?.data?.code;
      const modelName = axiosErr?.response?.data?.model;
      const purpose = axiosErr?.response?.data?.purpose;
      const missingModels = axiosErr?.response?.data?.models;

      let errorContent: string;
      let modelPrompt: ModelPrompt | null = null;
      let modelPrompts: ModelPrompt[] | null = null;

      if (errorCode === 'ollama_models_missing' && missingModels?.length) {
        const modelList = missingModels.map(m => `- **${m.model}**: ${m.purpose}`).join('\n');
        errorContent = `### Faltan modelos locales\nLos siguientes modelos no están instalados en Ollama:\n\n${modelList}\n\n¿Quieres que los descargue ahora?`;
        modelPrompts = missingModels;
      } else if (errorCode === 'ollama_model_missing') {
        errorContent = `### Falta un modelo local\nEl modelo **${modelName}** no está instalado.\n\nSe usa para ${purpose}.\n\n¿Quieres que lo descargue ahora?`;
        modelPrompt = modelName && purpose ? { model: modelName, purpose } : null;
      } else if (statusCode === 401 || statusCode === 403) {
        errorContent = '### Sesión no autorizada\nNo se pudo validar tu sesión. Vuelve a iniciar sesión o activa el modo demo desde el inicio.';
      } else {
        errorContent = `### Falla Sistémica\n${axiosErr?.response?.data?.error || 'No fue posible contactar con los servidores de Sententia. Reintente en unos momentos, recuerde encender Ollama.'}`;
      }

      const errorMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: errorContent,
        modelPrompt,
        modelPrompts,
      };
      setChats(prev => prev.map(c => {
        if (c.id === activeChatId) {
          return { ...c, messages: [...c.messages, errorMessage], updatedAt: Date.now() };
        }
        return c;
      }));
    } finally {
      setLoading(false);
    }
  }, [input, loading, activeChat, messages, activeChatId]);

  const handleRestoreChat = useCallback((id: string) => {
    setChats(prev => prev.map(c => c.id === id ? { ...c, isHidden: false } : c));
  }, []);

  return (
    <div className={`flex h-screen w-full overflow-hidden bg-[#09090b] text-white/95 font-[Outfit] ${showSidebar ? '' : ''}`}>
      <ChatSidebar
        chats={chats}
        activeChatId={activeChatId}
        showSidebar={showSidebar}
        isMobileOpen={isMobileOpen}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
        onTogglePin={handleTogglePin}
        onDeleteChat={handleDeleteChat}
        onHideChat={handleHideChat}
        onRenameChat={startRenameModal}
        onToggleSidebar={() => setShowSidebar(false)}
        onCloseMobile={() => setIsMobileOpen(false)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenSearch={() => setIsSearchMode(true)}
      />

      <main className="flex-1 flex flex-col h-screen relative z-2">
        <header className="h-[70px] flex items-center justify-between px-4 absolute top-0 left-0 right-0 z-10 pointer-events-none">
          <div className="flex items-center gap-3 pointer-events-auto">
            {!showSidebar && (
              <button className="bg-transparent border-none text-zinc-400 cursor-pointer p-2 rounded-lg hover:bg-white/10 hover:text-white transition-all flex items-center justify-center" onClick={() => setShowSidebar(true)} title="Mostrar panel lateral">
                <PanelLeftOpen size={22} />
              </button>
            )}
            <button className="hidden max-sm:flex bg-transparent border-none text-zinc-400 p-2 rounded-lg cursor-pointer hover:bg-white/10 hover:text-white transition-all items-center justify-center" onClick={() => setIsMobileOpen(true)}>
              <Menu size={20} />
            </button>
            {!showSidebar && (
              <div className="font-medium text-lg text-white/95">
                <span>Sententia</span>
              </div>
            )}
          </div>
          <div className="pointer-events-auto" />
        </header>

        {isSearchMode ? (
          <div className="flex flex-col flex-1 p-8 overflow-hidden max-w-[800px] mx-auto w-full">
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-white/95 mb-4">Historial</h2>
              <div className="relative flex items-center bg-white/[0.05] border border-white/10 rounded-xl px-4 py-3 transition-all focus-within:border-accent focus-within:bg-white/[0.08]">
                <Search size={18} className="text-zinc-400 mr-3 shrink-0" />
                <input
                  type="text"
                  placeholder="Buscar conversaciones..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent border-none text-white/95 text-base outline-none placeholder:text-zinc-400"
                  autoFocus
                />
              </div>
              <button className="action-btn ml-2" title="Cerrar" onClick={() => { setIsSearchMode(false); setSearchQuery(''); }}>
                <X size={20} />
              </button>
            </div>
            <div className="flex flex-col gap-2 overflow-y-auto pr-2 scrollbar-thin">
              {chats.filter(c => !c.isHidden && c.title.toLowerCase().includes(searchQuery.toLowerCase())).map(chat => (
                <div
                  key={chat.id}
                  className="flex items-center gap-4 p-4 bg-white/[0.02] border border-white/10 rounded-xl cursor-pointer transition-all hover:bg-white/[0.05] hover:border-white/15 hover:-translate-y-0.5"
                  onClick={() => handleSelectChat(chat.id)}
                >
                  <div className="flex flex-col gap-1">
                    <span className="text-white/95 font-medium">{chat.title}</span>
                    <span className="text-zinc-500 text-xs">{new Date(chat.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
              {chats.filter(c => !c.isHidden && c.title.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                <div className="text-zinc-500 text-center py-8 italic">No se encontraron conversaciones.</div>
              )}
            </div>
          </div>
        ) : isHiddenMode ? (
          <div className="flex flex-col flex-1 p-8 overflow-hidden max-w-[800px] mx-auto w-full">
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-white/95 mb-4">Ocultos</h2>
              <div className="relative flex items-center bg-white/[0.05] border border-white/10 rounded-xl px-4 py-3 transition-all focus-within:border-accent focus-within:bg-white/[0.08]">
                <Search size={18} className="text-zinc-400 mr-3 shrink-0" />
                <input
                  type="text"
                  placeholder="Buscar en ocultos..."
                  value={hiddenSearchQuery}
                  onChange={(e) => setHiddenSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent border-none text-white/95 text-base outline-none placeholder:text-zinc-400"
                  autoFocus
                />
              </div>
              <button className="action-btn ml-2" title="Cerrar" onClick={() => { setIsHiddenMode(false); setHiddenSearchQuery(''); }}>
                <X size={20} />
              </button>
            </div>
            <div className="flex flex-col gap-2 overflow-y-auto pr-2 scrollbar-thin">
              {chats.filter(c => c.isHidden && c.title.toLowerCase().includes(hiddenSearchQuery.toLowerCase())).length === 0 ? (
                <div className="text-zinc-500 text-center py-8 italic">
                  {hiddenSearchQuery ? 'Sin coincidencias.' : 'No hay chats ocultos.'}
                </div>
              ) : (
                chats.filter(c => c.isHidden && c.title.toLowerCase().includes(hiddenSearchQuery.toLowerCase())).map(chat => (
                  <div key={chat.id} className="flex items-center gap-4 p-4 bg-white/[0.02] border border-white/10 rounded-xl">
                    <div className="flex flex-col gap-1 flex-1">
                      <span className="text-white/95 font-medium">{chat.title}</span>
                      <span className="text-zinc-500 text-xs">{new Date(chat.updatedAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex gap-1.5 shrink-0 ml-3">
                      <button
                        className="px-3 py-1 rounded-lg bg-accent text-white text-xs font-medium cursor-pointer transition-all hover:shadow-[0_0_16px_rgba(212,175,55,0.4)]"
                        title="Restaurar al historial"
                        onClick={() => handleRestoreChat(chat.id)}
                      >
                        Mostrar
                      </button>
                      <button
                        className="px-2 py-1 rounded-lg border border-red-500/25 text-rose-400 text-xs cursor-pointer transition-all hover:bg-red-500/15"
                        title="Eliminar permanentemente"
                        onClick={(e) => handleDeleteChat(e, chat.id)}
                      >
                        <FileText size={13} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <>
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full w-full pb-[10vh]">
                <h1 className="font-[Outfit] text-5xl md:text-7xl font-light tracking-tight mb-10 bg-gradient-to-r from-accent to-accent-light bg-clip-text text-transparent"
                  style={{ textShadow: '0 4px 20px rgba(212, 175, 55, 0.2)' }}>
                  Sententia
                </h1>
                <div className="w-full max-w-[800px] mx-auto">
                  <ChatInput
                    input={input}
                    loading={loading}
                    onSubmit={handleSubmit}
                    onChange={setInput}
                    footerText="Sententia es una AI basada en RAG y puede cometer errores."
                  />
                </div>
              </div>
            ) : (
              <>
                <ChatMessages
                  activeChat={activeChat}
                  loading={loading}
                  downloadStates={downloadStates}
                  onCopyMessage={copyToClipboard}
                  onDownloadModel={handleModelDownload}
                  onDownloadMultiple={handleMultipleModelsDownload}
                  onSkipDownload={handleSkipModelDownload}
                  onCancelDownload={handleCancelModelDownload}
                  copiedId={copiedId}
                />
                <footer className="px-4 pb-4 bg-transparent relative z-10 flex flex-col items-center">
                  <ChatInput
                    input={input}
                    loading={loading}
                    onSubmit={handleSubmit}
                    onChange={setInput}
                    footerText="Sententia es una AI basada en RAG y puede cometer errores."
                  />
                </footer>
              </>
            )}
          </>
        )}
      </main>

      {renameModal && (
        <div className="fixed inset-0 z-[2000] flex items-center bg-black/50 backdrop-blur-md" style={{ paddingLeft: showSidebar ? '330px' : '0' }} onClick={() => setRenameModal(null)}>
          <div className="bg-black/[0.98] backdrop-blur-2xl border border-accent/25 rounded-2xl p-7 w-full max-w-[480px] mx-auto shadow-2xl animate-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-white/95 text-lg font-semibold mb-4">Renombrar conversación</h3>
            <input
              type="text"
              className="w-full bg-white/[0.05] border border-white/10 rounded-lg px-4 py-3 text-white/95 text-base outline-none transition-all focus:border-accent focus:bg-white/[0.08]"
              value={renameBuffer}
              onChange={(e) => setRenameBuffer(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') confirmRename();
                if (e.key === 'Escape') setRenameModal(null);
              }}
              autoFocus
            />
            <div className="flex gap-3 justify-end mt-5">
              <button className="px-5 py-2.5 rounded-lg bg-white/[0.06] border border-white/10 text-zinc-400 text-sm cursor-pointer transition-all hover:bg-white/10 hover:text-white" onClick={() => setRenameModal(null)}>Cancelar</button>
              <button className="px-5 py-2.5 rounded-lg bg-accent text-white text-sm font-medium cursor-pointer transition-all hover:shadow-[0_0_16px_rgba(212,175,55,0.4)]" onClick={confirmRename}>Guardar</button>
            </div>
          </div>
        </div>
      )}

      <SettingsModal
        chats={chats}
        isSettingsOpen={isSettingsOpen}
        isTraining={false}
        trainingStatus={null}
        onClose={() => setIsSettingsOpen(false)}
        onSetHiddenMode={() => {
          setIsSettingsOpen(false);
          setIsHiddenMode(true);
          setIsSearchMode(false);
          setHiddenSearchQuery('');
        }}
        onDeleteChat={handleDeleteChat}
        onRestoreChat={handleRestoreChat}
      />

      {customAlert && (
        <CustomAlert alert={customAlert} />
      )}
    </div>
  );
}

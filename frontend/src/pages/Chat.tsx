import { useState, useRef, useCallback, useMemo } from 'react';
import { Menu, PanelLeftOpen, Search, X, FileText } from 'lucide-react';
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
  createdAt: Date.now(),
  updatedAt: Date.now(),
  messages: [],
});

const SUGGESTIONS = [
  '¿Qué dice el Artículo 19 sobre la libertad de expresión?',
  'Explícame los requisitos para formar una sociedad',
  '¿Cuáles son mis derechos como arrendatario?',
];

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
        if (c.id === activeChatId) return { ...c, messages: [...c.messages, successMessage], updatedAt: Date.now() };
        return c;
      }));
    } catch (err) {
      const error = err as Error & { name?: string; code?: string; response?: { data?: { error?: string } } };
      if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') {
        const cancelMessage: Message = {
          id: generateId(), role: 'assistant',
          content: `### Descarga cancelada\nNo se descargó **${modelName}**. Puedes volver a intentarlo cuando quieras.`,
        };
        setChats(prev => prev.map(c => {
          if (c.id === activeChatId) return { ...c, messages: [...c.messages, cancelMessage], updatedAt: Date.now() };
          return c;
        }));
        return;
      }
      const downloadError: Message = {
        id: generateId(), role: 'assistant',
        content: `### No se pudo descargar el modelo\n${error.response?.data?.error || 'Ocurrió un error al intentar descargarlo.'}`,
      };
      setChats(prev => prev.map(c => {
        if (c.id === activeChatId) return { ...c, messages: [...c.messages, downloadError], updatedAt: Date.now() };
        return c;
      }));
    } finally {
      delete downloadAbortRefs.current[modelName];
      setDownloadStates(prev => { const next = { ...prev }; delete next[modelName]; return next; });
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
      id: generateId(), role: 'assistant',
      content: `### Entendido\nNo descargaré **${modelName}** por ahora.\n\nCuando quieras, puedes volver a intentar la consulta o instalar el modelo desde este mismo chat.`,
    };
    setChats(prev => prev.map(c => {
      if (c.id === activeChatId) return { ...c, messages: [...c.messages, skipMessage], updatedAt: Date.now() };
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
      if (c.id === activeChatId) return { ...c, title: newTitle, messages: [...c.messages, userMessage], updatedAt: Date.now() };
      return c;
    }));
    setInput('');
    setLoading(true);

    try {
      const historyMessages = messages.filter(m => m.role === 'user' || m.role === 'assistant').slice(-8).map(m => ({ role: m.role, content: m.content }));
      const response = await chatService.sendMessage(userMsgContent, historyMessages);
      const assistantMessage: Message = { id: generateId(), role: 'assistant', content: response.data.answer };
      setChats(prev => prev.map(c => {
        if (c.id === activeChatId) return { ...c, messages: [...c.messages, assistantMessage], updatedAt: Date.now() };
        return c;
      }));
    } catch (err) {
      const axiosErr = err as { response?: { status?: number; data?: { code?: string; model?: string; purpose?: string; error?: string; models?: ModelPrompt[] } } };
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

      const errorMessage: Message = { id: generateId(), role: 'assistant', content: errorContent, modelPrompt, modelPrompts };
      setChats(prev => prev.map(c => {
        if (c.id === activeChatId) return { ...c, messages: [...c.messages, errorMessage], updatedAt: Date.now() };
        return c;
      }));
    } finally {
      setLoading(false);
    }
  }, [input, loading, activeChat, messages, activeChatId]);

  const handleRestoreChat = useCallback((id: string) => {
    setChats(prev => prev.map(c => c.id === id ? { ...c, isHidden: false } : c));
  }, []);

  const handleSuggestionClick = useCallback((text: string) => {
    setInput(text);
  }, []);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-surface">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-[40vw] h-[40vw] rounded-full opacity-[0.02]"
          style={{ background: 'radial-gradient(circle, #c9a84c 0%, transparent 70%)', filter: 'blur(120px)' }} />
        <div className="absolute bottom-0 left-0 w-[35vw] h-[35vw] rounded-full opacity-[0.015]"
          style={{ background: 'radial-gradient(circle, #e0c878 0%, transparent 70%)', filter: 'blur(100px)' }} />
      </div>

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

      <main className="flex-1 flex flex-col h-screen relative z-1">
        <header className="h-[64px] flex items-center justify-between px-6 absolute top-0 left-0 right-0 z-10 pointer-events-none">
          <div className="flex items-center gap-3 pointer-events-auto">
            {!showSidebar && (
              <button className="bg-transparent border-none text-text-muted cursor-pointer p-2 rounded-lg hover:bg-white/[0.06] hover:text-text-main transition-all flex items-center justify-center"
                onClick={() => setShowSidebar(true)} title="Mostrar panel lateral">
                <PanelLeftOpen size={20} />
              </button>
            )}
            <button className="hidden max-sm:flex bg-transparent border-none text-text-muted p-2 rounded-lg cursor-pointer hover:bg-white/[0.06] hover:text-text-main transition-all items-center justify-center"
              onClick={() => setIsMobileOpen(true)}>
              <Menu size={20} />
            </button>
            {!showSidebar && (
              <div className="font-serif text-lg font-[400] text-text-main tracking-wide">Sententia</div>
            )}
          </div>
          <div className="pointer-events-auto" />
        </header>

        {isSearchMode ? (
          <div className="flex flex-col flex-1 px-8 pt-24 pb-8 overflow-hidden max-w-[720px] mx-auto w-full">
            <div className="mb-8">
              <h2 className="font-serif text-2xl font-[400] text-text-main mb-5 tracking-[-0.02em]">Historial</h2>
              <div className="relative flex items-center glass-panel rounded-xl px-4 py-3 transition-all focus-within:border-accent/30 focus-within:bg-white/[0.06]">
                <Search size={16} className="text-text-muted mr-3 shrink-0" />
                <input type="text" placeholder="Buscar conversaciones..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent border-none text-text-main text-base outline-none font-[350] placeholder:text-text-muted" autoFocus />
                <button className="bg-transparent border-none text-text-muted cursor-pointer p-1.5 rounded-lg hover:bg-white/[0.06] hover:text-text-main transition-all"
                  onClick={() => { setIsSearchMode(false); setSearchQuery(''); }}><X size={16} /></button>
              </div>
            </div>
            <div className="flex flex-col gap-2 overflow-y-auto pr-2 scrollbar-thin">
              {chats.filter(c => !c.isHidden && c.title.toLowerCase().includes(searchQuery.toLowerCase())).map(chat => (
                <div key={chat.id} className="flex items-center gap-4 p-4 glass-panel rounded-xl cursor-pointer transition-all hover:bg-glass-hover hover:-translate-y-0.5 animate-fade-in"
                  onClick={() => handleSelectChat(chat.id)}>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-text-main font-[450] text-sm">{chat.title}</span>
                    <span className="text-text-muted text-xs font-[350]">{new Date(chat.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
              {chats.filter(c => !c.isHidden && c.title.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                <div className="text-text-muted text-center py-8 italic font-[350] text-sm">No se encontraron conversaciones.</div>
              )}
            </div>
          </div>
        ) : isHiddenMode ? (
          <div className="flex flex-col flex-1 px-8 pt-24 pb-8 overflow-hidden max-w-[720px] mx-auto w-full">
            <div className="mb-8">
              <h2 className="font-serif text-2xl font-[400] text-text-main mb-5 tracking-[-0.02em]">Chats Ocultos</h2>
              <div className="relative flex items-center glass-panel rounded-xl px-4 py-3 transition-all focus-within:border-accent/30 focus-within:bg-white/[0.06]">
                <Search size={16} className="text-text-muted mr-3 shrink-0" />
                <input type="text" placeholder="Buscar en ocultos..." value={hiddenSearchQuery} onChange={(e) => setHiddenSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent border-none text-text-main text-base outline-none font-[350] placeholder:text-text-muted" autoFocus />
                <button className="bg-transparent border-none text-text-muted cursor-pointer p-1.5 rounded-lg hover:bg-white/[0.06] hover:text-text-main transition-all"
                  onClick={() => { setIsHiddenMode(false); setHiddenSearchQuery(''); }}><X size={16} /></button>
              </div>
            </div>
            <div className="flex flex-col gap-2 overflow-y-auto pr-2 scrollbar-thin">
              {chats.filter(c => c.isHidden && c.title.toLowerCase().includes(hiddenSearchQuery.toLowerCase())).length === 0 ? (
                <div className="text-text-muted text-center py-8 italic font-[350] text-sm">{hiddenSearchQuery ? 'Sin coincidencias.' : 'No hay chats ocultos.'}</div>
              ) : (
                chats.filter(c => c.isHidden && c.title.toLowerCase().includes(hiddenSearchQuery.toLowerCase())).map(chat => (
                  <div key={chat.id} className="flex items-center gap-4 p-4 glass-panel rounded-xl">
                    <div className="flex flex-col gap-0.5 flex-1">
                      <span className="text-text-main font-[450] text-sm">{chat.title}</span>
                      <span className="text-text-muted text-xs font-[350]">{new Date(chat.updatedAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex gap-1.5 shrink-0 ml-3">
                      <button className="px-3 py-1.5 rounded-lg bg-accent/10 border border-accent/20 text-accent text-xs font-[450] cursor-pointer transition-all hover:bg-accent/15 hover:border-accent/30"
                        title="Restaurar al historial" onClick={() => handleRestoreChat(chat.id)}>Mostrar</button>
                      <button className="px-2 py-1.5 rounded-lg border border-danger/20 text-danger/80 text-xs cursor-pointer transition-all hover:bg-danger/10"
                        title="Eliminar permanentemente" onClick={(e) => handleDeleteChat(e, chat.id)}><FileText size={13} /></button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <>
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full w-full pb-[6vh] px-5">
                <div className="max-w-[800px] w-full flex flex-col items-center">
                  <div className="mb-10 text-center">
                    <h1 className="font-serif text-5xl md:text-6xl font-[400] tracking-[-0.03em] text-accent-gradient mb-3">
                      Sententia
                    </h1>
                    <p className="text-text-sub text-sm font-[350]">Asistente Legal con Inteligencia Artificial</p>
                  </div>

                  <div className="w-full mb-8">
                    <ChatInput
                      input={input}
                      loading={loading}
                      onSubmit={handleSubmit}
                      onChange={setInput}
                      placeholder="Describa su caso o consulta legal..."
                      footerText="Sententia es una IA basada en RAG y puede cometer errores."
                    />
                  </div>

                  <div className="w-full max-w-[600px]">
                    <p className="text-[0.6rem] uppercase tracking-[0.15em] text-text-muted font-[450] text-center mb-4">Consultas sugeridas</p>
                    <div className="flex flex-col gap-2">
                      {SUGGESTIONS.map((text, i) => (
                        <button key={i}
                          onClick={() => handleSuggestionClick(text)}
                          className="group text-left px-5 py-3.5 rounded-xl bg-white/[0.03] border border-glass-border text-text-sub text-sm font-[350] cursor-pointer transition-all hover:bg-white/[0.06] hover:border-accent/20 hover:text-text-main">
                          <span className="inline-block transition-transform group-hover:translate-x-0.5">{text}</span>
                        </button>
                      ))}
                    </div>
                  </div>
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
                <footer className="px-5 pb-4 bg-transparent relative z-10 flex flex-col items-center">
                  <ChatInput
                    input={input}
                    loading={loading}
                    onSubmit={handleSubmit}
                    onChange={setInput}
                    footerText="Sententia es una IA basada en RAG y puede cometer errores."
                  />
                </footer>
              </>
            )}
          </>
        )}
      </main>

      {renameModal && (
        <div className="fixed inset-0 z-[2000] flex items-center bg-black/60 backdrop-blur-md"
          style={{ paddingLeft: showSidebar ? '330px' : '0' }}
          onClick={() => setRenameModal(null)}>
          <div className="glass-panel-strong rounded-2xl p-7 w-full max-w-[440px] mx-auto shadow-2xl animate-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-serif text-lg font-[450] text-text-main mb-4">Renombrar conversación</h3>
            <input type="text"
              className="w-full bg-white/[0.03] border border-glass-border rounded-xl px-4 py-3 text-text-main text-base outline-none transition-all focus:border-accent/30 focus:bg-white/[0.05] font-[350]"
              value={renameBuffer}
              onChange={(e) => setRenameBuffer(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') confirmRename(); if (e.key === 'Escape') setRenameModal(null); }}
              autoFocus />
            <div className="flex gap-3 justify-end mt-5">
              <button className="px-5 py-2.5 rounded-xl bg-white/[0.04] border border-glass-border text-text-sub text-sm cursor-pointer transition-all hover:bg-white/[0.08] hover:text-text-main font-[350]"
                onClick={() => setRenameModal(null)}>Cancelar</button>
              <button className="px-5 py-2.5 rounded-xl bg-accent/10 border border-accent/20 text-accent text-sm font-[450] cursor-pointer transition-all hover:bg-accent/15 hover:border-accent/30"
                onClick={confirmRename}>Guardar</button>
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
        onSetHiddenMode={() => { setIsSettingsOpen(false); setIsHiddenMode(true); setIsSearchMode(false); setHiddenSearchQuery(''); }}
        onDeleteChat={handleDeleteChat}
        onRestoreChat={handleRestoreChat}
      />

      {customAlert && <CustomAlert alert={customAlert} />}
    </div>
  );
}

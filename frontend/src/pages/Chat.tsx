import { useState, useRef, useCallback, useMemo } from 'react';
import { Menu, Search, X, FileText, EyeOff } from 'lucide-react';
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
      <ChatSidebar
        chats={chats}
        activeChatId={activeChatId}
        isMobileOpen={isMobileOpen}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
        onTogglePin={handleTogglePin}
        onDeleteChat={handleDeleteChat}
        onHideChat={handleHideChat}
        onRenameChat={startRenameModal}
        onCloseMobile={() => setIsMobileOpen(false)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenSearch={() => setIsSearchMode(true)}
      />

      <main className="flex-1 flex flex-col h-screen relative">
        <header className="h-[56px] flex items-center px-4 absolute top-0 left-0 right-0 z-10">
          <button className="flex md:hidden bg-transparent border-none text-text-muted/50 p-1.5 rounded-lg cursor-pointer hover:bg-white/[0.04] hover:text-text-main transition-all items-center justify-center"
            onClick={() => setIsMobileOpen(true)}>
            <Menu size={17} />
          </button>
        </header>

        {isSearchMode ? (
          <div className="flex flex-col flex-1 px-6 pt-20 pb-6 overflow-hidden max-w-[640px] mx-auto w-full">
            <div className="mb-5">
              <h2 className="font-serif text-lg font-[400] text-text-main tracking-[-0.01em] mb-4">Historial</h2>
              <div className="relative flex items-center bg-white/[0.01] border border-white/[0.04] rounded-xl px-4 py-2.5 transition-all focus-within:border-accent/18">
                <Search size={14} className="text-text-muted/40 mr-2.5 shrink-0" />
                <input type="text" placeholder="Buscar conversaciones..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent border-none text-text-main text-sm outline-none font-[350] placeholder:text-text-muted/40" autoFocus />
                <button className="bg-transparent border-none text-text-muted/30 cursor-pointer p-1 rounded-lg hover:bg-white/[0.04] hover:text-text-main transition-all"
                  onClick={() => { setIsSearchMode(false); setSearchQuery(''); }}><X size={13} /></button>
              </div>
            </div>
            <div className="flex flex-col gap-px overflow-y-auto pr-1 scrollbar-thin">
              {chats.filter(c => !c.isHidden && c.title.toLowerCase().includes(searchQuery.toLowerCase())).map(chat => (
                <div key={chat.id} className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all hover:bg-white/[0.01]"
                  onClick={() => handleSelectChat(chat.id)}>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-text-main text-sm font-[350]">{chat.title}</span>
                    <span className="text-text-muted/40 text-[11px] font-[350]">{new Date(chat.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
              {chats.filter(c => !c.isHidden && c.title.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                <div className="text-text-muted/40 text-center py-8 text-sm font-[350]">No se encontraron conversaciones.</div>
              )}
            </div>
          </div>
        ) : isHiddenMode ? (
          <div className="flex flex-col flex-1 px-6 pt-20 pb-6 overflow-hidden max-w-[640px] mx-auto w-full">
            <div className="mb-5">
              <h2 className="flex items-center gap-2 font-serif text-lg font-[400] text-text-main tracking-[-0.01em] mb-4">
                <EyeOff size={15} className="text-text-muted/40" /> Chats Ocultos
              </h2>
              <div className="relative flex items-center bg-white/[0.01] border border-white/[0.04] rounded-xl px-4 py-2.5 transition-all focus-within:border-accent/18">
                <Search size={14} className="text-text-muted/40 mr-2.5 shrink-0" />
                <input type="text" placeholder="Buscar en ocultos..." value={hiddenSearchQuery} onChange={(e) => setHiddenSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent border-none text-text-main text-sm outline-none font-[350] placeholder:text-text-muted/40" autoFocus />
                <button className="bg-transparent border-none text-text-muted/30 cursor-pointer p-1 rounded-lg hover:bg-white/[0.04] hover:text-text-main transition-all"
                  onClick={() => { setIsHiddenMode(false); setHiddenSearchQuery(''); }}><X size={13} /></button>
              </div>
            </div>
            <div className="flex flex-col gap-px overflow-y-auto pr-1 scrollbar-thin">
              {chats.filter(c => c.isHidden && c.title.toLowerCase().includes(hiddenSearchQuery.toLowerCase())).length === 0 ? (
                <div className="text-text-muted/40 text-center py-8 text-sm font-[350]">{hiddenSearchQuery ? 'Sin coincidencias.' : 'No hay chats ocultos.'}</div>
              ) : (
                chats.filter(c => c.isHidden && c.title.toLowerCase().includes(hiddenSearchQuery.toLowerCase())).map(chat => (
                  <div key={chat.id} className="flex items-center gap-3 p-3 rounded-lg">
                    <div className="flex flex-col gap-0.5 flex-1">
                      <span className="text-text-main text-sm font-[350]">{chat.title}</span>
                      <span className="text-text-muted/40 text-[11px] font-[350]">{new Date(chat.updatedAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <button className="px-3 py-1.5 rounded-lg bg-accent/8 text-accent text-[11px] font-[450] cursor-pointer transition-all hover:bg-accent/12 border-none"
                        title="Restaurar al historial" onClick={() => handleRestoreChat(chat.id)}>Mostrar</button>
                      <button className="px-2 py-1.5 rounded-lg border border-danger/10 text-danger/40 text-[11px] cursor-pointer transition-all hover:bg-danger/5"
                        title="Eliminar permanentemente" onClick={(e) => handleDeleteChat(e, chat.id)}><FileText size={11} /></button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <>
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full w-full pb-[10vh] px-5">
                <div className="max-w-[720px] w-full flex flex-col items-center">
                  <div className="mb-10 text-center">
                    <h1 className="font-serif text-5xl md:text-6xl font-[400] tracking-[-0.04em] text-accent-gradient mb-2 leading-[1.1]">
                      Sententia
                    </h1>
                    <p className="text-text-muted/40 text-[11px] font-[350] uppercase tracking-[0.15em]">Asistente Legal con Inteligencia Artificial</p>
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

                  <div className="w-full max-w-[560px]">
                    <p className="text-[0.5rem] uppercase tracking-[0.15em] text-text-muted/40 font-[400] text-center mb-3">Consultas sugeridas</p>
                    <div className="flex flex-col gap-1.5">
                      {SUGGESTIONS.map((text, i) => (
                        <button key={i}
                          onClick={() => handleSuggestionClick(text)}
                          className="group text-left px-4 py-[11px] rounded-xl bg-white/[0.01] border border-white/[0.03] text-text-sub/70 text-sm font-[350] cursor-pointer transition-all duration-300 hover:bg-white/[0.02] hover:border-accent/12 hover:text-text-main">
                          <span className="inline-block transition-all duration-300 group-hover:translate-x-1">{text}</span>
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
                <footer className="px-4 pb-4 bg-transparent relative z-10 flex flex-col items-center">
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
        <div className="fixed inset-0 z-[2000] flex items-center bg-black/60 md:pl-[280px]"
          onClick={() => setRenameModal(null)}>
          <div className="bg-surface border border-white/[0.04] rounded-xl p-6 w-full max-w-[380px] mx-auto shadow-[0_24px_64px_rgba(0,0,0,0.6)]" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-serif text-base font-[400] text-text-main mb-3 tracking-[-0.01em]">Renombrar conversación</h3>
            <input type="text"
              className="w-full bg-white/[0.01] border border-white/[0.04] rounded-lg px-4 py-2.5 text-text-main text-sm outline-none transition-all focus:border-accent/18 font-[350]"
              value={renameBuffer}
              onChange={(e) => setRenameBuffer(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') confirmRename(); if (e.key === 'Escape') setRenameModal(null); }}
              autoFocus />
            <div className="flex gap-2.5 justify-end mt-4">
              <button className="px-4 py-2 rounded-lg text-text-muted/50 text-[12px] cursor-pointer transition-all hover:bg-white/[0.03] hover:text-text-sub bg-transparent border-none font-[350]"
                onClick={() => setRenameModal(null)}>Cancelar</button>
              <button className="px-4 py-2 rounded-lg bg-accent/8 text-accent text-[12px] font-[450] cursor-pointer transition-all hover:bg-accent/12 border-none"
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

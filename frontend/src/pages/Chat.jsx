import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { chatService } from '../services/api';
import remarkGfm from 'remark-gfm';

import { 
  SendHorizontal, Sparkles, LogOut, MessageSquareText, Bot, CircleUserRound, 
  Menu, MessageSquarePlus, Trash2, Home, 
  Copy, Check, Info, Sun, Moon, Coffee, Settings, MoreVertical, Pin, PinOff, EyeOff, Edit3, PanelLeftClose, PanelLeftOpen,
  X, UploadCloud, Database, Search, Lock, Palette, Loader2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import '../styles/chat.css';

const Chat = ({ user, onLogout }) => {
  // LÓGICA DE GESTIÓN MULTI-CHAT
  const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);
  
  const createInitialChat = () => ({
    id: generateId(),
    title: 'Nueva Consulta Legal',
    isPinned: false,
    isHidden: false,
    updatedAt: Date.now(),
    messages: []
  });

  const [chats, setChats] = useState([createInitialChat()]);
  const [activeChatId, setActiveChatId] = useState(chats[0].id);

  // ESTADOS DE UI Y ENTRADA
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [downloadStates, setDownloadStates] = useState({}); // { [modelName]: { purpose, status, progress, indeterminate } }
  const isAnyModelDownloading = Object.keys(downloadStates).length > 0;
  const [copiedId, setCopiedId] = useState(null);
  const [showSidebar, setShowSidebar] = useState(true); // En desktop inicia abierto
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [editingChatId, setEditingChatId] = useState(null);
  const [editTitleBuffer, setEditTitleBuffer] = useState('');
  const [openMenuId, setOpenMenuId] = useState(null);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isHiddenMode, setIsHiddenMode] = useState(false);
  const [hiddenSearchQuery, setHiddenSearchQuery] = useState('');
  const [renameModal, setRenameModal] = useState(null);
  const [renameBuffer, setRenameBuffer] = useState('');
  const [settingsTab, setSettingsTab] = useState('general');
  const [menuPos, setMenuPos] = useState(null);
  const [customAlert, setCustomAlert] = useState(null);
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [trainingFile, setTrainingFile] = useState(null);
  const [isTraining, setIsTraining] = useState(false);
  const [trainingStatus, setTrainingStatus] = useState(null); // { type: 'success' | 'error', message: string }

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const downloadAbortRefs = useRef({}); // { [modelName]: AbortController }

  // Referencia al chat activo actual
  const activeChat = chats.find(c => c.id === activeChatId) || chats[0];
  const messages = activeChat?.messages || [];

  // Efectos visuales y scroll
  useEffect(() => {
    document.body.setAttribute('data-theme', 'dark-liquid');
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, activeChatId]);

  useEffect(() => {
    // Solo focus en desktop para no abrir el teclado en movil inesperadamente
    if (window.innerWidth > 860) {
      inputRef.current?.focus();
    }
  }, [activeChatId]);

  // HANDLERS GESTIÓN DE CHATS
  const handleNewChat = () => {
    // Evitar spam de chats vacíos nuevos consecutivos
    if (activeChat.messages.length <= 1 && activeChat.title === 'Nueva Consulta Legal') {
      setIsSearchMode(false);
      return;
    }
      
    const newChat = createInitialChat();
    setChats(prev => [newChat, ...prev]);
    setActiveChatId(newChat.id);
    setIsSearchMode(false);
    if (window.innerWidth <= 860) setIsMobileOpen(false);
  };

  const handleSelectChat = (id) => {
    setActiveChatId(id);
    setIsSearchMode(false);
    if (window.innerWidth <= 860) setIsMobileOpen(false);
  };

  const handleTogglePin = (e, id) => {
    if (e) e.stopPropagation();
    setMenuPos(null);
    setOpenMenuId(null);
    setChats(prev => prev.map(chat => 
      chat.id === id ? { ...chat, isPinned: !chat.isPinned } : chat
    ));
  };

  const handleDeleteChat = async (e, id) => {
    if (e) e.stopPropagation();
    setMenuPos(null);
    setOpenMenuId(null);
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
      onCancel: () => setCustomAlert(null)
    });
  };

  const handleHideChat = async (e, id) => {
    if (e) e.stopPropagation();
    setMenuPos(null);
    setOpenMenuId(null);
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
      onCancel: () => setCustomAlert(null)
    });
  };

  const startRenameModal = (e, chat) => {
    if (e) e.stopPropagation();
    setMenuPos(null);
    setOpenMenuId(null);
    setRenameModal({ id: chat.id });
    setRenameBuffer(chat.title);
  };

  const confirmRename = () => {
    if (!renameBuffer.trim()) return;
    setChats(prev => prev.map(chat =>
      chat.id === renameModal.id ? { ...chat, title: renameBuffer.trim() } : chat
    ));
    setRenameModal(null);
    setRenameBuffer('');
  };

  // Kept for compatibility (called from old inline editing path)
  const startEditingTitle = (e, chat) => startRenameModal(e, chat);
  const saveEditedTitle = (e) => { if(e) e.stopPropagation(); setEditingChatId(null); };
  const handleTitleKeyDown = (e) => { if (e.key === 'Escape') setEditingChatId(null); };

  // HANDLERS DE MENSAJERIA
  const copyToClipboard = async (text, id) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Error al copiar:', err);
    }
  };

  const handleModelDownload = async (modelName, purpose) => {
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
              progress: hasProgress ? Math.max(0, Math.min(100, Math.round((completed / total) * 100))) : prev[modelName]?.progress ?? 0,
              indeterminate: !hasProgress,
            },
          }));
        },
      });

      if (finalEvent?.status !== 'success') {
        throw new Error('Ollama no confirmó la descarga del modelo.');
      }

      const successMessage = {
        id: generateId(),
        role: 'assistant',
        content: `### Modelo instalado\nEl modelo **${modelName}** ya quedó disponible.\n\nSe usa para ${purpose || 'habilitar esta parte del sistema'}.\n\nHaz tu consulta nuevamente y el RAG podrá continuar.`
      };

      setChats(prev => prev.map(c => {
        if (c.id === activeChatId) {
          return { ...c, messages: [...c.messages, successMessage], updatedAt: Date.now() };
        }
        return c;
      }));
    } catch (err) {
      if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') {
        const cancelMessage = {
          id: generateId(),
          role: 'assistant',
          content: `### Descarga cancelada\nNo se descargó **${modelName}**. Puedes volver a intentarlo cuando quieras.`
        };

        setChats(prev => prev.map(c => {
          if (c.id === activeChatId) {
            return { ...c, messages: [...c.messages, cancelMessage], updatedAt: Date.now() };
          }
          return c;
        }));
        return;
      }

      const downloadError = {
        id: generateId(),
        role: 'assistant',
        content: `### No se pudo descargar el modelo\n${err.response?.data?.error || 'Ocurrió un error al intentar descargarlo.'}`
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
      if (window.innerWidth > 860) inputRef.current?.focus();
    }
  };

  // Inicia la descarga de múltiples modelos en paralelo
  const handleMultipleModelsDownload = (models) => {
    models.forEach(({ model, purpose }) => handleModelDownload(model, purpose));
  };

  const handleCancelModelDownload = (modelName) => {
    downloadAbortRefs.current[modelName]?.abort();
  };

  const handleSkipModelDownload = (modelName) => {
    const skipMessage = {
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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsgContent = input;
    const userMessage = { id: generateId(), role: 'user', content: userMsgContent };
    
    // Generar un titulo automático basado en el primer mensaje si aún es el default
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
      // Construir historial: mensajes user/assistant previos (excluye sistema y el nuevo mensaje)
      // Se limita a 8 mensajes (4 turnos) para no saturar el contexto del modelo local
      const historyMessages = messages
        .filter(m => m.role === 'user' || m.role === 'assistant')
        .slice(-8)
        .map(m => ({ role: m.role, content: m.content }));

      const response = await chatService.sendMessage(userMsgContent, historyMessages);
      const assistantMessage = { id: generateId(), role: 'assistant', content: response.data.answer };
      
      setChats(prev => prev.map(c => {
        if (c.id === activeChatId) {
           return { ...c, messages: [...c.messages, assistantMessage], updatedAt: Date.now() };
        }
        return c;
      }));
    } catch (err) {
        const statusCode = err?.response?.status;
        const errorCode = err?.response?.data?.code;
        const modelName = err?.response?.data?.model;
        const purpose = err?.response?.data?.purpose;
        const missingModels = err?.response?.data?.models; // array para ollama_models_missing

        let errorContent;
        let modelPrompt = null;
        let modelPrompts = null;

        if (errorCode === 'ollama_models_missing' && missingModels?.length > 0) {
          const modelList = missingModels.map(m => `- **${m.model}**: ${m.purpose}`).join('\n');
          errorContent = `### Faltan modelos locales\nLos siguientes modelos no están instalados en Ollama:\n\n${modelList}\n\n¿Quieres que los descargue ahora?`;
          modelPrompts = missingModels;
        } else if (errorCode === 'ollama_model_missing') {
          errorContent = `### Falta un modelo local\nEl modelo **${modelName}** no está instalado.\n\nSe usa para ${purpose}.\n\n¿Quieres que lo descargue ahora?`;
          modelPrompt = { model: modelName, purpose };
        } else if (statusCode === 401 || statusCode === 403) {
          errorContent = '### Sesión no autorizada\nNo se pudo validar tu sesión. Vuelve a iniciar sesión o activa el modo demo desde el inicio.';
        } else {
          errorContent = `### Falla Sistémica\n${err?.response?.data?.error || 'No fue posible contactar con los servidores de Sententia. Reintente en unos momentos, recuerde encender Ollama.'}`;
        }

      const errorMessage = { 
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
      // Auto-focus después de respuesta
      if (window.innerWidth > 860) inputRef.current?.focus();
    }
  };

  const handleTrainFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setTrainingFile(file);
      setTrainingStatus(null);
    }
  };

  const handleTrainSubmit = async () => {
    if (!trainingFile) return;

    setIsTraining(true);
    setTrainingStatus(null);

    try {
      const response = await chatService.train(trainingFile);
      setTrainingStatus({ type: 'success', message: response.data.message });
      setTrainingFile(null);
    } catch (err) {
      setTrainingStatus({ 
        type: 'error', 
        message: err.response?.data?.error || 'Error al procesar el documento legal.' 
      });
    } finally {
      setIsTraining(false);
    }
  };

  // Filtrado de variables para render
  const visibleChats = chats.filter(c => !c.isHidden);
  const pinnedChats = visibleChats.filter(c => c.isPinned).sort((a,b) => b.updatedAt - a.updatedAt);
  const recentChats = visibleChats.filter(c => !c.isPinned).sort((a,b) => b.updatedAt - a.updatedAt);

  // Render helper for chat items
  const renderChatItem = (chat, isPinned) => (
    <div
      key={chat.id}
      className={`history-item ${activeChatId === chat.id ? 'active' : ''}`}
      onClick={() => handleSelectChat(chat.id)}
    >
      <span className="item-title">{chat.title}</span>
      <div className={`item-actions ${openMenuId === chat.id ? 'open' : ''}`}>
        <button
          className="action-btn"
          title="Opciones"
          onClick={(e) => {
            e.stopPropagation();
            if (openMenuId === chat.id) {
              setOpenMenuId(null);
              setMenuPos(null);
            } else {
              const rect = e.currentTarget.getBoundingClientRect();
              setMenuPos({ top: rect.top, left: rect.right + 15, isPinned });
              setOpenMenuId(chat.id);
            }
          }}
        >
          <MoreVertical size={16}/>
        </button>
      </div>
    </div>
  );


  return (
    <div className={`chat-container dark-bg ${showSidebar ? 'sidebar-expanded' : 'sidebar-collapsed'}`}>

      {/* ===== DROPDOWN MENU (fuera del sidebar para escapar su overflow) ===== */}
      {openMenuId && menuPos && (
        <>
          {/* Overlay invisible para cerrar al hacer clic fuera */}
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 8000,
              background: 'transparent',
            }}
            onClick={() => { setOpenMenuId(null); setMenuPos(null); }}
          />
          {/* Menú en sí */}
          <div
            className="chat-dropdown-menu"
            style={{
              position: 'fixed',
              top: menuPos.top,
              left: menuPos.left,
              zIndex: 8001,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={(e) => handleTogglePin(e, openMenuId)}>
              <Pin size={14}/> {menuPos.isPinned ? 'Desfijar' : 'Fijar'}
            </button>
            <button onClick={(e) => {
              const chat = chats.find(c => c.id === openMenuId);
              if (chat) startRenameModal(e, chat);
            }}>
              <Edit3 size={14}/> Renombrar
            </button>
            <button onClick={(e) => handleHideChat(e, openMenuId)}>
              <EyeOff size={14}/> Ocultar
            </button>
            <button className="danger" onClick={(e) => handleDeleteChat(e, openMenuId)}>
              <Trash2 size={14}/> Eliminar
            </button>
          </div>
        </>
      )}

      {/* Mobile Overlay Background */}
      <div 
        className={`mobile-overlay ${isMobileOpen ? 'active' : ''}`}
        onClick={() => setIsMobileOpen(false)}
        aria-hidden="true"
      />

      {/* --- SIDEBAR LATERAL GLASS --- */}
      <aside className={`chat-sidebar ${isMobileOpen ? 'mobile-open' : ''}`} aria-label="Panel Historial">
        <div className="sidebar-content">
          
          <div className="sidebar-header-brand-container">
            <button className="desktop-toggle-sidebar search-toggle" onClick={() => setIsSearchMode(true)} title="Buscar conversaciones">
               <Search size={20}/>
            </button>
            <Link to="/" className="sidebar-header-brand" onClick={() => setIsSearchMode(false)}>
              <Sparkles size={20} color="white" strokeWidth={2.5}/>
              <h1 className="brand-title">Sententia</h1>
            </Link>
            <button className="desktop-toggle-sidebar inner-toggle" onClick={() => setShowSidebar(false)} title="Ocultar panel lateral">
               <PanelLeftClose size={22}/>
            </button>
          </div>
          
          <div className="sidebar-actions-group">
            <button onClick={handleNewChat} className="sidebar-action-btn">
              <MessageSquarePlus size={18} />
              <span>Nueva conversación</span>
            </button>
            <button onClick={() => setIsSettingsOpen(true)} className="sidebar-action-btn secondary">
              <Database size={18} />
              <span>Fuentes (RAG)</span>
            </button>
          </div>

          <div className="history-section chat-scroll">

            {pinnedChats.length > 0 && (
              <div className="history-group">
                <div className="history-title">
                  <Pin size={12} /> Fijados
                </div>
                {pinnedChats.map(chat => renderChatItem(chat, true))}
              </div>
            )}

            {recentChats.length > 0 && (
              <div className="history-group">
                <div className="history-title">
                  Historial
                </div>
                {recentChats.map(chat => renderChatItem(chat, false))}
              </div>
            )}
            
          </div>

          <div className="sidebar-footer">
            <div className="user-profile-glass">
              <div className="avatar-liquid">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div className="user-info-text">
                <p className="user-name">{user.username}</p>
                <p className="user-role">{user.isDemo ? 'Sesión Demo' : 'Socio Activo'}</p>
              </div>
              <button 
                className="action-btn settings-btn" 
                title="Configuración"
                onClick={() => setIsSettingsOpen(true)}
              >
                 <Settings size={18} />
              </button>
            </div>
            
            <button className="logout-btn-glass" onClick={onLogout}>
              <LogOut size={16} /> Finalizar Sesión
            </button>
          </div>

        </div>
      </aside>

      {/* --- ÁREA PRINCIPAL --- */}
      <main className="chat-main">
        
        {/* Header Superior Flotante Transparente */}
        <header className="glass-header">
          <div className="header-left">
            {!showSidebar && (
              <button className="desktop-toggle-sidebar" onClick={() => setShowSidebar(true)} title="Mostrar panel lateral">
                 <PanelLeftOpen size={22}/>
              </button>
            )}
            <button className="mobile-menu-btn" onClick={() => setIsMobileOpen(true)}>
              <Menu size={20} />
            </button>
            {!showSidebar && (
              <div className="hidden-sidebar-branding">
                 <span>Sententia</span>
              </div>
            )}
          </div>
          
          <div className="header-actions">
          </div>
        </header>


        {isSearchMode ? (
          <div className="search-view-container">
            <div className="search-view-header">
              <h2>Historial</h2>
              <div className="search-bar-wrapper">
                <Search size={18} className="search-bar-icon" />
                <input 
                  type="text" 
                  placeholder="Buscar conversaciones..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="history-search-input"
                  autoFocus
                />
              </div>
              <button className="action-btn" title="Cerrar" onClick={() => { setIsSearchMode(false); setSearchQuery(''); }}>
                <X size={20}/>
              </button>
            </div>
            <div className="search-results-list chat-scroll">
               {chats.filter(c => !c.isHidden && c.title.toLowerCase().includes(searchQuery.toLowerCase())).map(chat => (
                  <div 
                    key={chat.id} 
                    className="search-result-item"
                    onClick={() => handleSelectChat(chat.id)}
                  >
                    <div className="result-info">
                      <span className="result-title">{chat.title}</span>
                      <span className="result-date">{new Date(chat.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
               ))}
               {chats.filter(c => !c.isHidden && c.title.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                 <div className="search-no-results">
                   No se encontraron conversaciones.
                 </div>
               )}
            </div>
          </div>

        ) : isHiddenMode ? (
          /* ===== VISTA OCULTOS — idéntica a Buscar ===== */
          <div className="search-view-container">
            <div className="search-view-header">
              <h2>Ocultos</h2>
              <div className="search-bar-wrapper">
                <Search size={18} className="search-bar-icon" />
                <input
                  type="text"
                  placeholder="Buscar en ocultos..."
                  value={hiddenSearchQuery}
                  onChange={(e) => setHiddenSearchQuery(e.target.value)}
                  className="history-search-input"
                  autoFocus
                />
              </div>
              <button className="action-btn" title="Cerrar" onClick={() => { setIsHiddenMode(false); setHiddenSearchQuery(''); }}>
                <X size={20}/>
              </button>
            </div>
            <div className="search-results-list chat-scroll">
              {chats.filter(c => c.isHidden && c.title.toLowerCase().includes(hiddenSearchQuery.toLowerCase())).length === 0 ? (
                <div className="search-no-results">
                  {hiddenSearchQuery ? 'Sin coincidencias.' : 'No hay chats ocultos.'}
                </div>
              ) : (
                chats
                  .filter(c => c.isHidden && c.title.toLowerCase().includes(hiddenSearchQuery.toLowerCase()))
                  .map(chat => (
                    <div key={chat.id} className="search-result-item">
                      <div className="result-info">
                        <span className="result-title">{chat.title}</span>
                        <span className="result-date">{new Date(chat.updatedAt).toLocaleDateString()}</span>
                      </div>
                      <div style={{ display:'flex', gap:'0.4rem', flexShrink:0, marginLeft:'0.75rem' }}>
                        <button
                          className="btn-confirm"
                          style={{ fontSize:'0.78rem', padding:'0.25rem 0.7rem' }}
                          title="Restaurar al historial"
                          onClick={() => setChats(prev =>
                            prev.map(c => c.id === chat.id ? {...c, isHidden: false} : c)
                          )}
                        >
                          Mostrar
                        </button>
                        <button
                          className="btn-cancel danger"
                          style={{ fontSize:'0.78rem', padding:'0.25rem 0.55rem' }}
                          title="Eliminar permanentemente"
                          onClick={(e) => handleDeleteChat(e, chat.id)}
                        >
                          <Trash2 size={13}/>
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
              <div className="empty-chat-container">
                <h1 className="empty-chat-logo">Sententia</h1>
                <div className="empty-chat-input-wrapper">
                  <form className="input-pill-container" onSubmit={handleSubmit}>
                    <textarea
                      ref={inputRef}
                      className="chat-input-transparent"
                      rows={1}
                      placeholder="Describa su situación aquí..."
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSubmit(e);
                        }
                      }}
                      disabled={loading}
                    />
                    <button 
                      type="submit" 
                      className={`send-btn-liquid ${input.trim() ? 'can-send' : ''}`}
                      disabled={!input.trim() || loading}
                    >
                      <SendHorizontal size={18} strokeWidth={2.5} />
                    </button>
                  </form>
                  <p className="empty-chat-footer-text">Sententia es una AI basada en RAG y puede cometer errores.</p>
                </div>
              </div>
            ) : (
              <>
                {/* Zona Scroll de Mensajes */}
                <div className="messages-area messages-scroll">
                  <div className="messages-container">
                {messages.map((msg) => (
                  <div key={msg.id} className={`message-wrapper ${msg.role}`}>
                    {/* Avatar removido a petición del usuario */}
                    
                    <div className={`glass-bubble ${msg.role}-bubble md-pro`}>
                      {msg.role === 'assistant' && (
                        <button 
                          className={`copy-pill ${copiedId === msg.id ? 'success' : ''}`}
                          onClick={() => copyToClipboard(msg.content, msg.id)}
                          title="Copiar texto"
                        >
                          {copiedId === msg.id ? <Check size={14}/> : <Copy size={14}/>}
                        </button>
                      )}
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.content}
                      </ReactMarkdown>
                      {msg.modelPrompt && (
                        <div className="model-prompt-actions">
                          <button
                            type="button"
                            className="model-action-btn primary"
                            onClick={() => handleModelDownload(msg.modelPrompt.model, msg.modelPrompt.purpose)}
                            disabled={loading || isAnyModelDownloading}
                          >
                            Sí, descargar modelo
                          </button>
                          <button
                            type="button"
                            className="model-action-btn secondary"
                            onClick={() => handleSkipModelDownload(msg.modelPrompt.model)}
                            disabled={loading || isAnyModelDownloading}
                          >
                            No ahora
                          </button>
                        </div>
                      )}
                      {msg.modelPrompts && (
                        <div className="model-prompt-actions">
                          <button
                            type="button"
                            className="model-action-btn primary"
                            onClick={() => handleMultipleModelsDownload(msg.modelPrompts)}
                            disabled={loading || isAnyModelDownloading}
                          >
                            Sí, descargar {msg.modelPrompts.length} modelos
                          </button>
                          <button
                            type="button"
                            className="model-action-btn secondary"
                            onClick={() => handleSkipModelDownload(msg.modelPrompts.map(m => m.model).join(' y '))}
                            disabled={loading || isAnyModelDownloading}
                          >
                            No ahora
                          </button>
                          {/* Sección discreta: descarga individual */}
                          <div className="model-prompt-individual">
                            <span className="model-prompt-individual-label">O solo uno:</span>
                            {msg.modelPrompts.map(m => (
                              <button
                                key={m.model}
                                type="button"
                                className="model-individual-btn"
                                onClick={() => handleModelDownload(m.model, m.purpose)}
                                disabled={loading || !!downloadStates[m.model]}
                                title={m.purpose}
                              >
                                {m.model}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>


                  </div>
                ))}

                {loading && (
                  <div className="message-wrapper assistant">
                    {/* Avatar removido a petición del usuario */}
                    <div className="subtle-loader-container">
                      <Loader2 className="loader-icon" size={16} />
                      <span>Procesando...</span>
                    </div>
                  </div>
                )}

                {Object.entries(downloadStates).map(([modelName, state]) => (
                  <div key={modelName} className="download-banner">
                    <div className="download-banner-header">
                      <div>
                        <p className="download-banner-title">Descargando modelo</p>
                        <p className="download-banner-subtitle">
                          {modelName} · {state.purpose}
                        </p>
                        <p className="download-banner-status">{state.status}</p>
                      </div>
                      <button
                        type="button"
                        className="download-cancel-btn"
                        onClick={() => handleCancelModelDownload(modelName)}
                      >
                        Cancelar
                      </button>
                    </div>
                    <div className="download-progress-track" aria-hidden="true">
                      <div
                        className={`download-progress-bar ${state.indeterminate ? 'indeterminate' : 'determinate'}`}
                        style={state.indeterminate ? undefined : { width: `${state.progress}%` }}
                      />
                    </div>
                    {!state.indeterminate && (
                      <div className="download-progress-label">{state.progress}%</div>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} style={{ height: '10px' }}></div>
              </div>
            </div>

            {/* --- CAJA DE INPUT INFERIOR FLOTANTE --- */}
            <footer className="input-area-glass">
              <form className="input-pill-container" onSubmit={handleSubmit}>
                <textarea
                  ref={inputRef}
                  className="chat-input-transparent"
                  rows={1}
                  placeholder="Describa su situación aquí..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                  disabled={loading}
                />
                <button 
                  type="submit" 
                  className={`send-btn-liquid ${input.trim() ? 'can-send' : ''}`}
                  disabled={!input.trim() || loading}
                >
                  <SendHorizontal size={18} strokeWidth={2.5} />
                </button>
              </form>
              <p className="input-footer-text">Sententia es una AI basada en RAG y puede cometer errores.</p>
            </footer>
            </>
            )}
          </>
        )}

      </main>

      {/* --- MODAL DE RENOMBRAR CHAT --- */}
      {renameModal && (
        <div className="rename-overlay" onClick={() => setRenameModal(null)}>
          <div className="rename-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Renombrar conversación</h3>
            <input
              type="text"
              className="rename-input"
              value={renameBuffer}
              onChange={(e) => setRenameBuffer(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') confirmRename();
                if (e.key === 'Escape') setRenameModal(null);
              }}
              autoFocus
            />
            <div className="rename-actions">
              <button className="btn-cancel" onClick={() => setRenameModal(null)}>Cancelar</button>
              <button className="btn-confirm" onClick={confirmRename}>Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL DE CONFIGURACIÓN --- */}
      {isSettingsOpen && (
        <div className="settings-overlay" onClick={() => !isTraining && setIsSettingsOpen(false)}>
          <div className="settings-modal settings-modal-split" onClick={(e) => e.stopPropagation()}>
            {/* Barra lateral de ícono-tabs */}
            <nav className="settings-nav">
              <div className="settings-nav-header">
                <h3>Configuración</h3>
                <button
                  className="settings-nav-close"
                  onClick={() => setIsSettingsOpen(false)}
                  title="Cerrar"
                >
                  <X size={18}/>
                </button>
              </div>
              
              <button
                className={`settings-nav-item ${settingsTab === 'general' ? 'active' : ''}`}
                onClick={() => setSettingsTab('general')}
              >
                <Settings size={18}/>
                <span>General</span>
              </button>
              <button
                className={`settings-nav-item ${settingsTab === 'train' ? 'active' : ''}`}
                onClick={() => setSettingsTab('train')}
              >
                <Database size={18}/>
                <span>Entrenar</span>
              </button>
              <button
                className={`settings-nav-item ${settingsTab === 'customization' ? 'active' : ''}`}
                onClick={() => setSettingsTab('customization')}
              >
                <Palette size={18}/>
                <span>Personalización</span>
              </button>
              <button
                className={`settings-nav-item ${settingsTab === 'hidden' ? 'active' : ''}`}
                onClick={() => setSettingsTab('hidden')}
              >
                <EyeOff size={18}/>
                <span>Ocultos</span>
              </button>
            </nav>

            {/* Contenido de la tab activa */}
            <div className="settings-tab-content">
              {settingsTab === 'general' && (
                <div className="train-section">
                  <h3>General</h3>
                  <p className="train-info">
                    Ajustes generales de la aplicación. (En construcción)
                  </p>
                </div>
              )}

              {settingsTab === 'train' && (
                <div className="train-section">
                  <h3>Entrenar Sententia</h3>
                <p className="train-info">
                  Sube documentos legales para alimentar la base de conocimiento del asistente. 
                  Sententia soportará más formatos de archivo en el futuro. Por ahora, soporta archivos <strong>PDF, TXT y MD</strong>.
                  La IA se ve más beneficiada por los archivos MD debido a que separan mejor los párrafos en base a los saltos de línea.
                </p>
                
                <div className={`file-upload-area ${trainingFile ? 'has-file' : ''}`}>
                  <input 
                    type="file" 
                    className="hidden-file-input" 
                    accept=".pdf,.txt,.md"
                    onChange={handleTrainFileChange}
                    disabled={isTraining}
                  />
                  <UploadCloud size={40} strokeWidth={1.5} color={trainingFile ? 'var(--accent-color)' : 'var(--text-muted)'} />
                  {trainingFile ? (
                    <span className="file-name">{trainingFile.name}</span>
                  ) : (
                    <div className="upload-placeholder">
                      <p>Haga clic para seleccionar archivo</p>
                      <small>PDF, TXT o MD</small>
                    </div>
                  )}
                </div>

                <button 
                  className="btn-train-action"
                  onClick={handleTrainSubmit}
                  disabled={!trainingFile || isTraining}
                >
                  {isTraining ? (
                    <div className="typing-indicator" style={{ padding: 0 }}>
                      <span className="typing-dot" style={{ backgroundColor: 'var(--liquid-bg-1)' }}></span>
                      <span className="typing-dot" style={{ backgroundColor: 'var(--liquid-bg-1)' }}></span>
                      <span className="typing-dot" style={{ backgroundColor: 'var(--liquid-bg-1)' }}></span>
                    </div>
                  ) : (
                    <>Procesar Documento Legales</>
                  )}
                </button>

                {trainingStatus && (
                  <div className={`train-status ${trainingStatus.type}`}>
                    {trainingStatus.message}
                  </div>
                )}

                </div>
              )}

              {settingsTab === 'customization' && (
                <div className="train-section">
                  <h3>Personalización</h3>
                  <p className="train-info">
                    Ajustes de apariencia y personalización del asistente. (En construcción)
                  </p>
                </div>
              )}

              {settingsTab === 'hidden' && (
                <div className="hidden-chats-section">
                  <h3><EyeOff size={16}/> Chats Ocultos</h3>
                  <p className="train-info">
                    Los chats ocultos no aparecen en el historial ni en la búsqueda.
                  </p>
                  <button
                    className="btn-train-action"
                    onClick={() => {
                      setIsSettingsOpen(false);
                      setIsHiddenMode(true);
                      setIsSearchMode(false);
                      setHiddenSearchQuery('');
                    }}
                  >
                    <EyeOff size={15}/> Ver chats ocultos
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Custom Alert Modal */}
      {customAlert && (
        <div className="custom-alert-overlay" onClick={customAlert.onCancel}>
          <div className="custom-alert-modal" onClick={e => e.stopPropagation()}>
            <h3 className="custom-alert-title">{customAlert.title}</h3>
            <p className="custom-alert-text">{customAlert.text}</p>
            <div className="custom-alert-actions">
              <button className="custom-alert-btn cancel" onClick={customAlert.onCancel}>
                {customAlert.cancelText || 'Cancelar'}
              </button>
              <button 
                className={`custom-alert-btn confirm ${customAlert.isDanger ? 'danger' : ''}`}
                onClick={customAlert.onConfirm}
              >
                {customAlert.confirmText || 'Aceptar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;
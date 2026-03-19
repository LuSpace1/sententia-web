import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { chatService } from '../services/api';
import remarkGfm from 'remark-gfm';
import { 
  SendHorizontal, Sparkles, LogOut, MessageSquareText, Bot, CircleUserRound, 
  Menu, MessageSquarePlus, Trash2, Home, 
  Copy, Check, Info, Sun, Moon, Coffee, Settings, MoreVertical, Pin, PinOff, EyeOff, Edit3, PanelLeftClose, PanelLeftOpen,
  X, UploadCloud
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
    messages: [
      { 
        id: 'welcome-' + generateId(),
        role: 'system',
        content: `### Sententia AI
¿En qué te puedo ayudar hoy?`
      }
    ]
  });

  const [chats, setChats] = useState([createInitialChat()]);
  const [activeChatId, setActiveChatId] = useState(chats[0].id);

  // ESTADOS DE UI Y ENTRADA
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [showSidebar, setShowSidebar] = useState(true); // En desktop inicia abierto
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [editingChatId, setEditingChatId] = useState(null);
  const [editTitleBuffer, setEditTitleBuffer] = useState('');
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [trainingFile, setTrainingFile] = useState(null);
  const [isTraining, setIsTraining] = useState(false);
  const [trainingStatus, setTrainingStatus] = useState(null); // { type: 'success' | 'error', message: string }

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

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
    if (activeChat.messages.length <= 1 && activeChat.title === 'Nueva Consulta Legal') return;
      
    const newChat = createInitialChat();
    setChats(prev => [newChat, ...prev]);
    setActiveChatId(newChat.id);
    if (window.innerWidth <= 860) setIsMobileOpen(false);
  };

  const handleSelectChat = (id) => {
    setActiveChatId(id);
    if (window.innerWidth <= 860) setIsMobileOpen(false);
  };

  const handleTogglePin = (e, id) => {
    e.stopPropagation();
    setChats(prev => prev.map(chat => 
      chat.id === id ? { ...chat, isPinned: !chat.isPinned } : chat
    ));
  };

  const handleHideChat = (e, id) => {
    e.stopPropagation();
    if (window.confirm('¿Deseas archivar/ocultar esta conversación? Podrás recuperarla más adelante en "Ajustes".')) {
       setChats(prev => prev.map(chat => 
         chat.id === id ? { ...chat, isHidden: true } : chat
       ));
       if (activeChatId === id) {
          // Cambiar al primer chat no oculto disponible
          const availableChats = chats.filter(c => c.id !== id && !c.isHidden);
          if (availableChats.length > 0) setActiveChatId(availableChats[0].id);
          else handleNewChat();
       }
    }
  };

  const handleDeleteChat = (e, id) => {
    e.stopPropagation();
    if (window.confirm('¿Estás seguro de eliminar permanentemente este expediente legal?')) {
      const newChats = chats.filter(c => c.id !== id);
      if (newChats.length === 0) {
        const initial = createInitialChat();
        setChats([initial]);
        setActiveChatId(initial.id);
      } else {
        setChats(newChats);
        if (activeChatId === id) setActiveChatId(newChats[0].id);
      }
    }
  };

  const startEditingTitle = (e, chat) => {
    e.stopPropagation();
    setEditingChatId(chat.id);
    setEditTitleBuffer(chat.title);
  };

  const saveEditedTitle = (e) => {
    if(e) e.stopPropagation();
    if (!editTitleBuffer.trim()) {
      setEditingChatId(null);
      return;
    }
    setChats(prev => prev.map(chat => 
      chat.id === editingChatId ? { ...chat, title: editTitleBuffer.trim() } : chat
    ));
    setEditingChatId(null);
  };

  const handleTitleKeyDown = (e) => {
    if (e.key === 'Enter') saveEditedTitle();
    if (e.key === 'Escape') setEditingChatId(null);
  };

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
      const response = await chatService.sendMessage(userMsgContent);
      const assistantMessage = { id: generateId(), role: 'assistant', content: response.data.answer };
      
      setChats(prev => prev.map(c => {
        if (c.id === activeChatId) {
           return { ...c, messages: [...c.messages, assistantMessage], updatedAt: Date.now() };
        }
        return c;
      }));
    } catch (err) {
      const errorMessage = { 
        id: generateId(),
        role: 'assistant', 
        content: '### ⚠️ Falla Sistémica\nNo fue posible contactar con los servidores de inferencia profunda. Reintente en unos momentos.' 
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

  // Filstrado de variables para render
  const visibleChats = chats.filter(c => !c.isHidden);
  const pinnedChats = visibleChats.filter(c => c.isPinned).sort((a,b) => b.updatedAt - a.updatedAt);
  const recentChats = visibleChats.filter(c => !c.isPinned).sort((a,b) => b.updatedAt - a.updatedAt);

  return (
    <div className={`chat-container dark-bg ${showSidebar ? 'sidebar-expanded' : 'sidebar-collapsed'}`}>
      
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
            <Link to="/" className="sidebar-header-brand">
              <div className="brand">
                <Sparkles size={20} color="white" strokeWidth={2.5}/>
                <h2 className="brand-subtitle">RAG Engine</h2>
              </div>
              <h1 className="brand-title">SENTENTIA</h1>
            </Link>
          </div>
          
          <button onClick={handleNewChat} className="btn-new-chat">
            <span>Nuevo Chat</span>
            <MessageSquarePlus size={18} />
          </button>

          <div className="history-section chat-scroll">
            
            {pinnedChats.length > 0 && (
              <div className="history-group">
                <div className="history-title">
                  <Pin size={12} /> Fijados
                </div>
                {pinnedChats.map(chat => (
                  <div 
                    key={chat.id} 
                    className={`history-item ${activeChatId === chat.id ? 'active' : ''}`}
                    onClick={() => handleSelectChat(chat.id)}
                  >
                    <div className="item-content">
                      <MessageSquareText size={16} className="chat-icon"/>
                      {editingChatId === chat.id ? (
                        <input
                          type="text"
                          className="edit-title-input"
                          value={editTitleBuffer}
                          onChange={(e) => setEditTitleBuffer(e.target.value)}
                          onBlur={saveEditedTitle}
                          onKeyDown={handleTitleKeyDown}
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                         <span className="item-title">{chat.title}</span>
                      )}
                    </div>
                    
                    {editingChatId !== chat.id && (
                      <div className="item-actions">
                        <button className="action-btn" onClick={(e) => startEditingTitle(e, chat)} title="Renombrar"><Edit3 size={14}/></button>
                        <button className="action-btn pin active" onClick={(e) => handleTogglePin(e, chat.id)} title="Desfijar"><Pin size={14}/></button>
                        <button className="action-btn danger" onClick={(e) => handleDeleteChat(e, chat.id)} title="Eliminar Permanente"><Trash2 size={14}/></button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {recentChats.length > 0 && (
              <div className="history-group">
                <div className="history-title">
                  Historial
                </div>
                {recentChats.map(chat => (
                  <div 
                    key={chat.id} 
                    className={`history-item ${activeChatId === chat.id ? 'active' : ''}`}
                    onClick={() => handleSelectChat(chat.id)}
                  >
                    <div className="item-content">
                      <MessageSquareText size={16} className="chat-icon" />
                      {editingChatId === chat.id ? (
                        <input
                          type="text"
                          className="edit-title-input"
                          value={editTitleBuffer}
                          onChange={(e) => setEditTitleBuffer(e.target.value)}
                          onBlur={saveEditedTitle}
                          onKeyDown={handleTitleKeyDown}
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                         <span className="item-title">{chat.title}</span>
                      )}
                    </div>

                    {editingChatId !== chat.id && (
                      <div className="item-actions">
                        <button className="action-btn" onClick={(e) => startEditingTitle(e, chat)} title="Renombrar"><Edit3 size={14}/></button>
                        <button className="action-btn pin" onClick={(e) => handleTogglePin(e, chat.id)} title="Fijar"><Pin size={14}/></button>
                        <button className="action-btn danger" onClick={(e) => handleDeleteChat(e, chat.id)} title="Eliminar Permanente"><Trash2 size={14}/></button>
                      </div>
                    )}
                  </div>
                ))}
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
            <button className="desktop-toggle-sidebar" onClick={() => setShowSidebar(!showSidebar)} title={showSidebar ? "Ocultar panel lateral" : "Mostrar panel lateral"}>
               {showSidebar ? <PanelLeftClose size={22}/> : <PanelLeftOpen size={22}/>}
            </button>
            <button className="mobile-menu-btn" onClick={() => setIsMobileOpen(true)}>
              <Menu size={20} />
            </button>
            {/* Si el sidebar está cerrado en desktop, podemos mostrar un titulo u logo aquí opcional */}
            {!showSidebar && (
              <div className="hidden-sidebar-branding">
                 <span>Nuevo Chat</span>
              </div>
            )}
          </div>
          
          <div className="header-actions">
            {/* Botón movido al sidebar, espacio reservado por si hace falta algo aquí como exportar chat */}
          </div>
        </header>

        {/* Zona Scroll de Mensajes */}
        <div className="messages-area messages-scroll">
          <div className="messages-container">
            {messages.map((msg) => (
              <div key={msg.id} className={`message-wrapper ${msg.role}`}>
                {msg.role === 'assistant' && (
                  <div className="msg-avatar-container">
                     <div className="msg-avatar ai-icon"><Sparkles size={20} /></div>
                  </div>
                )}
                
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
                </div>


              </div>
            ))}

            {loading && (
              <div className="message-wrapper assistant">
                <div className="msg-avatar-container">
                   <div className="msg-avatar ai-icon"><Sparkles size={20} /></div>
                </div>
                <div className="glass-bubble ai-bubble">
                  <div className="typing-indicator">
                    <span className="typing-dot"></span>
                    <span className="typing-dot"></span>
                    <span className="typing-dot"></span>
                  </div>
                </div>
              </div>
            )}
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

      </main>

      {/* --- MODAL DE CONFIGURACIÓN / ENTRENAMIENTO --- */}
      {isSettingsOpen && (
        <div className="settings-overlay" onClick={() => !isTraining && setIsSettingsOpen(false)}>
          <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
            <div className="settings-header">
              <h2><Settings size={20} /> Configuración del Sistema</h2>
              <button 
                className="close-btn" 
                onClick={() => setIsSettingsOpen(false)}
                disabled={isTraining}
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="settings-content">
              <div className="train-section">
                <h3>⚖️ Entrenar Sententia</h3>
                <p className="train-info">
                  Sube documentos legales para alimentar la base de conocimiento del asistente. 
                  Soportamos archivos <strong>PDF, TXT y MD</strong>.
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;
import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { chatService } from '../services/api';
import remarkGfm from 'remark-gfm';
import { 
  Send, Scale, LogOut, MessageSquare, Bot, User, 
  ChevronRight, Menu, PlusCircle, Trash2, Home, 
  Copy, Check, Info, Sun, Moon, Coffee
} from 'lucide-react';
import { Link } from 'react-router-dom';
import '../index.css';

const Chat = ({ user, onLogout }) => {
  // Estados
  const [messages, setMessages] = useState([
    { 
      id: 'welcome',
      role: 'assistant', 
      content: `### ⚖️ Asesoría Legal Chile Pro
      
Hola **${user.username}**, bienvenido a tu despacho legal digital. 

Tengo acceso a la **Constitución Política** y al **Código del Trabajo** (Texto Refundido 2026). ¿Cuál es tu consulta el día de hoy?` 
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Efectos
  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Handlers
  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const handleNewChat = () => {
    if (messages.length > 1) {
      if (window.confirm('¿Deseas iniciar una nueva consulta legal y borrar el historial actual?')) {
        setMessages([{ 
          id: Date.now().toString(),
          role: 'assistant', 
          content: `Nuevo expediente iniciado. ¿Qué duda legal deseas resolver ahora, **${user.username}**?` 
        }]);
        inputRef.current?.focus();
      }
    }
  };

  const showInfo = () => {
    alert("AbogadoCL v2.0 - Edición Ejecutiva\n\nBase Legal: Biblioteca del Congreso Nacional (BCN).\nModelos: DeepSeek-R1 + mxbai-embed-large.\nPrivacidad: 100% Local.");
  };

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

    const userMessage = { 
      id: Date.now().toString(), 
      role: 'user', 
      content: input 
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await chatService.sendMessage(input);

      const assistantMessage = { 
        id: (Date.now() + 1).toString(),
        role: 'assistant', 
        content: response.data.answer 
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      const errorMessage = { 
        id: 'error-' + Date.now(),
        role: 'assistant', 
        content: '### ⚠️ Error de Conexión\nEl despacho se encuentra temporalmente fuera de línea. Por favor, verifica tu conexión local e intenta nuevamente.' 
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex vh-100 mesh-gradient transition-300">
      {/* Sidebar Móvil Overlay */}
      {showSidebar && (
        <div 
          className="position-fixed top-0 start-0 w-100 h-100 bg-black bg-opacity-50 z-index-20 d-md-none" 
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* Sidebar Ejecutiva */}
      <aside className={`sidebar-lawyer ${showSidebar ? 'show' : ''}`}>
        <div className="d-flex flex-column h-100 p-4">
          <Link to="/" className="btn-sidebar mb-4">
            <Home size={18} className="me-3" /> Inicio de Plataforma
          </Link>
          
          <button onClick={handleNewChat} className="btn-main-action w-100 mb-4 shadow-sm">
            <span>Nuevo Expediente</span>
            <PlusCircle size={18} />
          </button>

          <section className="flex-grow-1 overflow-auto pe-2 scrollbar-minimal">
            <div className="d-flex align-items-center justify-content-between mb-4 opacity-50 px-2">
              <span className="x-small fw-bold ls-2">ACTUACIONES</span>
              <Trash2 size={16} className="cursor-pointer hover-accent" onClick={handleNewChat} />
            </div>
            <div className="history-item-lawyer active">
              <MessageSquare size={16} className="me-3" />
              <span className="text-truncate">Consulta Legal Activa</span>
            </div>
          </section>

          <footer className="mt-auto pt-4 border-top-lawyer">
            <div className="theme-switcher mb-4">
               <button 
                  onClick={toggleTheme} 
                  className={`btn-theme ${theme === 'light' ? 'active' : ''}`}
                  title="Cambiar Modo"
               >
                  {theme === 'dark' ? <Coffee size={18} /> : <Moon size={18} />}
                  <span className="ms-2">{theme === 'dark' ? 'Modo Abogado' : 'Modo Oscuro'}</span>
               </button>
            </div>

            <div className="user-card mb-4">
              <div className="avatar-lawyer me-3">{user.username.charAt(0).toUpperCase()}</div>
              <div className="overflow-hidden">
                <p className="mb-0 small fw-bold text-truncate">{user.username}</p>
                <p className="mb-0 x-small-text opacity-50">{user.isDemo ? 'Invitado Temporal' : 'Socio / Colegiado'}</p>
              </div>
            </div>
            
            <button className="btn-logout-lawyer" onClick={onLogout}>
              <LogOut size={16} className="me-3" /> Cerrar Expedientes
            </button>
          </footer>
        </div>
      </aside>

      {/* Área Central de Consulta */}
      <main className="flex-grow-1 d-flex flex-column h-100 position-relative">
        <header className="chat-header-lawyer">
          <div className="container-fluid h-100 d-flex align-items-center justify-content-between px-4">
            <div className="d-flex align-items-center">
              <button className="btn-icon d-md-none me-4" onClick={() => setShowSidebar(true)}>
                <Menu size={24} />
              </button>
              <div className="app-branding">
                <Scale size={24} className="me-3 text-accent" />
                <h1 className="h5 mb-0 fw-extrabold ls-tighter">ABOGADO<span className="opacity-50">CL</span></h1>
              </div>
            </div>
            <div className="header-actions">
              <button className="btn-header-tool" onClick={showInfo}><Info size={20} /></button>
            </div>
          </div>
        </header>

        {/* Zona de Mensajes */}
        <section className="flex-grow-1 overflow-auto px-4 py-5 scrollbar-minimal">
          <div className="mx-auto" style={{ maxWidth: '850px' }}>
            {messages.map((msg) => (
              <div key={msg.id} className={`message-container ${msg.role === 'user' ? 'user' : 'ai'} animate-in`}>
                <div className="message-avatar-wrap">
                   {msg.role === 'user' ? <div className="avatar user"><User size={18} /></div> : <div className="avatar ai"><Scale size={18} /></div>}
                </div>
                <div className="message-content shadow-sm">
                  {msg.role === 'assistant' && (
                    <button onClick={() => copyToClipboard(msg.content, msg.id)} className="btn-copy-lawyer">
                      {copiedId === msg.id ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                    </button>
                  )}
                  <div className="markdown-content-lawyer">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="message-container ai animate-pulse">
                <div className="message-avatar-wrap"><div className="avatar ai"><Scale size={18} /></div></div>
                <div className="message-content">
                  <span className="text-sub italic">Analizando leyes chilenas…</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </section>

        {/* Footer con Input */}
        <footer className="chat-input-footer p-4">
          <div className="mx-auto" style={{ maxWidth: '850px' }}>
            <form onSubmit={handleSubmit} className="input-box shadow-md">
              <textarea 
                ref={inputRef}
                rows="1"
                placeholder="Escriba su consulta jurídica aquí…" 
                className="lawyer-textarea"
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
                className={`btn-send-lawyer ${input.trim() ? 'active' : ''}`}
                disabled={!input.trim() || loading}
              >
                {loading ? <div className="spinner-border spinner-border-sm" /> : <Send size={20} />}
              </button>
            </form>
            <p className="text-center x-small-text opacity-30 mt-3 ls-1">
              ESTE SISTEMA UTILIZA INTELIGENCIA ARTIFICIAL LOCAL · VERIFICAR CON UN PROFESIONAL
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default Chat;
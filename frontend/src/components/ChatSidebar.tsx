import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LogOut, MessageSquarePlus, Search, Trash2,
  Settings, Pin, MoreVertical, Edit3, EyeOff, PanelLeftClose, PanelLeftOpen,
  Database, Scale,
} from 'lucide-react';
import { useAuth } from '../context/useAuth';
import type { Chat } from '../types';

interface Props {
  chats: Chat[];
  activeChatId: string;
  showSidebar: boolean;
  isMobileOpen: boolean;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onTogglePin: (e: React.MouseEvent, id: string) => void;
  onDeleteChat: (e: React.MouseEvent, id: string) => void;
  onHideChat: (e: React.MouseEvent, id: string) => void;
  onRenameChat: (e: React.MouseEvent, chat: Chat) => void;
  onToggleSidebar: () => void;
  onCloseMobile: () => void;
  onOpenSettings: () => void;
  onOpenSearch: () => void;
}

export default function ChatSidebar({
  chats, activeChatId, showSidebar, isMobileOpen,
  onSelectChat, onNewChat, onTogglePin, onDeleteChat, onHideChat,
  onRenameChat, onToggleSidebar, onCloseMobile, onOpenSettings, onOpenSearch,
}: Props) {
  const { user, handleLogout } = useAuth();
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number; isPinned: boolean } | null>(null);

  const visibleChats = chats.filter(c => !c.isHidden);
  const pinnedChats = visibleChats.filter(c => c.isPinned).sort((a, b) => b.updatedAt - a.updatedAt);
  const recentChats = visibleChats.filter(c => !c.isPinned).sort((a, b) => b.updatedAt - a.updatedAt);

  const renderChatItem = (chat: Chat, isPinned: boolean) => (
    <div key={chat.id}
      className={`group flex items-center justify-between px-3.5 py-2.5 rounded-xl cursor-pointer transition-all duration-200 relative ${
        activeChatId === chat.id
          ? 'text-text-main'
          : 'text-text-sub hover:text-text-main'
      }`}
      onClick={() => onSelectChat(chat.id)}>
      {activeChatId === chat.id && (
        <div className="absolute inset-0 rounded-xl bg-accent/10 border border-accent/20" />
      )}
      {activeChatId !== chat.id && (
        <div className="absolute inset-0 rounded-xl opacity-0 hover:opacity-100 bg-white/[0.03] transition-opacity" />
      )}
      <span className="truncate flex-1 text-sm font-[400] relative z-1">{chat.title}</span>
      <div className={`flex gap-0.5 opacity-0 transition-opacity duration-200 ${
        openMenuId === chat.id ? '!opacity-100' : ''
      } group-hover:opacity-100 ${activeChatId === chat.id ? 'opacity-100' : ''} relative z-1`}>
        <button
          className="bg-transparent border-none text-text-muted p-1 rounded-lg cursor-pointer flex items-center justify-center transition-all hover:bg-white/[0.08] hover:text-text-main"
          title="Opciones"
          onClick={(e) => {
            e.stopPropagation();
            if (openMenuId === chat.id) { setOpenMenuId(null); setMenuPos(null); }
            else { const rect = e.currentTarget.getBoundingClientRect(); setMenuPos({ top: rect.top, left: rect.right + 15, isPinned }); setOpenMenuId(chat.id); }
          }}>
          <MoreVertical size={14} />
        </button>
      </div>
    </div>
  );

  const sidebarContent = (
    <div className="flex flex-col h-full p-5 overflow-hidden select-none relative z-1">
      <div className="flex items-center justify-center relative mb-6 pb-4 border-b border-glass-border">
        <button className="absolute left-0 top-1/2 -translate-y-1/2 bg-transparent border-none text-text-muted cursor-pointer p-2 rounded-lg hover:bg-white/[0.06] hover:text-text-main transition-all flex items-center justify-center"
          onClick={onOpenSearch} title="Buscar conversaciones"><Search size={18} /></button>
        <Link to="/" className="flex items-center gap-2.5 no-underline text-text-main" onClick={onCloseMobile}>
          <Scale size={18} className="text-accent" />
          <h1 className="font-serif text-lg font-[400] tracking-wide m-0">Sententia</h1>
        </Link>
      </div>

      <div className="flex flex-col gap-2 mb-5">
        <button onClick={onNewChat}
          className="flex items-center justify-start gap-3 w-full px-5 py-3 glass-panel rounded-2xl text-text-main font-[450] text-sm cursor-pointer transition-all hover:bg-glass-hover hover:border-glass-border-light">
          <MessageSquarePlus size={16} />
          <span>Nueva conversación</span>
        </button>
        <button onClick={onOpenSettings}
          className="flex items-center justify-start gap-3 w-full px-5 py-3 rounded-2xl text-accent border border-accent/15 font-[450] text-sm cursor-pointer transition-all bg-accent-muted hover:bg-accent/15 hover:border-accent/30">
          <Database size={16} />
          <span>Fuentes (RAG)</span>
        </button>
      </div>

      <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin gap-5">
        {pinnedChats.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <div className="text-[0.6rem] uppercase tracking-[0.15em] text-text-sub font-[450] pl-3.5 mb-1 flex items-center gap-2">
              <Pin size={10} /> Fijados
            </div>
            {pinnedChats.map(chat => renderChatItem(chat, true))}
          </div>
        )}
        {recentChats.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <div className="text-[0.6rem] uppercase tracking-[0.15em] text-text-sub font-[450] pl-3.5 mb-1">Historial</div>
            {recentChats.map(chat => renderChatItem(chat, false))}
          </div>
        )}
      </div>

      <div className="mt-auto pt-5 border-t border-glass-border flex flex-col gap-3">
        <div className="flex items-center gap-3 p-3 glass-panel rounded-2xl transition-all hover:bg-glass-hover">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/20 flex items-center justify-center font-serif text-sm text-accent shrink-0">
            {user?.username?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 overflow-hidden min-w-0">
            <p className="text-sm font-[450] text-text-main truncate">{user?.username}</p>
            <p className="text-[0.65rem] text-accent font-[350]">{user?.isDemo ? 'Sesión Demo' : 'Socio Activo'}</p>
          </div>
          <button className="p-1.5 rounded-lg text-text-muted cursor-pointer transition-all hover:bg-white/[0.08] hover:text-text-main bg-transparent border-none flex items-center justify-center shrink-0"
            title="Configuración" onClick={onOpenSettings}><Settings size={16} /></button>
        </div>
        <button className="flex items-center justify-center gap-2.5 w-full py-2.5 rounded-xl border border-danger/15 text-danger/70 text-sm font-[350] cursor-pointer transition-all hover:bg-danger/5 hover:border-danger/25"
          onClick={handleLogout}><LogOut size={14} /> Finalizar Sesión</button>
      </div>
    </div>
  );

  return (
    <>
      {openMenuId && menuPos && (
        <>
          <div className="fixed inset-0 z-[8000] bg-transparent" onClick={() => { setOpenMenuId(null); setMenuPos(null); }} />
          <div className="fixed z-[8001] glass-panel-strong border border-accent/15 rounded-xl p-1.5 flex flex-col gap-0.5 min-w-[160px] shadow-[0_20px_48px_rgba(0,0,0,0.7)] animate-dropdown"
            style={{ top: menuPos.top, left: menuPos.left }}
            onClick={(e) => e.stopPropagation()}>
            <button className="bg-transparent border-none text-text-sub px-3.5 py-2 rounded-lg flex items-center gap-2.5 cursor-pointer text-left text-sm font-[350] transition-all hover:bg-accent/10 hover:text-text-main"
              onClick={(e) => { onTogglePin(e, openMenuId); setOpenMenuId(null); setMenuPos(null); }}>
              <Pin size={13} /> {menuPos.isPinned ? 'Desfijar' : 'Fijar'}
            </button>
            <button className="bg-transparent border-none text-text-sub px-3.5 py-2 rounded-lg flex items-center gap-2.5 cursor-pointer text-left text-sm font-[350] transition-all hover:bg-accent/10 hover:text-text-main"
              onClick={(e) => { const chat = chats.find(c => c.id === openMenuId); if (chat) onRenameChat(e, chat); setOpenMenuId(null); setMenuPos(null); }}>
              <Edit3 size={13} /> Renombrar
            </button>
            <button className="bg-transparent border-none text-text-sub px-3.5 py-2 rounded-lg flex items-center gap-2.5 cursor-pointer text-left text-sm font-[350] transition-all hover:bg-accent/10 hover:text-text-main"
              onClick={(e) => { onHideChat(e, openMenuId); setOpenMenuId(null); setMenuPos(null); }}>
              <EyeOff size={13} /> Ocultar
            </button>
            <div className="h-px bg-glass-border mx-2 my-0.5" />
            <button className="bg-transparent border-none text-danger/80 px-3.5 py-2 rounded-lg flex items-center gap-2.5 cursor-pointer text-left text-sm font-[350] transition-all hover:bg-danger/10 hover:text-danger"
              onClick={(e) => { onDeleteChat(e, openMenuId); setOpenMenuId(null); setMenuPos(null); }}>
              <Trash2 size={13} /> Eliminar
            </button>
          </div>
        </>
      )}

      {/* Desktop: width-transitioning wrapper with toggle pin */}
      <div className={`hidden md:flex h-full transition-all duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] overflow-hidden shrink-0 relative ${
        showSidebar ? 'w-[330px]' : 'w-0'
      }`}>
        <aside className="w-[330px] min-w-[330px] h-full flex flex-col border-r border-glass-border bg-glass backdrop-blur-2xl before:absolute before:inset-0 before:pointer-events-none before:bg-gradient-to-b before:from-accent/[0.02] before:to-transparent"
          aria-label="Panel de Historial">
          {sidebarContent}
        </aside>

        {/* Toggle pin on the right edge */}
        <button
          onClick={onToggleSidebar}
          className="absolute -right-3 top-1/2 -translate-y-1/2 z-50 w-5 h-14 rounded-r-full glass-panel border border-l-0 border-glass-border flex items-center justify-center cursor-pointer text-text-muted hover:text-accent hover:border-accent/20 transition-all duration-300 group"
          title={showSidebar ? 'Ocultar panel lateral' : 'Mostrar panel lateral'}>
          <PanelLeftClose size={12} className={`transition-transform duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] ${
            !showSidebar ? 'rotate-180' : ''
          }`} />
        </button>
      </div>

      {/* Mobile overlay */}
      <div className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] opacity-0 pointer-events-none transition-opacity md:hidden ${isMobileOpen ? '!opacity-100 !pointer-events-auto' : ''}`}
        onClick={onCloseMobile} aria-hidden="true" />

      {/* Mobile sidebar */}
      <aside className={`md:hidden absolute left-0 top-0 h-full w-[330px] z-[200] bg-glass backdrop-blur-2xl border-r border-glass-border transition-transform duration-300 before:absolute before:inset-0 before:pointer-events-none before:bg-gradient-to-b before:from-accent/[0.02] before:to-transparent ${
        isMobileOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
        aria-label="Panel de Historial">
        {sidebarContent}
      </aside>
    </>
  );
}

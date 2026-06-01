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
      className={`group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-all duration-150 relative ${
        activeChatId === chat.id
          ? 'bg-white/[0.04] text-text-main'
          : 'text-text-sub hover:bg-white/[0.02] hover:text-text-main'
      }`}
      onClick={() => onSelectChat(chat.id)}>
      {activeChatId === chat.id && (
        <div className="absolute left-0 top-1 bottom-1 w-0.5 rounded-full bg-accent" />
      )}
      <span className="truncate flex-1 text-sm font-[400] relative">{chat.title}</span>
      <div className={`flex gap-0.5 opacity-0 transition-opacity duration-150 ${
        openMenuId === chat.id ? '!opacity-100' : ''
      } group-hover:opacity-100 ${activeChatId === chat.id ? 'opacity-100' : ''} relative`}>
        <button
          className="bg-transparent border-none text-text-muted p-1 rounded-md cursor-pointer flex items-center justify-center transition-all hover:bg-white/[0.08] hover:text-text-main"
          title="Opciones"
          onClick={(e) => {
            e.stopPropagation();
            if (openMenuId === chat.id) { setOpenMenuId(null); setMenuPos(null); }
            else { const rect = e.currentTarget.getBoundingClientRect(); setMenuPos({ top: rect.top, left: rect.right + 15, isPinned }); setOpenMenuId(chat.id); }
          }}>
          <MoreVertical size={13} />
        </button>
      </div>
    </div>
  );

  const sidebarContent = (
    <div className="flex flex-col h-full p-4 select-none relative">
      {/* Header */}
      <div className="flex items-center justify-center relative mb-5 pb-4 border-b border-white/[0.04]">
        <button className="absolute left-0 top-1/2 -translate-y-1/2 bg-transparent border-none text-text-muted cursor-pointer p-1.5 rounded-lg hover:bg-white/[0.06] hover:text-text-main transition-all flex items-center justify-center"
          onClick={onOpenSearch} title="Buscar conversaciones"><Search size={16} /></button>
        <Link to="/" className="flex items-center gap-2.5 no-underline text-text-main" onClick={onCloseMobile}>
          <Scale size={16} className="text-accent" />
          <h1 className="font-serif text-base font-[450] tracking-wide m-0">Sententia</h1>
        </Link>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-1.5 mb-4">
        <button onClick={onNewChat}
          className="flex items-center justify-start gap-2.5 w-full px-3.5 py-2.5 rounded-lg text-text-sub text-sm font-[400] cursor-pointer transition-all hover:bg-white/[0.04] hover:text-text-main bg-transparent border-none">
          <MessageSquarePlus size={15} className="text-text-muted" />
          <span>Nueva conversación</span>
        </button>
        <button onClick={onOpenSettings}
          className="flex items-center justify-start gap-2.5 w-full px-3.5 py-2.5 rounded-lg text-text-sub text-sm font-[400] cursor-pointer transition-all hover:bg-accent-muted hover:text-accent bg-transparent border-none">
          <Database size={15} className="text-text-muted group-hover:text-accent" />
          <span>Fuentes (RAG)</span>
        </button>
      </div>

      {/* Chat list */}
      <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin gap-3">
        {pinnedChats.length > 0 && (
          <div className="flex flex-col gap-0.5">
            <div className="text-[0.55rem] uppercase tracking-[0.12em] text-text-muted font-[450] px-3 mb-1">Fijados</div>
            {pinnedChats.map(chat => renderChatItem(chat, true))}
          </div>
        )}
        {recentChats.length > 0 && (
          <div className="flex flex-col gap-0.5">
            <div className="text-[0.55rem] uppercase tracking-[0.12em] text-text-muted font-[450] px-3 mb-1">Historial</div>
            {recentChats.map(chat => renderChatItem(chat, false))}
          </div>
        )}
      </div>

      {/* User */}
      <div className="mt-auto pt-4 border-t border-white/[0.04] flex items-center gap-2.5 px-1">
        <div className="w-7 h-7 rounded-md bg-white/[0.04] flex items-center justify-center font-serif text-xs text-text-muted shrink-0">
          {user?.username?.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 overflow-hidden min-w-0">
          <p className="text-xs font-[450] text-text-sub truncate">{user?.username}</p>
          <p className="text-[0.55rem] text-text-muted font-[350]">{user?.isDemo ? 'Demo' : 'Socio'}</p>
        </div>
        <button className="p-1 rounded-md text-text-muted cursor-pointer transition-all hover:bg-white/[0.06] hover:text-text-sub bg-transparent border-none flex items-center justify-center shrink-0"
          title="Configuración" onClick={onOpenSettings}><Settings size={14} /></button>
        <button className="p-1 rounded-md text-text-muted cursor-pointer transition-all hover:bg-danger/10 hover:text-danger/70 bg-transparent border-none flex items-center justify-center shrink-0"
          title="Finalizar sesión" onClick={handleLogout}><LogOut size={14} /></button>
      </div>
    </div>
  );

  return (
    <>
      {openMenuId && menuPos && (
        <>
          <div className="fixed inset-0 z-[8000] bg-transparent" onClick={() => { setOpenMenuId(null); setMenuPos(null); }} />
          <div className="fixed z-[8001] bg-surface border border-white/[0.06] rounded-lg p-1 flex flex-col gap-0.5 min-w-[148px] shadow-[0_20px_48px_rgba(0,0,0,0.7)]"
            style={{ top: menuPos.top, left: menuPos.left }}
            onClick={(e) => e.stopPropagation()}>
            <button className="bg-transparent border-none text-text-sub px-3 py-1.5 rounded-md flex items-center gap-2.5 cursor-pointer text-left text-xs font-[400] transition-all hover:bg-white/[0.04] hover:text-text-main"
              onClick={(e) => { onTogglePin(e, openMenuId); setOpenMenuId(null); setMenuPos(null); }}>
              <Pin size={12} /> {menuPos.isPinned ? 'Desfijar' : 'Fijar'}
            </button>
            <button className="bg-transparent border-none text-text-sub px-3 py-1.5 rounded-md flex items-center gap-2.5 cursor-pointer text-left text-xs font-[400] transition-all hover:bg-white/[0.04] hover:text-text-main"
              onClick={(e) => { const chat = chats.find(c => c.id === openMenuId); if (chat) onRenameChat(e, chat); setOpenMenuId(null); setMenuPos(null); }}>
              <Edit3 size={12} /> Renombrar
            </button>
            <button className="bg-transparent border-none text-text-sub px-3 py-1.5 rounded-md flex items-center gap-2.5 cursor-pointer text-left text-xs font-[400] transition-all hover:bg-white/[0.04] hover:text-text-main"
              onClick={(e) => { onHideChat(e, openMenuId); setOpenMenuId(null); setMenuPos(null); }}>
              <EyeOff size={12} /> Ocultar
            </button>
            <div className="h-px bg-white/[0.04] mx-2 my-0.5" />
            <button className="bg-transparent border-none text-danger/60 px-3 py-1.5 rounded-md flex items-center gap-2.5 cursor-pointer text-left text-xs font-[400] transition-all hover:bg-danger/5 hover:text-danger"
              onClick={(e) => { onDeleteChat(e, openMenuId); setOpenMenuId(null); setMenuPos(null); }}>
              <Trash2 size={12} /> Eliminar
            </button>
          </div>
        </>
      )}

      {/* Desktop */}
      <div className={`hidden md:flex h-full transition-all duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] overflow-hidden shrink-0 ${
        showSidebar ? 'w-[300px]' : 'w-0'
      }`}>
        <aside className="w-[300px] min-w-[300px] h-full flex flex-col border-r border-white/[0.04] bg-surface"
          aria-label="Panel de Historial">
          {sidebarContent}
        </aside>
      </div>

      {/* Toggle pin */}
      <button
        onClick={onToggleSidebar}
        className="hidden md:flex fixed top-1/2 -translate-y-1/2 z-50 w-4 h-12 items-center justify-center cursor-pointer text-text-muted hover:text-accent transition-all duration-300 group rounded-r-md bg-white/[0.02] border border-l-0 border-white/[0.04] hover:bg-accent/5 hover:border-accent/15"
        style={{ left: showSidebar ? '297px' : '0px' }}
        title={showSidebar ? 'Ocultar panel lateral' : 'Mostrar panel lateral'}>
        <PanelLeftClose size={11} className={`transition-transform duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] ${
          !showSidebar ? 'rotate-180' : ''
        }`} />
      </button>

      {/* Mobile overlay */}
      <div className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] opacity-0 pointer-events-none transition-opacity md:hidden ${isMobileOpen ? '!opacity-100 !pointer-events-auto' : ''}`}
        onClick={onCloseMobile} aria-hidden="true" />

      {/* Mobile sidebar */}
      <aside className={`md:hidden absolute left-0 top-0 h-full w-[300px] z-[200] bg-surface border-r border-white/[0.04] transition-transform duration-300 ${
        isMobileOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
        aria-label="Panel de Historial">
        {sidebarContent}
      </aside>
    </>
  );
}

import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LogOut, MessageSquarePlus, Search, Trash2,
  Settings, Pin, MoreVertical, Edit3, EyeOff,
  PanelLeftClose, Scale,
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
      className={`group relative flex items-center justify-between px-3 py-[7px] rounded-lg cursor-pointer transition-all duration-150 ${
        activeChatId === chat.id
          ? 'bg-white/[0.03] text-text-main'
          : 'text-text-sub hover:bg-white/[0.01] hover:text-text-main'
      }`}
      onClick={() => onSelectChat(chat.id)}>
      {activeChatId === chat.id && (
        <div className="absolute left-0 top-[5px] bottom-[5px] w-[2px] rounded-full bg-accent" />
      )}
      <span className="truncate flex-1 text-sm font-subtle tracking-[0.005em] pl-2">{chat.title}</span>
      <div className={`flex gap-0.5 opacity-0 transition-opacity duration-150 ${
        openMenuId === chat.id ? '!opacity-100' : ''
      } group-hover:opacity-100 ${activeChatId === chat.id ? 'opacity-60' : ''} relative`}>
        <button
          className="bg-transparent border-none text-text-muted p-1 rounded-md cursor-pointer flex items-center justify-center transition-all hover:bg-white/[0.06] hover:text-text-main"
          title="Opciones"
          onClick={(e) => {
            e.stopPropagation();
            if (openMenuId === chat.id) { setOpenMenuId(null); setMenuPos(null); }
            else { const rect = e.currentTarget.getBoundingClientRect(); setMenuPos({ top: rect.top, left: rect.right + 12, isPinned }); setOpenMenuId(chat.id); }
          }}>
          <MoreVertical size={12} />
        </button>
      </div>
    </div>
  );

  const sidebarContent = (
    <div className="flex flex-col h-full p-3 select-none relative">
      <div className="flex items-center justify-between mb-3 px-2 pb-3 border-b border-white/[0.03]">
        <Link to="/" className="flex items-center gap-2.5 no-underline text-text-main" onClick={onCloseMobile}>
          <Scale size={15} className="text-accent" />
          <span className="font-serif text-sm font-emphasized tracking-wide">Sententia</span>
        </Link>
        <div className="flex items-center gap-1">
          <button className="bg-transparent border-none text-text-muted cursor-pointer p-1.5 rounded-lg transition-all hover:bg-white/[0.04] hover:text-text-main flex items-center justify-center"
            onClick={onOpenSearch} title="Buscar"><Search size={13} /></button>
        </div>
      </div>

      <button onClick={onNewChat}
        className="flex items-center justify-center gap-2 w-full mb-3 px-3 py-2 rounded-lg bg-accent/8 border border-accent/10 text-accent text-xs font-emphasized cursor-pointer transition-all hover:bg-accent/12 hover:border-accent/18">
        <MessageSquarePlus size={13} />
        <span>Nuevo chat</span>
      </button>

      <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin gap-2">
        {pinnedChats.length > 0 && (
          <div className="flex flex-col gap-px">
            <div className="text-2xs uppercase tracking-[0.15em] text-text-muted/50 font-normal px-3 mb-1">Fijados</div>
            {pinnedChats.map(chat => renderChatItem(chat, true))}
          </div>
        )}
        {recentChats.length > 0 && (
          <div className="flex flex-col gap-px">
            <div className="text-2xs uppercase tracking-[0.15em] text-text-muted/50 font-normal px-3 mb-1">Historial</div>
            {recentChats.map(chat => renderChatItem(chat, false))}
          </div>
        )}
        {visibleChats.length === 0 && (
          <div className="text-text-muted/40 text-xs font-subtle text-center py-8 px-4 leading-relaxed">
            No hay conversaciones aún.<br />Inicia una nueva consulta.
          </div>
        )}
      </div>

      <div className="mt-auto pt-3 border-t border-white/[0.03] flex items-center gap-2 px-1.5">
        <div className="w-[26px] h-[26px] rounded-md bg-white/[0.03] flex items-center justify-center font-serif text-[10px] text-text-muted shrink-0 border border-white/[0.03]">
          {user?.username?.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 overflow-hidden min-w-0">
          <p className="text-micro font-normal text-text-sub truncate">{user?.username}</p>
          <p className="text-[9px] text-text-muted/50 font-subtle uppercase tracking-[0.08em]">{user?.isDemo ? 'Demo' : 'Socio'}</p>
        </div>
        <button className="p-1 rounded-md text-text-muted/60 cursor-pointer transition-all hover:bg-white/[0.04] hover:text-text-sub bg-transparent border-none flex items-center justify-center shrink-0"
          title="Configuración" onClick={onOpenSettings}><Settings size={13} /></button>
        <button className="p-1 rounded-md text-text-muted/60 cursor-pointer transition-all hover:bg-danger/8 hover:text-danger/60 bg-transparent border-none flex items-center justify-center shrink-0"
          title="Finalizar sesión" onClick={handleLogout}><LogOut size={13} /></button>
      </div>
    </div>
  );

  return (
    <>
      {openMenuId && menuPos && (
        <>
          <div className="fixed inset-0 z-[8000] bg-transparent" onClick={() => { setOpenMenuId(null); setMenuPos(null); }} />
          <div className="fixed z-[8001] bg-[#0a0a0e] border border-white/[0.05] rounded-xl p-1 flex flex-col gap-0.5 min-w-[140px] shadow-[0_24px_64px_rgba(0,0,0,0.8)]"
            style={{ top: menuPos.top, left: menuPos.left }}
            onClick={(e) => e.stopPropagation()}>
            <button className="bg-transparent border-none text-text-sub px-3 py-[7px] rounded-lg flex items-center gap-2.5 cursor-pointer text-left text-micro font-normal transition-all hover:bg-white/[0.03] hover:text-text-main"
              onClick={(e) => { onTogglePin(e, openMenuId); setOpenMenuId(null); setMenuPos(null); }}>
              <Pin size={11} /> {menuPos.isPinned ? 'Desfijar' : 'Fijar'}
            </button>
            <button className="bg-transparent border-none text-text-sub px-3 py-[7px] rounded-lg flex items-center gap-2.5 cursor-pointer text-left text-micro font-normal transition-all hover:bg-white/[0.03] hover:text-text-main"
              onClick={(e) => { const chat = chats.find(c => c.id === openMenuId); if (chat) onRenameChat(e, chat); setOpenMenuId(null); setMenuPos(null); }}>
              <Edit3 size={11} /> Renombrar
            </button>
            <button className="bg-transparent border-none text-text-sub px-3 py-[7px] rounded-lg flex items-center gap-2.5 cursor-pointer text-left text-micro font-normal transition-all hover:bg-white/[0.03] hover:text-text-main"
              onClick={(e) => { onHideChat(e, openMenuId); setOpenMenuId(null); setMenuPos(null); }}>
              <EyeOff size={11} /> Ocultar
            </button>
            <div className="h-px bg-white/[0.03] mx-2 my-0.5" />
            <button className="bg-transparent border-none text-danger/50 px-3 py-[7px] rounded-lg flex items-center gap-2.5 cursor-pointer text-left text-micro font-normal transition-all hover:bg-danger/6 hover:text-danger/70"
              onClick={(e) => { onDeleteChat(e, openMenuId); setOpenMenuId(null); setMenuPos(null); }}>
              <Trash2 size={11} /> Eliminar
            </button>
          </div>
        </>
      )}

      <div className={`hidden md:flex h-full transition-all duration-400 ease-[cubic-bezier(0.22,0.1,0.25,1)] overflow-hidden shrink-0 ${
        showSidebar ? 'w-[280px]' : 'w-0'
      }`}>
        <aside className="w-[280px] min-w-[280px] h-full flex flex-col border-r border-white/[0.03] bg-surface"
          aria-label="Panel de Historial">
          {sidebarContent}
        </aside>
      </div>

      <button
        onClick={onToggleSidebar}
        className="hidden md:flex fixed top-1/2 -translate-y-1/2 z-50 w-5 h-16 items-center justify-center cursor-pointer bg-white/[0.01] border border-white/[0.03] rounded-r-lg text-text-muted/40 transition-all duration-300 hover:bg-accent/6 hover:text-accent hover:border-accent/15 group"
        style={{ left: showSidebar ? '277px' : '0px' }}
        title={showSidebar ? 'Contraer panel' : 'Expandir panel'}>
        <PanelLeftClose size={13} className={`transition-transform duration-400 ease-[cubic-bezier(0.22,0.1,0.25,1)] ${
          !showSidebar ? 'rotate-180' : ''
        }`} />
      </button>

      <div className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-[150] opacity-0 pointer-events-none transition-opacity md:hidden ${isMobileOpen ? '!opacity-100 !pointer-events-auto' : ''}`}
        onClick={onCloseMobile} aria-hidden="true" />

      <aside className={`md:hidden fixed left-0 top-0 h-full w-[280px] z-[200] bg-surface border-r border-white/[0.03] transition-transform duration-300 ${
        isMobileOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
        aria-label="Panel de Historial">
        {sidebarContent}
      </aside>
    </>
  );
}

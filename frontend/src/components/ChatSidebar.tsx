import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles, LogOut, MessageSquarePlus, Search, Trash2,
  Settings, Pin, MoreVertical, Edit3, EyeOff, PanelLeftClose,
  Database,
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
  chats,
  activeChatId,
  showSidebar,
  isMobileOpen,
  onSelectChat,
  onNewChat,
  onTogglePin,
  onDeleteChat,
  onHideChat,
  onRenameChat,
  onToggleSidebar,
  onCloseMobile,
  onOpenSettings,
  onOpenSearch,
}: Props) {
  const { user, handleLogout } = useAuth();
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number; isPinned: boolean } | null>(null);

  const visibleChats = chats.filter(c => !c.isHidden);
  const pinnedChats = visibleChats.filter(c => c.isPinned).sort((a, b) => b.updatedAt - a.updatedAt);
  const recentChats = visibleChats.filter(c => !c.isPinned).sort((a, b) => b.updatedAt - a.updatedAt);

  const renderChatItem = (chat: Chat, isPinned: boolean) => (
    <div
      key={chat.id}
      className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-all border border-transparent text-zinc-400 relative ${
        activeChatId === chat.id ? 'bg-white/[0.08] border-white/10 text-white/95 font-medium' : 'hover:bg-white/[0.03] hover:text-white/95'
      }`}
      onClick={() => onSelectChat(chat.id)}
    >
      <span className="truncate flex-1 text-sm">{chat.title}</span>
      <div className={`flex gap-1 opacity-0 transition-opacity ${openMenuId === chat.id ? '!opacity-100 z-[1001]' : ''} group-hover:opacity-100 ${activeChatId === chat.id ? 'opacity-100' : ''}`}
        style={{ opacity: openMenuId === chat.id ? 1 : undefined }}>
        <button
          className="bg-none border-none text-zinc-400 p-1 rounded cursor-pointer flex items-center justify-center transition-all hover:bg-white/10 hover:text-white/95"
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
          <MoreVertical size={16} />
        </button>
      </div>
    </div>
  );

  return (
    <>
      {openMenuId && menuPos && (
        <>
          <div
            className="fixed inset-0 z-[8000] bg-transparent"
            onClick={() => { setOpenMenuId(null); setMenuPos(null); }}
          />
          <div
            className="fixed z-[8001] bg-white/[0.12] backdrop-blur-2xl border border-accent/15 rounded-xl p-1.5 flex flex-col gap-0.5 min-w-[164px] shadow-[0_20px_48px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.06)] animate-dropdown"
            style={{ top: menuPos.top, left: menuPos.left }}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="bg-none border-none text-white/80 px-3.5 py-2 rounded-lg flex items-center gap-2.5 cursor-pointer text-left text-sm font-normal transition-all hover:bg-accent/15 hover:text-white" onClick={(e) => { onTogglePin(e, openMenuId); setOpenMenuId(null); setMenuPos(null); }}>
              <Pin size={14} /> {menuPos.isPinned ? 'Desfijar' : 'Fijar'}
            </button>
            <button className="bg-none border-none text-white/80 px-3.5 py-2 rounded-lg flex items-center gap-2.5 cursor-pointer text-left text-sm font-normal transition-all hover:bg-accent/15 hover:text-white" onClick={(e) => {
              const chat = chats.find(c => c.id === openMenuId);
              if (chat) onRenameChat(e, chat);
              setOpenMenuId(null); setMenuPos(null);
            }}>
              <Edit3 size={14} /> Renombrar
            </button>
            <button className="bg-none border-none text-white/80 px-3.5 py-2 rounded-lg flex items-center gap-2.5 cursor-pointer text-left text-sm font-normal transition-all hover:bg-accent/15 hover:text-white" onClick={(e) => { onHideChat(e, openMenuId); setOpenMenuId(null); setMenuPos(null); }}>
              <EyeOff size={14} /> Ocultar
            </button>
            <button className="bg-none border-none text-rose-400/85 px-3.5 py-2 rounded-lg flex items-center gap-2.5 cursor-pointer text-left text-sm font-normal transition-all hover:bg-red-500/15 hover:text-rose-400" onClick={(e) => { onDeleteChat(e, openMenuId); setOpenMenuId(null); setMenuPos(null); }}>
              <Trash2 size={14} /> Eliminar
            </button>
          </div>
        </>
      )}

      <div
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm z-[150] opacity-0 pointer-events-none transition-opacity md:hidden ${isMobileOpen ? '!opacity-100 !pointer-events-auto' : ''}`}
        onClick={onCloseMobile}
        aria-hidden="true"
      />

      <aside
        className={`w-[330px] min-w-[330px] h-full flex flex-col border-r border-white/10 bg-white/[0.04] backdrop-blur-2xl transition-all duration-300 relative z-[100] ${
          !showSidebar ? 'max-md:ml-[-330px]' : ''
        } ${
          isMobileOpen ? 'max-md:!translate-x-0' : ''
        } max-md:absolute max-md:left-0 max-md:-translate-x-full max-md:transition-transform max-md:z-[200] max-md:shadow-[5px_0_30px_rgba(0,0,0,0.8)]`}
        aria-label="Panel Historial"
      >
        <div className="flex flex-col h-full p-6 overflow-hidden select-none">
          <div className="flex items-center justify-center relative mb-8 pb-4 border-b border-white/10">
            <button className="absolute left-0 top-1/2 -translate-y-[70%] bg-transparent border-none text-zinc-400 cursor-pointer p-2 rounded-lg hover:bg-white/10 hover:text-white/95 transition-all flex items-center justify-center" onClick={onOpenSearch} title="Buscar conversaciones">
              <Search size={20} />
            </button>
            <Link to="/" className="flex items-center gap-3 no-underline text-white/95" onClick={onCloseMobile}>
              <Sparkles size={20} color="white" strokeWidth={2.5} />
              <h1 className="text-xl font-bold tracking-wider m-0">Sententia</h1>
            </Link>
            <button className="absolute right-0 top-1/2 -translate-y-[70%] bg-transparent border-none text-zinc-400 cursor-pointer p-2 rounded-lg hover:bg-white/10 hover:text-white/95 transition-all flex items-center justify-center" onClick={onToggleSidebar} title="Ocultar panel lateral">
              <PanelLeftClose size={22} />
            </button>
          </div>

          <div className="flex flex-col gap-2 mb-6">
            <button onClick={onNewChat} className="flex items-center justify-start gap-3 w-full px-5 py-3.5 bg-white/[0.05] border border-white/15 rounded-2xl text-white/95 font-medium text-sm cursor-pointer transition-all backdrop-blur-md hover:bg-white/10 hover:border-white/30 hover:-translate-y-0.5 hover:shadow-lg">
              <MessageSquarePlus size={18} />
              <span>Nueva conversación</span>
            </button>
            <button onClick={onOpenSettings} className="flex items-center justify-start gap-3 w-full px-5 py-3.5 bg-accent/[0.05] border border-accent/15 rounded-2xl text-accent font-medium text-sm cursor-pointer transition-all backdrop-blur-md hover:bg-accent/10 hover:border-accent/30 hover:-translate-y-0.5 hover:shadow-lg">
              <Database size={18} />
              <span>Fuentes (RAG)</span>
            </button>
          </div>

          <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin gap-6">
            {pinnedChats.length > 0 && (
              <div className="flex flex-col gap-2">
                <div className="text-[0.7rem] uppercase tracking-wider text-zinc-400 font-semibold pl-2 mb-1 flex items-center gap-2">
                  <Pin size={12} /> Fijados
                </div>
                {pinnedChats.map(chat => renderChatItem(chat, true))}
              </div>
            )}
            {recentChats.length > 0 && (
              <div className="flex flex-col gap-2">
                <div className="text-[0.7rem] uppercase tracking-wider text-zinc-400 font-semibold pl-2 mb-1">Historial</div>
                {recentChats.map(chat => renderChatItem(chat, false))}
              </div>
            )}
          </div>

          <div className="mt-auto pt-6 border-t border-white/10 flex flex-col gap-4">
            <div className="flex items-center gap-4 p-3 bg-white/[0.02] border border-white/10 rounded-2xl transition-all hover:bg-white/[0.05]">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-accent-light flex items-center justify-center font-bold text-white shadow-[0_2px_10px_rgba(212,175,55,0.3)] relative after:absolute after:-inset-[3px] after:rounded-full after:border after:border-white/20">
                {user?.username?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-semibold text-white/95 truncate mb-0.5">{user?.username}</p>
                <p className="text-xs text-accent">{user?.isDemo ? 'Sesión Demo' : 'Socio Activo'}</p>
              </div>
              <button className="p-1.5 rounded text-zinc-400 cursor-pointer transition-all hover:bg-white/10 hover:text-white/95 bg-none border-none flex items-center justify-center" title="Configuración" onClick={onOpenSettings}>
                <Settings size={18} />
              </button>
            </div>
            <button className="flex items-center justify-center gap-3 w-full py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-rose-400 text-sm font-medium cursor-pointer transition-all hover:bg-red-500/15 hover:border-red-500/40" onClick={handleLogout}>
              <LogOut size={16} /> Finalizar Sesión
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

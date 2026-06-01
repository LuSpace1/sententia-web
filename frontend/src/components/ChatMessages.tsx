import { useRef, useEffect, useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Check, Copy } from 'lucide-react';
import type { Chat, ModelPrompt, DownloadState } from '../types';
import ModelDownloadBanner from './ModelDownloadBanner';

interface Props {
  activeChat: Chat;
  loading: boolean;
  downloadStates: Record<string, DownloadState>;
  onCopyMessage: (text: string, id: string) => void;
  onDownloadModel: (modelName: string, purpose: string) => void;
  onDownloadMultiple: (models: ModelPrompt[]) => void;
  onSkipDownload: (modelName: string) => void;
  onCancelDownload: (modelName: string) => void;
  copiedId: string | null;
}

function formatTime(ts?: number) {
  if (!ts) return '';
  return new Date(ts).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
}

export default function ChatMessages({
  activeChat, loading, downloadStates, onCopyMessage,
  onDownloadModel, onDownloadMultiple, onSkipDownload, onCancelDownload, copiedId,
}: Props) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messages = useMemo(() => activeChat?.messages || [], [activeChat?.messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 300);
    };
    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  const isAnyModelDownloading = Object.keys(downloadStates).length > 0;

  return (
    <>
      <div className="flex-1 overflow-y-auto px-4 md:px-8 pt-[calc(56px+0.75rem)] pb-5 scroll-smooth flex flex-col items-center scrollbar-thin"
        ref={messagesContainerRef}>
        <div className="w-full max-w-[720px] flex flex-col gap-5">
          {messages.map((msg, idx) => (
            <div key={msg.id} className={`flex w-full animate-message ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              style={{ animationDelay: `${idx * 0.05}s` }}>
              <div className={`relative max-w-[78%] leading-relaxed group ${
                msg.role === 'assistant'
                  ? 'bg-white/[0.02] border border-white/[0.04] rounded-2xl rounded-bl-md p-5'
                  : 'bg-accent/8 rounded-2xl rounded-br-md px-5 py-4'
              }`}>
                {msg.role === 'assistant' && (
                  <button
                    className={`absolute top-3 right-3 z-2 bg-[#0a0a0e] border border-white/[0.04] rounded-lg p-1.5 text-text-muted/50 cursor-pointer transition-all duration-200 opacity-0 group-hover:opacity-100 hover:bg-white/[0.06] hover:text-text-main ${
                      copiedId === msg.id ? '!opacity-100 !bg-accent/12 !text-accent !border-accent/18' : ''
                    }`}
                    onClick={() => onCopyMessage(msg.content, msg.id)}
                    title="Copiar">
                    {copiedId === msg.id ? <Check size={11} /> : <Copy size={11} />}
                  </button>
                )}
                <div className={`text-sm md:text-[0.9rem] font-subtle leading-[1.75] prose-legal ${msg.role === 'user' ? 'text-text-main' : ''}`}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                </div>
                <div className={`flex items-center gap-2 mt-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <span className={`text-[10px] font-subtle ${copiedId === msg.id ? 'text-accent/60' : 'text-text-muted/25'}`}>
                    {copiedId === msg.id ? 'Copiado ·' : ''}{' '}{formatTime(msg.createdAt)}
                  </span>
                </div>
                {msg.modelPrompt && (
                  <div className="flex gap-2.5 mt-3 flex-wrap">
                    <button type="button"
                      className="rounded-lg px-3.5 py-2 text-micro font-emphasized cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-accent/10 text-accent hover:bg-accent/15 border-none"
                      onClick={() => onDownloadModel(msg.modelPrompt!.model, msg.modelPrompt!.purpose)}
                      disabled={loading || isAnyModelDownloading}>Sí, descargar modelo</button>
                    <button type="button"
                      className="rounded-lg px-3.5 py-2 text-micro font-[400] cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed text-text-muted hover:text-text-sub hover:bg-white/[0.03] border-none bg-transparent"
                      onClick={() => onSkipDownload(msg.modelPrompt!.model)}
                      disabled={loading || isAnyModelDownloading}>No ahora</button>
                  </div>
                )}
                {msg.modelPrompts && msg.modelPrompts.length > 0 && (
                  <div className="flex gap-2.5 mt-3 flex-wrap">
                    <button type="button"
                      className="rounded-lg px-3.5 py-2 text-micro font-emphasized cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-accent/10 text-accent hover:bg-accent/15 border-none"
                      onClick={() => onDownloadMultiple(msg.modelPrompts!)}
                      disabled={loading || isAnyModelDownloading}>Sí, descargar {msg.modelPrompts.length} modelos</button>
                    <button type="button"
                      className="rounded-lg px-3.5 py-2 text-micro font-[400] cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed text-text-muted hover:text-text-sub hover:bg-white/[0.03] border-none bg-transparent"
                      onClick={() => onSkipDownload(msg.modelPrompts!.map(m => m.model).join(' y '))}
                      disabled={loading || isAnyModelDownloading}>No ahora</button>
                    <div className="w-full mt-2 pt-2 border-t border-white/[0.03] flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] text-text-muted/50 font-subtle">O solo uno:</span>
                      {msg.modelPrompts.map(m => (
                        <button key={m.model} type="button"
                          className="bg-transparent border border-white/[0.04] text-text-muted/60 text-[10px] cursor-pointer px-2 py-1 rounded-md transition-all hover:text-text-sub hover:border-white/10 hover:bg-white/[0.02] disabled:opacity-30 disabled:cursor-not-allowed"
                          onClick={() => onDownloadModel(m.model, m.purpose)}
                          disabled={loading || !!downloadStates[m.model]} title={m.purpose}>{m.model}</button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex w-full">
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="flex gap-1.5">
                  <span className="w-[3px] h-[3px] rounded-full bg-accent/40 animate-pulse" style={{ animationDelay: '0s', animationDuration: '1.5s' }} />
                  <span className="w-[3px] h-[3px] rounded-full bg-accent/40 animate-pulse" style={{ animationDelay: '0.3s', animationDuration: '1.5s' }} />
                  <span className="w-[3px] h-[3px] rounded-full bg-accent/40 animate-pulse" style={{ animationDelay: '0.6s', animationDuration: '1.5s' }} />
                </div>
                <span className="text-accent/40 text-xs font-subtle tracking-[0.02em]">Analizando jurisprudencia</span>
              </div>
            </div>
          )}

          <ModelDownloadBanner downloadStates={downloadStates} onCancel={onCancelDownload} />
          <div ref={messagesEndRef} />
        </div>
      </div>
      {showScrollBtn && (
        <button className="fixed bottom-28 right-6 z-20 w-8 h-8 rounded-xl bg-white/[0.02] border border-white/[0.04] text-text-muted/50 cursor-pointer transition-all hover:bg-white/[0.04] hover:text-text-main flex items-center justify-center text-xs"
          onClick={scrollToBottom} title="Ir al final">↓</button>
      )}
    </>
  );
}

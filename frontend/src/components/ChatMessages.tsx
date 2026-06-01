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
      <div className="flex-1 overflow-y-auto px-5 pt-[calc(64px+0.5rem)] pb-5 scroll-smooth flex flex-col items-center scrollbar-thin"
        ref={messagesContainerRef}>
        <div className="w-full max-w-[800px] flex flex-col gap-5">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex w-full animate-message ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`relative max-w-[82%] leading-relaxed ${
                msg.role === 'assistant'
                  ? 'glass-panel rounded-2xl rounded-bl-lg p-5'
                  : 'bg-accent/8 border border-accent/20 rounded-2xl rounded-br-lg px-5 py-3.5'
              }`}>
                {msg.role === 'assistant' && (
                  <button
                    className={`absolute top-2.5 right-2.5 z-2 bg-black/40 border border-glass-border rounded-lg p-1.5 text-text-muted cursor-pointer transition-all opacity-0 hover:opacity-100 hover:bg-white/[0.1] hover:text-text-main ${
                      copiedId === msg.id ? '!opacity-100 !bg-emerald-500/15 !text-emerald-400 !border-emerald-500/20' : ''
                    }`}
                    onClick={() => onCopyMessage(msg.content, msg.id)}
                    title="Copiar texto">
                    {copiedId === msg.id ? <Check size={13} /> : <Copy size={13} />}
                  </button>
                )}
                <div className="text-sm md:text-[0.9rem] font-[350] leading-relaxed prose-legal">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                </div>
                {msg.modelPrompt && (
                  <div className="flex gap-3 mt-4 flex-wrap">
                    <button type="button"
                      className="rounded-full px-4 py-2.5 text-sm font-[450] cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-accent/10 border border-accent/20 text-accent hover:bg-accent/15 hover:border-accent/30"
                      onClick={() => onDownloadModel(msg.modelPrompt!.model, msg.modelPrompt!.purpose)}
                      disabled={loading || isAnyModelDownloading}>Sí, descargar modelo</button>
                    <button type="button"
                      className="rounded-full px-4 py-2.5 text-sm font-[350] cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed glass-panel-light text-text-sub hover:text-text-main"
                      onClick={() => onSkipDownload(msg.modelPrompt!.model)}
                      disabled={loading || isAnyModelDownloading}>No ahora</button>
                  </div>
                )}
                {msg.modelPrompts && msg.modelPrompts.length > 0 && (
                  <div className="flex gap-3 mt-4 flex-wrap">
                    <button type="button"
                      className="rounded-full px-4 py-2.5 text-sm font-[450] cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-accent/10 border border-accent/20 text-accent hover:bg-accent/15 hover:border-accent/30"
                      onClick={() => onDownloadMultiple(msg.modelPrompts!)}
                      disabled={loading || isAnyModelDownloading}>Sí, descargar {msg.modelPrompts.length} modelos</button>
                    <button type="button"
                      className="rounded-full px-4 py-2.5 text-sm font-[350] cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed glass-panel-light text-text-sub hover:text-text-main"
                      onClick={() => onSkipDownload(msg.modelPrompts!.map(m => m.model).join(' y '))}
                      disabled={loading || isAnyModelDownloading}>No ahora</button>
                    <div className="w-full mt-3 pt-3 border-t border-glass-border flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-text-muted font-[350]">O solo uno:</span>
                      {msg.modelPrompts.map(m => (
                        <button key={m.model} type="button"
                          className="bg-none border border-glass-border text-text-muted text-xs cursor-pointer px-2 py-1 rounded-full transition-all hover:text-text-sub hover:border-white/15 hover:bg-white/[0.03] disabled:opacity-40 disabled:cursor-not-allowed"
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
            <div className="flex w-full animate-message">
              <div className="flex items-center gap-4 px-4 py-2.5 text-accent/60 text-sm font-[350] glass-panel rounded-2xl">
                <div className="flex gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent/50 animate-bounce" style={{ animationDelay: '0s', animationDuration: '1.2s' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-accent/50 animate-bounce" style={{ animationDelay: '0.2s', animationDuration: '1.2s' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-accent/50 animate-bounce" style={{ animationDelay: '0.4s', animationDuration: '1.2s' }} />
                </div>
                <span>Analizando jurisprudencia…</span>
              </div>
            </div>
          )}

          <ModelDownloadBanner downloadStates={downloadStates} onCancel={onCancelDownload} />
          <div ref={messagesEndRef} style={{ height: '4px' }} />
        </div>
      </div>
      {showScrollBtn && (
        <button className="fixed bottom-28 right-8 z-20 w-10 h-10 rounded-full glass-panel border border-glass-border text-text-muted backdrop-blur-md cursor-pointer transition-all hover:bg-glass-hover hover:text-text-main flex items-center justify-center"
          onClick={scrollToBottom} title="Ir al final">↓</button>
      )}
    </>
  );
}

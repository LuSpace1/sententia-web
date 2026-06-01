import { useRef, useEffect, useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Check, Copy, Loader2 } from 'lucide-react';
import type { Chat, ModelPrompt } from '../types';
import ModelDownloadBanner from './ModelDownloadBanner';
import type { DownloadState } from '../types';

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
  activeChat,
  loading,
  downloadStates,
  onCopyMessage,
  onDownloadModel,
  onDownloadMultiple,
  onSkipDownload,
  onCancelDownload,
  copiedId,
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const isAnyModelDownloading = Object.keys(downloadStates).length > 0;

  const mdComponents = {
    p: ({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
      <p className="mb-4 last:mb-0" {...props}>{children}</p>
    ),
    h1: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
      <h1 className="text-lg font-semibold text-white/98 mt-6 mb-3" {...props}>{children}</h1>
    ),
    h2: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
      <h2 className="text-lg font-semibold text-white/98 mt-6 mb-3" {...props}>{children}</h2>
    ),
    h3: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
      <h3 className="text-lg font-semibold text-white/98 mt-6 mb-3" {...props}>{children}</h3>
    ),
    ul: ({ children, ...props }: React.HTMLAttributes<HTMLUListElement>) => (
      <ul className="pl-6 mb-4 list-disc" {...props}>{children}</ul>
    ),
    ol: ({ children, ...props }: React.HTMLAttributes<HTMLOListElement>) => (
      <ol className="pl-6 mb-4 list-decimal" {...props}>{children}</ol>
    ),
    li: ({ children, ...props }: React.HTMLAttributes<HTMLLIElement>) => (
      <li className="mb-2" {...props}>{children}</li>
    ),
    strong: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => (
      <strong className="font-semibold text-white" {...props}>{children}</strong>
    ),
    pre: ({ children, ...props }: React.HTMLAttributes<HTMLPreElement>) => (
      <pre className="bg-black/40 p-4 rounded-xl border border-white/5 overflow-x-auto my-4" {...props}>{children}</pre>
    ),
    code: ({ children, className, ...props }: React.HTMLAttributes<HTMLElement>) => {
      const isInline = !className;
      if (isInline) {
        return (
          <code className="bg-white/10 px-1.5 py-0.5 rounded text-sm" {...props}>{children}</code>
        );
      }
      return <code className="bg-transparent p-0" {...props}>{children}</code>;
    },
    blockquote: ({ children, ...props }: React.HTMLAttributes<HTMLQuoteElement>) => (
      <blockquote className="border-l-3 border-accent bg-white/[0.02] px-4 py-3 rounded-r-lg my-4 italic text-zinc-400" {...props}>{children}</blockquote>
    ),
  };

  return (
    <>
      <div className="flex-1 overflow-y-auto px-8 pt-[calc(70px+1rem)] pb-8 scroll-smooth flex flex-col items-center scrollbar-thin" ref={messagesContainerRef}>
        <div className="w-full max-w-[850px] flex flex-col gap-10">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex w-full animate-message-slide ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`relative max-w-[85%] leading-relaxed ${msg.role === 'assistant' ? 'bg-white/[0.06] backdrop-blur-xl border border-white/10 rounded-2xl rounded-tl p-5 shadow-lg' : 'bg-white/[0.03] border border-white/10 rounded-2xl rounded-tr px-5 py-3 backdrop-blur-md shadow-md'}`}>
                {msg.role === 'assistant' && (
                  <button
                    className={`absolute top-2 right-2 bg-black/30 border border-white/10 rounded-lg p-1.5 text-zinc-400 cursor-pointer transition-all opacity-0 hover:opacity-100 hover:bg-white/10 hover:text-white group-hover:opacity-100 ${copiedId === msg.id ? '!opacity-100 !bg-emerald-500/20 !text-emerald-400 !border-emerald-500/30' : ''}`}
                    onClick={() => onCopyMessage(msg.content, msg.id)}
                    title="Copiar texto"
                  >
                    {copiedId === msg.id ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                )}
                <div className="text-sm md:text-[0.95rem] [&_p]:mb-4 [&_p:last-child]:mb-0 [&_h1]:text-lg [&_h1]:font-semibold [&_h1]:text-white/98 [&_h1]:mt-6 [&_h1]:mb-3 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-white/98 [&_h2]:mt-6 [&_h2]:mb-3 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-white/98 [&_h3]:mt-6 [&_h3]:mb-3 [&_ul]:pl-6 [&_ul]:mb-4 [&_ol]:pl-6 [&_ol]:mb-4 [&_li]:mb-2 [&_strong]:font-semibold [&_strong]:text-white [&_pre]:bg-black/40 [&_pre]:p-4 [&_pre]:rounded-xl [&_pre]:border [&_pre]:border-white/5 [&_pre]:overflow-x-auto [&_pre]:my-4 [&_code]:bg-white/10 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_blockquote]:border-l-3 [&_blockquote]:border-accent [&_blockquote]:bg-white/[0.02] [&_blockquote]:px-4 [&_blockquote]:py-3 [&_blockquote]:rounded-r-lg [&_blockquote]:my-4 [&_blockquote]:italic [&_blockquote]:text-zinc-400">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.content}
                  </ReactMarkdown>
                </div>
                {msg.modelPrompt && (
                  <div className="flex gap-3 mt-4 flex-wrap">
                    <button
                      type="button"
                      className="rounded-full px-4 py-2.5 text-sm font-semibold cursor-pointer transition-all disabled:opacity-60 disabled:cursor-not-allowed bg-accent/15 text-[#a8c0ff] border border-accent/30 shadow-lg backdrop-blur-md hover:bg-accent/25 hover:border-accent/50 hover:-translate-y-0.5"
                      onClick={() => onDownloadModel(msg.modelPrompt!.model, msg.modelPrompt!.purpose)}
                      disabled={loading || isAnyModelDownloading}
                    >
                      Sí, descargar modelo
                    </button>
                    <button
                      type="button"
                      className="rounded-full px-4 py-2.5 text-sm font-semibold cursor-pointer transition-all disabled:opacity-60 disabled:cursor-not-allowed bg-white/[0.04] border border-white/10 text-white/95 hover:-translate-y-0.5"
                      onClick={() => onSkipDownload(msg.modelPrompt!.model)}
                      disabled={loading || isAnyModelDownloading}
                    >
                      No ahora
                    </button>
                  </div>
                )}
                {msg.modelPrompts && msg.modelPrompts.length > 0 && (
                  <div className="flex gap-3 mt-4 flex-wrap">
                    <button
                      type="button"
                      className="rounded-full px-4 py-2.5 text-sm font-semibold cursor-pointer transition-all disabled:opacity-60 disabled:cursor-not-allowed bg-accent/15 text-[#a8c0ff] border border-accent/30 shadow-lg backdrop-blur-md hover:bg-accent/25 hover:border-accent/50 hover:-translate-y-0.5"
                      onClick={() => onDownloadMultiple(msg.modelPrompts!)}
                      disabled={loading || isAnyModelDownloading}
                    >
                      Sí, descargar {msg.modelPrompts.length} modelos
                    </button>
                    <button
                      type="button"
                      className="rounded-full px-4 py-2.5 text-sm font-semibold cursor-pointer transition-all disabled:opacity-60 disabled:cursor-not-allowed bg-white/[0.04] border border-white/10 text-white/95 hover:-translate-y-0.5"
                      onClick={() => onSkipDownload(msg.modelPrompts!.map(m => m.model).join(' y '))}
                      disabled={loading || isAnyModelDownloading}
                    >
                      No ahora
                    </button>
                    <div className="w-full mt-3 pt-3 border-t border-white/[0.06] flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-zinc-400 whitespace-nowrap">O solo uno:</span>
                      {msg.modelPrompts.map(m => (
                        <button
                          key={m.model}
                          type="button"
                          className="bg-none border border-white/10 text-zinc-400 text-xs cursor-pointer px-2 py-1 rounded-full transition-all hover:text-zinc-300 hover:border-white/20 hover:bg-white/[0.04] disabled:opacity-40 disabled:cursor-not-allowed"
                          onClick={() => onDownloadModel(m.model, m.purpose)}
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
            <div className="flex w-full animate-message-slide">
              <div className="flex items-center gap-3 px-4 py-2 text-accent text-sm font-light opacity-80 mt-2">
                <Loader2 className="animate-spin-slow" size={16} />
                <span>Procesando...</span>
              </div>
            </div>
          )}

          <ModelDownloadBanner
            downloadStates={downloadStates}
            onCancel={onCancelDownload}
          />

          <div ref={messagesEndRef} style={{ height: '10px' }} />
        </div>
      </div>
      {showScrollBtn && (
        <button className="fixed bottom-24 right-8 z-20 w-10 h-10 rounded-full bg-white/10 border border-white/15 text-white/80 backdrop-blur-md cursor-pointer transition-all hover:bg-white/20 hover:text-white flex items-center justify-center" onClick={scrollToBottom} title="Ir al final">
          ↓
        </button>
      )}
    </>
  );
}

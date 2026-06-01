import { useRef, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

interface Props {
  input: string;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onChange: (value: string) => void;
  placeholder?: string;
  footerText?: string;
}

export default function ChatInput({
  input, loading, onSubmit, onChange,
  placeholder = 'Describa su situación aquí...',
  footerText,
}: Props) {
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (window.innerWidth > 860) inputRef.current?.focus();
  }, []);

  return (
    <>
      <form
        className="w-full max-w-[720px] bg-white/[0.01] border border-white/[0.04] rounded-2xl px-4 py-[11px] flex items-end gap-2 transition-all duration-300 focus-within:border-accent/15 focus-within:bg-accent/[0.004] focus-within:shadow-[inset_0_0_0_1px_rgba(201,168,76,0.03)]"
        onSubmit={onSubmit}>
        <textarea
          ref={inputRef}
          className="flex-1 bg-transparent border-none text-text-main text-sm resize-none max-h-[132px] min-h-[22px] outline-none leading-relaxed font-[350] placeholder:text-text-muted/30 placeholder:font-[300] transition-all scrollbar-thin"
          rows={1}
          placeholder={placeholder}
          value={input}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              onSubmit(e);
            }
          }}
          disabled={loading}
        />
        <button
          type="submit"
          className={`shrink-0 w-[34px] h-[34px] rounded-[10px] flex items-center justify-center transition-all duration-300 cursor-pointer disabled:cursor-not-allowed ${
            input.trim()
              ? 'bg-accent text-surface opacity-100 hover:bg-accent-light hover:shadow-[0_0_24px_-8px_rgba(201,168,76,0.4)]'
              : 'bg-transparent text-text-muted/15 opacity-30'
          }`}
          disabled={!input.trim() || loading}>
          <ArrowUp size={14} strokeWidth={2.5} />
        </button>
      </form>
      {footerText && (
        <p className="mt-2.5 text-[0.5rem] text-text-muted/30 uppercase tracking-[0.15em] font-[300] text-center">{footerText}</p>
      )}
    </>
  );
}

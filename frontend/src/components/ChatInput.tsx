import { useRef, useEffect } from 'react';
import { SendHorizontal } from 'lucide-react';

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
        className="w-full max-w-[800px] glass-panel rounded-2xl px-5 py-2 flex items-center transition-all duration-300 focus-within:border-accent/25 focus-within:shadow-[0_0_30px_rgba(201,168,76,0.06)]"
        onSubmit={onSubmit}>
        <textarea
          ref={inputRef}
          className="flex-1 bg-transparent border-none text-text-main text-base resize-none py-3 max-h-[140px] min-h-[24px] outline-none leading-relaxed font-[350] placeholder:text-text-muted transition-all"
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
          className={`ml-3 w-[44px] h-[44px] rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer disabled:cursor-not-allowed shrink-0 ${
            input.trim()
              ? 'bg-accent/10 border border-accent/25 text-accent hover:bg-accent/15 hover:border-accent/40 hover:shadow-[0_0_20px_rgba(201,168,76,0.1)]'
              : 'bg-white/[0.03] border border-glass-border text-text-muted'
          }`}
          disabled={!input.trim() || loading}>
          <SendHorizontal size={17} strokeWidth={2} />
        </button>
      </form>
      {footerText && (
        <p className="mt-3 text-[0.6rem] text-text-muted uppercase tracking-[0.12em] font-[350] text-center">{footerText}</p>
      )}
    </>
  );
}

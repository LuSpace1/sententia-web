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
        className="w-full max-w-[720px] bg-white/[0.02] border border-white/[0.04] rounded-2xl px-5 py-3 flex items-end gap-3 transition-all duration-300 focus-within:border-accent/20 focus-within:bg-accent/[0.01]"
        onSubmit={onSubmit}>
        <textarea
          ref={inputRef}
          className="flex-1 bg-transparent border-none text-text-main text-sm resize-none max-h-[144px] min-h-[24px] outline-none leading-relaxed font-[350] placeholder:text-text-muted/50 transition-all"
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
          className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 cursor-pointer disabled:cursor-not-allowed ${
            input.trim()
              ? 'bg-accent text-surface hover:bg-accent-light hover:shadow-[0_0_20px_-4px_rgba(201,168,76,0.3)]'
              : 'bg-white/[0.04] text-text-muted'
          }`}
          disabled={!input.trim() || loading}>
          <ArrowUp size={15} strokeWidth={2.5} />
        </button>
      </form>
      {footerText && (
        <p className="mt-3 text-[0.5rem] text-text-muted/40 uppercase tracking-[0.15em] font-[350] text-center">{footerText}</p>
      )}
    </>
  );
}

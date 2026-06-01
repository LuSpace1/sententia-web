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
  input,
  loading,
  onSubmit,
  onChange,
  placeholder = 'Describa su situación aquí...',
  footerText,
}: Props) {
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (window.innerWidth > 860) {
      inputRef.current?.focus();
    }
  }, []);

  return (
    <>
      <form
        className="w-full max-w-[850px] bg-white/[0.08] border border-white/10 rounded-2xl px-4 py-1.5 flex items-center transition-all focus-within:border-white/20 focus-within:bg-white/[0.12]"
        onSubmit={onSubmit}
      >
        <textarea
          ref={inputRef}
          className="flex-1 bg-transparent border-none text-white/95 text-base resize-none py-3 max-h-[150px] min-h-[24px] outline-none leading-relaxed placeholder:text-zinc-400"
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
          className={`ml-3 w-[46px] h-[46px] rounded-full flex items-center justify-center transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${
            input.trim()
              ? 'bg-white text-zinc-900 hover:scale-105 hover:shadow-[0_0_15px_rgba(255,255,255,0.2)]'
              : 'bg-white/[0.05] text-zinc-400'
          }`}
          disabled={!input.trim() || loading}
        >
          <SendHorizontal size={18} strokeWidth={2.5} />
        </button>
      </form>
      {footerText && (
        <p className="mt-3 text-[0.7rem] text-zinc-400 uppercase tracking-wider">{footerText}</p>
      )}
    </>
  );
}

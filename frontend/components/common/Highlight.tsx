import { useMemo } from 'react';

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

interface HighlightProps {
  text: string;
  keyword: string;
  className?: string;
}

export default function Highlight({ text, keyword, className = '' }: HighlightProps) {
  const parts = useMemo(() => {
    if (!keyword.trim() || !text) return [{ text, highlight: false }];
    const regex = new RegExp(`(${escapeRegExp(keyword.trim())})`, 'gi');
    const segments = text.split(regex);
    return segments.map((seg) => ({
      text: seg,
      highlight: regex.test(seg),
    }));
  }, [text, keyword]);

  return (
    <>
      {parts.map((part, idx) =>
        part.highlight ? (
          <mark
            key={idx}
            className={`rounded bg-brand-100 px-0.5 font-semibold text-brand-700 ${className}`}
          >
            {part.text}
          </mark>
        ) : (
          <span key={idx}>{part.text}</span>
        ),
      )}
    </>
  );
}

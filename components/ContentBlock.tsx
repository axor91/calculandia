'use client';

type ContentBlockProps = {
  html?: string;
  className?: string;
};

export default function ContentBlock({ html, className = '' }: ContentBlockProps) {
  if (!html) return null;

  return (
    <div 
      className={`prose prose-neutral max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
      suppressHydrationWarning
    />
  );
}


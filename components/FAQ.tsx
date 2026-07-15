"use client";

import { useState } from "react";

type FAQItem = {
  question: string;
  answer: string;
};

type FAQProps = {
  items: FAQItem[];
  className?: string;
};

export default function FAQ({ items, className = "" }: FAQProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (!items || items.length === 0) return null;

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <h2
        className="text-2xl font-bold text-neutral-900 mb-6"
        suppressHydrationWarning
      >
        Часто задаваемые вопросы
      </h2>

      {items.map((item, index) => (
        <div key={index} className="border-2 border-neutral-300">
          <button
            onClick={() => toggleItem(index)}
            className="w-full px-6 py-4 text-left bg-white flex items-center justify-between"
          >
            <span className="font-semibold text-neutral-900 pr-4">
              {item.question}
            </span>
            <svg
              className={`w-5 h-5 text-neutral-500 flex-shrink-0`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {openIndex === index && (
            <div className="px-6 py-4 bg-neutral-50 border-t-2 border-neutral-300">
              <p className="text-neutral-700 leading-relaxed">{item.answer}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

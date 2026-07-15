// Общие типы для калькуляторов

export type Calculator = {
  id: string;
  slug?: string;
  name: string;
  category: string;
  description: string;
  component: string;
  seo: {
    title: string;
    description: string;
    keywords: string[];
    robots?: string;
  };
  content?: {
    beforeCalculator?: string;
    afterCalculator?: string;
    faq?: Array<{ question: string; answer: string }>;
  };
  ads?: {
    topBanner?: { enabled: boolean; code?: string };
    sidebarBanner?: { enabled: boolean; code?: string };
    bottomBanner?: { enabled: boolean; code?: string };
  };
  schema?: {
    types?: string[]; // e.g. ["FAQPage","HowTo","Product"]
    extraJsonLd?: string; // additional JSON-LD
  };
};

export type Category = {
  id: string;
  name: string;
  description?: string;
  icon?: string;
};


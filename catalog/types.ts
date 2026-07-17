export type CategoryId =
  "matematika" | "finansy" | "data-i-vremya" | "stroitelstvo";

export type CalculatorSlug =
  | "procent-ot-chisla"
  | "procentnoe-izmenenie"
  | "drobi"
  | "proporcii"
  | "ipoteka"
  | "kredit"
  | "vklad"
  | "dosrochnoe-pogashenie"
  | "dni-mezhdu-datami"
  | "pribavit-k-date"
  | "vozrast"
  | "beton"
  | "plitka"
  | "oboi"
  | "srednee-znachenie"
  | "nod-nok"
  | "kvadratnoe-uravnenie"
  | "ploshchad-figur"
  | "slozhnyj-procent"
  | "nakopleniya"
  | "refinansirovanie"
  | "skidka"
  | "skolko-dnej-do"
  | "raznica-dat"
  | "den-nedeli"
  | "kalkulyator-vremeni"
  | "kraska"
  | "laminat"
  | "kirpich"
  | "shtukaturka";

export type CalculatorComponentId =
  | "percent-of-number"
  | "percent-change"
  | "fractions"
  | "proportion"
  | "mortgage"
  | "credit"
  | "deposit"
  | "early-repayment"
  | "days-between"
  | "add-date"
  | "age"
  | "concrete"
  | "tile"
  | "wallpaper"
  | "mean"
  | "gcd-lcm"
  | "quadratic-equation"
  | "shape-area"
  | "compound-interest"
  | "savings-goal"
  | "refinance"
  | "discount"
  | "countdown"
  | "date-difference"
  | "weekday"
  | "time-calculator"
  | "paint"
  | "laminate"
  | "brick"
  | "plaster";

export type SourceRecord = {
  title: string;
  href: string;
  type: "primary" | "reference" | "manufacturer";
  note: string;
};

export type WorkedExample = {
  title: string;
  input: string;
  result: string;
};

export type ContentSection = {
  heading: string;
  paragraphs: readonly string[];
  bullets?: readonly string[];
};

export type FaqItem = {
  question: string;
  answer: string;
};

export type CategoryDefinition = {
  id: CategoryId;
  slug: CategoryId;
  name: string;
  shortName: string;
  description: string;
  intro: string;
  accent: "teal" | "amber" | "violet" | "coral";
  guide: {
    title: string;
    paragraphs: readonly string[];
    tips: readonly string[];
    limitation: string;
  };
};

export type CalculatorDefinition = {
  slug: CalculatorSlug;
  path: `/kalkulyator/${CalculatorSlug}`;
  category: CategoryId;
  component: CalculatorComponentId;
  status: "published" | "draft";
  name: string;
  eyebrow: string;
  shortDescription: string;
  lead: string;
  aliases: readonly string[];
  seo: {
    title: string;
    description: string;
  };
  formula: string;
  formulas?: readonly { label: string; expression: string }[];
  formulaVersion: string;
  contentUpdatedAt: string;
  formulaReviewedAt: string;
  sourceCheckedAt: string;
  assumptions: readonly string[];
  roundingPolicy: string;
  sources: readonly SourceRecord[];
  examples: readonly WorkedExample[];
  sections: readonly ContentSection[];
  faq: readonly FaqItem[];
  related: readonly CalculatorSlug[];
  featured?: boolean;
};

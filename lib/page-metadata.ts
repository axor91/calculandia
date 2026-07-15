import type { Metadata } from "next";

const socialImage = "/opengraph-image.png";

export function createPageMetadata(
  title: string,
  description: string,
  path: string,
): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      title,
      description,
      url: path,
      siteName: "Calculandia",
      locale: "ru_RU",
      images: [
        {
          url: socialImage,
          alt: "Calculandia — понятные онлайн-калькуляторы",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [socialImage],
    },
  };
}

const target = "/kalkulyator/ipoteka";

export function GET() {
  return Response.redirect(new URL(target, "https://calculandia.ru"), 301);
}

export const HEAD = GET;

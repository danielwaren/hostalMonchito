export const prerender = false;

import type { APIRoute } from "astro";
import { client } from "@/lib/db";

function detectarDispositivo(ua: string): string {
  if (/mobile|android|iphone|ipad|ipod/i.test(ua)) return "móvil";
  if (/tablet|ipad/i.test(ua)) return "tablet";
  return "escritorio";
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const { pagina, referente } = await request.json();

    if (!pagina) return new Response("missing page", { status: 400 });

    const ua = request.headers.get("user-agent") ?? "";
    const pais = request.headers.get("x-vercel-ip-country") ?? null;
    const ciudad = request.headers.get("x-vercel-ip-city")
      ? decodeURIComponent(request.headers.get("x-vercel-ip-city")!)
      : null;

    await client.execute({
      sql: "INSERT INTO visitas (pagina, referente, dispositivo, pais, ciudad) VALUES (?, ?, ?, ?, ?)",
      args: [pagina, referente || null, detectarDispositivo(ua), pais, ciudad],
    });

    return new Response("ok", { status: 200 });
  } catch {
    return new Response("error", { status: 500 });
  }
};

import type { APIRoute } from "astro";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.PUBLIC_SUPABASE_URL,
  import.meta.env.PUBLIC_SUPABASE_ANON_KEY
);

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

    await supabase.from("visitas").insert([{
      pagina,
      referente: referente || null,
      dispositivo: detectarDispositivo(ua),
      pais,
      ciudad,
    }]);

    return new Response("ok", { status: 200 });
  } catch {
    return new Response("error", { status: 500 });
  }
};

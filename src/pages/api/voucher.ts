export const prerender = false;

import type { APIRoute } from "astro";
import { client } from "@/lib/db";

const DIAS_VIGENCIA = 30;

// Crea un voucher compartible y devuelve su enlace. Ruta protegida por el
// middleware: solo la crean administradores autenticados.
export const POST: APIRoute = async ({ request }) => {
  try {
    const { cliente, imagenBase64 } = await request.json();

    if (!cliente?.trim() || !imagenBase64) {
      return new Response(JSON.stringify({ error: "Datos incompletos" }), {
        status: 400,
      });
    }

    const token = crypto.randomUUID().replace(/-/g, "");
    const imagen = Buffer.from(imagenBase64, "base64");

    await client.execute({
      sql: `INSERT INTO vouchers (token, cliente, imagen, expira_at)
            VALUES (?, ?, ?, datetime('now', ?))`,
      args: [token, cliente.trim(), imagen, `+${DIAS_VIGENCIA} days`],
    });

    const origin = new URL(request.url).origin;
    return new Response(
      JSON.stringify({ url: `${origin}/v/${token}`, diasVigencia: DIAS_VIGENCIA }),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
};

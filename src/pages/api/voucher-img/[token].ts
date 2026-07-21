export const prerender = false;

import type { APIRoute } from "astro";
import { client } from "@/lib/db";

// Sirve la imagen del voucher. Pública: la abre el cliente, que no tiene
// sesión. El token aleatorio es lo que restringe el acceso.
export const GET: APIRoute = async ({ params }) => {
  const token = params.token?.replace(/\.jpg$/, "") ?? "";

  const r = await client.execute({
    sql: `SELECT imagen FROM vouchers
          WHERE token = ? AND datetime('now') < expira_at`,
    args: [token],
  });

  if (r.rows.length === 0) {
    return new Response("Voucher no disponible", { status: 404 });
  }

  const imagen = r.rows[0].imagen as ArrayBuffer;
  return new Response(imagen, {
    status: 200,
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "public, max-age=86400",
    },
  });
};

export const prerender = false;

import type { APIRoute } from "astro";
import { client } from "@/lib/db";

export const GET: APIRoute = async ({ url }) => {
  try {
    const dias = Number(url.searchParams.get("dias") ?? 30);
    const result = await client.execute({
      sql: `SELECT * FROM visitas WHERE created_at >= datetime('now', ?) ORDER BY created_at ASC`,
      args: [`-${dias} days`],
    });
    const visitas = result.rows.map((r) => ({
      ...r,
      created_at: `${(r.created_at as string).replace(" ", "T")}Z`,
    }));
    return new Response(JSON.stringify(visitas), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
};

export const prerender = false;

import type { APIRoute } from "astro";
import { client } from "@/lib/db";

export const GET: APIRoute = async () => {
  try {
    const result = await client.execute(
      "SELECT * FROM servicios_hospedaje ORDER BY created_at DESC"
    );
    const clientes = result.rows.map((r) => ({
      id: r.id,
      nombre_cliente: r.nombre_cliente,
      servicios: JSON.parse(r.servicios as string),
      created_at: r.created_at,
    }));
    return new Response(JSON.stringify(clientes), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const { id, nombre_cliente, servicios } = await request.json();
    if (id) {
      await client.execute({
        sql: "UPDATE servicios_hospedaje SET nombre_cliente = ?, servicios = ? WHERE id = ?",
        args: [nombre_cliente, JSON.stringify(servicios), id],
      });
    } else {
      await client.execute({
        sql: "INSERT INTO servicios_hospedaje (nombre_cliente, servicios) VALUES (?, ?)",
        args: [nombre_cliente, JSON.stringify(servicios)],
      });
    }
    return new Response(JSON.stringify({ success: true }), { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ request }) => {
  try {
    const { nombre_cliente } = await request.json();
    await client.execute({
      sql: "DELETE FROM servicios_hospedaje WHERE nombre_cliente = ?",
      args: [nombre_cliente],
    });
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
};

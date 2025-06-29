export const prerender = false;

import type { APIRoute } from "astro";
import { client } from "@/lib/db";    

/* ─────────────────────────  GET  ───────────────────────── */
export const GET: APIRoute = async () => {
  try {
    const result = await client.execute("SELECT * FROM ventas");
    return new Response(JSON.stringify(result.rows), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
  return new Response(JSON.stringify({ error: message }), {
    status: 500,
  });
  }
};


/* ─────────────────────────  POST  ───────────────────────── */
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const {
      tipo_venta,
      cliente,
      monto,
      metodo_pago,
      fecha,
      descripcion,
      numero_factura,
      tipo_documento,
    } = body;

    const query = `
      INSERT INTO ventas
      (tipo_venta, cliente, monto, metodo_pago, fecha,
       descripcion, numero_factura, tipo_documento)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const args = [
      tipo_venta,
      cliente,
      parseFloat(monto),
      metodo_pago,
      fecha,
      descripcion,
      numero_factura,
      tipo_documento,
    ];

    await client.execute({ sql: query, args });
    return new Response(JSON.stringify({ success: true }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("❌ Error al guardar en Turso:", err);
    return new Response(JSON.stringify({ error: "failed" }), { status: 500 });
  }
};
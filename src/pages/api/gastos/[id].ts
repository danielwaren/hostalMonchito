import type { APIRoute } from "astro";
import { client } from "../../../lib/db"; // ajusta la ruta si tu lib/db está en otro lugar

// Esta es una ruta de API que se renderiza en el servidor
export const prerender = false;

export const PUT: APIRoute = async ({ params, request }) => {
  const id = params.id;                   // /api/ventas/123 → id = "123"
  const data = await request.json();      // { cliente: "...", monto: 123, ... }

  // ⚠️ Ajusta este UPDATE con los campos reales de tu tabla.
  // Aquí suponemos cliente, monto, fecha.
  try {
    await client.execute({
      sql: `UPDATE gastos
            SET cliente = ?, monto = ?, fecha = ?
            WHERE id = ?`,
      args: [data.cliente, data.monto, data.fecha, id],
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ params }) => {
  const id = params.id;
  
  if (!id) {
    return new Response(
      JSON.stringify({ success: false, error: 'ID de gasto no proporcionado' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Eliminamos la venta con el ID proporcionado
    await client.execute({
      sql: 'DELETE FROM gastos WHERE id = ?',
      args: [id],
    });

    return new Response(
      JSON.stringify({ success: true, message: 'Gasto eliminada correctamente' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error al eliminar el gasto';
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

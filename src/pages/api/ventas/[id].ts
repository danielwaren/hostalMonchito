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
      sql: `UPDATE ventas
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

//Agregar Venta
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { cliente, descripcion, monto, fecha } = body;

    // 🐛 Debug: Mostrar los datos que llegan
    console.log('📥 Datos recibidos para nueva venta:', body);

    // Ejecutar la inserción en la base de datos
    const result = await client.execute({
      sql: 'INSERT INTO ventas (cliente, descripcion, monto, fecha) VALUES (?, ?, ?, ?)',
      args: [cliente, descripcion, monto, fecha],
    });

    // 🐛 Debug: Ver el resultado de la consulta
    console.log('✅ Resultado de la inserción:', result);

    return new Response(JSON.stringify({ message: 'Venta creada' }), { status: 201 });
  } catch (error) {
    console.error('❌ Error al crear venta:', error);
    return new Response(JSON.stringify({ error: 'Error al crear venta' }), { status: 500 });
  }
};

//Eliminar Venta
export const DELETE: APIRoute = async ({ params }) => {
  const id = params.id;
  
  if (!id) {
    return new Response(
      JSON.stringify({ success: false, error: 'ID de venta no proporcionado' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Primero verificamos si la venta existe
    const checkResult = await client.execute({
      sql: 'SELECT id FROM ventas WHERE id = ?',
      args: [id],
    });

    if (checkResult.rows.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'La venta no existe' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Eliminamos la venta con el ID proporcionado
    await client.execute({
      sql: 'DELETE FROM ventas WHERE id = ?',
      args: [id],
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Venta eliminada correctamente',
        deletedId: id 
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error al eliminar venta:', error);
    const msg = error instanceof Error ? error.message : 'Error al eliminar la venta';
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};


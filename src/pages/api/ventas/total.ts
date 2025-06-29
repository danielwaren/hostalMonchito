import { client } from '../../../lib/db';

const jsonResponse = (data: object, status = 200) => new Response(
  JSON.stringify(data),
  {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  }
);

const handleDatabaseError = (error: unknown) => {
  console.error('Error en la base de datos:', error);
  return jsonResponse({
    error: 'Error en la base de datos',
    details: error instanceof Error ? error.message : 'Error desconocido',
  }, 500);
};

export async function GET() {
  try {
    // 1. Verificar si la tabla "ventas" existe
    const tables = await client.execute(
      'SELECT name FROM sqlite_master WHERE type="table"'
    );
    const tablaExiste = tables.rows.some(
      (r: any) => r.name?.toLowerCase() === 'ventas'
    );

    if (!tablaExiste) {
      return jsonResponse({
        total: 0,
        mensaje: 'La tabla "ventas" no fue encontrada en la base de datos',
        success: true,
        tablasEncontradas: tables.rows.map((r: any) => r.name),
      });
    }

    // 2. Verificar si hay registros
    const countResult = await client.execute(
      'SELECT COUNT(*) as count FROM ventas'
    );
    const cantidad = Number(countResult.rows[0]?.count || 0);

    if (cantidad === 0) {
      return jsonResponse({
        total: 0,
        mensaje: 'No hay registros en la tabla "ventas"',
        success: true,
      });
    }

    // 3. Obtener suma total
    const sumResult = await client.execute(
      'SELECT SUM(CAST(monto AS REAL)) as total FROM ventas'
    );
    const total = parseFloat(sumResult.rows[0]?.total || 0);

    return jsonResponse({
      total: Number(total.toFixed(2)),
      success: true,
    });
  } catch (error: unknown) {
    return handleDatabaseError(error);
  }
}

export const prerender = false;

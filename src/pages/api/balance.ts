import { client } from '../../lib/db';

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

const verificarTablaYObtenerTotal = async (nombreTabla: string) => {
  // Verificar si la tabla existe
  const tables = await client.execute(
    'SELECT name FROM sqlite_master WHERE type="table"'
  );
  const tablaExiste = tables.rows.some(
    (r: any) => r.name?.toLowerCase() === nombreTabla.toLowerCase()
  );

  if (!tablaExiste) {
    return { total: 0, existe: false, registros: 0 };
  }

  // Verificar cantidad de registros
  const countResult = await client.execute(
    `SELECT COUNT(*) as count FROM ${nombreTabla}`
  );
  const cantidad = Number(countResult.rows[0]?.count || 0);

  if (cantidad === 0) {
    return { total: 0, existe: true, registros: 0 };
  }

  // Obtener suma total
  const sumResult = await client.execute(
    `SELECT SUM(CAST(monto AS REAL)) as total FROM ${nombreTabla}`
  );
  const total = parseFloat(sumResult.rows[0]?.total || 0);

  return { 
    total: Number(total.toFixed(2)), 
    existe: true, 
    registros: cantidad 
  };
};

export async function GET() {
  try {
    // Obtener totales de ambas tablas en paralelo
    const [ventasData, gastosData] = await Promise.all([
      verificarTablaYObtenerTotal('ventas'),
      verificarTablaYObtenerTotal('gastos')
    ]);

    const balance = ventasData.total - gastosData.total;

    return jsonResponse({
      ventas: {
        total: ventasData.total,
        existe: ventasData.existe,
        registros: ventasData.registros
      },
      gastos: {
        total: gastosData.total,
        existe: gastosData.existe,
        registros: gastosData.registros
      },
      balance: Number(balance.toFixed(2)),
      success: true,
    });

  } catch (error: unknown) {
    return handleDatabaseError(error);
  }
}

export const prerender = false;
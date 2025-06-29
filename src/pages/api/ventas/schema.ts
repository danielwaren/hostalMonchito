import { client } from '../../../lib/db';

export async function GET() {
  try {
    console.log('Obteniendo esquema de la tabla ventas...');
    // Consulta para obtener la estructura de la tabla ventas
    const result = await client.execute('PRAGMA table_info(ventas)');
    console.log('Esquema de la tabla ventas:', result);
    
    // Consulta para obtener los primeros 5 registros
    const sampleData = await client.execute('SELECT * FROM ventas LIMIT 5');
    console.log('Primeros 5 registros de ventas:', sampleData);
    
    return new Response(JSON.stringify({
      schema: result.rows,
      sampleData: sampleData.rows
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    console.error('Error al obtener el esquema de la tabla ventas:', errorMessage);
    return new Response(JSON.stringify({ 
      error: 'Error al obtener el esquema de la tabla ventas',
      details: errorMessage 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export const prerender = false;

// /src/pages/api/uploadcsv.ts
export const prerender = false; // Habilita servidor para este endpoint

import type { APIRoute } from 'astro';
import { supabase } from '@/lib/supabase';

// Función para detectar el separador y parsear CSV
// Función para normalizar formato chileno a número real
function normalizarNumero(valor: string | null | undefined): number {
  if (!valor) return 0;
  // Eliminar puntos de miles y cambiar coma por punto decimal
  const limpio = valor.replace(/\./g, '').replace(',', '.');
  const numero = parseFloat(limpio);
  return isNaN(numero) ? 0 : numero;
}

// Función para detectar el separador y parsear CSV
function parseCSV(csvText: string): any[] {
  const lines = csvText.trim().split('\n');
  if (lines.length === 0) return [];

  const firstLine = lines[0];
  const separator = firstLine.includes(';') ? ';' : ',';
  console.log('Separador detectado:', separator);

  const headers = firstLine.split(separator).map(header => header.trim().replace(/"/g, ''));
  console.log('Headers encontrados:', headers);

  const camposNumericos = ['Abonos', 'Cargos', 'Saldo', 'Monto', 'Valor', 'Precio'];

  const data = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = line.split(separator).map(value => value.trim().replace(/"/g, ''));
    if (values.length === headers.length) {
      const row: any = {};

      headers.forEach((header, index) => {
        const value = values[index];

        if (camposNumericos.includes(header)) {
          row[header] = normalizarNumero(value);
        } else {
          row[header] = value || null;
        }
      });

      data.push(row);
    } else {
      console.warn(`Línea ${i + 1} tiene ${values.length} valores pero se esperaban ${headers.length}:`, values);
    }
  }

  console.log('Ejemplo de primer registro:', data[0]);
  return data;
}


export const POST: APIRoute = async ({ request }) => {
  try {
    console.log('=== INICIO PROCESO UPLOAD CSV ===');
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    console.log('Archivo recibido:', file?.name);

    if (!file) {
      console.log('ERROR: No se encontró archivo');
      return new Response(
        JSON.stringify({ message: 'No se encontró archivo' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Leer el contenido del archivo
    console.log('Leyendo contenido del archivo...');
    const contenidoCSV = await file.text();
    console.log('Contenido leído, longitud:', contenidoCSV.length);
    
    // Parsear el CSV
    console.log('Parseando CSV...');
    try {
      const datos = parseCSV(contenidoCSV);
      console.log('Datos parseados:', datos.length, 'registros');
      
      if (datos.length === 0) {
        console.log('ERROR: El archivo CSV está vacío o mal formateado');
        return new Response(
          JSON.stringify({ message: 'El archivo CSV está vacío o mal formateado' }),
          { 
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      // Iniciar transacción: primero guardar el archivo en Cartolas
      console.log('Guardando archivo en tabla Cartolas...');
      const { data: cartolaGuardada, error: errorCartola } = await supabase
        .from('Cartolas')
        .insert({
          nombre_archivo: file.name,
          contenido_csv: contenidoCSV,
          fecha_subida: new Date().toISOString()
        })
        .select()
        .single();

      if (errorCartola) {
        console.error('Error al guardar cartola:', errorCartola);
        return new Response(
          JSON.stringify({ 
            message: 'Error al guardar el archivo',
            error: errorCartola.message,
            details: errorCartola
          }),
          { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      console.log('Cartola guardada con ID:', cartolaGuardada.id);

      // Agregar la referencia de cartola_id a cada registro
      console.log('Preparando datos para insertar en tabla Cartola...');
      const datosConCartola = datos.map(fila => ({
        ...fila,
        cartola_id: cartolaGuardada.id
      }));

      // Insertar los datos en la tabla Cartola
      console.log('Insertando', datosConCartola.length, 'registros en tabla Cartola...');
      const { data: datosGuardados, error: errorDatos } = await supabase
        .from('Cartola')
        .insert(datosConCartola);

      if (errorDatos) {
        console.error('Error al insertar datos:', errorDatos);
        
        // Si falla la inserción de datos, eliminar la cartola guardada
        console.log('Eliminando cartola debido a error en inserción de datos...');
        await supabase
          .from('Cartolas')
          .delete()
          .eq('id', cartolaGuardada.id);

        return new Response(
          JSON.stringify({ 
            message: 'Error al insertar los datos en la base de datos',
            error: errorDatos.message,
            details: errorDatos
          }),
          { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      console.log('=== PROCESO COMPLETADO EXITOSAMENTE ===');
      return new Response(
        JSON.stringify({
          message: 'Archivo procesado correctamente',
          registros_procesados: datos.length,
          cartola_id: cartolaGuardada.id
        }),
        { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );

    } catch (parseError) {
      console.error('Error al parsear CSV:', parseError);
      return new Response(
        JSON.stringify({ 
          message: 'Error al parsear el archivo CSV',
          error: parseError instanceof Error ? parseError.message : String(parseError)
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

  } catch (error) {
    console.error('Error general:', error);
    return new Response(
      JSON.stringify({ 
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};
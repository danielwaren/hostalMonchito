import { createClient } from "@libsql/client";
import type { LibSQLClient } from "@libsql/client";
import dotenv from "dotenv";

dotenv.config();

// Validar variables de entorno
console.log('Verificando variables de entorno...');
console.log('NODE_ENV:', process.env.NODE_ENV);

if (!process.env.DATABASE_URL) {
  const errorMsg = 'DATABASE_URL no está definido en el archivo .env';
  console.error('Error de configuración:', errorMsg);
  throw new Error(errorMsg);
}

// No mostrar el token completo por seguridad
console.log('Conectando a la base de datos...');
console.log('URL de la base de datos:', process.env.DATABASE_URL);
console.log('AUTH_TOKEN está', process.env.DATABASE_AUTH_TOKEN ? 'definido' : 'NO definido');

let client: LibSQLClient;

try {
  console.log('Inicializando cliente de base de datos...');
  client = createClient({
    url: process.env.DATABASE_URL,
    authToken: process.env.DATABASE_AUTH_TOKEN,
  });
  
  // Probar la conexión con una consulta simple
  console.log('Probando conexión a la base de datos...');
  await client.execute('SELECT 1 as test');
  
  console.log('✓ Conexión a la base de datos establecida correctamente');
} catch (error: unknown) {
  const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
  console.error('❌ Error al conectar a la base de datos:', errorMessage);
  
  if (error instanceof Error) {
    console.error('Stack trace:', error.stack);
  }
  
  throw new Error(`No se pudo conectar a la base de datos: ${errorMessage}`);
}

export { client };

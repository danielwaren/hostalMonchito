import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableFooter,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

interface Venta {
  id: number;
  [key: string]: any;
}

interface Cartola {
  id: string;
  nombre_archivo: string;
  fecha_subida: string;
  total_registros?: number; // Opcional ya que lo calcularemos dinámicamente
}

export default function UploadAndShowCSV() {
  const [file, setFile] = useState<File | null>(null);
  const [loadingUpload, setLoadingUpload] = useState(false);

  const [ventas, setVentas] = useState<Venta[]>([]);
  const [loadingVentas, setLoadingVentas] = useState(true);

  // Estado para los archivos cartolas
  const [cartolas, setCartolas] = useState<Cartola[]>([]);
  const [loadingCartolas, setLoadingCartolas] = useState(true);

  const headers = ventas.length
    ? Object.keys(ventas[0]).filter(
        (key) => !["id", "created_at", "Abonos", "Saldo", "cartola_id"].includes(key)
      )
    : [];

  // Función para cargar los datos desde Supabase
  const fetchVentas = async () => {
    setLoadingVentas(true);
    const { data, error } = await supabase
      .from("Cartola")
      .select("*")
      .order("id", { ascending: false });
    if (error) {
      toast.error("Error al cargar datos: " + error.message);
    } else {
      setVentas(data || []);
    }
    setLoadingVentas(false);
  };

  // Función para cargar las cartolas archivadas con conteo dinámico
  const fetchCartolas = async () => {
    setLoadingCartolas(true);
    
    try {
      // Obtener las cartolas básicas
      const { data: cartolasData, error: cartolasError } = await supabase
        .from("Cartolas")
        .select("id, nombre_archivo, fecha_subida")
        .order("fecha_subida", { ascending: false });

      if (cartolasError) throw cartolasError;

      // Para cada cartola, contar los registros en la tabla Cartola
      const cartolasConConteo = await Promise.all(
        (cartolasData || []).map(async (cartola) => {
          const { count, error: countError } = await supabase
            .from("Cartola")
            .select("*", { count: "exact", head: true })
            .eq("cartola_id", cartola.id);

          if (countError) {
            console.error("Error al contar registros:", countError);
            return { ...cartola, total_registros: 0 };
          }

          return { ...cartola, total_registros: count || 0 };
        })
      );

      setCartolas(cartolasConConteo);
    } catch (error: any) {
      toast.error("Error al cargar cartolas: " + error.message);
      setCartolas([]);
    }
    
    setLoadingCartolas(false);
  };

  useEffect(() => {
    fetchVentas();
    fetchCartolas();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      setFile(e.target.files[0]);
    }
  };

  const uploadCSV = async () => {
    if (!file) {
      toast.error("Por favor, selecciona un archivo CSV");
      return;
    }

    setLoadingUpload(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/uploadcsv", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(
          errorData?.message || `Error ${res.status}: ${res.statusText}`
        );
      }

      const result = await res.json();
      toast.success(`Archivo subido correctamente. ${result.registros_procesados} registros importados`);
      setFile(null);
      
      // Recargar ambas tablas después de subir
      await Promise.all([fetchVentas(), fetchCartolas()]);

    } catch (error: any) {
      toast.error("Error al subir archivo: " + (error.message || error));
    } finally {
      setLoadingUpload(false);
    }
  };

  const eliminarCartola = async (cartolaId: string, nombreArchivo: string) => {
    if (!confirm(`¿Estás seguro de eliminar la cartola "${nombreArchivo}"? Esto eliminará también todos sus datos.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from("Cartolas")
        .delete()
        .eq("id", cartolaId);

      if (error) throw error;

      toast.success("Cartola eliminada correctamente");
      // Recargar ambas tablas
      await Promise.all([fetchVentas(), fetchCartolas()]);
    } catch (error: any) {
      toast.error("Error al eliminar cartola: " + error.message);
    }
  };

  const descargarCartola = async (cartolaId: string, nombreArchivo: string) => {
    try {
      const { data, error } = await supabase
        .from("Cartolas")
        .select("contenido_csv")
        .eq("id", cartolaId)
        .single();

      if (error) throw error;

      // Crear y descargar el archivo
      const blob = new Blob([data.contenido_csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = nombreArchivo;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Archivo descargado correctamente");
    } catch (error: any) {
      toast.error("Error al descargar archivo: " + error.message);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Importar CSV a Cartola</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            disabled={loadingUpload}
          />
          <Button
            onClick={uploadCSV}
            disabled={loadingUpload || !file}
            className="w-full"
          >
            {loadingUpload ? "Subiendo..." : "Subir CSV"}
          </Button>
        </CardContent>
      </Card>

      {/* Tabla de Cartolas archivadas */}
      <Card>
        <CardHeader>
          <CardTitle>Cartolas Archivadas</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loadingCartolas ? (
            <p className="p-4 text-center">Cargando cartolas...</p>
          ) : (
            <Table>
              <TableCaption>Archivos CSV subidos</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre del Archivo</TableHead>
                  <TableHead>Fecha de Subida</TableHead>
                  <TableHead>Total Registros</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cartolas.map((cartola) => (
                  <TableRow key={cartola.id}>
                    <TableCell>{cartola.nombre_archivo}</TableCell>
                    <TableCell>
                      {new Date(cartola.fecha_subida).toLocaleDateString('es-ES')}
                    </TableCell>
                    <TableCell>{cartola.total_registros || 0}</TableCell>
                    <TableCell className="space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => descargarCartola(cartola.id, cartola.nombre_archivo)}
                      >
                        Descargar
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => eliminarCartola(cartola.id, cartola.nombre_archivo)}
                      >
                        Eliminar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
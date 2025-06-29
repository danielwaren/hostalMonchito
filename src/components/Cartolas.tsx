import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableCaption,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";

interface Cartola {
  id: number;
  nombre_archivo: string;
  fecha_subida: string;
  total_registros?: number;
}

interface CartolaDetalle {
  id: number;
  Fecha: string;
  Operacion: string | number;
  Descripcion: string;
  Abonos: number | null;
  Cargos: number | null;
  Saldo: string;
}

export default function CartolasArchivadas() {
  const [cartolas, setCartolas] = useState<Cartola[]>([]);
  const [loadingCartolas, setLoadingCartolas] = useState(true);

  const [detallesAbiertos, setDetallesAbiertos] = useState(false);
  const [detalleCartola, setDetalleCartola] = useState<CartolaDetalle[]>([]);
  const [detalleNombre, setDetalleNombre] = useState("");

  useEffect(() => {
    const fetchCartolas = async () => {
      setLoadingCartolas(true);

      const { data, error } = await supabase
        .from("Cartolas")
        .select("id, nombre_archivo, fecha_subida")
        .order("nombre_archivo", { ascending: true });

      if (error) {
        console.error("Error al obtener cartolas:", error.message);
        setCartolas([]);
      } else if (data) {
        const cartolasConConteo = await Promise.all(
          data.map(async (cartola) => {
            const { count } = await supabase
              .from("Cartola")
              .select("*", { count: "exact", head: true })
              .eq("cartola_id", cartola.id);

            return {
              ...cartola,
              total_registros: count || 0,
            };
          })
        );
        setCartolas(cartolasConConteo);
      }

      setLoadingCartolas(false);
    };

    fetchCartolas();
  }, []);

  function convertirA_CSV(data: any[]): string {
    if (data.length === 0) return "";

    const headers = Object.keys(data[0]);
    const escape = (value: any) =>
      `"${String(value).replace(/"/g, '""')}"`;

    const csvRows = [
      headers.join(";"),
      ...data.map((row) =>
        headers.map((field) => escape(row[field] ?? "")).join(";")
      ),
    ];

    return csvRows.join("\n");
  }

  const descargarCartola = async (id: number, nombre: string) => {
    const { data, error } = await supabase
      .from("Cartola")
      .select("*")
      .eq("cartola_id", id);

    if (error || !data) {
      alert("Error al obtener registros: " + error?.message);
      return;
    }

    const csv = convertirA_CSV(data);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.setAttribute("download", nombre.replace(/\.[^/.]+$/, "") + ".csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const eliminarCartola = async (id: number, nombre: string) => {
    if (!confirm(`¿Estás seguro de eliminar la cartola "${nombre}"?`)) return;

    const { error } = await supabase
      .from("Cartolas")
      .delete()
      .eq("id", id);

    if (error) {
      alert("Error al eliminar: " + error.message);
    } else {
      setCartolas((prev) => prev.filter((c) => c.id !== id));
    }
  };

  const abrirDetalles = async (id: number, nombre: string) => {
    setDetalleNombre(nombre);
    setDetallesAbiertos(true);

    const { data, error } = await supabase
      .from("Cartola")
      .select("id, Fecha, Operacion, Descripcion, Abonos, Cargos, Saldo")
      .eq("cartola_id", id)
      .order("Fecha", { ascending: true });

    if (error || !data) {
      alert("Error al cargar detalles: " + error?.message);
      setDetalleCartola([]);
      return;
    }

    setDetalleCartola(data);
  };

  return (
    <>
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
                      {new Date(cartola.fecha_subida).toLocaleDateString("es-CL")}
                    </TableCell>
                    <TableCell>{cartola.total_registros}</TableCell>
                    <TableCell className="space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          descargarCartola(cartola.id, cartola.nombre_archivo)
                        }
                      >
                        Descargar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          abrirDetalles(cartola.id, cartola.nombre_archivo)
                        }
                      >
                        Detalles
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() =>
                          eliminarCartola(cartola.id, cartola.nombre_archivo)
                        }
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

      {/* Modal para mostrar detalles */}
      {detallesAbiertos && (
        <Dialog open={detallesAbiertos} onOpenChange={setDetallesAbiertos}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>Detalles de: {detalleNombre}</DialogTitle>
            </DialogHeader>
            {detalleCartola.length === 0 ? (
              <p className="p-4 text-center">No hay registros para mostrar.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Operacion</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Abonos</TableHead>
                    <TableHead>Cargos</TableHead>
                    <TableHead>Saldo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detalleCartola.map((fila) => (
                    <TableRow key={fila.id}>
                      <TableCell>{fila.Fecha}</TableCell>
                      <TableCell>{fila.Operacion}</TableCell>
                      <TableCell>{fila.Descripcion}</TableCell>
                      <TableCell>{fila.Abonos ?? "-"}</TableCell>
                      <TableCell>{fila.Cargos ?? "-"}</TableCell>
                      <TableCell>{fila.Saldo}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            <div className="flex justify-end mt-4">
              <Button variant="outline" onClick={() => setDetallesAbiertos(false)}>
                Cerrar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

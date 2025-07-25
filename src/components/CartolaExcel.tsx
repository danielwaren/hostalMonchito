import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import * as XLSX from "xlsx";

interface Venta {
  id: number;
  [key: string]: any;
}

interface Cartola {
  id: string;
  nombre_archivo: string;
  fecha_subida: string;
  total_registros?: number;
}

export default function UploadExcelToSupabase() {
  const [file, setFile] = useState<File | null>(null);
  const [loadingUpload, setLoadingUpload] = useState(false);

  const [ventas, setVentas] = useState<Venta[]>([]);
  const [loadingVentas, setLoadingVentas] = useState(true);

  const [cartolas, setCartolas] = useState<Cartola[]>([]);
  const [loadingCartolas, setLoadingCartolas] = useState(true);

  const [data, setData] = useState<any[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);

  // Mapa meses para parseo fechas abreviadas
  const monthMap: Record<string, number> = {
    ene: 0, enero: 0,
    feb: 1, febrero: 1,
    mar: 2, marzo: 2,
    abr: 3, abril: 3,
    may: 4, mayo: 4,
    jun: 5, junio: 5,
    jul: 6, julio: 6,
    ago: 7, agosto: 7,
    sep: 8, sept: 8, septiembre: 8,
    oct: 9, octubre: 9,
    nov: 10, noviembre: 10,
    dic: 11, diciembre: 11,
  };

  function parseCustomDate(dateStr: string): string | null {
    const parts = dateStr.trim().toLowerCase().split("/");
    if (parts.length !== 2) return null;

    const day = parseInt(parts[0], 10);
    const monthStr = parts[1];

    if (isNaN(day)) return null;

    const month = monthMap[monthStr];
    if (month === undefined) return null;

    const year = new Date().getFullYear();

    const dateObj = new Date(year, month, day);
    if (isNaN(dateObj.getTime())) return null;

    const yyyy = dateObj.getFullYear();
    const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
    const dd = String(dateObj.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  // Carga datos y prepara tabla editable
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setFile(selected);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      if (!bstr) return;
      const wb = XLSX.read(bstr, { type: "binary", cellDates: true });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const jsonData: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

      // Eliminar líneas 0-17 y 55-57 (como antes)
      const filteredData = jsonData.filter((_, idx) => idx >= 18 && (idx < 55 || idx > 57));
      const [headerRow, ...rows] = filteredData;

      const correctedHeaders = headerRow.map((h) => {
        if (h === "Operación" || h === "N° Operación") return "Operacion";
        if (h === "Descripción") return "Descripcion";
        return h;
      });

      const fechaIdx = correctedHeaders.findIndex(h => h === "Fecha");
      const formattedRows = rows.map((row, rowIdx) => {
        if (fechaIdx !== -1 && row[fechaIdx]) {
          const value = row[fechaIdx];
          if (typeof value === "number") {
            const dateObj = XLSX.SSF.parse_date_code(value);
            if (dateObj) {
              const yyyy = dateObj.y;
              const mm = String(dateObj.m).padStart(2, "0");
              const dd = String(dateObj.d).padStart(2, "0");
              row[fechaIdx] = `${yyyy}-${mm}-${dd}`;
            }
          } else if (typeof value === "string") {
            const parsed = parseCustomDate(value);
            if (parsed) row[fechaIdx] = parsed;
            else {
              const parsedDate = new Date(value);
              if (!isNaN(parsedDate.getTime())) {
                const yyyy = parsedDate.getFullYear();
                const mm = String(parsedDate.getMonth() + 1).padStart(2, "0");
                const dd = String(parsedDate.getDate()).padStart(2, "0");
                row[fechaIdx] = `${yyyy}-${mm}-${dd}`;
              }
            }
          } else if (value instanceof Date) {
            if (!isNaN(value.getTime())) {
              const yyyy = value.getFullYear();
              const mm = String(value.getMonth() + 1).padStart(2, "0");
              const dd = String(value.getDate()).padStart(2, "0");
              row[fechaIdx] = `${yyyy}-${mm}-${dd}`;
            }
          }
        }
        return row;
      });

      setHeaders(correctedHeaders);
      setData(formattedRows);
    };
    reader.readAsBinaryString(selected);
  };

  // Actualiza una celda
  const handleEditCell = (rowIdx: number, colIdx: number, value: string) => {
    const newData = [...data];
    newData[rowIdx][colIdx] = value;
    setData(newData);
  };

  // Elimina fila
  const handleDeleteRow = (rowIdx: number) => {
    const newData = data.filter((_, idx) => idx !== rowIdx);
    setData(newData);
  };

  // Cambia header
  const handleHeaderChange = (colIdx: number, value: string) => {
    const newHeaders = [...headers];
    newHeaders[colIdx] = value;
    setHeaders(newHeaders);
  };

  // Fetch datos Cartola
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

  // Fetch Cartolas con conteo
  const fetchCartolas = async () => {
    setLoadingCartolas(true);
    try {
      const { data: cartolasData, error: cartolasError } = await supabase
        .from("Cartolas")
        .select("id, nombre_archivo, fecha_subida")
        .order("fecha_subida", { ascending: false });

      if (cartolasError) throw cartolasError;

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

  // Convierte data tabla a array de objetos para insertar
  const dataToRecords = () => {
    return data.map((row) => {
      const record: Record<string, any> = {};
      headers.forEach((header, i) => {
        record[header] = row[i];
      });
      return record;
    });
  };

  // Sube datos a Supabase
  const uploadToSupabase = async () => {
    if (!file) {
      toast.error("Selecciona un archivo primero");
      return;
    }
    if (!data.length || !headers.length) {
      toast.error("No hay datos para subir");
      return;
    }

    setLoadingUpload(true);
    try {
      // Insertar metadata en Cartolas
      const { data: cartolaMeta, error: metaError } = await supabase
        .from("Cartolas")
        .insert([
          {
            nombre_archivo: file.name,
            fecha_subida: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (metaError || !cartolaMeta?.id) {
        throw new Error(metaError?.message || "Error al guardar metadata");
      }

      const cartolaId = cartolaMeta.id;

      // Prepara registros con cartola_id para insertar en Cartola
      const records = dataToRecords().map((rec) => ({
        ...rec,
        cartola_id: cartolaId,
      }));

      // Insertar en Cartola en batches de 1000 (ajusta según necesidad)
      const chunkSize = 1000;
      for (let i = 0; i < records.length; i += chunkSize) {
        const chunk = records.slice(i, i + chunkSize);
        const { error: insertError } = await supabase.from("Cartola").insert(chunk);
        if (insertError) throw insertError;
      }

      toast.success(`Datos subidos correctamente: ${records.length} filas`);

      // Limpiar y refrescar
      setFile(null);
      setData([]);
      setHeaders([]);
      await Promise.all([fetchVentas(), fetchCartolas()]);
    } catch (error: any) {
      toast.error("Error al subir datos: " + (error.message || error));
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

      const blob = new Blob([data.contenido_csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
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
    <div className="space-y-6 max-w-6xl mx-auto p-4 overflow-x-auto">
      <Card>
        <CardHeader>
          <CardTitle>Importar Excel, Editar y Subir a Supabase</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            type="file"
            accept=".xlsx"
            onChange={handleFileChange}
            disabled={loadingUpload}
          />
          <Button
            onClick={uploadToSupabase}
            disabled={loadingUpload || !file || !data.length}
            className="w-full"
          >
            {loadingUpload ? "Subiendo..." : "Subir a Supabase"}
          </Button>
        </CardContent>
      </Card>

      {headers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Vista previa editable</CardTitle>
          </CardHeader>
          <CardContent className="overflow-auto max-h-[60vh] border rounded-md p-0">
            <Table className="min-w-[1000px]">
              <TableHeader>
                <TableRow>
                  {headers.map((header, colIdx) => (
                    <TableHead key={colIdx} className="min-w-[150px]">
                      <input
                        value={header}
                        onChange={(e) => handleHeaderChange(colIdx, e.target.value)}
                        className="w-full px-1 bg-transparent border-b"
                      />
                    </TableHead>
                  ))}
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row, rowIdx) => (
                  <TableRow key={rowIdx}>
                    {headers.map((_, colIdx) => (
                      <TableCell key={colIdx} className="min-w-[150px]">
                        <input
                          value={row[colIdx] ?? ""}
                          onChange={(e) => handleEditCell(rowIdx, colIdx, e.target.value)}
                          className="w-full px-1 bg-transparent"
                          type={headers[colIdx] === "Fecha" ? "date" : "text"}
                        />
                      </TableCell>
                    ))}
                    <TableCell>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteRow(rowIdx)}
                      >
                        Eliminar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

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
                      {new Date(cartola.fecha_subida).toLocaleDateString("es-ES")}
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

      {/* Tabla Ventas */}
      <Card>
        <CardHeader>
          <CardTitle>Datos Cartola</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loadingVentas ? (
            <p className="p-4 text-center">Cargando datos...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {ventas.length > 0 ? (
                    Object.keys(ventas[0])
                      .filter(
                        (k) =>
                          ![
                            "id",
                            "created_at",
                            "Abonos",
                            "Saldo",
                            "cartola_id",
                          ].includes(k)
                      )
                      .map((key) => <TableHead key={key}>{key}</TableHead>)
                  ) : (
                    <TableHead>No hay datos</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {ventas.map((venta) => (
                  <TableRow key={venta.id}>
                    {Object.entries(venta)
                      .filter(
                        ([key]) =>
                          ![
                            "id",
                            "created_at",
                            "Abonos",
                            "Saldo",
                            "cartola_id",
                          ].includes(key)
                      )
                      .map(([key, val]) => (
                        <TableCell key={key}>{val}</TableCell>
                      ))}
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

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
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
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Venta {
  id: number;
  Fecha: string;
  [key: string]: any;
}

export default function CargosTableShadcn({ caption = "Cartola de movimientos" }) {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<Partial<Venta>>({});
  const [filtroDescripcion, setFiltroDescripcion] = useState<string>("");
  const [fechaInicio, setFechaInicio] = useState<string>("");
  const [fechaFin, setFechaFin] = useState<string>("");

  const headers = ventas.length
    ? Object.keys(ventas[0]).filter(
        (key) => !["id", "created_at", "Abonos", "Saldo", "cartola_id"].includes(key)
      )
    : [];

  const parseChileanCurrency = (value: any) => {
    if (!value) return 0;
    let cleanValue = value.toString().trim().replace(/[$\s]/g, "");
    if (cleanValue.includes(".") && !cleanValue.includes(",")) {
      cleanValue = cleanValue.replace(/\./g, "");
    }
    cleanValue = cleanValue.replace(",", ".");
    const numericValue = parseFloat(cleanValue);
    return isNaN(numericValue) ? 0 : numericValue;
  };

  const formatChileanCurrency = (value: any) => {
    const numericValue = parseChileanCurrency(value);
    return numericValue.toLocaleString("es-CL", {
      style: "currency",
      currency: "CLP",
    });
  };

  const formatForInput = (value: any) => {
    const numericValue = parseChileanCurrency(value);
    return numericValue.toLocaleString("es-CL");
  };

  const displayCellValue = (key: string, value: any) => {
    if (key === "Cargos") {
      return formatChileanCurrency(value);
    }
    return value;
  };

  useEffect(() => {
    const fetchVentas = async () => {
      const { data, error } = await supabase
        .from("Cartola")
        .select("*")
        .order("Fecha", { ascending: false });

      if (error) {
        console.error("Error al obtener datos:", error);
      } else {
        setVentas(data || []);
      }
      setLoading(false);
    };

    fetchVentas();
  }, []);

  const startEdit = (venta: Venta) => {
    setEditingId(venta.id);
    const formData = { ...venta };
    if (formData.Cargos) {
      formData.Cargos = formatForInput(formData.Cargos);
    }
    setForm(formData);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({});
  };

  const saveEdit = async () => {
    if (!editingId) return;

    const dataToSave = { ...form };
    if (dataToSave.Cargos) {
      const numericValue = parseChileanCurrency(dataToSave.Cargos);
      dataToSave.Cargos = numericValue.toLocaleString("es-CL");
    }

    const { error } = await supabase
      .from("Cartola")
      .update(dataToSave)
      .eq("id", editingId);

    if (error) {
      console.error("Error al actualizar:", error);
      alert("No se pudo actualizar el registro");
    } else {
      setVentas((v) =>
        v.map((row) =>
          row.id === editingId ? { ...dataToSave, id: editingId } : row
        )
      );
      cancelEdit();
    }
  };

  const handleChange = (key: string, value: any) => {
    setForm({ ...form, [key]: value });
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Estás seguro de eliminar este registro?")) return;

    const { error } = await supabase.from("Cartola").delete().eq("id", id);
    if (error) {
      console.error("Error al eliminar:", error);
      alert("No se pudo eliminar");
    } else {
      setVentas(ventas.filter((v) => v.id !== id));
    }
  };

  const calculateTotal = (lista: Venta[]) => {
    return lista.reduce((sum, venta) => {
      const numericValue = parseChileanCurrency(venta.Cargos);
      return sum + numericValue;
    }, 0);
  };

  const descripcionesUnicas = [
    ...new Set(
      ventas
        .filter((v) => parseChileanCurrency(v.Cargos) > 0)
        .map((v) => v.Descripcion)
        .filter(Boolean)
    ),
  ];

  // Aplicar filtros
  const ventasFiltradas = ventas.filter((v) => {
    const matchDescripcion = filtroDescripcion ? v.Descripcion === filtroDescripcion : true;
    const fecha = v.Fecha?.split("T")[0];
    const matchFechaInicio = fechaInicio ? fecha >= fechaInicio : true;
    const matchFechaFin = fechaFin ? fecha <= fechaFin : true;
    const tieneCargos = parseChileanCurrency(v.Cargos) > 0;
    return matchDescripcion && matchFechaInicio && matchFechaFin && tieneCargos;
  });

  const totalCargos = calculateTotal(ventasFiltradas);
  const formattedTotal = totalCargos.toLocaleString("es-CL", {
    style: "currency",
    currency: "CLP",
  });

  if (loading) return <p className="p-4 text-sm">Cargando datos...</p>;

  return (
    <Card className="w-full dark:bg-gray-900 dark:text-white">
      <CardContent className="p-4 space-y-6">
        {/* Filtro por descripción */}
        <div className="space-y-1">
          <Label htmlFor="filtroDescripcion">Filtrar por Descripción</Label>
          <select
            id="filtroDescripcion"
            className="bg-background border px-3 py-2 rounded-md text-sm dark:bg-gray-800 dark:border-gray-700"
            value={filtroDescripcion}
            onChange={(e) => setFiltroDescripcion(e.target.value)}
          >
            <option value="">Todas</option>
            {Object.entries(
              ventas
                .filter((v) => parseChileanCurrency(v.Cargos) > 0)
                .reduce((acc, venta) => {
                  const desc = venta.Descripcion || "Sin descripción";
                  acc[desc] = (acc[desc] || 0) + 1;
                  return acc;
                }, {} as Record<string, number>)
            )
              .sort((a, b) => b[1] - a[1])
              .map(([desc, count]) => (
                <option key={desc} value={desc}>
                  {`${desc} (${count})`}
                </option>
              ))}
          </select>
        </div>

        {/* Tabla */}
        <Table>
          <TableCaption>{caption}</TableCaption>
          <TableHeader>
            <TableRow>
              {headers.map((header) => (
                <TableHead key={header}>{header}</TableHead>
              ))}
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ventasFiltradas.map((venta) => (
              <TableRow key={venta.id}>
                {headers.map((key) => (
                  <TableCell key={key}>
                    {editingId === venta.id ? (
                      <Input
                        value={form[key] ?? ""}
                        onChange={(e) => handleChange(key, e.target.value)}
                        placeholder={key === "Cargos" ? "Ej: 300.000" : ""}
                      />
                    ) : (
                      displayCellValue(key, venta[key])
                    )}
                  </TableCell>
                ))}
                <TableCell className="text-right">
                  <div className="flex gap-2 justify-end">
                    {editingId === venta.id ? (
                      <>
                        <Button size="sm" onClick={saveEdit}>
                          Guardar
                        </Button>
                        <Button size="sm" variant="outline" onClick={cancelEdit}>
                          Cancelar
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button size="sm" variant="outline" onClick={() => startEdit(venta)}>
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(venta.id)}
                        >
                          Eliminar
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={headers.length}>Total Cargos</TableCell>
              <TableCell className="text-right font-medium">{formattedTotal}</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </CardContent>
    </Card>
  );
}

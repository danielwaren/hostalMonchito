import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { TrendingUp, Filter, X } from "lucide-react";

import type { ChartConfig } from "@/components/ui/chart";

import {
  Table, TableBody, TableCaption, TableCell,
  TableFooter, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

import {
  BarChart, Bar, XAxis, CartesianGrid, LabelList,
} from "recharts";

import {
  ChartContainer, ChartTooltip, ChartTooltipContent,
} from "@/components/ui/chart";

import {
  Card, CardContent, CardTitle,
  CardDescription, CardFooter, CardHeader,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface Venta {
  id: number;
  Fecha: string;
  Descripcion?: string;
  Cargos?: string | number;
  [key: string]: any;
}

interface CargosTableProps {
  caption?: string;
}

export default function CargosTableShadcn({ caption = "Cartola de movimientos" }: CargosTableProps) {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<Partial<Venta>>({});
  
  // Estados de filtros
  const [filtroDescripcion, setFiltroDescripcion] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [montoMinimo, setMontoMinimo] = useState("");
  const [montoMaximo, setMontoMaximo] = useState("");

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Headers dinámicos excluyendo campos internos
  const headers = ventas.length > 0
    ? Object.keys(ventas[0]).filter(
        (key) => !["id", "created_at", "Abonos", "Saldo", "cartola_id"].includes(key)
      )
    : [];

  // Utilidades para manejo de moneda chilena
  const parseChileanCurrency = (value: any): number => {
    if (!value) return 0;
    const clean = value.toString().trim()
      .replace(/[$\s]/g, "")
      .replace(/\./g, "")
      .replace(",", ".");
    const num = parseFloat(clean);
    return isNaN(num) ? 0 : num;
  };

  const formatChileanCurrency = (value: any): string =>
    parseChileanCurrency(value).toLocaleString("es-CL", {
      style: "currency",
      currency: "CLP",
    });

  const formatForInput = (value: any): string =>
    parseChileanCurrency(value).toLocaleString("es-CL");

  const displayCellValue = (key: string, value: any) => {
    if (key === "Cargos") return formatChileanCurrency(value);
    if (key === "Fecha" && value) return value.split("T")[0]; // Solo mostrar fecha sin hora
    return value || "";
  };

  // Cargar datos desde Supabase
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data, error } = await supabase
          .from("Cartola")
          .select("*")
          .order("Fecha", { ascending: false });

        if (error) {
          console.error("Error al obtener datos:", error);
          return;
        }

        setVentas(data || []);
      } catch (err) {
        console.error("Error inesperado:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Funciones de edición
  const startEdit = (venta: Venta) => {
    setEditingId(venta.id);
    setForm({
      ...venta,
      Cargos: formatForInput(venta.Cargos),
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({});
  };

  const saveEdit = async () => {
    if (!editingId) return;

    try {
      const dataToSave = { ...form };
      if (dataToSave.Cargos) {
        dataToSave.Cargos = parseChileanCurrency(dataToSave.Cargos).toLocaleString("es-CL");
      }

      const { error } = await supabase
        .from("Cartola")
        .update(dataToSave)
        .eq("id", editingId);

      if (error) {
        console.error("Error al actualizar:", error);
        alert("No se pudo actualizar el registro");
        return;
      }

      // Actualizar estado local
      setVentas((prev) =>
        prev.map((row) => 
          row.id === editingId ? { ...row, ...dataToSave } : row
        )
      );
      cancelEdit();
    } catch (err) {
      console.error("Error inesperado al guardar:", err);
      alert("Error inesperado al guardar");
    }
  };

  const handleChange = (key: string, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Estás seguro de eliminar este registro?")) return;

    try {
      const { error } = await supabase.from("Cartola").delete().eq("id", id);
      
      if (error) {
        console.error("Error al eliminar:", error);
        alert("No se pudo eliminar el registro");
        return;
      }

      setVentas((prev) => prev.filter((venta) => venta.id !== id));
      
      // Ajustar página actual si es necesario
      const newTotalItems = ventas.length - 1;
      const newTotalPages = Math.ceil(newTotalItems / itemsPerPage);
      if (currentPage > newTotalPages && newTotalPages > 0) {
        setCurrentPage(newTotalPages);
      }
    } catch (err) {
      console.error("Error inesperado al eliminar:", err);
      alert("Error inesperado al eliminar");
    }
  };

  // Lógica de filtrado
  const ventasFiltradas = ventas.filter((v) => {
    const fecha = v.Fecha?.split("T")[0];
    const monto = parseChileanCurrency(v.Cargos);
    const minimo = montoMinimo ? parseChileanCurrency(montoMinimo) : 0;
    const maximo = montoMaximo ? parseChileanCurrency(montoMaximo) : Infinity;

    return (
      (!filtroDescripcion || v.Descripcion === filtroDescripcion) &&
      (!fechaInicio || fecha >= fechaInicio) &&
      (!fechaFin || fecha <= fechaFin) &&
      monto > 0 &&
      monto >= minimo &&
      monto <= maximo
    );
  });

  const totalCargos = ventasFiltradas.reduce(
    (sum, venta) => sum + parseChileanCurrency(venta.Cargos), 
    0
  );

  // Lógica de paginación
  const totalPages = Math.ceil(ventasFiltradas.length / itemsPerPage);
  const paginatedVentas = ventasFiltradas.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Datos para gráfico mensual
  const cargosPorMes = ventas
    .filter((v) => parseChileanCurrency(v.Cargos) > 0)
    .reduce((acc, venta) => {
      const mes = venta.Fecha?.split("T")[0]?.slice(0, 7);
      if (!mes) return acc;
      acc[mes] = (acc[mes] || 0) + parseChileanCurrency(venta.Cargos);
      return acc;
    }, {} as Record<string, number>);

  const chartDataMensual = Object.entries(cargosPorMes)
    .map(([month, gastos]) => ({ month, gastos }))
    .sort((a, b) => a.month.localeCompare(b.month));

  // Datos para gráfico por descripción
  const cargosPorDescripcion = ventas
    .filter((v) => parseChileanCurrency(v.Cargos) > 0)
    .reduce((acc, venta) => {
      const descripcion = venta.Descripcion || "Sin descripción";
      acc[descripcion] = (acc[descripcion] || 0) + parseChileanCurrency(venta.Cargos);
      return acc;
    }, {} as Record<string, number>);

  const chartDataDescripcion = Object.entries(cargosPorDescripcion)
    .map(([descripcion, total]) => ({ descripcion, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10); // Top 10 descripciones

  const chartConfig = {
    gastos: {
      label: "Gastos",
      color: "hsl(var(--primary))",
    },
    total: {
      label: "Total",
      color: "hsl(var(--chart-2))",
    },
  } satisfies ChartConfig;

  // Reset de filtros
  const resetFiltros = () => {
    setFiltroDescripcion("");
    setFechaInicio("");
    setFechaFin("");
    setMontoMinimo("");
    setMontoMaximo("");
    setCurrentPage(1);
  };

  // Reset página al cambiar filtros
  const handleFilterChange = (filterSetter: (value: string) => void, value: string) => {
    filterSetter(value);
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Cargando datos...</p>
        </CardContent>
      </Card>
    );
  }

  if (ventas.length === 0) {
    return (
      <Card className="w-full">
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">No hay datos disponibles</p>
        </CardContent>
      </Card>
    );
  }

  // Obtener descripciones únicas para el filtro
  const descripcionesUnicas = Object.entries(
    ventas
      .filter((v) => parseChileanCurrency(v.Cargos) > 0)
      .reduce((acc, v) => {
        const desc = v.Descripcion || "Sin descripción";
        acc[desc] = (acc[desc] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
  ).sort((a, b) => b[1] - a[1]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          {caption}
        </CardTitle>
        <CardDescription>
          Gestión de cargos con filtros avanzados
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Panel de Filtros */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Filtros</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={resetFiltros}
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Limpiar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Filtro por Descripción */}
            <div className="space-y-2">
              <Label htmlFor="filtroDescripcion">Descripción</Label>
              <select
                id="filtroDescripcion"
                className="w-full bg-background border px-3 py-2 rounded-md text-sm"
                value={filtroDescripcion}
                onChange={(e) => handleFilterChange(setFiltroDescripcion, e.target.value)}
              >
                <option value="">Todas las descripciones</option>
                {descripcionesUnicas.map(([desc, count]) => (
                  <option key={desc} value={desc}>
                    {`${desc} (${count})`}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtros de fecha */}
            <div className="space-y-2">
              <Label htmlFor="fechaInicio">Fecha inicio</Label>
              <Input
                id="fechaInicio"
                type="date"
                value={fechaInicio}
                onChange={(e) => handleFilterChange(setFechaInicio, e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fechaFin">Fecha fin</Label>
              <Input
                id="fechaFin"
                type="date"
                value={fechaFin}
                onChange={(e) => handleFilterChange(setFechaFin, e.target.value)}
              />
            </div>

            {/* Filtros de monto */}
            <div className="space-y-2">
              <Label htmlFor="montoMinimo">Monto mínimo</Label>
              <Input
                id="montoMinimo"
                placeholder="Ej: 50000"
                value={montoMinimo}
                onChange={(e) => handleFilterChange(setMontoMinimo, e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="montoMaximo">Monto máximo</Label>
              <Input
                id="montoMaximo"
                placeholder="Ej: 500000"
                value={montoMaximo}
                onChange={(e) => handleFilterChange(setMontoMaximo, e.target.value)}
              />
            </div>

            {/* Información de resultados */}
            <div className="space-y-2">
              <Label>Resultados</Label>
              <div className="text-sm text-muted-foreground bg-muted p-2 rounded">
                {ventasFiltradas.length} de {ventas.filter(v => parseChileanCurrency(v.Cargos) > 0).length} registros
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabla */}
        <div className="overflow-x-auto">
          <Table>
            <TableCaption>
              Mostrando {paginatedVentas.length} de {ventasFiltradas.length} registros
            </TableCaption>
            <TableHeader>
              <TableRow>
                {headers.map((header) => (
                  <TableHead key={header} className={header === "Cargos" ? "text-right" : ""}>
                    {header}
                  </TableHead>
                ))}
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedVentas.map((venta) => (
                <TableRow key={venta.id}>
                  {headers.map((key) => (
                    <TableCell key={key} className={key === "Cargos" ? "text-right" : ""}>
                      {editingId === venta.id ? (
                        <Input
                          value={form[key] ?? ""}
                          onChange={(e) => handleChange(key, e.target.value)}
                          placeholder={key === "Cargos" ? "Ej: 300.000" : `Ingrese ${key}`}
                          className="min-w-[120px]"
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
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => startEdit(venta)}
                          >
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
                <TableCell colSpan={headers.length}>
                  <strong>Total Cargos</strong>
                </TableCell>
                <TableCell className="text-right font-bold">
                  {formatChileanCurrency(totalCargos)}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <Pagination>
            <PaginationContent className="justify-center">
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
              <PaginationItem>
                <div className="text-sm px-4 py-2 text-muted-foreground">
                  Página {currentPage} de {totalPages}
                </div>
              </PaginationItem>
              <PaginationItem>
                <PaginationNext
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico por Mes */}
          <Card>
            <CardHeader>
              <CardTitle>Gastos por Mes</CardTitle>
              <CardDescription>Resumen mensual de todos los cargos registrados</CardDescription>
            </CardHeader>
            <CardContent>
              {chartDataMensual.length > 0 ? (
                <ChartContainer config={chartConfig}>
                  <BarChart data={chartDataMensual} margin={{ top: 20 }}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="month"
                      tickLine={false}
                      tickMargin={10}
                      axisLine={false}
                      tickFormatter={(value) => {
                        const [year, month] = value.split("-");
                        return `${month}/${year.slice(2)}`;
                      }}
                    />
                    <ChartTooltip 
                      cursor={false} 
                      content={<ChartTooltipContent hideLabel />} 
                    />
                    <Bar dataKey="gastos" fill="hsl(var(--primary))" radius={8}>
                      <LabelList
                        position="top"
                        offset={12}
                        className="fill-foreground"
                        fontSize={12}
                        formatter={(value: number) =>
                          formatChileanCurrency(value)
                        }
                      />
                    </Bar>
                  </BarChart>
                </ChartContainer>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  No hay datos suficientes para mostrar el gráfico
                </div>
              )}
            </CardContent>
            <CardFooter className="flex-col items-start gap-2 text-sm">
              <div className="flex gap-2 leading-none font-medium text-foreground">
                Gastos totales por mes <TrendingUp className="h-4 w-4" />
              </div>
              <div className="text-muted-foreground leading-none">
                Incluye solo registros con valores positivos en Cargos
              </div>
            </CardFooter>
          </Card>

          {/* Gráfico por Descripción */}
          <Card>
            <CardHeader>
              <CardTitle>Gastos por Descripción</CardTitle>
              <CardDescription>Top 10 categorías con mayores gastos acumulados</CardDescription>
            </CardHeader>
            <CardContent>
              {chartDataDescripcion.length > 0 ? (
                <ChartContainer config={chartConfig}>
                  <BarChart 
                    data={chartDataDescripcion} 
                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                  >
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="descripcion"
                      tickLine={false}
                      tickMargin={10}
                      axisLine={false}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      interval={0}
                      tickFormatter={(value) => 
                        value.length > 12 ? `${value.substring(0, 12)}...` : value
                      }
                    />
                    <ChartTooltip 
                      cursor={false}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-background border rounded-lg shadow-lg p-3">
                              <p className="font-semibold text-foreground mb-1">
                                {payload[0].payload.descripcion}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Total: {formatChileanCurrency(payload[0].value)}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="total" fill="hsl(var(--chart-2))" radius={4}>
                      <LabelList
                        position="top"
                        offset={12}
                        className="fill-foreground"
                        fontSize={11}
                        formatter={(value: number) => {
                          if (value >= 1000000) {
                            return `${(value / 1000000).toFixed(1)}M`;
                          } else if (value >= 1000) {
                            return `${(value / 1000).toFixed(0)}K`;
                          }
                          return `${(value / 1000).toFixed(0)}K`;
                        }}
                      />
                    </Bar>
                  </BarChart>
                </ChartContainer>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  No hay datos suficientes para mostrar el gráfico
                </div>
              )}
            </CardContent>
            <CardFooter className="flex-col items-start gap-2 text-sm">
              <div className="flex gap-2 leading-none font-medium text-foreground">
                Categorías con mayores gastos <TrendingUp className="h-4 w-4" />
              </div>
              <div className="text-muted-foreground leading-none">
                Mostrando las 10 descripciones con más gastos acumulados
              </div>
            </CardFooter>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}
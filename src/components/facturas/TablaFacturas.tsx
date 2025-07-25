import { useEffect, useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { supabase } from "@/lib/supabase";

interface Factura {
  id: number;
  cliente: string;
  numero: string;
  fecha: string;
  detalle: string;
  total: number;
  pagada: boolean;
}

const PAGE_SIZE = 10;

export default function TablaFacturas() {
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [clientes, setClientes] = useState<string[]>([]);
  const [filteredFacturas, setFilteredFacturas] = useState<Factura[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<Partial<Factura>>({});
  const [selectedCliente, setSelectedCliente] = useState<string>("__all__");
  const [currentPage, setCurrentPage] = useState(1);

  const fetchFacturas = async () => {
    const { data, error } = await supabase
      .from("Facturas")
      .select("*")
      .order("numero", { ascending: false });

    if (error) {
      console.error("Error al cargar facturas:", error);
    } else {
      setFacturas(data || []);
      setFilteredFacturas(data || []);
      const clientesUnicos = Array.from(
        new Set((data || []).map((f) => f.cliente))
      );
      setClientes(clientesUnicos);
    }
  };

  useEffect(() => {
    fetchFacturas();
  }, []);

  useEffect(() => {
    const resultados =
      selectedCliente === "__all__"
        ? facturas
        : facturas.filter((f) => f.cliente === selectedCliente);

    setFilteredFacturas(resultados);
    setCurrentPage(1);
  }, [selectedCliente, facturas]);

  const startEdit = (factura: Factura) => {
    setEditingId(factura.id);
    setForm({ ...factura });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({});
  };

  const saveEdit = async () => {
    if (!editingId) return;

    const { error } = await supabase
      .from("Facturas")
      .update(form)
      .eq("id", editingId);

    if (error) {
      console.error("Error al actualizar:", error);
      alert("No se pudo actualizar la factura.");
    } else {
      const updated = facturas.map((f) =>
        f.id === editingId ? { ...f, ...form } : f
      );
      setFacturas(updated);
      cancelEdit();
    }
  };

  const handleChange = (key: keyof Factura, value: any) => {
    setForm({ ...form, [key]: value });
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar esta factura?")) return;
    const { error } = await supabase.from("Facturas").delete().eq("id", id);
    if (error) {
      console.error("Error al eliminar:", error);
      alert("No se pudo eliminar.");
    } else {
      const updated = facturas.filter((f) => f.id !== id);
      setFacturas(updated);
    }
  };

  const calcularTotal = () =>
    filteredFacturas.reduce(
      (sum, f) => sum + (typeof f.total === "number" ? f.total : 0),
      0
    );

  const totalPages = Math.ceil(filteredFacturas.length / PAGE_SIZE);
  const currentData = filteredFacturas.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  return (
    <Card className="w-full">
      <CardContent className="p-4 space-y-4">
        {/* Filtro por cliente */}
        <div className="max-w-sm">
          <Select
            onValueChange={(value) => {
              setSelectedCliente(value);
            }}
            value={selectedCliente}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por cliente" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todos</SelectItem>
              {clientes.map((cliente, idx) => (
                <SelectItem key={idx} value={cliente}>
                  {cliente}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Table>
          <TableCaption>Listado de Facturas</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>N°</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Detalle</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Pagada</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentData.map((f) => (
              <TableRow key={f.id}>
                <TableCell>
                  {editingId === f.id ? (
                    <Input
                      value={form.cliente ?? ""}
                      onChange={(e) =>
                        handleChange("cliente", e.target.value)
                      }
                    />
                  ) : (
                    f.cliente
                  )}
                </TableCell>
                <TableCell>
                  {editingId === f.id ? (
                    <Input
                      value={form.numero ?? ""}
                      onChange={(e) =>
                        handleChange("numero", e.target.value)
                      }
                    />
                  ) : (
                    f.numero
                  )}
                </TableCell>
                <TableCell>
                  {editingId === f.id ? (
                    <Input
                      type="date"
                      value={form.fecha ?? ""}
                      onChange={(e) =>
                        handleChange("fecha", e.target.value)
                      }
                    />
                  ) : (
                    f.fecha
                  )}
                </TableCell>
                <TableCell>
                  {editingId === f.id ? (
                    <Input
                      value={form.detalle ?? ""}
                      onChange={(e) =>
                        handleChange("detalle", e.target.value)
                      }
                    />
                  ) : (
                    f.detalle
                  )}
                </TableCell>
                <TableCell>
                  {editingId === f.id ? (
                    <Input
                      value={form.total ?? ""}
                      onChange={(e) =>
                        handleChange("total", parseInt(e.target.value))
                      }
                    />
                  ) : (
                    f.total.toLocaleString("es-CL", {
                      style: "currency",
                      currency: "CLP",
                    })
                  )}
                </TableCell>
                <TableCell>
                  {editingId === f.id ? (
                    <Checkbox
                      checked={!!form.pagada}
                      onCheckedChange={(checked) =>
                        handleChange("pagada", !!checked)
                      }
                    />
                  ) : f.pagada ? (
                    "✅"
                  ) : (
                    "❌"
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {editingId === f.id ? (
                    <div className="flex gap-2 justify-end">
                      <Button size="sm" onClick={saveEdit}>
                        Guardar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={cancelEdit}
                      >
                        Cancelar
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2 justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startEdit(f)}
                      >
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(f.id)}
                      >
                        Eliminar
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={4}>Total</TableCell>
              <TableCell className="font-medium">
                {calcularTotal().toLocaleString("es-CL", {
                  style: "currency",
                  currency: "CLP",
                })}
              </TableCell>
              <TableCell colSpan={2}></TableCell>
            </TableRow>
          </TableFooter>
        </Table>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
            >
              Anterior
            </Button>
            <span className="text-sm text-muted-foreground">
              Página {currentPage} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setCurrentPage((p) => Math.min(p + 1, totalPages))
              }
              disabled={currentPage === totalPages}
            >
              Siguiente
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Cliente {
  id: number;
  nombre: string;
  empresa?: string;
  descripcion_cartola?: string;
  rut?: string;
  correo?: string;
  telefono?: string;
}

interface Abono {
  id: number;
  Fecha: string;
  Descripcion: string;
  Abonos: string;
}

export default function ClientesTable() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<Partial<Cliente>>({});
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [abonos, setAbonos] = useState<Abono[]>([]);
  const [isEditOpen, setIsEditOpen] = useState(false);

  useEffect(() => {
    const fetchClientes = async () => {
      const { data, error } = await supabase
        .from("Clientes")
        .select("*")
        .order("id", { ascending: false });

      if (error) {
        console.error("Error al obtener clientes:", error);
      } else {
        setClientes(data || []);
      }
    };

    fetchClientes();
  }, []);

  const handleChange = (key: keyof Cliente, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const openEditModal = (cliente: Cliente) => {
    setEditingId(cliente.id);
    setForm({ ...cliente });
    setIsEditOpen(true);
  };

  const closeEditModal = () => {
    setEditingId(null);
    setForm({});
    setIsEditOpen(false);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const { error } = await supabase
      .from("Clientes")
      .update(form)
      .eq("id", editingId);

    if (error) {
      console.error("Error al actualizar cliente:", error);
    } else {
      setClientes((prev) =>
        prev.map((cli) => (cli.id === editingId ? { ...form, id: editingId } as Cliente : cli))
      );
      closeEditModal();
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar este cliente?")) return;
    const { error } = await supabase.from("Clientes").delete().eq("id", id);
    if (!error) {
      setClientes((prev) => prev.filter((cli) => cli.id !== id));
    }
  };

  const openDetalles = async (cliente: Cliente) => {
    setSelectedCliente(cliente);

    if (cliente.descripcion_cartola) {
      const { data, error } = await supabase
        .from("Cartola")
        .select("id, Fecha, Descripcion, Abonos")
        .eq("Descripcion", cliente.descripcion_cartola)
        .order("Fecha", { ascending: false });

      if (!error) {
        setAbonos(data || []);
      } else {
        console.error("Error al cargar abonos:", error);
        setAbonos([]);
      }
    } else {
      setAbonos([]);
    }
  };

  const totalAbonos = abonos.reduce((acc, ab) => {
    const val = parseFloat(ab.Abonos?.toString().replace(/[^0-9.-]/g, "") || "0");
    return acc + val;
  }, 0);

  return (
    <>
      <Card className="w-full">
        <CardContent className="p-0">
          <Table>
            <TableCaption>Clientes registrados</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Descripción Cartola</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientes.map((cli) => (
                <TableRow key={cli.id}>
                  <TableCell>{cli.nombre}</TableCell>
                  <TableCell>{cli.empresa}</TableCell>
                  <TableCell>{cli.descripcion_cartola}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" onClick={() => openEditModal(cli)}>
                            Editar
                          </Button>
                        </DialogTrigger>
                      </Dialog>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(cli.id)}
                      >
                        Eliminar
                      </Button>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => openDetalles(cli)}
                          >
                            Detalles
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl overflow-y-auto max-h-[75vh]">
                          <DialogHeader>
                            <DialogTitle>Detalles de {selectedCliente?.nombre}</DialogTitle>
                          </DialogHeader>
                          {selectedCliente && (
                            <div className="space-y-6 mt-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div>
                                  <p className="font-medium">Empresa</p>
                                  <p>{selectedCliente.empresa || "-"}</p>
                                </div>
                                <div>
                                  <p className="font-medium">RUT</p>
                                  <p>{selectedCliente.rut || "-"}</p>
                                </div>
                                <div>
                                  <p className="font-medium">Correo</p>
                                  <p>{selectedCliente.correo || "-"}</p>
                                </div>
                                <div>
                                  <p className="font-medium">Teléfono</p>
                                  <p>{selectedCliente.telefono || "-"}</p>
                                </div>
                                <div className="md:col-span-2">
                                  <p className="font-medium">Descripción en Cartola</p>
                                  <p>{selectedCliente.descripcion_cartola || "-"}</p>
                                </div>
                              </div>
                              <div>
                                <h3 className="font-semibold mb-2">Abonos Registrados</h3>
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Fecha</TableHead>
                                      <TableHead>Descripción</TableHead>
                                      <TableHead className="text-right">Abono</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {abonos.map((ab) => (
                                      <TableRow key={ab.id}>
                                        <TableCell>{ab.Fecha?.split("T")[0]}</TableCell>
                                        <TableCell>{ab.Descripcion}</TableCell>
                                        <TableCell className="text-right">
                                          {parseInt(ab.Abonos).toLocaleString("es-CL", {
                                            style: "currency",
                                            currency: "CLP",
                                          })}
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                  <TableFooter>
                                    <TableRow>
                                      <TableCell colSpan={2}>Total Abonos</TableCell>
                                      <TableCell className="text-right font-bold">
                                        {totalAbonos.toLocaleString("es-CL", {
                                          style: "currency",
                                          currency: "CLP",
                                        })}
                                      </TableCell>
                                    </TableRow>
                                  </TableFooter>
                                </Table>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal de edición */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Cliente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Nombre"
              value={form.nombre || ""}
              onChange={(e) => handleChange("nombre", e.target.value)}
            />
            <Input
              placeholder="Empresa"
              value={form.empresa || ""}
              onChange={(e) => handleChange("empresa", e.target.value)}
            />
            <Input
              placeholder="Descripción Cartola"
              value={form.descripcion_cartola || ""}
              onChange={(e) => handleChange("descripcion_cartola", e.target.value)}
            />
            <Input
              placeholder="RUT"
              value={form.rut || ""}
              onChange={(e) => handleChange("rut", e.target.value)}
            />
            <Input
              placeholder="Correo"
              value={form.correo || ""}
              onChange={(e) => handleChange("correo", e.target.value)}
            />
            <Input
              placeholder="Teléfono"
              value={form.telefono || ""}
              onChange={(e) => handleChange("telefono", e.target.value)}
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={closeEditModal}>
                Cancelar
              </Button>
              <Button onClick={saveEdit}>Guardar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

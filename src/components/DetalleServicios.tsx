"use client";
import { useState, useEffect } from "react";
import { Plus, Trash2, Receipt, Save, Search, XCircle, Pencil } from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  Table, TableBody, TableCaption, TableCell,
  TableFooter, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Card, CardContent, CardTitle,
  CardDescription, CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ServicioRow {
  id: number;
  fecha: string;
  almuerzo: number;
  cena: number;
  alojamiento: number;
}

interface ClienteDB {
  id: number;
  nombre_cliente: string;
  servicios: ServicioRow[];
  created_at: string;
}

const PRECIO_ALMUERZO = 10000;
const PRECIO_CENA = 10000;
const PRECIO_ALOJAMIENTO = 25000;
const IVA = 0.19;

export default function DetalleServicios() {
  const [nombreCliente, setNombreCliente] = useState("");
  const [servicios, setServicios] = useState<ServicioRow[]>([]);
  const [clientes, setClientes] = useState<ClienteDB[]>([]);
  const [clienteId, setClienteId] = useState<number | null>(null);
  const [nextId, setNextId] = useState(1);
  const [cargando, setCargando] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  // 🔁 Cargar lista de clientes
  const cargarClientes = async () => {
    const { data, error } = await supabase
      .from("servicios_hospedaje")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) console.error("Error al cargar clientes:", error.message);
    else setClientes(data || []);
  };

  useEffect(() => {
    cargarClientes();
    if (servicios.length === 0) {
      setServicios([
        {
          id: 1,
          fecha: new Date().toISOString().split("T")[0],
          almuerzo: 0,
          cena: 0,
          alojamiento: 0,
        },
      ]);
    }
  }, []);

  const formatCLP = (v: number) =>
    v.toLocaleString("es-CL", { style: "currency", currency: "CLP" });

  const subtotal = (s: ServicioRow) =>
    s.almuerzo * PRECIO_ALMUERZO + s.cena * PRECIO_CENA + s.alojamiento * PRECIO_ALOJAMIENTO;
  const totalIVA = (s: ServicioRow) => subtotal(s) * (1 + IVA);

  const agregarFila = () => {
    setServicios([
      ...servicios,
      {
        id: nextId,
        fecha: new Date().toISOString().split("T")[0],
        almuerzo: 0,
        cena: 0,
        alojamiento: 0,
      },
    ]);
    setNextId(nextId + 1);
  };

  const eliminarFila = (id: number) => {
    if (servicios.length === 1) return alert("Debe haber al menos una fila");
    setServicios(servicios.filter((s) => s.id !== id));
  };

  const actualizarServicio = (id: number, campo: keyof ServicioRow, valor: any) => {
    setServicios(servicios.map((s) => (s.id === id ? { ...s, [campo]: valor } : s)));
  };

  const totalNeto = servicios.reduce((a, s) => a + subtotal(s), 0);
  const totalIVAcalc = totalNeto * IVA;
  const totalBruto = totalNeto + totalIVAcalc;

  // 💾 Guardar cliente
  const guardarCliente = async () => {
    if (!nombreCliente.trim()) return alert("Ingrese el nombre del cliente");
    setCargando(true);
    let result;
    if (clienteId) {
      result = await supabase
        .from("servicios_hospedaje")
        .update({
          nombre_cliente: nombreCliente.trim(),
          servicios,
        })
        .eq("id", clienteId);
    } else {
      result = await supabase
        .from("servicios_hospedaje")
        .insert([{ nombre_cliente: nombreCliente.trim(), servicios }]);
    }
    const { error } = result;
    setCargando(false);
    if (error) alert("Error al guardar: " + error.message);
    else {
      alert("Datos guardados correctamente");
      setClienteId(null);
      cargarClientes();
    }
  };

  // 🔍 Buscar cliente
  const cargarCliente = async () => {
    if (!nombreCliente.trim()) return alert("Ingrese el nombre del cliente");
    setCargando(true);
    const { data, error } = await supabase
      .from("servicios_hospedaje")
      .select("*")
      .eq("nombre_cliente", nombreCliente.trim())
      .maybeSingle();
    setCargando(false);
    if (error) alert("Error al buscar: " + error.message);
    else if (!data) alert("Cliente no encontrado");
    else {
      setClienteId(data.id);
      setServicios(data.servicios);
      const maxId = Math.max(...data.servicios.map((s: ServicioRow) => s.id), 0) + 1;
      setNextId(maxId);
    }
  };

  // 🧹 Eliminar cliente
  const eliminarCliente = async (id?: number) => {
    const nombre = id
      ? clientes.find((c) => c.id === id)?.nombre_cliente
      : nombreCliente.trim();
    if (!nombre) return alert("Ingrese o seleccione un cliente");
    if (!confirm(`¿Eliminar el registro de ${nombre}?`)) return;
    setCargando(true);
    const { error } = await supabase
      .from("servicios_hospedaje")
      .delete()
      .eq("nombre_cliente", nombre);
    setCargando(false);
    if (error) alert("Error al eliminar: " + error.message);
    else {
      alert("Registro eliminado correctamente");
      setNombreCliente("");
      setClienteId(null);
      setServicios([
        {
          id: 1,
          fecha: new Date().toISOString().split("T")[0],
          almuerzo: 0,
          cena: 0,
          alojamiento: 0,
        },
      ]);
      cargarClientes();
    }
  };

const editarCliente = (cliente: ClienteDB) => {
  setClienteId(cliente.id);
  setNombreCliente(cliente.nombre_cliente);
  setServicios(cliente.servicios);

  const maxId = Math.max(...cliente.servicios.map((s) => s.id), 0) + 1;
  setNextId(maxId);

  setModalOpen(true); // 🔥 ABRE MODAL
};
  return (
    <Card className="w-full max-w-7xl mx-auto p-2 sm:p-4 lg:p-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl text-center sm:text-left flex-wrap">
          <Receipt className="h-6 w-6" />
          Detalle de Servicios de Hospedaje
        </CardTitle>
        <CardDescription className="text-sm text-center sm:text-left">
          Gestión de servicios: Almuerzo $10.000 • Cena $10.000 • Alojamiento $25.000
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Controles principales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="sm:col-span-2 space-y-2">
            <Label htmlFor="nombreCliente">Nombre del Cliente</Label>
            <Input
              id="nombreCliente"
              placeholder="Ingrese el nombre del cliente"
              value={nombreCliente}
              onChange={(e) => setNombreCliente(e.target.value)}
            />
          </div>
          <div className="flex gap-2 flex-wrap justify-between sm:justify-end items-end">
            <Button onClick={guardarCliente} disabled={cargando} className="flex-1 sm:flex-none">
              <Save className="h-4 w-4" /> Guardar
            </Button>
            <Button variant="secondary" onClick={cargarCliente} disabled={cargando} className="flex-1 sm:flex-none">
              <Search className="h-4 w-4" /> Buscar
            </Button>
            <Button variant="destructive" onClick={() => eliminarCliente()} disabled={cargando} className="flex-1 sm:flex-none">
              <XCircle className="h-4 w-4" /> Eliminar
            </Button>
          </div>
        </div>

        {/* Tabla principal */}
        <div className="overflow-x-auto rounded-md border">
          <Table className="min-w-[700px] text-sm">
            <TableCaption>Detalle de servicios entregados - IVA 19%</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead className="text-center">Almuerzos</TableHead>
                <TableHead className="text-center">Cenas</TableHead>
                <TableHead className="text-center">Alojamientos</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
                <TableHead className="text-right">Total + IVA</TableHead>
                <TableHead className="text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {servicios.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <Input
                      type="date"
                      value={s.fecha}
                      onChange={(e) => actualizarServicio(s.id, "fecha", e.target.value)}
                      className="text-sm"
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <Input
                      type="number"
                      value={s.almuerzo}
                      onChange={(e) =>
                        actualizarServicio(s.id, "almuerzo", parseInt(e.target.value) || 0)
                      }
                      className="w-20 mx-auto text-center"
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <Input
                      type="number"
                      value={s.cena}
                      onChange={(e) =>
                        actualizarServicio(s.id, "cena", parseInt(e.target.value) || 0)
                      }
                      className="w-20 mx-auto text-center"
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <Input
                      type="number"
                      value={s.alojamiento}
                      onChange={(e) =>
                        actualizarServicio(s.id, "alojamiento", parseInt(e.target.value) || 0)
                      }
                      className="w-20 mx-auto text-center"
                    />
                  </TableCell>
                  <TableCell className="text-right">{formatCLP(subtotal(s))}</TableCell>
                  <TableCell className="text-right font-semibold">{formatCLP(totalIVA(s))}</TableCell>
                  <TableCell className="text-center">
                    <Button size="sm" variant="destructive" onClick={() => eliminarFila(s.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={5}></TableCell>
                <TableCell colSpan={2} className="p-0">
                  <div className="space-y-1 p-3">
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span>Subtotal Neto:</span>
                      <span>{formatCLP(totalNeto)}</span>
                    </div>
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span>IVA (19%):</span>
                      <span>{formatCLP(totalIVAcalc)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold border-t pt-1">
                      <span>TOTAL:</span>
                      <span className="text-primary">{formatCLP(totalBruto)}</span>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>

        <Button onClick={agregarFila} className="flex items-center gap-2 w-full sm:w-auto justify-center">
          <Plus className="h-4 w-4" /> Agregar Fila
        </Button>

        {/* Lista de clientes */}
        <div className="mt-8 overflow-x-auto rounded-md border">
          <h3 className="text-lg font-semibold mb-2 text-center sm:text-left p-2">Clientes guardados</h3>
          <Table className="min-w-[600px] text-sm">
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Fecha de creación</TableHead>
                <TableHead className="text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientes.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <button onClick={() => editarCliente(c)} className="text-blue-600 hover:underline">
                      {c.nombre_cliente}
                    </button>
                  </TableCell>
                  <TableCell>{new Date(c.created_at).toLocaleString("es-CL")}</TableCell>
                  <TableCell className="text-center flex gap-2 justify-center flex-wrap">
                    <Button size="sm" variant="secondary" onClick={() => editarCliente(c)}>
                      <Pencil className="h-4 w-4" /> Editar
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => eliminarCliente(c.id)}>
                      <Trash2 className="h-4 w-4" /> Eliminar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {modalOpen && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-white w-full max-w-6xl rounded-lg p-4 space-y-4">

      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold">
          Editando: {nombreCliente}
        </h2>
        <Button variant="ghost" onClick={() => setModalOpen(false)}>
          <XCircle className="h-5 w-5" />
        </Button>
      </div>

      <div className="overflow-x-auto">
        <Table className="min-w-[700px] text-sm">
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead className="text-center">Almuerzos</TableHead>
              <TableHead className="text-center">Cenas</TableHead>
              <TableHead className="text-center">Alojamientos</TableHead>
              <TableHead className="text-right">Subtotal</TableHead>
              <TableHead className="text-right">Total + IVA</TableHead>
              <TableHead className="text-center">Acciones</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {servicios.map((s) => (
              <TableRow key={s.id}>
                <TableCell>
                  <Input
                    type="date"
                    value={s.fecha}
                    onChange={(e) =>
                      actualizarServicio(s.id, "fecha", e.target.value)
                    }
                  />
                </TableCell>

                <TableCell className="text-center">
                  <Input
                    type="number"
                    value={s.almuerzo}
                    onChange={(e) =>
                      actualizarServicio(s.id, "almuerzo", parseInt(e.target.value) || 0)
                    }
                    className="w-20 mx-auto text-center"
                  />
                </TableCell>

                <TableCell className="text-center">
                  <Input
                    type="number"
                    value={s.cena}
                    onChange={(e) =>
                      actualizarServicio(s.id, "cena", parseInt(e.target.value) || 0)
                    }
                    className="w-20 mx-auto text-center"
                  />
                </TableCell>

                <TableCell className="text-center">
                  <Input
                    type="number"
                    value={s.alojamiento}
                    onChange={(e) =>
                      actualizarServicio(s.id, "alojamiento", parseInt(e.target.value) || 0)
                    }
                    className="w-20 mx-auto text-center"
                  />
                </TableCell>

                <TableCell className="text-right">
                  {formatCLP(subtotal(s))}
                </TableCell>

                <TableCell className="text-right font-semibold">
                  {formatCLP(totalIVA(s))}
                </TableCell>

                <TableCell className="text-center">
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => eliminarFila(s.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-between flex-wrap gap-2">
        <Button onClick={agregarFila}>
          <Plus className="h-4 w-4" /> Agregar día
        </Button>

        <Button onClick={guardarCliente} disabled={cargando}>
          <Save className="h-4 w-4" /> Guardar cambios
        </Button>
      </div>

    </div>
  </div>
)}
      </CardContent>
    </Card>
  );
}

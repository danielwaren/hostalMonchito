import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export default function FormFacturas() {
  const [clientes, setClientes] = useState<string[]>([]);
  const [form, setForm] = useState({
    cliente: "",
    numero: "",
    fecha: "",
    detalle: "",
    total: "",
    pagada: false,
  });

  // Cargar lista de clientes y verificar si hay uno seleccionado desde localStorage
  useEffect(() => {
    const fetchClientes = async () => {
      const { data, error } = await supabase
        .from("Clientes")
        .select("nombre")
        .order("nombre", { ascending: true });

      if (error) {
        console.error("Error al cargar clientes:", error);
        toast.error("❌ Error al cargar clientes");
      } else {
        const nombres = data.map((c) => c.nombre);
        setClientes(nombres);

        const clienteGuardado = localStorage.getItem("clienteRecienAgregado");
        if (clienteGuardado && nombres.includes(clienteGuardado)) {
          setForm((prev) => ({ ...prev, cliente: clienteGuardado }));
          localStorage.removeItem("clienteRecienAgregado");
        }
      }
    };

    fetchClientes();
  }, []);

  const handleChange = (key: string, value: any) => {
    if (key === "cliente" && value === "__agregar__") {
      // Guarda el estado antes de redirigir
      localStorage.setItem("volverAFacturas", "true");
      window.location.href = "/clientes";
      return;
    }

    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const nuevaFactura = {
      cliente: form.cliente,
      numero: form.numero,
      fecha: form.fecha,
      detalle: form.detalle,
      total: parseInt(form.total),
      pagada: form.pagada,
    };

    const { error } = await supabase.from("Facturas").insert(nuevaFactura);

    if (error) {
      console.error("Error al guardar la factura:", error);
      toast.error("❌ Error al guardar la factura");
    } else {
      toast.success("✅ Factura registrada con éxito");
      setForm({
        cliente: "",
        numero: "",
        fecha: "",
        detalle: "",
        total: "",
        pagada: false,
      });
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cliente">Cliente</Label>
              <select
                id="cliente"
                className="w-full rounded-md border bg-background p-2 text-sm dark:bg-gray-800 dark:border-gray-700"
                value={form.cliente}
                onChange={(e) => handleChange("cliente", e.target.value)}
                required
              >
                <option value="">Selecciona un cliente</option>
                {clientes.map((nombre) => (
                  <option key={nombre} value={nombre}>
                    {nombre}
                  </option>
                ))}
                <option value="__agregar__">➕ Agregar nuevo cliente</option>
              </select>
            </div>

            <div>
              <Label htmlFor="numero">N° Factura</Label>
              <Input
                id="numero"
                value={form.numero}
                onChange={(e) => handleChange("numero", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fecha">Fecha</Label>
              <Input
                id="fecha"
                type="date"
                value={form.fecha}
                onChange={(e) => handleChange("fecha", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="total">Total</Label>
              <Input
                id="total"
                type="number"
                value={form.total}
                onChange={(e) => handleChange("total", e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="detalle">Detalle</Label>
            <Input
              id="detalle"
              value={form.detalle}
              onChange={(e) => handleChange("detalle", e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="pagada"
              checked={form.pagada}
              onCheckedChange={(checked) => handleChange("pagada", !!checked)}
            />
            <Label htmlFor="pagada">¿Pagada?</Label>
          </div>

          <Button type="submit" className="w-full">
            Registrar Factura
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

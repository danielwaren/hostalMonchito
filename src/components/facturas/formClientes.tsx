import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

export default function FormClientes() {
  const [form, setForm] = useState({
    nombre: "",
    correo: "",
    telefono: "",
    rut: "",
    descripcion_cartola: "",
    empresa: "",
  });

  const handleChange = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { data, error } = await supabase.from("Clientes").insert(form);

    if (error) {
      console.error("Error al guardar cliente:", error);
      toast.error("❌ Error al guardar el cliente");
    } else {
      toast.success(`✅ Cliente "${form.nombre}" registrado`);
      setForm({
        nombre: "",
        correo: "",
        telefono: "",
        rut: "",
        descripcion_cartola: "",
        empresa: "",
      });
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nombre">Nombre</Label>
              <Input
                id="nombre"
                value={form.nombre}
                onChange={(e) => handleChange("nombre", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="correo">Correo</Label>
              <Input
                id="correo"
                type="email"
                value={form.correo}
                onChange={(e) => handleChange("correo", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="telefono">Número de contacto</Label>
              <Input
                id="telefono"
                value={form.telefono}
                onChange={(e) => handleChange("telefono", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="rut">RUT</Label>
              <Input
                id="rut"
                value={form.rut}
                onChange={(e) => handleChange("rut", e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="descripcion_cartola">Nombre en Cartola</Label>
            <Input
              id="descripcion_cartola"
              value={form.descripcion_cartola}
              onChange={(e) => handleChange("descripcion_cartola", e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="empresa">Empresa</Label>
            <Input
              id="empresa"
              value={form.empresa}
              onChange={(e) => handleChange("empresa", e.target.value)}
            />
          </div>

          <Button type="submit" className="w-full">
            Registrar Cliente
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

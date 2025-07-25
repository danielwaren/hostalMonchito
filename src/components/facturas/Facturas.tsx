import React, { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

export default function CardFacturas() {
  const [cliente, setCliente] = useState("");
  const [numero, setNumero] = useState("");
  const [fecha, setFecha] = useState<Date | undefined>(new Date());
  const [detalle, setDetalle] = useState("");
  const [total, setTotal] = useState("");
  const [pagada, setPagada] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Aquí iría lógica para guardar en Supabase
    console.log({
      cliente,
      numero,
      fecha,
      detalle,
      total,
      pagada,
    });

    // Limpiar campos (opcional)
    setCliente("");
    setNumero("");
    setFecha(new Date());
    setDetalle("");
    setTotal("");
    setPagada(false);
  };

  return (
    <Card className="w-full max-w-md bg-background shadow-lg border rounded-2xl">
      <CardHeader>
        <CardTitle className="text-sm text-muted-foreground">
          Registrar Factura
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label>Cliente</Label>
            <Input
              value={cliente}
              onChange={(e) => setCliente(e.target.value)}
              placeholder="Nombre del cliente"
              required
            />
          </div>

          <div className="space-y-1">
            <Label>Número de Factura</Label>
            <Input
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
              placeholder="Ej: 12345"
              required
            />
          </div>

          <div className="space-y-1">
            <Label>Fecha</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {fecha ? format(fecha, "PPP", { locale: es }) : "Selecciona una fecha"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-popover" align="start">
                <Calendar
                  mode="single"
                  selected={fecha}
                  onSelect={setFecha}
                  locale={es}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-1">
            <Label>Detalle</Label>
            <Textarea
              value={detalle}
              onChange={(e) => setDetalle(e.target.value)}
              placeholder="Descripción de la factura"
              rows={3}
            />
          </div>

          <div className="space-y-1">
            <Label>Total</Label>
            <Input
              value={total}
              onChange={(e) => setTotal(e.target.value)}
              placeholder="$0"
              required
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="pagada"
              checked={pagada}
              onCheckedChange={(checked) => setPagada(!!checked)}
            />
            <Label htmlFor="pagada">¿Pagada?</Label>
          </div>

          <Button type="submit" className="w-full">
            Guardar Factura
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

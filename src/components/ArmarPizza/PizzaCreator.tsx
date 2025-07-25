// PizzaCreator.tsx
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Loader2, Plus, Trash2, Save } from "lucide-react";
import { toast } from "sonner";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

import type { Ingrediente, IngredienteUsado } from "./types";
import { PIZZA_BASE } from "./types";
import {
  formatCurrency, calcularPrecio, obtenerIngrediente,
  calcularCostoTotal, calcularPrecioSugerido
} from "./utils";

interface PizzaCreatorProps {
  ingredientesDisponibles: Ingrediente[];
  onSave: (pizza: { nombre: string; ingredientes: IngredienteUsado[]; precio: number }) => Promise<void>;
  loading: boolean;
}

export default function PizzaCreator({ ingredientesDisponibles, onSave, loading }: PizzaCreatorProps) {
  const [ingredientesAdicionales, setIngredientesAdicionales] = useState<IngredienteUsado[]>([]);
  const [selectedIngrediente, setSelectedIngrediente] = useState<string>("");
  const [nombrePizza, setNombrePizza] = useState<string>("");
  const [margen, setMargen] = useState<number>(60);

  const ingredientesTotales = [
    ...PIZZA_BASE.map((nombre) => ({
      nombre,
      cantidad: obtenerIngrediente(nombre, ingredientesDisponibles)?.porcion || 0,
    })).filter(ing => ing.cantidad > 0),
    ...ingredientesAdicionales,
  ];

  const ingredientesBaseFaltantes = PIZZA_BASE.filter(nombre =>
    !ingredientesDisponibles.some(ing => ing.nombre === nombre && ing.porcion > 0)
  );

  const costoTotal = calcularCostoTotal(ingredientesTotales, ingredientesDisponibles);
  const precioSugerido = calcularPrecioSugerido(costoTotal, margen);

  const agregarIngredienteUsado = () => {
    const ingrediente = obtenerIngrediente(selectedIngrediente, ingredientesDisponibles);
    if (!ingrediente) {
      toast.error("Selecciona un ingrediente válido");
      return;
    }
    if (PIZZA_BASE.includes(ingrediente.nombre as any)) {
      toast.error("Este es un ingrediente base y ya está incluido");
      return;
    }
    if (ingredientesAdicionales.some(ing => ing.nombre === ingrediente.nombre)) {
      toast.error("Este ingrediente ya fue agregado");
      return;
    }

    setIngredientesAdicionales(prev => [...prev, {
      nombre: ingrediente.nombre,
      cantidad: ingrediente.porcion,
    }]);
    setSelectedIngrediente("");
    toast.success(`${ingrediente.nombre} agregado`);
  };

  const removerIngredienteAdicional = (index: number) => {
    const { nombre } = ingredientesAdicionales[index];
    setIngredientesAdicionales(prev => prev.filter((_, i) => i !== index));
    toast.success(`${nombre} eliminado`);
  };

  const modificarCantidad = (index: number, nuevaCantidad: number) => {
    if (nuevaCantidad < 0) return;
    setIngredientesAdicionales(prev =>
      prev.map((ing, i) => i === index ? { ...ing, cantidad: nuevaCantidad } : ing)
    );
  };

  const limpiarFormulario = () => {
    setIngredientesAdicionales([]);
    setNombrePizza("");
    setSelectedIngrediente("");
    setMargen(60);
  };

  const handleGuardar = async () => {
    if (!nombrePizza.trim()) {
      toast.error("Ingresa un nombre para la pizza");
      return;
    }

    if (ingredientesBaseFaltantes.length > 0) {
      toast.error(`Faltan ingredientes base: ${ingredientesBaseFaltantes.join(", ")}`);
      return;
    }

    try {
      await onSave({
        nombre: nombrePizza.trim(),
        ingredientes: ingredientesTotales,
        precio: Math.round(precioSugerido)
      });
      limpiarFormulario();
    } catch (error) {
      toast.error("Ocurrió un error al guardar");
      console.error(error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
          <Plus className="w-5 h-5" /> Crear Nueva Pizza
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Alerta por ingredientes base faltantes */}
        {ingredientesBaseFaltantes.length > 0 && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-destructive space-y-1">
            <p className="font-semibold">⚠️ Ingredientes base faltantes:</p>
            <p>{ingredientesBaseFaltantes.join(", ")}</p>
            <p className="text-sm text-muted-foreground">
              Registra estos ingredientes en la pestaña <strong>Ingredientes</strong>.
            </p>
          </div>
        )}

        {/* Sección agregar ingredientes */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 rounded-lg bg-muted/30">
          <div className="md:col-span-2">
            <Label>Ingrediente adicional</Label>
            <Select value={selectedIngrediente} onValueChange={setSelectedIngrediente}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un ingrediente" />
              </SelectTrigger>
              <SelectContent>
                {ingredientesDisponibles
                  .filter(ing => !PIZZA_BASE.includes(ing.nombre as any) &&
                    !ingredientesAdicionales.some(ad => ad.nombre === ing.nombre))
                  .map(ing => (
                    <SelectItem key={ing.id} value={ing.nombre}>
                      {ing.nombre} ({ing.porcion} {ing.unidad})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2 flex items-end gap-2">
            <Button onClick={agregarIngredienteUsado} className="flex-1" disabled={!selectedIngrediente}>
              <Plus className="w-4 h-4 mr-1" /> Agregar
            </Button>
            <Button onClick={limpiarFormulario} variant="outline">
              Limpiar
            </Button>
          </div>
        </div>

        {/* Tabla de ingredientes */}
        <div className="border rounded-md overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ingrediente</TableHead>
                <TableHead>Cantidad</TableHead>
                <TableHead>Unidad</TableHead>
                <TableHead>$/kg</TableHead>
                <TableHead>Subtotal</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {ingredientesTotales.map((ing, i) => {
                const ingrediente = obtenerIngrediente(ing.nombre, ingredientesDisponibles);
                const subtotal = calcularPrecio(ingrediente, ing.cantidad);
                const esBase = PIZZA_BASE.includes(ing.nombre as any);
                const indexAdicional = ingredientesAdicionales.findIndex(a => a.nombre === ing.nombre);

                return (
                  <TableRow key={i}>
                    <TableCell>{ing.nombre}</TableCell>
                    <TableCell>
                      {esBase ? (
                        <span>{ing.cantidad}</span>
                      ) : (
                        <Input
                          type="number"
                          value={ing.cantidad}
                          onChange={(e) => modificarCantidad(indexAdicional, parseFloat(e.target.value) || 0)}
                          className="w-24"
                          min="0"
                          step="0.1"
                        />
                      )}
                    </TableCell>
                    <TableCell>{ingrediente?.unidad}</TableCell>
                    <TableCell>{ingrediente ? formatCurrency(ingrediente.precio_kilo) : "-"}</TableCell>
                    <TableCell>{formatCurrency(subtotal)}</TableCell>
                    <TableCell>
                      <Badge variant={esBase ? "default" : "secondary"}>
                        {esBase ? "Base" : "Extra"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {!esBase && (
                        <Button
                          onClick={() => removerIngredienteAdicional(indexAdicional)}
                          variant="ghost"
                          size="icon"
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Configuración de precio y nombre */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>Margen (%)</Label>
            <Input
              type="number"
              value={margen}
              onChange={(e) => setMargen(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
              min="0"
              max="100"
            />
          </div>
          <div className="md:col-span-2">
            <Label>Nombre de la pizza</Label>
            <Input
              placeholder="Ej: Pizza Napolitana"
              value={nombrePizza}
              onChange={(e) => setNombrePizza(e.target.value)}
              maxLength={50}
            />
          </div>
        </div>

        <Separator />

        {/* Resumen final */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-md bg-muted/30 text-center">
          <div>
            <p className="text-sm text-muted-foreground">Costo Total</p>
            <p className="text-lg font-semibold">{formatCurrency(costoTotal)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Margen</p>
            <p className="text-lg font-semibold text-green-600">{margen}%</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Precio Sugerido</p>
            <p className="text-lg font-bold text-purple-600">{formatCurrency(precioSugerido)}</p>
          </div>
        </div>

        <Button
          onClick={handleGuardar}
          disabled={loading || !nombrePizza.trim() || ingredientesBaseFaltantes.length > 0}
          size="lg"
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Guardar Pizza
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

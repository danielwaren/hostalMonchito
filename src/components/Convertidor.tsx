import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Ingrediente {
  nombre: string;
  unidad: string;
  precioKilo: number; // CLP por kg
}

interface IngredienteUsado {
  nombre: string;
  cantidad: number; // en gramos o ml o unidades
}

const INGREDIENTES_BASE: Ingrediente[] = [
  { nombre: "Queso", unidad: "g", precioKilo: 8000 },
  { nombre: "Salsa de tomate", unidad: "ml", precioKilo: 5000 },
  { nombre: "Masa", unidad: "unidad", precioKilo: 300 },
  { nombre: "Orégano", unidad: "g", precioKilo: 10000 },
  { nombre: "Jamón", unidad: "g", precioKilo: 18000 },
  { nombre: "Champiñones", unidad: "g", precioKilo: 20000 },
  { nombre: "Aceitunas", unidad: "g", precioKilo: 25000 },
  { nombre: "Pepperoni", unidad: "g", precioKilo: 22000 },
  { nombre: "Pollo", unidad: "g", precioKilo: 4000 },
  { nombre: "Choclo", unidad: "g", precioKilo: 12000 },
  { nombre: "Cebolla caramelizada", unidad: "g", precioKilo: 14000 },
  { nombre: "Camarón", unidad: "g", precioKilo: 35000 },
  { nombre: "Queso Philadelphia", unidad: "g", precioKilo: 28000 },
  { nombre: "Palmitos", unidad: "g", precioKilo: 30000 },
];

export default function PizzaCostCalculator() {
  const [ingredientesUsados, setIngredientesUsados] = useState<IngredienteUsado[]>([
    { nombre: "Queso", cantidad: 250 },
    { nombre: "Salsa de tomate", cantidad: 50 },
    { nombre: "Masa", cantidad: 1 },
    { nombre: "Orégano", cantidad: 2 },
  ]);
  const [nuevo, setNuevo] = useState<IngredienteUsado>({ nombre: "", cantidad: 0 });
  const [margen, setMargen] = useState(60);
  const [editIndex, setEditIndex] = useState<number | null>(null);

  const agregarIngrediente = () => {
    if (!nuevo.nombre) return;
    if (editIndex !== null) {
      const nuevos = [...ingredientesUsados];
      nuevos[editIndex] = nuevo;
      setIngredientesUsados(nuevos);
      setEditIndex(null);
    } else {
      setIngredientesUsados([...ingredientesUsados, nuevo]);
    }
    setNuevo({ nombre: "", cantidad: 0 });
  };

  const eliminarIngrediente = (index: number) => {
    setIngredientesUsados(ingredientesUsados.filter((_, i) => i !== index));
  };

  const editarIngrediente = (index: number) => {
    setNuevo(ingredientesUsados[index]);
    setEditIndex(index);
  };

  const obtenerPrecioKilo = (nombre: string) => {
    const encontrado = INGREDIENTES_BASE.find((i) => i.nombre === nombre);
    return encontrado ? encontrado.precioKilo : 0;
  };

  const obtenerUnidad = (nombre: string) => {
    const encontrado = INGREDIENTES_BASE.find((i) => i.nombre === nombre);
    return encontrado ? encontrado.unidad : "";
  };

  const calcularPrecio = (nombre: string, cantidad: number) => {
    const precioKilo = obtenerPrecioKilo(nombre);
    const unidad = obtenerUnidad(nombre);
    if (unidad === "unidad") return precioKilo * cantidad;
    return (precioKilo / 1000) * cantidad;
  };

  const costoTotal = ingredientesUsados.reduce((acc, ing) => acc + calcularPrecio(ing.nombre, ing.cantidad), 0);
  const precioSugerido = costoTotal / (1 - margen / 100);

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardContent className="p-6 space-y-6">
        <h2 className="text-lg font-semibold">Calculadora de Precio por Pizza</h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <Label>Ingrediente</Label>
            <select
              className="w-full border rounded-md px-3 py-2 bg-background dark:bg-gray-800 dark:border-gray-700"
              value={nuevo.nombre}
              onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })}
            >
              <option value="">Selecciona</option>
              {INGREDIENTES_BASE.map((ing) => (
                <option key={ing.nombre} value={ing.nombre}>
                  {ing.nombre}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Cantidad ({obtenerUnidad(nuevo.nombre)})</Label>
            <Input
              type="number"
              value={nuevo.cantidad}
              onChange={(e) => setNuevo({ ...nuevo, cantidad: parseFloat(e.target.value) })}
              placeholder="Ej: 100"
            />
          </div>
          <div className="flex items-end">
            <Button onClick={agregarIngrediente} className="w-full">
              {editIndex !== null ? "Guardar cambios" : "Agregar Ingrediente"}
            </Button>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ingrediente</TableHead>
              <TableHead>Cantidad</TableHead>
              <TableHead>Unidad</TableHead>
              <TableHead>Precio por kilo</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Acción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ingredientesUsados.map((ing, index) => {
              const precioKilo = obtenerPrecioKilo(ing.nombre);
              const unidad = obtenerUnidad(ing.nombre);
              const total = calcularPrecio(ing.nombre, ing.cantidad);
              return (
                <TableRow key={index}>
                  <TableCell>{ing.nombre}</TableCell>
                  <TableCell>{ing.cantidad}</TableCell>
                  <TableCell>{unidad}</TableCell>
                  <TableCell>{precioKilo.toLocaleString("es-CL", { style: "currency", currency: "CLP" })}</TableCell>
                  <TableCell>{total.toLocaleString("es-CL", { style: "currency", currency: "CLP" })}</TableCell>
                  <TableCell className="space-x-2">
                    <Button size="sm" variant="outline" onClick={() => editarIngrediente(index)}>
                      Editar
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => eliminarIngrediente(index)}>
                      Eliminar
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        <div className="space-y-2">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <Label className="w-full sm:w-auto">Margen de ganancia (%)</Label>
            <Input
              type="number"
              className="w-full sm:w-32"
              value={margen}
              onChange={(e) => setMargen(parseFloat(e.target.value))}
            />
          </div>
          <p>
            <strong>Costo Total:</strong> {costoTotal.toLocaleString("es-CL", { style: "currency", currency: "CLP" })}
          </p>
          <p>
            <strong>Precio sugerido de venta:</strong> {precioSugerido.toLocaleString("es-CL", {
              style: "currency",
              currency: "CLP",
            })}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

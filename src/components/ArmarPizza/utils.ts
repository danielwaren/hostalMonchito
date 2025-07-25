import type { Ingrediente, IngredienteUsado, PIZZA_BASE } from "./types";

export const formatCurrency = (amount: number) => 
  amount.toLocaleString("es-CL", { style: "currency", currency: "CLP" });

export const calcularPrecio = (ingrediente: Ingrediente | undefined, cantidad: number) => {
  if (!ingrediente) return 0;
  return ingrediente.unidad === "unidad" 
    ? ingrediente.precio_kilo * cantidad 
    : (ingrediente.precio_kilo / 1000) * cantidad;
};

export function obtenerIngrediente(nombre: string, ingredientes: Ingrediente[] = []) {
  return ingredientes.find(i => i.nombre === nombre);
}

export const calcularCostoTotal = (ingredientes: IngredienteUsado[], todosIngredientes: Ingrediente[]) => {
  return ingredientes.reduce((acc, ing) => {
    const ingrediente = obtenerIngrediente(ing.nombre, todosIngredientes);
    return acc + calcularPrecio(ingrediente, ing.cantidad);
  }, 0);
};

export const calcularPrecioSugerido = (costoTotal: number, margen: number) => 
  margen > 0 ? costoTotal / (1 - margen / 100) : costoTotal;
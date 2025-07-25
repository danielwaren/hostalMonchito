export interface Ingrediente {
  id: number;
  nombre: string;
  unidad: string;
  precio_kilo: number;
  porcion: number;
}

export interface IngredienteUsado {
  nombre: string;
  cantidad: number;
}

export interface Pizza {
  id?: number;
  nombre: string;
  ingredientes: IngredienteUsado[];
  precio: number;
  costo_total?: number;
  margen?: number;
}

export const PIZZA_BASE = ["Queso", "Salsa de tomate", "Masa", "Orégano", "Caja"] as const;
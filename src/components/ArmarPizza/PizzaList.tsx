"use client";

import { useEffect, useState } from "react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Card, CardHeader, CardTitle, CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader,
  AlertDialogTitle, AlertDialogDescription, AlertDialogFooter,
  AlertDialogCancel, AlertDialogAction,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Trash2, Pencil, Save, Loader2, PlusCircle, X } from "lucide-react";
import { formatCurrency } from "./utils";
import { supabase } from "@/lib/supabase";

interface Ingrediente {
  id: number;
  nombre: string;
  precio_kilo: number;
  unidad: string;
}

interface Pizza {
  id: number;
  nombre: string;
  precio: number;
}

interface PizzaListProps {
  pizzas: Pizza[];
  ingredientesDisponibles: Ingrediente[];
  loading: boolean;
  onDelete: (id: number, nombre: string) => Promise<void>;
  onRefresh: () => void;
}

const INGREDIENTES_BASE = ["Queso", "Salsa de tomates", "Masa", "Orégano", "Caja"];

export default function PizzaList({ pizzas, ingredientesDisponibles, loading, onDelete, onRefresh }: PizzaListProps) {
  const [editingPizza, setEditingPizza] = useState<Pizza | null>(null);
  const [editNombre, setEditNombre] = useState("");
  const [pizzaIngredientes, setPizzaIngredientes] = useState<{ ingrediente_id: number; cantidad: number }[]>([]);
  const [saving, setSaving] = useState(false);
  const [nuevoIngredienteId, setNuevoIngredienteId] = useState<number | "">("");

  const getIngredienteById = (id: number) => ingredientesDisponibles.find((ing) => ing.id === id);

  const calcularPrecio = () => pizzaIngredientes.reduce((acc, ing) => {
    const info = getIngredienteById(ing.ingrediente_id);
    return info ? acc + (info.precio_kilo * ing.cantidad) / 1000 : acc;
  }, 0);

  const ingredientesBase = ingredientesDisponibles.filter((i) => INGREDIENTES_BASE.includes(i.nombre));
  const ingredientesBaseIds = ingredientesBase.map((i) => i.id);
  const ingredientesExtras = pizzaIngredientes.filter((i) => !ingredientesBaseIds.includes(i.ingrediente_id));

  const handleEditClick = async (pizza: Pizza) => {
    setEditingPizza(pizza);
    setEditNombre(pizza.nombre);
    const { data, error } = await supabase.from("ingredientes_pizza").select("*").eq("pizza_id", pizza.id);
    if (error) toast.error("Error cargando ingredientes");
    else setPizzaIngredientes(data || []);
    setNuevoIngredienteId("");
  };

  const handleCantidadChange = (id: number, cantidad: number) => {
    setPizzaIngredientes((prev) => prev.map((ing) => ing.ingrediente_id === id ? { ...ing, cantidad } : ing));
  };

  const quitarIngrediente = (id: number) => {
    setPizzaIngredientes((prev) => prev.filter((ing) => ing.ingrediente_id !== id));
  };

  const handleAgregarIngrediente = () => {
    if (!nuevoIngredienteId || pizzaIngredientes.some((i) => i.ingrediente_id === nuevoIngredienteId)) return;
    setPizzaIngredientes((prev) => [...prev, { ingrediente_id: Number(nuevoIngredienteId), cantidad: 0 }]);
    setNuevoIngredienteId("");
  };

  const handleSave = async () => {
    if (!editingPizza || !editNombre.trim()) return toast.error("Nombre no válido");
    setSaving(true);
    const precio = calcularPrecio();
    const { error: errorPizza } = await supabase.from("pizzas").update({ nombre: editNombre.trim(), precio }).eq("id", editingPizza.id);
    if (errorPizza) {
      toast.error("Error actualizando pizza");
      setSaving(false);
      return;
    }
    await supabase.from("ingredientes_pizza").delete().eq("pizza_id", editingPizza.id);
    const { error: errorInsert } = await supabase.from("ingredientes_pizza").insert(pizzaIngredientes.map((i) => ({ pizza_id: editingPizza.id, ingrediente_id: i.ingrediente_id, cantidad: i.cantidad })));
    if (errorInsert) {
      toast.error("Error guardando ingredientes");
      setSaving(false);
      return;
    }
    toast.success("Pizza actualizada");
    setEditingPizza(null);
    setSaving(false);
    onRefresh();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Save className="h-5 w-5" /> Lista de Pizzas ({pizzas.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {pizzas.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">No hay pizzas registradas.</p>
        ) : (
          <div className="overflow-auto border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead className="text-center">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pizzas.map((pizza) => (
                  <TableRow key={pizza.id}>
                    <TableCell className="font-medium">{pizza.nombre}</TableCell>
                    <TableCell>{formatCurrency(pizza.precio)}</TableCell>
                    <TableCell className="flex justify-center gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" onClick={() => handleEditClick(pizza)}>
                            <Pencil className="w-4 h-4 mr-1" /> Editar
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Editar Pizza</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <Input value={editNombre} onChange={(e) => setEditNombre(e.target.value)} placeholder="Nombre" />
                            {[...ingredientesBase, ...ingredientesExtras.map(i => getIngredienteById(i.ingrediente_id)).filter(Boolean)].map((ing) => {
                              const ingId = (ing as Ingrediente).id;
                              const ingData = pizzaIngredientes.find((i) => i.ingrediente_id === ingId);
                              if (!ingData) return null;
                              return (
                                <div key={ingId} className="flex items-center gap-2">
                                  <span className="w-40">{(ing as Ingrediente).nombre}</span>
                                  <Input type="number" className="w-32" value={ingData.cantidad} onChange={(e) => handleCantidadChange(ingId, parseFloat(e.target.value) || 0)} />
                                  {!INGREDIENTES_BASE.includes((ing as Ingrediente).nombre) && (
                                    <Button size="icon" variant="ghost" onClick={() => quitarIngrediente(ingId)}>
                                      <X className="w-4 h-4" />
                                    </Button>
                                  )}
                                </div>
                              );
                            })}
                            <div className="flex items-center gap-2">
                              <select value={nuevoIngredienteId} onChange={(e) => setNuevoIngredienteId(Number(e.target.value))} className="border p-2 rounded text-sm">
                                <option value="">Agregar ingrediente...</option>
                                {ingredientesDisponibles.filter((i) => !pizzaIngredientes.some((pi) => pi.ingrediente_id === i.id)).map((i) => (
                                  <option key={i.id} value={i.id}>{i.nombre}</option>
                                ))}
                              </select>
                              <Button onClick={handleAgregarIngrediente} size="sm">
                                <PlusCircle className="w-4 h-4 mr-1" /> Agregar
                              </Button>
                            </div>
                            <div className="font-medium mt-4">Precio total: {formatCurrency(calcularPrecio())}</div>
                            <Button onClick={handleSave} disabled={saving} className="w-full mt-4">
                              {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Guardando...</> : <><Save className="h-4 w-4 mr-2" /> Guardar cambios</>}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="destructive" disabled={loading}>
                            <Trash2 className="w-4 h-4 mr-1" /> Eliminar
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Eliminar esta pizza?</AlertDialogTitle>
                            <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => onDelete(pizza.id, pizza.nombre)} className="bg-red-600 hover:bg-red-700">
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

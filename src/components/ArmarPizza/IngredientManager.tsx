import { useState } from "react";
import {
  Card, CardHeader, CardTitle, CardContent
} from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
  Loader2, Plus, Package, RefreshCw, Pencil, Trash2
} from "lucide-react";
import { toast } from "sonner";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction
} from "@/components/ui/alert-dialog";
import { formatCurrency } from "./utils";
import type { Ingrediente } from "./types";
import { PIZZA_BASE } from "./types";

export interface IngredientManagerProps {
  ingredientesDisponibles: Ingrediente[];
  onAddIngredient: (ingrediente: Omit<Ingrediente, "id">) => Promise<void>;
  onUpdateIngredient: (ingrediente: Ingrediente) => Promise<void>;
  onDeleteIngredient: (id: number) => Promise<void>;
  onRefresh: () => Promise<void>;
  loading: boolean;
}

export default function IngredientManager({
  ingredientesDisponibles,
  onAddIngredient,
  onUpdateIngredient,
  onDeleteIngredient,
  onRefresh,
  loading,
}: IngredientManagerProps) {
  const [nuevoIngrediente, setNuevoIngrediente] = useState<Omit<Ingrediente, "id">>({
    nombre: "",
    unidad: "g",
    precio_kilo: 0,
    porcion: 0,
  });

  const [ingredienteEditando, setIngredienteEditando] = useState<Ingrediente | null>(null);
  const [modalAbierto, setModalAbierto] = useState(false);

  const handleAgregarIngrediente = async () => {
    const { nombre, precio_kilo, porcion } = nuevoIngrediente;

    if (!nombre.trim()) return toast.error("El nombre del ingrediente es requerido");
    if (precio_kilo <= 0) return toast.error("El precio debe ser mayor a 0");
    if (porcion < 0) return toast.error("La porción no puede ser negativa");

    const yaExiste = ingredientesDisponibles.some(
      (ing) => ing.nombre.toLowerCase() === nombre.trim().toLowerCase()
    );
    if (yaExiste) return toast.error("Ya existe un ingrediente con ese nombre");

    try {
      await onAddIngredient({ ...nuevoIngrediente, nombre: nombre.trim() });
      setNuevoIngrediente({ nombre: "", unidad: "g", precio_kilo: 0, porcion: 0 });
      toast.success("Ingrediente agregado");
    } catch (error) {
      console.error(error);
      toast.error("Error al agregar ingrediente");
    }
  };

  const handleGuardarEdicion = async () => {
    if (!ingredienteEditando) return;

    const { nombre, precio_kilo, porcion } = ingredienteEditando;

    if (!nombre.trim()) return toast.error("El nombre es obligatorio");
    if (precio_kilo <= 0) return toast.error("El precio debe ser mayor a 0");
    if (porcion < 0) return toast.error("La porción no puede ser negativa");

    try {
      await onUpdateIngredient({ ...ingredienteEditando, nombre: nombre.trim() });
      toast.success("Ingrediente actualizado");
      setModalAbierto(false);
      setIngredienteEditando(null);
    } catch (error) {
      console.error(error);
      toast.error("Error al actualizar ingrediente");
    }
    console.log(typeof onUpdateIngredient); // Debe imprimir: 'function'

  };

  const handleCerrarModal = () => {
    setModalAbierto(false);
    setIngredienteEditando(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
          <Package className="w-5 h-5" />
          Gestión de Ingredientes
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Formulario para agregar */}
        <div className="bg-muted/30 p-4 rounded-md space-y-4">
          <h3 className="text-base font-medium">Registrar Nuevo Ingrediente</h3>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="nombre">Nombre</Label>
              <Input
                id="nombre"
                value={nuevoIngrediente.nombre}
                onChange={(e) => setNuevoIngrediente({ ...nuevoIngrediente, nombre: e.target.value })}
                placeholder="Ej: Jamón"
                maxLength={50}
              />
            </div>
            <div>
              <Label htmlFor="unidad">Unidad</Label>
              <Select
                value={nuevoIngrediente.unidad}
                onValueChange={(value) =>
                  setNuevoIngrediente({ ...nuevoIngrediente, unidad: value as "g" | "ml" | "unidad" })
                }
              >
                <SelectTrigger><SelectValue placeholder="Selecciona unidad" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="g">Gramos (g)</SelectItem>
                  <SelectItem value="ml">Mililitros (ml)</SelectItem>
                  <SelectItem value="unidad">Unidad</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="precio">Precio por kilo/unidad</Label>
              <Input
                id="precio"
                type="number"
                value={nuevoIngrediente.precio_kilo || ""}
                onChange={(e) => setNuevoIngrediente({ ...nuevoIngrediente, precio_kilo: parseFloat(e.target.value) || 0 })}
                min="0"
                step="0.01"
                placeholder="0"
              />
            </div>
            <div>
              <Label htmlFor="porcion">Porción por pizza</Label>
              <Input
                id="porcion"
                type="number"
                value={nuevoIngrediente.porcion || ""}
                onChange={(e) => setNuevoIngrediente({ ...nuevoIngrediente, porcion: parseFloat(e.target.value) || 0 })}
                min="0"
                step="0.1"
                placeholder="0"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleAgregarIngrediente} className="w-full" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="h-4 w-4 mr-2" />Agregar</>}
              </Button>
            </div>
          </div>
        </div>

        {/* Tabla */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium text-base">Ingredientes Registrados ({ingredientesDisponibles.length})</h3>
            <Button onClick={onRefresh} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-1" />
              Actualizar
            </Button>
          </div>

          {ingredientesDisponibles.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <Package className="h-10 w-10 mx-auto mb-4 opacity-50" />
              <p className="font-medium">No hay ingredientes registrados</p>
              <p className="text-sm">Agrega el primer ingrediente arriba</p>
            </div>
          ) : (
            <div className="border rounded-md overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Unidad</TableHead>
                    <TableHead>Precio</TableHead>
                    <TableHead>Porción</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ingredientesDisponibles.map((ing) => (
                    <TableRow key={ing.id}>
                      <TableCell className="font-medium">{ing.nombre}</TableCell>
                      <TableCell>{ing.unidad}</TableCell>
                      <TableCell>{formatCurrency(ing.precio_kilo)}</TableCell>
                      <TableCell>{ing.porcion} {ing.unidad}</TableCell>
                      <TableCell>
                        <Badge variant={PIZZA_BASE.includes(ing.nombre) ? "default" : "secondary"}>
                          {PIZZA_BASE.includes(ing.nombre) ? "Base" : "Extra"}
                        </Badge>
                      </TableCell>
                      <TableCell className="flex gap-2 justify-end">

                        <Dialog open={modalAbierto && ingredienteEditando?.id === ing.id} onOpenChange={setModalAbierto}>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => {
                                setIngredienteEditando(ing);
                                setModalAbierto(true);
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>

                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Editar Ingrediente</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <Label>Nombre</Label>
                              <Input
                                value={ingredienteEditando?.nombre || ""}
                                onChange={(e) =>
                                  setIngredienteEditando((prev) => (prev ? { ...prev, nombre: e.target.value } : prev))
                                }
                                placeholder="Nombre"
                              />
                              <Label>Unidad</Label>
                              <Select
                                value={ingredienteEditando?.unidad}
                                onValueChange={(value) =>
                                  setIngredienteEditando((prev) =>
                                    prev ? { ...prev, unidad: value as "g" | "ml" | "unidad" } : prev
                                  )
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Unidad" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="g">Gramos (g)</SelectItem>
                                  <SelectItem value="ml">Mililitros (ml)</SelectItem>
                                  <SelectItem value="unidad">Unidad</SelectItem>
                                </SelectContent>
                              </Select>
                              <Label>Precio</Label>
                              <Input
                                type="number"
                                value={ingredienteEditando?.precio_kilo || 0}
                                onChange={(e) =>
                                  setIngredienteEditando((prev) =>
                                    prev ? { ...prev, precio_kilo: parseFloat(e.target.value) || 0 } : prev
                                  )
                                }
                                placeholder="Precio"
                              />
                              <Label>Porción por pizza</Label>
                              <Input
                                type="number"
                                value={ingredienteEditando?.porcion || 0}
                                onChange={(e) =>
                                  setIngredienteEditando((prev) =>
                                    prev ? { ...prev, porcion: parseFloat(e.target.value) || 0 } : prev
                                  )
                                }
                                placeholder="Porción"
                              />
                            </div>
                            <DialogFooter>
                              <Button onClick={handleGuardarEdicion}>Guardar cambios</Button>
                              <Button variant="outline" onClick={handleCerrarModal} className="ml-2">
                                Cancelar
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="icon">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Eliminar ingrediente?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esto eliminará permanentemente el ingrediente <strong>{ing.nombre}</strong>.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={async () => {
                                  try {
                                    await onDeleteIngredient(ing.id);
                                    toast.success("Ingrediente eliminado");
                                  } catch {
                                    toast.error("Error al eliminar ingrediente");
                                  }
                                }}
                                className="bg-red-600 hover:bg-red-700"
                              >
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
        </div>
      </CardContent>
    </Card>
  );
}

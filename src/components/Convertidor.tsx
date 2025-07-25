import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Loader2, Trash2, Plus, Calculator, Save, Package } from "lucide-react";

interface Ingrediente {
  id: number;
  nombre: string;
  unidad: string;
  precio_kilo: number;
  porcion: number;
}

interface IngredienteUsado {
  nombre: string;
  cantidad: number;
}

interface Pizza {
  id?: number;
  nombre: string;
  ingredientes: IngredienteUsado[];
  precio: number;
  costo_total?: number;
  margen?: number;
}

const PIZZA_BASE = ["Queso", "Salsa de tomate", "Masa", "Orégano", "Caja"];

export default function PizzaBuilderTabs() {
  const [ingredientesDisponibles, setIngredientesDisponibles] = useState<Ingrediente[]>([]);
  const [ingredientesAdicionales, setIngredientesAdicionales] = useState<IngredienteUsado[]>([]);
  const [selectedIngrediente, setSelectedIngrediente] = useState<string>("");
  const [nuevoIngrediente, setNuevoIngrediente] = useState<Omit<Ingrediente, "id">>({
    nombre: "", 
    unidad: "g", 
    precio_kilo: 0, 
    porcion: 0,
  });
  const [margen, setMargen] = useState<number>(60);
  const [pizzas, setPizzas] = useState<Pizza[]>([]);
  const [nombrePizza, setNombrePizza] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("armar");

  // Fetch ingredientes disponibles
  const fetchIngredientes = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("ingredientes")
        .select("*")
        .order("nombre");
      
      if (error) throw error;
      if (data) setIngredientesDisponibles(data);
    } catch (error) {
      console.error("Error fetching ingredientes:", error);
      toast.error("Error al cargar los ingredientes");
    }
  }, []);

  // Fetch pizzas guardadas
  const fetchPizzas = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("pizzas")
        .select(`
          id,
          nombre,
          precio,
          ingredientes_pizza(
            cantidad,
            ingrediente:ingredientes(*)
          )
        `)
        .order("nombre");

      if (error) throw error;
      
      if (data) {
        const formateadas: Pizza[] = data.map((p) => ({
          id: p.id,
          nombre: p.nombre,
          precio: p.precio,
          ingredientes: p.ingredientes_pizza
            .filter(ip => ip.ingrediente) // Filtrar ingredientes null
            .map((ip) => ({
              nombre: ip.ingrediente!.nombre,
              cantidad: ip.cantidad,
            })),
        }));
        setPizzas(formateadas);
      }
    } catch (error) {
      console.error("Error fetching pizzas:", error);
      toast.error("Error al cargar las pizzas");
    }
  }, []);

  useEffect(() => {
    fetchIngredientes();
    fetchPizzas();
  }, [fetchIngredientes, fetchPizzas]);

  // Funciones auxiliares
  const obtenerIngrediente = useCallback((nombre: string) => 
    ingredientesDisponibles.find((i) => i.nombre === nombre)
  , [ingredientesDisponibles]);

  const obtenerPrecioKilo = useCallback((nombre: string) => 
    obtenerIngrediente(nombre)?.precio_kilo ?? 0
  , [obtenerIngrediente]);

  const obtenerUnidad = useCallback((nombre: string) => 
    obtenerIngrediente(nombre)?.unidad ?? ""
  , [obtenerIngrediente]);

  const obtenerPorcion = useCallback((nombre: string) => 
    obtenerIngrediente(nombre)?.porcion ?? 0
  , [obtenerIngrediente]);

  const calcularPrecio = useCallback((nombre: string, cantidad: number) => {
    const unidad = obtenerUnidad(nombre);
    const precioKilo = obtenerPrecioKilo(nombre);
    return unidad === "unidad" ? precioKilo * cantidad : (precioKilo / 1000) * cantidad;
  }, [obtenerUnidad, obtenerPrecioKilo]);

  // Ingredientes totales de la pizza
  const ingredientesTotales = [
    ...PIZZA_BASE.map((n) => ({
      nombre: n,
      cantidad: obtenerPorcion(n),
    })).filter(ing => ing.cantidad > 0), // Solo incluir ingredientes base con porción > 0
    ...ingredientesAdicionales,
  ];

  // Cálculos de precio
  const costoTotal = ingredientesTotales.reduce(
    (acc, ing) => acc + calcularPrecio(ing.nombre, ing.cantidad), 0
  );
  const precioSugerido = margen > 0 ? costoTotal / (1 - margen / 100) : costoTotal;

  // Validar si todos los ingredientes base están disponibles
  const ingredientesBaseFaltantes = PIZZA_BASE.filter(nombre => 
    !ingredientesDisponibles.some(ing => ing.nombre === nombre && ing.porcion > 0)
  );

  // Agregar ingrediente disponible
  const agregarIngredienteDisponible = async () => {
    if (!nuevoIngrediente.nombre.trim()) {
      toast.error("El nombre del ingrediente es requerido");
      return;
    }
    
    if (nuevoIngrediente.precio_kilo <= 0) {
      toast.error("El precio debe ser mayor a 0");
      return;
    }
    
    if (nuevoIngrediente.porcion < 0) {
      toast.error("La porción no puede ser negativa");
      return;
    }

    // Verificar si el ingrediente ya existe
    const existeIngrediente = ingredientesDisponibles.some(
      ing => ing.nombre.toLowerCase() === nuevoIngrediente.nombre.toLowerCase()
    );
    
    if (existeIngrediente) {
      toast.error("Ya existe un ingrediente con ese nombre");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("ingredientes")
        .insert([{
          ...nuevoIngrediente,
          nombre: nuevoIngrediente.nombre.trim()
        }])
        .select("*")
        .single();

      if (error) throw error;

      if (data) {
        setIngredientesDisponibles(prev => [...prev, data].sort((a, b) => a.nombre.localeCompare(b.nombre)));
        setNuevoIngrediente({ nombre: "", unidad: "g", precio_kilo: 0, porcion: 0 });
        toast.success(`Ingrediente "${data.nombre}" agregado correctamente`);
      }
    } catch (error) {
      console.error("Error adding ingredient:", error);
      toast.error("Error al agregar el ingrediente");
    } finally {
      setLoading(false);
    }
  };

  // Agregar ingrediente a la pizza
  const agregarIngredienteUsado = () => {
    if (!selectedIngrediente) {
      toast.error("Selecciona un ingrediente");
      return;
    }

    const ingrediente = obtenerIngrediente(selectedIngrediente);
    if (!ingrediente) {
      toast.error("Ingrediente no encontrado");
      return;
    }

    // Verificar si ya está agregado
    const yaAgregado = ingredientesAdicionales.some(ing => ing.nombre === ingrediente.nombre);
    if (yaAgregado) {
      toast.error("Este ingrediente ya fue agregado");
      return;
    }

    // Verificar si es un ingrediente base
    const esIngredienteBase = PIZZA_BASE.includes(ingrediente.nombre);
    if (esIngredienteBase) {
      toast.error("Este es un ingrediente base y ya está incluido");
      return;
    }

    setIngredientesAdicionales(prev => [...prev, {
      nombre: ingrediente.nombre,
      cantidad: ingrediente.porcion,
    }]);
    
    setSelectedIngrediente("");
    toast.success(`${ingrediente.nombre} agregado a la pizza`);
  };

  // Remover ingrediente adicional
  const removerIngredienteAdicional = (index: number) => {
    const ingrediente = ingredientesAdicionales[index];
    setIngredientesAdicionales(prev => prev.filter((_, i) => i !== index));
    toast.success(`${ingrediente.nombre} removido de la pizza`);
  };

  // Modificar cantidad de ingrediente
  const modificarCantidad = (index: number, nuevaCantidad: number) => {
    if (nuevaCantidad < 0) return;
    
    setIngredientesAdicionales(prev => 
      prev.map((ing, i) => 
        i === index ? { ...ing, cantidad: nuevaCantidad } : ing
      )
    );
  };

  // Guardar pizza
  const guardarPizza = async () => {
    if (!nombrePizza.trim()) {
      toast.error("Ingresa un nombre para la pizza");
      return;
    }

    if (ingredientesBaseFaltantes.length > 0) {
      toast.error(`Faltan ingredientes base: ${ingredientesBaseFaltantes.join(", ")}`);
      return;
    }

    if (ingredientesTotales.length === 0) {
      toast.error("La pizza debe tener al menos un ingrediente");
      return;
    }

    // Verificar si ya existe una pizza con el mismo nombre
    const existePizza = pizzas.some(
      pizza => pizza.nombre.toLowerCase() === nombrePizza.trim().toLowerCase()
    );
    
    if (existePizza) {
      toast.error("Ya existe una pizza con ese nombre");
      return;
    }

    setLoading(true);
    try {
      // Guardar pizza
      const { data: pizza, error: pizzaError } = await supabase
        .from("pizzas")
        .insert([{ 
          nombre: nombrePizza.trim(), 
          precio: Math.round(precioSugerido) 
        }])
        .select("id")
        .single();

      if (pizzaError || !pizza) throw pizzaError;

      // Preparar relaciones ingredientes-pizza
      const relaciones = ingredientesTotales
        .map((ing) => {
          const ingredienteRef = obtenerIngrediente(ing.nombre);
          return ingredienteRef ? {
            pizza_id: pizza.id,
            ingrediente_id: ingredienteRef.id,
            cantidad: ing.cantidad,
          } : null;
        })
        .filter(Boolean);

      if (relaciones.length === 0) {
        throw new Error("No se pudieron vincular los ingredientes");
      }

      // Insertar relaciones
      const { error: relacionesError } = await supabase
        .from("ingredientes_pizza")
        .insert(relaciones);

      if (relacionesError) throw relacionesError;

      // Actualizar estado local
      const nuevaPizza: Pizza = {
        id: pizza.id,
        nombre: nombrePizza.trim(),
        ingredientes: ingredientesTotales,
        precio: Math.round(precioSugerido),
        costo_total: costoTotal,
        margen: margen
      };

      setPizzas(prev => [...prev, nuevaPizza].sort((a, b) => a.nombre.localeCompare(b.nombre)));
      
      // Limpiar formulario
      setIngredientesAdicionales([]);
      setNombrePizza("");
      setSelectedIngrediente("");
      
      toast.success(`🍕 Pizza "${nombrePizza}" guardada correctamente!`, {
        description: `Precio: ${precioSugerido.toLocaleString("es-CL", { style: "currency", currency: "CLP" })}`
      });

      // Cambiar a la pestaña de pizzas guardadas
      setActiveTab("guardadas");
      
    } catch (error) {
      console.error("Error saving pizza:", error);
      toast.error("Error al guardar la pizza");
    } finally {
      setLoading(false);
    }
  };

  // Eliminar pizza
  const eliminarPizza = async (pizzaId: number, nombrePizza: string) => {
    setLoading(true);
    try {
      // Eliminar relaciones primero
      await supabase.from("ingredientes_pizza").delete().eq("pizza_id", pizzaId);
      
      // Eliminar pizza
      const { error } = await supabase.from("pizzas").delete().eq("id", pizzaId);
      
      if (error) throw error;

      setPizzas(prev => prev.filter(p => p.id !== pizzaId));
      toast.success(`Pizza "${nombrePizza}" eliminada correctamente`);
      
    } catch (error) {
      console.error("Error deleting pizza:", error);
      toast.error("Error al eliminar la pizza");
    } finally {
      setLoading(false);
    }
  };

  // Limpiar formulario de pizza
  const limpiarFormulario = () => {
    setIngredientesAdicionales([]);
    setNombrePizza("");
    setSelectedIngrediente("");
    setMargen(60);
  };

  const formatCurrency = (amount: number) => 
    amount.toLocaleString("es-CL", { style: "currency", currency: "CLP" });

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="armar" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Armar Pizza
          </TabsTrigger>
          <TabsTrigger value="ingredientes" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Ingredientes
          </TabsTrigger>
          <TabsTrigger value="guardadas" className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            Pizzas ({pizzas.length})
          </TabsTrigger>
        </TabsList>

        {/* Armar Pizza */}
        <TabsContent value="armar" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Armar Nueva Pizza
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Alertas */}
              {ingredientesBaseFaltantes.length > 0 && (
                <div className="p-4 border border-orange-200 bg-orange-50 rounded-lg">
                  <p className="text-orange-800 font-medium">⚠️ Ingredientes base faltantes:</p>
                  <p className="text-orange-700">{ingredientesBaseFaltantes.join(", ")}</p>
                  <p className="text-sm text-orange-600 mt-1">
                    Registra estos ingredientes en la pestaña "Ingredientes" para poder crear pizzas.
                  </p>
                </div>
              )}

              {/* Agregar ingredientes */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="md:col-span-2">
                  <Label htmlFor="ingrediente-select">Ingrediente adicional</Label>
                  <Select value={selectedIngrediente} onValueChange={setSelectedIngrediente}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un ingrediente" />
                    </SelectTrigger>
                    <SelectContent>
                      {ingredientesDisponibles
                        .filter(ing => 
                          !PIZZA_BASE.includes(ing.nombre) && 
                          !ingredientesAdicionales.some(usado => usado.nombre === ing.nombre)
                        )
                        .map((ing) => (
                          <SelectItem key={ing.id} value={ing.nombre}>
                            {ing.nombre} ({ing.porcion} {ing.unidad})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2 flex items-end gap-2">
                  <Button 
                    onClick={agregarIngredienteUsado} 
                    className="flex-1"
                    disabled={!selectedIngrediente}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar
                  </Button>
                  <Button 
                    onClick={limpiarFormulario} 
                    variant="outline"
                    disabled={ingredientesAdicionales.length === 0 && !nombrePizza}
                  >
                    Limpiar
                  </Button>
                </div>
              </div>

              {/* Tabla de ingredientes */}
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ingrediente</TableHead>
                      <TableHead>Cantidad</TableHead>
                      <TableHead>Unidad</TableHead>
                      <TableHead>Precio/kg</TableHead>
                      <TableHead>Subtotal</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ingredientesTotales.map((ing, i) => {
                      const unidad = obtenerUnidad(ing.nombre);
                      const precioKilo = obtenerPrecioKilo(ing.nombre);
                      const subtotal = calcularPrecio(ing.nombre, ing.cantidad);
                      const esBase = PIZZA_BASE.includes(ing.nombre);
                      const indexAdicional = ingredientesAdicionales.findIndex(
                        adicional => adicional.nombre === ing.nombre
                      );

                      return (
                        <TableRow key={i}>
                          <TableCell className="font-medium">{ing.nombre}</TableCell>
                          <TableCell>
                            {esBase ? (
                              <span>{ing.cantidad}</span>
                            ) : (
                              <Input
                                type="number"
                                value={ing.cantidad}
                                onChange={(e) => modificarCantidad(indexAdicional, parseFloat(e.target.value) || 0)}
                                className="w-20"
                                min="0"
                                step="0.1"
                              />
                            )}
                          </TableCell>
                          <TableCell>{unidad}</TableCell>
                          <TableCell>{formatCurrency(precioKilo)}</TableCell>
                          <TableCell className="font-medium">{formatCurrency(subtotal)}</TableCell>
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
                                size="sm"
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

              {/* Configuración de precio */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="margen">Margen de Ganancia (%)</Label>
                  <Input
                    id="margen"
                    type="number"
                    value={margen}
                    onChange={(e) => setMargen(parseFloat(e.target.value) || 0)}
                    min="0"
                    max="100"
                    step="1"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="nombre-pizza">Nombre de la Pizza</Label>
                  <Input
                    id="nombre-pizza"
                    placeholder="Ej: Pizza Napolitana"
                    value={nombrePizza}
                    onChange={(e) => setNombrePizza(e.target.value)}
                    maxLength={50}
                  />
                </div>
              </div>

              <Separator />

              {/* Resumen de costos */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-blue-50 rounded-lg">
                <div className="text-center">
                  <p className="text-sm text-gray-600">Costo Total</p>
                  <p className="text-lg font-bold text-blue-600">{formatCurrency(costoTotal)}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Margen</p>
                  <p className="text-lg font-bold text-green-600">{margen}%</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Precio Sugerido</p>
                  <p className="text-xl font-bold text-purple-600">{formatCurrency(precioSugerido)}</p>
                </div>
              </div>

              <Button 
                onClick={guardarPizza} 
                className="w-full" 
                size="lg"
                disabled={loading || !nombrePizza.trim() || ingredientesBaseFaltantes.length > 0}
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
        </TabsContent>

        {/* Registrar Ingrediente */}
        <TabsContent value="ingredientes" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Gestión de Ingredientes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Formulario nuevo ingrediente */}
              <div className="p-4 border rounded-lg bg-gray-50">
                <h3 className="font-medium mb-4">Registrar Nuevo Ingrediente</h3>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div>
                    <Label htmlFor="nombre">Nombre</Label>
                    <Input 
                      id="nombre"
                      value={nuevoIngrediente.nombre} 
                      onChange={(e) => setNuevoIngrediente({ 
                        ...nuevoIngrediente, 
                        nombre: e.target.value 
                      })}
                      placeholder="Ej: Jamón"
                      maxLength={50}
                    />
                  </div>
                  <div>
                    <Label htmlFor="unidad">Unidad</Label>
                    <Select 
                      value={nuevoIngrediente.unidad}
                      onValueChange={(value) => setNuevoIngrediente({ 
                        ...nuevoIngrediente, 
                        unidad: value 
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
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
                      onChange={(e) => setNuevoIngrediente({ 
                        ...nuevoIngrediente, 
                        precio_kilo: parseFloat(e.target.value) || 0 
                      })}
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
                      onChange={(e) => setNuevoIngrediente({ 
                        ...nuevoIngrediente, 
                        porcion: parseFloat(e.target.value) || 0 
                      })}
                      min="0"
                      step="0.1"
                      placeholder="0"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button 
                      onClick={agregarIngredienteDisponible} 
                      className="w-full"
                      disabled={loading}
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Agregar
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Lista de ingredientes */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-medium">
                    Ingredientes Registrados ({ingredientesDisponibles.length})
                  </h3>
                  <Button onClick={fetchIngredientes} variant="outline" size="sm">
                    Actualizar
                  </Button>
                </div>
                
                {ingredientesDisponibles.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No hay ingredientes registrados</p>
                    <p className="text-sm">Agrega el primer ingrediente arriba</p>
                  </div>
                ) : (
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nombre</TableHead>
                          <TableHead>Unidad</TableHead>
                          <TableHead>Precio</TableHead>
                          <TableHead>Porción</TableHead>
                          <TableHead>Tipo</TableHead>
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
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pizzas Registradas */}
        <TabsContent value="guardadas" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Save className="h-5 w-5" />
                Pizzas Registradas ({pizzas.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pizzas.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Calculator className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No hay pizzas registradas</p>
                  <p className="text-sm">Crea tu primera pizza en la pestaña "Armar Pizza"</p>
                  <Button 
                    onClick={() => setActiveTab("armar")} 
                    className="mt-4"
                    variant="outline"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Primera Pizza
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-600">
                      Total de pizzas: {pizzas.length}
                    </p>
                    <Button onClick={fetchPizzas} variant="outline" size="sm">
                      Actualizar
                    </Button>
                  </div>

                  <div className="grid gap-4">
                    {pizzas.map((pizza) => (
                      <Card key={pizza.id} className="border-l-4 border-l-blue-500">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h3 className="font-semibold text-lg">{pizza.nombre}</h3>
                              <p className="text-xl font-bold text-blue-600">
                                {formatCurrency(pizza.precio)}
                              </p>
                            </div>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>¿Eliminar pizza?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta acción eliminará permanentemente la pizza "{pizza.nombre}" y todos sus ingredientes asociados.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => pizza.id && eliminarPizza(pizza.id, pizza.nombre)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Eliminar
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-medium text-sm text-gray-600 mb-2">
                                Ingredientes ({pizza.ingredientes.length})
                              </h4>
                              <div className="space-y-1">
                                {pizza.ingredientes.map((ing, j) => {
                                  const esBase = PIZZA_BASE.includes(ing.nombre);
                                  return (
                                    <div key={j} className="flex justify-between items-center text-sm">
                                      <span className="flex items-center gap-2">
                                        {ing.nombre}
                                        <Badge 
                                          variant={esBase ? "default" : "secondary"} 
                                          className="text-xs"
                                        >
                                          {esBase ? "Base" : "Extra"}
                                        </Badge>
                                      </span>
                                      <span className="text-gray-600">
                                        {ing.cantidad} {obtenerUnidad(ing.nombre)}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            <div>
                              <h4 className="font-medium text-sm text-gray-600 mb-2">
                                Análisis de Costos
                              </h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span>Costo total:</span>
                                  <span className="font-medium">
                                    {formatCurrency(
                                      pizza.ingredientes.reduce(
                                        (acc, ing) => acc + calcularPrecio(ing.nombre, ing.cantidad), 0
                                      )
                                    )}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Precio venta:</span>
                                  <span className="font-bold text-blue-600">
                                    {formatCurrency(pizza.precio)}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Ganancia:</span>
                                  <span className="font-bold text-green-600">
                                    {formatCurrency(
                                      pizza.precio - pizza.ingredientes.reduce(
                                        (acc, ing) => acc + calcularPrecio(ing.nombre, ing.cantidad), 0
                                      )
                                    )}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Margen:</span>
                                  <span className="font-medium">
                                    {Math.round(
                                      ((pizza.precio - pizza.ingredientes.reduce(
                                        (acc, ing) => acc + calcularPrecio(ing.nombre, ing.cantidad), 0
                                      )) / pizza.precio) * 100
                                    )}%
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
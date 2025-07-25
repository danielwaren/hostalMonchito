import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, Plus, Save, Package } from "lucide-react";
import PizzaCreator from "./PizzaCreator";
import IngredientManager from "./IngredientManager";
import PizzaList from "./PizzaList";
import type { Ingrediente, Pizza, IngredienteUsado } from "./types";
import { formatCurrency } from "./utils";

export default function PizzaBuilderTabs() {
  const [ingredientesDisponibles, setIngredientesDisponibles] = useState<Ingrediente[]>([]);
  const [pizzas, setPizzas] = useState<Pizza[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("armar");

  // Fetch ingredientes disponibles
  const fetchIngredientes = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("ingredientes")
        .select("*")
        .order("nombre");
      
      if (error) throw error;
      if (data) setIngredientesDisponibles(data);
    } catch (error) {
      console.error("Error fetching ingredientes:", error);
      toast.error("Error al cargar los ingredientes");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch pizzas guardadas
  const fetchPizzas = useCallback(async () => {
    try {
      setLoading(true);
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
          .filter(ip => ip.ingrediente && Array.isArray(ip.ingrediente) && ip.ingrediente.length > 0) // Filtrar ingredientes null o vacíos
          .map((ip) => ({
            nombre: ip.ingrediente[0].nombre,
            cantidad: ip.cantidad,
          })),
        }));
        setPizzas(formateadas);
      }
    } catch (error) {
      console.error("Error fetching pizzas:", error);
      toast.error("Error al cargar las pizzas");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIngredientes();
    fetchPizzas();
  }, [fetchIngredientes, fetchPizzas]);

  // Agregar ingrediente disponible
  const agregarIngredienteDisponible = async (ingrediente: Omit<Ingrediente, "id">) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("ingredientes")
        .insert([ingrediente])
        .select("*")
        .single();

      if (error) throw error;

      if (data) {
        setIngredientesDisponibles(prev => [...prev, data].sort((a, b) => a.nombre.localeCompare(b.nombre)));
        toast.success(`Ingrediente "${data.nombre}" agregado correctamente`);
        // No retornes nada aquí
      }
    } catch (error) {
      console.error("Error adding ingredient:", error);
      toast.error("Error al agregar el ingrediente");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Guardar pizza
  const guardarPizza = async (pizza: { nombre: string; ingredientes: IngredienteUsado[]; precio: number }) => {
    try {
      setLoading(true);
      
      // Guardar pizza
      const { data: pizzaData, error: pizzaError } = await supabase
        .from("pizzas")
        .insert([{ 
          nombre: pizza.nombre, 
          precio: pizza.precio 
        }])
        .select("id")
        .single();

      if (pizzaError || !pizzaData) throw pizzaError;

      // Preparar relaciones ingredientes-pizza
      const relaciones = pizza.ingredientes
        .map((ing) => {
          const ingredienteRef = ingredientesDisponibles.find(i => i.nombre === ing.nombre);
          return ingredienteRef ? {
            pizza_id: pizzaData.id,
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
        id: pizzaData.id,
        nombre: pizza.nombre,
        ingredientes: pizza.ingredientes,
        precio: pizza.precio,
      };

      setPizzas(prev => [...prev, nuevaPizza].sort((a, b) => a.nombre.localeCompare(b.nombre)));
      
      toast.success(`🍕 Pizza "${pizza.nombre}" guardada correctamente!`, {
        description: `Precio: ${formatCurrency(pizza.precio)}`
      });

      // Cambiar a la pestaña de pizzas guardadas
      setActiveTab("guardadas");
      
    } catch (error) {
      console.error("Error saving pizza:", error);
      toast.error("Error al guardar la pizza");
      throw error;
    } finally {
      setLoading(false);
    }
  };

const handleActualizarIngrediente = async (ingredienteActualizado: Ingrediente) => {
  try {
    const { error } = await supabase
      .from("ingredientes")
      .update({
        nombre: ingredienteActualizado.nombre,
        unidad: ingredienteActualizado.unidad,
        precio_kilo: ingredienteActualizado.precio_kilo,
        porcion: ingredienteActualizado.porcion,
      })
      .eq("id", ingredienteActualizado.id);

    if (error) throw error;

    // ✅ Actualizar estado local directamente
    setIngredientesDisponibles((prev) =>
      prev.map((ing) =>
        ing.id === ingredienteActualizado.id ? { ...ing, ...ingredienteActualizado } : ing
      )
    );

    toast.success("Ingrediente actualizado correctamente");
  } catch (error) {
    console.error("Error al actualizar ingrediente:", error);
    toast.error("Error al actualizar ingrediente");
    throw error;
  }
};



  // Eliminar pizza
  const eliminarPizza = async (pizzaId: number, nombrePizza: string) => {
    try {
      setLoading(true);
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
      throw error;
    } finally {
      setLoading(false);
    }
  };

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

        <TabsContent value="armar" className="mt-6">
          <PizzaCreator 
            ingredientesDisponibles={ingredientesDisponibles}
            onSave={guardarPizza}
            loading={loading}
          />
        </TabsContent>

        <TabsContent value="ingredientes" className="mt-6">
          <IngredientManager 
  ingredientesDisponibles={ingredientesDisponibles}
  onAddIngredient={agregarIngredienteDisponible}
  onUpdateIngredient={handleActualizarIngrediente} // 👈 necesario
  onDeleteIngredient={async (id) => {
    try {
      await supabase.from("ingredientes").delete().eq("id", id);
      await fetchIngredientes();
    } catch (error) {
      console.error("Error al eliminar ingrediente:", error);
      toast.error("Error al eliminar ingrediente");
    }
  }}
  loading={loading}
  onRefresh={fetchIngredientes}
/>

        </TabsContent>

        <TabsContent value="guardadas" className="mt-6">
          <PizzaList 
            pizzas={pizzas}
            ingredientesDisponibles={ingredientesDisponibles} // ✅ agregar esta línea
            onDelete={eliminarPizza}
            loading={loading}
            onRefresh={fetchPizzas}
            onNavigateToCreate={() => setActiveTab("armar")}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableFooter,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Venta {
  id: number;
  [key: string]: any;
}

export default function VentasTableShadcn({ initialVentas = [], caption = "Lista de ventas recientes" }: { initialVentas?: Venta[], caption?: string }) {
  const [ventas, setVentas] = useState(initialVentas);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<Partial<Venta>>({});

  const headers = ventas.length ? Object.keys(ventas[0]).filter(key => key !== 'id') : [];

  /* — helpers — */
  const startEdit = (venta: Venta) => {
    setEditingId(venta.id);
    setForm({ ...venta });         // copia de los datos originales
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({});
  };

  const saveEdit = async () => {
    try {
      const res = await fetch(`/api/gastos/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        // actualiza la fila en memoria
        setVentas((v) => v.map((row) => (row.id === editingId ? { ...form, id: editingId } as Venta : row)));
        cancelEdit();
      } else {
        console.error("Error al actualizar");
        alert("No se pudo actualizar la venta");
      }
    } catch (error) {
      console.error("Error al conectar con el servidor:", error);
      alert("Error al conectar con el servidor");
    }
  };

  const handleChange = (key: string, value: any) => setForm({ ...form, [key]: value });

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta venta?')) {
      return;
    }

    try {
      const res = await fetch(`/api/gastos/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (res.ok) {
        // Actualiza el estado eliminando la venta
        setVentas(ventas.filter(venta => venta.id !== id));
      } else {
        const errorData = await res.json();
        console.error('Error al eliminar:', errorData.error);
        alert('No se pudo eliminar la venta');
      }
    } catch (error) {
      console.error('Error al conectar con el servidor:', error);
      alert('Error al conectar con el servidor');
    }
  };

  // Calcular total si existe una columna de montos
  const calculateTotal = () => {
    const amountKey = headers.find(key => 
      key.toLowerCase().includes('total') || 
      key.toLowerCase().includes('amount') || 
      key.toLowerCase().includes('precio') ||
      key.toLowerCase().includes('monto')
    );
    
    if (!amountKey) return null;
    
    const total = ventas.reduce((sum, venta) => {
      const value = parseFloat(venta[amountKey]?.toString().replace(/[^0-9.-]/g, '') || 0);
      return sum + value;
    }, 0);
    
    return { key: amountKey, total };
  };

  const totalInfo = calculateTotal();

  /* — render — */
  return (
    <Card className="w-full">
      <CardContent className="p-0">
        <Table>
          <TableCaption>{caption}</TableCaption>
          <TableHeader>
            <TableRow>
              {headers.map((header) => (
                <TableHead key={header} className="font-medium">
                  {header.charAt(0).toUpperCase() + header.slice(1)}
                </TableHead>
              ))}
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          
          <TableBody>
            {ventas.map((venta) => (
              <TableRow key={venta.id} className="hover:bg-muted/50">
                {headers.map((key) => (
                  <TableCell key={`${venta.id}-${key}`}>
                    {editingId === venta.id ? (
                      <Input
                        value={form[key] ?? ""}
                        onChange={(e) => handleChange(key, e.target.value)}
                        className="h-8"
                      />
                    ) : (
                      <span>{venta[key]}</span>
                    )}
                  </TableCell>
                ))}
                
                {/* Acciones */}
                <TableCell className="text-right">
                  <div className="flex gap-2 justify-end">
                    {editingId === venta.id ? (
                      <>
                        <Button
                          size="sm"
                          onClick={saveEdit}
                          className="h-8"
                        >
                          Guardar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={cancelEdit}
                          className="h-8"
                        >
                          Cancelar
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => startEdit(venta)}
                          className="h-8"
                        >
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(venta.id)}
                          className="h-8"
                        >
                          Eliminar
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          
          {/* Footer con total si se detecta columna de montos */}
          {totalInfo && (
            <TableFooter>
              <TableRow>
                <TableCell colSpan={headers.length}>Total</TableCell>
                <TableCell className="text-right font-medium">
                  ${totalInfo.total.toFixed(2)}
                </TableCell>
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </CardContent>
    </Card>
  );
}
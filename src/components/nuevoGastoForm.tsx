import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

interface FormData {
  tipo_venta: string;
  cliente: string;
  monto: string;
  metodo_pago: string;
  fecha: string;
  tipo_documento: string;
  descripcion: string;
}

export default function SalesForm(): React.ReactElement {
  const [formData, setFormData] = useState<FormData>({
    tipo_venta: '',
    cliente: '',
    monto: '',
    metodo_pago: '',
    fecha: '',
    tipo_documento: '',
    descripcion: ''
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (name: keyof FormData, value: string): void => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDocumentTypeChange = (value: string): void => {
    setFormData(prev => ({
      ...prev,
      tipo_documento: value,
      // Limpiar el número de factura si no es tipo "Factura"
      numero_factura: value === 'Factura' ? prev.numero_factura : ''
    }));
  };

  const handleSubmit = async (): Promise<void> => {
    // Validación básica
    if (!formData.tipo_venta || !formData.cliente || !formData.monto || !formData.metodo_pago || !formData.fecha || !formData.tipo_documento) {
      toast.error('Campos incompletos', {
        description: 'Por favor, complete todos los campos obligatorios',
        duration: 4000,
      });
      return;
    }

    // Validar que el monto sea un número válido
    if (isNaN(parseFloat(formData.monto)) || parseFloat(formData.monto) <= 0) {
      toast.error('Monto inválido', {
        description: 'Por favor, ingrese un monto válido mayor a 0',
        duration: 4000,
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/gastos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          monto: parseFloat(formData.monto) // Convertir a número
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Mostrar mensaje de éxito con Sonner
      toast.success('Gasto guardado correctamente', {
        description: `Gasto de ${formData.cliente} por ${formData.monto}`,
        duration: 4000,
      });
      
      // Limpiar formulario después de guardar exitosamente
      setFormData({
        tipo_venta: '',
        cliente: '',
        monto: '',
        metodo_pago: '',
        fecha: '',
        tipo_documento: '',
        descripcion: ''
      });

      console.log('Gasto guardado:', result);

    } catch (error) {
      console.error('Error al guardar el gasto:', error);
      const errorMsg = error instanceof Error ? error.message : 'Error al guardar la venta. Inténtelo nuevamente.';
      
      // Mostrar error con Sonner
      toast.error('Error al guardar el gasto', {
        description: errorMsg,
        duration: 5000,
      });
      
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Registrar nuevo gasto</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Primera columna */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="tipo_venta">Tipo de venta *</Label>
                  <Select 
                    value={formData.tipo_venta} 
                    onValueChange={(value) => handleInputChange('tipo_venta', value)}
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo de venta" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Hospedaje">Hospedaje</SelectItem>
                      <SelectItem value="Restaurante">Restaurante</SelectItem>
                      <SelectItem value="Pension">Pension</SelectItem>
                    </SelectContent> 
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cliente">Cliente *</Label>
                  <Input
                    id="cliente"
                    type="text"
                    value={formData.cliente}
                    onChange={(e) => handleInputChange('cliente', e.target.value)}
                    placeholder="Nombre del cliente"
                    disabled={isLoading}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="monto">Monto *</Label>
                  <Input
                    id="monto"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.monto}
                    onChange={(e) => handleInputChange('monto', e.target.value)}
                    placeholder="0.00"
                    disabled={isLoading}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descripcion">Descripción</Label>
                  <Textarea
                    id="descripcion"
                    rows={4}
                    value={formData.descripcion}
                    onChange={(e) => handleInputChange('descripcion', e.target.value)}
                    placeholder="Descripción opcional de la venta"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Segunda columna */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="metodo_pago">Método de pago *</Label>
                  <Select 
                    value={formData.metodo_pago} 
                    onValueChange={(value) => handleInputChange('metodo_pago', value)}
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar método de pago" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Efectivo">Efectivo</SelectItem>
                      <SelectItem value="Tarjeta">Tarjeta</SelectItem>
                      <SelectItem value="Transferencia">Transferencia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fecha">Fecha *</Label>
                  <Input
                    id="fecha"
                    type="date"
                    value={formData.fecha}
                    onChange={(e) => handleInputChange('fecha', e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tipo_documento">Tipo de documento *</Label>
                  <Select 
                    value={formData.tipo_documento} 
                    onValueChange={handleDocumentTypeChange}
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo de documento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Factura">Factura</SelectItem>
                      <SelectItem value="Boleta">Boleta</SelectItem>
                      <SelectItem value="Otro">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Button 
              type="button" 
              onClick={handleSubmit} 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? 'Guardando...' : 'Guardar venta'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
import { useState } from "react";
import { Plus, Trash2, Receipt, Download } from "lucide-react";

import {
  Table, TableBody, TableCaption, TableCell,
  TableFooter, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

import {
  Card, CardContent, CardTitle,
  CardDescription, CardHeader,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ServicioRow {
  id: number;
  fecha: string;
  almuerzo: number;
  cena: number;
  alojamiento: number;
}

const PRECIO_ALMUERZO = 10000;
const PRECIO_CENA = 10000;
const PRECIO_ALOJAMIENTO = 25000;
const IVA = 0.19;

export default function DetalleServicios() {
  const [nombreCliente, setNombreCliente] = useState("");
  const [servicios, setServicios] = useState<ServicioRow[]>([
    {
      id: 1,
      fecha: new Date().toISOString().split('T')[0],
      almuerzo: 0,
      cena: 0,
      alojamiento: 0,
    }
  ]);
  const [nextId, setNextId] = useState(2);

  const formatChileanCurrency = (value: number): string => {
    return value.toLocaleString("es-CL", {
      style: "currency",
      currency: "CLP",
    });
  };

  const calcularSubtotal = (servicio: ServicioRow): number => {
    return (
      servicio.almuerzo * PRECIO_ALMUERZO +
      servicio.cena * PRECIO_CENA +
      servicio.alojamiento * PRECIO_ALOJAMIENTO
    );
  };

  const calcularTotalConIva = (servicio: ServicioRow): number => {
    const subtotal = calcularSubtotal(servicio);
    return subtotal * (1 + IVA);
  };

  const agregarFila = () => {
    const nuevaFila: ServicioRow = {
      id: nextId,
      fecha: new Date().toISOString().split('T')[0],
      almuerzo: 0,
      cena: 0,
      alojamiento: 0,
    };
    setServicios([...servicios, nuevaFila]);
    setNextId(nextId + 1);
  };

  const eliminarFila = (id: number) => {
    if (servicios.length === 1) {
      alert("Debe mantener al menos una fila");
      return;
    }
    setServicios(servicios.filter(s => s.id !== id));
  };

  const actualizarServicio = (id: number, campo: keyof ServicioRow, valor: any) => {
    setServicios(servicios.map(s => {
      if (s.id === id) {
        return { ...s, [campo]: valor };
      }
      return s;
    }));
  };

  const totalGeneral = servicios.reduce((sum, s) => sum + calcularSubtotal(s), 0);
  const totalGeneralConIva = servicios.reduce((sum, s) => sum + calcularTotalConIva(s), 0);
  const totalIva = totalGeneralConIva - totalGeneral;

  const generarPDF = () => {
    if (!nombreCliente.trim()) {
      alert("Por favor ingrese el nombre del cliente");
      return;
    }

    const numeroVoucher = `${Date.now().toString().slice(-8)}`;
    
    // Crear contenido HTML optimizado para PDF
    const contenidoPDF = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
      padding: 30px; 
      font-size: 11px;
      color: #333;
      background: #fff;
    }
    .voucher-container {
      max-width: 800px;
      margin: 0 auto;
      border: 2px solid #2c5282;
      padding: 25px;
    }
    .header { 
      text-align: center; 
      margin-bottom: 25px; 
      padding-bottom: 15px;
      border-bottom: 3px solid #2c5282;
    }
    .header h1 { 
      font-size: 28px; 
      margin-bottom: 3px;
      color: #2c5282;
      font-weight: bold;
      letter-spacing: 1px;
    }
    .header .subtitle {
      font-size: 11px;
      color: #666;
      margin-top: 3px;
    }
    .header .location {
      font-size: 10px;
      color: #888;
      font-style: italic;
      margin-top: 2px;
    }
    .voucher-number {
      text-align: right;
      font-size: 10px;
      color: #666;
      margin-bottom: 15px;
    }
    .voucher-number strong {
      color: #2c5282;
    }
    .info-section {
      display: flex;
      justify-content: space-between;
      margin-bottom: 20px;
      background: #f8f9fa;
      padding: 12px;
      border-radius: 5px;
    }
    .info-column {
      flex: 1;
    }
    .info-row { 
      margin-bottom: 6px;
      font-size: 10px;
    }
    .info-label { 
      font-weight: bold;
      color: #2c5282;
      display: inline-block;
      min-width: 90px;
    }
    table { 
      width: 100%; 
      border-collapse: collapse; 
      margin: 20px 0;
    }
    th, td { 
      border: 1px solid #ddd; 
      padding: 8px; 
      text-align: left; 
    }
    th { 
      background: linear-gradient(to bottom, #2c5282, #1e3a5f);
      color: white;
      font-weight: bold; 
      font-size: 10px;
      text-transform: uppercase;
    }
    td { 
      font-size: 10px; 
    }
    tbody tr:nth-child(even) {
      background-color: #f8f9fa;
    }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .totales { 
      margin-top: 15px; 
      float: right; 
      width: 280px;
      background: #f8f9fa;
      padding: 12px;
      border-radius: 5px;
    }
    .totales-row { 
      display: flex; 
      justify-content: space-between; 
      padding: 5px 0; 
      font-size: 11px;
    }
    .totales-row.final { 
      border-top: 2px solid #2c5282; 
      font-weight: bold; 
      font-size: 13px; 
      margin-top: 8px;
      padding-top: 8px;
      color: #2c5282;
    }
    .payment-info {
      clear: both;
      margin-top: 30px;
      padding: 15px;
      background: #e8f4f8;
      border-left: 4px solid #2c5282;
      border-radius: 3px;
    }
    .payment-info h3 {
      font-size: 12px;
      margin-bottom: 10px;
      color: #2c5282;
      font-weight: bold;
    }
    .payment-details {
      font-size: 10px;
      line-height: 1.6;
    }
    .payment-details strong {
      color: #2c5282;
      display: inline-block;
      min-width: 120px;
    }
    .footer { 
      margin-top: 25px; 
      padding-top: 15px;
      border-top: 2px solid #e0e0e0;
      text-align: center; 
      font-size: 9px; 
      color: #888;
    }
    .footer p {
      margin: 3px 0;
    }
    @media print {
      body { padding: 15px; }
      .voucher-container { border: 1px solid #2c5282; }
    }
  </style>
</head>
<body>
  <div class="voucher-container">
    <div class="header">
      <h1>HOSTAL EL MONCHITO</h1>
      <p class="subtitle">Voucher de Servicios de Hospedaje</p>
      <p class="location">Puerto Cisnes, Patagonia Chilena</p>
    </div>
    
    <div class="voucher-number">
      <strong>N° Voucher:</strong> ${numeroVoucher}
    </div>
    
    <div class="info-section">
      <div class="info-column">
        <div class="info-row">
          <span class="info-label">Cliente:</span>
          <span>${nombreCliente}</span>
        </div>
        <div class="info-row">
          <span class="info-label">N° Servicios:</span>
          <span>${servicios.length}</span>
        </div>
      </div>
      <div class="info-column" style="text-align: right;">
        <div class="info-row">
          <span class="info-label">Fecha Emisión:</span>
          <span>${new Date().toLocaleDateString('es-CL')}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Hora:</span>
          <span>${new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>
    </div>
    
    <table>
      <thead>
        <tr>
          <th>Fecha</th>
          <th class="text-center">Almuerzos</th>
          <th class="text-center">Cenas</th>
          <th class="text-center">Alojamientos</th>
          <th class="text-right">Subtotal</th>
          <th class="text-right">Total + IVA</th>
        </tr>
      </thead>
      <tbody>
        ${servicios.map(s => {
          const subtotal = calcularSubtotal(s);
          const totalConIva = calcularTotalConIva(s);
          return `
          <tr>
            <td>${new Date(s.fecha).toLocaleDateString('es-CL')}</td>
            <td class="text-center">${s.almuerzo || '-'}</td>
            <td class="text-center">${s.cena || '-'}</td>
            <td class="text-center">${s.alojamiento || '-'}</td>
            <td class="text-right">${formatChileanCurrency(subtotal)}</td>
            <td class="text-right">${formatChileanCurrency(totalConIva)}</td>
          </tr>
          `;
        }).join('')}
      </tbody>
    </table>
    
    <div class="totales">
      <div class="totales-row">
        <span>Subtotal Neto:</span>
        <span>${formatChileanCurrency(totalGeneral)}</span>
      </div>
      <div class="totales-row">
        <span>IVA (19%):</span>
        <span>${formatChileanCurrency(totalIva)}</span>
      </div>
      <div class="totales-row final">
        <span>TOTAL A PAGAR:</span>
        <span>${formatChileanCurrency(totalGeneralConIva)}</span>
      </div>
    </div>
    
    <div class="payment-info">
      <h3>DATOS PARA TRANSFERENCIA</h3>
      <div class="payment-details">
        <p><strong>Titular:</strong> BLANCA BERTILA DIAZ BARRIA</p>
        <p><strong>RUT:</strong> 6.768.074-K</p>
        <p><strong>Banco:</strong> Banco Estado</p>
        <p><strong>Tipo de Cuenta:</strong> Cuenta Corriente</p>
        <p><strong>N° Cuenta:</strong> 87000004888</p>
      </div>
    </div>
    
    <div class="footer">
      <p><strong>Tarifas:</strong> Almuerzo $10.000 | Cena $10.000 | Alojamiento $25.000</p>
      <p>Documento generado el ${new Date().toLocaleString('es-CL')}</p>
      <p style="margin-top: 8px;">Hostal El Monchito - Puerto Cisnes, Patagonia Chilena</p>
    </div>
  </div>
</body>
</html>
    `;

    // Crear ventana temporal para imprimir
    const ventana = window.open('', '_blank');
    if (ventana) {
      ventana.document.write(contenidoPDF);
      ventana.document.close();
      
      // Esperar a que cargue y luego imprimir
      ventana.onload = () => {
        ventana.focus();
        ventana.print();
        // La ventana se cerrará cuando el usuario cancele o complete la impresión
      };
    } else {
      alert('Por favor permita las ventanas emergentes para generar el PDF');
    }
  };

  return (
    <Card className="w-full max-w-7xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-6 w-6" />
          Detalle de Servicios de Hospedaje
        </CardTitle>
        <CardDescription>
          Gestión de servicios: Almuerzo $10.000 • Cena $10.000 • Alojamiento $25.000
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Campo de nombre del cliente y botones */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="nombreCliente">Nombre del Cliente</Label>
            <Input
              id="nombreCliente"
              placeholder="Ingrese el nombre del cliente"
              value={nombreCliente}
              onChange={(e) => setNombreCliente(e.target.value)}
              className="text-base"
            />
          </div>
          <div className="flex gap-2 items-end">
            <Button onClick={agregarFila} className="flex-1 flex items-center justify-center gap-2">
              <Plus className="h-4 w-4" />
              Agregar Fila
            </Button>
            <Button 
              onClick={generarPDF} 
              variant="secondary"
              className="flex-1 flex items-center justify-center gap-2"
            >
              <Download className="h-4 w-4" />
              Generar PDF
            </Button>
          </div>
        </div>

        {/* Tabla de servicios */}
        <div className="overflow-x-auto">
          <Table>
            <TableCaption>
              Detalle de servicios entregados - IVA 19%
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[150px]">Fecha</TableHead>
                <TableHead className="text-center">Almuerzos</TableHead>
                <TableHead className="text-center">Cenas</TableHead>
                <TableHead className="text-center">Alojamientos</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
                <TableHead className="text-right">Total + IVA</TableHead>
                <TableHead className="text-center w-[100px]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {servicios.map((servicio) => {
                const subtotal = calcularSubtotal(servicio);
                const totalConIva = calcularTotalConIva(servicio);

                return (
                  <TableRow key={servicio.id}>
                    <TableCell>
                      <Input
                        type="date"
                        value={servicio.fecha}
                        onChange={(e) => actualizarServicio(servicio.id, 'fecha', e.target.value)}
                        className="w-full"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        value={servicio.almuerzo}
                        onChange={(e) => actualizarServicio(servicio.id, 'almuerzo', parseInt(e.target.value) || 0)}
                        className="w-20 mx-auto text-center"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        value={servicio.cena}
                        onChange={(e) => actualizarServicio(servicio.id, 'cena', parseInt(e.target.value) || 0)}
                        className="w-20 mx-auto text-center"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        value={servicio.alojamiento}
                        onChange={(e) => actualizarServicio(servicio.id, 'alojamiento', parseInt(e.target.value) || 0)}
                        className="w-20 mx-auto text-center"
                      />
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatChileanCurrency(subtotal)}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatChileanCurrency(totalConIva)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => eliminarFila(servicio.id)}
                        disabled={servicios.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={5}></TableCell>
                <TableCell colSpan={2} className="p-0">
                  <div className="space-y-1 p-3">
                    <div className="flex justify-between text-xs">
                      <span>Subtotal Neto:</span>
                      <span className="font-medium">{formatChileanCurrency(totalGeneral)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>IVA (19%):</span>
                      <span className="font-medium">{formatChileanCurrency(totalIva)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold border-t pt-1">
                      <span>TOTAL:</span>
                      <span className="text-primary">{formatChileanCurrency(totalGeneralConIva)}</span>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>

        {/* Resumen */}
        <Card className="bg-muted/30">
          <CardHeader>
            <CardTitle className="text-lg">Resumen de Servicios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <Label className="text-muted-foreground">Total Almuerzos</Label>
                <p className="text-2xl font-bold">
                  {servicios.reduce((sum, s) => sum + s.almuerzo, 0)}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Total Cenas</Label>
                <p className="text-2xl font-bold">
                  {servicios.reduce((sum, s) => sum + s.cena, 0)}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Total Alojamientos</Label>
                <p className="text-2xl font-bold">
                  {servicios.reduce((sum, s) => sum + s.alojamiento, 0)}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Total Registros</Label>
                <p className="text-2xl font-bold">
                  {servicios.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}
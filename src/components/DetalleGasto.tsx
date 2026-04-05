import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function DetalleGasto() {
  return (
    <Card className="w-full max-w-7xl mx-auto">
      <CardHeader>
        <CardTitle>Detalle de Gastos</CardTitle>
        <CardDescription>
          Visualización y gestión de gastos
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p>Contenido en desarrollo...</p>
      </CardContent>
    </Card>
  );
}

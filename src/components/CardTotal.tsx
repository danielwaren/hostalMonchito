  import React, { useEffect, useState } from "react";
  import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
  import { Loader2, AlertCircle, TrendingUp, TrendingDown, Scale } from "lucide-react";
  import { supabase } from "@/lib/supabase";

  // Utilidades para manejar moneda chilena
  const parseChileanCurrency = (value: any) => {
    if (!value) return 0;
    let cleanValue = value.toString().trim().replace(/[$\s]/g, '');

    if (cleanValue.includes('.') && !cleanValue.includes(',')) {
      cleanValue = cleanValue.replace(/\./g, '');
    }

    cleanValue = cleanValue.replace(',', '.');
    const numericValue = parseFloat(cleanValue);
    return isNaN(numericValue) ? 0 : Math.abs(numericValue); // Importante: convertir a positivo
  };

  const formatChileanCurrency = (value: number) =>
    value.toLocaleString("es-CL", {
      style: "currency",
      currency: "CLP",
    });

  export default function CardBalance() {
    const [abonos, setAbonos] = useState(0);
    const [cargos, setCargos] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
      const fetchData = async () => {
        setLoading(true);
        try {
          const { data, error } = await supabase
            .from("Cartola")
            .select("Abonos, Cargos");

          if (error) throw error;

          let totalAbonos = 0;
          let totalCargos = 0;

          data?.forEach((item) => {
            const abono = parseChileanCurrency(item.Abonos);
            const cargo = parseChileanCurrency(item.Cargos);
            totalAbonos += abono;
            totalCargos += cargo;
          });

          setAbonos(totalAbonos);
          setCargos(totalCargos);
          setError(null);
        } catch (err) {
          console.error("Error al cargar datos:", err);
          setError("No se pudieron cargar los datos");
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    }, []);

    const diferencia = abonos - cargos;

    return (
      <Card className="w-full max-w-sm bg-background shadow-lg border rounded-2xl">
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">Balance Neto</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-muted-foreground">Cargando...</span>
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-green-600">
                  <TrendingUp className="h-5 w-5" />
                  <span>Abonos:</span>
                </div>
                <div className="font-bold">{formatChileanCurrency(abonos)}</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-red-600">
                  <TrendingDown className="h-5 w-5" />
                  <span>Cargos:</span>
                </div>
                <div className="font-bold">-{formatChileanCurrency(cargos)}</div>
              </div>
              <div className="flex items-center justify-between border-t pt-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Scale className="h-5 w-5" />
                  <span>Diferencia:</span>
                </div>
                <div className="font-bold text-primary">
                  {formatChileanCurrency(diferencia)}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { CreditCard, TrendingDown, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";

interface CargoDetail {
  id: number;
  Fecha: string;
  Cargos: string;
  Concepto?: string;
  [key: string]: any;
}

export default function CardCargos() {
  const [totalCargo, setTotalCargo] = useState<number | null>(null);
  const [cargosDetails, setCargosDetails] = useState<CargoDetail[]>([]);
  const [cantidadRegistros, setCantidadRegistros] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const parseChileanCurrency = (value: any) => {
    if (!value) return 0;

    let cleanValue = value.toString().trim();
    cleanValue = cleanValue.replace(/[$\s]/g, '');

    if (cleanValue.includes('.') && !cleanValue.includes(',')) {
      cleanValue = cleanValue.replace(/\./g, '');
    }

    cleanValue = cleanValue.replace(',', '.');

    const numericValue = parseFloat(cleanValue);
    return isNaN(numericValue) ? 0 : numericValue;
  };

  const formatChileanCurrency = (value: number) => {
    return value.toLocaleString("es-CL", {
      style: "currency",
      currency: "CLP",
    });
  };

  useEffect(() => {
    const obtenerCargos = async () => {
      try {
        setLoading(true);

        const { data, error, count } = await supabase
          .from("Cartola")
          .select("*", { count: "exact" })
          .not("Cargos", "is", null)
          .not("Cargos", "eq", "")
          .order("id", { ascending: false });

        if (error) throw error;

        const total = data?.reduce((acc, item) => {
          const valorCargo = parseChileanCurrency(item.Cargos);
          return acc + valorCargo;
        }, 0) || 0;

        const registrosConCargos = data?.filter(item => {
          const valor = parseChileanCurrency(item.Cargos);
          return valor !== 0;
        }) || [];

        setTotalCargo(Math.abs(total));
        setCargosDetails(registrosConCargos);
        setCantidadRegistros(registrosConCargos.length);
        setError(null);
      } catch (err) {
        console.error("Error al obtener cargos:", err);
        setError("No se pudo cargar el total de cargos");
        setTotalCargo(null);
      } finally {
        setLoading(false);
      }
    };

    obtenerCargos();
  }, []);

  const formattedMonto = totalCargo !== null
    ? formatChileanCurrency(totalCargo)
    : "—";

  const promedioCargo = totalCargo && cantidadRegistros > 0
    ? totalCargo / cantidadRegistros
    : 0;

  return (
    <div>
      <Card className="w-full max-w-sm bg-background text-foreground shadow-lg border border-border rounded-2xl hover:shadow-xl transition-shadow duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Cargosa
          </CardTitle>
          <div className="flex items-center gap-2">
            {cantidadRegistros > 0 && (
              <Badge variant="secondary" className="text-xs">
                {cantidadRegistros}
              </Badge>
            )}
            <CreditCard className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-lg font-semibold text-muted-foreground">
                  Cargando...
                </span>
              </div>
            ) : error ? (
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-medium">{error}</span>
              </div>
            ) : (
              <>
                <TrendingDown className="h-5 w-5 text-red-500" />
                <div className="text-2xl font-bold text-red-600">
                  {formattedMonto}
                </div>
              </>
            )}
          </div>

          {!loading && !error && totalCargo !== null && (
            <>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">
                  Cargos acumulados en la Cartola
                </p>
                {promedioCargo > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Promedio por registro: {formatChileanCurrency(promedioCargo)}
                  </p>
                )}
              </div>

              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="link"
                    className="px-0 text-sm text-primary underline hover:text-primary/80 transition-colors"
                  >
                    Ver detalles ({cantidadRegistros} registros)
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Detalles de Cargosa
                    </DialogTitle>
                    <DialogDescription>
                      Resumen de todos los cargos registrados en la cartola.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Total</p>
                        <p className="text-lg font-bold text-red-600">{formattedMonto}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Registros</p>
                        <p className="text-lg font-bold">{cantidadRegistros}</p>
                      </div>
                    </div>

                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      <h4 className="font-medium text-sm text-muted-foreground">
                        Últimos registros:
                      </h4>
                      {cargosDetails.slice(0, 10).map((cargo) => (
                        <div
                          key={cargo.id}
                          className="flex justify-between items-center p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                #{cargo.id}
                              </Badge>
                              {cargo.Fecha && (
                                <span className="text-xs text-muted-foreground">
                                  {cargo.Fecha}
                                </span>
                              )}
                            </div>
                            {cargo.Concepto && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {cargo.Concepto}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-red-600">
                              {formatChileanCurrency(Math.abs(parseChileanCurrency(cargo.Cargos)))}
                            </p>
                          </div>
                        </div>
                      ))}

                      {cargosDetails.length > 10 && (
                        <p className="text-xs text-muted-foreground text-center py-2">
                          Mostrando 10 de {cargosDetails.length} registros
                        </p>
                      )}
                    </div>
                  </div>

                  <DialogFooter>
                    <Button variant="outline">Cerrar</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

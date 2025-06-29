  import React, { useEffect, useState } from "react";
  import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
  import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
  } from "@/components/ui/dialog";
  import { Briefcase, TrendingUp, AlertCircle, Loader2 } from "lucide-react";
  import { Button } from "@/components/ui/button";
  import { Badge } from "@/components/ui/badge";
  import { supabase } from "@/lib/supabase";

  interface AbonoDetail {
    id: number;
    Fecha: string;
    Abonos: string;
    Concepto?: string;
    [key: string]: any;
  }

  export default function CardAbonos() {
    const [totalAbono, setTotalAbono] = useState<number | null>(null);
    const [abonosDetails, setAbonosDetails] = useState<AbonoDetail[]>([]);
    const [cantidadRegistros, setCantidadRegistros] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Función para convertir string formato chileno a número (igual que el componente anterior)
    const parseChileanCurrency = (value: any) => {
      if (!value) return 0;
      
      let cleanValue = value.toString().trim();
      
      // Remover símbolo de moneda si existe
      cleanValue = cleanValue.replace(/[$\s]/g, '');
      
      // Si tiene formato chileno (puntos como separadores de miles)
      if (cleanValue.includes('.') && !cleanValue.includes(',')) {
        cleanValue = cleanValue.replace(/\./g, '');
      }
      
      // Si tiene coma como separador decimal, convertir a punto
      cleanValue = cleanValue.replace(',', '.');
      
      const numericValue = parseFloat(cleanValue);
      return isNaN(numericValue) ? 0 : numericValue;
    };

    // Función para formatear valores como moneda chilena
    const formatChileanCurrency = (value: number) => {
      return value.toLocaleString("es-CL", {
        style: "currency",
        currency: "CLP",
      });
    };

    useEffect(() => {
      const obtenerAbonos = async () => {
        try {
          setLoading(true);
          
          const { data, error, count } = await supabase
            .from("Cartola")
            .select("*", { count: "exact" })
            .not("Abonos", "is", null)
            .not("Abonos", "eq", "")
            .order("id", { ascending: false });

          if (error) throw error;

          // Calcular total usando la función de parsing
          const total = data?.reduce((acc, item) => {
            const valorAbono = parseChileanCurrency(item.Abonos);
            return acc + valorAbono;
          }, 0) || 0;

          // Filtrar solo registros con abonos para mostrar en el modal
          const registrosConAbonos = data?.filter(item => {
            const valor = parseChileanCurrency(item.Abonos);
            return valor > 0;
          }) || [];

          setTotalAbono(total);
          setAbonosDetails(registrosConAbonos);
          setCantidadRegistros(registrosConAbonos.length);
          setError(null);

        } catch (err) {
          console.error("Error al obtener abonos:", err);
          setError("No se pudo cargar el total de abonos");
          setTotalAbono(null);
        } finally {
          setLoading(false);
        }
      };

      obtenerAbonos();
    }, []);

    const formattedMonto = totalAbono !== null
      ? formatChileanCurrency(totalAbono)
      : "—";

    // Calcular el promedio de abonos
    const promedioAbono = totalAbono && cantidadRegistros > 0 
      ? totalAbono / cantidadRegistros 
      : 0;

    return (
      <div>
        <Card className="w-full max-w-sm bg-background text-foreground shadow-lg border border-border rounded-2xl hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Abonos
            </CardTitle>
            <div className="flex items-center gap-2">
              {cantidadRegistros > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {cantidadRegistros}
                </Badge>
              )}
              <Briefcase className="h-5 w-5 text-muted-foreground" />
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
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  <div className="text-2xl font-bold text-primary">
                    {formattedMonto}
                  </div>
                </>
              )}
            </div>

            {!loading && !error && totalAbono !== null && (
              <>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">
                    Abonos acumulados en la Cartola
                  </p>
                  {promedioAbono > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Promedio por registro: {formatChileanCurrency(promedioAbono)}
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
                        <Briefcase className="h-5 w-5" />
                        Detalles de Abonos
                      </DialogTitle>
                      <DialogDescription>
                        Resumen de todos los abonos registrados en la cartola.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                      {/* Resumen */}
                      <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Total</p>
                          <p className="text-lg font-bold text-primary">{formattedMonto}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Registros</p>
                          <p className="text-lg font-bold">{cantidadRegistros}</p>
                        </div>
                      </div>

                      {/* Lista de abonos */}
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        <h4 className="font-medium text-sm text-muted-foreground">
                          Últimos registros:
                        </h4>
                        {abonosDetails.slice(0, 10).map((abono, index) => (
                          <div 
                            key={abono.id}
                            className="flex justify-between items-center p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  #{abono.id}
                                </Badge>
                                {abono.Fecha && (
                                  <span className="text-xs text-muted-foreground">
                                    {abono.Fecha}
                                  </span>
                                )}
                              </div>
                              {abono.Concepto && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {abono.Concepto}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-green-600">
                                {formatChileanCurrency(parseChileanCurrency(abono.Abonos))}
                              </p>
                            </div>
                          </div>
                        ))}
                        
                        {abonosDetails.length > 10 && (
                          <p className="text-xs text-muted-foreground text-center py-2">
                            Mostrando 10 de {abonosDetails.length} registros
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
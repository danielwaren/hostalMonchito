"use client"

import { useState, useEffect } from "react"
import { TrendingUp, Loader2, AlertCircle, X } from "lucide-react"
import { Pie, PieChart, Sector } from "recharts"
import type { PieSectorDataItem } from "recharts/types/polar/Pie"
import { supabase } from "@/lib/supabase"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
} from "@/components/ui/chart"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface CartolaData {
  id: number
  Fecha: string
  Descripcion: string
  Cargos: number
  Operacion: string
}

interface ChartDataItem {
  descripcion: string
  cantidad: number
  totalCargos: number
  fill: string
  total: number
}

const PAGE_SIZE = 10

const getRandomColor = () => {
  const hue = Math.floor(Math.random() * 360)
  const saturation = 70 + Math.floor(Math.random() * 30)
  const lightness = 50 + Math.floor(Math.random() * 20)
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: any }) {
  if (active && payload && payload.length > 0) {
    const { descripcion, cantidad, totalCargos } = payload[0].payload
    return (
      <div className="rounded-md bg-white dark:bg-zinc-900 p-3 text-sm text-black dark:text-white shadow-lg border dark:border-zinc-700">
        <div className="font-semibold">{descripcion}</div>
        <div>Ocurrencias: {cantidad}</div>
        <div>Total cargos: ${totalCargos.toLocaleString("es-CL")}</div>
      </div>
    )
  }
  return null
}

export function GraficoDescripcionesCargos() {
  const [chartData, setChartData] = useState<ChartDataItem[]>([])
  const [chartConfig, setChartConfig] = useState<ChartConfig>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalRegistros, setTotalRegistros] = useState(0)

  // Modal + paginacion
  const [modalOpen, setModalOpen] = useState(false)
  const [detalleDescripcion, setDetalleDescripcion] = useState<string | null>(null)
  const [detalleData, setDetalleData] = useState<CartolaData[]>([])
  const [detalleLoading, setDetalleLoading] = useState(false)
  const [detalleError, setDetalleError] = useState<string | null>(null)
  const [paginaActual, setPaginaActual] = useState(1)
  const [totalRegistrosDetalle, setTotalRegistrosDetalle] = useState(0)
  const totalPaginas = Math.ceil(totalRegistrosDetalle / PAGE_SIZE)

  useEffect(() => {
    const obtenerDatosCartola = async () => {
      try {
        setLoading(true)
        setError(null)

        const { data, error } = await supabase
          .from("Cartola")
          .select("id, Descripcion, Cargos")
          .not("Descripcion", "is", null)
          .not("Descripcion", "eq", "")

        if (error) {
          console.error("Supabase error:", error)
          throw error
        }

        const descripcionStats = data?.reduce(
          (
            acc: Record<string, { cantidad: number; totalCargos: number }>,
            item: CartolaData
          ) => {
            const descripcion = item.Descripcion.trim()
            const cargos = Number(item.Cargos) || 0
            if (!acc[descripcion]) {
              acc[descripcion] = { cantidad: 1, totalCargos: cargos }
            } else {
              acc[descripcion].cantidad += 1
              acc[descripcion].totalCargos += cargos
            }
            return acc
          },
          {}
        ) || {}

        const chartDataFormatted = Object.entries(descripcionStats)
          .filter(([_, { totalCargos }]) => totalCargos > 0)
          .map(([descripcion, { cantidad, totalCargos }]) => ({
            descripcion,
            cantidad,
            totalCargos,
            fill: getRandomColor(),
          }))
          // Ordenar por totalCargos para reflejar peso real en gráfico
          .sort((a, b) => b.totalCargos - a.totalCargos)

        const total = chartDataFormatted.reduce(
          (sum, item) => sum + item.totalCargos,
          0
        )

        const chartDataWithTotal = chartDataFormatted.map((item) => ({
          ...item,
          total,
        }))

        const configGenerated: ChartConfig = {
          totalCargos: {
            label: "Total Cargos",
            color: "black",
          },
          ...chartDataFormatted.reduce(
            (acc, item) => ({
              ...acc,
              [item.descripcion]: {
                label: item.descripcion,
                color: item.fill,
              },
            }),
            {}
          ),
        }

        setChartData(chartDataWithTotal)
        setChartConfig(configGenerated)
        setTotalRegistros(total)
      } catch (err) {
        console.error("Error al obtener datos de Cartola:", err)
        setError("No se pudieron cargar los datos de descripciones")
      } finally {
        setLoading(false)
      }
    }

    obtenerDatosCartola()
  }, [])

  const cargarDetallePagina = async (descripcion: string, pagina: number) => {
    setDetalleLoading(true)
    setDetalleError(null)

    const desde = (pagina - 1) * PAGE_SIZE
    const hasta = desde + PAGE_SIZE - 1

    try {
      const { count: countTotal, error: countError } = await supabase
        .from("Cartola")
        .select("id", { count: "exact", head: true })
        .eq("Descripcion", descripcion)

      if (countError) throw countError

      setTotalRegistrosDetalle(countTotal || 0)

      const { data, error } = await supabase
        .from("Cartola")
        .select("id, Fecha, Descripcion, Cargos, Operacion")
        .eq("Descripcion", descripcion)
        .order("Fecha", { ascending: false })
        .range(desde, hasta)

      if (error) throw error

      setDetalleData(data || [])
    } catch (err) {
      console.error("Error al cargar detalle paginado:", err)
      setDetalleError("No se pudieron cargar los detalles")
      setDetalleData([])
    } finally {
      setDetalleLoading(false)
    }
  }

  const abrirDetalle = (descripcion: string) => {
    setDetalleDescripcion(descripcion)
    setPaginaActual(1)
    setModalOpen(true)
    cargarDetallePagina(descripcion, 1)
  }

  const cambiarPagina = (nuevaPagina: number) => {
    if (!detalleDescripcion) return
    if (nuevaPagina < 1 || nuevaPagina > totalPaginas) return
    setPaginaActual(nuevaPagina)
    cargarDetallePagina(detalleDescripcion, nuevaPagina)
  }

  if (loading) {
    return (
      <Card className="flex flex-col w-full">
        <CardHeader className="items-center pb-0">
          <CardTitle>Distribución</CardTitle>
          <CardDescription>Cargando datos de Cartola...</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 pb-0">
          <div className="w-full h-[300px] flex items-center justify-center">
            <div className="flex items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="text-lg font-medium text-muted-foreground">
                Cargando gráfico...
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="flex flex-col w-full">
        <CardHeader className="items-center pb-0">
          <CardTitle>Distribución</CardTitle>
          <CardDescription>Error al cargar datos</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 pb-0">
          <div className="w-full h-[300px] flex items-center justify-center">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-8 w-8" />
              <span className="text-lg font-medium">{error}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (chartData.length === 0) {
    return (
      <Card className="flex flex-col w-full">
        <CardHeader className="items-center pb-0">
          <CardTitle>Distribución</CardTitle>
          <CardDescription>No hay datos disponibles</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 pb-0">
          <div className="w-full h-[300px] flex items-center justify-center">
            <span className="text-lg font-medium text-muted-foreground">
              No se encontraron descripciones con cargos en la tabla Cartola
            </span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="flex flex-col w-full">
        <CardHeader className="items-center pb-0">
          <CardTitle>Distribución de gastos</CardTitle>
          <CardDescription>
            Todas las descripciones de cargos registrados
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 pb-0">
          <div className="w-full h-[300px] flex items-center justify-center">
            <ChartContainer config={chartConfig} className="w-full h-full">
              <PieChart width={400} height={300}>
                <ChartTooltip content={<CustomTooltip />} />
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  dataKey="totalCargos" // <-- mostrar total de cargos, no cantidad
                  nameKey="descripcion"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  stroke="#fff"
                  strokeWidth={1}
                  onClick={(e) => {
                    if (e && "descripcion" in e) {
                      abrirDetalle(e.descripcion)
                    }
                  }}
                  activeIndex={0}
                  activeShape={({ outerRadius = 0, ...props }: PieSectorDataItem) => (
                    <Sector {...props} outerRadius={outerRadius + 10} fill={props.fill} />
                  )}
                />
              </PieChart>
            </ChartContainer>
          </div>
        </CardContent>
        <CardFooter className="flex-col gap-2 text-sm">
          <div className="flex items-center gap-2 leading-none font-medium">
            Total de cargos: ${totalRegistros.toLocaleString("es-CL")}{" "}
            <TrendingUp className="h-4 w-4" />
          </div>
          <div className="text-muted-foreground leading-none">
            Mostrando todas las descripciones con cargos registrados
          </div>
        </CardFooter>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-3xl max-h-[70vh] overflow-y-auto">
          <DialogHeader className="flex items-center justify-between">
            <DialogTitle>Detalles de: {detalleDescripcion}</DialogTitle>
            <DialogClose asChild>
              <Button
                variant="ghost"
                size="sm"
                aria-label="Cerrar modal"
                onClick={() => setModalOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </DialogClose>
          </DialogHeader>

          <CardContent className="p-0">
            {detalleLoading ? (
              <div className="flex justify-center p-6">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : detalleError ? (
              <div className="text-destructive p-6 text-center font-medium">
                {detalleError}
              </div>
            ) : detalleData.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground font-medium">
                No hay datos para esta descripción
              </div>
            ) : (
              <>
                <table className="w-full border-collapse table-auto">
                  <thead>
                    <tr>
                      <th className="border px-4 py-2 text-left">Fecha</th>
                      <th className="border px-4 py-2 text-left">Descripción</th>
                      <th className="border px-4 py-2 text-left">Operación</th>
                      <th className="border px-4 py-2 text-right">Cargos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detalleData.map(({ id, Fecha, Descripcion, Cargos, Operacion }) => (
                      <tr
                        key={id}
                        className="hover:bg-muted dark:hover:bg-muted cursor-pointer"
                      >
                        <td className="border px-4 py-2">{Fecha}</td>
                        <td className="border px-4 py-2">{Descripcion}</td>
                        <td className="border px-4 py-2">{Operacion}</td>
                        <td className="border px-4 py-2 text-right">
                          ${Number(Cargos).toLocaleString("es-CL")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="flex justify-between items-center mt-4 px-2">
                  <Button
                    onClick={() => cambiarPagina(paginaActual - 1)}
                    disabled={paginaActual === 1}
                    variant="outline"
                  >
                    Anterior
                  </Button>
                  <div>
                    Página {paginaActual} de {totalPaginas}
                  </div>
                  <Button
                    onClick={() => cambiarPagina(paginaActual + 1)}
                    disabled={paginaActual === totalPaginas}
                    variant="outline"
                  >
                    Siguiente
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </DialogContent>
      </Dialog>
    </>
  )
}

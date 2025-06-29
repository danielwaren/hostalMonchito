"use client"

import { useEffect, useState } from "react"
import { TrendingUp } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { supabase } from "@/lib/supabase"

const parseChileanCurrency = (value: any) => {
  if (!value) return 0
  let cleanValue = value.toString().trim().replace(/[$\s]/g, '')
  if (cleanValue.includes('.') && !cleanValue.includes(',')) {
    cleanValue = cleanValue.replace(/\./g, '')
  }
  cleanValue = cleanValue.replace(',', '.')
  const numericValue = parseFloat(cleanValue)
  return isNaN(numericValue) ? 0 : Math.abs(numericValue)
}

interface MonthlyData {
  month: string
  abonos: number
  cargos: number
}

export default function GraficoBalanceMensual() {
  const [chartData, setChartData] = useState<MonthlyData[]>([])
  const [totalBalance, setTotalBalance] = useState<number>(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMonthlyData = async () => {
      try {
        const { data, error } = await supabase
          .from("Cartola")
          .select("Abonos, Cargos, Fecha")
          .order('Fecha', { ascending: true })

        if (error) throw error

        // Agrupar datos por mes
        const monthlyGrouped: { [key: string]: { abonos: number; cargos: number } } = {}
        
        data?.forEach((item) => {
          const fecha = new Date(item.Fecha)
          const monthKey = fecha.toLocaleDateString('es-CL', { 
            year: 'numeric', 
            month: 'long' 
          })
          
          if (!monthlyGrouped[monthKey]) {
            monthlyGrouped[monthKey] = { abonos: 0, cargos: 0 }
          }
          
          monthlyGrouped[monthKey].abonos += parseChileanCurrency(item.Abonos)
          monthlyGrouped[monthKey].cargos += parseChileanCurrency(item.Cargos)
        })

        // Convertir a array
        const monthlyArray: MonthlyData[] = Object.entries(monthlyGrouped).map(([month, data]) => ({
          month: month.split(' ')[0], // Solo el nombre del mes
          abonos: data.abonos,
          cargos: data.cargos
        }))

        // Calcular balance total para mostrar en el footer
        const totalAbonos = monthlyArray.reduce((sum, item) => sum + item.abonos, 0)
        const totalCargos = monthlyArray.reduce((sum, item) => sum + item.cargos, 0)
        const total = totalAbonos - totalCargos
        
        setChartData(monthlyArray)
        setTotalBalance(total)
        setLoading(false)
      } catch (err) {
        console.error("Error al cargar datos mensuales desde Supabase:", err)
        setLoading(false)
      }
    }

    fetchMonthlyData()
  }, [])

  if (loading) {
    return (
      <Card className="flex flex-col">
        <CardHeader className="items-center pb-0">
          <CardTitle>Cargando...</CardTitle>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Balance Mensual</CardTitle>
        <CardDescription>Total de abonos y cargos por mes</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 items-center pb-0">
        <ChartContainer
          config={{
            abonos: { label: "Abonos", color: "hsl(var(--primary))" },
            cargos: { label: "Cargos", color: "hsl(var(--destructive))" },
          }}
          className="mx-auto w-full max-w-[800px] h-[400px]"
        >
          <BarChart data={chartData}>
            <CartesianGrid vertical={false} strokeOpacity={0.3} />
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => 
                new Intl.NumberFormat('es-CL', {
                  style: 'currency',
                  currency: 'CLP',
                  minimumFractionDigits: 0,
                }).format(value)
              }
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent 
                indicator="dot"
                formatter={(value, name) => [
                  new Intl.NumberFormat('es-CL', {
                    style: 'currency',
                    currency: 'CLP',
                  }).format(value as number),
                  name
                ]}
              />}
            />
            <Bar 
              dataKey="abonos" 
              fill="hsl(var(--primary))" 
              radius={4}
              className="stroke-transparent stroke-2"
            />
            <Bar 
              dataKey="cargos" 
              fill="hsl(var(--destructive))" 
              radius={4}
              className="stroke-transparent stroke-2"
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 font-semibold text-primary">
          Balance total: {totalBalance.toLocaleString("es-CL", {
            style: "currency",
            currency: "CLP",
          })}
          <TrendingUp className="h-4 w-4" />
        </div>
        <div className="text-muted-foreground leading-none">
          Totales mensuales de abonos y cargos desde Supabase
        </div>
      </CardFooter>
    </Card>
  )
}
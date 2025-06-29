"use client"

import { useEffect, useState } from "react"
import { TrendingUp } from "lucide-react"
import { Label, PolarRadiusAxis, RadialBar, RadialBarChart } from "recharts"
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

export default function GraficoCompraVenta() {
  const [chartData, setChartData] = useState<{ ventas: number; gastos: number }[]>([])
  const [balanceTotal, setBalanceTotal] = useState<number | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data, error } = await supabase
          .from("Cartola")
          .select("Abonos, Cargos")

        if (error) throw error

        let totalAbonos = 0
        let totalCargos = 0

        data?.forEach((item) => {
          totalAbonos += parseChileanCurrency(item.Abonos)
          totalCargos += parseChileanCurrency(item.Cargos)
        })

        setChartData([
          {
            ventas: totalAbonos,
            gastos: totalCargos,
          },
        ])
        setBalanceTotal(totalAbonos - totalCargos)
      } catch (err) {
        console.error("Error al cargar datos desde Supabase:", err)
      }
    }

    fetchData()
  }, [])

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Balance de Dinera</CardTitle>
        <CardDescription>Comparación entre abonos y cargos</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 items-center pb-0">
        <ChartContainer
          config={{
            ventas: { label: "Abonos", color: "hsl(var(--primary))" },
            gastos: { label: "Cargos", color: "hsl(var(--secondary))" },
          }}
          className="mx-auto aspect-square w-full max-w-[250px]"
        >
          <RadialBarChart
            data={chartData}
            endAngle={180}
            innerRadius={80}
            outerRadius={130}
          >
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle">
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) - 16}
                          className="fill-foreground text-2xl font-bold"
                        >
                          {balanceTotal?.toLocaleString("es-CL") ?? "0"}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 4}
                          className="fill-muted-foreground"
                        >
                          Balance
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </PolarRadiusAxis>
            <RadialBar
              dataKey="ventas"
              stackId="a"
              cornerRadius={5}
              fill="hsl(var(--primary))"
              className="stroke-transparent stroke-2"
            />
            <RadialBar
              dataKey="gastos"
              fill="hsl(var(--secondary))"
              stackId="a"
              cornerRadius={5}
              className="stroke-transparent stroke-2"
            />
          </RadialBarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        {balanceTotal !== null && (
          <div className="flex items-center gap-2 font-semibold text-primary">
            Balance total:{" "}
            {balanceTotal.toLocaleString("es-CL", {
              style: "currency",
              currency: "CLP",
            })}
            <TrendingUp className="h-4 w-4" />
          </div>
        )}
        <div className="text-muted-foreground leading-none">
          Datos cargados desde Supabase
        </div>
      </CardFooter>
    </Card>
  )
}

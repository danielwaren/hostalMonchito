"use client"

import { TrendingUp } from "lucide-react"
import { Bar, BarChart, CartesianGrid, Rectangle, XAxis, ResponsiveContainer } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { ChartConfig } from "@/components/ui/chart"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

export const description = "Gráfico de barras de ventas"

const chartData = [
  { mes: "Enero", ventas: 187, fill: "hsl(var(--primary))" },
  { mes: "Febrero", ventas: 200, fill: "hsl(var(--primary))" },
  { mes: "Marzo", ventas: 275, fill: "hsl(var(--primary))" },
  { mes: "Abril", ventas: 173, fill: "hsl(var(--primary))" },
  { mes: "Mayo", ventas: 90, fill: "hsl(var(--primary))" },
]

const chartConfig = {
  ventas: {
    label: "Ventas",
    color: "hsl(var(--primary))",
  },
  Enero: {
    label: "Enero",
    color: "hsl(var(--primary))",
  },
  Febrero: {
    label: "Febrero",
    color: "hsl(var(--primary))",
  },
  Marzo: {
    label: "Marzo",
    color: "hsl(var(--primary))",
  },
  Abril: {
    label: "Abril",
    color: "hsl(var(--primary))",
  },
  Mayo: {
    label: "Mayo",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig

export default function GraficoDashboard() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Gráfico de Ventas</CardTitle>
        <CardDescription>Enero - Mayo 2024</CardDescription>
      </CardHeader>
      <CardContent className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="mes"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) =>
                chartConfig[value as keyof typeof chartConfig]?.label
              }
            />
            <ChartTooltip
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar
              dataKey="ventas"
              strokeWidth={2}
              radius={8}
              activeIndex={2}
              activeBar={({ ...props }) => {
                return (
                  <Rectangle
                    {...props}
                    fillOpacity={0.8}
                    stroke={props.payload.fill}
                    strokeDasharray={4}
                    strokeDashoffset={4}
                  />
                )
              }}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 leading-none font-medium">
          Incremento de 5.2% este mes <TrendingUp className="h-4 w-4" />
        </div>
        <div className="text-muted-foreground leading-none">
          Mostrando ventas totales de los últimos 5 meses
        </div>
      </CardFooter>
    </Card>
  )
}

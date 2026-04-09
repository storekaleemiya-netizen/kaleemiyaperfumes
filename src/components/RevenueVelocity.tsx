"use client"

import React from 'react';
import { TrendingUp } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"

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
  type ChartConfig,
} from "@/components/ui/chart"

export const description = "A multiple bar chart"

const chartData = [
  { month: "January", revenue: 186, orders: 80 },
  { month: "February", revenue: 305, orders: 200 },
  { month: "March", revenue: 237, orders: 120 },
  { month: "April", revenue: 73, orders: 190 },
  { month: "May", revenue: 209, orders: 130 },
  { month: "June", revenue: 214, orders: 140 },
]

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "#310101",
  },
  orders: {
    label: "Orders",
    color: "#B0843D",
  },
} satisfies ChartConfig

const RevenueVelocity = () => {
  return (
    <Card className="rounded-[40px] shadow-xl border-none p-0 md:p-6 overflow-hidden">
      <CardHeader className="p-6 md:p-6">
        <CardTitle className="text-2xl md:text-4xl font-serif font-black italic text-[#310101] tracking-tight">Revenue Velocity</CardTitle>
        <CardDescription className="text-[#B0843D] text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] md:tracking-[0.4em] opacity-80">Graphed signature Analytics</CardDescription>
      </CardHeader>
      <CardContent className="p-2 md:p-6">
        <ChartContainer config={chartConfig} className="min-h-[200px] md:min-h-[300px] w-full">
          <BarChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} stroke="#e5e7eb" />
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 3)}
              tick={{ fill: '#6b7280', fontSize: 10 }}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dashed" />}
            />
            <Bar dataKey="revenue" fill={chartConfig.revenue.color} radius={4} />
            <Bar dataKey="orders" fill={chartConfig.orders.color} radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm p-6 md:pt-6">
        <div className="flex gap-2 leading-none font-medium text-base md:text-lg">
          Trending up by 5.2% this month <TrendingUp className="h-5 w-5 text-green-500" />
        </div>
        <div className="leading-none text-muted-foreground text-sm md:text-base">
          Showing total visitors for the last 6 months
        </div>
      </CardFooter>
    </Card>
  )
}

export default RevenueVelocity;

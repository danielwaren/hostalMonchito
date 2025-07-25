"use client"

import * as React from "react"
import {
  AudioWaveform,
  BookOpen,
  Bot,
  Command,
  Frame,
  GalleryVerticalEnd,
  Map,
  PieChart,
  Settings2,
  SquareTerminal,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

// This is sample data.
const data = {
  user: {
    name: "Hostal",
    email: "hostalmonchito2023@gmail.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "Hostal Monchito",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
    {
      name: "Hostal Monchito",
      logo: AudioWaveform,
      plan: "Startup",
    },
    {
      name: "Evil Corp.",
      logo: Command,
      plan: "Free",
    },
  ],
  navMain: [
    {
      title: "Dashboard",
      url: "/",
      icon: SquareTerminal,
      isActive: true,
      items: [
        {
          title: "Subir cartola",
          url: "/CartolaCsv",
        },
        {
          title: "Cartolas",
          url: "/Cartolas",
        },
        {
          title: "Calculador",
          url: "/Convertidor",
        },
        {
          title: "Armar Pizza",
          url: "/ArmarPizza",
        },
      ],
    },
    {
      title: "Ventas",
      url: "#",
      icon: Bot,
      items: [
        {
          title: "Nueva Venta",
          url: "/nuevaVenta",
        },
        {
          title: "Detalles de ventas",
          url: "/detalleVenta",
        },
        {
          title: "Detalles de ventas supabase",
          url: "/detalleVenta",
        },
        {
          title: "Quantum",
          url: "#",
        },
      ],
    },
    {
      title: "Gastos",
      url: "/",
      icon: BookOpen,
      items: [
        {
          title: "Nuevo Gasto",
          url: "/nuevoGasto",
        },
        {
          title: "Detalles de gastos",
          url: "/detalleGasto",
        },
        {
          title: "Detalles de gastos supabase",
          url: "/detalleGasto",
        },
        {
          title: "Tutorials",
          url: "#",
        },
        {
          title: "Changelog",
          url: "#",
        },
      ],
    },
    {
      title: "Proovedores",
      url: "#",
      icon: Settings2,
      items: [
        {
          title: "General",
          url: "#",
        },
        {
          title: "Team",
          url: "#",
        },
        {
          title: "Billing",
          url: "#",
        },
        {
          title: "Limits",
          url: "#",
        },
      ],
    },
    {
      title: "Facturas",
      url: "#",
      icon: Settings2,
      items: [
        {
          title: "Ingresar Factura",
          url: "/facturas",
        },
        {
          title: "Detalles de Facturas",
          url: "/tablafacturas",
        },
        {
          title: "Ingresar clientes",
          url: "/clientes",
        },
        {
          title: "Clientes",
          url: "/detalleCliente",
        },
      ],
    },
  ],
  projects: [
    {
      name: "Design Engineering",
      url: "#",
      icon: Frame,
    },
    {
      name: "Sales & Marketing",
      url: "#",
      icon: PieChart,
    },
    {
      name: "Travel",
      url: "#",
      icon: Map,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" {...props}>
        <SidebarHeader >
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <TeamSwitcher teams={data.teams} />
          </div>
        </SidebarHeader>
        <SidebarContent>
          <NavMain items={data.navMain} />
  
        </SidebarContent>
        <SidebarFooter>
          <NavUser user={data.user} />
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
    </SidebarProvider>
  )
}

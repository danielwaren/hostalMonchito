"use client";
import { useEffect, useState } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, Monitor, Smartphone, Users, TrendingUp, MapPin } from "lucide-react";

interface Visita {
  id: number;
  pagina: string;
  referente: string | null;
  dispositivo: string | null;
  pais: string | null;
  ciudad: string | null;
  created_at: string;
}

const COLORES = ["#7a6340", "#9a8f78", "#b0a090", "#c4b9ac", "#d8d0c4"];

function agruparPorDia(visitas: Visita[]) {
  const mapa: Record<string, number> = {};
  visitas.forEach((v) => {
    const dia = new Date(v.created_at).toLocaleDateString("es-CL", {
      day: "2-digit", month: "short",
    });
    mapa[dia] = (mapa[dia] ?? 0) + 1;
  });
  return Object.entries(mapa)
    .map(([dia, visitas]) => ({ dia, visitas }))
    .slice(-14);
}

function agruparPorCampo(visitas: Visita[], campo: keyof Visita) {
  const mapa: Record<string, number> = {};
  visitas.forEach((v) => {
    const val = (v[campo] as string) || "Desconocido";
    mapa[val] = (mapa[val] ?? 0) + 1;
  });
  return Object.entries(mapa)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([nombre, cantidad]) => ({ nombre, cantidad }));
}

function limpiarPagina(p: string) {
  if (p === "/") return "Inicio";
  return p.replace(/^\//, "").replace(/-/g, " ");
}

function limpiarReferente(r: string | null) {
  if (!r) return "Directo";
  try {
    return new URL(r).hostname.replace("www.", "");
  } catch {
    return r;
  }
}

export default function Analytics() {
  const [visitas, setVisitas] = useState<Visita[]>([]);
  const [rango, setRango] = useState<7 | 30 | 90>(30);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      setCargando(true);
      try {
        const res = await fetch(`/api/visitas?dias=${rango}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setVisitas(data ?? []);
      } catch (e) {
        console.error("Error inesperado:", e);
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, [rango]);

  const porDia = agruparPorDia(visitas);
  const porPagina = agruparPorCampo(visitas, "pagina").map((x) => ({
    ...x, nombre: limpiarPagina(x.nombre),
  }));
  const porDispositivo = agruparPorCampo(visitas, "dispositivo");
  const porPais = agruparPorCampo(visitas, "pais");
  const porReferente = visitas
    .map((v) => ({ ...v, ref: limpiarReferente(v.referente) }))
    .reduce<Record<string, number>>((acc, v) => {
      acc[v.ref] = (acc[v.ref] ?? 0) + 1;
      return acc;
    }, {});
  const topReferentes = Object.entries(porReferente)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const hoy = new Date().toDateString();
  const visitasHoy = visitas.filter(
    (v) => new Date(v.created_at).toDateString() === hoy
  ).length;

  const ayer = new Date();
  ayer.setDate(ayer.getDate() - 1);
  const visitasAyer = visitas.filter(
    (v) => new Date(v.created_at).toDateString() === ayer.toDateString()
  ).length;

  if (cargando) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
        Cargando datos de visitas…
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Selector de rango */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-lg font-semibold">Actividad del sitio</h2>
        <div className="flex gap-2">
          {([7, 30, 90] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRango(r)}
              className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                rango === r
                  ? "bg-foreground text-background border-foreground"
                  : "border-border text-muted-foreground hover:border-foreground/40"
              }`}
            >
              {r === 7 ? "7 días" : r === 30 ? "30 días" : "90 días"}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total visitas", valor: visitas.length, icon: <Users className="h-4 w-4" /> },
          { label: "Hoy", valor: visitasHoy, icon: <TrendingUp className="h-4 w-4" /> },
          { label: "Ayer", valor: visitasAyer, icon: <TrendingUp className="h-4 w-4 opacity-50" /> },
          { label: "Páginas únicas", valor: new Set(visitas.map((v) => v.pagina)).size, icon: <Globe className="h-4 w-4" /> },
        ].map(({ label, valor, icon }) => (
          <Card key={label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                {icon} {label}
              </div>
              <p className="text-2xl font-semibold">{valor.toLocaleString("es-CL")}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Gráfico visitas por día */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Visitas por día</CardTitle>
        </CardHeader>
        <CardContent>
          {porDia.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-8">Sin datos aún — las visitas aparecerán aquí cuando lleguen usuarios al sitio.</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={porDia}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="dia" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  formatter={(v: number) => [v, "Visitas"]}
                />
                <Line
                  type="monotone"
                  dataKey="visitas"
                  stroke="#7a6340"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "#7a6340" }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Páginas más visitadas + Dispositivos */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Páginas más visitadas</CardTitle>
          </CardHeader>
          <CardContent>
            {porPagina.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-6">Sin datos</p>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={porPagina} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                  <YAxis dataKey="nombre" type="category" tick={{ fontSize: 11 }} width={70} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v: number) => [v, "Visitas"]} />
                  <Bar dataKey="cantidad" radius={[0, 4, 4, 0]}>
                    {porPagina.map((_, i) => (
                      <Cell key={i} fill={COLORES[i % COLORES.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Dispositivos</CardTitle>
          </CardHeader>
          <CardContent>
            {porDispositivo.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-6">Sin datos</p>
            ) : (
              <div className="space-y-3 pt-2">
                {porDispositivo.map(({ nombre, cantidad }, i) => {
                  const pct = Math.round((cantidad / visitas.length) * 100);
                  const Icon = nombre === "móvil" ? Smartphone : Monitor;
                  return (
                    <div key={nombre} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="flex items-center gap-1.5 capitalize">
                          <Icon className="h-3.5 w-3.5 text-muted-foreground" /> {nombre}
                        </span>
                        <span className="text-muted-foreground">{cantidad} ({pct}%)</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${pct}%`, background: COLORES[i] }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Países + Referentes */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" /> Países
            </CardTitle>
          </CardHeader>
          <CardContent>
            {porPais.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-6">Sin datos (disponible en producción)</p>
            ) : (
              <div className="space-y-2">
                {porPais.map(({ nombre, cantidad }) => (
                  <div key={nombre} className="flex justify-between text-sm py-1 border-b border-border/50 last:border-0">
                    <span>{nombre}</span>
                    <span className="text-muted-foreground">{cantidad}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Origen de visitas</CardTitle>
          </CardHeader>
          <CardContent>
            {topReferentes.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-6">Sin datos</p>
            ) : (
              <div className="space-y-2">
                {topReferentes.map(([ref, cnt]) => (
                  <div key={ref} className="flex justify-between text-sm py-1 border-b border-border/50 last:border-0">
                    <span className="truncate max-w-[180px]">{ref}</span>
                    <span className="text-muted-foreground">{cnt}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Últimas visitas */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Últimas visitas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground text-xs">
                  <th className="text-left py-2 font-medium">Página</th>
                  <th className="text-left py-2 font-medium">Dispositivo</th>
                  <th className="text-left py-2 font-medium">País</th>
                  <th className="text-left py-2 font-medium">Origen</th>
                  <th className="text-right py-2 font-medium">Hora</th>
                </tr>
              </thead>
              <tbody>
                {[...visitas].reverse().slice(0, 20).map((v) => (
                  <tr key={v.id} className="border-b border-border/40 last:border-0">
                    <td className="py-2 font-medium">{limpiarPagina(v.pagina)}</td>
                    <td className="py-2 text-muted-foreground capitalize">{v.dispositivo ?? "—"}</td>
                    <td className="py-2 text-muted-foreground">{v.pais ?? "—"}</td>
                    <td className="py-2 text-muted-foreground">{limpiarReferente(v.referente)}</td>
                    <td className="py-2 text-muted-foreground text-right text-xs">
                      {new Date(v.created_at).toLocaleString("es-CL", {
                        day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
                      })}
                    </td>
                  </tr>
                ))}
                {visitas.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center text-muted-foreground py-8">
                      Aún no hay visitas registradas en este período.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}

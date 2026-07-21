export const prerender = false;

import type { APIRoute } from "astro";

const BASE = "https://www.hostalmonchito.cl";

// Solo páginas públicas. El panel, los vouchers compartidos y las rutas de
// API quedan fuera a propósito.
const PAGINAS: { ruta: string; prioridad: string; frecuencia: string }[] = [
  { ruta: "/", prioridad: "1.0", frecuencia: "weekly" },
  { ruta: "/hospedaje-puerto-cisnes", prioridad: "0.9", frecuencia: "monthly" },
  { ruta: "/Contacto", prioridad: "0.8", frecuencia: "monthly" },
  { ruta: "/carta", prioridad: "0.7", frecuencia: "monthly" },
  { ruta: "/blog", prioridad: "0.6", frecuencia: "weekly" },
  { ruta: "/blog/hospedaje-puerto-cisnes", prioridad: "0.8", frecuencia: "monthly" },
  { ruta: "/blog/como-llegar-a-cisnes", prioridad: "0.7", frecuencia: "monthly" },
  { ruta: "/blog/donde-comer", prioridad: "0.7", frecuencia: "monthly" },
  { ruta: "/blog/que-hacer", prioridad: "0.7", frecuencia: "monthly" },
  { ruta: "/blog/parque-queulat-puerto-cisnes", prioridad: "0.7", frecuencia: "monthly" },
];

export const GET: APIRoute = async () => {
  const hoy = new Date().toISOString().split("T")[0];

  const urls = PAGINAS.map(
    ({ ruta, prioridad, frecuencia }) => `  <url>
    <loc>${BASE}${ruta}</loc>
    <lastmod>${hoy}</lastmod>
    <changefreq>${frecuencia}</changefreq>
    <priority>${prioridad}</priority>
  </url>`
  ).join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
};

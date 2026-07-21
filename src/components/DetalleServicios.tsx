"use client";
import { useState, useEffect, useRef } from "react";
import { Plus, Trash2, Receipt, Save, Search, XCircle, Pencil, Printer } from "lucide-react";

// ─── Ícono WhatsApp (SVG inline, sin dependencias extra) ──────────────────
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);
import {
  Table, TableBody, TableCaption, TableCell,
  TableFooter, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Card, CardContent, CardTitle,
  CardDescription, CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ServicioRow {
  id: number;
  fecha: string;
  almuerzo: number;
  cena: number;
  alojamiento: number;
}

interface ClienteDB {
  id: number;
  nombre_cliente: string;
  servicios: ServicioRow[];
  created_at: string;
}

const PRECIO_ALMUERZO = 10000;
const PRECIO_CENA = 10000;
const PRECIO_ALOJAMIENTO = 25000;
const IVA = 0.19;

// ─── Formato de moneda CLP ─────────────────────────────────────────────────
const formatCLP = (v: number) =>
  v.toLocaleString("es-CL", { style: "currency", currency: "CLP" });

// ─── Cálculos ──────────────────────────────────────────────────────────────
const calcSubtotal = (s: ServicioRow) =>
  s.almuerzo * PRECIO_ALMUERZO + s.cena * PRECIO_CENA + s.alojamiento * PRECIO_ALOJAMIENTO;
const calcTotalIVA = (s: ServicioRow) => calcSubtotal(s) * (1 + IVA);

// ─── Generador de Voucher PDF ───────────────────────────────────────────────
function imprimirVoucher(cliente: string, servicios: ServicioRow[]) {
  const totalNeto = servicios.reduce((a, s) => a + calcSubtotal(s), 0);
  const totalIVAcalc = totalNeto * IVA;
  const totalBruto = totalNeto + totalIVAcalc;
  const fechaEmision = new Date().toLocaleDateString("es-CL", {
    day: "2-digit", month: "long", year: "numeric",
  });

  const voucher = generarHTMLVoucher(
    cliente,
    servicios,
    generarFilasVoucher(servicios),
    fechaEmision,
    totalNeto,
    totalIVAcalc,
    totalBruto
  );

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Voucher – ${cliente} – Hostal Monchito</title>
  <style>
    body { margin:0; padding:24px; background:#e6e2d9; display:flex; justify-content:center; }
    @page { size:A4; margin:8mm; }
    @media print { body { padding:0; background:#fff; } }
  </style>
</head>
<body>
  ${voucher}
  <script>window.addEventListener('load', () => setTimeout(() => window.print(), 400));<\/script>
</body>
</html>`;

  const ventana = window.open("", "_blank", "width=900,height=700");
  if (ventana) {
    ventana.document.write(html);
    ventana.document.close();
  }
}

// ─── Mensaje de envío ──────────────────────────────────────────────────────
function saludoSegunHora(): string {
  const h = new Date().getHours();
  if (h >= 6 && h < 12) return "Buenos días";
  if (h >= 12 && h < 20) return "Buenas tardes";
  return "Buenas noches"; // 20:00 a 05:59
}

function mensajeVoucher(
  cliente: string,
  servicios: ServicioRow[],
  totalBruto: number
): string {
  return [
    `${saludoSegunHora()}.`,
    "",
    `Junto con saludar, adjuntamos el voucher de servicios prestados por Hostal & Restaurant Monchito, correspondiente a ${cliente}, por el período ${periodoServicios(servicios)}, por un monto total de ${formatCLP(totalBruto)}.`,
    "",
    "Ante cualquier consulta, quedamos a su entera disposición.",
    "",
    "Atentamente,",
    "Hostal & Restaurant Monchito",
    "Puerto Cisnes, Región de Aysén",
  ].join("\n");
}

// ─── Compartir voucher como imagen por WhatsApp ────────────────────────────
async function compartirPDFWhatsApp(
  cliente: string,
  servicios: ServicioRow[],
  setCargandoPDF: (v: boolean) => void
) {
  setCargandoPDF(true);
  try {
    const { default: html2canvas } = await import("html2canvas");

    const totalNeto    = servicios.reduce((a, s) => a + calcSubtotal(s), 0);
    const totalIVAcalc = totalNeto * IVA;
    const totalBruto   = totalNeto + totalIVAcalc;
    const fechaEmision = new Date().toLocaleDateString("es-CL", {
      day: "2-digit", month: "long", year: "numeric",
    });

    const voucherHTML = generarHTMLVoucher(
      cliente, servicios, generarFilasVoucher(servicios), fechaEmision,
      totalNeto, totalIVAcalc, totalBruto
    );

    // Renderizar el voucher en un div oculto
    const contenedor = document.createElement("div");
    contenedor.style.cssText =
      "position:fixed;left:-9999px;top:0;width:780px;background:#fff;z-index:-1;";
    contenedor.innerHTML = voucherHTML;
    document.body.appendChild(contenedor);

    await document.fonts.ready;
    // El logo tiene que estar cargado antes de capturar, o sale en blanco
    await Promise.all(
      Array.from(contenedor.querySelectorAll("img")).map((img) =>
        img.complete
          ? Promise.resolve()
          : new Promise((r) => {
              img.onload = r;
              img.onerror = r;
            })
      )
    );
    await new Promise((r) => setTimeout(r, 400));

    const canvas = await html2canvas(contenedor, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      logging: false,
    });

    document.body.removeChild(contenedor);

    const nombreArchivo = `Voucher_${cliente.replace(/\s+/g, "_")}_Monchito.jpg`;

    // Convertir canvas a blob JPEG
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("Canvas vacío"))),
        "image/jpeg",
        0.92
      )
    );

    const imageFile = new File([blob], nombreArchivo, { type: "image/jpeg" });
    const mensaje = mensajeVoucher(cliente, servicios, totalBruto);

    // Móvil (y escritorios con hoja de compartir): el sistema muestra el
    // selector de contacto y adjunta la imagen junto con el mensaje.
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [imageFile] })) {
      await navigator.share({
        title: `Voucher de servicios – ${cliente}`,
        text: mensaje,
        files: [imageFile],
      });
      return;
    }

    // Escritorio sin hoja de compartir (p. ej. Firefox): el navegador no
    // permite adjuntar archivos a WhatsApp Web desde la página, así que se
    // descarga la imagen y se abre WhatsApp con el mensaje ya escrito para
    // que el usuario elija el contacto y adjunte el archivo descargado.
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = nombreArchivo;
    a.click();
    URL.revokeObjectURL(url);

    window.open(
      `https://web.whatsapp.com/send?text=${encodeURIComponent(mensaje)}`,
      "_blank",
      "noopener,noreferrer"
    );

    alert(
      `El voucher se descargó como "${nombreArchivo}".\n\n` +
        "En WhatsApp: elija el contacto, adjunte esa imagen con el clip 📎 " +
        "y envíe. El mensaje ya va escrito."
    );
  } catch (err: any) {
    // El usuario canceló el diálogo de compartir — no es un error real
    if (err?.name === "AbortError") return;
    console.error("Error al generar imagen:", err);
    alert("Ocurrió un error al generar el voucher. Intente de nuevo.");
  } finally {
    setCargandoPDF(false);
  }
}

// ─── Filas de la tabla (compartidas entre impresión e imagen) ──────────────
function generarFilasVoucher(servicios: ServicioRow[]): string {
  return servicios
    .filter((s) => calcSubtotal(s) > 0)
    .map(
      (s) => `
      <tr>
        <td class="fecha">${new Date(s.fecha + "T12:00:00").toLocaleDateString("es-CL", {
          day: "2-digit", month: "short", year: "numeric",
        })}</td>
        <td class="c">${s.almuerzo > 0 ? s.almuerzo : "—"}</td>
        <td class="c">${s.cena > 0 ? s.cena : "—"}</td>
        <td class="c">${s.alojamiento > 0 ? s.alojamiento : "—"}</td>
        <td class="r">${formatCLP(calcSubtotal(s))}</td>
        <td class="r b">${formatCLP(calcTotalIVA(s))}</td>
      </tr>`
    )
    .join("");
}

// Rango de fechas cubierto por el voucher (dato real, no correlativo inventado)
function periodoServicios(servicios: ServicioRow[]): string {
  const fechas = servicios
    .filter((s) => calcSubtotal(s) > 0)
    .map((s) => s.fecha)
    .sort();
  if (fechas.length === 0) return "—";
  const fmt = (f: string) =>
    new Date(f + "T12:00:00").toLocaleDateString("es-CL", {
      day: "2-digit", month: "2-digit", year: "numeric",
    });
  const desde = fmt(fechas[0]);
  const hasta = fmt(fechas[fechas.length - 1]);
  return desde === hasta ? desde : `${desde} — ${hasta}`;
}

// ─── HTML del voucher (única fuente de verdad: impresión e imagen) ──────────
function generarHTMLVoucher(
  cliente: string,
  servicios: ServicioRow[],
  filasServicios: string,
  fechaEmision: string,
  totalNeto: number,
  totalIVAcalc: number,
  totalBruto: number
): string {
  return `
  <style>
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap');

    /* Sin esto el navegador descarta los fondos al imprimir y el
       voucher sale casi todo en blanco. */
    .v-page, .v-page * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .v-page *, .v-page *::before, .v-page *::after { box-sizing:border-box; margin:0; padding:0; }
    .v-page { width:780px; background:#fff; font-family:'DM Sans',Arial,sans-serif; font-size:11.5px; color:#1f2421; }

    /* Cabecera */
    .v-rule-top { height:5px; background:#1e463c; }
    .v-head { display:flex; align-items:center; padding:20px 34px 18px; border-bottom:1px solid #d8d3c9; }
    .v-logo { width:74px; height:74px; flex-shrink:0; }
    .v-logo img { width:100%; height:100%; display:block; }
    .v-brand { padding-left:18px; flex:1; }
    .v-brand-name { font-size:23px; font-weight:700; color:#1e463c; letter-spacing:3.5px; text-transform:uppercase; line-height:1.1; }
    .v-brand-sub { font-size:9.5px; color:#6d7570; letter-spacing:1.6px; text-transform:uppercase; margin-top:5px; }
    .v-head-contact { text-align:right; font-size:10px; color:#4a524d; line-height:1.85; padding-left:20px; }
    .v-head-contact span { color:#8a918c; }

    /* Barra de título del documento */
    .v-doc { background:#1e463c; padding:11px 34px; display:flex; align-items:center; }
    .v-doc-title { flex:1; font-size:13px; font-weight:600; color:#fff; letter-spacing:2.6px; text-transform:uppercase; }
    .v-doc-tag { font-size:9px; color:#a9c0b6; letter-spacing:1.6px; text-transform:uppercase; }

    /* Metadatos */
    .v-meta { display:flex; border-bottom:1px solid #d8d3c9; }
    .v-meta-cell { flex:1; padding:11px 34px; border-right:1px solid #e4e0d7; }
    .v-meta-cell:last-child { border-right:0; }
    .v-meta-k { font-size:8.5px; color:#8a918c; letter-spacing:1.7px; text-transform:uppercase; margin-bottom:3px; }
    .v-meta-v { font-size:12.5px; font-weight:600; color:#1f2421; }
    .v-meta-v.cli { color:#1e463c; }

    /* Secciones */
    .v-sec { padding:18px 34px 0; }
    .v-sec-title { font-size:9px; font-weight:600; color:#1e463c; letter-spacing:2.2px; text-transform:uppercase; padding-bottom:7px; border-bottom:1.5px solid #1e463c; margin-bottom:0; }

    /* Tabla */
    .v-table { width:100%; border-collapse:collapse; }
    .v-table thead th { background:#eef1ef; color:#1e463c; font-size:8.5px; font-weight:700; text-transform:uppercase; letter-spacing:1.1px; padding:9px 10px; text-align:left; border-bottom:1px solid #c9d2cd; }
    .v-table thead th.c { text-align:center; }
    .v-table thead th.r { text-align:right; }
    .v-table tbody td { padding:8px 10px; font-size:11.5px; color:#2c322e; border-bottom:1px solid #e8e5dd; }
    .v-table tbody tr:last-child td { border-bottom:1px solid #c9d2cd; }
    .v-table td.c { text-align:center; }
    .v-table td.r { text-align:right; font-variant-numeric:tabular-nums; }
    .v-table td.b { font-weight:700; color:#1e463c; }
    .v-table td.fecha { color:#4a524d; font-weight:500; }
    .v-empty { text-align:center; color:#8a918c; padding:20px; }

    /* Resumen */
    .v-cards { display:flex; border:1px solid #d8d3c9; }
    .v-card { flex:1; padding:10px 12px; border-right:1px solid #e4e0d7; display:flex; align-items:center; }
    .v-card:last-child { border-right:0; }
    .v-card-qty { font-size:22px; font-weight:700; color:#1e463c; line-height:1; min-width:34px; }
    .v-card-txt { padding-left:10px; }
    .v-card-label { font-size:8.5px; color:#6d7570; letter-spacing:1.5px; text-transform:uppercase; }
    .v-card-price { font-size:10px; color:#8a918c; margin-top:2px; }

    /* Zona inferior */
    .v-bottom { padding:18px 34px 20px; display:flex; align-items:flex-start; }
    .v-deposit { flex:1; border:1px solid #d8d3c9; padding:12px 14px; }
    .v-dep-title { font-size:8.5px; font-weight:700; color:#1e463c; letter-spacing:1.8px; text-transform:uppercase; padding-bottom:7px; margin-bottom:7px; border-bottom:1px solid #e4e0d7; }
    .v-dep-row { display:flex; justify-content:space-between; font-size:10.5px; line-height:1.95; }
    .v-dep-k { color:#8a918c; }
    .v-dep-v { color:#2c322e; font-weight:500; text-align:right; }
    .v-dep-v.acc { color:#1e463c; font-weight:700; }

    .v-totals { width:262px; margin-left:16px; border:1px solid #d8d3c9; }
    .v-tot-row { display:flex; justify-content:space-between; padding:8px 14px; font-size:11.5px; border-bottom:1px solid #e8e5dd; }
    .v-tot-row .k { color:#6d7570; }
    .v-tot-row .v { color:#2c322e; font-weight:600; font-variant-numeric:tabular-nums; }
    .v-tot-grand { background:#1e463c; padding:12px 14px; display:flex; justify-content:space-between; align-items:center; }
    .v-tot-grand .k { font-size:9.5px; font-weight:600; color:#a9c0b6; letter-spacing:2.2px; text-transform:uppercase; }
    .v-tot-grand .v { font-size:20px; font-weight:700; color:#fff; line-height:1; font-variant-numeric:tabular-nums; }

    /* Pie */
    .v-foot { border-top:1px solid #d8d3c9; padding:12px 34px; display:flex; align-items:center; }
    .v-foot-l { flex:1; font-size:9.5px; color:#8a918c; line-height:1.7; }
    .v-foot-r { text-align:right; font-size:9.5px; color:#6d7570; }
    .v-foot-r b { color:#1e463c; font-weight:600; }
    .v-rule-bottom { height:5px; background:#1e463c; }

    @page { size:A4; margin:10mm; }
    @media print {
      .v-page { width:100% !important; }
    }
  </style>

  <div class="v-page">

    <div class="v-rule-top"></div>

    <div class="v-head">
      <div class="v-logo"><img src="/img/logo-voucher.png" alt="Hostal Monchito" /></div>
      <div class="v-brand">
        <div class="v-brand-name">Monchito</div>
        <div class="v-brand-sub">Residencial y Restaurant · Puerto Cisnes, Aysén</div>
      </div>
      <div class="v-head-contact">
        <span>Dirección</span> Aguada de Dolores 1<br />
        <span>Correo</span> hostalmonchito2023@gmail.com<br />
        <span>Teléfono</span> +56 9 6224 9178
      </div>
    </div>

    <div class="v-doc">
      <div class="v-doc-title">Detalle de Servicios Prestados</div>
      <div class="v-doc-tag">Comprobante</div>
    </div>

    <div class="v-meta">
      <div class="v-meta-cell">
        <div class="v-meta-k">Cliente</div>
        <div class="v-meta-v cli">${cliente}</div>
      </div>
      <div class="v-meta-cell">
        <div class="v-meta-k">Período de servicios</div>
        <div class="v-meta-v">${periodoServicios(servicios)}</div>
      </div>
      <div class="v-meta-cell">
        <div class="v-meta-k">Fecha de emisión</div>
        <div class="v-meta-v">${fechaEmision}</div>
      </div>
    </div>

    <div class="v-sec">
      <div class="v-sec-title">Consumos por fecha</div>
      <table class="v-table">
        <thead><tr>
          <th>Fecha</th><th class="c">Almuerzos</th><th class="c">Cenas</th>
          <th class="c">Alojamientos</th><th class="r">Neto</th><th class="r">Total c/IVA</th>
        </tr></thead>
        <tbody>${filasServicios || `<tr><td colspan="6" class="v-empty">Sin servicios registrados</td></tr>`}</tbody>
      </table>
    </div>

    <div class="v-sec">
      <div class="v-sec-title">Resumen por concepto</div>
      <div class="v-cards" style="margin-top:12px;">
        <div class="v-card">
          <div class="v-card-qty">${servicios.reduce((a, s) => a + s.almuerzo, 0)}</div>
          <div class="v-card-txt"><div class="v-card-label">Almuerzos</div><div class="v-card-price">${formatCLP(PRECIO_ALMUERZO)} c/u</div></div>
        </div>
        <div class="v-card">
          <div class="v-card-qty">${servicios.reduce((a, s) => a + s.cena, 0)}</div>
          <div class="v-card-txt"><div class="v-card-label">Cenas</div><div class="v-card-price">${formatCLP(PRECIO_CENA)} c/u</div></div>
        </div>
        <div class="v-card">
          <div class="v-card-qty">${servicios.reduce((a, s) => a + s.alojamiento, 0)}</div>
          <div class="v-card-txt"><div class="v-card-label">Alojamientos</div><div class="v-card-price">${formatCLP(PRECIO_ALOJAMIENTO)} c/u</div></div>
        </div>
      </div>
    </div>

    <div class="v-bottom">
      <div class="v-deposit">
        <div class="v-dep-title">Datos para transferencia / depósito</div>
        <div class="v-dep-row"><span class="v-dep-k">Titular</span><span class="v-dep-v">Blanca Bertila Díaz Barría</span></div>
        <div class="v-dep-row"><span class="v-dep-k">RUT</span><span class="v-dep-v">6.768.074-K</span></div>
        <div class="v-dep-row"><span class="v-dep-k">Banco</span><span class="v-dep-v">Banco Estado</span></div>
        <div class="v-dep-row"><span class="v-dep-k">Tipo de cuenta</span><span class="v-dep-v">Cuenta Corriente</span></div>
        <div class="v-dep-row"><span class="v-dep-k">N° de cuenta</span><span class="v-dep-v acc">87000004888</span></div>
      </div>
      <div class="v-totals">
        <div class="v-tot-row"><span class="k">Subtotal neto</span><span class="v">${formatCLP(totalNeto)}</span></div>
        <div class="v-tot-row"><span class="k">IVA (19%)</span><span class="v">${formatCLP(totalIVAcalc)}</span></div>
        <div class="v-tot-grand"><span class="k">Total</span><span class="v">${formatCLP(totalBruto)}</span></div>
      </div>
    </div>

    <div class="v-foot">
      <div class="v-foot-l">
        Hostal &amp; Restaurant Monchito · Aguada de Dolores 1, Puerto Cisnes, Región de Aysén<br />
        hostalmonchito2023@gmail.com · +56 9 6224 9178
      </div>
      <div class="v-foot-r">
        <b>Emitido el</b><br />${fechaEmision}
      </div>
    </div>

    <div class="v-rule-bottom"></div>

  </div>`;
}

// ─── Componente principal ──────────────────────────────────────────────────
export default function DetalleServicios() {
  const [nombreCliente, setNombreCliente] = useState("");
  const [servicios, setServicios] = useState<ServicioRow[]>([]);
  const [clientes, setClientes] = useState<ClienteDB[]>([]);
  const [clienteId, setClienteId] = useState<number | null>(null);
  const [nextId, setNextId] = useState(2);
  const [cargando, setCargando] = useState(false);
  const [cargandoPDF, setCargandoPDF] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const filaInicial: ServicioRow = {
    id: 1,
    fecha: new Date().toISOString().split("T")[0],
    almuerzo: 0,
    cena: 0,
    alojamiento: 0,
  };

  // ── Cargar lista de clientes ──
  const cargarClientes = async () => {
    try {
      const res = await fetch("/api/servicios");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setClientes(data || []);
    } catch (error) {
      console.error("Error al cargar clientes:", (error as Error).message);
    }
  };

  useEffect(() => {
    cargarClientes();
    setServicios([filaInicial]);
  }, []);

  // ── CRUD filas ──
  const agregarFila = () => {
    setServicios((prev) => [
      ...prev,
      { id: nextId, fecha: new Date().toISOString().split("T")[0], almuerzo: 0, cena: 0, alojamiento: 0 },
    ]);
    setNextId((n) => n + 1);
  };

  const eliminarFila = (id: number) => {
    if (servicios.length === 1) return alert("Debe haber al menos una fila.");
    setServicios((prev) => prev.filter((s) => s.id !== id));
  };

  const actualizarServicio = (id: number, campo: keyof ServicioRow, valor: any) =>
    setServicios((prev) => prev.map((s) => (s.id === id ? { ...s, [campo]: valor } : s)));

  // ── Totales ──
  const totalNeto = servicios.reduce((a, s) => a + calcSubtotal(s), 0);
  const totalIVAcalc = totalNeto * IVA;
  const totalBruto = totalNeto + totalIVAcalc;

  // ── Guardar ──
  const guardarCliente = async () => {
    if (!nombreCliente.trim()) return alert("Ingrese el nombre del cliente.");
    setCargando(true);
    const payload = { id: clienteId, nombre_cliente: nombreCliente.trim(), servicios };
    const res = await fetch("/api/servicios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await res.json();
    setCargando(false);
    if (!res.ok) return alert("Error al guardar: " + result.error);
    alert("Datos guardados correctamente.");
    setClienteId(null);
    cargarClientes();
  };

  // ── Buscar ──
  const cargarCliente = async () => {
    if (!nombreCliente.trim()) return alert("Ingrese el nombre del cliente.");
    setCargando(true);
    const res = await fetch("/api/servicios");
    const todos: ClienteDB[] = await res.json();
    setCargando(false);
    if (!res.ok) return alert("Error al buscar: " + (todos as any).error);
    const data = todos.find((c) => c.nombre_cliente === nombreCliente.trim());
    if (!data) return alert("Cliente no encontrado.");
    setClienteId(data.id);
    setServicios(data.servicios);
    setNextId(Math.max(...data.servicios.map((s: ServicioRow) => s.id), 0) + 1);
  };

  // ── Eliminar ──
  const eliminarCliente = async (id?: number) => {
    const nombre = id
      ? clientes.find((c) => c.id === id)?.nombre_cliente
      : nombreCliente.trim();
    if (!nombre) return alert("Ingrese o seleccione un cliente.");
    if (!confirm(`¿Eliminar el registro de "${nombre}"?`)) return;
    setCargando(true);
    const res = await fetch("/api/servicios", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre_cliente: nombre }),
    });
    const result = await res.json();
    setCargando(false);
    if (!res.ok) return alert("Error al eliminar: " + result.error);
    alert("Registro eliminado correctamente.");
    setNombreCliente("");
    setClienteId(null);
    setServicios([filaInicial]);
    cargarClientes();
  };

  // ── Editar (abre modal) ──
  const editarCliente = (cliente: ClienteDB) => {
    setClienteId(cliente.id);
    setNombreCliente(cliente.nombre_cliente);
    setServicios(cliente.servicios);
    setNextId(Math.max(...cliente.servicios.map((s) => s.id), 0) + 1);
    setModalOpen(true);
  };

  // ── Cerrar modal y limpiar ──
  const cerrarModal = () => {
    setModalOpen(false);
    setClienteId(null);
    setNombreCliente("");
    setServicios([filaInicial]);
  };

  // ── Tabla reutilizable ──
  const TablaServicios = () => (
    <div className="overflow-x-auto rounded-md border">
      <Table className="min-w-[700px] text-sm">
        <TableCaption>Detalle de servicios entregados · IVA 19%</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Fecha</TableHead>
            <TableHead className="text-center">Almuerzos</TableHead>
            <TableHead className="text-center">Cenas</TableHead>
            <TableHead className="text-center">Alojamientos</TableHead>
            <TableHead className="text-right">Subtotal</TableHead>
            <TableHead className="text-right">Total + IVA</TableHead>
            <TableHead className="text-center">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {servicios.map((s) => (
            <TableRow key={s.id}>
              <TableCell>
                <Input
                  type="date"
                  value={s.fecha}
                  onChange={(e) => actualizarServicio(s.id, "fecha", e.target.value)}
                  className="text-sm"
                />
              </TableCell>
              {(["almuerzo", "cena", "alojamiento"] as const).map((campo) => (
                <TableCell key={campo} className="text-center">
                  <Input
                    type="number"
                    min={0}
                    value={s[campo]}
                    onChange={(e) =>
                      actualizarServicio(s.id, campo, parseInt(e.target.value) || 0)
                    }
                    className="w-20 mx-auto text-center"
                  />
                </TableCell>
              ))}
              <TableCell className="text-right">{formatCLP(calcSubtotal(s))}</TableCell>
              <TableCell className="text-right font-semibold">{formatCLP(calcTotalIVA(s))}</TableCell>
              <TableCell className="text-center">
                <Button size="sm" variant="destructive" onClick={() => eliminarFila(s.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={5} />
            <TableCell colSpan={2} className="p-0">
              <div className="space-y-1 p-3">
                <div className="flex justify-between text-xs sm:text-sm">
                  <span>Subtotal Neto:</span>
                  <span>{formatCLP(totalNeto)}</span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm">
                  <span>IVA (19%):</span>
                  <span>{formatCLP(totalIVAcalc)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold border-t pt-1">
                  <span>TOTAL:</span>
                  <span className="text-primary">{formatCLP(totalBruto)}</span>
                </div>
              </div>
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );

  return (
    <>
      <Card className="w-full max-w-7xl mx-auto p-2 sm:p-4 lg:p-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl flex-wrap">
            <Receipt className="h-6 w-6 shrink-0" />
            Detalle de Servicios de Hospedaje
          </CardTitle>
          <CardDescription className="text-sm">
            Almuerzo {formatCLP(PRECIO_ALMUERZO)} · Cena {formatCLP(PRECIO_CENA)} · Alojamiento {formatCLP(PRECIO_ALOJAMIENTO)} · IVA 19%
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* ── Controles principales ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-2">
              <Label htmlFor="nombreCliente">Nombre del Cliente</Label>
              <Input
                id="nombreCliente"
                placeholder="Ingrese el nombre del cliente"
                value={nombreCliente}
                onChange={(e) => setNombreCliente(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && cargarCliente()}
              />
            </div>
            <div className="flex gap-2 flex-wrap justify-between sm:justify-end items-end">
              <Button onClick={guardarCliente} disabled={cargando} className="flex-1 sm:flex-none gap-1">
                <Save className="h-4 w-4" /> Guardar
              </Button>
              <Button variant="secondary" onClick={cargarCliente} disabled={cargando} className="flex-1 sm:flex-none gap-1">
                <Search className="h-4 w-4" /> Buscar
              </Button>
              <Button variant="destructive" onClick={() => eliminarCliente()} disabled={cargando} className="flex-1 sm:flex-none gap-1">
                <XCircle className="h-4 w-4" /> Eliminar
              </Button>
            </div>
          </div>

          {/* ── Tabla ── */}
          <TablaServicios />

          {/* ── Acciones inferiores ── */}
          <div className="flex flex-wrap gap-2">
            <Button onClick={agregarFila} variant="outline" className="gap-1 flex-1 sm:flex-none justify-center">
              <Plus className="h-4 w-4" /> Agregar Fila
            </Button>
            <Button
              onClick={() => {
                if (!nombreCliente.trim()) return alert("Ingrese el nombre del cliente antes de imprimir.");
                imprimirVoucher(nombreCliente, servicios);
              }}
              variant="secondary"
              className="gap-1 flex-1 sm:flex-none justify-center"
            >
              <Printer className="h-4 w-4" /> Imprimir Voucher
            </Button>
            <Button
              onClick={() => {
                if (!nombreCliente.trim()) return alert("Ingrese el nombre del cliente antes de compartir.");
                compartirPDFWhatsApp(nombreCliente, servicios, setCargandoPDF);
              }}
              disabled={cargandoPDF}
              className="gap-1 flex-1 sm:flex-none justify-center bg-[#25D366] hover:bg-[#1ebe5d] text-white disabled:opacity-60"
            >
              <WhatsAppIcon className="h-4 w-4" />
              {cargandoPDF ? "Generando PDF…" : "Compartir por WhatsApp"}
            </Button>
          </div>

          {/* ── Lista de clientes guardados ── */}
          <div className="mt-6 overflow-x-auto rounded-md border">
            <h3 className="text-base font-semibold p-3 border-b">Clientes guardados</h3>
            <Table className="min-w-[600px] text-sm">
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Fecha de creación</TableHead>
                  <TableHead className="text-center">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-6">
                      No hay clientes guardados
                    </TableCell>
                  </TableRow>
                ) : (
                  clientes.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>
                        <button
                          onClick={() => editarCliente(c)}
                          className="text-blue-600 hover:underline text-left"
                        >
                          {c.nombre_cliente}
                        </button>
                      </TableCell>
                      <TableCell>
                        {new Date(c.created_at).toLocaleString("es-CL")}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex gap-2 justify-center flex-wrap">
                          <Button size="sm" variant="secondary" onClick={() => editarCliente(c)} className="gap-1">
                            <Pencil className="h-4 w-4" /> Editar
                          </Button>
                          <Button size="sm" variant="outline" className="gap-1"
                            onClick={() => imprimirVoucher(c.nombre_cliente, c.servicios)}
                          >
                            <Printer className="h-4 w-4" /> Voucher
                          </Button>
                          <Button
                            size="sm"
                            disabled={cargandoPDF}
                            className="gap-1 bg-[#25D366] hover:bg-[#1ebe5d] text-white disabled:opacity-60"
                            onClick={() => compartirPDFWhatsApp(c.nombre_cliente, c.servicios, setCargandoPDF)}
                          >
                            <WhatsAppIcon className="h-4 w-4" />
                            {cargandoPDF ? "…" : "WhatsApp"}
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => eliminarCliente(c.id)} className="gap-1">
                            <Trash2 className="h-4 w-4" /> Eliminar
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ── Modal de edición ── */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background w-full max-w-5xl rounded-lg shadow-xl border">
            {/* Encabezado modal */}
            <div className="flex justify-between items-center p-4 border-b">
              <div>
                <h2 className="text-base font-semibold">Editando: {nombreCliente}</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Total: {formatCLP(totalBruto)} (IVA incluido)
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={cerrarModal}>
                <XCircle className="h-5 w-5" />
              </Button>
            </div>

            {/* Tabla en modal */}
            <div className="p-4 overflow-x-auto max-h-[60vh] overflow-y-auto">
              <TablaServicios />
            </div>

            {/* Acciones modal */}
            <div className="flex justify-between flex-wrap gap-2 p-4 border-t bg-muted/30 rounded-b-lg">
              <div className="flex gap-2">
                <Button variant="outline" onClick={agregarFila} className="gap-1">
                  <Plus className="h-4 w-4" /> Agregar día
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => imprimirVoucher(nombreCliente, servicios)}
                  className="gap-1"
                >
                  <Printer className="h-4 w-4" /> Voucher
                </Button>
                <Button
                  onClick={() => compartirPDFWhatsApp(nombreCliente, servicios, setCargandoPDF)}
                  disabled={cargandoPDF}
                  className="gap-1 bg-[#25D366] hover:bg-[#1ebe5d] text-white disabled:opacity-60"
                >
                  <WhatsAppIcon className="h-4 w-4" />
                  {cargandoPDF ? "Generando…" : "WhatsApp"}
                </Button>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={cerrarModal}>Cancelar</Button>
                <Button onClick={async () => { await guardarCliente(); setModalOpen(false); }} disabled={cargando} className="gap-1">
                  <Save className="h-4 w-4" /> Guardar cambios
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
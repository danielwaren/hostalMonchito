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

  const filasServicios = servicios
    .filter((s) => calcSubtotal(s) > 0)
    .map(
      (s) => `
      <tr>
        <td class="fecha">${new Date(s.fecha + "T12:00:00").toLocaleDateString("es-CL", {
          day: "2-digit", month: "short", year: "numeric",
        })}</td>
        <td class="centro">${s.almuerzo > 0 ? s.almuerzo : "—"}</td>
        <td class="centro">${s.cena > 0 ? s.cena : "—"}</td>
        <td class="centro">${s.alojamiento > 0 ? s.alojamiento : "—"}</td>
        <td class="monto">${formatCLP(calcSubtotal(s))}</td>
        <td class="monto bold">${formatCLP(calcTotalIVA(s))}</td>
      </tr>`
    )
    .join("");

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Voucher – ${cliente} – Hostal Monchito</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Source+Sans+3:wght@300;400;500;600&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Source Sans 3', sans-serif;
      font-size: 12px;
      color: #1a1a1a;
      background: #edeae3;
      padding: 40px 0;
    }

    .page {
      width: 780px;
      margin: 0 auto;
      background: #fff;
      border: 1px solid #cec6b0;
      border-radius: 3px;
      overflow: hidden;
      box-shadow: 0 6px 32px rgba(0,0,0,0.10);
    }

    /* ══ HEADER ══════════════════════════════════════════════════════════ */
    .header {
      background: #f5f0e8;
      padding: 0;
      position: relative;
      overflow: hidden;
    }

    /* línea ornamental superior */
    .header-ornament-top {
      height: 3px;
      background: repeating-linear-gradient(
        90deg,
        #7a6340 0px, #7a6340 6px,
        transparent 6px, transparent 10px,
        #9a8f78 10px, #9a8f78 16px,
        transparent 16px, transparent 20px
      );
    }

    .header-body {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 26px 40px 22px;
    }

    .brand-block { flex: 1; }

    .brand-eyebrow {
      font-size: 9px;
      letter-spacing: 3px;
      text-transform: uppercase;
      color: #7a6340;
      margin-bottom: 6px;
    }

    .brand-name {
      font-family: 'Playfair Display', serif;
      font-size: 28px;
      font-weight: 700;
      color: #2c2416;
      line-height: 1.1;
      letter-spacing: 0.3px;
    }

    .brand-name em {
      font-style: italic;
      color: #7a6340;
    }

    .brand-tagline {
      font-size: 10px;
      color: #9a8f78;
      margin-top: 5px;
      letter-spacing: 1.5px;
      text-transform: uppercase;
    }

    /* separador vertical */
    .header-divider {
      width: 1px;
      height: 64px;
      background: linear-gradient(to bottom, transparent, #b0a090, transparent);
      margin: 0 32px;
    }

    .contact-block {
      text-align: right;
      flex-shrink: 0;
    }

    .contact-line {
      font-size: 11px;
      color: #b0a090;
      line-height: 1.9;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 6px;
    }

    .contact-line .dot {
      width: 3px;
      height: 3px;
      border-radius: 50%;
      background: #7a6340;
      display: inline-block;
      flex-shrink: 0;
    }

    .contact-line a { color: #b0a090; text-decoration: none; }

    /* línea ornamental inferior */
    .header-ornament-bottom {
      height: 2px;
      background: linear-gradient(90deg, transparent 0%, #7a6340 30%, #9a8f78 60%, transparent 100%);
    }

    /* ══ DOC TITLE BAND ══════════════════════════════════════════════════ */
    .doc-band {
      background: #f7f4ee;
      border-bottom: 1px solid #ddd6c5;
      padding: 14px 40px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .doc-title {
      font-family: 'Playfair Display', serif;
      font-size: 15px;
      font-weight: 600;
      color: #162318;
      letter-spacing: 0.5px;
    }

    .doc-date-block { text-align: right; }

    .doc-date-label {
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: #9a8f78;
    }

    .doc-date-value {
      font-size: 13px;
      font-weight: 600;
      color: #162318;
      margin-top: 2px;
    }

    /* ══ CLIENTE ══════════════════════════════════════════════════════════ */
    .client-section {
      padding: 18px 40px;
      background: #fff;
      border-bottom: 1px solid #ede8df;
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .client-avatar {
      width: 42px;
      height: 42px;
      border-radius: 50%;
      background: #f0ebe0;
      border: 1.5px solid #9a8f78;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Playfair Display', serif;
      font-size: 16px;
      color: #2c2416;
      flex-shrink: 0;
      font-weight: 600;
    }

    .client-info { flex: 1; }

    .client-label {
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: #9a8f78;
      margin-bottom: 3px;
    }

    .client-name {
      font-family: 'Playfair Display', serif;
      font-size: 18px;
      font-weight: 600;
      color: #162318;
    }

    /* ══ TABLA ══════════════════════════════════════════════════════════ */
    .table-section { padding: 22px 40px; }

    .section-title {
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: #9a8f78;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid #ede8df;
    }

    table { width: 100%; border-collapse: collapse; }

    thead th {
      background: #f5f0e8;
      color: #7a6340;
      font-size: 9px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
      padding: 9px 12px;
      text-align: left;
    }
    thead th.centro { text-align: center; }
    thead th.monto  { text-align: right; }

    tbody tr { border-bottom: 1px solid #ede8df; }
    tbody tr:last-child { border-bottom: none; }
    tbody tr:nth-child(even) { background: #faf8f4; }

    td {
      padding: 9px 12px;
      color: #2a2a2a;
      vertical-align: middle;
      font-size: 12px;
    }
    td.centro { text-align: center; }
    td.monto  { text-align: right; font-variant-numeric: tabular-nums; }
    td.bold   { font-weight: 600; color: #162318; }

    /* ══ RESUMEN ══════════════════════════════════════════════════════════ */
    .summary-section { padding: 0 40px 22px; }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
    }

    .summary-card {
      background: #f7f4ee;
      border: 1px solid #ddd6c5;
      border-top: 3px solid #9a8f78;
      border-radius: 3px;
      padding: 12px 14px;
      text-align: center;
    }

    .s-icon  { font-size: 18px; margin-bottom: 5px; }
    .s-label {
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 1.2px;
      color: #7a6f5a;
    }
    .s-qty {
      font-family: 'Playfair Display', serif;
      font-size: 24px;
      font-weight: 700;
      color: #162318;
      line-height: 1.2;
    }
    .s-precio { font-size: 10px; color: #9a8f78; margin-top: 2px; }

    /* ══ TOTALES + DEPÓSITO ══════════════════════════════════════════════ */
    .bottom-section {
      padding: 0 40px 24px;
      display: grid;
      grid-template-columns: 1fr 240px;
      gap: 20px;
      align-items: start;
    }

    /* caja depósito */
    .deposit-box {
      background: #f7f4ee;
      border: 1px solid #ddd6c5;
      border-left: 3px solid #7a6340;
      border-radius: 3px;
      padding: 14px 16px;
    }

    .deposit-title {
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: #9a8f78;
      margin-bottom: 10px;
      padding-bottom: 6px;
      border-bottom: 1px solid #ddd6c5;
    }

    .deposit-row {
      display: flex;
      justify-content: space-between;
      gap: 8px;
      margin-bottom: 5px;
      font-size: 11px;
      line-height: 1.5;
    }

    .deposit-row:last-child { margin-bottom: 0; }

    .deposit-key {
      color: #9a8f78;
      white-space: nowrap;
      flex-shrink: 0;
    }

    .deposit-val {
      color: #162318;
      font-weight: 500;
      text-align: right;
    }

    .deposit-val.accent { color: #7a6340; font-weight: 600; }

    /* caja totales */
    .totals-box {
      border: 1px solid #ddd6c5;
      border-radius: 3px;
      overflow: hidden;
    }

    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 14px;
      font-size: 12px;
      border-bottom: 1px solid #ede8df;
    }

    .totals-row:last-child { border-bottom: none; }
    .totals-row .label { color: #7a6f5a; }
    .totals-row .value { font-variant-numeric: tabular-nums; font-weight: 500; }

    .totals-row.grand {
      background: #f5f0e8;
      font-size: 13px;
      font-weight: 700;
      border-top: 2px solid #7a6340;
    }

    .totals-row.grand .label { color: #9a8f78; }
    .totals-row.grand .value { color: #7a6340; }

    /* ══ FOOTER ══════════════════════════════════════════════════════════ */
    .footer {
      background: #f5f0e8;
      position: relative;
      overflow: hidden;
    }

    .footer-ornament {
      height: 2px;
      background: linear-gradient(90deg, transparent 0%, #7a6340 30%, #9a8f78 60%, transparent 100%);
    }

    .footer-body {
      padding: 16px 40px 14px;
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      align-items: center;
      gap: 24px;
    }

    .footer-contact {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .footer-contact-line {
      font-size: 10px;
      color: #9a8f78;
      display: flex;
      align-items: center;
      gap: 5px;
    }

    .footer-contact-line .fc-icon {
      color: #7a6340;
      font-size: 11px;
    }

    .footer-center {
      text-align: center;
    }

    .footer-brand {
      font-family: 'Playfair Display', serif;
      font-size: 13px;
      color: #7a6340;
      letter-spacing: 0.5px;
    }

    .footer-note {
      font-size: 9px;
      color: #b0a090;
      margin-top: 3px;
      letter-spacing: 0.5px;
    }

    .footer-right {
      text-align: right;
    }

    .footer-date-label {
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: #b0a090;
      margin-bottom: 2px;
    }

    .footer-date-value {
      font-size: 11px;
      color: #9a8f78;
    }

    .footer-ornament-bottom {
      height: 3px;
      background: repeating-linear-gradient(
        90deg,
        #7a6340 0px, #7a6340 6px,
        transparent 6px, transparent 10px,
        #9a8f78 10px, #9a8f78 16px,
        transparent 16px, transparent 20px
      );
    }

    @media print {
      body { background: #fff; padding: 0; }
      .page { width: 100%; box-shadow: none; border: none; border-radius: 0; }
    }
  </style>
</head>
<body>
  <div class="page">

    <!-- ══ HEADER ══ -->
    <div class="header">
      <div class="header-ornament-top"></div>
      <div class="header-body">
        <div class="brand-block">
          <div class="brand-eyebrow">Establecimientos Turísticos</div>
          <div class="brand-name">Hostal &amp; Restaurant <em>Monchito</em></div>
          <div class="brand-tagline">Alimentos · Alojamiento · Confort</div>
        </div>
        <div class="header-divider"></div>
        <div class="contact-block">
          <div class="contact-line">
            <span class="dot"></span>
            Aguada de Dolores 1, Puerto Cisnes
          </div>
          <div class="contact-line">
            <span class="dot"></span>
            hostalmonchito2023@gmail.com
          </div>
          <div class="contact-line">
            <span class="dot"></span>
            +56 9 6224 9178
          </div>
        </div>
      </div>
      <div class="header-ornament-bottom"></div>
    </div>

    <!-- ══ BANDA TÍTULO DOC ══ -->
    <div class="doc-band">
      <div class="doc-title">Detalle de Servicios Prestados</div>
      <div class="doc-date-block">
        <div class="doc-date-label">Fecha de emisión</div>
        <div class="doc-date-value">${fechaEmision}</div>
      </div>
    </div>

    <!-- ══ CLIENTE ══ -->
    <div class="client-section">
      <div class="client-avatar">${cliente.charAt(0).toUpperCase()}</div>
      <div class="client-info">
        <div class="client-label">Cliente</div>
        <div class="client-name">${cliente}</div>
      </div>
    </div>

    <!-- ══ TABLA ══ -->
    <div class="table-section">
      <div class="section-title">Detalle de consumos por fecha</div>
      <table>
        <thead>
          <tr>
            <th>Fecha</th>
            <th class="centro">Almuerzos</th>
            <th class="centro">Cenas</th>
            <th class="centro">Alojamientos</th>
            <th class="monto">Neto</th>
            <th class="monto">Total c/IVA</th>
          </tr>
        </thead>
        <tbody>
          ${filasServicios || `<tr><td colspan="6" style="text-align:center;color:#9a8f7a;padding:20px">Sin servicios registrados</td></tr>`}
        </tbody>
      </table>
    </div>

    <!-- ══ RESUMEN CONCEPTOS ══ -->
    <div class="summary-section">
      <div class="section-title">Resumen por concepto</div>
      <div class="summary-grid">
        <div class="summary-card">
          <div class="s-icon">🍽️</div>
          <div class="s-label">Almuerzos</div>
          <div class="s-qty">${servicios.reduce((a, s) => a + s.almuerzo, 0)}</div>
          <div class="s-precio">${formatCLP(PRECIO_ALMUERZO)} c/u</div>
        </div>
        <div class="summary-card">
          <div class="s-icon">🌙</div>
          <div class="s-label">Cenas</div>
          <div class="s-qty">${servicios.reduce((a, s) => a + s.cena, 0)}</div>
          <div class="s-precio">${formatCLP(PRECIO_CENA)} c/u</div>
        </div>
        <div class="summary-card">
          <div class="s-icon">🛏️</div>
          <div class="s-label">Alojamientos</div>
          <div class="s-qty">${servicios.reduce((a, s) => a + s.alojamiento, 0)}</div>
          <div class="s-precio">${formatCLP(PRECIO_ALOJAMIENTO)} c/u</div>
        </div>
      </div>
    </div>

    <!-- ══ TOTALES + DEPÓSITO ══ -->
    <div class="bottom-section">
      <div class="deposit-box">
        <div class="deposit-title">Datos para transferencia / depósito</div>
        <div class="deposit-row">
          <span class="deposit-key">Titular</span>
          <span class="deposit-val">Blanca Bertila Díaz Barría</span>
        </div>
        <div class="deposit-row">
          <span class="deposit-key">RUT</span>
          <span class="deposit-val">6.768.074-K</span>
        </div>
        <div class="deposit-row">
          <span class="deposit-key">Banco</span>
          <span class="deposit-val">Banco Estado</span>
        </div>
        <div class="deposit-row">
          <span class="deposit-key">Tipo de cuenta</span>
          <span class="deposit-val">Cuenta Corriente</span>
        </div>
        <div class="deposit-row">
          <span class="deposit-key">N° de cuenta</span>
          <span class="deposit-val accent">87000004888</span>
        </div>
      </div>

      <div class="totals-box">
        <div class="totals-row">
          <span class="label">Subtotal neto</span>
          <span class="value">${formatCLP(totalNeto)}</span>
        </div>
        <div class="totals-row">
          <span class="label">IVA (19%)</span>
          <span class="value">${formatCLP(totalIVAcalc)}</span>
        </div>
        <div class="totals-row grand">
          <span class="label">TOTAL</span>
          <span class="value">${formatCLP(totalBruto)}</span>
        </div>
      </div>
    </div>

    <!-- ══ FOOTER ══ -->
    <div class="footer">
      <div class="footer-ornament"></div>
      <div class="footer-body">
        <div class="footer-contact">
          <div class="footer-contact-line">
            <span class="fc-icon">📍</span>
            Aguada de Dolores 1, Puerto Cisnes
          </div>
          <div class="footer-contact-line">
            <span class="fc-icon">✉</span>
            hostalmonchito2023@gmail.com
          </div>
          <div class="footer-contact-line">
            <span class="fc-icon">📞</span>
            +56 9 6224 9178
          </div>
        </div>
        <div class="footer-center">
          <div class="footer-brand">Hostal &amp; Restaurant Monchito</div>
          <div class="footer-note">Gracias por su preferencia</div>
        </div>
        <div class="footer-right">
          <div class="footer-date-label">Emitido el</div>
          <div class="footer-date-value">${fechaEmision}</div>
        </div>
      </div>
      <div class="footer-ornament-bottom"></div>
    </div>

  </div>
  <script>window.onload = () => window.print();</script>
</body>
</html>`;

  const ventana = window.open("", "_blank", "width=900,height=700");
  if (ventana) {
    ventana.document.write(html);
    ventana.document.close();
  }
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

    const filasServicios = servicios
      .filter((s) => calcSubtotal(s) > 0)
      .map((s) => `
        <tr>
          <td class="fecha">${new Date(s.fecha + "T12:00:00").toLocaleDateString("es-CL", {
            day: "2-digit", month: "short", year: "numeric",
          })}</td>
          <td class="centro">${s.almuerzo > 0 ? s.almuerzo : "—"}</td>
          <td class="centro">${s.cena > 0 ? s.cena : "—"}</td>
          <td class="centro">${s.alojamiento > 0 ? s.alojamiento : "—"}</td>
          <td class="monto">${formatCLP(calcSubtotal(s))}</td>
          <td class="monto bold">${formatCLP(calcTotalIVA(s))}</td>
        </tr>`)
      .join("");

    const voucherHTML = generarHTMLVoucher(
      cliente, servicios, filasServicios, fechaEmision,
      totalNeto, totalIVAcalc, totalBruto
    );

    // Renderizar el voucher en un div oculto
    const contenedor = document.createElement("div");
    contenedor.style.cssText =
      "position:fixed;left:-9999px;top:0;width:780px;background:#fff;z-index:-1;";
    contenedor.innerHTML = voucherHTML;
    document.body.appendChild(contenedor);

    await document.fonts.ready;
    await new Promise((r) => setTimeout(r, 600));

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

    // Móvil: Web Share API con imagen (funciona en Android e iOS)
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [imageFile] })) {
      await navigator.share({
        title: `Voucher Hostal Monchito – ${cliente}`,
        text: `Voucher de servicios para ${cliente} · ${fechaEmision}`,
        files: [imageFile],
      });
      return;
    }

    // Desktop: descargar imagen y abrir WhatsApp Web en el navegador
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = nombreArchivo;
    a.click();
    URL.revokeObjectURL(url);

    window.open("https://web.whatsapp.com/", "_blank", "noopener,noreferrer");
  } catch (err: any) {
    // El usuario canceló el diálogo de compartir — no es un error real
    if (err?.name === "AbortError") return;
    console.error("Error al generar imagen:", err);
    alert("Ocurrió un error al generar el voucher. Intente de nuevo.");
  } finally {
    setCargandoPDF(false);
  }
}

// ─── HTML del voucher (extraído para reutilizar entre imprimir y PDF) ───────
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
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Source+Sans+3:wght@300;400;500;600&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body, div { font-family: 'Source Sans 3', sans-serif; font-size: 12px; color: #1a1a1a; }
    .page { width: 780px; background: #fff; }
    .header { background: #f5f0e8; padding: 0; }
    .header-ornament-top { height: 3px; background: repeating-linear-gradient(90deg,#7a6340 0px,#7a6340 6px,transparent 6px,transparent 10px,#9a8f78 10px,#9a8f78 16px,transparent 16px,transparent 20px); }
    .header-body { display: flex; justify-content: space-between; align-items: center; padding: 26px 40px 22px; }
    .brand-eyebrow { font-size: 9px; letter-spacing: 3px; text-transform: uppercase; color: #7a6340; margin-bottom: 6px; }
    .brand-name { font-family: 'Playfair Display', serif; font-size: 28px; font-weight: 700; color: #2c2416; line-height: 1.1; }
    .brand-name em { font-style: italic; color: #7a6340; }
    .brand-tagline { font-size: 10px; color: #9a8f78; margin-top: 5px; letter-spacing: 1.5px; text-transform: uppercase; }
    .header-divider { width: 1px; height: 64px; background: linear-gradient(to bottom, transparent, #b0a090, transparent); margin: 0 32px; }
    .contact-block { text-align: right; }
    .contact-line { font-size: 11px; color: #b0a090; line-height: 1.9; display: flex; align-items: center; justify-content: flex-end; gap: 6px; }
    .dot { width: 3px; height: 3px; border-radius: 50%; background: #7a6340; display: inline-block; }
    .header-ornament-bottom { height: 2px; background: linear-gradient(90deg, transparent 0%, #7a6340 30%, #9a8f78 60%, transparent 100%); }
    .doc-band { background: #f7f4ee; border-bottom: 1px solid #ddd6c5; padding: 14px 40px; display: flex; justify-content: space-between; align-items: center; }
    .doc-title { font-family: 'Playfair Display', serif; font-size: 15px; font-weight: 600; color: #162318; }
    .doc-date-label { font-size: 9px; text-transform: uppercase; letter-spacing: 1.5px; color: #9a8f78; }
    .doc-date-value { font-size: 13px; font-weight: 600; color: #162318; margin-top: 2px; }
    .client-section { padding: 18px 40px; background: #fff; border-bottom: 1px solid #ede8df; display: flex; align-items: center; gap: 16px; }
    .client-avatar { width: 42px; height: 42px; border-radius: 50%; background: #f0ebe0; border: 1.5px solid #9a8f78; display: flex; align-items: center; justify-content: center; font-family: 'Playfair Display', serif; font-size: 16px; color: #2c2416; font-weight: 600; flex-shrink: 0; }
    .client-label { font-size: 9px; text-transform: uppercase; letter-spacing: 1.5px; color: #9a8f78; margin-bottom: 3px; }
    .client-name { font-family: 'Playfair Display', serif; font-size: 18px; font-weight: 600; color: #162318; }
    .table-section { padding: 22px 40px; }
    .section-title { font-size: 9px; text-transform: uppercase; letter-spacing: 2px; color: #9a8f78; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #ede8df; }
    table { width: 100%; border-collapse: collapse; }
    thead th { background: #f5f0e8; color: #7a6340; font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; padding: 9px 12px; text-align: left; }
    thead th.centro { text-align: center; }
    thead th.monto { text-align: right; }
    tbody tr { border-bottom: 1px solid #ede8df; }
    tbody tr:nth-child(even) { background: #faf8f4; }
    td { padding: 9px 12px; color: #2a2a2a; vertical-align: middle; font-size: 12px; }
    td.centro { text-align: center; }
    td.monto { text-align: right; }
    td.bold { font-weight: 600; color: #162318; }
    .summary-section { padding: 0 40px 22px; }
    .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
    .summary-card { background: #f7f4ee; border: 1px solid #ddd6c5; border-top: 3px solid #9a8f78; border-radius: 3px; padding: 12px 14px; text-align: center; }
    .s-icon { font-size: 18px; margin-bottom: 5px; }
    .s-label { font-size: 9px; text-transform: uppercase; letter-spacing: 1.2px; color: #7a6f5a; }
    .s-qty { font-family: 'Playfair Display', serif; font-size: 24px; font-weight: 700; color: #162318; line-height: 1.2; }
    .s-precio { font-size: 10px; color: #9a8f78; margin-top: 2px; }
    .bottom-section { padding: 0 40px 24px; display: grid; grid-template-columns: 1fr 240px; gap: 20px; align-items: start; }
    .deposit-box { background: #f7f4ee; border: 1px solid #ddd6c5; border-left: 3px solid #7a6340; border-radius: 3px; padding: 14px 16px; }
    .deposit-title { font-size: 9px; text-transform: uppercase; letter-spacing: 1.5px; color: #9a8f78; margin-bottom: 10px; padding-bottom: 6px; border-bottom: 1px solid #ddd6c5; }
    .deposit-row { display: flex; justify-content: space-between; gap: 8px; margin-bottom: 5px; font-size: 11px; line-height: 1.5; }
    .deposit-key { color: #9a8f78; white-space: nowrap; }
    .deposit-val { color: #162318; font-weight: 500; text-align: right; }
    .deposit-val.accent { color: #7a6340; font-weight: 600; }
    .totals-box { border: 1px solid #ddd6c5; border-radius: 3px; overflow: hidden; }
    .totals-row { display: flex; justify-content: space-between; padding: 8px 14px; font-size: 12px; border-bottom: 1px solid #ede8df; }
    .totals-row .label { color: #7a6f5a; }
    .totals-row .value { font-weight: 500; }
    .totals-row.grand { background: #f5f0e8; font-size: 13px; font-weight: 700; border-top: 2px solid #7a6340; }
    .totals-row.grand .label { color: #9a8f78; }
    .totals-row.grand .value { color: #7a6340; }
    .footer { background: #f5f0e8; }
    .footer-ornament { height: 2px; background: linear-gradient(90deg, transparent 0%, #7a6340 30%, #9a8f78 60%, transparent 100%); }
    .footer-body { padding: 16px 40px 14px; display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 24px; }
    .footer-contact { display: flex; flex-direction: column; gap: 3px; }
    .footer-contact-line { font-size: 10px; color: #9a8f78; display: flex; align-items: center; gap: 5px; }
    .fc-icon { color: #7a6340; font-size: 11px; }
    .footer-center { text-align: center; }
    .footer-brand { font-family: 'Playfair Display', serif; font-size: 13px; color: #7a6340; }
    .footer-note { font-size: 9px; color: #b0a090; margin-top: 3px; }
    .footer-right { text-align: right; }
    .footer-date-label { font-size: 9px; text-transform: uppercase; letter-spacing: 1.5px; color: #b0a090; margin-bottom: 2px; }
    .footer-date-value { font-size: 11px; color: #9a8f78; }
    .footer-ornament-bottom { height: 3px; background: repeating-linear-gradient(90deg,#7a6340 0px,#7a6340 6px,transparent 6px,transparent 10px,#9a8f78 10px,#9a8f78 16px,transparent 16px,transparent 20px); }
  </style>
  <div class="page">
    <div class="header">
      <div class="header-ornament-top"></div>
      <div class="header-body">
        <div class="brand-block">
          <div class="brand-eyebrow">Establecimientos Turísticos</div>
          <div class="brand-name">Hostal &amp; Restaurant <em>Monchito</em></div>
          <div class="brand-tagline">Alimentos · Alojamiento · Confort</div>
        </div>
        <div class="header-divider"></div>
        <div class="contact-block">
          <div class="contact-line"><span class="dot"></span> Aguada de Dolores 1, Puerto Cisnes</div>
          <div class="contact-line"><span class="dot"></span> hostalmonchito2023@gmail.com</div>
          <div class="contact-line"><span class="dot"></span> +56 9 6224 9178</div>
        </div>
      </div>
      <div class="header-ornament-bottom"></div>
    </div>
    <div class="doc-band">
      <div class="doc-title">Detalle de Servicios Prestados</div>
      <div><div class="doc-date-label">Fecha de emisión</div><div class="doc-date-value">${fechaEmision}</div></div>
    </div>
    <div class="client-section">
      <div class="client-avatar">${cliente.charAt(0).toUpperCase()}</div>
      <div><div class="client-label">Cliente</div><div class="client-name">${cliente}</div></div>
    </div>
    <div class="table-section">
      <div class="section-title">Detalle de consumos por fecha</div>
      <table>
        <thead><tr>
          <th>Fecha</th><th class="centro">Almuerzos</th><th class="centro">Cenas</th>
          <th class="centro">Alojamientos</th><th class="monto">Neto</th><th class="monto">Total c/IVA</th>
        </tr></thead>
        <tbody>${filasServicios || `<tr><td colspan="6" style="text-align:center;color:#9a8f7a;padding:20px">Sin servicios registrados</td></tr>`}</tbody>
      </table>
    </div>
    <div class="summary-section">
      <div class="section-title">Resumen por concepto</div>
      <div class="summary-grid">
        <div class="summary-card"><div class="s-icon">🍽️</div><div class="s-label">Almuerzos</div><div class="s-qty">${servicios.reduce((a, s) => a + s.almuerzo, 0)}</div><div class="s-precio">${formatCLP(PRECIO_ALMUERZO)} c/u</div></div>
        <div class="summary-card"><div class="s-icon">🌙</div><div class="s-label">Cenas</div><div class="s-qty">${servicios.reduce((a, s) => a + s.cena, 0)}</div><div class="s-precio">${formatCLP(PRECIO_CENA)} c/u</div></div>
        <div class="summary-card"><div class="s-icon">🛏️</div><div class="s-label">Alojamientos</div><div class="s-qty">${servicios.reduce((a, s) => a + s.alojamiento, 0)}</div><div class="s-precio">${formatCLP(PRECIO_ALOJAMIENTO)} c/u</div></div>
      </div>
    </div>
    <div class="bottom-section">
      <div class="deposit-box">
        <div class="deposit-title">Datos para transferencia / depósito</div>
        <div class="deposit-row"><span class="deposit-key">Titular</span><span class="deposit-val">Blanca Bertila Díaz Barría</span></div>
        <div class="deposit-row"><span class="deposit-key">RUT</span><span class="deposit-val">6.768.074-K</span></div>
        <div class="deposit-row"><span class="deposit-key">Banco</span><span class="deposit-val">Banco Estado</span></div>
        <div class="deposit-row"><span class="deposit-key">Tipo de cuenta</span><span class="deposit-val">Cuenta Corriente</span></div>
        <div class="deposit-row"><span class="deposit-key">N° de cuenta</span><span class="deposit-val accent">87000004888</span></div>
      </div>
      <div class="totals-box">
        <div class="totals-row"><span class="label">Subtotal neto</span><span class="value">${formatCLP(totalNeto)}</span></div>
        <div class="totals-row"><span class="label">IVA (19%)</span><span class="value">${formatCLP(totalIVAcalc)}</span></div>
        <div class="totals-row grand"><span class="label">TOTAL</span><span class="value">${formatCLP(totalBruto)}</span></div>
      </div>
    </div>
    <div class="footer">
      <div class="footer-ornament"></div>
      <div class="footer-body">
        <div class="footer-contact">
          <div class="footer-contact-line"><span class="fc-icon">📍</span> Aguada de Dolores 1, Puerto Cisnes</div>
          <div class="footer-contact-line"><span class="fc-icon">✉</span> hostalmonchito2023@gmail.com</div>
          <div class="footer-contact-line"><span class="fc-icon">📞</span> +56 9 6224 9178</div>
        </div>
        <div class="footer-center">
          <div class="footer-brand">Hostal &amp; Restaurant Monchito</div>
          <div class="footer-note">Gracias por su preferencia</div>
        </div>
        <div class="footer-right">
          <div class="footer-date-label">Emitido el</div>
          <div class="footer-date-value">${fechaEmision}</div>
        </div>
      </div>
      <div class="footer-ornament-bottom"></div>
    </div>
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
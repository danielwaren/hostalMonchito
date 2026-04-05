import{j as e}from"./utils.C6aqvBVI.js";import{r as b}from"./index.CJnayx4B.js";import{T as R,a as E,b as F,c as j,d as i,e as O,f as r,g as V}from"./table.CFK48Tz8.js";import{C as w,a as y,b as A,d as H,c as T}from"./card.Dg2zoRS4.js";import{B as v}from"./button.BM8-jn8M.js";import{I as c}from"./input.BrK3PmMB.js";import{L as d}from"./label.CI71rk5u.js";import{c as I}from"./createLucideIcon.BJulnz13.js";import{P as M}from"./plus.BjpUzjT5.js";import{T as B}from"./trash-2.DHcaMd4P.js";import"./index.3p5bGMCc.js";import"./index.BUBXvTFY.js";import"./index.DOCvq2DF.js";/**
 * @license lucide-react v0.552.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const _=[["path",{d:"M12 15V3",key:"m9g1x1"}],["path",{d:"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",key:"ih7n3h"}],["path",{d:"m7 10 5 5 5-5",key:"brsn70"}]],G=I("download",_);/**
 * @license lucide-react v0.552.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const U=[["path",{d:"M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z",key:"q3az6g"}],["path",{d:"M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8",key:"1h4pet"}],["path",{d:"M12 17.5v-11",key:"1jc1ny"}]],Z=I("receipt",U),q=1e4,J=1e4,K=25e3,Y=.19;function de(){const[m,S]=b.useState(""),[n,h]=b.useState([{id:1,fecha:new Date().toISOString().split("T")[0],almuerzo:0,cena:0,alojamiento:0}]),[N,z]=b.useState(2),o=t=>t.toLocaleString("es-CL",{style:"currency",currency:"CLP"}),p=t=>t.almuerzo*q+t.cena*J+t.alojamiento*K,g=t=>p(t)*(1+Y),$=()=>{const t={id:N,fecha:new Date().toISOString().split("T")[0],almuerzo:0,cena:0,alojamiento:0};h([...n,t]),z(N+1)},D=t=>{if(n.length===1){alert("Debe mantener al menos una fila");return}h(n.filter(a=>a.id!==t))},x=(t,a,l)=>{h(n.map(s=>s.id===t?{...s,[a]:l}:s))},u=n.reduce((t,a)=>t+p(a),0),f=n.reduce((t,a)=>t+g(a),0),C=f-u,L=()=>{if(!m.trim()){alert("Por favor ingrese el nombre del cliente");return}const a=`
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
      padding: 30px; 
      font-size: 11px;
      color: #333;
      background: #fff;
    }
    .voucher-container {
      max-width: 800px;
      margin: 0 auto;
      border: 2px solid #2c5282;
      padding: 25px;
    }
    .header { 
      text-align: center; 
      margin-bottom: 25px; 
      padding-bottom: 15px;
      border-bottom: 3px solid #2c5282;
    }
    .header h1 { 
      font-size: 28px; 
      margin-bottom: 3px;
      color: #2c5282;
      font-weight: bold;
      letter-spacing: 1px;
    }
    .header .subtitle {
      font-size: 11px;
      color: #666;
      margin-top: 3px;
    }
    .header .location {
      font-size: 10px;
      color: #888;
      font-style: italic;
      margin-top: 2px;
    }
    .voucher-number {
      text-align: right;
      font-size: 10px;
      color: #666;
      margin-bottom: 15px;
    }
    .voucher-number strong {
      color: #2c5282;
    }
    .info-section {
      display: flex;
      justify-content: space-between;
      margin-bottom: 20px;
      background: #f8f9fa;
      padding: 12px;
      border-radius: 5px;
    }
    .info-column {
      flex: 1;
    }
    .info-row { 
      margin-bottom: 6px;
      font-size: 10px;
    }
    .info-label { 
      font-weight: bold;
      color: #2c5282;
      display: inline-block;
      min-width: 90px;
    }
    table { 
      width: 100%; 
      border-collapse: collapse; 
      margin: 20px 0;
    }
    th, td { 
      border: 1px solid #ddd; 
      padding: 8px; 
      text-align: left; 
    }
    th { 
      background: linear-gradient(to bottom, #2c5282, #1e3a5f);
      color: white;
      font-weight: bold; 
      font-size: 10px;
      text-transform: uppercase;
    }
    td { 
      font-size: 10px; 
    }
    tbody tr:nth-child(even) {
      background-color: #f8f9fa;
    }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .totales { 
      margin-top: 15px; 
      float: right; 
      width: 280px;
      background: #f8f9fa;
      padding: 12px;
      border-radius: 5px;
    }
    .totales-row { 
      display: flex; 
      justify-content: space-between; 
      padding: 5px 0; 
      font-size: 11px;
    }
    .totales-row.final { 
      border-top: 2px solid #2c5282; 
      font-weight: bold; 
      font-size: 13px; 
      margin-top: 8px;
      padding-top: 8px;
      color: #2c5282;
    }
    .payment-info {
      clear: both;
      margin-top: 30px;
      padding: 15px;
      background: #e8f4f8;
      border-left: 4px solid #2c5282;
      border-radius: 3px;
    }
    .payment-info h3 {
      font-size: 12px;
      margin-bottom: 10px;
      color: #2c5282;
      font-weight: bold;
    }
    .payment-details {
      font-size: 10px;
      line-height: 1.6;
    }
    .payment-details strong {
      color: #2c5282;
      display: inline-block;
      min-width: 120px;
    }
    .footer { 
      margin-top: 25px; 
      padding-top: 15px;
      border-top: 2px solid #e0e0e0;
      text-align: center; 
      font-size: 9px; 
      color: #888;
    }
    .footer p {
      margin: 3px 0;
    }
    @media print {
      body { padding: 15px; }
      .voucher-container { border: 1px solid #2c5282; }
    }
  </style>
</head>
<body>
  <div class="voucher-container">
    <div class="header">
      <h1>HOSTAL EL MONCHITO</h1>
      <p class="subtitle">Voucher de Servicios de Hospedaje</p>
      <p class="location">Puerto Cisnes, Patagonia Chilena</p>
    </div>
    
    <div class="voucher-number">
      <strong>N° Voucher:</strong> ${`${Date.now().toString().slice(-8)}`}
    </div>
    
    <div class="info-section">
      <div class="info-column">
        <div class="info-row">
          <span class="info-label">Cliente:</span>
          <span>${m}</span>
        </div>
        <div class="info-row">
          <span class="info-label">N° Servicios:</span>
          <span>${n.length}</span>
        </div>
      </div>
      <div class="info-column" style="text-align: right;">
        <div class="info-row">
          <span class="info-label">Fecha Emisión:</span>
          <span>${new Date().toLocaleDateString("es-CL")}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Hora:</span>
          <span>${new Date().toLocaleTimeString("es-CL",{hour:"2-digit",minute:"2-digit"})}</span>
        </div>
      </div>
    </div>
    
    <table>
      <thead>
        <tr>
          <th>Fecha</th>
          <th class="text-center">Almuerzos</th>
          <th class="text-center">Cenas</th>
          <th class="text-center">Alojamientos</th>
          <th class="text-right">Subtotal</th>
          <th class="text-right">Total + IVA</th>
        </tr>
      </thead>
      <tbody>
        ${n.map(s=>{const P=p(s),k=g(s);return`
          <tr>
            <td>${new Date(s.fecha).toLocaleDateString("es-CL")}</td>
            <td class="text-center">${s.almuerzo||"-"}</td>
            <td class="text-center">${s.cena||"-"}</td>
            <td class="text-center">${s.alojamiento||"-"}</td>
            <td class="text-right">${o(P)}</td>
            <td class="text-right">${o(k)}</td>
          </tr>
          `}).join("")}
      </tbody>
    </table>
    
    <div class="totales">
      <div class="totales-row">
        <span>Subtotal Neto:</span>
        <span>${o(u)}</span>
      </div>
      <div class="totales-row">
        <span>IVA (19%):</span>
        <span>${o(C)}</span>
      </div>
      <div class="totales-row final">
        <span>TOTAL A PAGAR:</span>
        <span>${o(f)}</span>
      </div>
    </div>
    
    <div class="payment-info">
      <h3>DATOS PARA TRANSFERENCIA</h3>
      <div class="payment-details">
        <p><strong>Titular:</strong> BLANCA BERTILA DIAZ BARRIA</p>
        <p><strong>RUT:</strong> 6.768.074-K</p>
        <p><strong>Banco:</strong> Banco Estado</p>
        <p><strong>Tipo de Cuenta:</strong> Cuenta Corriente</p>
        <p><strong>N° Cuenta:</strong> 87000004888</p>
      </div>
    </div>
    
    <div class="footer">
      <p><strong>Tarifas:</strong> Almuerzo $10.000 | Cena $10.000 | Alojamiento $25.000</p>
      <p>Documento generado el ${new Date().toLocaleString("es-CL")}</p>
      <p style="margin-top: 8px;">Hostal El Monchito - Puerto Cisnes, Patagonia Chilena</p>
    </div>
  </div>
</body>
</html>
    `,l=window.open("","_blank");l?(l.document.write(a),l.document.close(),l.onload=()=>{l.focus(),l.print()}):alert("Por favor permita las ventanas emergentes para generar el PDF")};return e.jsxs(w,{className:"w-full max-w-7xl mx-auto",children:[e.jsxs(y,{children:[e.jsxs(A,{className:"flex items-center gap-2",children:[e.jsx(Z,{className:"h-6 w-6"}),"Detalle de Servicios de Hospedaje"]}),e.jsx(H,{children:"Gestión de servicios: Almuerzo $10.000 • Cena $10.000 • Alojamiento $25.000"})]}),e.jsxs(T,{className:"space-y-6",children:[e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-3 gap-4",children:[e.jsxs("div",{className:"md:col-span-2 space-y-2",children:[e.jsx(d,{htmlFor:"nombreCliente",children:"Nombre del Cliente"}),e.jsx(c,{id:"nombreCliente",placeholder:"Ingrese el nombre del cliente",value:m,onChange:t=>S(t.target.value),className:"text-base"})]}),e.jsxs("div",{className:"flex gap-2 items-end",children:[e.jsxs(v,{onClick:$,className:"flex-1 flex items-center justify-center gap-2",children:[e.jsx(M,{className:"h-4 w-4"}),"Agregar Fila"]}),e.jsxs(v,{onClick:L,variant:"secondary",className:"flex-1 flex items-center justify-center gap-2",children:[e.jsx(G,{className:"h-4 w-4"}),"Generar PDF"]})]})]}),e.jsx("div",{className:"overflow-x-auto",children:e.jsxs(R,{children:[e.jsx(E,{children:"Detalle de servicios entregados - IVA 19%"}),e.jsx(F,{children:e.jsxs(j,{children:[e.jsx(i,{className:"w-[150px]",children:"Fecha"}),e.jsx(i,{className:"text-center",children:"Almuerzos"}),e.jsx(i,{className:"text-center",children:"Cenas"}),e.jsx(i,{className:"text-center",children:"Alojamientos"}),e.jsx(i,{className:"text-right",children:"Subtotal"}),e.jsx(i,{className:"text-right",children:"Total + IVA"}),e.jsx(i,{className:"text-center w-[100px]",children:"Acciones"})]})}),e.jsx(O,{children:n.map(t=>{const a=p(t),l=g(t);return e.jsxs(j,{children:[e.jsx(r,{children:e.jsx(c,{type:"date",value:t.fecha,onChange:s=>x(t.id,"fecha",s.target.value),className:"w-full"})}),e.jsx(r,{children:e.jsx(c,{type:"number",min:"0",value:t.almuerzo,onChange:s=>x(t.id,"almuerzo",parseInt(s.target.value)||0),className:"w-20 mx-auto text-center"})}),e.jsx(r,{children:e.jsx(c,{type:"number",min:"0",value:t.cena,onChange:s=>x(t.id,"cena",parseInt(s.target.value)||0),className:"w-20 mx-auto text-center"})}),e.jsx(r,{children:e.jsx(c,{type:"number",min:"0",value:t.alojamiento,onChange:s=>x(t.id,"alojamiento",parseInt(s.target.value)||0),className:"w-20 mx-auto text-center"})}),e.jsx(r,{className:"text-right font-medium",children:o(a)}),e.jsx(r,{className:"text-right font-semibold",children:o(l)}),e.jsx(r,{className:"text-center",children:e.jsx(v,{size:"sm",variant:"destructive",onClick:()=>D(t.id),disabled:n.length===1,children:e.jsx(B,{className:"h-4 w-4"})})})]},t.id)})}),e.jsx(V,{children:e.jsxs(j,{children:[e.jsx(r,{colSpan:5}),e.jsx(r,{colSpan:2,className:"p-0",children:e.jsxs("div",{className:"space-y-1 p-3",children:[e.jsxs("div",{className:"flex justify-between text-xs",children:[e.jsx("span",{children:"Subtotal Neto:"}),e.jsx("span",{className:"font-medium",children:o(u)})]}),e.jsxs("div",{className:"flex justify-between text-xs",children:[e.jsx("span",{children:"IVA (19%):"}),e.jsx("span",{className:"font-medium",children:o(C)})]}),e.jsxs("div",{className:"flex justify-between text-sm font-bold border-t pt-1",children:[e.jsx("span",{children:"TOTAL:"}),e.jsx("span",{className:"text-primary",children:o(f)})]})]})})]})})]})}),e.jsxs(w,{className:"bg-muted/30",children:[e.jsx(y,{children:e.jsx(A,{className:"text-lg",children:"Resumen de Servicios"})}),e.jsx(T,{children:e.jsxs("div",{className:"grid grid-cols-2 md:grid-cols-4 gap-4 text-sm",children:[e.jsxs("div",{children:[e.jsx(d,{className:"text-muted-foreground",children:"Total Almuerzos"}),e.jsx("p",{className:"text-2xl font-bold",children:n.reduce((t,a)=>t+a.almuerzo,0)})]}),e.jsxs("div",{children:[e.jsx(d,{className:"text-muted-foreground",children:"Total Cenas"}),e.jsx("p",{className:"text-2xl font-bold",children:n.reduce((t,a)=>t+a.cena,0)})]}),e.jsxs("div",{children:[e.jsx(d,{className:"text-muted-foreground",children:"Total Alojamientos"}),e.jsx("p",{className:"text-2xl font-bold",children:n.reduce((t,a)=>t+a.alojamiento,0)})]}),e.jsxs("div",{children:[e.jsx(d,{className:"text-muted-foreground",children:"Total Registros"}),e.jsx("p",{className:"text-2xl font-bold",children:n.length})]})]})})]})]})]})}export{de as default};

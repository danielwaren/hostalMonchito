import type { APIRoute } from 'astro';
import { Resend } from 'resend';

const resend = new Resend(import.meta.env.RESEND_API_KEY);

export const POST: APIRoute = async ({ request }) => {
  try {
    const { nombre, email, mensaje } = await request.json();

    if (!nombre || !email || !mensaje) {
      return new Response(JSON.stringify({ error: 'Faltan campos' }), {
        status: 400,
      });
    }

    await resend.emails.send({
      from: 'Hostal Monchito <onboarding@resend.dev>',
      to: 'hostalmonchito2023@gmail.com',
      subject: `Nueva consulta de ${nombre}`,
      html: `
  <div style="font-family: Arial, sans-serif; background:#0e1210; padding:20px; color:#f4f0e8;">
    
    <div style="max-width:600px; margin:0 auto; background:#151a17; border-radius:12px; overflow:hidden; border:1px solid rgba(255,255,255,0.08);">
      
      <!-- HEADER -->
      <div style="background:#6a9e72; padding:20px; text-align:center;">
        <h1 style="margin:0; font-size:20px; color:#0e1210;">
          Nueva Consulta Web
        </h1>
        <p style="margin:5px 0 0; font-size:13px; color:#0e1210;">
          Hostal El Monchito – Puerto Cisnes
        </p>
      </div>

      <!-- BODY -->
      <div style="padding:20px;">
        
        <p style="font-size:14px; margin-bottom:20px; color:#ccc;">
          Has recibido una nueva consulta desde tu sitio web:
        </p>

        <div style="background:#0e1210; padding:15px; border-radius:10px; margin-bottom:15px;">
          <p style="margin:0; font-size:13px; color:#888;">Nombre</p>
          <p style="margin:4px 0 0; font-size:15px;">${nombre}</p>
        </div>

        <div style="background:#0e1210; padding:15px; border-radius:10px; margin-bottom:15px;">
          <p style="margin:0; font-size:13px; color:#888;">Email</p>
          <p style="margin:4px 0 0; font-size:15px;">${email}</p>
        </div>

        <div style="background:#0e1210; padding:15px; border-radius:10px;">
          <p style="margin:0; font-size:13px; color:#888;">Mensaje</p>
          <p style="margin:6px 0 0; font-size:15px; line-height:1.5;">
            ${mensaje}
          </p>
        </div>

      </div>

      <!-- FOOTER -->
      <div style="padding:15px; text-align:center; font-size:12px; color:#777; border-top:1px solid rgba(255,255,255,0.05);">
        <p style="margin:0;">
          Este mensaje fue enviado desde www.hostalmonchito.cl
        </p>
      </div>

    </div>

  </div>
`
    });

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
    });

  } catch (error: any) {
    console.error(error);

    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 500,
    });
  }
};
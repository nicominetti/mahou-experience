import type { APIRoute } from 'astro';
import { Resend } from 'resend';
import { z } from 'zod';

// Esquema de validación con Zod
const orderSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  telefono: z.string().min(9, 'Teléfono debe tener al menos 9 dígitos'),
  direccion: z.string().min(5, 'Dirección requerida'),
  ciudad: z.string().min(2, 'Ciudad requerida'),
  codigoPostal: z.string().min(5, 'Código postal requerido'),
  talla: z.enum(['XS', 'S', 'M', 'L', 'XL', 'XXL']),
  logoSize: z.enum(['Pequeño', 'Mediano', 'Grande']),
  logoPosition: z.string().min(1, 'Posición del logo requerida'),
  selectedLogo: z.string().min(1, 'Logo seleccionado requerido'),
  comentarios: z.string().optional(),
  diseñoImagen: z.string().min(10, 'Imagen de diseño requerida')
});

// Función para sanear texto para email (prevenir inyección de headers)
function sanearParaEmail(texto: string): string {
  return texto.replace(/(\r\n|\n|\r)/gm, " ").trim();
}

export const POST: APIRoute = async ({ request, redirect }) => {
  // Verificar método
  if (request.method !== 'POST') {
    return new Response(
      JSON.stringify({ message: 'Método no permitido' }), 
      { status: 405, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Detectar si es JSON o FormData
    const contentType = request.headers.get('content-type') || '';
    let rawData;

    if (contentType.includes('application/json')) {
      // Manejar JSON (desde checkout)
      const jsonData = await request.json();
      rawData = {
        nombre: jsonData.nombre || '',
        email: jsonData.email || '',
        telefono: jsonData.telefono || '',
        direccion: `${jsonData.tipoVia || ''} ${jsonData.direccion || ''} ${jsonData.otrosDatos || ''}`.trim(),
        ciudad: jsonData.poblacion || '',
        codigoPostal: jsonData.codigoPostal || '',
        talla: jsonData.talla || 'M',
        logoSize: jsonData.logoSize || 'Mediano',
        logoPosition: jsonData.logoPosition || 'Pecho centro',
        selectedLogo: jsonData.selectedLogo || 'mahou',
        comentarios: jsonData.documento ? `Documento: ${jsonData.tipoDocumento} ${jsonData.documento}` : '',
        diseñoImagen: jsonData.diseñoImagen || ''
      };
    } else {
      // Manejar FormData (formulario original)
      const formData = await request.formData();
      rawData = {
        nombre: formData.get('nombre')?.toString() || '',
        email: formData.get('email')?.toString() || '',
        telefono: formData.get('telefono')?.toString() || '',
        direccion: formData.get('direccion')?.toString() || '',
        ciudad: formData.get('ciudad')?.toString() || '',
        codigoPostal: formData.get('codigoPostal')?.toString() || '',
        talla: formData.get('talla')?.toString() || 'M',
        logoSize: formData.get('logoSize')?.toString() || 'Mediano',
        logoPosition: formData.get('logoPosition')?.toString() || 'Pecho centro',
        selectedLogo: formData.get('selectedLogo')?.toString() || 'mahou',
        comentarios: formData.get('comentarios')?.toString() || '',
        diseñoImagen: formData.get('diseñoImagen')?.toString() || ''
      };
    }

    // Validar datos con Zod
    const validatedData = orderSchema.parse(rawData);

    // Configurar Resend
    const resend = new Resend(import.meta.env.RESEND_API_KEY);
    const direccionImpresion = import.meta.env.DIRECCION_IMPRESION;
    const fromEmail = import.meta.env.FROM_EMAIL;

    if (!resend || !direccionImpresion || !fromEmail) {
      console.error('Variables de entorno faltantes para Resend');
      return new Response(
        JSON.stringify({ message: 'Error de configuración del servidor' }), 
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Extraer datos base64 puros de la imagen
    const base64Data = validatedData.diseñoImagen.replace(/^data:image\/png;base64,/, "");
    
    // Convertir base64 a buffer para el attachment
    const imageBuffer = Buffer.from(base64Data, 'base64');

    // Construir el cuerpo del email en HTML
    const htmlBody = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #FF6B35; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f8f9fa; padding: 20px; border: 1px solid #e9ecef; }
            .details { background-color: white; padding: 15px; border-radius: 5px; margin: 10px 0; }
            .footer { background-color: #6b7280; color: white; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; }
            .highlight { background-color: #FFD700; padding: 2px 6px; border-radius: 3px; color: #8B4513; font-weight: bold; }
            .logo-info { background-color: #FFF7ED; border: 1px solid #FFD700; padding: 15px; border-radius: 5px; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Nuevo Pedido Camiseta Mahou Personalizada</h1>
            </div>
            
            <div class="content">
              <p>Se ha recibido un nuevo pedido de camiseta personalizada con los siguientes detalles:</p>
              
              <div class="details">
                <h2>👤 Información del Cliente</h2>
                <p><strong>Nombre:</strong> ${sanearParaEmail(validatedData.nombre)}</p>
                <p><strong>Email:</strong> ${sanearParaEmail(validatedData.email)}</p>
                <p><strong>Teléfono:</strong> ${sanearParaEmail(validatedData.telefono)}</p>
                <p><strong>Dirección:</strong> ${sanearParaEmail(validatedData.direccion)}</p>
                <p><strong>Ciudad:</strong> ${sanearParaEmail(validatedData.ciudad)}</p>
                <p><strong>Código Postal:</strong> ${sanearParaEmail(validatedData.codigoPostal)}</p>
              </div>
              
              <div class="details">
                <h2>Detalles del Producto</h2>
                <p><strong>Talla:</strong> <span class="highlight">${validatedData.talla}</span></p>
                <p><strong>Tipo:</strong> Camiseta Mahou Personalizada (GRATUITA)</p>
              </div>
              
              <div class="logo-info">
                <h2>Personalización del Logo</h2>
                <p><strong>Logo seleccionado:</strong> <span class="highlight">${validatedData.selectedLogo.toUpperCase()}</span></p>
                <p><strong>Tamaño del logo:</strong> ${validatedData.logoSize}</p>
                <p><strong>Ubicación:</strong> ${validatedData.logoPosition}</p>
              </div>
              
              ${validatedData.comentarios ? `
              <div class="details">
                <h2>Comentarios del Cliente</h2>
                <p><em>"${sanearParaEmail(validatedData.comentarios)}"</em></p>
              </div>
              ` : ''}
              
              <div class="details">
                <h2>Diseño Personalizado</h2>
                <p>El diseño personalizado se encuentra adjunto a este correo como imagen PNG de alta resolución.</p>
                <p><em>Nombre del archivo: diseño-mahou-${validatedData.nombre.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.png</em></p>
              </div>
              
              <div style="background-color: #FFF7ED; border: 1px solid #FFD700; padding: 15px; border-radius: 5px; margin: 15px 0;">
                <h3 style="color: #8B4513; margin-top: 0;">⭐ Información del Pedido VIP</h3>
                <ul style="color: #8B4513;">
                  <li><strong>Producto GRATUITO</strong> - Promoción especial Mahou</li>
                  <li>Entrega garantizada en 24-48 horas</li>
                  <li>Logotipo oficial Mahou San Miguel</li>
                  <li>Calidad premium con personalización 3D</li>
                  <li>Producto exclusivo</li>
                </ul>
              </div>
              
              <div style="background-color: #dbeafe; border: 1px solid #3b82f6; padding: 15px; border-radius: 5px; margin: 15px 0;">
                <h3 style="color: #1e40af; margin-top: 0;">⏰ Próximos Pasos</h3>
                <ol style="color: #1e40af;">
                  <li>Revisar el diseño y verificar la calidad de impresión</li>
                  <li>Contactar al cliente para confirmar detalles de envío</li>
                  <li>Proceder con la producción inmediata</li>
                  <li>Coordinar entrega en 24-48 horas</li>
                </ol>
              </div>
            </div>
            
            <div class="footer">
              <p>Email generado automáticamente por el Sistema de Pedidos Mahou</p>
              <p>Fecha: ${new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' })}</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Generar nombre único para el archivo adjunto
    const nombreArchivo = `diseño-mahou-${validatedData.nombre.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.png`;

    // Enviar email usando Resend
    const { data: responseData, error } = await resend.emails.send({
      from: fromEmail,
      to: [direccionImpresion],
      subject: `Nuevo Pedido Mahou: ${sanearParaEmail(validatedData.nombre)} - Talla ${validatedData.talla} - ${validatedData.logoPosition}`,
      html: htmlBody,
      attachments: [{
        filename: nombreArchivo,
        content: imageBuffer,
        type: 'image/png'
      }]
    });

    if (error) {
      console.error('Error de Resend:', error);
      return new Response(
        JSON.stringify({ 
          message: 'Error al enviar el pedido. Por favor, inténtalo nuevamente.' 
        }), 
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('Pedido enviado exitosamente:', responseData?.id);
    
    // Redirigir a página de éxito
    return redirect('/pedido-exitoso', 302);

  } catch (error) {
    console.error('Error al procesar el pedido:', error);
    
    // Si es error de validación de Zod, dar detalles específicos
    if (error instanceof z.ZodError) {
      const errores = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
      return new Response(
        JSON.stringify({ 
          message: `Datos inválidos: ${errores}` 
        }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Error genérico del servidor
    return new Response(
      JSON.stringify({ 
        message: 'Error interno del servidor. Por favor, inténtalo más tarde.' 
      }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
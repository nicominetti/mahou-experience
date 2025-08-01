import type { APIRoute } from 'astro';
import { Resend } from 'resend';
import { z } from 'zod';

// Esquema de validación con Zod para el nuevo formato de checkout
const checkoutSchema = z.object({
  // Datos personales
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  telefono: z.string().min(9, 'Teléfono debe tener al menos 9 dígitos'),
  
  // Documentación
  tipoDocumento: z.enum(['DNI', 'NIE', 'Pasaporte']),
  numeroDocumento: z.string().min(5, 'Número de documento requerido'),
  
  // Dirección
  tipoVia: z.enum(['Calle', 'Avenida', 'Plaza', 'Paseo']),
  direccion: z.string().min(5, 'Dirección requerida'),
  otrosDatos: z.string().optional().default(''),
  codigoPostal: z.string().regex(/^[0-9]{5}$/, 'Código postal debe tener exactamente 5 dígitos'),
  poblacion: z.string().min(2, 'Población requerida'),
  provincia: z.string().min(2, 'Provincia requerida'),
  pais: z.string().min(2, 'País requerido'),
  
  // Datos del pedido (JSON string)
  orderData: z.string().min(10, 'Datos del pedido requeridos')
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
    // Obtener datos del formulario
    const formData = await request.formData();
    const rawData = {
      nombre: formData.get('nombre')?.toString() || '',
      email: formData.get('email')?.toString() || '',
      telefono: formData.get('telefono')?.toString() || '',
      tipoDocumento: formData.get('tipoDocumento')?.toString() || '',
      numeroDocumento: formData.get('numeroDocumento')?.toString() || '',
      tipoVia: formData.get('tipoVia')?.toString() || '',
      direccion: formData.get('direccion')?.toString() || '',
      otrosDatos: formData.get('otrosDatos')?.toString() || '',
      codigoPostal: formData.get('codigoPostal')?.toString() || '',
      poblacion: formData.get('poblacion')?.toString() || '',
      provincia: formData.get('provincia')?.toString() || '',
      pais: formData.get('pais')?.toString() || '',
      orderData: formData.get('orderData')?.toString() || '{}'
    };

    // Log de debugging para ver qué datos llegan
    console.log('Datos recibidos:', rawData);
    console.log('Código postal recibido:', `"${rawData.codigoPostal}"`, 'Length:', rawData.codigoPostal.length);

    // Validar datos con el nuevo esquema
    const validatedData = checkoutSchema.parse(rawData);
    
    // Parsear los datos del pedido JSON
    let orderDetails;
    try {
      orderDetails = JSON.parse(validatedData.orderData);
    } catch (error) {
      console.error('Error parsing orderData:', error);
      return new Response(
        JSON.stringify({ message: 'Datos del pedido inválidos' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

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

    // Construir el cuerpo del email actualizado con todos los datos
    const htmlBody = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 700px; margin: 0 auto; padding: 20px; }
            .header { background-color: #E30613; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f9f9f9; padding: 25px; border-radius: 0 0 8px 8px; }
            .details { background-color: white; padding: 15px; margin: 15px 0; border-radius: 5px; border-left: 4px solid #E30613; }
            .highlight { background-color: #FFE6E6; padding: 2px 6px; border-radius: 3px; font-weight: bold; }
            .logo-positions { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; }
            .position-item { background: #f0f8ff; padding: 10px; border-radius: 5px; text-align: center; }
            .address-section { background: #fff; padding: 15px; border: 2px solid #E30613; border-radius: 8px; margin: 15px 0; }
            .product-summary { background: linear-gradient(135deg, #E30613, #FF4444); color: white; padding: 20px; border-radius: 8px; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Nuevo Pedido Camiseta Mahou Personalizada</h1>
              <p>Pedido recibido: ${new Date().toLocaleString('es-ES')}</p>
            </div>
            
            <div class="content">
              <div class="product-summary">
                <h2>Resumen del Producto</h2>
                <p><strong>Camiseta Mahou Personalizada</strong> - <span style="background: rgba(255,255,255,0.2); padding: 3px 8px; border-radius: 15px;">GRATUITA</span></p>
                <p><strong>Talla:</strong> ${orderDetails.size}</p>
                <p><strong>Género:</strong> ${orderDetails.gender === 'masculino' ? 'Masculino' : orderDetails.gender === 'femenino' ? 'Femenino' : 'Unisex'}</p>
                <p><strong>Color:</strong> <span style="display: inline-block; width: 20px; height: 20px; background-color: ${orderDetails.color.hex}; border: 1px solid white; border-radius: 50%; vertical-align: middle;"></span> ${orderDetails.color.hex}</p>
                <p><strong>Total Logos:</strong> ${orderDetails.summary.totalLogos}</p>
                <p><strong>Tamaño Logos:</strong> ${['Pequeño', 'Medio', 'Grande'][orderDetails.logoSize]}</p>
              </div>

              <div class="details">
                <h2>UBICACIONES DE IMPRESIÓN</h2>
                <div class="logo-positions">
                  ${orderDetails.summary.positions.map(pos => `
                    <div class="position-item">
                      <strong>${pos.position}</strong><br>
                      <span style="color: #E30613; font-weight: bold;">${pos.logo}</span>
                    </div>
                  `).join('')}
                </div>
                <p style="font-size: 12px; color: #666; margin-top: 15px;">
                  <strong>IMPORTANTE:</strong> Cada posición requiere impresión individual según el diseño 3D del cliente.
                </p>
              </div>

              <div class="address-section">
                <h2>DIRECCIÓN DE ENVÍO</h2>
                <p><strong>Cliente:</strong> ${sanearParaEmail(validatedData.nombre)}</p>
                <p><strong>Email:</strong> ${sanearParaEmail(validatedData.email)}</p>
                <p><strong>Teléfono:</strong> ${sanearParaEmail(validatedData.telefono)}</p>
                <p><strong>${validatedData.tipoDocumento}:</strong> ${sanearParaEmail(validatedData.numeroDocumento)}</p>
                <hr style="margin: 15px 0; border: 1px solid #E30613;">
                <p><strong>Dirección Completa:</strong></p>
                <p>${validatedData.tipoVia} ${sanearParaEmail(validatedData.direccion)}</p>
                ${validatedData.otrosDatos ? `<p><em>Otros datos:</em> ${sanearParaEmail(validatedData.otrosDatos)}</p>` : ''}
                <p>${sanearParaEmail(validatedData.codigoPostal)} ${sanearParaEmail(validatedData.poblacion)}</p>
                <p>${sanearParaEmail(validatedData.provincia)}, ${sanearParaEmail(validatedData.pais)}</p>
              </div>

              <div class="details">
                <h2>DATOS TÉCNICOS DEL PEDIDO</h2>
                <p><strong>Timestamp:</strong> ${orderDetails.timestamp}</p>
                <p><strong>Modelo 3D:</strong> ${orderDetails.modelURL}</p>
                <p><strong>Hash del Pedido:</strong> ${orderDetails.timestamp.slice(-8)}</p>
              </div>

              <div style="background-color: #FFF7ED; border: 2px solid #FFD700; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #8B4513; margin-top: 0;">INSTRUCCIONES VIP - MAHOU EXPERIENCE</h3>
                <ul style="color: #8B4513; margin: 0;">
                  <li><strong>Producto GRATUITO</strong> - Promoción especial Mahou San Miguel</li>
                  <li><strong>Entrega:</strong> 24-48 horas hábiles</li>
                  <li><strong>Impresión:</strong> Logo oficial Mahou en posiciones especificadas</li>
                  <li><strong>Calidad:</strong> Camiseta premium con diseño 3D personalizado</li>
                  <li><strong>Proceso:</strong> Verificar cada posición de logo antes del envío</li>
                  <li><strong>Exclusivo:</strong> Producto único generado por configurador 3D</li>
                </ul>
              </div>

              <div style="text-align: center; padding: 20px; background: #f0f0f0; border-radius: 8px; margin-top: 20px;">
                <p style="margin: 0; color: #666;">
                  Este pedido fue generado automáticamente desde el configurador 3D de Mahou Experience<br>
                  <strong>mahou-experience.com</strong> | Promoción válida hasta agotar stock
                </p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    // Enviar email con los datos del pedido
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [direccionImpresion],
      subject: `Nuevo Pedido Mahou: ${validatedData.nombre} - Talla ${orderDetails.size} - ${orderDetails.summary.totalLogos} logos`,
      html: htmlBody
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

    console.log('Pedido enviado exitosamente:', data?.id);
    
    // Redirigir a página de éxito
    return redirect('/pedido-exitoso', 302);

  } catch (error) {
    console.error('Error al procesar el pedido:', error);
    
    // Si es error de validación de Zod, dar detalles específicos
    if (error instanceof z.ZodError) {
      console.error('❌ Error de validación Zod:', error.errors);
      const errores = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
      return new Response(
        JSON.stringify({ 
          message: `Datos inválidos: ${errores}`,
          details: error.errors // Incluir detalles completos para debugging
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

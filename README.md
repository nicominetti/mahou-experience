# 🎽 Sistema de Diseño y Pedidos de Camisetas Personalizadas

Un sistema completo para diseñar y pedir camisetas personalizadas, construido con Astro, React y Tailwind CSS.

## 🚀 Estado Actual

✅ **FUNCIONANDO**: El proyecto está operativo y listo para usar!

- **Servidor corriendo**: `http://localhost:4322/`
- **Landing page**: Adaptada del tema Mintaka para el negocio de camisetas
- **Diseñador**: Interfaz simplificada funcional (sin Fabric.js temporalmente)
- **API de pedidos**: Endpoint preparado para procesar pedidos
- **Email system**: Configurado con Resend (requiere setup de credenciales)

## 📁 Estructura del Proyecto

```
src/
├── components/
│   ├── designer/
│   │   └── TShirtDesigner.jsx      # Diseñador principal (React)
│   ├── landing/
│   │   ├── Hero.astro              # Hero adaptado para camisetas
│   │   ├── TShirtServices.astro    # Servicios del negocio
│   │   └── ...
│   └── ...
├── pages/
│   ├── index.astro                 # Landing page principal
│   ├── disenar.astro               # Página del diseñador
│   ├── pedido-exitoso.astro        # Confirmación de pedido
│   └── api/
│       └── enviar-pedido.ts        # API endpoint para pedidos
├── layouts/
└── styles/
```

## 🛠️ Tecnologías

- **Frontend**: Astro + React + Tailwind CSS
- **Diseñador**: Canvas nativo HTML5 (temporal, listo para Fabric.js)
- **Backend**: Astro SSR + TypeScript
- **Email**: Resend + validación Zod
- **Estilos**: Tailwind CSS del tema Mintaka

## ⚡ Inicio Rápido

1. **Instalar dependencias**:
```bash
npm install
```

2. **Configurar variables de entorno** (archivo `.env`):
```env
RESEND_API_KEY="tu_api_key_de_resend"
DIRECCION_IMPRESION="pedidos@empresa-impresion.com"
FROM_EMAIL="noreply@tudominio.com"
SITE_URL="https://tudominio.com"
```

3. **Ejecutar servidor de desarrollo**:
```bash
npm run dev
```

4. **Visitar la aplicación**:
   - Landing page: `http://localhost:4322/`
   - Diseñador: `http://localhost:4322/disenar`

## 🎨 Flujo de Usuario

1. **Landing page**: Usuario ve información del servicio
2. **Botón CTA**: "Diseña tu Camiseta" → `/disenar`
3. **Diseñador**: Usuario crea su diseño personalizado
4. **Formulario**: Usuario completa sus datos y detalles del pedido
5. **Envío**: Sistema genera imagen del diseño y envía email
6. **Confirmación**: Usuario ve página de éxito → `/pedido-exitoso`

## 📧 Sistema de Email

El sistema usa **Resend** para enviar emails transaccionales a la empresa de impresión con:

- Datos del cliente
- Detalles del pedido (talla, cantidad, comentarios)
- Imagen del diseño como adjunto PNG
- Email HTML bien formateado

## 🔧 Próximos Pasos Recomendados

### 1. Configurar Resend (URGENTE)
- Crear cuenta en [Resend](https://resend.com)
- Obtener API key
- Verificar dominio de envío
- Actualizar archivo `.env`

### 2. Mejorar el Diseñador
- Reintegrar Fabric.js (v5.3.0) para editor avanzado
- Añadir herramientas de formas y colores
- Implementar carga de imágenes
- Añadir plantillas prediseñadas

### 3. Personalización de Marca
- Actualizar colores en `tailwind.config.cjs`
- Añadir logo de la empresa
- Personalizar textos y contenido
- Configurar dominio y metadatos SEO

### 4. Producción
- Elegir y configurar adapter (Vercel, Netlify, etc.)
- Configurar variables de entorno en producción
- Implementar analytics (opcional)
- Configurar dominio personalizado

## 🐛 Problemas Conocidos

1. **Fabric.js**: Temporalmente deshabilitado por conflictos de import (v6 vs v5)
   - **Solución**: Diseñador simplificado funcional implementado
   - **Fix futuro**: Reinstalar Fabric.js v5.3.0 con imports correctos

2. **Warnings Astro**: Algunos warnings menores sobre prerendering
   - **Impacto**: No afecta funcionalidad
   - **Fix**: Añadir `export const prerender = true` a páginas estáticas

## 🚨 Configuración Crítica

Para que el sistema funcione completamente:

1. **Variables de entorno** `.env` configuradas
2. **Resend API key** válida
3. **Dominio verificado** en Resend
4. **Email de destino** válido para la imprenta

## 📞 Testing

Para probar el flujo completo:

1. Ir a `http://localhost:4322/`
2. Click en "Diseña tu Camiseta"
3. Personalizar texto y color
4. Completar formulario de pedido
5. Click "Enviar Pedido"
6. Verificar que se envía email (si Resend está configurado)
7. Ver página de confirmación

---

**¡El proyecto está listo para usar y solo necesita configuración de email para estar 100% funcional!**
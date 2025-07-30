import React, { useState, useEffect } from 'react';

const CheckoutForm = () => {
  const [designData, setDesignData] = useState(null);
  const [contactData, setContactData] = useState({
    nombre: '',
    email: ''
  });
  const [shippingData, setShippingData] = useState({
    tipoDocumento: 'DNI',
    documento: '',
    tipoVia: 'Calle',
    direccion: '',
    otrosDatos: '',
    codigoPostal: '',
    poblacion: '',
    provincia: '',
    pais: 'España',
    telefono: ''
  });

  useEffect(() => {
    // Recuperar datos del diseño del localStorage
    const savedDesign = localStorage.getItem('tshirtDesign');
    
    if (savedDesign) {
      try {
        const parsedDesign = JSON.parse(savedDesign);
        const designInfo = {
          appliedLogos: parsedDesign.appliedLogos || {},
          logoCount: Object.keys(parsedDesign.appliedLogos || {}).length,
          designTimestamp: parsedDesign.timestamp,
          logoPosition: Object.keys(parsedDesign.appliedLogos || {}).join(', ') || 'Sin logos',
          appliedDecals: Object.keys(parsedDesign.appliedLogos || {}).length.toString()
        };
        setDesignData(designInfo);
        console.log('Diseño cargado desde localStorage:', designInfo);
      } catch (error) {
        console.error('Error al parsear el diseño:', error);
      }
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Preparar datos para envío
    const orderData = {
      ...contactData,
      ...shippingData,
      ...designData,
      timestamp: new Date().toISOString()
    };

    try {
      const response = await fetch('/api/enviar-pedido', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (response.ok) {
        // Limpiar localStorage
        localStorage.removeItem('tshirtDesign');
        
        // Redirigir a página de confirmación
        window.location.href = '/pedido-exitoso';
      } else {
        alert('Error al enviar el pedido. Por favor, inténtalo de nuevo.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al enviar el pedido. Por favor, inténtalo de nuevo.');
    }
  };

  const updateContactData = (field, value) => {
    setContactData(prev => ({ ...prev, [field]: value }));
  };

  const updateShippingData = (field, value) => {
    setShippingData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      
      {/* Resumen del diseño */}
      {designData && designData.logoCount > 0 && (
        <div className="bg-blue-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumen de tu Diseño</h3>
          <div className="space-y-2 text-sm">
            <p><strong>Logos aplicados:</strong> {designData.logoCount}</p>
            <p><strong>Posiciones:</strong> {designData.logoPosition}</p>
            {designData.designTimestamp && (
              <p><strong>Creado:</strong> {new Date(designData.designTimestamp).toLocaleString()}</p>
            )}
          </div>
        </div>
      )}

      {/* Datos de contacto */}
      <div className="space-y-6">
        <h3 className="text-xl font-semibold text-gray-900">Datos de Contacto</h3>
        
        <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
          <div className="form-field sm:col-span-2">
            <label htmlFor="nombre" className="form-label">Nombre completo*</label>
            <input
              type="text"
              id="nombre"
              className="form-input"
              value={contactData.nombre}
              onChange={(e) => updateContactData('nombre', e.target.value)}
              required
            />
          </div>
          
          <div className="form-field sm:col-span-2">
            <label htmlFor="email" className="form-label">Email*</label>
            <input
              type="email"
              id="email"
              className="form-input"
              value={contactData.email}
              onChange={(e) => updateContactData('email', e.target.value)}
              required
            />
          </div>
        </div>
      </div>

      {/* Datos de envío */}
      <div className="space-y-6">
        <h3 className="text-xl font-semibold text-gray-900">Dirección de Envío</h3>
        
        <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
          <div className="form-field">
            <label htmlFor="tipoDocumento" className="form-label">Tipo de documento*</label>
            <select
              id="tipoDocumento"
              className="form-select"
              value={shippingData.tipoDocumento}
              onChange={(e) => updateShippingData('tipoDocumento', e.target.value)}
              required
            >
              <option value="DNI">DNI</option>
              <option value="NIE">NIE</option>
              <option value="Pasaporte">Pasaporte</option>
            </select>
          </div>
          
          <div className="form-field">
            <label htmlFor="documento" className="form-label">Número de documento*</label>
            <input
              type="text"
              id="documento"
              className="form-input"
              value={shippingData.documento}
              onChange={(e) => updateShippingData('documento', e.target.value)}
              required
            />
          </div>
          
          <div className="form-field">
            <label htmlFor="tipoVia" className="form-label">Tipo de vía*</label>
            <select
              id="tipoVia"
              className="form-select"
              value={shippingData.tipoVia}
              onChange={(e) => updateShippingData('tipoVia', e.target.value)}
              required
            >
              <option value="Calle">Calle</option>
              <option value="Avenida">Avenida</option>
              <option value="Plaza">Plaza</option>
              <option value="Paseo">Paseo</option>
              <option value="Carretera">Carretera</option>
            </select>
          </div>
          
          <div className="form-field">
            <label htmlFor="direccion" className="form-label">Dirección*</label>
            <input
              type="text"
              id="direccion"
              className="form-input"
              placeholder="Nombre de la vía, número, piso, puerta..."
              value={shippingData.direccion}
              onChange={(e) => updateShippingData('direccion', e.target.value)}
              required
            />
          </div>
          
          <div className="form-field sm:col-span-2">
            <label htmlFor="otrosDatos" className="form-label">Otros datos</label>
            <input
              type="text"
              id="otrosDatos"
              className="form-input"
              placeholder="Escalera, portal, timbre..."
              value={shippingData.otrosDatos}
              onChange={(e) => updateShippingData('otrosDatos', e.target.value)}
            />
          </div>
          
          <div className="form-field">
            <label htmlFor="codigoPostal" className="form-label">Código postal*</label>
            <input
              type="text"
              id="codigoPostal"
              className="form-input"
              value={shippingData.codigoPostal}
              onChange={(e) => updateShippingData('codigoPostal', e.target.value)}
              required
            />
          </div>
          
          <div className="form-field">
            <label htmlFor="poblacion" className="form-label">Población*</label>
            <input
              type="text"
              id="poblacion"
              className="form-input"
              value={shippingData.poblacion}
              onChange={(e) => updateShippingData('poblacion', e.target.value)}
              required
            />
          </div>
          
          <div className="form-field">
            <label htmlFor="provincia" className="form-label">Provincia*</label>
            <input
              type="text"
              id="provincia"
              className="form-input"
              value={shippingData.provincia}
              onChange={(e) => updateShippingData('provincia', e.target.value)}
              required
            />
          </div>
          
          <div className="form-field">
            <label htmlFor="pais" className="form-label">País*</label>
            <input
              type="text"
              id="pais"
              className="form-input"
              value={shippingData.pais}
              onChange={(e) => updateShippingData('pais', e.target.value)}
              required
            />
          </div>
          
          <div className="form-field sm:col-span-2">
            <label htmlFor="telefono" className="form-label">Teléfono*</label>
            <input
              type="tel"
              id="telefono"
              className="form-input"
              value={shippingData.telefono}
              onChange={(e) => updateShippingData('telefono', e.target.value)}
              required
            />
          </div>
        </div>
      </div>

      {/* Términos y condiciones */}
      <div className="flex gap-x-4 sm:col-span-2">
        <input type="checkbox" id="acepto" required className="mt-1" />
        <label htmlFor="acepto" className="text-sm leading-6 text-gray-600">
          Acepto los <a href="/privacy" className="font-semibold text-slate-800">términos y condiciones</a> y 
          la <a href="/privacy" className="font-semibold text-slate-800">política de privacidad</a>.*
        </label>
      </div>

      {/* Botón de envío */}
      <div className="flex pt-10">
        <div className="squircle-bg rounded-lg bg-zinc-900">
          <button
            type="submit"
            className="flex h-10 w-full max-w-64 flex-1 items-center justify-center px-4 py-2 text-xl text-slate-200 transition-all hover:text-white sm:w-auto md:font-bold lg:h-10"
          >
          Finalizar pedido
          </button>
        </div>
      </div>
    </form>
  );
};

export default CheckoutForm;

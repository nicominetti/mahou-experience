import React, { useState, useEffect } from 'react';

const CheckoutPage = () => {
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
          // Mantener compatibilidad con parámetros URL
          talla: new URLSearchParams(window.location.search).get('talla') || 'M',
          logoSize: 'Personalizado',
          logoPosition: Object.keys(parsedDesign.appliedLogos || {}).join(', ') || 'Sin logos',
          selectedLogo: 'mahou',
          appliedDecals: Object.keys(parsedDesign.appliedLogos || {}).length.toString()
        };
        setDesignData(designInfo);
        console.log('Diseño cargado desde localStorage:', designInfo);
      } catch (error) {
        console.error('Error al parsear el diseño:', error);
        // Fallback a los datos de URL
        const designInfo = {
          talla: new URLSearchParams(window.location.search).get('talla') || 'M',
          logoSize: new URLSearchParams(window.location.search).get('logoSize') || 'Mediano',
          logoPosition: new URLSearchParams(window.location.search).get('logoPosition') || 'Pecho centro',
          selectedLogo: new URLSearchParams(window.location.search).get('selectedLogo') || 'mahou',
          appliedDecals: new URLSearchParams(window.location.search).get('appliedDecals') || '0'
        };
        setDesignData(designInfo);
      }
    } else {
      // Fallback a los datos de URL si no hay localStorage
      const designInfo = {
        talla: new URLSearchParams(window.location.search).get('talla') || 'M',
        logoSize: new URLSearchParams(window.location.search).get('logoSize') || 'Mediano',
        logoPosition: new URLSearchParams(window.location.search).get('logoPosition') || 'Pecho centro',
        selectedLogo: new URLSearchParams(window.location.search).get('selectedLogo') || 'mahou',
        appliedDecals: new URLSearchParams(window.location.search).get('appliedDecals') || '0'
      };
      setDesignData(designInfo);
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
        body: JSON.stringify(orderData)
      });

      if (response.ok) {
        window.location.href = '/pedido-exitoso';
      } else {
        alert('Error al procesar el pedido. Inténtalo de nuevo.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al enviar el pedido. Verifica tu conexión.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Finalizar Pedido
          </h1>
          <p className="text-gray-600">
            Camiseta Mahou personalizada - <span className="font-semibold text-green-600">GRATUITA</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-8">
          
          {/* Columna izquierda - Datos de contacto */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Datos de contacto */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                DATOS DE CONTACTO
              </h2>
              
              <div className="space-y-4">
                <div>
                  <input
                    type="text"
                    placeholder="Nombre completo"
                    value={contactData.nombre}
                    onChange={(e) => setContactData({...contactData, nombre: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    required
                  />
                </div>
                
                <div>
                  <input
                    type="email"
                    placeholder="tu@email.com"
                    value={contactData.email}
                    onChange={(e) => setContactData({...contactData, email: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Dirección de envío */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                DIRECCIÓN DE ENVÍO
              </h2>
              
              <div className="space-y-6">
                
                {/* Tipo de documento */}
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="tipoDocumento"
                      value="DNI"
                      checked={shippingData.tipoDocumento === 'DNI'}
                      onChange={(e) => setShippingData({...shippingData, tipoDocumento: e.target.value})}
                      className="mr-2"
                    />
                    <span>DNI</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="tipoDocumento"
                      value="CIF"
                      checked={shippingData.tipoDocumento === 'CIF'}
                      onChange={(e) => setShippingData({...shippingData, tipoDocumento: e.target.value})}
                      className="mr-2"
                    />
                    <span>CIF</span>
                  </label>
                </div>

                {/* Número de documento */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {shippingData.tipoDocumento}*
                  </label>
                  <input
                    type="text"
                    placeholder="12345678A"
                    value={shippingData.documento}
                    onChange={(e) => setShippingData({...shippingData, documento: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    required
                  />
                </div>

                {/* Tipo de vía */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de vía*
                  </label>
                  <select
                    value={shippingData.tipoVia}
                    onChange={(e) => setShippingData({...shippingData, tipoVia: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  >
                    <option value="Calle">Calle</option>
                    <option value="Avenida">Avenida</option>
                    <option value="Plaza">Plaza</option>
                    <option value="Paseo">Paseo</option>
                    <option value="Carretera">Carretera</option>
                  </select>
                </div>

                {/* Dirección */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dirección*
                  </label>
                  <input
                    type="text"
                    placeholder="Nombre de la calle, número"
                    value={shippingData.direccion}
                    onChange={(e) => setShippingData({...shippingData, direccion: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    required
                  />
                </div>

                {/* Otros datos de dirección */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Otros datos de la dirección
                    </label>
                    <input
                      type="text"
                      placeholder="Piso, puerta, escalera..."
                      value={shippingData.otrosDatos}
                      onChange={(e) => setShippingData({...shippingData, otrosDatos: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Código postal*
                    </label>
                    <input
                      type="text"
                      placeholder="28001"
                      value={shippingData.codigoPostal}
                      onChange={(e) => setShippingData({...shippingData, codigoPostal: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      required
                    />
                  </div>
                </div>

                {/* Población y Provincia */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Población*
                    </label>
                    <input
                      type="text"
                      placeholder="Madrid"
                      value={shippingData.poblacion}
                      onChange={(e) => setShippingData({...shippingData, poblacion: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Provincia
                    </label>
                    <select
                      value={shippingData.provincia}
                      onChange={(e) => setShippingData({...shippingData, provincia: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    >
                      <option value="">Seleccionar provincia</option>
                      <option value="Madrid">Madrid</option>
                      <option value="Barcelona">Barcelona</option>
                      <option value="Valencia">Valencia</option>
                      <option value="Sevilla">Sevilla</option>
                      <option value="Bilbao">Bilbao</option>
                      {/* Agregar más provincias según necesites */}
                    </select>
                  </div>
                </div>

                {/* País y Teléfono */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      País*
                    </label>
                    <input
                      type="text"
                      value={shippingData.pais}
                      onChange={(e) => setShippingData({...shippingData, pais: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-gray-50"
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teléfono*
                    </label>
                    <input
                      type="tel"
                      placeholder="+34 123 456 789"
                      value={shippingData.telefono}
                      onChange={(e) => setShippingData({...shippingData, telefono: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      required
                    />
                  </div>
                </div>

                {/* Checkbox regalo */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="esRegalo"
                    className="mr-2"
                  />
                  <label htmlFor="esRegalo" className="text-sm text-gray-700">
                    ¿Es un regalo?
                  </label>
                </div>

              </div>
            </div>
          </div>

          {/* Columna derecha - Resumen del pedido */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
              
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                MI DISEÑO
              </h2>

              {/* Producto */}
              <div className="border-b border-gray-200 pb-4 mb-4">
                <div className="flex items-start space-x-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">👕</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">
                      CAMISETA MAHOU PERSONALIZADA
                    </h3>
                    <p className="text-sm text-gray-600">
                      Talla {designData?.talla || 'M'}
                    </p>
                    <p className="text-sm text-gray-600">
                      Logo en {designData?.logoPosition || 'Pecho centro'}
                    </p>
                    <p className="text-sm text-blue-600">
                      Calidad premium, 100% algodón
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600 text-lg">
                      GRATIS
                    </p>
                  </div>
                </div>
              </div>

              {/* Resumen de costes */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-green-600 font-medium">0,00€</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Impuestos</span>
                  <span className="text-green-600 font-medium">0,00€</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Gastos de envío Mahou San Miguel</span>
                  <span className="text-green-600 font-medium">GRATIS</span>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4 mt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">Subtotal</span>
                  <span className="text-2xl font-bold text-green-600">GRATIS</span>
                </div>
              </div>

              {/* Información VIP */}
              <div className="mt-6 bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <span className="text-yellow-600 mr-2">⭐</span>
                  <span className="font-semibold text-yellow-800">Información VIP</span>
                </div>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Entrega gratuita garantizada en 24-48 horas</li>
                  <li>• Logotipo Mahou San Miguel de alta calidad incluido</li>
                  <li>• Producto exclusivo del Santiago Bernabéu</li>
                  <li>• Calidad premium con personalización 3D</li>
                </ul>
              </div>

              {/* Botón de continuar */}
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-4 px-6 rounded-lg text-lg font-bold hover:from-red-700 hover:to-red-800 transition-all transform hover:scale-105 focus:ring-4 focus:ring-red-500 focus:ring-offset-2 shadow-lg mt-6"
              >
                🚀 CONTINUAR
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
};

export default CheckoutPage;
/* SECCIÓN DE FORMULARIO CORREGIDA - REEMPLAZAR EN TSHIRTDESIGNER.JSX */

        {/* Formulario de pedido */}
        <div className="mt-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-6 text-center">
              <span className="bg-gradient-to-r from-red-600 to-red-800 bg-clip-text text-transparent">
                Realizar Pedido con Diseño 3D
              </span>
            </h2>
            
            <form method="POST" action="/api/enviar-pedido" className="space-y-6">
              
              {/* Información del diseño */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
                <h3 className="font-semibold text-green-800 mb-2 flex items-center">
                  <span className="mr-2">🎯</span>
                  Tu Diseño 3D Personalizado
                </h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm text-green-700">
                  <ul className="space-y-1">
                    <li>✨ Renderizado 3D real con React Three Fiber</li>
                    <li>🎨 Logos aplicados dinámicamente</li>
                  </ul>
                  <ul className="space-y-1">
                    <li>📐 Posicionamiento preciso</li>
                    <li>💾 Datos exportables para producción</li>
                  </ul>
                </div>
                <div className="mt-3 p-3 bg-white rounded border">
                  <p className="text-sm font-medium text-gray-800">
                    Logos aplicados: {snap.appliedDecals.length} | 
                    Tecnología: React Three Fiber | 
                    Estado: Listo para exportar
                  </p>
                </div>
              </div>
              
              {/* Campos básicos del formulario */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    👤 Nombre completo *
                  </label>
                  <input
                    type="text"
                    name="nombre"
                    required
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    placeholder="Tu nombre completo"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    📧 Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    placeholder="tu@email.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    📞 Teléfono *
                  </label>
                  <input
                    type="tel"
                    name="telefono"
                    required
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    placeholder="+34 123 456 789"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    🏠 Dirección *
                  </label>
                  <input
                    type="text"
                    name="direccion"
                    required
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    placeholder="Calle, número, piso..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    🏙️ Ciudad *
                  </label>
                  <input
                    type="text"
                    name="ciudad"
                    required
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    placeholder="Madrid, Barcelona..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    📮 Código Postal *
                  </label>
                  <input
                    type="text"
                    name="codigoPostal"
                    required
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    placeholder="28001"
                  />
                </div>
              </div>
              
              {/* Comentarios adicionales */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  💬 Comentarios adicionales (opcional)
                </label>
                <textarea
                  name="comentarios"
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="Instrucciones especiales, preferencias de entrega..."
                />
              </div>
              
              {/* Campos ocultos con configuración del diseño */}
              <input type="hidden" name="talla" value={snap.designConfig.talla} />
              <input type="hidden" name="logoSize" value={snap.designConfig.logoSize} />
              <input type="hidden" name="logoPosition" value={snap.designConfig.logoPosition} />
              <input type="hidden" name="selectedLogo" value={snap.designConfig.selectedLogo} />
              <input type="hidden" name="diseñoImagen" value="" id="diseño-imagen-input" />
              
              {/* Botón de envío */}
              <div className="md:col-span-2">
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-4 px-6 rounded-lg text-xl font-bold hover:from-red-700 hover:to-red-800 transition-all transform hover:scale-105 focus:ring-4 focus:ring-red-500 focus:ring-offset-2 shadow-lg"
                >
                  🚀 REALIZAR PEDIDO CON DISEÑO 3D
                </button>
                
                {/* Garantías */}
                <div className="mt-4 text-center">
                  <div className="flex justify-center items-center space-x-6 text-sm text-gray-600">
                    <div className="flex items-center">
                      <span className="mr-1">🔒</span>
                      <span>Datos seguros</span>
                    </div>
                    <div className="flex items-center">
                      <span className="mr-1">⚛️</span>
                      <span>Tecnología 3D</span>
                    </div>
                    <div className="flex items-center">
                      <span className="mr-1">📞</span>
                      <span>Soporte 24/7</span>
                    </div>
                  </div>
                </div>
              </div>
              
            </form>
          </div>
        </div>
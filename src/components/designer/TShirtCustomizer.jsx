import React, { Suspense, useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree, extend } from '@react-three/fiber';
import { OrbitControls, useGLTF, Center, Decal } from '@react-three/drei';
import { proxy, useSnapshot } from 'valtio';
import * as THREE from 'three';
import { DecalGeometry } from 'three/examples/jsm/geometries/DecalGeometry.js';
import '../../styles/tshirt-designer.css';

// Extend Three.js con DecalGeometry
extend({ DecalGeometry });

// Estado global híbrido - combinando ambos proyectos
const state = proxy({
  // Configuración básica
  modelURL: '/models/tshirt_mangas.glb',
  selectedSize: 'M',
  selectedGender: 'masculino',
  
  // Color de la camiseta (del proyecto original)
  color: { r: 255, g: 255, b: 255 },
  
  // Logos y posiciones (híbrido)
  selectedPosition: null,
  selectedLogo: null,
  appliedLogos: {},
  
  // Estados de visualización (del proyecto original)
  isLogo: true,
  isFull: false,
  logoS: 1, // Tamaño del logo (0=pequeño, 1=medio, 2=grande)
  logoP: 2, // Posición del logo (0=izquierda, 1=centro, 2=derecha)
  
  // Texturas personalizadas
  logo: '/textures/mahou-logo.png',
  full: '/textures/full-pattern.jpg',
  customImage: null,
  
  // Control de estado
  canContinue: false,
  
  // Logos disponibles
  availableLogos: [
    { 
      id: 'mahou', 
      name: 'MAHOU', 
      url: '/textures/mahou-logo.png',
      fileName: 'mahou-logo',
      color: '#E30613' 
    },
    { 
      id: 'mahou-gray', 
      name: 'MAHOU GRAY', 
      url: '/textures/mahou-logo-gray.png',
      fileName: 'mahou-logo-gray',
      color: '#666666' 
    },
    {
      id: 'custom',
      name: 'PERSONALIZADO',
      url: null,
      fileName: 'custom',
      color: '#333333'
    }
  ]
});

// Helper functions del proyecto original
const canvasDownloader = () => {
  const link = document.createElement('a');
  link.setAttribute('download', 'camiseta-personalizada.png');
  
  const canvas = document.querySelector('canvas');
  if (canvas) {
    link.setAttribute('href', canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream'));
    link.click();
  }
};

const reader = (file) => {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    fileReader.onload = () => resolve(fileReader.result);
    fileReader.onerror = reject;
    fileReader.readAsDataURL(file);
  });
};

// Componente de camiseta híbrido
function Shirt(props) {
  const snap = useSnapshot(state);
  const { nodes, materials } = useGLTF('/models/short_sleeve_tshirt.glb');
  const meshRef = useRef();
  
  // Texturas
  const logoTexture = useMemo(() => {
    if (snap.customImage) {
      const texture = new THREE.TextureLoader().load(snap.customImage);
      texture.colorSpace = THREE.SRGBColorSpace;
      return texture;
    } else if (snap.logo) {
      const texture = new THREE.TextureLoader().load(snap.logo);
      texture.colorSpace = THREE.SRGBColorSpace;
      return texture;
    }
    return null;
  }, [snap.logo, snap.customImage]);
  
  const fullTexture = useMemo(() => {
    if (snap.full) {
      const texture = new THREE.TextureLoader().load(snap.full);
      texture.colorSpace = THREE.SRGBColorSpace;
      return texture;
    }
    return null;
  }, [snap.full]);
  
  // Análisis del modelo
  const modelAnalysis = useMemo(() => {
    if (!nodes || Object.keys(nodes).length === 0) return [];
    
    const meshes = [];
    Object.entries(nodes).forEach(([name, node]) => {
      if (node.geometry && node.geometry.attributes) {
        meshes.push({
          name,
          node,
          geometry: node.geometry,
          material: node.material
        });
      }
    });
    
    return meshes;
  }, [nodes]);
  
  // Función para generar posición del logo (del proyecto original)
  const genP = () => {
    switch (snap.logoP) {
      case 0: return -0.075;
      case 1: return 0;
      case 2: return 0.075;
      default: return 0;
    }
  };
  
  // Función para generar escala del logo (del proyecto original)
  const genS = () => {
    switch (snap.logoS) {
      case 0: return 0.09;
      case 1: return 0.12;
      case 2: return 0.17;
      default: return 0.12;
    }
  };
  
  if (!modelAnalysis.length) {
    return (
      <mesh ref={meshRef}>
        <boxGeometry args={[1, 1.5, 0.1]} />
        <meshStandardMaterial color={`rgb(${snap.color.r}, ${snap.color.g}, ${snap.color.b})`} />
      </mesh>
    );
  }
  
  return (
    <group ref={meshRef} scale={[0.02, 0.02, 0.02]} position={[0, 0, 0]} {...props}>
      {modelAnalysis.map((meshData, index) => (
        <mesh 
          key={`mesh-${index}-${meshData.name}`}
          geometry={meshData.node.geometry}
          material={new THREE.MeshStandardMaterial({
            color: new THREE.Color(snap.color.r / 255, snap.color.g / 255, snap.color.b / 255),
            roughness: 0.8,
            metalness: 0.1,
            side: THREE.DoubleSide
          })}
        >
          {snap.isFull && fullTexture && (
            <Decal 
              position={[0, 0, 0]} 
              rotation={[0, 0, 0]} 
              scale={1}
              map={fullTexture}
            />
          )}
          
          {snap.isLogo && logoTexture && (
            <Decal
              position={[genP(), 0.08, 0.13]}
              rotation={[0, 0, 0]}
              scale={genS()}
              map={logoTexture}
              depthTest={true}
            />
          )}
        </mesh>
      ))}
    </group>
  );
}

// Escena 3D
function Scene() {
  return (
    <Canvas 
      camera={{ 
        position: [0, 0, 4], 
        fov: 50,
        near: 0.1,
        far: 1000
      }}
      gl={{ 
        antialias: true, 
        alpha: true,
        powerPreference: "high-performance"
      }}
      style={{ background: 'transparent' }}
    >
      <ambientLight intensity={0.7} />
      <directionalLight 
        position={[5, 5, 5]} 
        intensity={0.8} 
        castShadow
      />
      <directionalLight position={[-5, 5, 5]} intensity={0.4} />
      <pointLight position={[0, -5, 2]} intensity={0.3} />
      
      <Center>
        <Shirt />
      </Center>
      
      <OrbitControls 
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={2}
        maxDistance={8}
        maxPolarAngle={Math.PI}
        minPolarAngle={0}
        enableDamping={true}
        dampingFactor={0.1}
        target={[0, 0, 0]}
      />
    </Canvas>
  );
}

// Selector de colores
function ColorPicker() {
  const snap = useSnapshot(state);
  
  const predefinedColors = [
    { r: 255, g: 255, b: 255, name: 'Blanco' },
    { r: 0, g: 0, b: 0, name: 'Negro' },
    { r: 227, g: 6, b: 19, name: 'Rojo Mahou' },
    { r: 0, g: 123, b: 255, name: 'Azul' },
    { r: 40, g: 167, b: 69, name: 'Verde' },
    { r: 255, g: 193, b: 7, name: 'Amarillo' },
    { r: 108, g: 117, b: 125, name: 'Gris' },
    { r: 220, g: 53, b: 69, name: 'Rojo' }
  ];
  
  const changeColor = (color) => {
    state.color = color;
  };
  
  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-gray-900">Color de la Camiseta</h4>
      <div className="grid grid-cols-4 gap-2">
        {predefinedColors.map((color, index) => (
          <button
            key={index}
            onClick={() => changeColor(color)}
            className={`w-12 h-12 rounded-lg border-2 transition-all ${
              snap.color.r === color.r && snap.color.g === color.g && snap.color.b === color.b
                ? 'border-blue-500 scale-110'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            style={{ backgroundColor: `rgb(${color.r}, ${color.g}, ${color.b})` }}
            title={color.name}
          />
        ))}
      </div>
    </div>
  );
}

// Selector de archivos
function FilePicker() {
  const snap = useSnapshot(state);
  const fileInputRef = useRef();
  
  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      try {
        const result = await reader(file);
        state.customImage = result;
        state.logo = result;
      } catch (error) {
        console.error('Error al leer archivo:', error);
      }
    }
  };
  
  const selectPresetLogo = (logoData) => {
    state.selectedLogo = logoData;
    state.logo = logoData.url;
    state.customImage = null;
  };
  
  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-gray-900">Seleccionar Logo</h4>
      
      <div className="grid grid-cols-2 gap-2">
        {state.availableLogos.filter(logo => logo.id !== 'custom').map(logo => (
          <button
            key={logo.id}
            onClick={() => selectPresetLogo(logo)}
            className={`p-2 rounded-lg border-2 transition-all ${
              snap.selectedLogo?.id === logo.id
                ? 'border-red-500 bg-red-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <div className="flex items-center justify-center mb-1">
              <div 
                className="w-4 h-4 rounded"
                style={{ backgroundColor: logo.color }}
              />
            </div>
            <p className="text-xs font-medium text-center">{logo.name}</p>
          </button>
        ))}
      </div>
      
      <div>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
        >
          <div className="text-center">
            <p className="text-sm font-medium text-gray-700">Cargar Imagen</p>
            <p className="text-xs text-gray-500">PNG, JPG hasta 5MB</p>
          </div>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
      
      {snap.customImage && (
        <div className="mt-2">
          <p className="text-xs text-gray-600 mb-1">Vista previa:</p>
          <img 
            src={snap.customImage} 
            alt="Vista previa" 
            className="w-full h-20 object-cover rounded-lg border"
          />
        </div>
      )}
    </div>
  );
}

// Componente de controles
function ControlPanel() {
  const snap = useSnapshot(state);
  const [activeTab, setActiveTab] = useState(0);
  
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab(activeTab === 1 ? 0 : 1)}
          className={`flex-1 p-3 rounded-lg border-2 transition-all ${
            activeTab === 1 ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <div className="text-center">
            <div className="w-6 h-6 mx-auto mb-1 bg-gradient-to-r from-red-500 to-blue-500 rounded"></div>
            <p className="text-xs font-medium">Color</p>
          </div>
        </button>
        
        <button
          onClick={() => setActiveTab(activeTab === 2 ? 0 : 2)}
          className={`flex-1 p-3 rounded-lg border-2 transition-all ${
            activeTab === 2 ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <div className="text-center">
            <div className="w-6 h-6 mx-auto mb-1 bg-gray-400 rounded flex items-center justify-center">
              <span className="text-white text-xs">📁</span>
            </div>
            <p className="text-xs font-medium">Imagen</p>
          </div>
        </button>
        
        <button
          onClick={() => setActiveTab(activeTab === 3 ? 0 : 3)}
          className={`flex-1 p-3 rounded-lg border-2 transition-all ${
            activeTab === 3 ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <div className="text-center">
            <div className="w-6 h-6 mx-auto mb-1 bg-green-400 rounded flex items-center justify-center">
              <span className="text-white text-xs">📍</span>
            </div>
            <p className="text-xs font-medium">Posición</p>
          </div>
        </button>
      </div>
      
      {activeTab === 1 && (
        <div className="bg-white p-4 rounded-lg border">
          <ColorPicker />
        </div>
      )}
      
      {activeTab === 2 && (
        <div className="bg-white p-4 rounded-lg border">
          <FilePicker />
        </div>
      )}
      
      {activeTab === 3 && (
        <div className="bg-white p-4 rounded-lg border">
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-900">Configuración del Logo</h4>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Mostrar Logo</span>
              <button
                onClick={() => { state.isLogo = !state.isLogo; }}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  snap.isLogo 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {snap.isLogo ? 'Visible' : 'Oculto'}
              </button>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Posición Horizontal
              </label>
              <div className="flex gap-2">
                {[
                  { value: 0, label: 'Izq.' },
                  { value: 1, label: 'Centro' },
                  { value: 2, label: 'Der.' }
                ].map(pos => (
                  <button
                    key={pos.value}
                    onClick={() => { state.logoP = pos.value; }}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-colors ${
                      snap.logoP === pos.value
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {pos.label}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tamaño del Logo
              </label>
              <div className="flex gap-2">
                {[
                  { value: 0, label: 'Pequeño' },
                  { value: 1, label: 'Medio' },
                  { value: 2, label: 'Grande' }
                ].map(size => (
                  <button
                    key={size.value}
                    onClick={() => { state.logoS = size.value; }}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-colors ${
                      snap.logoS === size.value
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {size.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Componente principal
export default function TShirtCustomizer() {
  const snap = useSnapshot(state);
  
  const handleDownload = () => {
    canvasDownloader();
  };
  
  const goToCheckout = () => {
    const designData = {
      color: snap.color,
      appliedLogos: snap.appliedLogos,
      selectedSize: snap.selectedSize,
      selectedGender: snap.selectedGender,
      logoSettings: {
        isLogo: snap.isLogo,
        logoP: snap.logoP,
        logoS: snap.logoS,
        logo: snap.logo
      },
      timestamp: new Date().toISOString()
    };
    
    localStorage.setItem('tshirtDesign', JSON.stringify(designData));
    
    const params = new URLSearchParams({
      talla: snap.selectedSize,
      genero: snap.selectedGender,
      color: `${snap.color.r},${snap.color.g},${snap.color.b}`,
      logoCount: Object.keys(snap.appliedLogos).length + (snap.isLogo ? 1 : 0)
    });
    
    window.location.href = `/checkout?${params.toString()}`;
  };
  
  return (
    <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
      
      <div className="lg:col-span-2 order-2 lg:order-1">
        <div 
          className="relative w-full bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl shadow-lg overflow-hidden"
          style={{ height: '600px' }}
        >
          <Suspense fallback={
            <div className="flex items-center justify-center h-full text-gray-600">
              <div className="text-center">
                <p>Cargando personalizador 3D...</p>
                <p className="text-xs mt-2">Proyecto híbrido React + Three.js</p>
              </div>
            </div>
          }>
            <Scene />
          </Suspense>
          
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
            <div 
              className="flex items-center gap-4 px-6 py-3 rounded-full bg-black/50 backdrop-blur-sm border-2"
              style={{ borderColor: `rgb(${snap.color.r}, ${snap.color.g}, ${snap.color.b})` }}
            >
              <button
                onClick={() => { state.isLogo = !state.isLogo; }}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  snap.isLogo 
                    ? 'bg-white text-black' 
                    : 'bg-transparent text-white border border-white/30'
                }`}
              >
                LOGO
              </button>
              
              <button
                onClick={() => { state.isFull = !state.isFull; }}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  snap.isFull 
                    ? 'bg-white text-black' 
                    : 'bg-transparent text-white border border-white/30'
                }`}
              >
                FULL
              </button>
              
              <button
                onClick={handleDownload}
                className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold bg-transparent text-white border border-white/30 hover:bg-white hover:text-black transition-colors"
              >
                💾
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="lg:col-span-1 order-1 lg:order-2 space-y-6">
        
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Configuración
          </h3>
          
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Talla
            </label>
            <select
              value={snap.selectedSize}
              onChange={(e) => { state.selectedSize = e.target.value; }}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-200"
            >
              <option value="XS">XS</option>
              <option value="S">S</option>
              <option value="M">M</option>
              <option value="L">L</option>
              <option value="XL">XL</option>
              <option value="XXL">XXL</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Género
            </label>
            <div className="flex gap-3">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="gender"
                  value="masculino"
                  checked={snap.selectedGender === 'masculino'}
                  onChange={(e) => { state.selectedGender = e.target.value; }}
                  className="mr-2"
                />
                <span className="text-sm font-medium">Masculino</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="gender"
                  value="femenino"
                  checked={snap.selectedGender === 'femenino'}
                  onChange={(e) => { state.selectedGender = e.target.value; }}
                  className="mr-2"
                />
                <span className="text-sm font-medium">Femenino</span>
              </label>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Personalización
          </h3>
          <ControlPanel />
        </div>
        
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Estado del Diseño</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Color actual:</span>
              <div 
                className="w-8 h-8 rounded-full border-2 border-gray-300"
                style={{ backgroundColor: `rgb(${snap.color.r}, ${snap.color.g}, ${snap.color.b})` }}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Talla:</span>
              <span className="text-sm font-bold text-blue-600">{snap.selectedSize}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Género:</span>
              <span className="text-sm font-bold text-blue-600">{snap.selectedGender}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Logo visible:</span>
              <span className={`text-sm font-bold ${snap.isLogo ? 'text-green-600' : 'text-gray-400'}`}>
                {snap.isLogo ? 'Sí' : 'No'}
              </span>
            </div>
            
            {snap.isLogo && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Posición:</span>
                  <span className="text-sm text-gray-600">
                    {snap.logoP === 0 ? 'Izquierda' : snap.logoP === 1 ? 'Centro' : 'Derecha'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Tamaño:</span>
                  <span className="text-sm text-gray-600">
                    {snap.logoS === 0 ? 'Pequeño' : snap.logoS === 1 ? 'Medio' : 'Grande'}
                  </span>
                </div>
              </>
            )}
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Patrón completo:</span>
              <span className={`text-sm font-bold ${snap.isFull ? 'text-green-600' : 'text-gray-400'}`}>
                {snap.isFull ? 'Activo' : 'Inactivo'}
              </span>
            </div>
            
            {snap.customImage && (
              <div className="border-t border-gray-200 pt-3">
                <p className="text-sm font-medium text-gray-700 mb-2">Imagen personalizada:</p>
                <img 
                  src={snap.customImage} 
                  alt="Personalizada" 
                  className="w-full h-16 object-cover rounded-lg border"
                />
              </div>
            )}
          </div>
        </div>
        
        <div className="space-y-3">
          <button
            onClick={handleDownload}
            className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-xl transition-colors"
          >
            📥 Descargar Imagen
          </button>
          
          <div className="squircle-bg rounded-lg bg-zinc-900">
            <button
              onClick={goToCheckout}
              className="flex h-12 w-full items-center justify-center px-4 py-2 text-lg text-slate-200 transition-all hover:text-white font-bold"
            >
              Continuar al Checkout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Precargar modelo
useGLTF.preload('/models/short_sleeve_tshirt.glb');
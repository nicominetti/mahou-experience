import React, { Suspense, useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree, extend } from '@react-three/fiber';
import { OrbitControls, useGLTF, Center, Decal } from '@react-three/drei';
import { proxy, useSnapshot } from 'valtio';
import * as THREE from 'three';
import { DecalGeometry } from 'three/examples/jsm/geometries/DecalGeometry.js';
import '../../styles/tshirt-designer.css';

// Extend Three.js con DecalGeometry
extend({ DecalGeometry });

// Estado global con funcionalidad de mangas integrada + mejoras
const state = proxy({
  modelURL: '/models/tshirt_mangas.glb',
  selectedSize: 'M',
  selectedGender: 'masculino',
  color: { r: 255, g: 255, b: 255 },
  selectedPosition: null, // Sin selección inicial
  selectedLogo: null,
  appliedLogos: {
    frente: null,
    pecho: null, 
    espalda: null,
    manga_izquierda: null,
    manga_derecha: null
  },
  logoS: 1, // Tamaño del logo (0=pequeño, 1=medio, 2=grande)
  
  // Computed property para canContinue
  get canContinue() {
    return Object.values(this.appliedLogos).some(logo => logo !== null);
  },
  
  // Control de cámara para rotación automática
  cameraTarget: { x: 0, y: 0, z: 0 },
  cameraPosition: { x: 0, y: 0, z: 3 },
  availableLogos: [
    { 
      id: 'mahou', 
      name: 'Mahou', 
      url: '/textures/mahou_red.png',
      fileName: 'mahou_red',
      color: '#E30613' 
    },
    { 
      id: 'mahou_futbol', 
      name: 'Mahou Fútbol', 
      url: '/textures/mahou_futbol.png',
      fileName: 'mahou_futbol',
      color: '#ffffff' 
    }
  ],
  availablePositions: [
    { id: 'frente', name: 'Frente', icon: '🎯', camera: { position: [0, 0, 3], target: [0, 0, 0] } },
    { id: 'pecho', name: 'Pecho', icon: '💚', camera: { position: [0, 0.5, 2.5], target: [0, 0, 0] } },
    { id: 'espalda', name: 'Espalda', icon: '🔄', camera: { position: [0, 0, -3], target: [0, 0, 0] } },
    { id: 'manga_izquierda', name: 'Manga Izquierda', icon: '👈', camera: { position: [3, 0, 0], target: [0, 0, 0] } },
    { id: 'manga_derecha', name: 'Manga Derecha', icon: '👉', camera: { position: [-3, 0, 0], target: [0, 0, 0] } }
  ]
});

// Helper functions
const reader = (file) => {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    fileReader.onload = () => resolve(fileReader.result);
    fileReader.onerror = reject;
    fileReader.readAsDataURL(file);
  });
};

// Componente de camiseta simplificado
function TShirtWithSleeves(props) {
  const snap = useSnapshot(state);
  const { nodes, materials } = useGLTF('/models/tshirt_mangas.glb');
  const meshRef = useRef();
  
  // Función para obtener posición del decal
  const getDecalPosition = (position) => {
    switch (position) {
      case 'frente': return [0, 0.04, 0.15];
      case 'pecho': return [0.1, 0.12, 0.13];
      case 'espalda': return [0, 0.08, -0.12]; // Más arriba y corregida posición
      case 'manga_izquierda': return [0.22, 0.08, 0.02];  // Ajustada: menos lateral para evitar corte
      case 'manga_derecha': return [-0.25, 0.08, 0.02];  // Mantiene posición que funciona bien
      default: return [0, 0.04, 0.15];
    }
  };
  
  // Función para obtener rotación del decal
  const getDecalRotation = (position) => {
    switch (position) {
      case 'espalda': return [0, Math.PI, 0]; // 180° para corregir espejado
      case 'manga_izquierda': return [0, Math.PI / 2.1, 0];
      case 'manga_derecha': return [0, -Math.PI / 2.1, 0];
      default: return [0, 0, 0];
    }
  };
  
  // Función para obtener escala del decal
  const getDecalScale = (position) => {
    let baseScale;
    switch (snap.logoS) {
      case 0: baseScale = 0.06; break;
      case 1: baseScale = 0.09; break;
      case 2: baseScale = 0.12; break;
      default: baseScale = 0.06;
    }
    
    // Para mangas: logo más pequeño para que quepa bien
    if (position === 'manga_izquierda' || position === 'manga_derecha') {
      return baseScale * 0.6; // Más pequeño para evitar cortes
    }
    if (position === 'pecho') {
      return baseScale * 0.6; // Más pequeño para evitar cortes
    }

    
    return baseScale;
  };
  
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
  
  if (!modelAnalysis.length) {
    return (
      <mesh ref={meshRef}>
        <boxGeometry args={[1, 1.5, 0.1]} />
        <meshStandardMaterial color={`rgb(${snap.color.r}, ${snap.color.g}, ${snap.color.b})`} />
      </mesh>
    );
  }
  
  return (
    <group ref={meshRef} scale={[1, 1, 1]} position={[0, -1, 0]} {...props}>
      {modelAnalysis.map((meshData, index) => (
        <mesh 
          key={`mesh-${index}-${meshData.name}`}
          geometry={meshData.node.geometry}
          material={meshData.material || new THREE.MeshStandardMaterial({
            color: new THREE.Color(snap.color.r / 255, snap.color.g / 255, snap.color.b / 255),
            roughness: 0.8,
            metalness: 0.1,
            side: THREE.DoubleSide
          })}
        >
          {/* Renderizar decals para todas las posiciones */}
          {Object.entries(snap.appliedLogos).map(([position, logo]) => {
            if (logo) {
              const logoTex = new THREE.TextureLoader().load(logo.url);
              logoTex.colorSpace = THREE.SRGBColorSpace;
              
              return (
                <Decal
                  key={`decal-${position}`}
                  position={getDecalPosition(position)}
                  rotation={getDecalRotation(position)}
                  scale={getDecalScale(position)}
                  map={logoTex}
                  depthTest={true}
                  transparent={true}
                />
              );
            }
            return null;
          })}
        </mesh>
      ))}
    </group>
  );
}

// Escena 3D con rotación automática
function Scene() {
  const snap = useSnapshot(state);
  const controlsRef = useRef();
  
  // Animación de cámara cuando cambia la posición seleccionada
  useEffect(() => {
    if (controlsRef.current) {
      const selectedPos = state.availablePositions.find(p => p.id === snap.selectedPosition);
      if (selectedPos && selectedPos.camera) {
        const controls = controlsRef.current;
        
        // Animar la posición de la cámara
        const startPos = controls.object.position.clone();
        const endPos = new THREE.Vector3(...selectedPos.camera.position);
        const startTarget = controls.target.clone();
        const endTarget = new THREE.Vector3(...selectedPos.camera.target);
        
        let startTime = Date.now();
        const duration = 1000; // 1 segundo de animación
        
        const animate = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);
          
          // Interpolación suave (easing)
          const easeProgress = 1 - Math.pow(1 - progress, 3);
          
          // Interpolar posición de cámara
          controls.object.position.lerpVectors(startPos, endPos, easeProgress);
          
          // Interpolar target
          controls.target.lerpVectors(startTarget, endTarget, easeProgress);
          
          controls.update();
          
          if (progress < 1) {
            requestAnimationFrame(animate);
          }
        };
        
        animate();
      }
    }
  }, [snap.selectedPosition]);
  
  return (
    <Canvas 
      camera={{ 
        position: [0, 0, 3], 
        fov: 15,
        near: 0.8,
        far: 20
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
        <TShirtWithSleeves />
      </Center>
      
      <OrbitControls 
        ref={controlsRef}
        enablePan={true}
        enableZoom={false}
        enableRotate={true}
        minDistance={2}
        maxDistance={4}
        maxPolarAngle={Math.PI}
        minPolarAngle={0}
        enableDamping={true}
        dampingFactor={0.1}
        target={[0, 0, 0]}
      />
    </Canvas>
  );
}

// Selector de posiciones
function PositionSelector() {
  const snap = useSnapshot(state);
  
  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-gray-900">Posición del Logo</h4>
      <div className="grid grid-cols-2 gap-2">
        {state.availablePositions.map(position => (
          <button
            key={position.id}
            onClick={() => { state.selectedPosition = position.id; }}
            className={`p-3 rounded-lg border-2 transition-all ${
              snap.selectedPosition === position.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <div className="text-center">
              <div className="text-lg mb-1">{position.icon}</div>
              <p className="text-xs font-medium">{position.name}</p>
              {snap.appliedLogos[position.id] && (
                <div className="w-2 h-2 bg-green-500 rounded-full mx-auto mt-1"></div>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// Selector de logos
function LogoSelector() {
  const snap = useSnapshot(state);
  const fileInputRef = useRef();
  
  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      try {
        const result = await reader(file);
        state.selectedLogo = {
          id: 'custom',
          name: 'PERSONALIZADO',
          url: result,
          fileName: 'custom',
          color: '#333333'
        };
      } catch (error) {
        console.error('Error al leer archivo:', error);
      }
    }
  };
  
  const selectPresetLogo = (logoData) => {
    state.selectedLogo = logoData;
  };
  
  return (
    <div className="space-y-4">
      
      
      <div className="grid grid-cols-2 gap-2">
        {state.availableLogos.map(logo => (
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
      
      {snap.selectedLogo && snap.selectedPosition && (
        <div>
          {/* Botón aplicar ya está en ControlPanel como ApplyLogoButton */}
        </div>
      )}
    </div>
  );
}

// Componente del botón aplicar que aparece condicionalmente
function ApplyLogoButton() {
  const snap = useSnapshot(state);
  
  const handleApplyLogo = () => {
    if (snap.selectedLogo && snap.selectedPosition) {
      // Aplicar el logo en la posición seleccionada
      state.appliedLogos[snap.selectedPosition] = snap.selectedLogo;
      
      // Limpiar selección para próxima aplicación
      state.selectedLogo = null;
      
      console.log(`✅ Logo aplicado en ${snap.selectedPosition}`);
    }
  };

  const handleRemoveLogo = () => {
    if (snap.selectedPosition && snap.appliedLogos[snap.selectedPosition]) {
      state.appliedLogos[snap.selectedPosition] = null;
      console.log(`❌ Logo removido de ${snap.selectedPosition}`);
    }
  };

  const hasLogoInPosition = snap.appliedLogos[snap.selectedPosition];
  const positionName = state.availablePositions.find(p => p.id === snap.selectedPosition)?.name;

  return (
    <div className="space-y-2">
      {hasLogoInPosition ? (
        // Botón para remover logo existente
        <button
          onClick={handleRemoveLogo}
          className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02]"
        >
          🗑️ Remover Logo de {positionName}
        </button>
      ) : (
        // Botón para aplicar nuevo logo
        <button
          onClick={handleApplyLogo}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02]"
        >
          ✨ Aplicar a {positionName}
        </button>
      )}
    </div>
  );
}

// Panel de control reorganizado - sin pestañas, todo en una card
function ControlPanel() {
  const snap = useSnapshot(state);
  
  return (
    <div className="space-y-6">
      {/* 1. SELECTOR DE LOGO (PRIMERO) */}
      <div>
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Seleccionar Logo</h4>
        <LogoSelector />
      </div>

      {/* 2. POSICIÓN DEL LOGO (SEGUNDO) */}
      <div>        
        <PositionSelector />
      </div>

      {/* 3. BOTÓN APLICAR (aparece solo si hay logo y posición seleccionados) */}
      {snap.selectedLogo && snap.selectedPosition && (
        <div>
          <ApplyLogoButton />
        </div>
      )}

      {/* 4. TALLA (SELECT ESTILO CHECKOUT) */}
      <div>
        <h4 className="text-sm font-semibold text-gray-900 mb-2">Talla</h4>
        <select
          value={snap.selectedSize}
          onChange={(e) => { state.selectedSize = e.target.value; }}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="XS">XS</option>
          <option value="S">S</option>
          <option value="M">M</option>
          <option value="L">L</option>
          <option value="XL">XL</option>
          <option value="XXL">XXL</option>
        </select>
      </div>

      {/* 5. GÉNERO (SELECT ESTILO CHECKOUT) */}
      <div>
        <h4 className="text-sm font-semibold text-gray-900 mb-2">Género</h4>
        <select
          value={snap.selectedGender}
          onChange={(e) => { state.selectedGender = e.target.value; }}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="masculino">👨 Masculino</option>
          <option value="femenino">👩 Femenino</option>
          <option value="unisex">👤 Unisex</option>
        </select>
      </div>

      {/* 6. ESTADO DEL DISEÑO (AL FINAL) */}
      <div className="border-t pt-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Estado del Diseño</h4>
        <div className="space-y-3">      
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Talla:</span>
            <span className="text-sm font-bold text-blue-600">{snap.selectedSize}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Posición seleccionada:</span>
            <span className="text-sm font-bold text-blue-600">
              {state.availablePositions.find(p => p.id === snap.selectedPosition)?.name || 'Ninguna'}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Logos aplicados:</span>
            <span className="text-sm font-bold text-green-600">
              {Object.values(snap.appliedLogos).filter(logo => logo !== null).length}
            </span>
          </div>
          
          {Object.entries(snap.appliedLogos).map(([position, logo]) => {
            if (logo) {
              const positionName = state.availablePositions.find(p => p.id === position)?.name;
              return (
                <div key={position} className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">📍 {positionName}:</span>
                  <span className="font-medium text-green-600">{logo.name}</span>
                </div>
              );
            }
            return null;
          })}
        </div>
      </div>
    </div>
  );
}

// Componente principal
export default function TShirtCustomizer() {
  const snap = useSnapshot(state);  
  const goToCheckout = () => {
    // Preparar datos completos para el checkout
    const checkoutData = {
      // Configuración de la camiseta
      color: {
        r: snap.color.r,
        g: snap.color.g,
        b: snap.color.b,
        hex: `#${snap.color.r.toString(16).padStart(2,'0')}${snap.color.g.toString(16).padStart(2,'0')}${snap.color.b.toString(16).padStart(2,'0')}`
      },
      size: snap.selectedSize,
      gender: snap.selectedGender,
      
      // Logos aplicados
      appliedLogos: snap.appliedLogos,
      logoSize: snap.logoS,
      
      // Timestamp y otros datos
      timestamp: new Date().toISOString(),
      modelURL: snap.modelURL,
      
      // Resumen para mostrar en checkout
      summary: {
        totalLogos: Object.values(snap.appliedLogos).filter(logo => logo !== null).length,
        positions: Object.entries(snap.appliedLogos)
          .filter(([_, logo]) => logo !== null)
          .map(([position, logo]) => ({
            position: state.availablePositions.find(p => p.id === position)?.name,
            logo: logo.name
          }))
      }
    };
    
    // Guardar en localStorage para persistencia
    try {
      localStorage.setItem('mahou_checkout_data', JSON.stringify(checkoutData));
      console.log('✅ Datos guardados para checkout:', checkoutData);
      
      // Redirigir al checkout
      window.location.href = '/checkout';
    } catch (error) {
      console.error('❌ Error al guardar datos:', error);
      // Fallback: redirigir con parámetros en URL
      const params = new URLSearchParams({
        size: snap.selectedSize,
        gender: snap.selectedGender,
        color: checkoutData.color.hex,
        logos: checkoutData.summary.totalLogos.toString()
      });
      window.location.href = `/checkout?${params.toString()}`;
    }
  };
  
  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-[80vh]">
      {/* Visor 3D */}
      <div className="flex-1 overflow-hidden">
        <div className="h-[500px] lg:h-full relative">
          <Suspense fallback={
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-600">Cargando modelo 3D...</p>
              </div>
            </div>
          }>
            <Scene />
          </Suspense>
        </div>
      </div>
      
      {/* Panel de controles */}
      <div className="w-full lg:w-96 space-y-6">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Personalización
          </h3>
          <ControlPanel />
        </div>
        
        {/* Botón de Checkout */}
        <div className="space-y-3">         
          <div className="squircle-bg rounded-lg bg-zinc-900">
            <button
              onClick={goToCheckout}
              disabled={!snap.canContinue}
              className={`flex h-12 w-full items-center justify-center px-4 py-2 text-lg transition-all font-bold rounded-lg ${
                snap.canContinue 
                  ? 'text-slate-200 hover:text-white bg-zinc-900 hover:bg-zinc-800' 
                  : 'text-gray-400 bg-gray-300 cursor-not-allowed'
              }`}
            >
              {snap.canContinue ? 'Continuar al Checkout' : 'Aplica al menos un logo'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Precargar modelo
useGLTF.preload('/models/tshirt_mangas.glb');

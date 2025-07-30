import React, { Suspense, useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree, extend } from '@react-three/fiber';
import { OrbitControls, useGLTF, Center } from '@react-three/drei';
import { proxy, useSnapshot } from 'valtio';
import * as THREE from 'three';
import { DecalGeometry } from 'three/examples/jsm/geometries/DecalGeometry.js';
import '../../styles/tshirt-designer.css';

// Extend Three.js con DecalGeometry
extend({ DecalGeometry });

// Estado global
const state = proxy({
  modelURL: '/models/short_sleeve_tshirt.glb',
  color: '#FFFFFF',
  selectedSize: 'M',
  selectedGender: 'masculino',
  selectedPosition: null,
  selectedLogo: null,
  appliedLogos: {},
  canContinue: false,
  
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
    }
  ],
  
  printPositions: {
    FRONT: {
      name: 'Frente',
      size: '280mm x 400mm',
      position: [0, 0, 0.5],
      rotation: [0, 0, 0],
      scale: 0.3,
      conflictsWith: 'CHEST'
    },
    BACK: {
      name: 'Espalda', 
      size: '280mm x 400mm',
      position: [0, 0, -0.5],
      rotation: [0, Math.PI, 0],
      scale: 0.3,
      conflictsWith: null
    },
    CHEST: {
      name: 'Pecho',
      size: '100mm x 70mm',
      position: [-0.2, 0.3, 0.5],
      rotation: [0, 0, 0],
      scale: 0.15,
      conflictsWith: 'FRONT'
    },
    ARM_RIGHT: {
      name: 'Manga Der.',
      size: '100mm x 70mm',
      position: [0.6, 0.2, 0.1],
      rotation: [0, -0.3, 0],
      scale: 0.2,
      conflictsWith: null
    },
    ARM_LEFT: {
      name: 'Manga Izq.', 
      size: '100mm x 70mm',
      position: [-0.6, 0.2, 0.1],
      rotation: [0, 0.3, 0],
      scale: 0.2,
      conflictsWith: null
    }
  }
});

// Función para crear textura SVG Mahou desde archivo
function createMahouSVGTexture() {
  return new Promise((resolve, reject) => {
    // Cargar el SVG desde public
    fetch('/mahou_red.svg')
      .then(response => {
        if (!response.ok) {
          throw new Error(`No se pudo cargar el SVG: ${response.status}`);
        }
        return response.text();
      })
      .then(svgString => {
        console.log('✅ SVG Mahou cargado desde public:', svgString.substring(0, 100) + '...');
        
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml' });
        const svgUrl = URL.createObjectURL(svgBlob);
        
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = function() {
          const canvas = document.createElement('canvas');
          canvas.width = 512;
          canvas.height = 512;
          const ctx = canvas.getContext('2d');
          
          // Fondo transparente
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          // Dibujar SVG escalado
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          const texture = new THREE.CanvasTexture(canvas);
          texture.needsUpdate = true;
          texture.flipY = false;
          texture.format = THREE.RGBAFormat;
          
          URL.revokeObjectURL(svgUrl);
          console.log('✅ Textura SVG Mahou real creada desde public');
          resolve(texture);
        };
        
        img.onerror = function() {
          URL.revokeObjectURL(svgUrl);
          console.error('❌ Error al cargar imagen SVG');
          reject(new Error('Error al cargar imagen SVG'));
        };
        
        img.src = svgUrl;
      })
      .catch(error => {
        console.error('❌ Error al cargar SVG desde public:', error);
        // Fallback al SVG simple
        createFallbackSVGTexture().then(resolve).catch(reject);
      });
  });
}

// Función fallback con SVG simple
function createFallbackSVGTexture() {
  console.log('🔄 Usando SVG fallback...');
  
  const svgString = `
    <svg width="256" height="256" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style>
          .mahou-text { 
            font-family: Arial, sans-serif; 
            font-weight: bold; 
            fill: #e30613; 
            font-size: 32px;
          }
        </style>
      </defs>
      
      <!-- Logo Mahou simple -->
      <rect x="0" y="0" width="256" height="256" fill="white" opacity="0"/>
      <text x="128" y="140" text-anchor="middle" class="mahou-text">MAHOU</text>
    </svg>
  `;
  
  return new Promise((resolve) => {
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml' });
    const svgUrl = URL.createObjectURL(svgBlob);
    
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = function() {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      const texture = new THREE.CanvasTexture(canvas);
      texture.needsUpdate = true;
      texture.flipY = false;
      
      URL.revokeObjectURL(svgUrl);
      console.log('✅ Textura SVG fallback creada');
      resolve(texture);
    };
    img.src = svgUrl;
  });
}

// Componente DecalGeometry ESPECÍFICO para cada manga
function SleeveDecals({ tshirtMesh, sleeveSide }) {
  const [mahoutexture, setMahouTexture] = useState(null);
  const { scene } = useThree();
  const decalsRef = useRef([]);
  
  useEffect(() => {
    createMahouSVGTexture().then(texture => {
      setMahouTexture(texture);
      console.log(`✅ Textura SVG lista para manga ${sleeveSide}`);
    });
  }, [sleeveSide]);
  
  useEffect(() => {
    if (!mahoutexture || !tshirtMesh || !scene) {
      console.log(`⚠️ Esperando recursos para manga ${sleeveSide}`);
      return;
    }
    
    console.log(`🎯 Aplicando DecalGeometry en manga ${sleeveSide}`);
    console.log(`📊 Mesh: ${tshirtMesh.name}, vértices: ${tshirtMesh.geometry?.attributes?.position?.count}`);
    
    // Limpiar decals anteriores
    decalsRef.current.forEach(decal => {
      if (decal.parent) {
        decal.parent.remove(decal);
      }
    });
    decalsRef.current = [];
    
    try {
      // Verificar mesh válido
      if (!tshirtMesh.geometry || !tshirtMesh.geometry.attributes.position) {
        console.error(`❌ Mesh ${sleeveSide} no tiene geometría válida`);
        return;
      }
      
      // Configuración específica por manga con mejores posiciones
      let config;
      if (sleeveSide === 'right') {
        config = {
          name: 'Manga Derecha',
          position: new THREE.Vector3(25, 15, 8),          // Ajustado para manga derecha
          orientation: new THREE.Euler(0, -0.5, 0),       // Rotación para seguir la curvatura
          size: new THREE.Vector3(12, 12, 12)             // Tamaño moderado
        };
      } else {
        config = {
          name: 'Manga Izquierda', 
          position: new THREE.Vector3(-25, 15, 8),         // Ajustado para manga izquierda
          orientation: new THREE.Euler(0, 0.5, 0),        // Rotación para seguir la curvatura  
          size: new THREE.Vector3(12, 12, 12)             // Tamaño moderado
        };
      }
      
      console.log(`🔨 Creando decal en ${config.name} con posición:`, config.position);
      
      // Crear DecalGeometry
      const decalGeometry = new DecalGeometry(
        tshirtMesh,
        config.position,
        config.orientation,
        config.size
      );
      
      // Verificar resultado
      const vertexCount = decalGeometry.attributes.position?.count || 0;
      console.log(`📊 DecalGeometry resultado: ${vertexCount} vértices`);
      
      if (vertexCount === 0) {
        console.error(`❌ DecalGeometry falló - 0 vértices en ${config.name}`);
        return;
      }
      
      // Material del decal
      const decalMaterial = new THREE.MeshStandardMaterial({
        map: mahoutexture,
        transparent: true,
        opacity: 1.0,
        alphaTest: 0.1,
        polygonOffset: true,
        polygonOffsetFactor: -10,
        side: THREE.DoubleSide,
        depthTest: true,
        depthWrite: false
      });
      
      // Crear mesh del decal
      const decalMesh = new THREE.Mesh(decalGeometry, decalMaterial);
      decalMesh.name = `decal-${sleeveSide}`;
      decalMesh.renderOrder = 1;
      
      // Añadir a la escena
      scene.add(decalMesh);
      decalsRef.current.push(decalMesh);
      
      console.log(`✅ Decal aplicado exitosamente en ${config.name}`);
        
    } catch (error) {
      console.error(`❌ Error en DecalGeometry ${sleeveSide}:`, error);
    }
    
    // Cleanup
    return () => {
      decalsRef.current.forEach(decal => {
        if (decal.parent) {
          decal.parent.remove(decal);
        }
      });
      decalsRef.current = [];
    };
    
  }, [mahoutexture, tshirtMesh, scene, sleeveSide]);
  
  return null;
}

// Componente de camiseta CORREGIDO - Diagnóstico completo
function Shirt(props) {
  const snap = useSnapshot(state);
  const { nodes, materials } = useGLTF('/models/short_sleeve_tshirt.glb');
  const meshRef = useRef();
  const [tshirtMesh, setTshirtMesh] = useState(null);
  
  // DIAGNÓSTICO COMPLETO del modelo
  const modelAnalysis = useMemo(() => {
    console.log('🔍 DIAGNÓSTICO COMPLETO DEL MODELO:');
    console.log('📁 NODOS:', Object.keys(nodes));
    console.log('🎨 MATERIALES:', Object.keys(materials));
    
    const meshes = [];
    Object.entries(nodes).forEach(([name, node]) => {
      if (node.geometry && node.geometry.attributes) {
        const geometry = node.geometry;
        const vertexCount = geometry.attributes.position?.count || 0;
        
        // Verificar UV mapping
        const hasUV = !!geometry.attributes.uv;
        const hasNormals = !!geometry.attributes.normal;
        
        // Calcular bounding box
        geometry.computeBoundingBox();
        const bbox = geometry.boundingBox;
        const size = bbox ? bbox.getSize(new THREE.Vector3()) : new THREE.Vector3();
        const center = bbox ? bbox.getCenter(new THREE.Vector3()) : new THREE.Vector3();
        
        meshes.push({
          name,
          node,
          vertexCount,
          hasUV,
          hasNormals,
          size,
          center,
          material: node.material
        });
        
        console.log(`📊 ${name}:`);
        console.log(`   Vértices: ${vertexCount}`);
        console.log(`   UV: ${hasUV ? '✅' : '❌'}`);
        console.log(`   Normales: ${hasNormals ? '✅' : '❌'}`);
        console.log(`   Tamaño: ${size.x.toFixed(2)} x ${size.y.toFixed(2)} x ${size.z.toFixed(2)}`);
        console.log(`   Centro: (${center.x.toFixed(2)}, ${center.y.toFixed(2)}, ${center.z.toFixed(2)})`);
        console.log(`   Material: ${node.material?.name || 'Sin material'}`);
      }
    });
    
    return meshes;
  }, [nodes, materials]);
  
  if (!modelAnalysis.length) {
    return (
      <mesh ref={meshRef}>
        <boxGeometry args={[1, 1.5, 0.1]} />
        <meshStandardMaterial color="#FFFFFF" />
      </mesh>
    );
  }
  
  return (
    <group ref={meshRef} scale={[0.02, 0.02, 0.02]} position={[0, 0, 0]} {...props}>
      {/* Renderizar TODOS los meshes del modelo */}
      {modelAnalysis.map((meshData, index) => (
        <mesh 
          key={`mesh-${index}-${meshData.name}`}
          geometry={meshData.node.geometry}
          material={new THREE.MeshStandardMaterial({
            color: '#FFFFFF',
            roughness: 0.8,
            metalness: 0.1,
            side: THREE.DoubleSide,  // Renderizar ambos lados
            transparent: false,      // NO transparente
            opacity: 1.0,           // Completamente opaco
            alphaTest: 0,           // Sin alpha test
            wireframe: false        // Sin wireframe
          })}
        />
      ))}
      
      {/* DecalGeometry usando el mesh correcto para cada manga */}
      {modelAnalysis.length >= 2 && (
        <>
          <SleeveDecals 
            tshirtMesh={modelAnalysis.find(m => m.name.includes('_0_3')) || modelAnalysis[0]} 
            sleeveSide="left"
          />
          <SleeveDecals 
            tshirtMesh={modelAnalysis.find(m => m.name.includes('_0_5')) || modelAnalysis[1]} 
            sleeveSide="right"
          />
        </>
      )}
    </group>
  );
}

// Escena 3D simplificada
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
      {/* Iluminación mejorada */}
      <ambientLight intensity={0.7} />
      <directionalLight 
        position={[5, 5, 5]} 
        intensity={0.8} 
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <directionalLight position={[-5, 5, 5]} intensity={0.4} />
      <pointLight position={[0, -5, 2]} intensity={0.3} />
      
      {/* Modelo centrado */}
      <Center>
        <Shirt />
      </Center>
      
      {/* Controles simplificados */}
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
        autoRotate={false}
        autoRotateSpeed={0.5}
      />
    </Canvas>
  );
}

// Funciones auxiliares
const selectPosition = (position) => {
  state.selectedPosition = position;
};

const selectLogo = (logo) => {
  state.selectedLogo = logo;
};

const applyLogo = (logoData, position) => {
  state.appliedLogos[position] = logoData;
  state.canContinue = Object.keys(state.appliedLogos).length > 0;
  state.selectedPosition = null;
  state.selectedLogo = null;
};

const removeLogo = (position) => {
  delete state.appliedLogos[position];
  state.canContinue = Object.keys(state.appliedLogos).length > 0;
};

const isPositionDisabled = (position) => {
  const posConfig = state.printPositions[position];
  if (!posConfig.conflictsWith) return false;
  return state.appliedLogos[posConfig.conflictsWith] !== undefined;
};

const goToCheckout = () => {
  const designData = {
    appliedLogos: state.appliedLogos,
    selectedSize: state.selectedSize,
    selectedGender: state.selectedGender,
    timestamp: new Date().toISOString()
  };
  
  localStorage.setItem('tshirtDesign', JSON.stringify(designData));
  
  const params = new URLSearchParams({
    talla: state.selectedSize,
    genero: state.selectedGender,
    logoCount: Object.keys(state.appliedLogos).length,
    positions: Object.keys(state.appliedLogos).join(',')
  });
  
  window.location.href = `/checkout?${params.toString()}`;
};

// Componente para indicadores de área de impresión
function PrintAreaIndicator({ position }) {
  const snap = useSnapshot(state);
  
  const getIndicatorStyle = (pos) => {
    switch(pos) {
      case 'FRONT':
      case 'BACK':
        return 'w-6 h-8 border-2 border-dashed border-blue-400 rounded';
      case 'CHEST':
        return 'w-3 h-2 border border-dashed border-blue-400 rounded absolute top-2 left-2';
      case 'ARM_RIGHT':
        return 'w-2 h-3 border border-dashed border-blue-400 rounded absolute top-2 right-1';
      case 'ARM_LEFT':
        return 'w-2 h-3 border border-dashed border-blue-400 rounded absolute top-2 left-1';
      default:
        return 'w-6 h-8 border-2 border-dashed border-blue-400 rounded';
    }
  };
  
  return (
    <div className="relative">
      <div className="w-8 h-10 bg-gray-200 rounded mx-auto mb-1 relative">
        {snap.selectedPosition === position && (
          <div className={getIndicatorStyle(position)}></div>
        )}
        {snap.appliedLogos[position] && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div 
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: snap.appliedLogos[position].color }}
            ></div>
          </div>
        )}
      </div>
    </div>
  );
}

// Componente principal
export default function TShirtDesigner() {
  const snap = useSnapshot(state);
  
  return (
    <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
      
      {/* Visor 3D */}
      <div className="lg:col-span-2 order-2 lg:order-1">
        <div 
          className="relative w-full bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl shadow-lg overflow-hidden"
          style={{ height: '600px' }}
        >
          <Suspense fallback={
            <div className="flex items-center justify-center h-full text-gray-600">
              <div className="text-center">
                <p>Cargando modelo con DecalGeometry...</p>
                <p className="text-xs mt-2">Logos automáticos en mangas</p>
              </div>
            </div>
          }>
            <Scene />
          </Suspense>        
          
        </div>
      </div>
      
      {/* Panel de controles */}
      <div className="lg:col-span-1 order-1 lg:order-2 space-y-6">
        
        {/* Configuración */}
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
        
        {/* Posiciones de Impresión */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Posiciones de Impresión
          </h3>
          
          <div className="grid grid-cols-3 gap-3 mb-4">
            {/* Primera fila */}
            <button
              onClick={() => selectPosition('FRONT')}
              disabled={isPositionDisabled('FRONT')}
              className={`p-3 rounded-lg border-2 transition-all ${
                isPositionDisabled('FRONT')
                  ? 'border-gray-200 bg-gray-100 opacity-50 cursor-not-allowed'
                  : snap.selectedPosition === 'FRONT' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <PrintAreaIndicator position="FRONT" />
              <p className="text-xs font-medium">Frente</p>
              <p className={`text-xs cursor-pointer ${
                isPositionDisabled('FRONT') ? 'text-gray-400' : 'text-blue-600'
              }`}>
                {isPositionDisabled('FRONT') ? 'Deshabilitado' : 'Seleccionar'}
              </p>
            </button>
            
            <button
              onClick={() => selectPosition('BACK')}
              className={`p-3 rounded-lg border-2 transition-all ${
                snap.selectedPosition === 'BACK' 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <PrintAreaIndicator position="BACK" />
              <p className="text-xs font-medium">Espalda</p>
              <p className="text-xs text-blue-600 cursor-pointer">Seleccionar</p>
            </button>
            
            <button
              onClick={() => selectPosition('CHEST')}
              disabled={isPositionDisabled('CHEST')}
              className={`p-3 rounded-lg border-2 transition-all ${
                isPositionDisabled('CHEST')
                  ? 'border-gray-200 bg-gray-100 opacity-50 cursor-not-allowed'
                  : snap.selectedPosition === 'CHEST' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <PrintAreaIndicator position="CHEST" />
              <p className="text-xs font-medium">Pecho</p>
              <p className={`text-xs cursor-pointer ${
                isPositionDisabled('CHEST') ? 'text-gray-400' : 'text-blue-600'
              }`}>
                {isPositionDisabled('CHEST') ? 'Deshabilitado' : 'Seleccionar'}
              </p>
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-3 mb-6">
            {/* Segunda fila */}
            <button
              onClick={() => selectPosition('ARM_RIGHT')}
              className={`p-3 rounded-lg border-2 transition-all ${
                snap.selectedPosition === 'ARM_RIGHT' 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <PrintAreaIndicator position="ARM_RIGHT" />
              <p className="text-xs font-medium">Manga Der.</p>
              <p className="text-xs text-blue-600 cursor-pointer">Seleccionar</p>
            </button>
            
            <button
              onClick={() => selectPosition('ARM_LEFT')}
              className={`p-3 rounded-lg border-2 transition-all ${
                snap.selectedPosition === 'ARM_LEFT' 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <PrintAreaIndicator position="ARM_LEFT" />
              <p className="text-xs font-medium">Manga Izq.</p>
              <p className="text-xs text-blue-600 cursor-pointer">Seleccionar</p>
            </button>
          </div>
          
          {/* Selección de logos */}
          {snap.selectedPosition && (
            <div className="border-t border-gray-200 pt-4">
              <h4 className="text-md font-medium text-gray-900 mb-3">
                Selecciona el Logo para {state.printPositions[snap.selectedPosition].name}
              </h4>
              
              <div className="flex gap-3 mb-4">
                {state.availableLogos.map(logo => (
                  <button
                    key={logo.id}
                    onClick={() => selectLogo(logo)}
                    className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                      snap.selectedLogo?.id === logo.id
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="flex items-center justify-center mb-2">
                      <div 
                        className="w-6 h-6 rounded"
                        style={{ backgroundColor: logo.color }}
                      ></div>
                    </div>
                    <p className="text-xs font-medium text-center">{logo.name}</p>
                  </button>
                ))}
              </div>
              
              {/* Botón Aplicar */}
              <div className="squircle-bg rounded-lg bg-zinc-900">
                <button
                  onClick={() => snap.selectedLogo && applyLogo(snap.selectedLogo, snap.selectedPosition)}
                  disabled={!snap.selectedLogo}
                  className={`flex h-10 w-full items-center justify-center px-4 py-2 text-lg transition-all font-bold ${
                    snap.selectedLogo 
                      ? 'text-slate-200 hover:text-white cursor-pointer' 
                      : 'text-gray-500 cursor-not-allowed opacity-50'
                  }`}
                >
                  Aplicar Logo
                </button>
              </div>
            </div>
          )}
          
          {!snap.selectedPosition && (
            <div className="border-t border-gray-200 pt-4">
              <p className="text-sm text-gray-600 text-center">
                ✅ Logos automáticos activos en mangas
              </p>
              <p className="text-xs text-gray-500 text-center mt-1">
                Selecciona una posición para agregar más logos
              </p>
            </div>
          )}
        </div>
        
        {/* Estado actual */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Estado</h3>
          <div className="space-y-2">
            <p className="text-sm">
              <span className="font-medium">Modelo:</span>{' '}
              <span className="text-blue-600">DecalGeometry activo</span>
            </p>
            <p className="text-sm">
              <span className="font-medium">Talla:</span>{' '}
              <span className="text-blue-600">{snap.selectedSize}</span>
            </p>
            <p className="text-sm">
              <span className="font-medium">Género:</span>{' '}
              <span className="text-blue-600">{snap.selectedGender}</span>
            </p>
            <p className="text-sm">
              <span className="font-medium">Logos manuales:</span>{' '}
              <span className="text-green-600 font-medium">
                {Object.keys(snap.appliedLogos).length}
              </span>
            </p>
            <p className="text-sm">
              <span className="font-medium">Logos automáticos:</span>{' '}
              <span className="text-green-600 font-medium">2 (mangas)</span>
            </p>
            
            {/* Lista de posiciones con logos aplicados */}
            {Object.keys(snap.appliedLogos).length > 0 && (
              <div className="mt-3 p-3 bg-green-50 rounded-lg">
                <p className="text-sm font-medium text-green-800 mb-2">Logos manuales:</p>
                <ul className="text-xs text-green-700 space-y-2">
                  {Object.entries(snap.appliedLogos).map(([position, logoData]) => (
                    <li key={position} className="flex justify-between items-center bg-white rounded p-2">
                      <span>• {state.printPositions[position].name}: {logoData.name}</span>
                      <button
                        onClick={() => removeLogo(position)}
                        className="text-red-600 hover:text-red-800 bg-red-100 hover:bg-red-200 rounded px-2 py-1 text-xs font-medium transition-colors"
                        title="Remover logo"
                      >
                        Quitar
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          {/* Botón Continuar */}
          {(snap.canContinue || Object.keys(snap.appliedLogos).length >= 0) && (
            <div className="mt-4">
              <div className="squircle-bg rounded-lg bg-zinc-900">
                <button
                  onClick={goToCheckout}
                  className="flex h-12 w-full items-center justify-center px-4 py-2 text-lg text-slate-200 transition-all hover:text-white font-bold"
                >
                  Continuar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Precargar modelo
useGLTF.preload('/models/short_sleeve_tshirt.glb');
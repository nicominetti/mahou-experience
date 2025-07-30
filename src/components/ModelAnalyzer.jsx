import React, { Suspense, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment, Decal, useTexture, Center } from '@react-three/drei';
import { proxy, useSnapshot } from 'valtio';
import * as THREE from 'three';

// Estado para pruebas de modelos
const testState = proxy({
  currentModel: '/models/shirt_baked_collapsed.glb',
  availableModels: [
    { 
      name: 'shirt_baked_collapsed.glb', 
      description: 'Modelo actual - Collapsed',
      path: '/models/shirt_baked_collapsed.glb'
    },
    { 
      name: 'shirt_baked_2.glb', 
      description: 'Modelo alternativo 2',
      path: '/models/shirt_baked_2.glb'
    },
    { 
      name: 'shirt_baked_lower2.glb', 
      description: 'Modelo Lower 2',
      path: '/models/shirt_baked_lower2.glb'
    },
    { 
      name: 't_shirt.glb', 
      description: 'Modelo T-Shirt básico',
      path: '/models/t_shirt.glb'
    },
    { 
      name: 'scene.gltf', 
      description: 'Escena GLTF',
      path: '/models/scene.gltf'
    }
  ],
  testDecals: true,
  sleevePositions: {
    RIGHT: [0.08, 0.05, 0.1],
    LEFT: [-0.08, 0.05, 0.1]
  },
  analysisResults: {}
});

// Componente de modelo con análisis
function ModelWithAnalysis({ modelPath }) {
  const { nodes, materials } = useGLTF(modelPath);
  const meshRef = useRef();
  const [analysisComplete, setAnalysisComplete] = useState(false);
  
  // Analizar el modelo cuando se carga
  React.useEffect(() => {
    if (nodes && !analysisComplete) {
      analyzeModel(nodes, materials, modelPath);
      setAnalysisComplete(true);
    }
  }, [nodes, materials, modelPath, analysisComplete]);
  
  // Encontrar el mesh principal de la camiseta
  const mainMesh = Object.values(nodes).find(node => 
    node.geometry && 
    (node.name.toLowerCase().includes('shirt') || 
     node.name.toLowerCase().includes('t_shirt') ||
     node.name.toLowerCase().includes('male'))
  );
  
  if (!mainMesh || !mainMesh.geometry) {
    return (
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="red" />
      </mesh>
    );
  }
  
  const snap = useSnapshot(testState);
  
  return (
    <mesh 
      ref={meshRef}
      geometry={mainMesh.geometry}
      material={materials[Object.keys(materials)[0]] || new THREE.MeshStandardMaterial({ color: 'white' })}
    >
      {/* Decals de prueba en las mangas */}
      {snap.testDecals && (
        <>
          {/* Manga derecha */}
          <Decal
            position={snap.sleevePositions.RIGHT}
            rotation={[0, -0.3, 0]}
            scale={0.08}
            map={useTexture('/textures/mahou-logo.png')}
            transparent
            depthTest={false}
            depthWrite={false}
          />
          {/* Manga izquierda */}
          <Decal
            position={snap.sleevePositions.LEFT}
            rotation={[0, 0.3, 0]}
            scale={0.08}
            map={useTexture('/textures/mahou-logo.png')}
            transparent
            depthTest={false}
            depthWrite={false}
          />
        </>
      )}
    </mesh>
  );
}

// Función para analizar modelo
function analyzeModel(nodes, materials, modelPath) {
  const analysis = {
    modelPath,
    totalMeshes: 0,
    mainMesh: null,
    geometryInfo: {},
    materialInfo: {},
    sleeveCompatibility: {
      score: 0,
      reasons: [],
      recommendation: ''
    }
  };
  
  // Analizar nodos
  Object.entries(nodes).forEach(([name, node]) => {
    if (node.geometry) {
      analysis.totalMeshes++;
      
      // Identificar mesh principal
      if (name.toLowerCase().includes('shirt') || 
          name.toLowerCase().includes('t_shirt') ||
          name.toLowerCase().includes('male')) {
        analysis.mainMesh = name;
        
        const geometry = node.geometry;
        analysis.geometryInfo = {
          vertices: geometry.attributes.position?.count || 0,
          faces: geometry.index ? geometry.index.count / 3 : 0,
          hasUVs: !!geometry.attributes.uv,
          hasNormals: !!geometry.attributes.normal,
          boundingBox: new THREE.Box3().setFromBufferAttribute(geometry.attributes.position)
        };
        
        // Evaluar compatibilidad con mangas
        let score = 0;
        const reasons = [];
        
        // Criterio 1: UV mapping
        if (analysis.geometryInfo.hasUVs) {
          score += 30;
          reasons.push('✓ Tiene UV mapping');
        } else {
          reasons.push('❌ Sin UV mapping');
        }
        
        // Criterio 2: Densidad de vértices
        const vertices = analysis.geometryInfo.vertices;
        if (vertices > 1000 && vertices < 8000) {
          score += 25;
          reasons.push(`✓ Densidad óptima de vértices (${vertices})`);
        } else if (vertices >= 8000) {
          score += 15;
          reasons.push(`⚠ Alta densidad de vértices (${vertices})`);
        } else {
          score += 5;
          reasons.push(`⚠ Baja densidad de vértices (${vertices})`);
        }
        
        // Criterio 3: Proporción del modelo
        const bbox = analysis.geometryInfo.boundingBox;
        const width = bbox.max.x - bbox.min.x;
        const height = bbox.max.y - bbox.min.y;
        const depth = bbox.max.z - bbox.min.z;
        
        if (width > 1.5 && height > 1.8) {
          score += 25;
          reasons.push('✓ Proporciones adecuadas para camiseta');
        } else {
          reasons.push('⚠ Proporciones inusuales');
        }
        
        // Criterio 4: Normales
        if (analysis.geometryInfo.hasNormals) {
          score += 20;
          reasons.push('✓ Tiene normales para iluminación');
        } else {
          reasons.push('❌ Sin normales');
        }
        
        analysis.sleeveCompatibility.score = score;
        analysis.sleeveCompatibility.reasons = reasons;
        
        // Recomendación
        if (score >= 80) {
          analysis.sleeveCompatibility.recommendation = 'EXCELENTE - Ideal para decals en mangas';
        } else if (score >= 60) {
          analysis.sleeveCompatibility.recommendation = 'BUENO - Compatible con ajustes menores';
        } else if (score >= 40) {
          analysis.sleeveCompatibility.recommendation = 'REGULAR - Requiere ajustes significativos';
        } else {
          analysis.sleeveCompatibility.recommendation = 'MALO - No recomendado para decals';
        }
      }
    }
  });
  
  // Analizar materiales
  Object.entries(materials).forEach(([name, material]) => {
    analysis.materialInfo[name] = {
      type: material.type,
      hasTexture: !!material.map,
      transparent: material.transparent,
      color: material.color?.getHexString() || 'unknown'
    };
  });
  
  // Guardar análisis
  testState.analysisResults[modelPath] = analysis;
  
  console.log(`📊 Análisis de ${modelPath}:`, analysis);
}

// Escena 3D
function Scene() {
  const snap = useSnapshot(testState);
  
  return (
    <Canvas 
      shadows={false}
      camera={{ position: [0, 0, 2.5], fov: 25 }} 
      gl={{ 
        preserveDrawingBuffer: true,
        alpha: true,
        antialias: true
      }}
      style={{ background: 'transparent' }}
    >
      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 5, 5]} intensity={0.5} />
      <Center>
        <ModelWithAnalysis modelPath={snap.currentModel} />
      </Center>
      <OrbitControls 
        enablePan={false}
        enableZoom={true}
        enableRotate={true}
        maxDistance={4}
        minDistance={2}
        enableDamping={true}
        dampingFactor={0.05}
        maxPolarAngle={Math.PI}
        minPolarAngle={0}
        autoRotate={false}
        target={[0, 0, 0]}
        makeDefault
      />
    </Canvas>
  );
}

// Componente principal de análisis
export default function ModelAnalyzer() {
  const snap = useSnapshot(testState);
  
  const changeModel = (modelPath) => {
    testState.currentModel = modelPath;
  };
  
  const adjustSleevePosition = (side, axis, value) => {
    const newPosition = [...testState.sleevePositions[side]];
    const axisIndex = axis === 'x' ? 0 : axis === 'y' ? 1 : 2;
    newPosition[axisIndex] = value;
    testState.sleevePositions[side] = newPosition;
  };
  
  const currentAnalysis = snap.analysisResults[snap.currentModel];
  
  return (
    <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto p-6">
      
      {/* Visor 3D */}
      <div className="lg:col-span-2">
        <div 
          className="relative w-full bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl shadow-lg overflow-hidden"
          style={{ height: '600px' }}
        >
          <Suspense fallback={
            <div className="flex items-center justify-center h-full text-gray-600">
              Cargando modelo...
            </div>
          }>
            <Scene />
          </Suspense>
          
          {/* Overlay con información del modelo actual */}
          <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg px-4 py-2 shadow-sm">
            <p className="text-sm font-medium text-gray-900">
              {snap.availableModels.find(m => m.path === snap.currentModel)?.name}
            </p>
            <p className="text-xs text-gray-600">
              {snap.availableModels.find(m => m.path === snap.currentModel)?.description}
            </p>
          </div>
        </div>
      </div>
      
      {/* Panel de controles */}
      <div className="lg:col-span-1 space-y-6">
        
        {/* Selector de modelos */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            🔍 Seleccionar Modelo
          </h3>
          
          <div className="space-y-3">
            {snap.availableModels.map(model => (
              <button
                key={model.path}
                onClick={() => changeModel(model.path)}
                className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                  snap.currentModel === model.path
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <p className="font-medium text-gray-900">{model.name}</p>
                <p className="text-xs text-gray-600">{model.description}</p>
              </button>
            ))}
          </div>
        </div>
        
        {/* Ajustes de posición de mangas */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            🎯 Ajustar Posiciones de Mangas
          </h3>
          
          <div className="space-y-4">
            {/* Manga derecha */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Manga Derecha
              </label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs w-4">X:</span>
                  <input
                    type="range"
                    min="-0.2"
                    max="0.2"
                    step="0.01"
                    value={snap.sleevePositions.RIGHT[0]}
                    onChange={(e) => adjustSleevePosition('RIGHT', 'x', parseFloat(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-xs w-12">{snap.sleevePositions.RIGHT[0].toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs w-4">Y:</span>
                  <input
                    type="range"
                    min="-0.2"
                    max="0.2"
                    step="0.01"
                    value={snap.sleevePositions.RIGHT[1]}
                    onChange={(e) => adjustSleevePosition('RIGHT', 'y', parseFloat(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-xs w-12">{snap.sleevePositions.RIGHT[1].toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs w-4">Z:</span>
                  <input
                    type="range"
                    min="-0.2"
                    max="0.2"
                    step="0.01"
                    value={snap.sleevePositions.RIGHT[2]}
                    onChange={(e) => adjustSleevePosition('RIGHT', 'z', parseFloat(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-xs w-12">{snap.sleevePositions.RIGHT[2].toFixed(2)}</span>
                </div>
              </div>
            </div>
            
            {/* Manga izquierda */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Manga Izquierda
              </label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs w-4">X:</span>
                  <input
                    type="range"
                    min="-0.2"
                    max="0.2"
                    step="0.01"
                    value={snap.sleevePositions.LEFT[0]}
                    onChange={(e) => adjustSleevePosition('LEFT', 'x', parseFloat(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-xs w-12">{snap.sleevePositions.LEFT[0].toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs w-4">Y:</span>
                  <input
                    type="range"
                    min="-0.2"
                    max="0.2"
                    step="0.01"
                    value={snap.sleevePositions.LEFT[1]}
                    onChange={(e) => adjustSleevePosition('LEFT', 'y', parseFloat(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-xs w-12">{snap.sleevePositions.LEFT[1].toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs w-4">Z:</span>
                  <input
                    type="range"
                    min="-0.2"
                    max="0.2"
                    step="0.01"
                    value={snap.sleevePositions.LEFT[2]}
                    onChange={(e) => adjustSleevePosition('LEFT', 'z', parseFloat(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-xs w-12">{snap.sleevePositions.LEFT[2].toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-200">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={snap.testDecals}
                onChange={(e) => { testState.testDecals = e.target.checked; }}
                className="mr-2"
              />
              <span className="text-sm">Mostrar decals de prueba</span>
            </label>
          </div>
        </div>
        
        {/* Análisis del modelo actual */}
        {currentAnalysis && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              📊 Análisis del Modelo
            </h3>
            
            <div className="space-y-4">
              {/* Puntuación de compatibilidad */}
              <div className={`p-4 rounded-lg ${
                currentAnalysis.sleeveCompatibility.score >= 80 ? 'bg-green-50 border border-green-200' :
                currentAnalysis.sleeveCompatibility.score >= 60 ? 'bg-yellow-50 border border-yellow-200' :
                'bg-red-50 border border-red-200'
              }`}>
                <h4 className="font-medium text-gray-900 mb-2">
                  Compatibilidad con Mangas: {currentAnalysis.sleeveCompatibility.score}/100
                </h4>
                <p className={`text-sm ${
                  currentAnalysis.sleeveCompatibility.score >= 80 ? 'text-green-700' :
                  currentAnalysis.sleeveCompatibility.score >= 60 ? 'text-yellow-700' :
                  'text-red-700'
                }`}>
                  {currentAnalysis.sleeveCompatibility.recommendation}
                </p>
              </div>
              
              {/* Detalles del análisis */}
              <div className="text-sm space-y-2">
                <h5 className="font-medium text-gray-900">Detalles:</h5>
                {currentAnalysis.sleeveCompatibility.reasons.map((reason, index) => (
                  <p key={index} className="text-gray-700">• {reason}</p>
                ))}
              </div>
              
              {/* Información geométrica */}
              <div className="bg-gray-50 p-3 rounded-lg text-sm">
                <h5 className="font-medium text-gray-900 mb-2">Información Geométrica:</h5>
                <p>Mesh principal: {currentAnalysis.mainMesh}</p>
                <p>Vértices: {currentAnalysis.geometryInfo.vertices?.toLocaleString()}</p>
                <p>Caras: {currentAnalysis.geometryInfo.faces?.toLocaleString()}</p>
                <p>UV mapping: {currentAnalysis.geometryInfo.hasUVs ? '✓' : '❌'}</p>
                <p>Normales: {currentAnalysis.geometryInfo.hasNormals ? '✓' : '❌'}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Botón para exportar coordenadas */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            🔧 Exportar Configuración
          </h3>
          
          <button
            onClick={() => {
              const config = {
                model: snap.currentModel,
                sleevePositions: snap.sleevePositions,
                analysis: currentAnalysis
              };
              console.log('Configuración optimizada:', config);
              navigator.clipboard.writeText(JSON.stringify(config, null, 2));
              alert('Configuración copiada al portapapeles');
            }}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            📋 Copiar Configuración Optimizada
          </button>
        </div>
      </div>
    </div>
  );
}

// Precargar todos los modelos
testState.availableModels.forEach(model => {
  useGLTF.preload(model.path);
});

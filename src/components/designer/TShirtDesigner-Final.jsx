import React, { Suspense, useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree, extend } from '@react-three/fiber';
import { OrbitControls, useGLTF, Center } from '@react-three/drei';
import { proxy, useSnapshot } from 'valtio';
import * as THREE from 'three';
import { DecalGeometry } from 'three/examples/jsm/geometries/DecalGeometry.js';
import '../../styles/tshirt-designer.css';

// Extend Three.js con DecalGeometry
extend({ DecalGeometry });

// Estado global simplificado
const state = proxy({
  modelURL: '/models/short_sleeve_tshirt.glb',
  color: '#FFFFFF',
  selectedSize: 'M',
  selectedGender: 'masculino',
  canContinue: true
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
        console.log('✅ SVG Mahou cargado:', svgString.substring(0, 50) + '...');
        
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml' });
        const svgUrl = URL.createObjectURL(svgBlob);
        
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = function() {
          const canvas = document.createElement('canvas');
          canvas.width = 512;
          canvas.height = 512;
          const ctx = canvas.getContext('2d');          geometry={meshData.node.geometry}
          material={new THREE.MeshStandardMaterial({
            color: '#FFFFFF',
            roughness: 0.8,
            metalness: 0.1,
            side: THREE.DoubleSide
          })}
        />
      ))}
      
      {/* DecalGeometry en las mangas */}
      {meshes.length >= 2 && (
        <>
          <SleeveDecal 
            tshirtMesh={meshes[0].node} 
            sleeveSide="left"
          />
          <SleeveDecal 
            tshirtMesh={meshes[1].node} 
            sleeveSide="right"
          />
        </>
      )}
    </group>
  );
}

// Escena 3D
function Scene() {
  return (
    <Canvas 
      camera={{ 
        position: [0, 0, 4], 
        fov: 50
      }}
      gl={{ antialias: true, alpha: true }}
      style={{ background: 'transparent' }}
    >
      {/* Iluminación */}
      <ambientLight intensity={0.7} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} />
      <directionalLight position={[-5, 5, 5]} intensity={0.4} />
      <pointLight position={[0, -5, 2]} intensity={0.3} />
      
      {/* Modelo centrado */}
      <Center>
        <Shirt />
      </Center>
      
      {/* Controles */}
      <OrbitControls 
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={2}
        maxDistance={8}
        enableDamping={true}
        dampingFactor={0.1}
        target={[0, 0, 0]}
      />
    </Canvas>
  );
}

// Componente principal
export default function TShirtDesigner() {
  const snap = useSnapshot(state);
  
  const goToCheckout = () => {
    const designData = {
      selectedSize: snap.selectedSize,
      selectedGender: snap.selectedGender,
      hasLogos: true,
      timestamp: new Date().toISOString()
    };
    
    localStorage.setItem('tshirtDesign', JSON.stringify(designData));
    
    const params = new URLSearchParams({
      talla: snap.selectedSize,
      genero: snap.selectedGender,
      logoCount: 2
    });
    
    window.location.href = `/checkout?${params.toString()}`;
  };
  
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
                <p>Cargando diseñador 3D...</p>
                <p className="text-xs mt-2">Con logo Mahou real</p>
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
        
        {/* Información del diseño */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Diseño Actual
          </h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-600 rounded-full mr-2"></div>
                <span className="text-sm font-medium">Logo Mahou</span>
              </div>
              <span className="text-xs text-green-600 font-medium">Manga Izq.</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-600 rounded-full mr-2"></div>
                <span className="text-sm font-medium">Logo Mahou</span>
              </div>
              <span className="text-xs text-green-600 font-medium">Manga Der.</span>
            </div>
          </div>
        </div>
        
        {/* Estado */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Estado</h3>
          <div className="space-y-2">
            <p className="text-sm">
              <span className="font-medium">Método:</span>{' '}
              <span className="text-blue-600">DecalGeometry</span>
            </p>
            <p className="text-sm">
              <span className="font-medium">Logos:</span>{' '}
              <span className="text-green-600 font-medium">2 aplicados</span>
            </p>
            <p className="text-sm">
              <span className="font-medium">SVG:</span>{' '}
              <span className="text-green-600 font-medium">Cargado</span>
            </p>
            <p className="text-sm">
              <span className="font-medium">Talla:</span>{' '}
              <span className="text-blue-600">{snap.selectedSize}</span>
            </p>
            <p className="text-sm">
              <span className="font-medium">Género:</span>{' '}
              <span className="text-blue-600">{snap.selectedGender}</span>
            </p>
          </div>
          
          {/* Botón Continuar */}
          <div className="mt-6">
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
    </div>
  );
}

// Precargar modelo
useGLTF.preload('/models/short_sleeve_tshirt.glb');
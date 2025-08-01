import React, { useRef, useEffect, useState, Suspense } from 'react';
import { Canvas, useFrame, useThree, extend } from '@react-three/fiber';
import { OrbitControls, useGLTF, Text, Environment } from '@react-three/drei';
import * as THREE from 'three';

// Extender OrbitControls para que funcione correctamente
extend({ OrbitControls });

// Componente para cargar y mostrar el modelo de camiseta
function TShirtModel({ color = 'white', ...props }) {
    const { scene, materials } = useGLTF('/models/t-shirt.glb');
    const modelRef = useRef();
    
    // Clonar la escena para evitar modificar el original
    const clonedScene = scene.clone();
    
    useEffect(() => {
        if (clonedScene && materials) {
            console.log('Materiales disponibles:', Object.keys(materials));
            
            // Recorrer todos los materiales y cambiar el color a blanco
            Object.values(materials).forEach((material) => {
                if (material.isMeshStandardMaterial || material.isMeshBasicMaterial) {
                    console.log('Cambiando color del material:', material.name);
                    material.color.setStyle(color);
                }
            });
            
            // También recorrer todos los meshes en la escena
            clonedScene.traverse((child) => {
                if (child.isMesh && child.material) {
                    console.log('Procesando mesh:', child.name, 'Material:', child.material.name);
                    
                    if (Array.isArray(child.material)) {
                        child.material.forEach((mat) => {
                            if (mat.isMeshStandardMaterial || mat.isMeshBasicMaterial) {
                                mat.color.setStyle(color);
                            }
                        });
                    } else {
                        if (child.material.isMeshStandardMaterial || child.material.isMeshBasicMaterial) {
                            child.material.color.setStyle(color);
                        }
                    }
                }
            });
        }
    }, [clonedScene, materials, color]);
    
    return (
        <primitive 
            ref={modelRef} 
            object={clonedScene} 
            scale={1}
            position={[0, -1, 0]}
            {...props}
        />
    );
}

// Componente de información del modelo
function ModelInfo() {
    const [info, setInfo] = useState('');
    
    useEffect(() => {
        // Cargar el modelo y extraer información
        const loader = new THREE.GLTFLoader();
        loader.load('/models/t-shirt.glb', (gltf) => {
            const { scene, materials, animations } = gltf;
            let infoText = '';
            
            infoText += `INFORMACIÓN DEL MODELO\n`;
            infoText += `━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
            infoText += `Materiales: ${Object.keys(materials).length}\n`;
            infoText += `Animaciones: ${animations.length}\n`;
            
            // Contar vértices y triángulos
            let vertices = 0;
            let triangles = 0;
            
            scene.traverse((child) => {
                if (child.isMesh && child.geometry) {
                    const geometry = child.geometry;
                    if (geometry.attributes.position) {
                        vertices += geometry.attributes.position.count;
                    }
                    if (geometry.index) {
                        triangles += geometry.index.count / 3;
                    }
                }
            });
            
            infoText += `Triángulos: ${Math.round(triangles).toLocaleString()}\n`;
            infoText += `Vértices: ${vertices.toLocaleString()}\n\n`;
            
            infoText += `MATERIALES DETECTADOS:\n`;
            infoText += `━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
            
            Object.entries(materials).forEach(([name, material]) => {
                infoText += `• ${name}: ${material.type}\n`;
                if (material.color) {
                    infoText += `  Color: #${material.color.getHexString()}\n`;
                }
            });
            
            setInfo(infoText);
        });
    }, []);
    
    return (
        <div style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            background: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '15px',
            borderRadius: '8px',
            fontFamily: 'monospace',
            fontSize: '12px',
            whiteSpace: 'pre-line',
            maxWidth: '300px',
            zIndex: 1000
        }}>
            {info || 'Cargando información del modelo...'}
        </div>
    );
}

// Componente principal del visualizador
export default function TShirtViewer() {
    const [color, setColor] = useState('white');
    
    return (
        <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
            <ModelInfo />
            
            {/* Controles de color */}
            <div style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                background: 'rgba(255, 255, 255, 0.9)',
                padding: '15px',
                borderRadius: '8px',
                zIndex: 1000
            }}>
                <h3 style={{ margin: '0 0 10px 0' }}>🎨 Color de la Camiseta</h3>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {['white', 'black', 'red', 'blue', 'green', 'yellow', 'purple', 'orange'].map(c => (
                        <button
                            key={c}
                            onClick={() => setColor(c)}
                            style={{
                                width: '40px',
                                height: '40px',
                                backgroundColor: c,
                                border: color === c ? '3px solid #333' : '1px solid #ccc',
                                borderRadius: '50%',
                                cursor: 'pointer'
                            }}
                            title={c}
                        />
                    ))}
                </div>
                <input
                    type="color"
                    value={color.startsWith('#') ? color : '#ffffff'}
                    onChange={(e) => setColor(e.target.value)}
                    style={{
                        width: '100%',
                        marginTop: '10px',
                        height: '40px',
                        border: 'none',
                        borderRadius: '4px'
                    }}
                />
            </div>
            
            <Canvas
                camera={{ position: [0, 0, 3], fov: 50 }}
                style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
            >
                <Suspense fallback={null}>
                    <ambientLight intensity={0.6} />
                    <directionalLight position={[5, 5, 5]} intensity={1} />
                    <directionalLight position={[-5, -5, -5]} intensity={0.5} />
                    
                    <TShirtModel color={color} />
                    
                    <OrbitControls 
                        enablePan={true}
                        enableZoom={true}
                        enableRotate={true}
                        autoRotate={false}
                        autoRotateSpeed={0.5}
                    />
                    
                    <Environment preset="studio" />
                </Suspense>
            </Canvas>
        </div>
    );
}

// Precargar el modelo
useGLTF.preload('/models/t-shirt.glb');
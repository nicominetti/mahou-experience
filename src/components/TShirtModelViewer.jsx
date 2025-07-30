import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment } from '@react-three/drei';
import { Suspense, useEffect } from 'react';

function TShirtModel({ url, color = 'white' }) {
	const { scene, materials } = useGLTF(url);
	
	useEffect(() => {
		// Cambiar el color de todos los materiales a blanco
		Object.values(materials).forEach((material) => {
			if (material.color) {
				material.color.set(color);
			}
			// También cambiar el color base para materiales PBR
			if (material.map) {
				material.map.colorSpace = 'srgb';
			}
		});
	}, [materials, color]);

	return <primitive object={scene} scale={[1, 1, 1]} position={[0, -1, 0]} />;
}

function TShirtModelViewer() {
	return (
		<div className="w-full h-screen bg-gray-100">
			<div className="p-4">
				<h1 className="text-2xl font-bold mb-4">Modelo de Camiseta - Verificación de Color</h1>
				<div className="text-sm text-gray-600 mb-4">
					Verificando si podemos cambiar el color del modelo a blanco...
				</div>
			</div>
			
			<div className="w-full h-96 border border-gray-300">
				<Canvas camera={{ position: [0, 0, 3], fov: 50 }}>
					<Suspense fallback={null}>
						<TShirtModel url="/models/t-shirt.glb" color="white" />
						<Environment preset="studio" />
						<OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
						<ambientLight intensity={0.5} />
						<pointLight position={[10, 10, 10]} />
					</Suspense>
				</Canvas>
			</div>
			
			<div className="p-4">
				<h3 className="text-lg font-semibold mb-2">Información del Modelo:</h3>
				<ul className="text-sm text-gray-700 space-y-1">
					<li>• Archivo: t-shirt.glb (~29MB)</li>
					<li>• Formato: GLB/GLTF 2.0</li>
					<li>• Geometría: High-poly con UV mapping</li>
					<li>• Materiales: PBR (Physical Based Rendering)</li>
					<li>• Color: Cambiado a blanco programáticamente</li>
				</ul>
			</div>
		</div>
	);
}

export default TShirtModelViewer;

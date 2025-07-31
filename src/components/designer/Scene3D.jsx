// Componente de escena con rotación automática de cámara
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
        <TShirtWithSleeves />
      </Center>
      
      <OrbitControls 
        ref={controlsRef}
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

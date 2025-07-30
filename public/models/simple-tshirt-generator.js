// Generador de camiseta simple GLB para Mintaka
// Crea una camiseta de manga corta blanca con geometría optimizada para Decals

import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

export function createSimpleTShirt() {
    const group = new THREE.Group();
    
    // Cuerpo principal de la camiseta
    const bodyGeometry = new THREE.CylinderGeometry(0.8, 0.9, 1.2, 16, 8);
    const bodyMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xffffff,
        roughness: 0.8,
        metalness: 0.1
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.name = 'tshirt_body';
    
    // Mangas cortas
    const sleeveGeometry = new THREE.CylinderGeometry(0.25, 0.3, 0.4, 12, 4);
    const sleeveMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xffffff,
        roughness: 0.8,
        metalness: 0.1
    });
    
    // Manga izquierda
    const leftSleeve = new THREE.Mesh(sleeveGeometry, sleeveMaterial);
    leftSleeve.position.set(-1.0, 0.3, 0);
    leftSleeve.rotation.z = Math.PI / 2;
    leftSleeve.name = 'tshirt_left_sleeve';
    
    // Manga derecha
    const rightSleeve = new THREE.Mesh(sleeveGeometry, sleeveMaterial);
    rightSleeve.position.set(1.0, 0.3, 0);
    rightSleeve.rotation.z = -Math.PI / 2;
    rightSleeve.name = 'tshirt_right_sleeve';
    
    // Cuello
    const neckGeometry = new THREE.TorusGeometry(0.35, 0.05, 8, 16);
    const neckMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xffffff,
        roughness: 0.8,
        metalness: 0.1
    });
    const neck = new THREE.Mesh(neckGeometry, neckMaterial);
    neck.position.set(0, 0.6, 0);
    neck.rotation.x = Math.PI / 2;
    neck.name = 'tshirt_neck';
    
    // Agregar partes al grupo
    group.add(body);
    group.add(leftSleeve);
    group.add(rightSleeve);
    group.add(neck);
    
    group.name = 'white_tshirt';
    
    return group;
}

export function exportToGLB(scene) {
    const exporter = new GLTFExporter();
    
    return new Promise((resolve, reject) => {
        exporter.parse(
            scene,
            function(gltf) {
                const blob = new Blob([gltf], { type: 'application/octet-stream' });
                resolve(blob);
            },
            function(error) {
                
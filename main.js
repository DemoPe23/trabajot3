import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

// CONFIGURACIÓN DEL MOTOR Y ESCENA BASE// 
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0d1117);
scene.fog = new THREE.FogExp2(0x0d1117, 0.022);

const camera = new THREE.PerspectiveCamera(
    75, 
    window.innerWidth / window.innerHeight, 
    0.1, 
    1000
);
camera.position.set(0, 1.7, 5); // Punto de aparición inicial

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// Ajuste para el tamaño de la ventana
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// ILUMINACION Y SUELO
const ambientLight = new THREE.AmbientLight(0x404855, 0.8);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xcfd8dc, 1.2);
dirLight.position.set(15, 30, 10);
dirLight.castShadow = true;
scene.add(dirLight);

// Suelo base del sector
const floorGeo = new THREE.PlaneGeometry(60, 120);
const floorMat = new THREE.MeshStandardMaterial({ 
    color: 0x1e2229,
    roughness: 0.9 
});
const floor = new THREE.Mesh(floorGeo, floorMat);
floor.rotation.x = -Math.PI / 2;
floor.position.z = -40;
floor.receiveShadow = true;
scene.add(floor);

// Referencia temporal
const gridHelper = new THREE.GridHelper(120, 60, 0x00ff80, 0x2a3540);
gridHelper.position.set(0, 0.01, -40);
scene.add(gridHelper);

// CAMARA Y DESPLAZAMIENTO// 
const controls = new PointerLockControls(camera, document.body);
scene.add(camera);

const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlay-title');
const overlaySub = document.getElementById('overlay-sub');

overlay.addEventListener('click', () => {
    controls.lock();
});

controls.addEventListener('lock', () => {
    overlay.style.display = 'none';
});

controls.addEventListener('unlock', () => {
    overlayTitle.innerText = "SIMULACIÓN EN PAUSA";
    overlaySub.innerText = "Haz clic en la pantalla para reanudar";
    overlay.style.display = 'flex';
});

// Registro de tecla
const moveState = {
    forward: false,
    backward: false,
    left: false,
    right: false
};

window.addEventListener('keydown', (e) => {
    switch (e.code) {
        case 'KeyW': moveState.forward = true; break;
        case 'KeyS': moveState.backward = true; break;
        case 'KeyA': moveState.left = true; break;
        case 'KeyD': moveState.right = true; break;
    }
});

window.addEventListener('keyup', (e) => {
    switch (e.code) {
        case 'KeyW': moveState.forward = false; break;
        case 'KeyS': moveState.backward = false; break;
        case 'KeyA': moveState.left = false; break;
        case 'KeyD': moveState.right = false; break;
    }
});

// BUCLE DE RENDERIZADO// 
const clock = new THREE.Clock();
const PLAYER_SPEED = 7.0;

function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();

    if (controls.isLocked) {
        const step = PLAYER_SPEED * delta;
        if (moveState.forward) controls.moveForward(step);
        if (moveState.backward) controls.moveForward(-step);
        if (moveState.left) controls.moveRight(-step);
        if (moveState.right) controls.moveRight(step);
    }

    renderer.render(scene, camera);
}

animate();
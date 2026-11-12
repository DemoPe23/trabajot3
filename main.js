import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

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

// SISTEMA DE ARMAS Y MUNICIONES (RF01 y RF02) //
const gltfLoader = new GLTFLoader();

const weaponNameEl = document.getElementById('weapon-name');
const ammoCountEl = document.getElementById('ammo-count');

const weapons = {
    1: { 
        name: "Pistola Táctica", 
        ammo: 12, 
        model: null,
        basePos: { x: 0.28, y: -0.25, z: -0.5 } 
    },
    2: { 
        name: "Rifle de Asalto", 
        ammo: 20, 
        model: null,
        basePos: { x: 0.30, y: -0.28, z: -0.6 } 
    }
};

let currentWeapon = 1;

function updateHUD() {
    const activeWep = weapons[currentWeapon];
    weaponNameEl.innerText = activeWep.name;
    ammoCountEl.innerText = activeWep.ammo;

    if (activeWep.ammo <= 0) {
        ammoCountEl.classList.add('no-ammo');
    } else {
        ammoCountEl.classList.remove('no-ammo');
    }
}

// Carga de Arma 1
gltfLoader.load('./assets/arma1.glb', (gltf) => {
    const model = gltf.scene;
    model.scale.set(0.15, 0.15, -0.25); 
    model.position.set(weapons[1].basePos.x, weapons[1].basePos.y, weapons[1].basePos.z);
    model.rotation.y = Math.PI/2;
    
    weapons[1].model = model;
    camera.add(model); 
});

// Carga de Arma 2
gltfLoader.load('./assets/arma2.glb', (gltf) => {
    const model = gltf.scene;
    model.scale.set(0.15, 0.15, -0.30);
    model.position.set(weapons[2].basePos.x, weapons[2].basePos.y, weapons[2].basePos.z);
    model.rotation.y = -Math.PI/2;
    model.visible = false;
    
    weapons[2].model = model;
    camera.add(model);
});

function switchWeapon(index) {
    if (currentWeapon === index) return;
    if (weapons[currentWeapon].model) weapons[currentWeapon].model.visible = false;
    currentWeapon = index;
    if (weapons[currentWeapon].model) weapons[currentWeapon].model.visible = true;
    updateHUD();
}

updateHUD();

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
        case 'Digit1': switchWeapon(1); break;
        case 'Digit2': switchWeapon(2); break;
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

// Luz de fogonazo al disparar 
const muzzleFlash = new THREE.PointLight(0xffaa00, 0, 4);
muzzleFlash.position.set(0.28, -0.15, -0.8);
camera.add(muzzleFlash);

// DISPARO//
window.addEventListener('mousedown', (e) => {
    if (!controls.isLocked || e.button !== 0) return;

    const activeWep = weapons[currentWeapon];

    if (activeWep.ammo <= 0) {
        return;
    }

    activeWep.ammo--;
    updateHUD();

    // Efecto de retroceso y fogonazo
    if (activeWep.model) {
        activeWep.model.position.z += 0.08;
        activeWep.model.rotation.x += 0.08;
        muzzleFlash.intensity = 5;

        setTimeout(() => {
            if (activeWep.model) {
                activeWep.model.position.z = activeWep.basePos.z;
                activeWep.model.rotation.x = 0;
            }
            muzzleFlash.intensity = 0;
        }, 80);
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
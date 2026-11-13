import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

//CONFIGURACIÓN DEL MOTOR Y ESCENA BASE 
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0d12);
scene.fog = new THREE.FogExp2(0x0a0d12, 0.02);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1.7, 5);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

//ILUMINACIÓN Y SUELO
const ambientLight = new THREE.AmbientLight(0x404855, 0.7);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xcfd8dc, 1.2);
dirLight.position.set(15, 35, 10);
dirLight.castShadow = true;
scene.add(dirLight);

const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(40, 130),
    new THREE.MeshStandardMaterial({ color: 0x181b20, roughness: 0.9 })
);
floor.rotation.x = -Math.PI / 2;
floor.position.z = -50;
floor.receiveShadow = true;
scene.add(floor);

const gridHelper = new THREE.GridHelper(130, 65, 0x00ff80, 0x222a30);
gridHelper.position.set(0, 0.01, -50);
scene.add(gridHelper);

//CÁMARA Y DESPLAZAMIENTO
const controls = new PointerLockControls(camera, document.body);
scene.add(camera);

const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlay-title');
const overlaySub = document.getElementById('overlay-sub');
const controlsInfo = document.getElementById('controls-info');
const btnRestart = document.getElementById('btn-restart');

let isGameOver = false;
let isVictory = false;

overlay.addEventListener('click', () => {
    if (!isGameOver && !isVictory) controls.lock();
});

controls.addEventListener('lock', () => {
    overlay.style.display = 'none';
});


controls.addEventListener('unlock', () => {
    if (!isGameOver && !isVictory) {
        overlayTitle.style.color = "#00ff80";
        overlayTitle.innerText = "SIMULACIÓN EN PAUSA";
        overlaySub.innerText = "Haz clic en la pantalla para reanudar";
        overlay.style.display = 'flex';
    }
});

// SISTEMA DE ARMAS Y MUNICIONES
const gltfLoader = new GLTFLoader();
const weaponNameEl = document.getElementById('weapon-name');
const ammoCountEl = document.getElementById('ammo-count');

const weapons = {
    1: { name: "Pistola Táctica", ammo: 10, model: null, basePos: { x: 0.28, y: -0.25, z: -0.45 } },
    2: { name: "Rifle de Asalto", ammo: 15, model: null, basePos: { x: 0.30, y: -0.28, z: -0.55 } }
};

let currentWeapon = 1;

function updateHUD() {
    const activeWep = weapons[currentWeapon];
    weaponNameEl.innerText = activeWep.name;
    ammoCountEl.innerText = activeWep.ammo;
    if (activeWep.ammo <= 0) ammoCountEl.classList.add('no-ammo');
    else ammoCountEl.classList.remove('no-ammo');
}

gltfLoader.load('./assets/arma1.glb', (gltf) => {
    const model = gltf.scene;
    model.scale.set(0.22, 0.22, 0.22);
    model.position.set(weapons[1].basePos.x, weapons[1].basePos.y, weapons[1].basePos.z);
    model.rotation.y = Math.PI / 2;
    weapons[1].model = model;
    camera.add(model);
});

gltfLoader.load('./assets/arma2.glb', (gltf) => {
    const model = gltf.scene;
    model.scale.set(0.25, 0.25, 0.25);
    model.position.set(weapons[2].basePos.x, weapons[2].basePos.y, weapons[2].basePos.z);
    model.rotation.y = -Math.PI / 2;
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

// ESCENARIO, MUNICIÓN Y EXTRACCIÓN
const extractionZone = new THREE.Mesh(
    new THREE.CylinderGeometry(3.5, 3.5, 0.3, 32),
    new THREE.MeshStandardMaterial({ color: 0x00ff88, emissive: 0x00ff88, emissiveIntensity: 0.5 })
);
extractionZone.position.set(0, 0.15, -90);
scene.add(extractionZone);

// Baliza luminosa en la zona de extracción
const beaconLight = new THREE.PointLight(0x00ff88, 4, 20);
beaconLight.position.set(0, 3, -90);
scene.add(beaconLight);

const wallMat = new THREE.MeshStandardMaterial({ color: 0x263238, roughness: 0.85 });
const crateMat = new THREE.MeshStandardMaterial({ color: 0x37474f, roughness: 0.7 });

function createWall(x, z, width, height, depth, isCrate = false) {
    const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(width, height, depth),
        isCrate ? crateMat : wallMat
    );
    mesh.position.set(x, height / 2, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
}

// Perímetro cerrado del sector 
createWall(12, -45, 2, 5, 110);  // Muro perimetral derecho
createWall(-12, -45, 2, 5, 110); // Muro perimetral izquierdo
createWall(0, 10, 26, 5, 2);     // Muro trasero (Inicio)
createWall(0, -100, 26, 5, 2);   // Muro final (Detrás de extracción)

// Obstáculos tácticos, barricadas y pilares
createWall(-5, -12, 8, 4, 2);
createWall(6, -24, 8, 4, 2);
createWall(0, -36, 10, 2.5, 2, true);
createWall(-6, -50, 7, 4, 2);
createWall(6, -50, 7, 4, 2);
createWall(0, -65, 8, 4, 2);
createWall(-5, -78, 6, 2.5, 2, true);
createWall(5, -78, 6, 2.5, 2, true);

// Cajas de Munición Coleccionables
const ammoBoxes = [];
function createAmmo(x, z, amount) {
    const box = new THREE.Mesh(
        new THREE.BoxGeometry(0.6, 0.6, 0.6),
        new THREE.MeshStandardMaterial({ color: 0xffaa00, emissive: 0x553300 })
    );
    box.position.set(x, 0.3, z);
    box.userData = { active: true, amount: amount };
    scene.add(box);
    ammoBoxes.push(box);
}
createAmmo(6, -15, 8);
createAmmo(-7, -38, 10);
createAmmo(0, -56, 8);
createAmmo(-8, -72, 10);

function endGame(victory) {
    if (victory) {
        isVictory = true;
        overlayTitle.style.color = "#00ff88";
        overlayTitle.innerText = "¡MISIÓN COMPLETADA!";
        overlaySub.innerText = "Has llegado a la zona de extracción.";
    } else {
        isGameOver = true;
        overlayTitle.style.color = "#ff3333";
        overlayTitle.innerText = "GAME OVER";
        overlaySub.innerText = "Has sido atrapado por la horda.";
    }
    controlsInfo.style.display = 'none';
    btnRestart.style.display = 'inline-block';
    overlay.style.display = 'flex';
    controls.unlock();
}

//SISTEMA DE ZOMBIS CON GENERACIÓN ALEATORIA
const zombies = [];
const DETECTION_RANGE = 18;

function createZombie(x, z, speed) {
    const zombieGroup = new THREE.Group();
    zombieGroup.position.set(x, 0, z);

    zombieGroup.userData = {
        isZombie: true,
        hp: 2,
        active: false,
        dead: false,
        speed: speed
    };

    gltfLoader.load('./assets/zombie.glb', (gltf) => {
        const model = gltf.scene;
        model.scale.set(1.0, 1.0, 1.0);
        model.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                if (child.material) child.material = child.material.clone();
            }
        });
        zombieGroup.add(model);
    });

    scene.add(zombieGroup);
    zombies.push(zombieGroup);
}


const TOTAL_ZOMBIES = 12;
for (let i = 0; i < TOTAL_ZOMBIES; i++) {
    const randX = (Math.random() - 0.5) * 18; 
    const randZ = -14 - (i * 6) - (Math.random() * 3);
    const randSpeed = 3.2 + Math.random() * 1.6;
    createZombie(randX, randZ, randSpeed);
}

//ENTRADAS Y DISPARO
const moveState = { forward: false, backward: false, left: false, right: false };

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

const muzzleFlash = new THREE.PointLight(0xffaa00, 0, 4);
muzzleFlash.position.set(0.28, -0.15, -0.8);
camera.add(muzzleFlash);

const raycaster = new THREE.Raycaster();
const centerScreen = new THREE.Vector2(0, 0);

window.addEventListener('mousedown', (e) => {
    if (!controls.isLocked || isGameOver || isVictory || e.button !== 0) return;

    const activeWep = weapons[currentWeapon];
    if (activeWep.ammo <= 0) return;

    activeWep.ammo--;
    updateHUD();

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

    raycaster.setFromCamera(centerScreen, camera);
    const aliveZombies = zombies.filter(z => !z.userData.dead);
    const intersects = raycaster.intersectObjects(aliveZombies, true);

    if (intersects.length > 0) {
        let hitNode = intersects[0].object;
        while (hitNode.parent && !hitNode.userData.isZombie) {
            hitNode = hitNode.parent;
        }

        if (hitNode && hitNode.userData.isZombie) {
            hitNode.userData.hp -= 1;

            hitNode.traverse((child) => {
                if (child.isMesh && child.material && child.material.emissive) {
                    child.material.emissive.setHex(0x881111);
                }
            });
            setTimeout(() => {
                if (!hitNode.userData.dead) {
                    hitNode.traverse((child) => {
                        if (child.isMesh && child.material && child.material.emissive) {
                            child.material.emissive.setHex(0x000000);
                        }
                    });
                }
            }, 120);

            if (hitNode.userData.hp <= 0) {
                hitNode.userData.dead = true;
                hitNode.userData.active = false;
                hitNode.rotation.x = -Math.PI / 2;
                hitNode.position.y = 0.2;
            }
        }
    }
});

//BUCLE PRINCIPAL //
const clock = new THREE.Clock();
const PLAYER_SPEED = 7.5;

function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();

    if (controls.isLocked && !isGameOver && !isVictory) {
        const step = PLAYER_SPEED * delta;
        if (moveState.forward) controls.moveForward(step);
        if (moveState.backward) controls.moveForward(-step);
        if (moveState.left) controls.moveRight(-step);
        if (moveState.right) controls.moveRight(step);

        const playerPos = camera.position;

        ammoBoxes.forEach(box => {
            if (box.userData.active && playerPos.distanceTo(box.position) < 1.6) {
                box.userData.active = false;
                box.visible = false;
                weapons[currentWeapon].ammo += box.userData.amount;
                updateHUD();
            }
        });

        if (Math.hypot(playerPos.x - extractionZone.position.x, playerPos.z - extractionZone.position.z) < 3.2) {
            endGame(true);
        }

        zombies.forEach((zombie) => {
            if (zombie.userData.dead) return;

            const dist = Math.hypot(playerPos.x - zombie.position.x, playerPos.z - zombie.position.z);

            if (!zombie.userData.active && dist <= DETECTION_RANGE) {
                zombie.userData.active = true;
            }

            if (zombie.userData.active) {
                zombie.lookAt(playerPos.x, zombie.position.y, playerPos.z);
                zombie.translateZ(zombie.userData.speed * delta);

                if (dist < 1.0) {
                    endGame(false);
                }
            }
        });
    }

    renderer.render(scene, camera);
}
animate();
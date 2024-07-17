import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';

import * as dat from 'dat.gui';

import { SceneManager } from './sceneManager.js';

let scene, renderer, container, sceneManager, raycaster;

let camera, cameraFirstPerson;
let controls;

let muestra_camara;

let objetos = [];
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let canJump = false;
let velocity = new THREE.Vector3();
let direction = new THREE.Vector3();
let prevTime = performance.now();

let clock = new THREE.Clock(false);

const camaras = {
	GENERAL: 'general',
	LOCOMOTORA_DELANTERA: 'locomotora_delantera',
	LOCOMOTORA_TRASERA: 'locomotora_trasera',
	TUNEL: 'tunel',
	PUENTE: 'puente',
	PRIMERA_PERSONA: 'primera_persona',
};

const params = {
	camaraActual: camaras.GENERAL,
	stop: false,
	position: 0,
	time: 0,
	velocidad: 1,
	lightx: 4,
	lighty: 5,
	lightz: 4,
};

const transiciones_camaras = {
	[camaras.GENERAL]: camaras.PRIMERA_PERSONA,
	[camaras.PRIMERA_PERSONA]: camaras.LOCOMOTORA_DELANTERA,
	[camaras.LOCOMOTORA_DELANTERA]: camaras.LOCOMOTORA_TRASERA,
	[camaras.LOCOMOTORA_TRASERA]: camaras.TUNEL,
	[camaras.TUNEL]: camaras.PUENTE,
	[camaras.PUENTE]: camaras.GENERAL,
};

const camaras_vista = {
	[camaras.GENERAL]: 'General',
	[camaras.PRIMERA_PERSONA]: 'Primera Persona',
	[camaras.LOCOMOTORA_DELANTERA]: 'Locomotora Delantera',
	[camaras.LOCOMOTORA_TRASERA]: 'Locomotora Trasera',
	[camaras.TUNEL]: 'Túnel',
	[camaras.PUENTE]: 'Puente',
};

// setup
function setupThreeJs() {
	container = document.getElementById('container3D');
	muestra_camara = document.getElementById('muestra_camara');

	renderer = new THREE.WebGLRenderer();
	renderer.setClearColor(0x999999);

	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.PCFSoftShadowMap;

	scene = new THREE.Scene();

	container.appendChild(renderer.domElement);

	camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
	camera.position.set(-20, 20, 40);
	camera.lookAt(0, 0, 0);

	cameraFirstPerson = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
	cameraFirstPerson.position.set(0, 10, 0);

	pointerControls();

	window.addEventListener('resize', onResize);
	onResize();

	window.addEventListener('keyup', onKeyUp);
	window.addEventListener('keydown', onKeyDown);

	raycaster = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0, -1, 0), 0, 10);
}

function pointerControls() {
	controls = new PointerLockControls(cameraFirstPerson, renderer.domElement);

	const blocker = document.getElementById('blocker');
	const instructions = document.getElementById('instructions');

	instructions.addEventListener('click', function () {
		controls.lock();
	});

	controls.addEventListener('lock', function () {
		instructions.style.display = 'none';
		blocker.style.display = 'none';
	});

	controls.addEventListener('unlock', function () {
		blocker.style.display = 'block';
		instructions.style.display = '';
	});

	scene.add(controls.getObject());
}

function onKeyUp(event) {
	switch (event.code) {
		case 'ArrowUp':
			moveForward = false;
			break;
		case 'ArrowLeft':
			moveLeft = false;
			break;
		case 'ArrowDown':
			moveBackward = false;
			break;
		case 'ArrowRight':
			moveRight = false;
			break;
	}
}

function onKeyDown(event) {
	if (event.key === 'c') {
		params.camaraActual = transiciones_camaras[params.camaraActual];
		muestra_camara.innerHTML = camaras_vista[params.camaraActual];
	} else if (event.key === 'd') {
		sceneManager.updateDayNight(renderer);
	} else {
		switch (event.code) {
			case 'ArrowUp':
				moveForward = true;
				break;
			case 'ArrowLeft':
				moveLeft = true;
				break;
			case 'ArrowDown':
				moveBackward = true;
				break;
			case 'ArrowRight':
				moveRight = true;
				break;
			case 'Space':
				if (canJump === true) velocity.y += 100;
				canJump = false;
				break;
		}
	}
}

function onResize() {
	let aspect = container.offsetWidth / container.offsetHeight;
	camera.aspect = aspect;
	camera.updateProjectionMatrix();

	cameraFirstPerson.aspect = aspect;
	cameraFirstPerson.updateProjectionMatrix();

	renderer.setSize(container.offsetWidth, container.offsetHeight);
	if (sceneManager) sceneManager.onResize(aspect);
}

function animateFirstPerson() {
	objetos = objetos.length === 0 ? sceneManager.collidableObjects : objetos;
	console.log(objetos);
	const time = performance.now();
	if (controls.isLocked === true) {
		raycaster.ray.origin.copy(controls.getObject().position);
		raycaster.ray.origin.y -= 780;

		const intersections = raycaster.intersectObjects(objetos, false);

		const onObject = intersections.length > 0;

		const delta = (time - prevTime) / 1000;

		velocity.x -= velocity.x * 30.0 * delta;
		velocity.z -= velocity.z * 30.0 * delta;

		velocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass

		direction.z = Number(moveForward) - Number(moveBackward);
		direction.x = Number(moveRight) - Number(moveLeft);
		direction.normalize(); // this ensures consistent movements in all directions

		if (moveForward || moveBackward) velocity.z -= direction.z * 400.0 * delta;
		if (moveLeft || moveRight) velocity.x -= direction.x * 400.0 * delta;

		if (onObject === true) {
			velocity.y = Math.max(0, velocity.y);
			canJump = true;
		}

		controls.moveRight(-velocity.x * delta);
		controls.moveForward(-velocity.z * delta);

		controls.getObject().position.y += velocity.y * delta;

		if (controls.getObject().position.y < 0) {
			velocity.y = 0;
			controls.getObject().position.y = 0;

			canJump = true;
		}
	}
	prevTime = time;
}

function animate() {
	requestAnimationFrame(animate);

	if (params.stop) {
		if (clock.running) clock.stop();
	} else {
		if (!clock.running) {
			clock.start();
			clock.elapsedTime = params.time;
		}
		params.time = clock.getElapsedTime();
		const velocidad = 1 / params.velocidad;
		params.position = (params.time % (35 * velocidad)) / (35 * velocidad);
	}
	sceneManager.animate(params);

	let cam;
	switch (params.camaraActual) {
		case camaras.GENERAL:
			cam = camera;
			break;
		case camaras.LOCOMOTORA_DELANTERA:
			cam = sceneManager.camaraLocomotoraDel;
			break;
		case camaras.LOCOMOTORA_TRASERA:
			cam = sceneManager.camaraLocomotoraTras;
			break;
		case camaras.TUNEL:
			cam = sceneManager.camaraTunel;
			break;
		case camaras.PUENTE:
			cam = sceneManager.camaraPuente;
			break;
		case camaras.PRIMERA_PERSONA:
			cam = cameraFirstPerson;
			animateFirstPerson();
			break;
		default:
			cam = camera;
			break;
	}

	renderer.render(scene, cam);
}

function createMenu() {
	const gui = new dat.GUI({ width: 200 });

	gui.add(params, 'stop').name('Frenar');
	gui.add(params, 'velocidad').name('Velocidad').min(1).max(4).step(0.5);
	gui.add(params, 'lightx').name('Luz Dir. X').min(-10).max(10).step(0.1);
	gui.add(params, 'lighty').name('Luz Dir. Y').min(0).max(10).step(0.1);
	gui.add(params, 'lightz').name('Luz Dir. Z').min(-10).max(10).step(0.1);
}

setupThreeJs();
sceneManager = new SceneManager(scene, renderer);
createMenu();
animate();

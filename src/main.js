import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import * as dat from 'dat.gui';

import { SceneManager } from './sceneManager.js';
let scene, camera, renderer, container, sceneManager;

let clock = new THREE.Clock(false);

const camaras = {
	GENERAL: 'general',
	LOCOMOTORA_DELANTERA: 'locomotora_delantera',
	LOCOMOTORA_TRASERA: 'locomotora_trasera',
	TUNEL: 'tunel',
};

const params = {
	camaraActual: camaras.GENERAL,
	stop: false,
	position: 0,
	time: 0,
};

const transiciones_camaras = {
	[camaras.GENERAL]: camaras.LOCOMOTORA_DELANTERA,
	[camaras.LOCOMOTORA_DELANTERA]: camaras.LOCOMOTORA_TRASERA,
	[camaras.LOCOMOTORA_TRASERA]: camaras.TUNEL,
	[camaras.TUNEL]: camaras.GENERAL,
};

// setup
function setupThreeJs() {
	container = document.getElementById('container3D');

	renderer = new THREE.WebGLRenderer();
	renderer.setClearColor(0x999999);

	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.PCFSoftShadowMap;

	scene = new THREE.Scene();

	container.appendChild(renderer.domElement);

	camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
	camera.position.set(-2, 2, 2);
	camera.lookAt(0, 0, 0);

	const controls = new OrbitControls(camera, renderer.domElement);

	window.addEventListener('resize', onResize);
	onResize();

	window.addEventListener('keydown', (event) => {
		if (event.key === 'c') {
			params.camaraActual = transiciones_camaras[params.camaraActual];
		} else if (event.key === 'd') {
			sceneManager.updateDayNight(renderer);
		}
	});
}

function onResize() {
	let aspect = container.offsetWidth / container.offsetHeight;
	camera.aspect = aspect;
	camera.updateProjectionMatrix();

	renderer.setSize(container.offsetWidth, container.offsetHeight);
	if (sceneManager) sceneManager.onResize(aspect);
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
		params.position = (params.time % 35) / 35;
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
		default:
			cam = camera;
			break;
	}

	renderer.render(scene, cam);
}

function createMenu() {
	const gui = new dat.GUI({ width: 100 });

	gui.add(params, 'stop').name('Frenar');
}

setupThreeJs();
sceneManager = new SceneManager(scene, renderer);
createMenu();
animate();

import * as THREE from 'three';
import { loadModels } from './loader.js';
import { construirTerreno } from './mapa.js';
import { construirLocomotora, largo_barra, radio_rueda } from './locomotora.js';
import { Path } from './path.js';
import { materials } from './material.js';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';

const ADD_HELPERS = false;

const modelPaths = [];

export class SceneManager {
	scene;
	container;

	path;

	camaraLocomotoraDel;
	camaraLocomotoraTras;
	//camaraPuente;
	camaraTunel;

	textures = {
		tierra1: { url: 'tierra1.jpg', object: null },
		tierra2: { url: 'tierra2.jpg', object: null },
		pasto1: { url: 'pasto1.jpg', object: null },
		pasto2: { url: 'pasto2.jpg', object: null },
		arena: { url: 'arena.jpg', object: null },
		tierraCostaMojada: { url: 'tierraCostaMojada.jpg', object: null },
		agua1: { url: 'agua1.jpg', object: null },
		agua2: { url: 'agua2.jpg', object: null },
		elevationMap: { url: 'elevationMap222.png', object: null },
		skyDay: { url: 'sky2.jpg', object: null },
		skyNight: { url: 'night.jpg', object: null },
		durmientes: { url: 'durmientes.jpg', object: null },
		durmientesBump: { url: 'durmientesBump.jpg', object: null },
		paredLadrillo: { url: 'pared_ladrillo.jpg', object: null },
		paredLadrilloNormal: { url: 'pared_ladrillo_normal.jpg', object: null },
		paredMadera: { url: 'pared_madera.jpg', object: null },
		paredMaderaNormal: { url: 'pared_madera_normal.jpg', object: null },
	};

	objetos = {};

	ready = false;

	directionalLight;
	hemiLight;

	sky = null;
	daySkyMaterial = null;
	nightSkyMaterial = null;

	lights = [];

	skyDay = new THREE.Color(0xccccff);
	skyNight = new THREE.Color(0x222299);
	isDaytime = true;

	constructor(scene, renderer) {
		this.scene = scene;

		if (this.container) {
			this.scene.remove(this.container);
		}
		this.container = new THREE.Group();

		this.directionalLight = new THREE.DirectionalLight(0xeeeeff, 0.2);
		this.directionalLight.position.set(-1, 4, 3);

		this.container.add(this.directionalLight);

		this.hemiLight = new THREE.HemisphereLight(0x8888dd, 0x080866, 0.2);
		this.container.add(this.hemiLight);

		/* 	const grid = new THREE.GridHelper(70, 70);
		this.container.add(grid);

		const axes = new THREE.AxesHelper(100);
		this.container.add(axes); */

		this.updateDayNight(renderer, false, false);
		this.loadTextures();
	}

	prepareScene() {
		this.crearYActualizarCielo();
		this.container.add(this.sky);

		// mapa
		const mapa = construirTerreno(70, 70, this.textures);
		this.container.add(mapa);

		this.objetos['mapa'] = mapa;

		// construir el camino
		this.buildPath();

		// construir la locomotora
		const { locomotora, ruedas, barras, parabrisas, luzLocomotora } = construirLocomotora(this.isDaytime);
		this.lights.push(luzLocomotora);

		this.container.add(locomotora);

		this.objetos['locomotora'] = locomotora;
		this.objetos['parabrisas'] = parabrisas;
		this.objetos['ruedas'] = ruedas;
		this.objetos['barras'] = barras;

		this.ready = true;

		this.generarCamaras();

		this.scene.add(this.container);

		this.generarSombras();
	}

	crearYActualizarCielo() {
		if (this.daySkyMaterial === null) {
			const daySkyTexture = this.textures.skyDay.object;
			daySkyTexture.wrapT = THREE.MirroredRepeatWrapping;
			daySkyTexture.repeat.set(1, 2);
			this.daySkyMaterial = new THREE.MeshBasicMaterial({
				map: daySkyTexture,
				side: THREE.BackSide,
			});
		}
		if (this.nightSkyMaterial === null) {
			const nightSkyTexture = this.textures.skyNight.object;
			nightSkyTexture.wrapT = THREE.MirroredRepeatWrapping;
			nightSkyTexture.repeat.set(1, 2);

			this.nightSkyMaterial = new THREE.MeshBasicMaterial({
				map: nightSkyTexture,
				side: THREE.BackSide,
			});
		}

		if (this.sky !== null) {
			this.sky.material = this.isDaytime ? this.daySkyMaterial : this.nightSkyMaterial;
		} else {
			this.sky = new THREE.Mesh(
				new THREE.SphereGeometry(500, 32, 32),
				this.isDaytime ? this.daySkyMaterial : this.nightSkyMaterial
			);
		}
	}

	buildPath() {
		this.path = new Path();

		/* const { line, points } = this.path.getLineGeometry();
		this.scene.add(line);
		this.scene.add(points); */

		const durmientes = this.path.crearDurmientes(
			this.textures.durmientes.object,
			this.textures.durmientesBump.object
		);
		this.container.add(durmientes);

		const { viaIzq, viaDer } = this.path.crearVias();
		this.container.add(viaIzq);
		this.container.add(viaDer);

		const puente = this.path.crearPuente(
			this.textures.paredLadrillo.object,
			this.textures.paredLadrilloNormal.object
		);
		this.container.add(puente);

		const tunel = this.path.crearTunel(this.textures.paredMadera.object, this.textures.paredMaderaNormal.object);
		this.container.add(tunel);

		this.objetos['tunel'] = tunel;
		this.objetos['puente'] = puente;
	}

	onResize(aspect) {
		this.camaraLocomotoraDel.aspect = aspect;
		this.camaraLocomotoraDel.updateProjectionMatrix();

		this.camaraLocomotoraTras.aspect = aspect;
		this.camaraLocomotoraTras.updateProjectionMatrix();

		this.camaraTunel.aspect = aspect;
		this.camaraTunel.updateProjectionMatrix();
	}

	animate(params) {
		if (!this.ready) return;

		if (!params.stop) {
			this._ubicarVehiculo(params.position);
		}
	}

	_ubicarVehiculo(u) {
		const locomotora = this.objetos.locomotora;

		const { position, lookAt } = this.path.getPositionLocomotora(u);
		locomotora.position.set(position.x, position.y, position.z);
		locomotora.lookAt(lookAt);

		const ruedas = this.objetos.ruedas;
		const barras = this.objetos.barras;

		const angle = u * 100;
		ruedas.forEach((gRueda) => {
			gRueda.rotation.z = angle;
		});

		barras.forEach((barra) => {
			barra.position.set(
				Math.cos(angle * 2) * (radio_rueda / 2) + largo_barra / 2,
				(Math.sin(angle * 2) * radio_rueda) / 2,
				barra.position.z
			);
		});
	}

	loadTextures() {
		const loadingManager = new THREE.LoadingManager();

		loadingManager.onLoad = () => {
			console.log('All textures loaded');
			this.prepareScene();
		};

		for (const key in this.textures) {
			const loader = new THREE.TextureLoader(loadingManager);
			const texture = this.textures[key];
			texture.object = loader.load('maps/' + texture.url, this.onTextureLoaded.bind(this, key), null, (error) => {
				console.error('Error loading texture', key);
				console.error(error);
			});
		}
	}

	onTextureLoaded(key, texture) {
		texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
		this.textures[key].object = texture;
		console.log(`Texture ${key} loaded`);
	}

	generarCamaras() {
		const parabrisas = this.objetos.parabrisas;
		const tunel = this.objetos.tunel;

		this.camaraLocomotoraDel = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
		this.camaraLocomotoraDel.position.set(0.5, 1, -0.5);
		this.camaraLocomotoraDel.lookAt(0, 0, 10);
		parabrisas.add(this.camaraLocomotoraDel);

		this.camaraLocomotoraTras = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
		this.camaraLocomotoraTras.position.set(0.5, 1, -0.5);
		this.camaraLocomotoraTras.lookAt(0, 0, -10);
		parabrisas.add(this.camaraLocomotoraTras);

		this.camaraTunel = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
		this.camaraTunel.position.set(-20, 3, -8);
		this.camaraTunel.lookAt(0, 0, -9);

		tunel.add(this.camaraTunel);
	}

	updateDayNight(renderer, changeDayTime = true, actualizaCielo = true) {
		if (changeDayTime) this.isDaytime = !this.isDaytime;
		const dayNight = this.isDaytime ? 0 : 1;

		let sky = this.skyDay.clone();
		sky.lerp(this.skyNight, dayNight);

		renderer.setClearColor(sky.getHex());
		materials.foco.emissive = new THREE.Color().setHSL(0.5, 0, dayNight);

		this.lights.forEach((light, i) => {
			light.intensity = dayNight * 100;
		});
		this.directionalLight.intensity = 1.5 - dayNight;
		this.hemiLight.intensity = 0.1 + (1 - dayNight) * 0.1;

		if (actualizaCielo) this.crearYActualizarCielo();
	}

	generarSombras() {
		this.scene.traverse((obj) => {
			if (obj.isMesh) {
				obj.receiveShadow = true;
				obj.castShadow = true;
			}
		});
	}
}

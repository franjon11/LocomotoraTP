import * as THREE from 'three';

import { ElevationGeometry } from './geometrias/elevationGeometry.js';
import { materials } from './material.js';

// #region Terreno

export function construirTerreno(width, height, textures) {
	const { tierra1, tierra2, pasto1, pasto2, arena, tierraCostaMojada, agua1, agua2, elevationMap } = textures;

	const amplitude = 13;
	const widthSegments = 350;
	const heightSegments = 350;
	const geoTerreno = ElevationGeometry(width, height, amplitude, widthSegments, heightSegments, elevationMap.object);

	const material = new THREE.MeshPhongMaterial({
		side: THREE.FrontSide,
		name: 'terreno',
	});
	material.defines = { USE_UV: true };

	// Modificar los shaders del material Phong
	material.onBeforeCompile = (shader) => {
		shader.uniforms.tierra1Sampler = { type: 't', value: tierra1.object };
		shader.uniforms.tierra2Sampler = { type: 't', value: tierra2.object };
		shader.uniforms.pasto1Sampler = { type: 't', value: pasto1.object };
		shader.uniforms.pasto2Sampler = { type: 't', value: pasto2.object };
		shader.uniforms.arenaSampler = { type: 't', value: arena.object };
		shader.uniforms.tierraCostaMojadaSampler = { type: 't', value: tierraCostaMojada.object };
		shader.uniforms.agua1Sampler = { type: 't', value: agua1.object };
		shader.uniforms.agua2Sampler = { type: 't', value: agua2.object };
		shader.uniforms.worldNormalMatrix = { value: null };

		shader.vertexShader = shader.vertexShader.replace(
			'vViewPosition = - mvPosition.xyz;',
			`
		vViewPosition = - mvPosition.xyz;
		vWorldPos = (modelMatrix*vec4(transformed,1.0)).xyz;
			`
		);

		shader.vertexShader =
			`
		varying vec3 vWorldPos;
		` + shader.vertexShader;

		shader.fragmentShader = declarationsFragmentShader + shader.fragmentShader;

		shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', mainFragmentShader);
	};

	materials['terreno'] = material;

	let terreno = new THREE.Mesh(geoTerreno, material);
	terreno.name = 'terreno';

	return terreno;
}

export function construirAgua(width, height) {
	const geoAgua = new THREE.PlaneGeometry(width * 0.98, height * 0.98);
	const agua = new THREE.Mesh(geoAgua, materials['agua']);
	agua.position.set(0, 0.4, 0);
	agua.rotation.set(-Math.PI / 2, 0, 0);

	return agua;
}

const declarationsFragmentShader = ` 
			uniform sampler2D tierra1Sampler;
			uniform sampler2D tierra2Sampler;
			uniform sampler2D pasto1Sampler;
			uniform sampler2D pasto2Sampler;
			uniform sampler2D arenaSampler;
			uniform sampler2D tierraCostaMojadaSampler;
			uniform sampler2D agua1Sampler;
			uniform sampler2D agua2Sampler;

			varying vec3 vWorldPos;
			
			`;

const mainFragmentShader = `
		// calculamos las coordenadas UV en base a las coordenadas de mundo
		vec2 uv=vUv*5.0;

        vec3 tierra1=texture2D(tierra1Sampler,uv).xyz;
        vec3 tierra2=texture2D(tierra2Sampler,uv).xyz;

		vec3 pasto1=texture2D(pasto1Sampler,uv).xyz;
		vec3 pasto2=texture2D(pasto2Sampler,uv).xyz;

		vec3 arena=texture2D(arenaSampler,uv).xyz;
		vec3 piedritas=texture2D(tierraCostaMojadaSampler,uv*3.5).xyz;

		vec3 agua1=texture2D(agua1Sampler,uv).xyz;
		vec3 agua2=texture2D(agua2Sampler,uv).xyz;

		float y = vWorldPos.y;

        // La tierra seca en zonas altas
        float erosionFactor=smoothstep(0.3,3.0,y);

		// Factor de Costa
        float costa1Factor=smoothstep(-0.3,0.1,y);
        float costa2Factor=smoothstep(-1.0,-0.1,y);

		// El agua en zonas bajas
        float aguaFactor=smoothstep(-1.5,-0.7,y);

        // mezcla de tierras
        vec3 tierras=mix(tierra1,tierra2,0.2);

        // mezcla de pastos
        vec3 pastos=mix(pasto1,pasto2,0.45);

		// agua
		vec3 agua=mix(agua1,agua2,0.90);
        
        // mezclar elementos
		vec3 grassDirt=mix(pastos,tierras,erosionFactor);
		vec3 grassArenaRock=mix(arena,grassDirt,costa1Factor);
		vec3 grassArenaPiedraRock=mix(piedritas,grassArenaRock,costa2Factor);
		vec3 grassDirtRockWater=mix(agua,grassArenaPiedraRock,aguaFactor);

		diffuseColor = vec4(grassDirtRockWater,1.0);	
`;

// #endregion

//#region Arboles

export function construirArboles(width, height, arbolesProhibidos) {
	const count = 50;

	// geometria de los troncos
	const tronco_geo = new THREE.CylinderGeometry(0.3, 0.3, 1, 12, 1, true);

	const tronco_i_b_geo = new THREE.InstancedBufferGeometry();
	tronco_i_b_geo.copy(tronco_geo);

	// geometria de las copas (simular con esferas)
	const copa_geo = new THREE.SphereGeometry(1.5, 12, 12);
	const copa_i_b_geo = new THREE.InstancedBufferGeometry();
	copa_i_b_geo.copy(copa_geo);

	const troncos = new THREE.InstancedMesh(tronco_i_b_geo, materials.tronco, count);
	const copas = new THREE.InstancedMesh(copa_i_b_geo, materials.hoja, count * 3);

	// Crear matrices de transformación aleatorias para cada instancia
	const rotMatrix = new THREE.Matrix4();
	rotMatrix.makeRotationY(Math.PI / 2);

	const matrixTronco = new THREE.Matrix4();
	const matrixCopa = new THREE.Matrix4();

	const transMTronco = new THREE.Matrix4();
	const transMCopa = new THREE.Matrix4();

	let puntos_arboles = generarPuntosHabilitados(count, width, height, arbolesProhibidos);

	let idx_copa = 0;
	for (let i = 0; i < count; i++) {
		let { x, z } = puntos_arboles[i];

		let altura = randomInteger(1, 4);
		let position = new THREE.Vector3(x, altura / 2, z);
		transMTronco.makeTranslation(position);

		// troncos
		matrixTronco.identity();
		matrixTronco.makeScale(1, altura, 1);
		matrixTronco.premultiply(rotMatrix);
		matrixTronco.premultiply(transMTronco);

		troncos.setMatrixAt(i, matrixTronco);

		// 1er copa
		let expandido = randomFloat(1.2, 1.7);
		position.y = altura + expandido;

		transMCopa.makeTranslation(position);

		matrixCopa.identity();
		matrixCopa.makeScale(expandido, expandido, expandido);
		matrixCopa.premultiply(transMCopa);

		copas.setMatrixAt(idx_copa, matrixCopa);

		// 2da copa
		expandido = randomFloat(0.8, 1.5);

		position.x += randomFloat(-0.5, 1);
		position.y += randomFloat(0.2, 1);
		position.z += randomFloat(-0.5, 1);

		transMCopa.makeTranslation(position);

		matrixCopa.identity();
		matrixCopa.makeScale(expandido, expandido, expandido);
		matrixCopa.premultiply(transMCopa);

		copas.setMatrixAt(idx_copa + 1, matrixCopa);

		// 3er copa
		expandido = randomFloat(0.65, 1.3);

		position.x += randomFloat(0, 1);
		position.y += randomFloat(-0.1, 0.4);
		position.z += randomFloat(-0.5, 1);

		transMCopa.makeTranslation(position);

		matrixCopa.identity();
		matrixCopa.makeScale(expandido, expandido, expandido);
		matrixCopa.premultiply(transMCopa);

		copas.setMatrixAt(idx_copa + 2, matrixCopa);

		idx_copa += 3;
	}
	return { troncos, copas };
}

function esZonaProhibida(x, z, height, imageData) {
	const pixelIndex = (x + z * height) * 4;
	const r = imageData[pixelIndex];
	const g = imageData[pixelIndex + 1];
	const b = imageData[pixelIndex + 2];

	// Verifica si el color es rojo (puedes ajustar los valores según tu textura)
	return r > 200 && g < 50 && b < 50;
}

const cota_cercania_arbol = 3;
const cota_cercania_borde = 1.4;
function generarPuntosHabilitados(cantidad, width, height, texture) {
	const canvas = document.createElement('canvas');
	const context = canvas.getContext('2d');

	canvas.width = width;
	canvas.height = height;

	context.drawImage(texture.image, 0, 0, width, height);
	const imageData = context.getImageData(0, 0, width, height);

	const puntos = [];
	while (puntos.length < cantidad) {
		const x = Math.floor(randomFloat(0, width));
		const z = Math.floor(randomFloat(0, height));

		// y agregar solo si esta a mas de 2 posiciones de los demas puntos generados
		const estaCercaDeOtro = puntos.some(
			(p) => Math.abs(p.x - x) < cota_cercania_arbol && Math.abs(p.z - z) < cota_cercania_arbol
		);
		const estaAlejadoDeBorde =
			x > cota_cercania_borde &&
			x < width - cota_cercania_borde &&
			z > cota_cercania_borde &&
			z < height - cota_cercania_borde;
		if (!esZonaProhibida(x, z, height, imageData.data) && !estaCercaDeOtro && estaAlejadoDeBorde) {
			puntos.push({ x: x - width / 2 + 0.15, z: z - height / 2 + 0.15 });
		}
	}
	return puntos;
}

// #endregion

// #region Utilidades

let c1 = 0;
let SEED1 = 49823.3232;
let SEED2 = 92733.112;
function randomFloat(from, to) {
	let value = from + (0.5 + 0.5 * Math.sin(c1 * SEED2)) * (to - from);
	c1 += value;
	return value;
}

function randomInteger(from, to) {
	let value = from + Math.floor((0.5 + 0.5 * Math.sin(c1 * SEED1)) * (to - from));
	c1 += value;
	return value;
}

// #endregion

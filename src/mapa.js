import * as THREE from 'three';

import { ElevationGeometry } from '../geometrias/elevationGeometry.js';
import { materials } from './material.js';

export function construirTerreno(width, height, textures) {
	const a = new THREE.Mesh(
		new THREE.PlaneGeometry(width, height, 350, 350),
		new THREE.MeshPhongMaterial({ color: materials.pasto.color, side: THREE.DoubleSide })
	);
	a.rotation.set(Math.PI / 2, 0, 0);
	return a;

	const { tierra1, tierra2, pasto1, pasto2, arena, tierraCostaSeca, tierraCostaMojada, agua1, agua2, elevationMap } =
		textures;

	// PASTO
	const amplitude = 13;
	const widthSegments = 350;
	const heightSegments = 350;
	const geoTerreno = ElevationGeometry(width, height, amplitude, widthSegments, heightSegments, elevationMap.object);

	const material = new THREE.RawShaderMaterial({
		uniforms: {
			tierra1Sampler: { type: 't', value: tierra1.object },
			tierra2Sampler: { type: 't', value: tierra2.object },
			pasto1Sampler: { type: 't', value: pasto1.object },
			pasto2Sampler: { type: 't', value: pasto2.object },
			arenaSampler: { type: 't', value: arena.object },
			tierraCostaMojadaSampler: { type: 't', value: tierraCostaMojada.object },
			agua1Sampler: { type: 't', value: agua1.object },
			agua2Sampler: { type: 't', value: agua2.object },
			worldNormalMatrix: { type: 'm4', value: null },
		},
		vertexShader: vertexShader,
		fragmentShader: fragmentShader,
		side: THREE.DoubleSide,
	});

	const terreno = new THREE.Mesh(geoTerreno, material);

	material.needsUpdate = true;
	material.onBeforeRender = (renderer, scene, camera, geometry, mesh) => {
		let m = mesh.matrixWorld.clone();
		m = m.transpose().invert();
		mesh.material.uniforms.worldNormalMatrix.value = m;
	};

	return terreno;
}

export function construirAgua(width, height) {
	const geoAgua = new THREE.PlaneGeometry(width * 0.98, height * 0.98);
	const agua = new THREE.Mesh(geoAgua, materials['agua']);
	agua.position.set(0, 0.4, 0);
	agua.rotation.set(-Math.PI / 2, 0, 0);

	return agua;
}

const vertexShader = `    
    precision highp float;

    // Atributos de los vértices
    attribute vec3 position; 	
    attribute vec3 normal; 	
    attribute vec2 uv;		 	

    // Uniforms
    uniform mat4 modelMatrix;		// Matriz de transformación del objeto
    uniform mat4 worldNormalMatrix;	// Matriz de normales
    uniform mat4 viewMatrix;		// Matriz de transformación de la cámara
    uniform mat4 projectionMatrix;	// Matriz de proyección de la cámara

    // Varying
    varying vec2 vUv;	    // Coordenadas de textura que se pasan al fragment shader
    varying vec3 vNormal;	// Normal del vértice que se pasa al fragment shader
    varying vec3 vWorldPos;	// Posición del vértice en el espacio  de mundo

    void main() {
        
        // Lee la posición del vértice desde los atributos

        vec3 pos = position;	

        // Se calcula la posición final del vértice
        // Se aplica la transformación del objeto, la de la cámara y la de proyección

        gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(pos, 1.0);

        // Se pasan las coordenadas de textura al fragment shader
        vUv = uv;
        vNormal = normalize(vec3(worldNormalMatrix * vec4(normal, 0.0)));
        vWorldPos = (modelMatrix * vec4(pos, 1.0)).xyz;
    }
`;

const fragmentShader = `
    precision mediump float;
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vWorldPos;

	uniform sampler2D tierra1Sampler;
	uniform sampler2D tierra2Sampler;
	uniform sampler2D pasto1Sampler;
	uniform sampler2D pasto2Sampler;
	uniform sampler2D arenaSampler;
	uniform sampler2D tierraCostaMojadaSampler;
	uniform sampler2D agua1Sampler;
	uniform sampler2D agua2Sampler;

    void main(void) {
        vec2 uv=vUv*8.0;

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

        gl_FragColor = vec4(grassDirtRockWater,1.0);	
        //gl_FragColor = vec4(vWorldPos.y,0.0,0.0,1.0);	
    }
    `;

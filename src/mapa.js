import * as THREE from 'three';

import { ElevationGeometry } from './geometrias/elevationGeometry.js';
import { materials } from './material.js';

export function construirTerreno(width, height, textures) {
	const { tierra1, tierra2, pasto1, pasto2, arena, tierraCostaMojada, agua1, agua2, elevationMap } = textures;

	// PASTO
	const amplitude = 13;
	const widthSegments = 350;
	const heightSegments = 350;
	const geoTerreno = ElevationGeometry(width, height, amplitude, widthSegments, heightSegments, elevationMap.object);

	/* const material = new THREE.RawShaderMaterial({
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
	}); */

	// phong material
	const material = new THREE.MeshPhongMaterial({
		side: THREE.FrontSide,
	});
	material.defines = { USE_UV: true };

	// Modificar los shaders del material Phong
	material.onBeforeCompile = (shader) => {
		// agregar las texturas
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

	return new THREE.Mesh(geoTerreno, material);
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

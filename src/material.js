import * as THREE from 'three';

export const materials = {
	pasto: new THREE.MeshPhongMaterial({ color: 0x33ff633, name: 'pasto' }),
	agua: new THREE.MeshPhongMaterial({ color: 0x61d2ff, name: 'agua' }),

	locomotora: new THREE.MeshPhongMaterial({ color: 0xff0000, name: 'locomotora' }),
	barra: new THREE.MeshPhongMaterial({ color: 0x888888, name: 'barra' }),
	cil_barra: new THREE.MeshPhongMaterial({ color: 0x8b4513, shininess: 100, name: 'cil_barra' }),
	techo: new THREE.MeshPhongMaterial({ color: 0xffff00, name: 'techo' }),

	via: new THREE.MeshPhongMaterial({ color: 0x999999, shininess: 100, name: 'via' }),

	foco: new THREE.MeshPhongMaterial({ emissive: 0xffff00, name: 'foco' }),

	tronco: new THREE.MeshPhongMaterial({ color: 0x8b4513, name: 'tronco', side: THREE.DoubleSide }),
	hoja: new THREE.MeshPhongMaterial({
		color: 0x00ff00,
		name: 'hoja',
		side: THREE.DoubleSide,
		transparent: true,
	}),

	fierro_puente: new THREE.MeshPhongMaterial({
		color: 0x999999,
		shininess: 100,
		name: 'fierro_puente',
		specular: 0x8c8c8c,
	}),
};

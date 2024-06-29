import * as THREE from 'three';

export const materials = {
	pasto: new THREE.MeshPhongMaterial({ color: 0x33ff633, name: 'pasto' }),
	agua: new THREE.MeshPhongMaterial({ color: 0x61d2ff, name: 'agua' }),

	locomotora: new THREE.MeshPhongMaterial({ color: 0xff0000 }),
	rueda: new THREE.MeshPhongMaterial({ color: 0x000000 }),
	barra: new THREE.MeshPhongMaterial({ color: 0x888888 }),
	cil_barra: new THREE.MeshPhongMaterial({ color: 0x8b4513, shininess: 100 }),
	techo: new THREE.MeshPhongMaterial({ color: 0xffff00 }),

	via: new THREE.MeshPhongMaterial({ color: 0x999999, shininess: 100 }),

	foco: new THREE.MeshPhongMaterial({ emissive: 0xffff00 }),
};

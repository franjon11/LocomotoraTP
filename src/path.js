import * as THREE from 'three';
import { ParametricGeometry } from 'three/addons/geometries/ParametricGeometry.js';
import { materials } from './material';

export class Path {
	path;
	pathPuente;
	pathTunel;

	formaVia;
	formaDurmiente;

	formaTunel;
	formaPuente;

	constructor() {
		this.crearRecorrido();

		this.crearPathPuente();
		this.crearPathTunel();

		this.crearFormaDurmientes();
		this.crearFormaVia();

		this.crearFormaTunel();
		this.crearFormaPuente();
	}

	//#region Utiles PATH

	getLineGeometry(path, numPoints = 100) {
		const points = path.getPoints(numPoints);
		const geometry = new THREE.BufferGeometry().setFromPoints(points);
		const material = new THREE.LineBasicMaterial({ color: 0x990000 });

		// mostrar los puntos
		const pointsMaterial = new THREE.PointsMaterial({ color: 0x0000ff, size: 0.2 });
		const pointsGeometry = new THREE.BufferGeometry().setFromPoints(path.points);
		const pointsMesh = new THREE.Points(pointsGeometry, pointsMaterial);

		return { line: new THREE.Line(geometry, material), points: pointsMesh };
	}

	getSubCurve(initialPoint, finalPoint, numPoints) {
		const delta = (finalPoint - initialPoint) / numPoints;
		const newPoints = [];
		for (let i = initialPoint; i < finalPoint; i += delta) {
			newPoints.push(this.path.getPointAt(i));
		}

		return new THREE.CatmullRomCurve3(newPoints);
	}
	//#endregion

	//#region Position locomotora
	getPositionLocomotora(u) {
		let pos = this.path.getPointAt(u);
		pos.y += 0.5 + this.anchoVia;
		let target = this.path.getPointAt((u + 0.01) % 1);
		target.y += 2;
		let tangente = new THREE.Vector3();
		tangente.subVectors(target, pos).normalize();
		let yAxis = new THREE.Vector3(0, -1, 0);

		let normal = new THREE.Vector3();
		normal.crossVectors(yAxis, tangente).normalize();
		let target2 = new THREE.Vector3();
		target2.addVectors(pos, normal);

		return { position: pos, lookAt: target2 };
	}

	//#endregion

	//#region Utiles Superficies
	crearMatrizDeNivel(t, v) {
		const ejeY = new THREE.Vector3(0, 1, 0);

		const n = new THREE.Vector3();
		n.crossVectors(t, ejeY);

		const b = new THREE.Vector3();
		b.crossVectors(t, n);

		const m = new THREE.Matrix4();
		m.set(n.x, n.y, n.z, 0, b.x, b.y, b.z, 0, t.x, t.y, t.z, 0, v.x, v.y, v.z, 1);

		m.transpose();

		return m;
	}

	getParametricPathFunction(u, v, target, forma, path, offset = {}) {
		const vForma = forma.getPointAt(u);

		const vRecorrido = path.getPointAt(v);
		const tRecorrido = path.getTangentAt(v);

		const m = this.crearMatrizDeNivel(tRecorrido, vRecorrido);

		if (offset.offsetX) vForma.x += offset.offsetX;
		if (offset.offsetY) vForma.y += offset.offsetY;
		if (offset.offsetZ) vForma.z += offset.offsetZ;

		const vector = new THREE.Vector4(vForma.x, vForma.y, vForma.z, 1);
		const nuevo = vector.applyMatrix4(m);

		target.set(nuevo.x, nuevo.y, nuevo.z);
	}

	//#endregion

	//#region
	crearRecorrido() {
		this.path = new THREE.CatmullRomCurve3(
			[
				new THREE.Vector3(4, 0, 25),
				new THREE.Vector3(15, 0, 26),
				new THREE.Vector3(25, 0, 26),
				new THREE.Vector3(28, 0, 25),
				new THREE.Vector3(30, 0, 23),
				new THREE.Vector3(31, 0, 20),
				new THREE.Vector3(32, 0, 16),
				new THREE.Vector3(32, 0, 10),
				new THREE.Vector3(32, 0, 4),

				new THREE.Vector3(29, 0, -2),
				new THREE.Vector3(25, 0, -8),
				new THREE.Vector3(21, 0, -13),
				new THREE.Vector3(17, 0, -17),
				new THREE.Vector3(13, 0, -20),
				new THREE.Vector3(6, 0, -23),
				new THREE.Vector3(0, 0, -24),

				new THREE.Vector3(-9, 0, -22),
				new THREE.Vector3(-13, 0, -19),
				new THREE.Vector3(-16, 0, -15),
				new THREE.Vector3(-19, 0, -10),
				new THREE.Vector3(-22, 0, -5),
				new THREE.Vector3(-23, 0, -2),

				new THREE.Vector3(-24, 0, 2),
				new THREE.Vector3(-23, 0, 7),
				new THREE.Vector3(-20, 0, 10),
				new THREE.Vector3(-17, 0, 11),
				new THREE.Vector3(-11, 0, 13),
			],
			true
		);
	}

	crearPathPuente() {
		this.pathPuente = this.getSubCurve(0.02, 0.105, 10);
	}

	crearPathTunel() {
		this.pathTunel = this.getSubCurve(0.65, 0.73, 10);
	}

	//#endregion

	//#region Formas
	anchoDurmiente = 2;
	altoDurmiente = 0.125;
	crearFormaDurmientes() {
		this.formaDurmiente = new THREE.Shape();
		this.formaDurmiente.moveTo(0, 0);
		this.formaDurmiente.lineTo(this.anchoDurmiente, 0);
		this.formaDurmiente.lineTo(this.anchoDurmiente, this.altoDurmiente);
		this.formaDurmiente.lineTo(0, this.altoDurmiente);
		this.formaDurmiente.lineTo(0, 0);
	}

	anchoVia = 0.0625;
	crearFormaVia() {
		this.formaVia = new THREE.Shape();
		this.formaVia.moveTo(0, 0);
		this.formaVia.lineTo(this.anchoVia, 0);
		this.formaVia.lineTo(this.anchoVia, this.anchoVia);
		this.formaVia.lineTo(0, this.anchoVia);
		this.formaVia.lineTo(0, 0);
	}

	anchoTunel = 3;
	altoTunel = 3.5;
	altoTechoTunel = 0.5;
	crearFormaTunel() {
		this.formaTunel = new THREE.Shape();
		this.formaTunel.moveTo(0, 0);
		this.formaTunel.lineTo(-this.altoTunel, 0);
		this.formaTunel.lineTo(-this.altoTunel - this.altoTechoTunel, this.anchoTunel / 2);
		this.formaTunel.lineTo(-this.altoTunel, this.anchoTunel);
		this.formaTunel.lineTo(0, this.anchoTunel);
	}

	radioPuente = 0.5;
	anchoPuente = 1.25;
	altoPuente = 1.75;
	altoArcoPuente = 1;
	profundidadPuente = 3;
	largoPuente = 2;
	crearFormaPuente() {
		const radius = this.radioPuente;
		const width = this.anchoPuente;
		const height = this.altoPuente;

		this.formaPuente = new THREE.Shape();
		this.formaPuente.moveTo(width / 2, 0);
		this.formaPuente.lineTo(width / 2, height);
		this.formaPuente.lineTo(-width / 2, height);
		this.formaPuente.lineTo(-width / 2, 0);

		const ctx = new THREE.Shape()
			.moveTo(radius, 0)
			.lineTo(radius, this.altoArcoPuente)
			.absarc(0, this.altoArcoPuente, radius, 0, Math.PI, false)
			.lineTo(-radius, 0);

		this.formaPuente.holes.push(ctx);
		//this.formaPuente = ctx;
	}
	//#endregion

	//#region Superficies
	crearDurmientes(textura, bump) {
		const offset = { offsetX: -0.75, offsetY: -0.125 };
		let geometry = new ParametricGeometry(
			(u, v, target) => this.getParametricPathFunction(u, v, target, this.formaDurmiente, this.path, offset),
			50,
			50
		);

		const material = new THREE.MeshPhongMaterial({ map: textura, bumpMap: bump });

		material.map.repeat.set(2, this.path.getLength());
		material.map.offset.set(1.1, 0);

		return new THREE.Mesh(geometry, material);
	}

	crearVias() {
		const offsetDer = { offsetX: 0.6, offsetY: -(this.altoDurmiente + this.anchoVia) };
		const offsetIzq = { offsetX: -0.4, offsetY: -(this.altoDurmiente + this.anchoVia) };

		let geometryDer = new ParametricGeometry(
			(u, v, target) => this.getParametricPathFunction(u, v, target, this.formaVia, this.path, offsetDer),
			50,
			50
		);

		let geometryIzq = new ParametricGeometry(
			(u, v, target) => this.getParametricPathFunction(u, v, target, this.formaVia, this.path, offsetIzq),
			50,
			50
		);

		const material = materials.via;

		const viaDer = new THREE.Mesh(geometryDer, material);
		const viaIzq = new THREE.Mesh(geometryIzq, material);

		return { viaIzq, viaDer };
	}

	crearPuente(textura, normal) {
		const puente = new THREE.Group();

		const extrudeSettings = {
			steps: 10,
			bevelEnabled: true,
			depth: this.profundidadPuente,
			bevelThickness: 0.15,
		};
		const material = new THREE.MeshPhongMaterial({ map: textura, normalMap: normal, side: THREE.DoubleSide });
		const geometry = new THREE.ExtrudeGeometry(this.formaPuente, extrudeSettings);
		const puenteMain = new THREE.Mesh(geometry, material);

		const cantidadArcos = this.pathPuente.getLength() / this.anchoPuente;
		for (let i = 0; i < cantidadArcos; i++) {
			const arco = puenteMain.clone();
			arco.position.set(this.anchoPuente * i, 0, -this.altoPuente / 2);
			puente.add(arco);
		}

		const initialPos = this.pathPuente.getPointAt(0);
		puente.position.set(initialPos.x, -this.altoPuente, initialPos.z - this.anchoVia * 4);

		return puente;
	}

	crearTunel(textura, normal) {
		const extrudeSettings = {
			steps: 10,
			bevelEnabled: false,
			extrudePath: this.pathTunel,
		};

		const shape = this.formaTunel;
		const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);

		const material = new THREE.MeshPhongMaterial({ map: textura, normalMap: normal, side: THREE.DoubleSide });
		const materialFace = new THREE.MeshPhongMaterial({ visible: false });
		const tunel = new THREE.Mesh(geometry, [materialFace, material]);

		tunel.position.y = -0.5;
		tunel.position.z = -this.anchoTunel;

		return tunel;
	}

	//#endregion
}

import * as THREE from 'three';
import { materials } from './material';

const CANTIDAD_RUEDAS_POR_LADO = 3;

export function construirLocomotora(isDaytime, texturaRueda, alphaRueda) {
	const locomotora = new THREE.Group();
	locomotora.name = 'locomotora';

	const { base, ruedas, barras } = crearBase(texturaRueda, alphaRueda);
	base.position.set(0, 0, 0);
	locomotora.add(base);

	const { cuerpo, luz } = crearCuerpo(isDaytime);
	cuerpo.position.set(largo_base / 8, (alto_base_cuerpo + alto_base) / 2, 0);
	base.add(cuerpo);

	const { cabina, ventana2 } = crearCabina();
	cabina.position.set(-largo_base / 2, 0.1, 0);
	locomotora.add(cabina);

	locomotora.position.set(0, 0, 0);
	return { locomotora, ruedas, barras, parabrisas: ventana2, luzLocomotora: luz };
}

//#region Utils
function crearCilindro(largo, radio, material) {
	const geo = new THREE.CylinderGeometry(radio, radio, largo, 20);
	return new THREE.Mesh(geo, material);
}
//#endregion

//#region Cabina

const alto_base_cabina = 0.75;
const ancho_base_cabina = 0.75;
const largo_base_cabina = 1.5;
function crearBaseCabina() {
	const shape = new THREE.Shape();
	shape.moveTo(0, 0);
	shape.lineTo(0, alto_base_cabina);
	shape.lineTo(ancho_base_cabina, alto_base_cabina);
	shape.lineTo(ancho_base_cabina, alto_base_cabina / 2);
	shape.lineTo(ancho_base_cabina / 2, 0);
	shape.lineTo(0, 0);

	const extrudeSettings = {
		steps: 5,
		depth: largo_base_cabina,
		bevelEnabled: false,
	};

	return new THREE.Mesh(new THREE.ExtrudeGeometry(shape, extrudeSettings), materials.locomotora);
}
const alto_abertura_ventana = 0.75;
const alto_ventana = 1.5;
const ancho_ventana = 1;
const profundidad_ventana = 0.05;
function crearVentana() {
	const shape = new THREE.Shape();
	shape.moveTo(0, 0);
	shape.lineTo(0, alto_ventana);
	shape.lineTo(ancho_ventana, alto_ventana);
	shape.lineTo(ancho_ventana, 0);
	shape.lineTo(0, 0);

	const borde = 0.05;
	const hole = new THREE.Path();
	hole.moveTo(borde, alto_ventana - borde);
	hole.lineTo(ancho_ventana - borde, alto_ventana - borde);
	hole.lineTo(ancho_ventana - borde, alto_abertura_ventana);
	hole.lineTo(borde, alto_abertura_ventana);
	hole.lineTo(borde, alto_ventana - borde);

	shape.holes.push(hole);

	const extrudeSettings = {
		steps: 5,
		depth: profundidad_ventana,
		bevelEnabled: false,
	};

	return new THREE.Mesh(new THREE.ExtrudeGeometry(shape, extrudeSettings), materials.locomotora);
}

const largo_piso_cabina = ancho_ventana;
const ancho_piso_cabina = 1.25;
const alto_piso_cabina = 0.05;
function crearPisoCabina() {
	return new THREE.Mesh(
		new THREE.BoxGeometry(largo_piso_cabina, alto_piso_cabina, ancho_piso_cabina),
		materials.locomotora
	);
}

const radio_techo_curvado = 5;
const largo_techo_curvado = 1.25;
const ancho_techo_curvado = 0.1;
function crearTechoCurvadoCabina() {
	const startAngle = Math.PI / 2 - 0.15;
	const endAngle = Math.PI / 2 + 0.15;

	const shape = new THREE.Shape()
		.moveTo(radio_techo_curvado, 0)
		.absarc(0, 0, radio_techo_curvado, startAngle, endAngle, false)
		.absarc(0, 0, radio_techo_curvado - ancho_techo_curvado, endAngle, startAngle, true);

	const extrudeSettings = {
		steps: 5,
		depth: largo_techo_curvado,
		bevelEnabled: false,
	};

	return new THREE.Mesh(new THREE.ExtrudeGeometry(shape, extrudeSettings), materials.techo);
}

function crearCabina() {
	const cabina = new THREE.Group();

	let base = crearBaseCabina();
	base.position.set(-ancho_base_cabina / 3, -alto_base_cabina / 2, -largo_base_cabina / 2);
	cabina.add(base);

	const piso = crearPisoCabina();

	piso.position.set(
		largo_piso_cabina / 2 + 0.1,
		alto_base_cabina + alto_piso_cabina / 2,
		ancho_piso_cabina / 2 + 0.1
	);
	base.add(piso);

	const ventana1 = crearVentana();
	ventana1.position.set(-largo_piso_cabina / 2, 0, -ancho_piso_cabina / 2);

	const ventana2 = crearVentana();
	ventana2.scale.set(1.25, 1, 1);
	ventana2.rotation.set(0, Math.PI / 2, 0);
	ventana2.position.set(ancho_ventana - profundidad_ventana, 0, ancho_ventana * 1.25);

	const ventana3 = crearVentana();
	ventana3.position.set(0, 0, ancho_piso_cabina - profundidad_ventana);

	piso.add(ventana1);
	ventana1.add(ventana2);
	ventana1.add(ventana3);

	const techo = crearPisoCabina();
	techo.position.set(0, alto_ventana, 0);
	piso.add(techo);

	const techoCurvado = crearTechoCurvadoCabina();
	techoCurvado.position.set(
		-largo_techo_curvado / 2,
		-radio_techo_curvado + ancho_techo_curvado + profundidad_ventana,
		0
	);
	techoCurvado.rotation.set(0, Math.PI / 2, 0);
	techo.add(techoCurvado);

	return { cabina, ventana2 };
}

//#endregion

//#region Cuerpo

const largo_base_cuerpo = 3;
const alto_base_cuerpo = 0.1;
const ancho_base_cuerpo = 1.5;
function crearCuerpo(isDaytime) {
	const cuerpo = new THREE.Mesh(
		new THREE.BoxGeometry(largo_base_cuerpo, alto_base_cuerpo, ancho_base_cuerpo),
		materials.locomotora
	);

	const { motor, luz } = crearMotor(isDaytime);
	motor.position.set(0, alto_base_cuerpo, 0);
	cuerpo.add(motor);

	return { cuerpo, luz };
}

const largo_cilindro_grande = 0.3;
const radio_cilindro_grande = 0.7;
function crearCilindroGrande() {
	let cil = crearCilindro(largo_cilindro_grande, radio_cilindro_grande, materials.locomotora);

	cil.rotation.set(0, 0, Math.PI / 2);
	return cil;
}

const largo_chimenea = 0.6;
const radio_chimenea = 0.1;
function crearChimenea() {
	let chimenea = crearCilindro(largo_chimenea, radio_chimenea, materials.locomotora);

	chimenea.rotation.set(0, 0, -Math.PI / 2);
	return chimenea;
}

const largo_cilindro_mediano = 2.5;
const radio_cilindro_mediano = 0.5;
function crearCilindroMediano() {
	return crearCilindro(largo_cilindro_mediano, radio_cilindro_mediano, materials.locomotora);
}

function crearSpotLight(isDaytime) {
	const light = new THREE.SpotLight(0xffff00, isDaytime ? 0 : intensity, 40, Math.PI / 3);
	light.penumbra = 0.3;
	light.position.set(0, 0, 0);
	light.target.position.set(0, -15, 0);

	light.castShadow = true;
	light.shadow.mapSize.width = 1024;
	light.shadow.mapSize.height = 1024;
	light.shadow.camera.near = 0.1;
	light.shadow.camera.far = 1000;
	light.shadow.camera.fov = 30;
	light.shadow.camera.aspect = 1;
	light.shadow.camera.updateProjectionMatrix();
	light.shadow.bias = -0.0001;
	light.shadow.focus = 1;
	light.shadow.needsUpdate = true;
	light.penumbra = 0.3;
	light.decay = 1.5;

	return light;
}

const ancho_luz = 0.1;
const intensity = 100;
function crearLuz(isDaytime) {
	const material = materials.foco;
	const foco = crearCilindro(ancho_luz, ancho_luz, material);
	foco.position.set(0, -largo_cilindro_grande / 2, 0);

	const light = crearSpotLight(isDaytime);
	foco.add(light);
	foco.add(light.target);

	return { foco, luz: light };
}

function crearMotor(isDaytime) {
	const motor = new THREE.Group();

	const cilindro_grande = crearCilindroGrande();
	cilindro_grande.position.set(largo_base_cuerpo / 2, radio_cilindro_mediano, 0);
	motor.add(cilindro_grande);

	// agregar un cilindro que actue como luz en la parte de adelante
	const { foco, luz } = crearLuz(isDaytime);
	cilindro_grande.add(foco);

	const cilindro_mediano = crearCilindroMediano();
	cilindro_mediano.position.set(0, largo_cilindro_mediano / 2, 0);
	cilindro_grande.add(cilindro_mediano);

	const chimenea = crearChimenea();
	chimenea.position.set(largo_chimenea / 2 + radio_cilindro_grande, 0, 0);
	cilindro_grande.add(chimenea);

	return { motor, luz };
}

//#endregion

//#region Base

const largo_base = 3;
const alto_base = 0.2;
const ancho_base = 1;
function crearBase(texturaRueda, alphaRueda) {
	const base = new THREE.Mesh(new THREE.BoxGeometry(largo_base, alto_base, ancho_base), materials.barra);

	const ruedas = [];
	const barras = [];

	const rueda_base = crearRueda(texturaRueda, alphaRueda);
	const barra = crearBarra();

	for (let j = 0; j < 2; j++) {
		const mult = j === 0 ? 1 : -1;
		for (let i = 0; i < CANTIDAD_RUEDAS_POR_LADO; i++) {
			const x = gap_ruedas * i - largo_base / 2 + radio_rueda;
			const rueda = rueda_base.clone();

			const grupo_rueda_barra = new THREE.Group();
			const grupo_giro = new THREE.Group();
			if (i === 0) {
				const barra_anclaje = barra.clone();
				barra_anclaje.rotation.set(0, Math.PI / 2, Math.PI / 2);
				barra_anclaje.position.set((radio_rueda + largo_barra) / 2, 0, ancho_rueda * mult);
				grupo_rueda_barra.add(barra_anclaje);

				barras.push(barra_anclaje);
			}

			rueda.rotation.set(0, Math.PI / 2, Math.PI / 2);
			grupo_rueda_barra.position.set(x, -radio_rueda / 2, ((ancho_base + ancho_rueda) / 2) * mult);

			grupo_giro.add(rueda);
			grupo_rueda_barra.add(grupo_giro);

			base.add(grupo_rueda_barra);

			ruedas.push(grupo_giro);
		}
	}

	return { base, ruedas, barras };
}

export const largo_barra = 2.5;
const ancho_barra = 0.05;
const largo_cil_barra = 0.5;
const radio_cil_barra = 0.125;
function crearBarra() {
	const geo = new THREE.BoxGeometry(ancho_barra, ancho_barra, largo_barra);
	let barra = new THREE.Mesh(geo, materials.barra);

	const cilindro = crearCilindro(largo_cil_barra, radio_cil_barra, materials.cil_barra);
	cilindro.rotation.set(Math.PI / 2, 0, 0);
	cilindro.position.set(0, 0, largo_barra / 2);

	barra.add(cilindro);

	return barra;
}

const gap_ruedas = 0.75;
export const radio_rueda = 0.25;
const ancho_rueda = 0.1;
function crearRueda(texturaRueda, alphaRueda) {
	const material_rueda = new THREE.MeshPhongMaterial({
		map: texturaRueda,
		alphaMap: alphaRueda,
		transparent: true,
		side: THREE.FrontSide,
	});
	const material_rueda_back = new THREE.MeshPhongMaterial({ visible: false });

	materials['rueda'] = material_rueda;
	materials['rueda_back'] = material_rueda_back;

	const materiales = [material_rueda_back, material_rueda, material_rueda];

	return crearCilindro(ancho_rueda, radio_rueda, materiales);
}

//#endregion

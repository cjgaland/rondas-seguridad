// Pruebas de la lógica pura, del contenido y de los ejemplos · node tests/logic.test.mjs
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const L = require("../logic.js");
const C = require("../contenido.js");
const X = require("../xlsx.js");
const W = require("../docx.js");

let ok = 0, fallos = 0;
const t = (nombre, cond) => { if (cond) ok++; else { fallos++; console.error("✗ " + nombre); } };
const eq = (nombre, a, b) => t(`${nombre} (esperado ${JSON.stringify(b).slice(0, 300)}, obtenido ${JSON.stringify(a).slice(0, 300)})`, JSON.stringify(a) === JSON.stringify(b));
let n = 0; const gid = () => "id" + (++n);
const HOY = "2026-10-24";
const clon = o => JSON.parse(JSON.stringify(o));
const ej = id => L.sanearUnidad(clon(C.EJEMPLOS.unidades.find(u => u.id === id)), gid, HOY);

// ---------- Banco de preguntas ----------
t("Banco con más de 60 preguntas", L.BANCO.length >= 60);
eq("Ids del banco únicos", new Set(L.BANCO.map(b => b.id)).size, L.BANCO.length);
t("Cada pregunta tiene bloque, dónde y ámbito válidos", L.BANCO.every(b => L.BLOQUES[b.b] && L.DONDE[b.d] && b.a.every(a => a === "*" || L.AMBITOS[a])));
t("Todos los bloques tienen preguntas", L.ORDEN_BLOQUES.every(k => L.BANCO.some(b => b.b === k)));
eq("Ninguna pregunta del banco dispara avisos de redacción", L.BANCO.filter(b => L.revisarItem(b.t).length).map(b => b.id), []);
eq("Ninguna pregunta del banco se parece demasiado a otra", (() => { const r = []; for (let i = 0; i < L.BANCO.length; i++) for (let j = i + 1; j < L.BANCO.length; j++) if (L.parecido(L.BANCO[i].t, L.BANCO[j].t) >= 0.8) r.push(L.BANCO[i].id + "~" + L.BANCO[j].id); return r; })(), []);
t("Cada tipo de unidad tiene al menos 15 preguntas", Object.keys(L.AMBITOS).every(k => L.bancoPara(k).length >= 15));
eq("«Otra unidad» ve todo el banco", L.bancoPara("otro").length, L.BANCO.length);
t("Atención Primaria no ve las de UCI", !L.bancoPara("ap").some(b => b.id === "inf-08"));
t("Las preguntas de «*» las ve todo el mundo", L.bancoPara("qx").some(b => b.id === "med-01"));

// ---------- Redacción y datos personales ----------
const k = txt => L.revisarItem(txt).map(r => r.k);
eq("«bien» es vago", k("La medicación está bien."), ["vago"]);
eq("Muy corto", k("Se identifica a los pacientes."), ["corto"]);
eq("Revisado sin cuándo", k("El carro de paradas está revisado."), ["cuando"]);
eq("Revisado con cuándo", k("El carro de paradas tiene registrada la revisión de las últimas 24 horas."), []);
eq("Borrador traído", k("Comprobar: No se identifica al paciente en la sala de espera"), ["borrador"]);
eq("Nombre propio", k("El Dr. Pérez deja las perfusiones sin etiquetar en el box"), ["persona"]);
t("Número de historia", L.datoPersonal("Paciente con NHC 12345678 sin pulsera"));
t("Historia número", L.datoPersonal("historia nº 45678 sin alergias"));
t("Una cama no es un dato personal", !L.datoPersonal("Cama 203B sin timbre"));
t("Un plazo no es un dato personal", !L.datoPersonal("Revisión de las últimas 24 horas"));
// El ejercicio «¿Sirve este ítem?» y la app dicen lo mismo
C.EJERCICIOS.sirve.forEach(x => eq(`Ejercicio «${x.texto}»`, L.revisarItem(x.texto).length ? "no" : "bien", x.k));

// ---------- Una ronda: sincronizar, responder, resultado ----------
const u = L.nuevaUnidad("u1", "2026-10-01");
u.unidad = "Planta de prueba"; u.ambito = "hosp"; u.frecuencia = "mensual"; u.objetivos = ["adherencia"];
["id-01", "med-01", "inf-01", "cui-01", "equ-01"].forEach(id => u.items.push(L.itemDeBanco(L.buscaBanco(id))));
const r1 = L.nuevaRonda("r1", "2026-10-05", "manana");
u.rondas.push(r1);
eq("Ronda nueva: planificada", L.estadoRonda(r1), "planificada");
t("Sincroniza el cuestionario", L.sincronizar(u, r1) && r1.items.length === 5 && r1.conversacion.length === 3);
eq("Respuestas ordenadas por bloque", r1.items.map(x => x.bloque), ["id", "med", "inf", "cui", "equ"]);
u.items.push(L.itemDeBanco(L.buscaBanco("ent-01")));
L.sincronizar(u, r1); eq("Mientras no empieza, toma el cuestionario vigente", r1.items.length, 6);
r1.items[0].valor = "si";
eq("Con una respuesta, en curso", L.estadoRonda(r1), "curso");
t("Una ronda empezada ya no se sincroniza", !L.sincronizar(u, r1));
u.items.pop(); eq("Ni pierde preguntas", r1.items.length, 6);
const R = (si, no, na) => { const r = L.nuevaRonda("x"); r.items = [...Array(si).fill("si"), ...Array(no).fill("no"), ...Array(na).fill("na")].map((v, i) => Object.assign(L.nuevaRespuesta(L.nuevoItem("i" + i, "id", "x")), { valor: v })); return L.resultado(r); };
eq("12 sí, 2 no, 3 N/A → 86 % (el «no aplica» no cuenta)", R(12, 2, 3).pct, 86);
eq("Sin valorados → sin porcentaje", R(0, 0, 3).pct, null);
eq("Todo sí → 100 %", R(5, 0, 0).pct, 100);
eq("Resultado por bloque", R(3, 1, 0).porBloque.map(b => [b.bloque, b.pct]), [["id", 75]]);
eq("Cuenta 7 de 8 → no", L.valorDeCuenta({ ok: "7", de: "8" }), "no");
eq("Cuenta 8 de 8 → sí", L.valorDeCuenta({ ok: "8", de: "8" }), "si");
eq("Cuenta imposible → nada", L.valorDeCuenta({ ok: "9", de: "8" }), "");
eq("Niveles de cumplimiento", [95, 80, 60, null].map(L.nivelPct), ["verde", "ambar", "rojo", "gris"]);

// ---------- Acciones y comprobación en la ronda siguiente ----------
r1.items.forEach((x, i) => { x.valor = i === 1 ? "no" : "si"; });
r1.cerrada = true;
const a1 = Object.assign(L.nuevaAccion("a1", "r1", "item:med-01", "Separar y señalizar los medicamentos de alto riesgo en el botiquín"), { responsable: "Supervisión", plazo: "2026-10-20" });
u.acciones.push(a1);
t("Acción vencida", L.vencida(a1, HOY));
t("Una acción hecha no vence", !L.vencida(Object.assign({}, a1, { estado: "hecha" }), HOY));
const r2 = L.nuevaRonda("r2", "2026-11-05", "tarde"); u.rondas.push(r2); L.sincronizar(u, r2);
eq("La ronda siguiente comprueba lo pendiente", L.pendientesDe(u, r2).map(a => a.id), ["a1"]);
eq("La propia ronda no se comprueba a sí misma", L.pendientesDe(u, r1).map(a => a.id), []);
L.revisar(u, r2, "a1", "ok");
eq("Comprobada en la ronda", [a1.estado, a1.comprobada, r2.revisadas.a1], ["comprobada", "r2", "ok"]);
eq("Sigue en la lista de esa ronda", L.pendientesDe(u, r2).map(a => a.id), ["a1"]);
L.revisar(u, r2, "a1", "ok");
eq("Pulsar lo mismo lo deshace", [a1.estado, a1.comprobada, r2.revisadas.a1], ["curso", "", undefined]);
L.revisar(u, r2, "a1", "mal");
eq("No ha funcionado", a1.estado, "ineficaz");
t("Aviso: acuerda otra", L.avisosAcciones(u, HOY).some(x => /no ha funcionado/.test(x.texto)));
u.acciones.push(Object.assign(L.nuevaAccion("a2", "r2", "accion:a1", "Añadir un campo obligatorio en la petición"), { responsable: "Informática", plazo: "2026-12-01" }));
t("Ya sustituida: sin aviso", !L.avisosAcciones(u, HOY).some(x => /no ha funcionado/.test(x.texto)));
const r3 = L.nuevaRonda("r3", "2026-12-05", "noche"); u.rondas.push(r3);
t("Una acción sustituida ya no se comprueba", !L.pendientesDe(u, r3).some(a => a.id === "a1"));
r2.cerrada = true; r2.items.forEach(x => { x.valor = "si"; });
eq("La sustituta sí", L.pendientesDe(u, r3).map(a => a.id), ["a2"]);
eq("Fuerza de la medida", ["Instalar un registrador con alarma", "Hacer obligatorio el campo: campo obligatorio en el triaje", "Asignar en la hoja de turno quién reevalúa", "Etiquetas preimpresas en cada box", "Recordar en una sesión la higiene de manos", "Pintar la pared"].map(L.fuerzaMedida), ["fuerte", "fuerte", "intermedia", "intermedia", "debil", ""]);

// ---------- Calendario ----------
const v = L.nuevaUnidad("v", "x"); v.frecuencia = "trimestral";
eq("Primera ronda: dentro de una semana, por la mañana", L.siguienteRonda(v, HOY), { fecha: "2026-10-31", turno: "manana" });
v.rondas.push(L.nuevaRonda("q1", "2026-01-31", "noche"));
eq("La siguiente: según la frecuencia y rotando el turno", L.siguienteRonda(v, HOY), { fecha: "2026-04-30", turno: "manana" });
eq("Fin de mes sin desbordar", L.sumaMeses("2026-01-31", 1), "2026-02-28");
const cal = L.proponerCalendario(v, HOY, gid, 3);
eq("Calendario propuesto", cal.map(r => [r.fecha, r.turno]), [["2026-04-30", "manana"], ["2026-07-30", "tarde"], ["2026-10-30", "noche"]]);
const m = ej("ej-mini-manana");
t("Aviso: siempre de mañana", L.avisosCalendario(m, HOY).some(x => /Todas las rondas son de mañana/.test(x.texto)));
t("Aviso: ronda atrasada", L.avisosCalendario(m, HOY).some(x => /ya debería estar hecha/.test(x.texto)));

// ---------- Cuestionario: avisos ----------
const et = ej("ej-mini-eterno"), ac = L.avisosCuestionario(et);
t("Aviso: más de veinte", ac.some(x => /Tienes 26 preguntas/.test(x.texto)));
t("Aviso: sin preguntas abiertas", ac.some(x => /preguntas abiertas/.test(x.texto)));
eq("Avisos de redacción en los cuatro ítems ambiguos", [...new Set(ac.filter(x => x.item && x.nivel !== "nota").map(x => x.item))].sort(), ["x1", "x2", "x3", "x4"]);
const w = L.nuevaUnidad("w", "x"); w.items = [L.nuevoItem("a", "id", "Todos los pacientes llevan pulsera")];
t("Aviso: menos de diez (nota)", L.avisosCuestionario(w).some(x => x.nivel === "nota" && /de diez a veinte/.test(x.texto)));

// ---------- Ejemplo de Urgencias (capítulo 12) ----------
const urg = ej("ej-urg");
eq("14 ítems y 3 preguntas abiertas", [urg.items.length, urg.abiertas.length], [14, 3]);
eq("Los cinco primeros, ligados al AMFE", urg.items.slice(0, 5).map(x => x.amfe), ["11, 18, 29", "30", "10", "15, 16", "9, 16"]);
const marzo = urg.rondas.find(r => r.id === "r03"), sm = L.resultado(marzo);
eq("Ronda de marzo, de noche: 12 de 14", [marzo.turno, sm.si, sm.no, sm.pct], ["noche", 12, 2, 86]);
eq("La camilla, retirada en el momento", sm.noCumplen.filter(x => x.resuelto).map(x => x.id), ["ent-01"]);
t("El celador cuenta lo de los traslados", /planta/.test(marzo.conversacion[0].respuesta));
const abril = urg.rondas.find(r => r.id === "r04");
eq("Abril empieza comprobando la luz", abril.revisadas.a03, "ok");
eq("Nueve rondas hechas y dos planificadas", [L.rondasHechas(urg).length, urg.rondas.filter(r => !r.cerrada).length], [9, 2]);
eq("Turnos rotando", L.rondasHechas(urg).map(r => L.TURNOS[r.turno].corto).join(""), "MTNMTNMTN");
const pc = L.puntosCalientes(urg);
eq("Punto caliente: los mayores sin acompañante, de noche", pc.map(p => [p.id, p.por, p.turno, p.fallos]), [["cui-08", "turno", "noche", 3]]);
t("Texto del punto caliente", /ninguna de las 3 rondas de noche/.test(L.textoCaliente(pc[0])));
eq("Por turno", L.porTurno(urg).map(x => [x.turno, x.pct]), [["manana", 90], ["tarde", 90], ["noche", 86]]);
const ra = L.resumenAcciones(urg, HOY);
eq("Acciones del ejemplo", [ra.n, ra.comprobadas, ra.abiertas, ra.vencidas, ra.ineficaces], [7, 4, 2, 1, 1]);
eq("La próxima ronda comprobará dos acciones", L.pendientesDe(urg, urg.rondas.find(r => r.id === "r10")).map(a => a.id), ["a06", "a07"]);
eq("Sin avisos de programa ni de cuestionario", [L.avisosPrograma(urg).length, L.avisosCuestionario(urg).length], [0, 0]);
eq("Calendario sin avisos", L.avisosCalendario(urg, HOY).length, 0);
eq("Rondas hechas sin avisos", L.rondasHechas(urg).flatMap(r => L.avisosRonda(urg, r, HOY)).map(x => x.texto), []);
eq("Solo avisa de la acción vencida", L.avisosAcciones(urg, HOY).map(x => x.accion), ["a06"]);
eq("Siguiente paso: la acción vencida", L.siguientePaso({ unidades: [urg] }, HOY).href, "#/unidad/ej-urg/4");
t("Conclusiones propuestas con cifras", /9 rondas/.test(L.conclusionesPropuestas(urg, HOY)) && /noche/.test(L.conclusionesPropuestas(urg, HOY)));
t("Resumen propuesto de marzo", /12 \(86 %\)/.test(L.resumenPropuesto(urg, marzo)) && /resuelto en el momento/.test(L.resumenPropuesto(urg, marzo)));
t("Lo que va bien, propuesto", /carro de paradas/.test(L.bienPropuesto(marzo)));
eq("Progreso del programa", L.progreso(urg), { 1: true, 2: true, 3: true, 4: true, 5: true });

// Ejemplo de la UGC de Atención Primaria
const ugc = ej("ej-ugc");
eq("UGC: 10 ítems, trimestral", [ugc.items.length, ugc.frecuencia], [10, "trimestral"]);
eq("La nevera de vacunas, comprobada en la segunda ronda", [ugc.acciones[0].estado, ugc.rondas.find(r => r.id === "r2").revisadas.b1], ["comprobada", "ok"]);
eq("Segunda ronda al 100 %", L.resultado(ugc.rondas.find(r => r.id === "r2")).pct, 100);

// Minicaso: ronda sin respuesta
const sr = ej("ej-mini-sinrespuesta"), avs = L.avisosRonda(sr, sr.rondas[0], HOY).map(x => x.texto).join(" | ");
t("Minicaso: incumplimientos sin nota", /Anota qué viste/.test(avs));
t("Minicaso: sin acción", /no tienen acción/.test(avs));
t("Minicaso: acción sin responsable ni plazo", /no tiene responsable/.test(avs) && /no tiene plazo/.test(avs));
t("Minicaso: medida débil", /medida débil/.test(avs));

// ---------- Siguiente paso ----------
eq("Sin unidades: crear", L.siguientePaso({ unidades: [] }, HOY).href, "#/unidad/nueva");
const s1 = L.nuevaUnidad("s1", "x"); s1.unidad = "Una unidad";
eq("Programa sin terminar", L.siguientePaso({ unidades: [s1] }, HOY).href, "#/unidad/s1/1");
Object.assign(s1, { ambito: "urg", frecuencia: "mensual", objetivos: ["riesgos"] });
eq("Sin preguntas", L.siguientePaso({ unidades: [s1] }, HOY).href, "#/unidad/s1/2");
s1.items = ["id-02", "id-03", "reg-01", "com-01", "cui-08"].map(id => L.itemDeBanco(L.buscaBanco(id)));
eq("Sin rondas: planificar", L.siguientePaso({ unidades: [s1] }, HOY).href, "#/unidad/s1/3");
const sr1 = L.nuevaRonda("sr1", "2026-11-02", "noche"); s1.rondas.push(sr1);
eq("Próxima ronda: prepararla", L.siguientePaso({ unidades: [s1] }, HOY).href, "#/unidad/s1/ronda/sr1/1");
L.sincronizar(s1, sr1); sr1.items[0].valor = "si";
eq("Ronda a medias: seguir mirando", L.siguientePaso({ unidades: [s1] }, HOY).href, "#/unidad/s1/ronda/sr1/3");
sr1.items.forEach(x => { x.valor = "si"; }); sr1.cerrada = true;
eq("Ronda hecha sin informe", L.siguientePaso({ unidades: [s1] }, HOY).href, "#/unidad/s1/ronda/sr1/5");

// ---------- Traer de AMFE o de Mapa de Riesgos ----------
const amfe = { formato: "amfe-fallos", version: 1, amfes: [{ id: "am1", titulo: "Urgencias", fallos: [
  { id: "f1", num: 9, fallo: "No se identifica a los mayores sin acompañante", prioritario: true, ipr: 320 },
  { id: "f2", num: 3, fallo: "Retraso en el triaje", prioritario: false, ipr: 80 }] }] };
const lf = L.leerFallos(amfe);
eq("Solo los prioritarios", lf.amfes[0].fallos.map(f => f.num), ["9"]);
eq("Origen AMFE", lf.origen, "AMFE");
eq("Copia .json de AMFE (clave intercambio)", L.leerFallos({ app: "amfe", intercambio: amfe }).amfes.length, 1);
eq("Paquete de Mapa de Riesgos", L.leerFallos({ formato: "mapariesgos-mapas", version: 1, mapas: [{ amfe: amfe.amfes[0] }] }).origen, "Mapa de Riesgos");
t("Versión desconocida → error", !!L.leerFallos({ formato: "amfe-fallos", version: 2, amfes: [] }).error);
t("Otro formato → error", !!L.leerFallos({ formato: "dafo-came", version: 1 }).error);
const itF = L.itemDeFallo(gid, lf.amfes[0], lf.amfes[0].fallos[0]);
eq("Borrador de pregunta con su fallo", [itF.amfe, itF.origen, L.revisarItem(itF.texto)[0].k], ["9", "amfe:am1:f1", "borrador"]);

// ---------- Saneado, fusión e ids nuevos ----------
eq("Basura → null", L.sanearDatos({ unidades: "x" }, gid, HOY), null);
eq("De otra app → null", L.sanearDatos({ app: "dafo", unidades: [] }, gid, HOY), null);
const sucia = L.sanearDatos({ unidades: [{ id: "bad id!", unidad: 5, ambito: "luna", objetivos: ["riesgos", "x"], items: [{ id: "a", bloque: "zz", texto: "x".repeat(900) }], rondas: [{ id: "r", fecha: "31/12/2026", turno: "noche", items: [{ id: "a", valor: "quizá" }], revisadas: { zz: "ok", a9: "raro" } }], acciones: [{ id: "a9", rondaId: "no-existe", estado: "rarísimo" }] }] }, gid, HOY);
const su = sucia.unidades[0];
t("Id inválido sustituido", su.id !== "bad id!");
eq("Saneado de campos", [su.unidad, su.ambito, su.objetivos, su.items[0].bloque, su.items[0].texto.length, su.rondas[0].fecha, su.rondas[0].items[0].valor, su.rondas[0].revisadas, su.acciones[0].rondaId, su.acciones[0].estado], ["5", "", ["riesgos"], "", 400, "", "", {}, "", "pendiente"]);
const urg2 = ej("ej-urg"); urg2.modificado = "2027-01-01";
const fu = L.fusionar({ unidades: [ej("ej-urg"), ej("ej-ugc")] }, { unidades: [urg2, Object.assign(ej("ej-mini-eterno"), { id: "nueva" })] });
eq("Fusión: junta por id y gana la más reciente", [fu.unidades.length, fu.unidades[0].modificado], [3, "2027-01-01"]);
const cop = L.renovarIds(ej("ej-urg"), gid);
t("Ids nuevos", !/^ej-/.test(cop.id) && cop.rondas.every(r => !/^r\d/.test(r.id)));
t("Las acciones siguen en su ronda", cop.acciones.every(a => cop.rondas.some(r => r.id === a.rondaId)));
t("La comprobación sigue enlazada", cop.acciones.filter(a => a.comprobada).every(a => cop.rondas.some(r => r.id === a.comprobada)));
const a06 = cop.acciones.find(a => /obligatorio/.test(a.que)), a02 = cop.acciones.find(a => /Pedir a informática/.test(a.que));
eq("La sustituta apunta a la acción nueva", a06.origen, "accion:" + a02.id);
t("Las revisadas apuntan a ids nuevos", cop.rondas.every(r => Object.keys(r.revisadas).every(id => cop.acciones.some(a => a.id === id))));
eq("Tras renovar, los mismos resultados", L.puntosCalientes(cop).length, 1);
const rs = L.sanearUnidad(clon(cop), gid, HOY);
eq("Sanear no rompe el ejemplo", [rs.rondas.length, rs.acciones.length, Object.keys(rs.rondas[3].revisadas).length], [11, 7, 3]);

// ---------- Intercambio ----------
const pq = L.paqueteIntercambio([urg], "2026.01", HOY + "T10:00:00Z");
eq("Formato y versión", [pq.formato, pq.version, pq.app], ["rondas-seguridad", 1, "rondas"]);
eq("Puntos calientes en el paquete", pq.unidades[0].puntosCalientes.map(p => [p.itemId, p.por, p.turno]), [["cui-08", "turno", "noche"]]);
eq("Rondas con su cumplimiento", pq.unidades[0].rondas.slice(0, 3).map(r => r.cumplimiento), [86, 86, 86]);
t("Acción vencida marcada", pq.unidades[0].acciones.find(a => /obligatorio/.test(a.que)).vencida === true);
t("Se lee de vuelta", !!L.leerIntercambio({ intercambio: pq }));
eq("Otra versión no se lee", L.leerIntercambio(Object.assign({}, pq, { version: 2 })), null);

// ---------- Documentos, Word y Excel ----------
const hoja = L.documentoHoja(urg, urg.rondas.find(r => r.id === "r10"));
t("Hoja: comprueba primero lo pendiente", hoja.bloques.some(b => b.t === "h2" && /Comprobar las acciones/.test(b.texto)));
t("Hoja: tablas por bloque con Sí/No/N/A", hoja.bloques.filter(b => b.t === "tabla" && b.cab && b.cab[1] === "Sí").length >= 5);
const hojaVacia = L.documentoHoja(urg, null);
t("Hoja sin ronda (en blanco)", hojaVacia.bloques.length > 5);
const inf = L.documentoInforme(urg, marzo);
t("Informe: resultado y conversación", inf.bloques.some(b => b.t === "p" && b.runs && /86 %/.test(b.runs[0].texto)) && inf.bloques.some(b => b.t === "h1" && /cuenta el equipo/.test(b.texto)));
t("Informe: sin datos personales", !inf.bloques.some(b => L.datoPersonal(JSON.stringify(b))));
const seg = L.documentoSeguimiento(urg, HOY);
t("Seguimiento: puntos calientes y conclusiones", seg.bloques.some(b => b.t === "lista" && b.items.some(i => /noche/.test(i))) && seg.bloques.some(b => b.t === "h1" && b.texto === "Conclusiones"));
[hoja, inf, seg].forEach(d => { const by = W.construirDocx(Object.assign({ pie: "prueba" }, d)); t("Word de «" + d.titulo + "»", by.length > 3000 && by[0] === 0x50 && by[1] === 0x4b); });
const libro = L.hojasExcel(urg, "24/10/2026");
eq("Excel con cuatro hojas", libro.hojas.map(h => h.nombre), ["Rondas", "Respuestas", "Acciones", "Cuestionario"]);
eq("Hoja Rondas: 11 rondas", libro.hojas[0].filas.length - 3, 11);
t("Excel real", X.construirLibroXlsx(libro).length > 4000);
t("Excel de una unidad vacía", X.construirLibroXlsx(L.hojasExcel(L.nuevaUnidad("v", "x"), "hoy")).length > 1000);

// ---------- Contenido ----------
eq("Cinco temas de Aprende", C.TEMAS.map(x => x.n), [1, 2, 3, 4, 5]);
t("Cada tema con su minuto, secciones y minicaso", C.TEMAS.every(x => x.minuto.length >= 3 && x.secciones.length >= 3 && x.minicaso && x.practica.href));
t("Glosario de al menos 25 términos", C.GLOSARIO.length >= 25);
eq("Glosario sin repetidos", new Set(C.GLOSARIO.map(g => L.sinTildes(g[0]))).size, C.GLOSARIO.length);
t("Test: 16 preguntas válidas", C.TEST.length === 16 && C.TEST.every(q => q.o.length === 4 && q.ok >= 0 && q.ok < 4 && C.TEMAS_TEST[q.t] && q.e));
t("Las cinco preguntas del capítulo 12 están en el test", ["registro", "buen ítem", "alto riesgo fuera de su sitio", "rondas de liderazgo", "a partir de la segunda"].length === 5 && C.TEST.some(q => /alto riesgo fuera de su sitio/.test(q.q)) && C.TEST.some(q => /a partir de la segunda/.test(q.q)));
t("Ejercicio: resolver en el momento o acción", C.EJERCICIOS.momento.length >= 6 && C.EJERCICIOS.momento.every(x => ["momento", "accion"].includes(x.k) && x.por));
const idsEj = new Set(C.EJEMPLOS.unidades.map(u => u.id));
t("Todos los ejemplos con id «ej-»", [...idsEj].every(id => /^ej-/.test(id)));
const enlaces = [...C.EJEMPLOS.fichas, ...C.EJEMPLOS.minicasos].map(f => f.href).concat(C.TEMAS.map(x => x.practica.href));
t("Los enlaces de los ejemplos apuntan a unidades y rondas que existen", enlaces.filter(h => /^#\/unidad\/ej-/.test(h)).every(h => { const [, , id, , rid] = h.split("/"); const uu = C.EJEMPLOS.unidades.find(x => x.id === id); return uu && (!rid || uu.rondas.some(r => r.id === rid)); }));
t("Ejemplos sin datos personales", !C.EJEMPLOS.unidades.some(uu => L.datoPersonal(JSON.stringify(uu))));

console.log(`${ok} pruebas correctas, ${fallos} fallos`);
if (fallos) process.exit(1);

// ============================================================
//  logic.js — Lógica PURA (sin DOM) · Rondas de Seguridad
//  Modelo (unidad con su programa, cuestionario, rondas y acciones), banco de
//  preguntas propio, cumplimiento, comprobación de acciones de la ronda
//  anterior, puntos calientes, avisos didácticos por paso, textos propuestos,
//  «Tu siguiente paso», documentos (bloques para Word y PDF), Excel,
//  intercambio con las otras apps, saneado por esquema y fusión.
//  window.Logica en navegador y module.exports en Node (tests).
// ============================================================
(function (raiz) {
  "use strict";

  const VERSION_DATOS = 1;
  // [eco]
  const URL_AUD = "https://cjgaland.github.io/auditorias/";
  const URL_IND = "https://cjgaland.github.io/indicadores-calidad/";
  const URL_TM = "https://cjgaland.github.io/tamano-muestral/";
  const URL_AMFE = "https://cjgaland.github.io/amfe/";
  const URL_FLUJO = "https://cjgaland.github.io/flujograma/";
  const URL_MAPA = "https://cjgaland.github.io/mapa-riesgos/";
  const URL_DAFO = "https://cjgaland.github.io/dafo/";
  const URL_LC = "https://cjgaland.github.io/lectura-critica/";
  const URL_ACR = "https://cjgaland.github.io/acr-ishikawa/";
  // [/eco]

  // ---------- Utilidades ----------
  const lleno = v => v != null && String(v).trim() !== "";
  const sinTildes = s => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
  const normal = s => sinTildes(s).replace(/[^a-z0-9ñ ]/g, " ").replace(/\s+/g, " ").trim();
  const corto = (s, n = 60) => { s = String(s || "").trim(); return s.length > n ? s.slice(0, n - 1) + "…" : s; };
  const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;
  const esFecha = s => /^\d{4}-\d{2}-\d{2}$/.test(s || "");
  const fmtF = s => esFecha(s) ? s.split("-").reverse().join("/") : (s || "");
  const pct = (a, b) => b > 0 ? Math.round(a / b * 100) : null;
  const sumaDias = (iso, dias) => { const d = new Date(iso + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + dias); return d.toISOString().slice(0, 10); };
  const sumaMeses = (iso, meses) => { const [y, m, d] = iso.split("-").map(Number); const t = new Date(Date.UTC(y, m - 1 + meses, 1)); const ult = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth() + 1, 0)).getUTCDate(); t.setUTCDate(Math.min(d, ult)); return t.toISOString().slice(0, 10); };
  const diasEntre = (a, b) => Math.round((new Date(b + "T12:00:00Z") - new Date(a + "T12:00:00Z")) / 864e5);

  // ---------- Catálogos ----------
  const AMBITOS = {
    hosp: { nom: "Hospitalización", ej: "una planta de Medicina Interna o de Cirugía" },
    urg: { nom: "Urgencias", ej: "el servicio de urgencias del hospital o un punto de urgencias" },
    uci: { nom: "Cuidados críticos", ej: "una UCI o una unidad de reanimación" },
    qx: { nom: "Bloque quirúrgico", ej: "quirófanos, cirugía mayor ambulatoria o salas de procedimientos" },
    ap: { nom: "Atención Primaria", ej: "un centro de salud o un consultorio" },
    amb: { nom: "Consultas y hospital de día", ej: "consultas externas, hospital de día o pruebas diagnósticas" },
    otro: { nom: "Otra unidad", ej: "Farmacia, Radiología, salud mental… (se ven todas las preguntas del banco)" }
  };
  const BLOQUES = {
    id: { nom: "Identificación del paciente", corto: "Identificación" },
    med: { nom: "Medicamentos", corto: "Medicamentos" },
    inf: { nom: "Infecciones e higiene", corto: "Infecciones" },
    cui: { nom: "Cuidados seguros", corto: "Cuidados" },
    equ: { nom: "Equipos y carro de paradas", corto: "Equipos" },
    ent: { nom: "Entorno e instalaciones", corto: "Entorno" },
    reg: { nom: "Registros", corto: "Registros" },
    com: { nom: "Comunicación y traspasos", corto: "Comunicación" },
    cul: { nom: "Cultura de seguridad", corto: "Cultura" },
    pro: { nom: "Procedimientos", corto: "Procedimientos" }
  };
  const ORDEN_BLOQUES = Object.keys(BLOQUES);
  const DONDE = {
    paciente: { nom: "A pie de cama", ico: "🛏" },
    registro: { nom: "En la historia o los registros", ico: "📋" },
    unidad: { nom: "En la unidad (almacén, control, pasillos)", ico: "🏥" },
    equipo: { nom: "Preguntando al equipo", ico: "💬" }
  };
  const FRECUENCIAS = {
    mensual: { nom: "Mensual", meses: 1 },
    bimestral: { nom: "Cada dos meses", meses: 2 },
    trimestral: { nom: "Trimestral", meses: 3 },
    semestral: { nom: "Semestral", meses: 6 }
  };
  const TURNOS = {
    manana: { nom: "Mañana", corto: "M", hora: "11:00" },
    tarde: { nom: "Tarde", corto: "T", hora: "18:00" },
    noche: { nom: "Noche", corto: "N", hora: "03:00" },
    finde: { nom: "Fin de semana", corto: "F", hora: "12:00" }
  };
  const ROTACION = ["manana", "tarde", "noche"];
  const OBJETIVOS = {
    adherencia: "Comprobar que se aplican las prácticas seguras",
    riesgos: "Descubrir riesgos que no constan en ningún registro",
    escuchar: "Escuchar lo que preocupa al equipo",
    direccion: "Implicar a la dirección y a los mandos"
  };
  const PERFILES = {
    direccion: { nom: "Dirección o mandos", sug: "Dirección médica o de enfermería, jefatura o supervisión" },
    calidad: { nom: "Calidad y seguridad", sug: "Referente o responsable de seguridad del paciente" },
    otra: { nom: "Profesional de otra unidad", sug: "Supervisora o profesional de otra unidad (mirada externa)" },
    unidad: { nom: "Profesional de la unidad", sug: "Quien acompaña: la enfermera o el médico responsable del turno" },
    paciente: { nom: "Paciente o familia", sug: "Opcional: representante de pacientes" }
  };
  const ESTADOS_ACCION = {
    pendiente: { nom: "Pendiente", c: "ambar" },
    curso: { nom: "En marcha", c: "ambar" },
    hecha: { nom: "Hecha (falta comprobarla)", c: "azul" },
    comprobada: { nom: "Comprobada en la ronda", c: "verde" },
    ineficaz: { nom: "No ha funcionado", c: "rojo" },
    anulada: { nom: "Descartada", c: "gris" }
  };
  const ABIERTA = e => e === "pendiente" || e === "curso" || e === "hecha" || e === "ineficaz";
  const REVISION = {
    ok: { nom: "Comprobada: está resuelta", estado: "comprobada" },
    sigue: { nom: "Sigue pendiente", estado: null },
    mal: { nom: "No ha funcionado", estado: "ineficaz" }
  };
  const PREGUNTAS_ABIERTAS = [
    "¿Qué incidente o casi-incidente os preocupa?",
    "¿Qué creéis que podría hacer daño a un paciente aquí?",
    "¿Qué está funcionando bien?"
  ];

  // ---------- Banco de preguntas (propio) ----------
  // a = ámbitos donde tiene sentido ("*" = todos); d = dónde se comprueba. Redactadas como criterios:
  // observables, con respuesta sí / no / no aplica. Son un punto de partida: se adaptan a cada unidad.
  const P = (id, b, d, a, t) => ({ id, b, d, a: a === "*" ? ["*"] : a.split(" "), t });
  const BANCO = [
    P("id-01", "id", "paciente", "hosp uci", "Todos los pacientes ingresados llevan pulsera identificativa legible con al menos dos identificadores."),
    P("id-02", "id", "paciente", "urg", "Todos los pacientes en boxes y sala de espera llevan pulsera identificativa legible."),
    P("id-03", "id", "paciente", "urg", "Las camillas en el pasillo tienen el nombre del paciente visible para el personal."),
    P("id-04", "id", "equipo", "*", "Antes de administrar un medicamento o extraer una muestra se comprueba la identidad con dos identificadores (observado o preguntado)."),
    P("id-05", "id", "unidad", "*", "Los tubos de las muestras se etiquetan delante del paciente, en el momento de la extracción."),
    P("id-06", "id", "paciente", "hosp urg uci qx", "Los pacientes con alergia conocida la tienen señalada (pulsera o distintivo) y registrada en la historia."),
    P("id-07", "id", "unidad", "ap amb hosp", "Las muestras pendientes de envío están identificadas con la etiqueta del paciente y su petición."),
    P("id-08", "id", "unidad", "hosp uci urg", "Los pacientes con nombres parecidos en la misma unidad tienen un aviso de «nombre similar»."),
    P("med-01", "med", "unidad", "*", "Los medicamentos de alto riesgo están separados y señalizados."),
    P("med-02", "med", "paciente", "hosp uci urg qx amb", "Las perfusiones en curso están etiquetadas con el fármaco, la dosis y la hora de inicio."),
    P("med-03", "med", "unidad", "hosp urg uci qx", "Las soluciones concentradas de potasio no están en el botiquín de la unidad o están separadas y señalizadas."),
    P("med-04", "med", "unidad", "*", "El frigorífico de medicamentos tiene registrada la temperatura del día y está dentro del rango."),
    P("med-05", "med", "unidad", "ap", "La nevera de vacunas tiene registro continuo de la temperatura (también del fin de semana) y alarma."),
    P("med-06", "med", "unidad", "*", "No hay medicamentos caducados en el botiquín ni en el carro de curas (revisar cinco al azar)."),
    P("med-07", "med", "unidad", "*", "Los envases multidosis abiertos (colirios, insulinas, viales) tienen anotada la fecha de apertura."),
    P("med-08", "med", "unidad", "hosp uci urg", "La medicación preparada y no administrada está identificada con el paciente, el fármaco y la hora."),
    P("med-09", "med", "registro", "hosp", "La conciliación de la medicación consta en la historia de los pacientes ingresados en las últimas 24 horas."),
    P("med-10", "med", "unidad", "hosp uci urg qx", "Los estupefacientes están bajo llave y su registro de entradas y salidas está al día."),
    P("inf-01", "inf", "paciente", "*", "Hay solución hidroalcohólica en el punto de atención de cada paciente (cama, box o consulta)."),
    P("inf-02", "inf", "equipo", "*", "Se observa la higiene de manos antes del contacto con el paciente (contar al menos cinco oportunidades)."),
    P("inf-03", "inf", "paciente", "hosp urg uci amb", "Los catéteres venosos periféricos tienen registrada la fecha de inserción."),
    P("inf-04", "inf", "paciente", "hosp uci amb", "Los apósitos de los catéteres están limpios, secos e íntegros."),
    P("inf-05", "inf", "unidad", "hosp uci urg", "Las habitaciones en aislamiento tienen la señal en la puerta y el material de protección en la entrada."),
    P("inf-06", "inf", "unidad", "*", "Los contenedores de punzantes no superan su línea de llenado."),
    P("inf-07", "inf", "unidad", "*", "Los residuos se separan en los contenedores que les corresponden (revisar los del control y la sala de curas)."),
    P("inf-08", "inf", "paciente", "uci", "Los pacientes con ventilación mecánica tienen la cabecera elevada entre 30 y 45 grados."),
    P("inf-09", "inf", "registro", "hosp uci", "Las sondas vesicales tienen registrada la indicación y la fecha de colocación."),
    P("inf-10", "inf", "equipo", "*", "El personal no lleva anillos, pulseras ni reloj en manos y antebrazos durante la atención."),
    P("cui-01", "cui", "registro", "hosp uci", "Los pacientes ingresados tienen valorado y registrado el riesgo de caídas."),
    P("cui-02", "cui", "paciente", "hosp urg", "Los pacientes con riesgo alto de caídas tienen aplicadas las medidas de su plan (barandillas, cama baja, timbre a mano)."),
    P("cui-03", "cui", "registro", "hosp uci", "Los pacientes ingresados tienen valorado y registrado el riesgo de úlceras por presión."),
    P("cui-04", "cui", "registro", "hosp uci", "Los pacientes con riesgo de úlceras tienen superficie especial y los cambios posturales registrados."),
    P("cui-05", "cui", "registro", "hosp urg uci", "El dolor está valorado con una escala y registrado en el turno."),
    P("cui-06", "cui", "registro", "hosp urg uci", "Los pacientes con sujeción mecánica tienen la indicación médica y las revisiones registradas."),
    P("cui-07", "cui", "paciente", "hosp urg", "El timbre o llamador está al alcance del paciente y funciona."),
    P("cui-08", "cui", "unidad", "urg", "Los pacientes mayores sin acompañante están identificados en la pantalla."),
    P("equ-01", "equ", "unidad", "hosp urg uci qx", "El carro de paradas tiene registrada la revisión de las últimas 24 horas."),
    P("equ-02", "equ", "unidad", "ap amb", "El carro de paradas tiene registrada la última revisión que marca el protocolo del centro y el precinto íntegro."),
    P("equ-03", "equ", "unidad", "*", "El desfibrilador está conectado, cargado y con la comprobación registrada."),
    P("equ-04", "equ", "paciente", "hosp urg uci", "El aspirador y el oxígeno de cada puesto funcionan (comprobar tres puestos)."),
    P("equ-05", "equ", "paciente", "uci urg", "Las alarmas de los monitores están activadas y se oyen desde el control."),
    P("equ-06", "equ", "unidad", "*", "Los equipos electromédicos en uso tienen la etiqueta de mantenimiento en vigor."),
    P("equ-07", "equ", "unidad", "*", "El glucómetro tiene registrado el control de calidad."),
    P("ent-01", "ent", "unidad", "*", "Las salidas y los pasillos de evacuación están libres de camillas y obstáculos."),
    P("ent-02", "ent", "unidad", "*", "Los extintores están accesibles, señalizados y con la revisión en vigor."),
    P("ent-03", "ent", "unidad", "*", "Los suelos están secos o señalizados cuando están mojados."),
    P("ent-04", "ent", "unidad", "hosp urg uci", "La iluminación de pasillos y puestos permite leer pulseras y etiquetas, también de noche."),
    P("ent-05", "ent", "unidad", "*", "Los productos de limpieza y los tóxicos están fuera del alcance de pacientes y visitas."),
    P("ent-06", "ent", "unidad", "urg ap amb", "La sala de espera está a la vista de algún profesional."),
    P("reg-01", "reg", "registro", "urg", "Los triajes de la última hora tienen las cuatro constantes registradas."),
    P("reg-02", "reg", "registro", "urg", "Los pacientes en sala de espera tienen la reevaluación registrada en el tiempo que marca su nivel de triaje."),
    P("reg-03", "reg", "registro", "hosp uci", "La hoja de tratamiento está actualizada y validada (revisar tres historias)."),
    P("reg-04", "reg", "registro", "hosp uci", "Las constantes se registran con la frecuencia pautada (revisar tres historias)."),
    P("reg-05", "reg", "registro", "qx amb hosp", "El consentimiento informado firmado consta antes de los procedimientos programados de hoy."),
    P("reg-06", "reg", "registro", "hosp uci urg", "Las órdenes verbales del turno, si las hubo, están transcritas y firmadas."),
    P("com-01", "com", "equipo", "urg", "Hay un profesional asignado a la reevaluación de la sala de espera en este turno, y lo sabe."),
    P("com-02", "com", "equipo", "*", "El cambio de turno sigue un método estructurado (por ejemplo, SBAR), observado o preguntado."),
    P("com-03", "com", "equipo", "urg uci qx", "Los traslados a planta o a otra unidad se avisan antes de que salga el paciente (preguntar por el último)."),
    P("com-04", "com", "paciente", "hosp", "El paciente o su familia saben quién es su enfermera o enfermero de referencia en el turno."),
    P("com-05", "com", "paciente", "hosp amb", "El paciente sabe qué se le va a hacer hoy y por qué (preguntar a dos pacientes)."),
    P("com-06", "com", "equipo", "*", "El equipo conoce el circuito para avisar de un resultado crítico de laboratorio (preguntar)."),
    P("com-07", "com", "registro", "hosp urg", "El informe de alta incluye la medicación y explica los cambios respecto a la habitual."),
    P("cul-01", "cul", "equipo", "*", "El equipo sabe cómo notificar un incidente de seguridad (preguntar a dos profesionales)."),
    P("cul-02", "cul", "equipo", "*", "En los últimos tres meses el equipo ha recibido información de algún incidente notificado y de lo que se hizo."),
    P("cul-03", "cul", "unidad", "*", "Las alertas de seguridad vigentes del centro están accesibles para el equipo."),
    P("cul-04", "cul", "equipo", "*", "Los profesionales nuevos o eventuales han recibido una acogida que incluye los riesgos de la unidad."),
    P("pro-01", "pro", "paciente", "qx", "El listado de verificación quirúrgica se completa en sus tres momentos (observar una intervención)."),
    P("pro-02", "pro", "paciente", "qx", "El sitio quirúrgico está marcado antes de entrar a quirófano cuando hay lateralidad."),
    P("pro-03", "pro", "registro", "qx", "El recuento de gasas e instrumental queda registrado."),
    P("pro-04", "pro", "registro", "qx", "La profilaxis antibiótica se administra en los 60 minutos previos a la incisión (revisar tres historias)."),
    P("pro-05", "pro", "registro", "amb qx urg", "Los pacientes sedados tienen registrada la monitorización durante y después del procedimiento."),
    P("pro-06", "pro", "unidad", "qx amb", "Las muestras de anatomía patológica están identificadas y anotadas en el registro de envío."),
    P("pro-07", "pro", "equipo", "amb", "Antes de administrar un citostático se verifica en voz alta el paciente, el fármaco y la dosis entre dos profesionales.")
  ];
  const buscaBanco = id => BANCO.find(x => x.id === id) || null;
  const bancoPara = ambito => BANCO.filter(x => !ambito || ambito === "otro" || x.a.includes("*") || x.a.includes(ambito));

  // ---------- Fábricas ----------
  function nuevaUnidad(id, fecha) {
    return { id, creado: fecha, modificado: fecha, unidad: "", ambito: "", objetivos: [], objetivo: "", frecuencia: "", equipo: [], circuito: "", responsable: "",
      items: [], abiertas: PREGUNTAS_ABIERTAS.slice(), rondas: [], acciones: [], conclusiones: "", notas: "" };
  }
  const nuevoMiembro = (id, perfil = "") => ({ id, perfil, papel: "" });
  const nuevoItem = (id, bloque = "", texto = "") => ({ id, bloque, texto, donde: "", amfe: "", origen: "" });
  const itemDeBanco = b => ({ id: b.id, bloque: b.b, texto: b.t, donde: b.d, amfe: "", origen: "banco" });
  function nuevaRonda(id, fecha = "", turno = "") {
    return { id, fecha, hora: "", turno, equipo: "", acompana: "", items: [], conversacion: [], hallazgos: [], revisadas: {}, cierre: { bien: "", resumen: "" }, cerrada: false, informe: { fecha: "", destinatarios: "" } };
  }
  const nuevaRespuesta = it => ({ id: it.id, bloque: it.bloque, texto: it.texto, donde: it.donde, amfe: it.amfe, valor: "", nota: "", resuelto: false, ok: "", de: "" });
  const nuevoHallazgo = (id, texto = "") => ({ id, texto, resuelto: false });
  const nuevaAccion = (id, rondaId = "", origen = "", que = "") => ({ id, rondaId, origen, que, responsable: "", plazo: "", eleva: false, indicador: "", estado: "pendiente", comprobada: "", nota: "" });

  // ---------- Nombres ----------
  const nombreUnidad = u => String(u && u.unidad || "").trim();
  const nombreBloque = k => BLOQUES[k] ? BLOQUES[k].nom : "Sin bloque";
  const nombreTurno = k => TURNOS[k] ? TURNOS[k].nom : "";
  const nombreRonda = r => [fmtF(r.fecha) || "Sin fecha", nombreTurno(r.turno)].filter(lleno).join(" · ");
  const ordenItems = items => items.slice().sort((a, b) => (ORDEN_BLOQUES.indexOf(a.bloque) + 1 || 99) - (ORDEN_BLOQUES.indexOf(b.bloque) + 1 || 99));
  const porBloques = items => { const m = []; ordenItems(items).forEach(it => { let g = m.find(x => x.bloque === it.bloque); if (!g) m.push(g = { bloque: it.bloque, nom: nombreBloque(it.bloque), items: [] }); g.items.push(it); }); return m; };
  const rondasOrden = u => u.rondas.slice().sort((a, b) => (a.fecha || "9999").localeCompare(b.fecha || "9999"));

  // ---------- La ronda: estado, respuestas y resultado ----------
  const respondidas = r => r.items.filter(x => x.valor).length;
  function estadoRonda(r) {
    if (r.cerrada) return "hecha";
    if (respondidas(r) || r.conversacion.some(c => lleno(c.respuesta)) || Object.keys(r.revisadas).length) return "curso";
    return "planificada";
  }
  const ESTADOS_RONDA = { planificada: "Planificada", curso: "En curso", hecha: "Hecha" };
  // Una ronda que aún no ha empezado toma siempre el cuestionario y las preguntas abiertas vigentes
  function sincronizar(u, r) {
    if (estadoRonda(r) !== "planificada") return false;
    r.items = ordenItems(u.items.filter(it => lleno(it.texto))).map(nuevaRespuesta);
    r.conversacion = u.abiertas.filter(lleno).map((p, i) => ({ id: "c" + (i + 1), pregunta: p, respuesta: "" }));
    return true;
  }
  // Cumplimiento = sí / (sí + no). «No aplica» y lo no respondido quedan fuera del denominador.
  function resultado(r) {
    const cuenta = l => { const si = l.filter(x => x.valor === "si").length, no = l.filter(x => x.valor === "no").length, na = l.filter(x => x.valor === "na").length; return { si, no, na, sin: l.length - si - no - na, n: l.length, pct: pct(si, si + no) }; };
    const g = cuenta(r.items);
    g.porBloque = porBloques(r.items).map(b => Object.assign({ bloque: b.bloque, nom: b.nom }, cuenta(b.items)));
    g.noCumplen = r.items.filter(x => x.valor === "no");
    g.resueltos = g.noCumplen.filter(x => x.resuelto).length + r.hallazgos.filter(h => lleno(h.texto) && h.resuelto).length;
    return g;
  }
  // «7 de 8»: si se cuentan casos, la cuenta propone la respuesta
  function valorDeCuenta(x) {
    const ok = Number(x.ok), de = Number(x.de);
    if (!lleno(x.ok) || !lleno(x.de) || !Number.isInteger(ok) || !Number.isInteger(de) || de <= 0 || ok < 0 || ok > de) return "";
    return ok === de ? "si" : "no";
  }
  const nivelPct = p => p == null ? "gris" : p >= 90 ? "verde" : p >= 75 ? "ambar" : "rojo";

  // ---------- Acciones ----------
  const accionesDeRonda = (u, r) => u.acciones.filter(a => a.rondaId === r.id);
  const vencida = (a, hoy) => esFecha(a.plazo) && a.plazo < String(hoy).slice(0, 10) && (a.estado === "pendiente" || a.estado === "curso");
  // Acciones de rondas anteriores que esta ronda tiene que comprobar
  function pendientesDe(u, r) {
    const fr = r.fecha || "9999-99-99";
    const previas = new Set(u.rondas.filter(x => x.id !== r.id && (x.fecha || "") <= fr && (x.fecha || "") !== "").map(x => x.id));
    return u.acciones.filter(a => previas.has(a.rondaId) && lleno(a.que) && (sigueAbierta(u, a) || r.revisadas[a.id]));
  }
  // Acción ya acordada para un ítem: la de esta ronda o la de una ronda anterior (la comprobación dirá si funciona)
  function accionDeItem(u, r, itemId) {
    const o = "item:" + itemId, fr = r.fecha || "9999-99-99";
    return u.acciones.find(a => a.origen === o && a.rondaId === r.id) || u.acciones.find(a => { if (a.origen !== o) return false; const ra = u.rondas.find(x => x.id === a.rondaId); return ra && ra.id !== r.id && (ra.fecha || "") <= fr; }) || null;
  }
  // Una acción que no funcionó deja de estar abierta cuando ya se ha acordado otra en su lugar
  const sustituida = (u, a) => u.acciones.some(b => b.origen === "accion:" + a.id);
  const sigueAbierta = (u, a) => ABIERTA(a.estado) && !(a.estado === "ineficaz" && sustituida(u, a));
  function revisar(u, r, accionId, v) {
    const a = u.acciones.find(x => x.id === accionId); if (!a) return;
    if (!v || r.revisadas[a.id] === v) { delete r.revisadas[a.id]; if (a.comprobada === r.id) { a.comprobada = ""; a.estado = "curso"; } return; }
    r.revisadas[a.id] = v;
    if (v === "ok") { a.estado = "comprobada"; a.comprobada = r.id; }
    else if (v === "mal") { a.estado = "ineficaz"; a.comprobada = r.id; }
    else if (a.comprobada === r.id) { a.comprobada = ""; a.estado = "curso"; }
  }
  // Fuerza de la medida (mismas pistas que AMFE, DAFO y Auditorías)
  function fuerzaMedida(texto) {
    const t = sinTildes(texto);
    if (!t) return "";
    if (/campo obligatori|no permit|\bbloque(e|ar|a)\b|forzad|automat|alarma|registrador|eliminar|retirar|sustituir|redisen|simplific|cambiar (la|el) (circuito|ubicacion)|instalar|reubicar/.test(t)) return "fuerte";
    if (/checklist|lista de verificacion|doble (verificacion|chequeo|comprobacion)|protocolo|procedimiento|estandariz|circuito|reunion|etiqueta|asignar|designar|responsable de|revision (diaria|semanal|periodica)|preimpres/.test(t)) return "intermedia";
    if (/formacion|\bformar\b|sesion|sensibiliz|concienci|charla|informar|difundir|recordar|insistir|cartel|curso|correo/.test(t)) return "debil";
    return "";
  }
  const FUERZAS = { fuerte: "Medida fuerte", intermedia: "Medida intermedia", debil: "Medida débil" };

  // ---------- Revisión de la redacción de un ítem ----------
  // Patrones estrechos a propósito: es un aviso didáctico, no un corrector.
  const VAGAS = /\b(bien|mal|correct[oa]s?|correctamente|adecuad[oa]s?|adecuadamente|apropiad[oa]s?|suficientes?|concienciad[oa]s?|buen[oa]?s?|optim[oa]s?|segur[oa]s?)\b/;
  function revisarItem(texto) {
    const t = sinTildes(texto), r = [];
    if (!t) return r;
    if (/^comprobar:/.test(t)) r.push({ k: "borrador", texto: "Es un borrador traído de otra app: redáctalo como algo que se vea en la unidad, con respuesta sí o no." });
    else if (VAGAS.test(t)) r.push({ k: "vago", texto: "Tiene una palabra que cada evaluador entenderá a su manera («bien», «adecuado», «correcto», «seguro»…). Di qué se ve exactamente." });
    else if (t.split(/\s+/).length < 6) r.push({ k: "corto", texto: "Es muy corto: ¿qué se ve exactamente, dónde y en cuántos pacientes?" });
    else if (/revisad[oa]s?\b/.test(t) && !/\d|hora|dia|semana|mes|turno|registrad|fecha|protocolo/.test(t)) r.push({ k: "cuando", texto: "«Revisado», ¿cuándo y dónde consta? Por ejemplo: «tiene registrada la revisión de las últimas 24 horas»." });
    if (datoPersonal(texto)) r.push({ k: "persona", texto: "Parece que nombra a una persona o un número de historia. Las preguntas y las notas van sin nombres." });
    return r;
  }
  function datoPersonal(texto) {
    const s = String(texto || "");
    return /\b(Dr|Dra|Sr|Sra|Don|Doña)\.?\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+/.test(s) || /\b(NHC|NUHSA|DNI|NIF)\b/i.test(s) || /\b\d{6,}\b/.test(s) || /historia\s*(cl[ií]nica)?\s*(n[ºo°.]*)?\s*\d{4,}/i.test(s);
  }
  // Palabras compartidas (para avisar de preguntas repetidas)
  function parecido(a, b) {
    const pa = new Set(normal(a).split(" ").filter(w => w.length > 3)), pb = new Set(normal(b).split(" ").filter(w => w.length > 3));
    if (!pa.size || !pb.size) return 0;
    let c = 0; pa.forEach(w => { if (pb.has(w)) c++; });
    return c / Math.max(pa.size, pb.size);
  }

  // ---------- Avisos por paso ----------
  // Cada aviso: { nivel: aviso|nota|error, texto, paso, item?, accion? }
  const av = (paso, texto, o = {}) => Object.assign({ nivel: "aviso", texto, paso }, o);
  function avisosPrograma(u) {
    const A = [];
    if (!lleno(u.unidad)) return A;
    if (!lleno(u.ambito)) A.push(av(1, "Elige el tipo de unidad: la app te propondrá las preguntas del banco que tienen sentido en ella."));
    if (!u.objetivos.length && !lleno(u.objetivo)) A.push(av(1, "¿Para qué hacéis rondas? Escribid el objetivo: comprobar prácticas, descubrir riesgos, escuchar al equipo, implicar a la dirección…"));
    if (!lleno(u.frecuencia)) A.push(av(1, "Decide la frecuencia (por ejemplo, mensual). Sin frecuencia no hay programa, solo visitas sueltas."));
    const eq = u.equipo.filter(m => lleno(m.perfil));
    if (eq.length && eq.length < 2) A.push(av(1, "El equipo de la ronda suele ser de dos o tres personas: alguien de la dirección o los mandos, alguien de calidad y, si se puede, alguien de otra unidad."));
    if (eq.length > 4) A.push(av(1, "Más de cuatro personas en la ronda intimida y molesta la atención. Mejor dos o tres, y que vayan rotando."));
    if (eq.length >= 2 && !eq.some(m => m.perfil === "direccion")) A.push(av(1, "No hay nadie de la dirección o los mandos. Su presencia es parte de la intervención: transmite que la seguridad importa.", { nivel: "nota" }));
    if (eq.some(m => datoPersonal(m.papel))) A.push(av(1, "Describe a cada miembro por su cargo o su papel, sin datos personales."));
    if (!lleno(u.circuito)) A.push(av(1, "Escribe el circuito de respuesta: quién recibe el informe, quién decide las acciones y cómo se comprueban. Una ronda sin respuesta enseña lo contrario de lo que pretende.", { nivel: "nota" }));
    return A;
  }
  function avisosCuestionario(u) {
    const A = [], l = u.items.filter(it => lleno(it.texto));
    if (!l.length) return A;
    if (l.length < 10) A.push(av(2, `Llevas ${plural(l.length, "pregunta", "preguntas")}. Un buen cuestionario tiene de diez a veinte: las justas para comprobarlas en una hora.`, { nivel: "nota" }));
    if (l.length > 20) A.push(av(2, `Tienes ${l.length} preguntas. Con más de veinte la ronda se alarga, molesta la atención y se responde deprisa. Quédate con las de los riesgos que más os importan.`));
    const bloques = new Set(l.map(it => it.bloque).filter(lleno));
    if (l.length >= 6 && bloques.size === 1) A.push(av(2, "Todas las preguntas son del mismo bloque. ¿No hay riesgos en la identificación, la medicación, las infecciones, los equipos o el entorno?", { nivel: "nota" }));
    if (l.some(it => !lleno(it.bloque))) A.push(av(2, "Hay preguntas sin bloque: agruparlas por bloques ayuda a recorrer la unidad con orden y a ver el resultado por áreas."));
    l.forEach(it => revisarItem(it.texto).forEach(x => A.push(av(2, x.texto, { item: it.id, nivel: x.k === "persona" ? "error" : "aviso" }))));
    for (let i = 0; i < l.length; i++) for (let j = i + 1; j < l.length; j++) if (parecido(l[i].texto, l[j].texto) >= 0.8) A.push(av(2, `Dos preguntas se parecen mucho: «${corto(l[i].texto, 50)}» y «${corto(l[j].texto, 50)}». ¿Sobra una?`, { item: l[j].id, nivel: "nota" }));
    const ab = u.abiertas.filter(lleno);
    if (!ab.length) A.push(av(2, "Añade dos o tres preguntas abiertas para el equipo. Ver sin escuchar es uno de los errores más frecuentes: lo que cuentan los profesionales no está en ningún registro."));
    else if (!ab.some(p => /bien|funciona|orgull|reconoc/.test(sinTildes(p)))) A.push(av(2, "Pregunta también por lo que va bien: reconocerlo mejora el clima de la ronda y la cultura de seguridad.", { nivel: "nota" }));
    return A;
  }
  function avisosCalendario(u, hoy) {
    const A = [], R = rondasOrden(u);
    if (!R.length) return A;
    const sinFecha = R.filter(r => !esFecha(r.fecha));
    if (sinFecha.length) A.push(av(3, `${sinFecha.length === 1 ? "Hay una ronda" : `Hay ${sinFecha.length} rondas`} sin fecha. La unidad debe conocer las fechas.`));
    const turnos = new Set(R.map(r => r.turno).filter(lleno));
    if (R.length >= 3 && turnos.size === 1) A.push(av(3, `Todas las rondas son de ${nombreTurno([...turnos][0]).toLowerCase()}. Los riesgos cambian con el turno: haced también rondas de ${[...turnos][0] === "noche" ? "mañana y de tarde" : "tarde, de noche"} y en fin de semana.`));
    else if (R.length >= 4 && !turnos.has("noche")) A.push(av(3, "Ninguna ronda es de noche. Muchas cosas solo se ven de madrugada (quién vigila la sala de espera, la luz, los traslados).", { nivel: "nota" }));
    const atrasadas = R.filter(r => esFecha(r.fecha) && r.fecha < hoy && estadoRonda(r) === "planificada");
    if (atrasadas.length) A.push(av(3, `${atrasadas.length === 1 ? "La ronda del " + fmtF(atrasadas[0].fecha) + " ya debería estar hecha" : atrasadas.length + " rondas ya deberían estar hechas"}. Hazla, cámbiale la fecha o bórrala.`));
    const hechas = R.filter(r => r.cerrada);
    const fr = FRECUENCIAS[u.frecuencia];
    if (fr && hechas.length && !R.some(r => !r.cerrada)) A.push(av(3, "No hay ninguna ronda planificada. Programa la siguiente: la ronda siguiente empieza comprobando las acciones de la anterior.", { nivel: "nota" }));
    return A;
  }
  function avisosRonda(u, r, hoy) {
    const A = [], e = estadoRonda(r), res = resultado(r);
    if (!r.items.length) A.push(av(1, "Esta ronda no tiene preguntas: prepara antes el cuestionario de la unidad (paso 2 del programa).", { nivel: "error" }));
    if (!esFecha(r.fecha)) A.push(av(1, "Pon la fecha de la ronda."));
    if (!lleno(r.turno)) A.push(av(1, "Indica el turno: así podréis ver después si los riesgos cambian de la mañana a la noche."));
    if (e !== "planificada" && !lleno(r.acompana)) A.push(av(1, "¿Quién de la unidad os acompaña? Siempre debe acompañar un profesional de la unidad visitada (por su cargo, sin nombre)."));
    if ([r.equipo, r.acompana].some(datoPersonal)) A.push(av(1, "Describe al equipo por su cargo o papel, sin datos personales.", { nivel: "error" }));
    const pend = pendientesDe(u, r), sinRevisar = pend.filter(a => !r.revisadas[a.id]);
    if (e !== "planificada" && sinRevisar.length) A.push(av(2, `${sinRevisar.length === 1 ? "Queda una acción" : `Quedan ${sinRevisar.length} acciones`} de rondas anteriores sin comprobar. La ronda empieza por ahí.`));
    if (e !== "planificada" && res.sin) A.push(av(3, `Faltan ${plural(res.sin, "pregunta", "preguntas")} por responder.`, { nivel: "nota" }));
    r.items.forEach(x => {
      if (x.valor === "no" && !lleno(x.nota)) A.push(av(3, `«${corto(x.texto, 60)}»: no se cumple. Anota qué viste (sin nombres), para el informe.`, { item: x.id, nivel: "nota" }));
      const vc = valorDeCuenta(x);
      if (vc && x.valor && x.valor !== "na" && vc !== x.valor) A.push(av(3, `«${corto(x.texto, 50)}»: has contado ${x.ok} de ${x.de}, pero la respuesta es «${x.valor === "si" ? "Sí" : "No"}». Si un caso no cumple, el ítem no se cumple.`, { item: x.id }));
      if (datoPersonal(x.nota)) A.push(av(3, "Una nota parece llevar un nombre o un número de historia. Quítalo: las notas van sin datos personales.", { item: x.id, nivel: "error" }));
    });
    r.hallazgos.forEach(h => { if (datoPersonal(h.texto)) A.push(av(3, "Un hallazgo parece llevar un nombre o un número de historia. Quítalo.", { nivel: "error" })); });
    if (e !== "planificada" && res.si + res.no > 0 && !r.conversacion.some(c => lleno(c.respuesta))) A.push(av(4, "Aún no has anotado lo que cuenta el equipo. Las preguntas abiertas son la mitad de la ronda."));
    r.conversacion.forEach(c => { if (datoPersonal(c.respuesta)) A.push(av(4, "Lo que contó el equipo parece llevar un nombre o un número de historia. Escríbelo sin datos personales.", { nivel: "error" })); });
    const acc = accionesDeRonda(u, r);
    const noSinAccion = res.noCumplen.filter(x => !x.resuelto && !accionDeItem(u, r, x.id));
    if (e !== "planificada" && noSinAccion.length) A.push(av(5, `${noSinAccion.length === 1 ? "Un ítem que no se cumple no tiene" : noSinAccion.length + " ítems que no se cumplen no tienen"} acción ni está resuelto en el momento.`));
    acc.forEach(a => {
      if (!lleno(a.que)) return;
      if (!lleno(a.responsable)) A.push(av(5, `«${corto(a.que, 50)}» no tiene responsable. Una acción sin responsable no la hace nadie.`, { accion: a.id }));
      if (!esFecha(a.plazo)) A.push(av(5, `«${corto(a.que, 50)}» no tiene plazo.`, { accion: a.id }));
      if (fuerzaMedida(a.que) === "debil") A.push(av(5, `«${corto(a.que, 50)}» es una medida débil (formar, recordar, poner un cartel). Si el riesgo es serio, busca también una que cambie el sistema.`, { accion: a.id, nivel: "nota" }));
    });
    if (r.cerrada && esFecha(r.fecha) && !esFecha(r.informe.fecha) && diasEntre(r.fecha, hoy) > 7) A.push(av(5, `Han pasado ${diasEntre(r.fecha, hoy)} días y no consta que se haya enviado el informe a la unidad. Debe llegar en pocos días.`));
    return A;
  }
  function avisosAcciones(u, hoy) {
    const A = [];
    u.acciones.filter(a => lleno(a.que)).forEach(a => {
      if (vencida(a, hoy)) A.push(av(4, `«${corto(a.que, 60)}» venció el ${fmtF(a.plazo)}.`, { accion: a.id }));
      if (sigueAbierta(u, a) && !lleno(a.responsable)) A.push(av(4, `«${corto(a.que, 60)}» no tiene responsable.`, { accion: a.id }));
      if (a.estado === "ineficaz" && !sustituida(u, a)) A.push(av(4, `«${corto(a.que, 60)}» no ha funcionado. Acuerda otra acción, mejor si es más fuerte.`, { accion: a.id }));
    });
    return A;
  }
  function avisosSeguimiento(u) {
    const A = [], hechas = u.rondas.filter(r => r.cerrada);
    if (hechas.length && hechas.length < 3) A.push(av(5, "Con menos de tres rondas hechas, la evolución todavía dice poco. Sigue el calendario.", { nivel: "nota" }));
    puntosCalientes(u).forEach(p => A.push(av(5, `«${corto(p.texto, 70)}» ${textoCaliente(p)}. Es un punto caliente: llévalo al mapa de riesgos o a una auditoría.`, { item: p.id })));
    return A;
  }
  function avisosDe(u, n, hoy) {
    return { 1: () => avisosPrograma(u), 2: () => avisosCuestionario(u), 3: () => avisosCalendario(u, hoy), 4: () => avisosAcciones(u, hoy), 5: () => avisosSeguimiento(u) }[n]();
  }

  // ---------- Seguimiento: evolución, puntos calientes, por turno ----------
  const rondasHechas = u => rondasOrden(u).filter(r => r.cerrada);
  function evolucion(u) { return rondasHechas(u).map(r => { const s = resultado(r); return { id: r.id, fecha: r.fecha, turno: r.turno, pct: s.pct, si: s.si, no: s.no, na: s.na, nombre: nombreRonda(r) }; }); }
  // Matriz ítem × ronda (las últimas n rondas hechas): ¿qué falla una y otra vez?
  function matrizCalor(u, n = 8) {
    const R = rondasHechas(u).slice(-n), filas = [];
    R.forEach(r => r.items.forEach(x => { if (!filas.some(f => f.id === x.id)) filas.push({ id: x.id, bloque: x.bloque, texto: x.texto }); }));
    const actual = u.items.find.bind(u.items);
    filas.forEach(f => { const it = actual(i => i.id === f.id); if (it) { f.texto = it.texto; f.bloque = it.bloque; } });
    return { rondas: R.map(r => ({ id: r.id, fecha: r.fecha, turno: r.turno })), filas: ordenItems(filas).map(f => Object.assign(f, { valores: R.map(r => { const x = r.items.find(y => y.id === f.id); return x ? x.valor : null; }), fallos: R.filter(r => (r.items.find(y => y.id === f.id) || {}).valor === "no").length })) };
  }
  // Punto caliente: no se cumple en 2 o más de las últimas 3 rondas en que se evaluó («repetido»),
  // o no se cumple en ninguna de las rondas (2 o más) de un mismo turno («turno»: lo que solo falla de noche).
  function puntosCalientes(u) {
    const m = matrizCalor(u, 99), r = [];
    m.filas.forEach(f => {
      const ev = f.valores.filter(v => v === "si" || v === "no").slice(-3), fallos = ev.filter(v => v === "no").length;
      if (ev.length >= 2 && fallos >= 2) { r.push({ id: f.id, bloque: f.bloque, texto: f.texto, por: "repetido", fallos, evaluadas: ev.length }); return; }
      const pt = fallosPorTurno(u, f.id), t = Object.keys(pt).find(k => pt[k].no >= 2 && pt[k].si === 0);
      if (t) r.push({ id: f.id, bloque: f.bloque, texto: f.texto, por: "turno", turno: t, fallos: pt[t].no, evaluadas: pt[t].no });
    });
    return r.sort((a, b) => b.fallos - a.fallos);
  }
  const textoCaliente = p => p.por === "turno" ? `no se ha cumplido en ninguna de las ${p.evaluadas} rondas de ${nombreTurno(p.turno).toLowerCase()}` : `no se ha cumplido en ${p.fallos} de las últimas ${p.evaluadas} rondas`;
  function porTurno(u) {
    return Object.keys(TURNOS).map(k => {
      const l = rondasHechas(u).filter(r => r.turno === k), s = l.reduce((a, r) => { const x = resultado(r); a.si += x.si; a.no += x.no; return a; }, { si: 0, no: 0 });
      return { turno: k, nom: TURNOS[k].nom, rondas: l.length, si: s.si, no: s.no, pct: pct(s.si, s.si + s.no) };
    }).filter(x => x.rondas);
  }
  // Fallos de un ítem por turno (para descubrir, p. ej., lo que solo falla de noche)
  function fallosPorTurno(u, itemId) {
    const r = {}; rondasHechas(u).forEach(x => { const it = x.items.find(y => y.id === itemId); if (!it || !lleno(x.turno) || (it.valor !== "si" && it.valor !== "no")) return; r[x.turno] = r[x.turno] || { si: 0, no: 0 }; r[x.turno][it.valor]++; });
    return r;
  }
  function resumenAcciones(u, hoy) {
    const l = u.acciones.filter(a => lleno(a.que));
    const c = k => l.filter(a => a.estado === k).length;
    return { n: l.length, abiertas: l.filter(a => sigueAbierta(u, a)).length, vencidas: l.filter(a => vencida(a, hoy)).length, comprobadas: c("comprobada"), hechas: c("hecha"), ineficaces: c("ineficaz"), elevadas: l.filter(a => a.eleva && sigueAbierta(u, a)).length };
  }
  function resumen(u, hoy) {
    const R = rondasOrden(u), hechas = R.filter(r => r.cerrada), ult = hechas[hechas.length - 1];
    const prox = R.find(r => !r.cerrada && esFecha(r.fecha) && r.fecha >= hoy) || R.find(r => !r.cerrada);
    return { items: u.items.filter(it => lleno(it.texto)).length, rondas: R.length, hechas: hechas.length, ultima: ult || null, ultimaPct: ult ? resultado(ult).pct : null, proxima: prox || null, acciones: resumenAcciones(u, hoy), calientes: puntosCalientes(u).length };
  }

  // ---------- Calendario ----------
  // Fecha de la siguiente ronda según la frecuencia; turno rotando mañana → tarde → noche
  function siguienteRonda(u, hoy) {
    const R = rondasOrden(u).filter(r => esFecha(r.fecha)), ult = R[R.length - 1], fr = FRECUENCIAS[u.frecuencia] || FRECUENCIAS.mensual;
    const fecha = ult ? sumaMeses(ult.fecha, fr.meses) : sumaDias(hoy, 7);
    const ultT = ult ? ult.turno : "", i = ROTACION.indexOf(ultT);
    return { fecha, turno: ult ? ROTACION[(i + 1) % ROTACION.length] : "manana" };
  }
  function proponerCalendario(u, hoy, genId, n) {
    const fr = FRECUENCIAS[u.frecuencia] || FRECUENCIAS.mensual, cuantas = n || Math.max(2, Math.round(6 / fr.meses)), nuevas = [];
    for (let i = 0; i < cuantas; i++) { const s = siguienteRonda(u, hoy), r = nuevaRonda(genId(), s.fecha, s.turno); r.hora = TURNOS[s.turno].hora; u.rondas.push(r); nuevas.push(r); }
    return nuevas;
  }

  // ---------- Textos propuestos ----------
  function bienPropuesto(r) {
    const s = resultado(r), l = [];
    s.porBloque.filter(b => b.si && !b.no).forEach(b => l.push(`${b.nom}: todo lo comprobado se cumple.`));
    const conv = r.conversacion.find(c => /bien|funciona/.test(sinTildes(c.pregunta)) && lleno(c.respuesta));
    if (conv) l.push(`El equipo destaca: ${conv.respuesta.trim().replace(/\.$/, "")}.`);
    return l.join(" ");
  }
  function resumenPropuesto(u, r) {
    const s = resultado(r), acc = accionesDeRonda(u, r).filter(a => lleno(a.que)), partes = [];
    if (s.si + s.no) partes.push(`Se comprobaron ${s.si + s.no} ítems y se cumplen ${s.si} (${s.pct} %).`);
    const bien = bienPropuesto(r); if (bien) partes.push("Lo que va bien. " + bien);
    if (s.noCumplen.length) partes.push("No se cumple: " + s.noCumplen.map(x => corto(x.texto, 90).replace(/\.$/, "") + (x.resuelto ? " (resuelto en el momento)" : "")).join("; ") + ".");
    const hall = r.hallazgos.filter(h => lleno(h.texto)); if (hall.length) partes.push("Otros hallazgos: " + hall.map(h => h.texto.trim().replace(/\.$/, "") + (h.resuelto ? " (resuelto en el momento)" : "")).join("; ") + ".");
    const pend = pendientesDe(u, r); if (pend.length) partes.push(`Acciones de la ronda anterior: ${pend.filter(a => r.revisadas[a.id] === "ok").length} comprobadas, ${pend.filter(a => r.revisadas[a.id] === "sigue").length} siguen pendientes y ${pend.filter(a => r.revisadas[a.id] === "mal").length} no han funcionado.`);
    if (acc.length) partes.push(`Se acuerdan ${plural(acc.length, "acción", "acciones")}${acc.some(a => a.eleva) ? `, ${acc.filter(a => a.eleva).length} se elevan a la dirección` : ""}.`);
    return partes.join(" ");
  }
  function conclusionesPropuestas(u, hoy) {
    const ev = evolucion(u), pc = puntosCalientes(u), ra = resumenAcciones(u, hoy), pt = porTurno(u), partes = [];
    if (!ev.length) return "";
    const pcts = ev.map(x => x.pct).filter(x => x != null);
    partes.push(`Se han hecho ${plural(ev.length, "ronda", "rondas")} entre el ${fmtF(ev[0].fecha)} y el ${fmtF(ev[ev.length - 1].fecha)}${pcts.length ? `, con un cumplimiento que va del ${Math.min(...pcts)} % al ${Math.max(...pcts)} % (última ronda: ${pcts[pcts.length - 1]} %)` : ""}.`);
    if (pc.length) partes.push(`${pc.length === 1 ? "Un ítem falla" : pc.length + " ítems fallan"} de forma repetida: ${pc.map(p => corto(p.texto, 80).replace(/\.$/, "") + " (" + textoCaliente(p) + ")").join("; ")}.`);
    const peor = pt.filter(x => x.pct != null).sort((a, b) => a.pct - b.pct)[0], mejor = pt.filter(x => x.pct != null).sort((a, b) => b.pct - a.pct)[0];
    if (pt.length >= 2 && peor && mejor && mejor.pct - peor.pct >= 5) partes.push(`El cumplimiento es menor en el turno de ${peor.nom.toLowerCase()} (${peor.pct} %) que en el de ${mejor.nom.toLowerCase()} (${mejor.pct} %).`);
    if (ra.n) partes.push(`De ${plural(ra.n, "acción acordada", "acciones acordadas")}, ${ra.comprobadas} ${ra.comprobadas === 1 ? "está comprobada" : "están comprobadas"} en ronda, ${ra.abiertas} siguen abiertas${ra.vencidas ? ` (${ra.vencidas} fuera de plazo)` : ""}.`);
    if (pc.length) partes.push("Se propone llevar los puntos calientes al mapa de riesgos de la unidad y valorar una auditoría.");
    return partes.join(" ");
  }

  // ---------- Progreso y «Tu siguiente paso» ----------
  const PASOS = [
    { n: 1, titulo: "La unidad y su programa", corto: "Programa", que: "Qué unidad, para qué hacéis rondas, cada cuánto, con qué equipo y qué pasa después." },
    { n: 2, titulo: "El cuestionario", corto: "Preguntas", que: "De diez a veinte preguntas observables elegidas del banco según vuestros riesgos, por bloques, y las preguntas abiertas para el equipo." },
    { n: 3, titulo: "Las rondas", corto: "Rondas", que: "El calendario, con turnos variados, y cada ronda: prepararla, comprobar lo pendiente, mirar, escuchar y acordar." },
    { n: 4, titulo: "Las acciones", corto: "Acciones", que: "Lo acordado, con responsable y plazo, y si se ha comprobado en la ronda siguiente." },
    { n: 5, titulo: "El seguimiento", corto: "Seguimiento", que: "Cómo evoluciona la unidad: cumplimiento por ronda, por bloque y por turno, y lo que falla una y otra vez." }
  ];
  const PASOS_RONDA = [
    { n: 1, titulo: "Preparar la ronda", corto: "Preparar", que: "Fecha, turno, equipo y quién acompaña. La unidad conoce la fecha." },
    { n: 2, titulo: "Comprobar lo pendiente", corto: "Pendiente", que: "La ronda empieza comprobando las acciones de la anterior." },
    { n: 3, titulo: "Mirar", corto: "Mirar", que: "Recorrer la unidad con el cuestionario: sí, no o no aplica, con notas sin nombres." },
    { n: 4, titulo: "Escuchar", corto: "Escuchar", que: "Las preguntas abiertas al equipo, en un momento tranquilo, sin discutir." },
    { n: 5, titulo: "Acordar y cerrar", corto: "Acordar", que: "Acciones con responsable y plazo, cierre con el responsable de turno e informe a la unidad." }
  ];
  function progreso(u) {
    return {
      1: lleno(u.unidad) && lleno(u.ambito) && lleno(u.frecuencia) && (u.objetivos.length > 0 || lleno(u.objetivo)),
      2: u.items.filter(it => lleno(it.texto)).length >= 5 && u.abiertas.some(lleno),
      3: u.rondas.some(r => r.cerrada),
      4: u.acciones.some(a => lleno(a.que)) && !u.acciones.some(a => lleno(a.que) && (!lleno(a.responsable) || !esFecha(a.plazo))),
      5: u.rondas.filter(r => r.cerrada).length >= 3
    };
  }
  function progresoRonda(u, r) {
    const res = resultado(r), pend = pendientesDe(u, r);
    return {
      1: esFecha(r.fecha) && lleno(r.turno) && lleno(r.equipo),
      2: pend.length > 0 && pend.every(a => r.revisadas[a.id]),
      3: r.items.length > 0 && res.sin === 0,
      4: r.conversacion.some(c => lleno(c.respuesta)),
      5: r.cerrada
    };
  }
  function siguientePaso(datos, hoy) {
    const U = datos.unidades.slice().sort((a, b) => String(b.modificado).localeCompare(String(a.modificado)));
    if (!U.length) return { texto: "Crea el programa de rondas de tu unidad: unidad, objetivo, frecuencia y equipo. Si quieres ver antes cómo queda, abre el ejemplo de Urgencias.", btn: "Crear el programa", href: "#/unidad/nueva" };
    const u = U[0], nom = corto(nombreUnidad(u) || "tu unidad", 50), g = progreso(u), ir = n => `#/unidad/${u.id}/${n}`;
    if (!g[1]) return { texto: `Termina el programa de «${nom}»: tipo de unidad, objetivo y frecuencia.`, btn: "Ir al programa", href: ir(1) };
    if (!g[2]) return { texto: `Elige las preguntas de la ronda de «${nom}» en el banco: de diez a veinte, según vuestros riesgos.`, btn: "Elegir las preguntas", href: ir(2) };
    const curso = rondasOrden(u).find(r => estadoRonda(r) === "curso");
    if (curso) return { texto: `Tienes a medias la ronda del ${fmtF(curso.fecha) || "(sin fecha)"}. Termínala: falta ${progresoRonda(u, curso)[3] ? "acordar las acciones y cerrarla" : "terminar de responder"}.`, btn: "Seguir con la ronda", href: `#/unidad/${u.id}/ronda/${curso.id}/${progresoRonda(u, curso)[3] ? 5 : 3}` };
    const sinInforme = rondasOrden(u).filter(r => r.cerrada && !esFecha(r.informe.fecha)).pop();
    if (sinInforme) return { texto: `La ronda del ${fmtF(sinInforme.fecha)} está hecha, pero no consta que la unidad haya recibido el informe. Descárgalo y anota cuándo lo envías.`, btn: "Ver el informe", href: `#/unidad/${u.id}/ronda/${sinInforme.id}/5` };
    const ra = resumenAcciones(u, hoy);
    if (ra.vencidas) return { texto: `${ra.vencidas === 1 ? "Hay una acción" : `Hay ${ra.vencidas} acciones`} fuera de plazo en «${nom}». Pregunta cómo van y actualiza su estado.`, btn: "Ver las acciones", href: ir(4) };
    const prox = rondasOrden(u).find(r => !r.cerrada);
    if (prox) return { texto: `Tu próxima ronda en «${nom}»: ${nombreRonda(prox)}. Prepárala${pendientesDe(u, prox).length ? `: empezará comprobando ${plural(pendientesDe(u, prox).length, "acción pendiente", "acciones pendientes")}` : ""}.`, btn: "Preparar la ronda", href: `#/unidad/${u.id}/ronda/${prox.id}/1` };
    if (rondasHechas(u).length >= 3 && !lleno(u.conclusiones)) return { texto: `Ya tienes ${rondasHechas(u).length} rondas hechas en «${nom}». Mira juntas sus resultados: qué falla una y otra vez y en qué turno.`, btn: "Ver el seguimiento", href: ir(5) };
    return { texto: `Planifica la siguiente ronda de «${nom}».`, btn: "Planificar", href: ir(3) };
  }

  // ---------- Traer de AMFE o de Mapa de Riesgos ----------
  // Lee el paquete amfe-fallos v1 (o mapariesgos-mapas v1, que lleva un AMFE por mapa), o su copia .json.
  // Devuelve los fallos prioritarios como borradores de pregunta, o { error }.
  function leerFallos(o) {
    if (o && typeof o === "object" && o.intercambio) o = o.intercambio;
    if (!o || typeof o !== "object") return { error: "No se reconoce el archivo." };
    let amfes;
    if (o.formato === "amfe-fallos") { if (o.version !== 1) return { error: "Es de una versión de AMFE que esta app aún no entiende." }; amfes = o.amfes; }
    else if (o.formato === "mapariesgos-mapas") { if (o.version !== 1) return { error: "Es de una versión de Mapa de Riesgos que esta app aún no entiende." }; amfes = (Array.isArray(o.mapas) ? o.mapas : []).map(m => m && m.amfe).filter(Boolean); }
    else return { error: "No es un paquete de AMFE ni de Mapa de Riesgos." };
    const T = (v, n = 400) => (typeof v === "string" || typeof v === "number") ? String(v).slice(0, n) : "";
    return { origen: o.formato === "amfe-fallos" ? "AMFE" : "Mapa de Riesgos", amfes: (Array.isArray(amfes) ? amfes : []).slice(0, 50).filter(a => a && typeof a === "object").map(a => ({
      id: T(a.id, 60), titulo: T(a.titulo || a.proceso, 200) || "Sin título", unidad: T(a.unidad, 200),
      fallos: (Array.isArray(a.fallos) ? a.fallos : []).slice(0, 500).filter(f => f && typeof f === "object" && f.prioritario && lleno(f.fallo)).map(f => ({
        id: T(f.id, 60), num: T(f.num, 10), fallo: T(f.fallo), subproceso: T(f.subproceso, 200), ipr: typeof f.ipr === "number" ? f.ipr : null, controles: T(f.controles) })) })) };
  }
  const itemDeFallo = (genId, a, f) => Object.assign(nuevoItem(genId(), "", "Comprobar: " + f.fallo.trim().replace(/\.$/, "")), { amfe: f.num, origen: `amfe:${a.id}:${f.id}` });

  // ---------- Documentos (lista de bloques: docx.js → Word; app.js → vista previa y PDF) ----------
  const FONDO = { si: "DCFCE7", no: "FEE2E2", na: "F1F5F9" };
  const VALOR = { si: "Sí", no: "No", na: "N/A", "": "—" };
  function bloqueFicha(u, r) {
    const f = [["Unidad", nombreUnidad(u)], ["Tipo", AMBITOS[u.ambito] ? AMBITOS[u.ambito].nom : ""]];
    if (r) f.push(["Fecha y turno", [fmtF(r.fecha), r.hora, nombreTurno(r.turno)].filter(lleno).join(" · ")], ["Equipo de la ronda", r.equipo], ["Acompaña (de la unidad)", r.acompana]);
    else f.push(["Frecuencia", FRECUENCIAS[u.frecuencia] ? FRECUENCIAS[u.frecuencia].nom : ""], ["Coordina", u.responsable]);
    return { t: "tabla", sinCab: true, anchos: [28, 72], filas: f.filter(x => lleno(x[1])).map(x => [{ texto: x[0], negrita: true }, x[1]]) };
  }
  function documentoHoja(u, r) {
    const B = [{ t: "h1", texto: "Hoja de la ronda de seguridad" }, bloqueFicha(u, r || nuevaRonda("x")),
      { t: "p", estilo: "nota", texto: "Marca cada ítem: Sí (se cumple), No (no se cumple) o N/A (no aplica). Anota lo que veas sin nombres de pacientes ni de profesionales. Lo peligroso y fácil de resolver, se resuelve en el momento y se anota." }];
    const pend = r ? pendientesDe(u, r) : [];
    if (pend.length) B.push({ t: "h2", texto: "1. Comprobar las acciones de la ronda anterior" }, { t: "tabla", fuente: 8, cab: ["Acción", "Responsable", "Plazo", "¿Resuelta?"], anchos: [52, 18, 12, 18], filas: pend.map(a => [a.que, a.responsable, fmtF(a.plazo), "Sí · Sigue · No funcionó"]) });
    B.push({ t: "h2", texto: (pend.length ? "2" : "1") + ". Lo que se comprueba" });
    const items = r && r.items.length ? r.items : ordenItems(u.items.filter(it => lleno(it.texto)));
    porBloques(items).forEach(g => B.push({ t: "tabla", fuente: 8, cab: [g.nom, "Sí", "No", "N/A", "Notas"], anchos: [50, 6, 6, 6, 32], filas: g.items.map(x => [x.texto + (x.donde && DONDE[x.donde] ? ` (${DONDE[x.donde].nom.toLowerCase()})` : ""), { texto: x.valor === "si" ? "✓" : "", centro: true }, { texto: x.valor === "no" ? "✓" : "", centro: true }, { texto: x.valor === "na" ? "✓" : "", centro: true }, x.nota || ""]) }));
    B.push({ t: "h2", texto: (pend.length ? "3" : "2") + ". Lo que cuenta el equipo" });
    const conv = r && r.conversacion.length ? r.conversacion : u.abiertas.filter(lleno).map(p => ({ pregunta: p, respuesta: "" }));
    B.push({ t: "tabla", fuente: 8.5, sinCab: true, anchos: [35, 65], filas: conv.map(c => [{ texto: c.pregunta, negrita: true }, c.respuesta || "\n\n\n"]) });
    B.push({ t: "h2", texto: "Otros hallazgos y cierre con el responsable de turno" }, { t: "tabla", fuente: 8.5, sinCab: true, anchos: [100], filas: [["\n\n\n\n"]] });
    return { titulo: "Hoja de ronda · " + nombreUnidad(u) + (r && r.fecha ? " · " + fmtF(r.fecha) : ""), bloques: B };
  }
  function tablaAcciones(l, conRonda, rondas) {
    return { t: "tabla", fuente: 8, cab: [conRonda ? "Ronda" : "", "Acción", "Responsable", "Plazo", "Eleva", "Estado"].filter((x, i) => i || conRonda), anchos: conRonda ? [11, 41, 18, 10, 7, 13] : [48, 20, 11, 8, 13],
      filas: l.map(a => { const r = rondas && rondas.find(x => x.id === a.rondaId); return [conRonda ? fmtF(r ? r.fecha : "") : null, a.que + (lleno(a.indicador) ? `\nIndicador: ${a.indicador}` : ""), a.responsable, fmtF(a.plazo), a.eleva ? "Sí" : "", ESTADOS_ACCION[a.estado] ? ESTADOS_ACCION[a.estado].nom : ""].filter(x => x !== null); }) };
  }
  function documentoInforme(u, r) {
    const s = resultado(r), acc = accionesDeRonda(u, r).filter(a => lleno(a.que)), pend = pendientesDe(u, r), B = [];
    B.push({ t: "portada", titulo: "Informe de la ronda de seguridad", sub: nombreUnidad(u), extra: [nombreRonda(r), "Para aprender y mejorar, no para inspeccionar."] });
    B.push({ t: "h1", texto: "1. Datos de la ronda" }, bloqueFicha(u, r));
    B.push({ t: "h1", texto: "2. Resultado" });
    B.push({ t: "p", runs: [{ texto: s.pct == null ? "Sin ítems valorados. " : `Cumplimiento: ${s.pct} % `, negrita: true }, { texto: s.si + s.no ? `(${s.si} de ${s.si + s.no} ítems valorados se cumplen; ${s.na} no aplican).` : "" }] });
    B.push({ t: "tabla", fuente: 8.5, cab: ["Bloque", "Sí", "No", "N/A", "Cumplimiento"], anchos: [48, 10, 10, 10, 22], filas: s.porBloque.map(b => [b.nom, { texto: String(b.si), centro: true }, { texto: String(b.no), centro: true, fondo: b.no ? FONDO.no : "" }, { texto: String(b.na), centro: true }, { texto: b.pct == null ? "—" : b.pct + " %", centro: true, negrita: true }]) });
    if (lleno(r.cierre.bien)) B.push({ t: "h2", texto: "Lo que va bien" }, { t: "p", texto: r.cierre.bien });
    B.push({ t: "h2", texto: "Lo que no se cumple" });
    const hall = r.hallazgos.filter(h => lleno(h.texto));
    if (s.noCumplen.length || hall.length) B.push({ t: "tabla", fuente: 8.5, cab: ["Hallazgo", "Lo que se vio", "Resuelto en el momento"], anchos: [44, 40, 16], filas: [...s.noCumplen.map(x => [x.texto, [x.nota, lleno(x.ok) && lleno(x.de) ? `${x.ok} de ${x.de}` : ""].filter(lleno).join(" · "), x.resuelto ? "Sí" : "No"]), ...hall.map(h => [h.texto, "Hallazgo fuera del cuestionario", h.resuelto ? "Sí" : "No"])] });
    else B.push({ t: "p", texto: "Todo lo comprobado se cumple." });
    const conv = r.conversacion.filter(c => lleno(c.respuesta));
    B.push({ t: "h1", texto: "3. Lo que cuenta el equipo" });
    if (conv.length) conv.forEach(c => B.push({ t: "h2", texto: c.pregunta }, { t: "p", texto: c.respuesta }));
    else B.push({ t: "p", texto: "No se anotó la conversación con el equipo." });
    if (pend.length) {
      B.push({ t: "h1", texto: "4. Acciones de rondas anteriores" });
      B.push({ t: "tabla", fuente: 8, cab: ["Acción", "Responsable", "Plazo", "En esta ronda"], anchos: [50, 20, 12, 18], filas: pend.map(a => [a.que, a.responsable, fmtF(a.plazo), { texto: r.revisadas[a.id] ? REVISION[r.revisadas[a.id]].nom : "Sin comprobar", fondo: r.revisadas[a.id] === "ok" ? FONDO.si : r.revisadas[a.id] === "mal" ? FONDO.no : "" }]) });
    }
    B.push({ t: "h1", texto: (pend.length ? "5" : "4") + ". Acciones acordadas" });
    if (acc.length) B.push(tablaAcciones(acc, false));
    else B.push({ t: "p", texto: "No se han acordado acciones." });
    if (lleno(r.cierre.resumen)) B.push({ t: "h2", texto: "Resumen" }, { t: "p", texto: r.cierre.resumen });
    const prox = rondasOrden(u).find(x => !x.cerrada && x.id !== r.id && (x.fecha || "") >= (r.fecha || ""));
    B.push({ t: "p", estilo: "nota", texto: (prox ? `Próxima ronda: ${nombreRonda(prox)}. Empezará comprobando estas acciones. ` : "La próxima ronda empezará comprobando estas acciones. ") + "Este informe no contiene datos de pacientes ni de profesionales." });
    return { titulo: "Informe de ronda · " + nombreUnidad(u) + " · " + fmtF(r.fecha), bloques: B };
  }
  function documentoSeguimiento(u, hoy) {
    const B = [], ev = evolucion(u), m = matrizCalor(u, 8), pc = puntosCalientes(u), pt = porTurno(u);
    B.push({ t: "portada", titulo: "Programa y seguimiento de las rondas de seguridad", sub: nombreUnidad(u), extra: [`Situación a ${fmtF(hoy)}`] });
    B.push({ t: "h1", texto: "1. El programa" }, bloqueFicha(u, null));
    const obj = [...u.objetivos.map(k => OBJETIVOS[k]).filter(Boolean), u.objetivo].filter(lleno);
    if (obj.length) B.push({ t: "h2", texto: "Objetivo" }, { t: "lista", items: obj });
    const eq = u.equipo.filter(x => lleno(x.perfil) || lleno(x.papel));
    if (eq.length) B.push({ t: "h2", texto: "Equipo de la ronda" }, { t: "lista", items: eq.map(x => [PERFILES[x.perfil] ? PERFILES[x.perfil].nom : "", x.papel].filter(lleno).join(": ")) });
    if (lleno(u.circuito)) B.push({ t: "h2", texto: "Circuito de respuesta" }, { t: "p", texto: u.circuito });
    B.push({ t: "h2", texto: "Cuestionario" });
    porBloques(u.items.filter(it => lleno(it.texto))).forEach(g => B.push({ t: "tabla", fuente: 8, cab: [g.nom, "Dónde", "Fallo AMFE"], anchos: [66, 22, 12], filas: g.items.map(x => [x.texto, DONDE[x.donde] ? DONDE[x.donde].nom : "", x.amfe]) }));
    if (u.abiertas.some(lleno)) B.push({ t: "p", runs: [{ texto: "Preguntas abiertas: ", negrita: true }, { texto: u.abiertas.filter(lleno).join(" · ") }] });
    B.push({ t: "h1", texto: "2. Calendario" });
    B.push({ t: "tabla", fuente: 8.5, cab: ["Fecha", "Turno", "Estado", "Cumplimiento", "Acciones"], anchos: [18, 18, 20, 22, 22], filas: rondasOrden(u).map(r => { const s = resultado(r); return [fmtF(r.fecha) || "Sin fecha", nombreTurno(r.turno), ESTADOS_RONDA[estadoRonda(r)], { texto: r.cerrada && s.pct != null ? s.pct + " %" : "", centro: true }, { texto: String(accionesDeRonda(u, r).filter(a => lleno(a.que)).length || ""), centro: true }]; }) });
    if (ev.length) {
      B.push({ t: "h1", texto: "3. Evolución" });
      if (m.rondas.length) B.push({ t: "p", estilo: "nota", texto: "Puntos calientes: cada columna es una ronda (las últimas ocho). ✓ se cumple · ✕ no se cumple · – no aplica." },
        { t: "tabla", fuente: 7, cab: ["Ítem", ...m.rondas.map(r => fmtF(r.fecha).slice(0, 5) + " " + (TURNOS[r.turno] ? TURNOS[r.turno].corto : ""))], anchos: [100 - m.rondas.length * 7, ...m.rondas.map(() => 7)],
          filas: m.filas.map(f => [corto(f.texto, 90), ...f.valores.map(v => ({ texto: v === "si" ? "✓" : v === "no" ? "✕" : v === "na" ? "–" : "", centro: true, fondo: v ? FONDO[v] : "" }))]) });
      if (pt.length) B.push({ t: "h2", texto: "Por turno" }, { t: "tabla", fuente: 8.5, cab: ["Turno", "Rondas", "Cumplimiento"], anchos: [40, 30, 30], filas: pt.map(x => [x.nom, { texto: String(x.rondas), centro: true }, { texto: x.pct == null ? "—" : x.pct + " %", centro: true }]) });
      B.push({ t: "h2", texto: "Lo que falla una y otra vez" });
      B.push(pc.length ? { t: "lista", items: pc.map(p => `${p.texto.replace(/\.$/, "")} (${textoCaliente(p)}).`) } : { t: "p", texto: "Ningún ítem falla en dos o más de las últimas tres rondas, ni en todas las de un mismo turno." });
    }
    const acc = u.acciones.filter(a => lleno(a.que));
    if (acc.length) { const ra = resumenAcciones(u, hoy); B.push({ t: "h1", texto: (ev.length ? "4" : "3") + ". Acciones" }, { t: "p", texto: `${plural(ra.n, "acción", "acciones")}: ${plural(ra.comprobadas, "comprobada", "comprobadas")} en ronda, ${plural(ra.hechas, "hecha", "hechas")} por comprobar, ${ra.abiertas - ra.hechas} pendiente${ra.abiertas - ra.hechas === 1 ? "" : "s"} o en marcha${ra.vencidas ? ` (${ra.vencidas} fuera de plazo)` : ""}${ra.ineficaces ? `, ${ra.ineficaces} sin efecto` : ""}.` }, tablaAcciones(acc, true, u.rondas)); }
    const concl = lleno(u.conclusiones) ? u.conclusiones : conclusionesPropuestas(u, hoy);
    if (concl) B.push({ t: "h1", texto: "Conclusiones" }, { t: "p", texto: concl });
    return { titulo: "Seguimiento de rondas · " + nombreUnidad(u), bloques: B };
  }

  // ---------- Excel ----------
  const ESTILOS_XLSX = {
    titulo: { negrita: true, tamano: 14, colorTexto: "FFFFFF", colorFondo: "7A1626", borde: false },
    sub: { cursiva: true, colorTexto: "444444", borde: false },
    cab: { negrita: true, colorTexto: "FFFFFF", colorFondo: "0D1B2A", alineacion: "center", ajustarTexto: true },
    celda: { ajustarTexto: true, vertical: "top" },
    negrita: { negrita: true, ajustarTexto: true, vertical: "top" },
    centro: { alineacion: "center", vertical: "top", ajustarTexto: true },
    si: { alineacion: "center", colorFondo: "DCFCE7", colorTexto: "166534", negrita: true },
    no: { alineacion: "center", colorFondo: "FEE2E2", colorTexto: "991B1B", negrita: true },
    na: { alineacion: "center", colorFondo: "F1F5F9", colorTexto: "475569" }
  };
  function hojasExcel(u, fecha) {
    const T = (texto, estilo = "celda") => ({ texto: texto == null ? "" : String(texto), estilo });
    const N = x => x == null ? T("", "centro") : { numero: x, estilo: "centro" };
    const nom = nombreUnidad(u) || "Unidad";
    const cab = (titulo, cols) => { const f = [[T(titulo, "titulo")], [T(nom + " · Exportado de la app Rondas de Seguridad · " + fecha, "sub")], cols.map(x => T(x, "cab"))]; f[0][0].combinar = cols.length; f[1][0].combinar = cols.length; return f; };
    const h1 = cab("Rondas", ["Fecha", "Hora", "Turno", "Estado", "Equipo", "Acompaña", "Sí", "No", "N/A", "Cumplimiento (%)", "Resueltos en el momento", "Acciones", "Informe enviado"]);
    rondasOrden(u).forEach(r => { const s = resultado(r); h1.push([T(fmtF(r.fecha)), T(r.hora), T(nombreTurno(r.turno)), T(ESTADOS_RONDA[estadoRonda(r)]), T(r.equipo), T(r.acompana), N(s.si), N(s.no), N(s.na), N(s.pct), N(s.resueltos), N(accionesDeRonda(u, r).filter(a => lleno(a.que)).length), T(fmtF(r.informe.fecha))]); });
    const m = matrizCalor(u, 99);
    const h2 = cab("Respuestas (ítem × ronda)", ["Bloque", "Ítem", ...m.rondas.map(r => fmtF(r.fecha) + " " + (TURNOS[r.turno] ? TURNOS[r.turno].corto : "")), "Veces que no se cumple"]);
    m.filas.forEach(f => h2.push([T(nombreBloque(f.bloque)), T(f.texto), ...f.valores.map(v => v ? T(VALOR[v], v) : T("", "centro")), N(f.fallos)]));
    const h3 = cab("Acciones", ["Ronda", "Acción", "Responsable", "Plazo", "Se eleva a la dirección", "Indicador", "Estado", "Fuerza de la medida", "Nota"]);
    u.acciones.filter(a => lleno(a.que)).forEach(a => { const r = u.rondas.find(x => x.id === a.rondaId); h3.push([T(r ? fmtF(r.fecha) : ""), T(a.que, "negrita"), T(a.responsable), T(fmtF(a.plazo)), T(a.eleva ? "Sí" : "No", "centro"), T(a.indicador), T(ESTADOS_ACCION[a.estado] ? ESTADOS_ACCION[a.estado].nom : ""), T(FUERZAS[fuerzaMedida(a.que)] || ""), T(a.nota)]); });
    const h4 = cab("Cuestionario", ["Bloque", "Pregunta", "Dónde", "Fallo del AMFE"]);
    ordenItems(u.items.filter(it => lleno(it.texto))).forEach(x => h4.push([T(nombreBloque(x.bloque)), T(x.texto), T(DONDE[x.donde] ? DONDE[x.donde].nom : ""), T(x.amfe)]));
    u.abiertas.filter(lleno).forEach(p => h4.push([T("Pregunta abierta"), T(p), T("Preguntando al equipo"), T("")]));
    return { estilos: ESTILOS_XLSX, hojas: [
      { nombre: "Rondas", filas: h1, anchos: [12, 8, 12, 12, 30, 24, 6, 6, 6, 14, 14, 10, 14], congelar: 3 },
      { nombre: "Respuestas", filas: h2, anchos: [20, 60, ...m.rondas.map(() => 11), 12], congelar: 3 },
      { nombre: "Acciones", filas: h3, anchos: [12, 50, 22, 12, 12, 30, 22, 18, 30], congelar: 3 },
      { nombre: "Cuestionario", filas: h4, anchos: [24, 70, 28, 14], congelar: 3 }
    ] };
  }

  // ---------- Intercambio con las otras apps (formato rondas-seguridad, versión 1) ----------
  const FORMATO_INTERCAMBIO = "rondas-seguridad", VERSION_INTERCAMBIO = 1;
  function paqueteIntercambio(unidades, appVersion, fecha) {
    const hoy = String(fecha).slice(0, 10);
    return { formato: FORMATO_INTERCAMBIO, version: VERSION_INTERCAMBIO, app: "rondas", appVersion, generado: fecha,
      unidades: unidades.map(u => ({ id: u.id, unidad: nombreUnidad(u), ambito: u.ambito || null, frecuencia: u.frecuencia || null,
        items: ordenItems(u.items.filter(it => lleno(it.texto))).map(x => ({ id: x.id, bloque: x.bloque || null, bloqueNombre: lleno(x.bloque) ? nombreBloque(x.bloque) : null, texto: x.texto, donde: x.donde || null, amfe: x.amfe || null })),
        rondas: rondasOrden(u).map(r => { const s = resultado(r); return { id: r.id, fecha: r.fecha || null, turno: r.turno || null, estado: estadoRonda(r), cumplimiento: s.pct, si: s.si, no: s.no, na: s.na, noCumplen: s.noCumplen.map(x => x.id) }; }),
        puntosCalientes: puntosCalientes(u).map(p => ({ itemId: p.id, texto: p.texto, bloque: p.bloque || null, por: p.por, turno: p.turno || null, fallos: p.fallos, evaluadas: p.evaluadas })),
        acciones: u.acciones.filter(a => lleno(a.que)).map(a => { const r = u.rondas.find(x => x.id === a.rondaId); return { id: a.id, rondaFecha: r ? r.fecha || null : null, que: a.que, responsable: a.responsable, plazo: a.plazo || null, estado: a.estado, eleva: !!a.eleva, indicador: a.indicador, vencida: vencida(a, hoy) }; }) })) };
  }
  function leerIntercambio(o) {
    if (o && typeof o === "object" && o.intercambio) o = o.intercambio;
    if (!o || o.formato !== FORMATO_INTERCAMBIO || o.version !== VERSION_INTERCAMBIO || !Array.isArray(o.unidades)) return null;
    return o;
  }

  // ---------- Saneado por esquema ----------
  // [n] = texto de hasta n caracteres · "id" · "ref" (id o vacío) · { en } enumerado · { de, max } lista de objetos ·
  // { textos, max } lista de textos · { lista, en } lista de claves · "bool" · "fecha" · "revisadas"
  const ESQ = {
    unidad: { id: "id", creado: [40], modificado: [40], unidad: [200], ambito: { en: ["", ...Object.keys(AMBITOS)] }, objetivos: { lista: true, en: Object.keys(OBJETIVOS) }, objetivo: [1000], frecuencia: { en: ["", ...Object.keys(FRECUENCIAS)] },
      equipo: { de: "miembro", max: 12 }, circuito: [1500], responsable: [200], items: { de: "item", max: 80 }, abiertas: { textos: true, max: 8 }, rondas: { de: "ronda", max: 200 }, acciones: { de: "accion", max: 600 }, conclusiones: [3000], notas: [2000] },
    miembro: { id: "id", perfil: { en: ["", ...Object.keys(PERFILES)] }, papel: [200] },
    item: { id: "id", bloque: { en: ["", ...ORDEN_BLOQUES] }, texto: [400], donde: { en: ["", ...Object.keys(DONDE)] }, amfe: [40], origen: [140] },
    ronda: { id: "id", fecha: "fecha", hora: [5], turno: { en: ["", ...Object.keys(TURNOS)] }, equipo: [400], acompana: [200], items: { de: "respuesta", max: 80 }, conversacion: { de: "charla", max: 8 }, hallazgos: { de: "hallazgo", max: 40 }, revisadas: "revisadas", cierre: { obj: "cierre" }, cerrada: "bool", informe: { obj: "informe" } },
    respuesta: { id: "id", bloque: { en: ["", ...ORDEN_BLOQUES] }, texto: [400], donde: { en: ["", ...Object.keys(DONDE)] }, amfe: [40], valor: { en: ["", "si", "no", "na"] }, nota: [1000], resuelto: "bool", ok: [4], de: [4] },
    charla: { id: "id", pregunta: [300], respuesta: [3000] },
    hallazgo: { id: "id", texto: [600], resuelto: "bool" },
    cierre: { bien: [2000], resumen: [3000] },
    informe: { fecha: "fecha", destinatarios: [400] },
    accion: { id: "id", rondaId: "ref", origen: [140], que: [600], responsable: [200], plazo: "fecha", eleva: "bool", indicador: [400], estado: { en: Object.keys(ESTADOS_ACCION) }, comprobada: "ref", nota: [1000] }
  };
  const FABRICA = {
    unidad: id => nuevaUnidad(id, ""), miembro: id => nuevoMiembro(id), item: id => nuevoItem(id), ronda: id => nuevaRonda(id),
    respuesta: id => nuevaRespuesta(nuevoItem(id)), charla: id => ({ id, pregunta: "", respuesta: "" }), hallazgo: id => nuevoHallazgo(id),
    cierre: () => ({ bien: "", resumen: "" }), informe: () => ({ fecha: "", destinatarios: "" }), accion: id => nuevaAccion(id)
  };
  const idValido = v => typeof v === "string" && /^[\w-]{1,60}$/.test(v);
  const txt = (v, n) => (typeof v === "string" || typeof v === "number") ? String(v).slice(0, n) : "";
  function sanear(esq, o, genId) {
    if (!o || typeof o !== "object" || Array.isArray(o)) return null;
    const S = ESQ[esq], r = FABRICA[esq](genId());
    Object.keys(S).forEach(k => {
      const regla = S[k], v = o[k];
      if (regla === "id") r[k] = idValido(v) ? v : r[k];
      else if (regla === "ref") r[k] = idValido(v) ? v : "";
      else if (regla === "bool") r[k] = v === true;
      else if (regla === "fecha") r[k] = esFecha(v) ? v : "";
      else if (regla === "revisadas") { r[k] = {}; if (v && typeof v === "object" && !Array.isArray(v)) Object.keys(v).slice(0, 300).forEach(id => { if (idValido(id) && REVISION[v[id]]) r[k][id] = v[id]; }); }
      else if (Array.isArray(regla)) { if (v !== undefined) r[k] = txt(v, regla[0]); }
      else if (regla.en && regla.lista) r[k] = Array.isArray(v) ? [...new Set(v.filter(x => regla.en.includes(x)))] : [];
      else if (regla.en) r[k] = regla.en.includes(v) ? v : r[k];
      else if (regla.textos) r[k] = Array.isArray(v) ? v.slice(0, regla.max).map(x => txt(x, 300)) : r[k];
      else if (regla.obj) r[k] = sanear(regla.obj, v, genId) || r[k];
      else if (regla.de) r[k] = Array.isArray(v) ? v.slice(0, regla.max).map(x => sanear(regla.de, x, genId)).filter(Boolean) : [];
    });
    return r;
  }
  // Ids únicos dentro de una lista (al pegar o fusionar podría haber repetidos)
  const unicos = (l, genId) => { const vistos = new Set(); l.forEach(x => { if (vistos.has(x.id)) x.id = genId(); vistos.add(x.id); }); };
  function sanearUnidad(o, genId, fecha) {
    const u = sanear("unidad", o, genId); if (!u) return null;
    if (!u.creado) u.creado = fecha; if (!u.modificado) u.modificado = u.creado;
    [u.equipo, u.items, u.rondas, u.acciones].forEach(l => unicos(l, genId));
    const rondas = new Set(u.rondas.map(r => r.id)), acciones = new Set(u.acciones.map(a => a.id));
    u.rondas.forEach(r => { unicos(r.items, genId); unicos(r.hallazgos, genId); unicos(r.conversacion, genId); Object.keys(r.revisadas).forEach(id => { if (!acciones.has(id)) delete r.revisadas[id]; }); });
    u.acciones.forEach(a => { if (!rondas.has(a.rondaId)) a.rondaId = ""; if (!rondas.has(a.comprobada)) a.comprobada = ""; });
    return u;
  }
  function sanearDatos(o, genId, fecha) {
    if (!o || typeof o !== "object" || !Array.isArray(o.unidades)) return null;
    if (o.app && o.app !== "rondas") return null;
    const unidades = o.unidades.slice(0, 100).map(x => sanearUnidad(x, genId, fecha)).filter(Boolean);
    unicos(unidades, genId);
    return { unidades };
  }
  // Añadir: junta por id; si una unidad está en las dos, gana la modificada más tarde
  function fusionar(a, b) {
    const r = a.unidades.slice();
    b.unidades.forEach(x => { const i = r.findIndex(y => y.id === x.id); if (i < 0) r.push(x); else if (String(x.modificado) > String(r[i].modificado)) r[i] = x; });
    return { unidades: r };
  }
  // Ids nuevos para «Copiar a mis datos» y «Duplicar», conservando los vínculos internos
  function renovarIds(u, genId) {
    const mr = {}, ma = {};
    u.id = genId();
    u.equipo.forEach(m => { m.id = genId(); });
    u.rondas.forEach(r => { mr[r.id] = genId(); r.id = mr[r.id]; });
    u.acciones.forEach(a => { ma[a.id] = genId(); a.id = ma[a.id]; a.rondaId = mr[a.rondaId] || ""; a.comprobada = mr[a.comprobada] || ""; });
    u.acciones.forEach(a => { if (/^accion:/.test(a.origen)) { const v = a.origen.slice(7); a.origen = ma[v] ? "accion:" + ma[v] : a.origen; } });
    u.rondas.forEach(r => { const n = {}; Object.keys(r.revisadas).forEach(k => { if (ma[k]) n[ma[k]] = r.revisadas[k]; }); r.revisadas = n; });
    return u;
  }

  const API = {
    VERSION_DATOS,
    // [eco]
    URL_AUD, URL_IND, URL_TM, URL_AMFE, URL_FLUJO, URL_MAPA, URL_DAFO, URL_LC, URL_ACR,
    // [/eco]
    lleno, sinTildes, normal, corto, plural, esFecha, fmtF, pct, sumaDias, sumaMeses, diasEntre,
    AMBITOS, BLOQUES, ORDEN_BLOQUES, DONDE, FRECUENCIAS, TURNOS, ROTACION, OBJETIVOS, PERFILES, ESTADOS_ACCION, ABIERTA, REVISION, PREGUNTAS_ABIERTAS,
    BANCO, buscaBanco, bancoPara,
    nuevaUnidad, nuevoMiembro, nuevoItem, itemDeBanco, nuevaRonda, nuevaRespuesta, nuevoHallazgo, nuevaAccion,
    nombreUnidad, nombreBloque, nombreTurno, nombreRonda, ordenItems, porBloques, rondasOrden,
    respondidas, estadoRonda, ESTADOS_RONDA, sincronizar, resultado, valorDeCuenta, nivelPct,
    accionesDeRonda, accionDeItem, vencida, pendientesDe, sustituida, sigueAbierta, revisar, fuerzaMedida, FUERZAS,
    revisarItem, datoPersonal, parecido,
    avisosPrograma, avisosCuestionario, avisosCalendario, avisosRonda, avisosAcciones, avisosSeguimiento, avisosDe,
    rondasHechas, evolucion, matrizCalor, puntosCalientes, textoCaliente, porTurno, fallosPorTurno, resumenAcciones, resumen,
    siguienteRonda, proponerCalendario, bienPropuesto, resumenPropuesto, conclusionesPropuestas,
    PASOS, PASOS_RONDA, progreso, progresoRonda, siguientePaso,
    leerFallos, itemDeFallo,
    documentoHoja, documentoInforme, documentoSeguimiento, ESTILOS_XLSX, hojasExcel,
    FORMATO_INTERCAMBIO, VERSION_INTERCAMBIO, paqueteIntercambio, leerIntercambio,
    ESQ, sanear, sanearUnidad, sanearDatos, fusionar, renovarIds
  };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  else raiz.Logica = API;
})(typeof window !== "undefined" ? window : this);

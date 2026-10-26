// ============================================================
//  app.js — UI y estado · Rondas de Seguridad
//  Las reglas viven en logic.js (funciones puras) y los textos didácticos y
//  ejemplos en contenido.js. Aquí: datos en localStorage, enrutado por hash,
//  inicio, unidades con su programa en 5 pasos, cada ronda en 5 pasos,
//  ejemplos, Aprende, Ponte a prueba, glosario, documentos (Word, PDF, Excel),
//  PDF en iOS y copias de seguridad.
//  Base copiada de DAFO, AMFE y Auditorías (mismos patrones: data-k, refrescar
//  sin perder el foco, repintar conservando el scroll, borradores, ejemplos en memoria).
// ============================================================
(function () {
  "use strict";
  const L = window.Logica, C = window.Contenido;

  // ---------- Versión y novedades ----------
  // Al publicar cambios: añadir una entrada AL PRINCIPIO de NOVEDADES, poner su versión en los ?v= de index.html, en
  // APP_VERSION y subir CACHE_NAME en sw.js. Formato de versión: AAAA.NN.
  const APP_VERSION = "2026.03";
  const NOVEDADES = [
    // [eco]
    { version: "2026.03", fecha: "Octubre 2026", titulo: "Nueva app hermana: Lectura Crítica", cambios: [
      "Enlace a la nueva app hermana Lectura Crítica en la portada y en «Acerca de»: lee críticamente un artículo paso a paso (plantillas de CASPe con preguntas propias, calculadoras y un veredicto con semáforo) antes de cambiar la práctica."] },
    { version: "2026.02", fecha: "Octubre 2026", titulo: "La copia sin conexión de las otras apps ya no se borra", cambios: [
      "Arreglado un fallo: al actualizarse esta app se borraba la copia sin conexión de las demás apps del ecosistema (y al revés). Ahora cada app solo limpia la suya, así que todas siguen funcionando sin conexión."] },
    // [/eco]
    { version: "2026.01", fecha: "Octubre 2026", titulo: "Primera versión", cambios: [
      "Programa de rondas de tu unidad en cinco pasos: programa, cuestionario, rondas, acciones y seguimiento, con «Tu siguiente paso» en la portada.",
      "Banco de 73 preguntas propias por bloques y tipos de unidad, preguntas propias, preguntas abiertas para el equipo y «Traer de AMFE o de Mapa de Riesgos».",
      "Cada ronda en cinco pasos, pensada para la tableta: preparar, comprobar lo pendiente, mirar (sí, no o no aplica, con notas y recuentos), escuchar y acordar.",
      "Acciones con responsable, plazo, fuerza de la medida y si se elevan a la dirección, comprobadas en la ronda siguiente.",
      "Seguimiento: evolución del cumplimiento, puntos calientes (lo que falla una y otra vez, o en todas las rondas de un turno) y resultados por turno.",
      "Hoja de la ronda, informe de la ronda e informe de seguimiento en Word y PDF; Excel con rondas, respuestas y acciones.",
      "Ejemplos de Urgencias y de una UGC de Atención Primaria, minicasos, Aprende (5 temas), Ponte a prueba y glosario."] }
  ];

  // ---------- Utilidades ----------
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const escMl = s => esc(s).replace(/\n/g, "<br>");
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const view = $("#view");
  const hoy = () => new Date().toISOString();
  const hoyIso = () => { const d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10); };
  const fechaCorta = iso => { const d = new Date(iso); return isNaN(d) ? "" : d.toLocaleDateString("es-ES"); };
  const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const lleno = L.lleno, plural = L.plural, fmtF = L.fmtF, corto = L.corto;
  const clon = o => JSON.parse(JSON.stringify(o));
  const leer = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const escribir = (k, v) => { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } };

  // ---------- Datos (solo en este dispositivo) ----------
  const KEY_DATOS = "rondas-datos", KEY_INTERCAMBIO = "rondas-intercambio";
  let datos = { unidades: [], ultimaCopia: null };
  (function cargar() {
    const crudo = leer(KEY_DATOS); if (!crudo) return;
    try {
      const o = JSON.parse(crudo), s = L.sanearDatos(o, genId, hoy());
      if (s) datos = { unidades: s.unidades, ultimaCopia: typeof o.ultimaCopia === "string" ? o.ultimaCopia : null };
    } catch (e) { /* datos dañados: se empieza de cero sin borrar lo guardado */ }
  })();
  // Los ejemplos viven aparte, en memoria (ids «ej-…»): se pueden tocar, pero ni se guardan ni se mezclan.
  const datosUsuario = datos;
  let datosEjemplo = null, modoEjemplo = false;
  const esIdEjemplo = id => /^ej-/.test(id || "");
  function ejemplos() {
    if (!datosEjemplo) datosEjemplo = { unidades: C.EJEMPLOS.unidades.map(u => L.sanearUnidad(clon(u), genId, hoy())), ultimaCopia: null };
    return datosEjemplo;
  }
  let tGuardar = null, avisoSinEspacio = false;
  function guardar(inmediato) {
    clearTimeout(tGuardar);
    const fn = () => {
      const ok = escribir(KEY_DATOS, JSON.stringify({ app: "rondas", v: L.VERSION_DATOS, ultimaCopia: datosUsuario.ultimaCopia, unidades: datosUsuario.unidades }));
      // Paquete con forma fija para las otras apps (nunca lleva los ejemplos)
      if (ok) { try { escribir(KEY_INTERCAMBIO, JSON.stringify(L.paqueteIntercambio(datosUsuario.unidades, APP_VERSION, hoy()))); } catch (e) { /* */ } }
      if (!ok && !avisoSinEspacio) { avisoSinEspacio = true; toast("No se ha podido guardar en este navegador (¿modo privado o sin espacio?). Haz una copia de seguridad.", 6000); }
    };
    if (inmediato) fn(); else tGuardar = setTimeout(fn, 250);
  }
  window.addEventListener("pagehide", () => guardar(true));
  const buscaUnidad = id => datos.unidades.find(x => x.id === id);
  // Una unidad recién creada no se guarda hasta que se escribe algo
  const borradores = new Map();
  const esVacia = u => !u.items.length && !u.rondas.length && !u.acciones.length && !u.equipo.length && !u.objetivos.length && !["unidad", "ambito", "objetivo", "frecuencia", "circuito", "responsable"].some(k => lleno(u[k]));

  // ---------- Textos de ayuda reutilizables ----------
  const box = (tipo, tag, html) => `<div class="box box--${tipo}"><span class="box-tag">${tag}</span>${html}</div>`;
  const idea = html => box("idea", "Idea clave", `<p>${html}</p>`);
  const trampa = html => box("trampa", "Ojo, trampa", `<p>${html}</p>`);
  const practica = html => box("practica", "En la práctica", `<p>${html}</p>`);
  const KEY_FACIL = "rondas-facil-abierto";
  const facil = (html, titulo = "Explicado fácil") => `<details class="facil" data-recordar="1"${leer(KEY_FACIL) === "1" ? " open" : ""}><summary>${titulo}</summary><div class="facil-body">${html}</div></details>`;
  const avisoHtml = a => a.nivel === "nota" ? `<div class="note">ℹ ${esc(a.texto)}</div>` : a.nivel === "error" ? `<div class="aviso-error">✕ ${esc(a.texto)}</div>` : `<div class="warn">⚠ ${esc(a.texto)}</div>`;

  // ---------- Zonas que se refrescan sin repintar los campos (así no se pierde el foco) ----------
  let zonas = {};
  const zona = (nombre, fn, tag = "div", clase = "") => { zonas[nombre] = fn; return `<${tag} data-zona="${nombre}"${clase ? ` class="${clase}"` : ""}>${fn()}</${tag}>`; };
  function refrescar() { Object.keys(zonas).forEach(k => { const el = $(`[data-zona="${k}"]`, view); if (el) el.innerHTML = zonas[k](); }); }

  // ---------- Campos ----------
  // Por defecto se enlazan con data-k (ruta dentro de la unidad). Con o.bind, de otra forma (ronda: data-rk;
  // miembros: data-m; preguntas: data-it; respuestas: data-ri; conversación: data-cv; hallazgos: data-h; acciones: data-ac).
  function getPath(o, path) { return path.split(".").reduce((a, k) => (a == null ? undefined : a[k]), o); }
  function setPath(o, path, v) {
    const ks = path.split("."), ult = ks.pop();
    let a = o; ks.forEach(k => { if (a[k] == null || typeof a[k] !== "object") a[k] = {}; a = a[k]; });
    a[ult] = v;
  }
  let nAyuda = 0;
  function ayudaBtn(help) {
    if (!help) return { btn: "", box: "" };
    const id = "h" + (++nAyuda);
    return { btn: `<button type="button" class="info-btn" data-info="${id}" aria-expanded="false" aria-label="Ayuda">i</button>`, box: `<p class="help" id="help-${id}" hidden>${help}</p>` };
  }
  function campo(obj, path, label, o = {}) {
    const v = getPath(obj, path) || "", a = ayudaBtn(o.help);
    const bind = o.bind || `data-k="${path}"`;
    const ctrl = o.area
      ? `<textarea class="txt-in" ${bind} rows="${o.rows || 2}" placeholder="${esc(o.ph || "")}"${o.aria ? ` aria-label="${esc(o.aria)}"` : ""}>${esc(v)}</textarea>`
      : `<div class="input-wrap"><input class="txt-in" ${bind} value="${esc(v)}" placeholder="${esc(o.ph || "")}"${o.tipo ? ` type="${o.tipo}"` : ""}${o.aria ? ` aria-label="${esc(o.aria)}"` : ""} autocomplete="off" /></div>`;
    return `<div class="field${o.destacado ? " field--destacado" : ""}">${label ? `<div class="field-head"><label class="field-label">${label}</label>${o.opt ? '<span class="field-opt">(opcional)</span>' : ""}${a.btn}</div>` : ""}${a.box}${o.sub ? `<p class="field-sub">${o.sub}</p>` : ""}${ctrl}${o.extra || ""}</div>`;
  }
  function selector(label, bind, valor, opciones, o = {}) {
    const a = ayudaBtn(o.help);
    return `<div class="field">${label ? `<div class="field-head"><label class="field-label">${label}</label>${o.opt ? '<span class="field-opt">(opcional)</span>' : ""}${a.btn}</div>` : ""}${a.box}<div class="input-wrap"><select class="txt-in" ${bind}${o.aria ? ` aria-label="${esc(o.aria)}"` : ""}>${opciones.map(([v, t]) => `<option value="${esc(v)}"${v === valor ? " selected" : ""}>${esc(t)}</option>`).join("")}</select></div>${o.extra || ""}</div>`;
  }
  const proponer = (act, txt = "✎ Proponer") => `<div class="quick no-print"><button type="button" class="chip chip--accent" data-act="${act}">${txt}</button></div>`;
  const opcBloques = [["", "Bloque…"], ...L.ORDEN_BLOQUES.map(k => [k, L.BLOQUES[k].nom])];
  const opcDonde = [["", "Dónde se mira…"], ...Object.keys(L.DONDE).map(k => [k, L.DONDE[k].nom])];

  // ---------- Informe (cabecera y pie, solo al imprimir) ----------
  function informePie() {
    return `<footer class="print-foot print-only">
      <span class="autor-titulo">Aplicación desarrollada por</span>
      <span class="autor"><b>Carlos J. Galán Doval</b> · Médico de Familia · Técnico en Calidad y Seguridad del Paciente</span>
      <span class="autor"><b>Rafael J. Romero de Castilla Gil</b> · Médico de Familia · Responsable del Área de Calidad y Seguridad del Paciente</span>
      <span class="autor-area">Área de Gestión Sanitaria Sur de Córdoba · Andalucía</span>
      <span class="autor-uso">De libre uso con fines docentes y divulgativos. No sustituye el criterio profesional.</span>
      <span class="footer-version">Rondas de Seguridad · versión ${APP_VERSION}</span>
    </footer>`;
  }

  // ---------- Pequeñas piezas comunes ----------
  const volver = (href, txt) => `<a class="volver-cuadro" href="${href}">← ${txt}</a>`;
  const pctBadge = p => `<span class="pct-b pct-b--${L.nivelPct(p)}">${p == null ? "—" : p + " %"}</span>`;
  const estadoBadge = e => `<span class="est-b est-b--${L.ESTADOS_ACCION[e] ? L.ESTADOS_ACCION[e].c : "gris"}">${esc(L.ESTADOS_ACCION[e] ? L.ESTADOS_ACCION[e].nom : e)}</span>`;
  const turnoBadge = t => L.TURNOS[t] ? `<span class="turno-b turno-b--${t}">${L.TURNOS[t].nom}</span>` : "";
  const nomUnidad = u => lleno(L.nombreUnidad(u)) ? L.nombreUnidad(u) : "Unidad sin nombre";

  // ---------- Inicio ----------
  function renderHome() {
    const d = datosUsuario, h = hoyIso(), sig = L.siguientePaso(d, h), n = d.unidades.length;
    const hechas = d.unidades.reduce((s, u) => s + L.rondasHechas(u).length, 0), abiertas = d.unidades.reduce((s, u) => s + L.resumenAcciones(u, h).abiertas, 0);
    const diasCopia = d.ultimaCopia ? Math.floor((Date.now() - new Date(d.ultimaCopia)) / 864e5) : null;
    const avisoCopia = n && (diasCopia === null || diasCopia > 30)
      ? `<div class="warn">⚠ ${diasCopia === null ? "Aún no has hecho ninguna copia de seguridad." : `Tu última copia de seguridad es de hace ${diasCopia} días.`} Tus datos solo están en este dispositivo: guarda una copia.</div>` : "";
    const ult = d.unidades.slice().sort((x, y) => String(y.modificado).localeCompare(String(x.modificado)))[0];
    const proximas = d.unidades.map(u => ({ u, r: L.rondasOrden(u).find(r => !r.cerrada) })).filter(x => x.r);
    view.innerHTML = `
      <section class="hero">
        <h1 class="hero-t"><span>Rondas de Seguridad</span></h1>
        <p class="hero-p">Monta las <b>rondas de seguridad de tu unidad</b> y síguelas: elige las preguntas de un banco, haz la ronda a pie de cama, <b>acuerda acciones</b> con responsable y fecha, y comprueba en la siguiente ronda que se han cumplido.</p>
        <div class="hero-btns">
          <a class="btn btn--primary btn--grande" href="#/unidad/nueva">+ Nuevo programa de rondas</a>
          <a class="btn btn--grande" href="#/unidades">Mis unidades${n ? ` <span class="contador">${n}</span>` : ""}</a>
        </div>
      </section>
      <div class="siguiente">
        <span class="siguiente-tag">Tu siguiente paso</span>
        <p>${esc(sig.texto)}</p>
        <a class="btn btn--primary" href="${sig.href}">${esc(sig.btn)} →</a>
      </div>
      ${proximas.length ? `<h2 class="sec-t">Próximas rondas</h2><div class="cuadro-lista">${proximas.map(({ u, r }) => `<a class="item-card prox-card" href="#/unidad/${u.id}/ronda/${r.id}/${L.estadoRonda(r) === "curso" ? 3 : 1}"><span class="item-main"><b class="item-t">${esc(L.nombreRonda(r))}</b><span class="item-s">${esc(nomUnidad(u))}</span><span class="badges">${turnoBadge(r.turno)}<span class="badge">${L.ESTADOS_RONDA[L.estadoRonda(r)]}</span>${L.pendientesDe(u, r).length ? `<span class="badge">${plural(L.pendientesDe(u, r).length, "acción por comprobar", "acciones por comprobar")}</span>` : ""}${esFechaPasada(r.fecha) ? `<span class="badge badge--rojo-t">Ya debería estar hecha</span>` : ""}</span></span></a>`).join("")}</div>` : ""}
      <h2 class="sec-t">El camino, en 5 pasos</h2>
      <p class="page-lead">Del programa de la unidad al seguimiento de las acciones. Cada paso tiene su explicación y sus avisos.</p>
      <ol class="fases">
        ${L.PASOS.map(p => `<li><a class="fase fase--acc" href="${ult ? `#/unidad/${ult.id}/${p.n}` : "#/unidad/nueva"}">
          <span class="fase-cab"><span class="pdca-num">${p.n}</span><b>${p.titulo}</b></span>
          <span class="fase-que">${p.que}</span>
        </a></li>`).join("")}
      </ol>
      <h2 class="sec-t">Tus datos</h2>
      <div class="card datos-card">
        <div class="datos-cifras">
          <a href="#/unidades"><b>${n}</b><span>${n === 1 ? "unidad" : "unidades"}</span></a>
          <a href="#/unidades"><b>${hechas}</b><span>${hechas === 1 ? "ronda hecha" : "rondas hechas"}</span></a>
          <a href="#/unidades"><b>${abiertas}</b><span>${abiertas === 1 ? "acción abierta" : "acciones abiertas"}</span></a>
        </div>
        ${avisoCopia}
        <p class="field-sub">Se guardan <b>solo en este dispositivo</b>. Para trabajar en equipo (por ejemplo, la tableta de la ronda y el ordenador del despacho), pasa tu copia: al importarla se junta con lo que haya sin duplicar.${d.ultimaCopia ? ` Última copia: ${fechaCorta(d.ultimaCopia)}.` : ""}</p>
        <div class="toolbar"><button class="btn" data-act="copia">⬇ Copia de seguridad</button><button class="btn" data-act="importar">⬆ Importar copia</button></div>
      </div>
      <div class="guide">
        <a class="guide-card" href="#/ejemplos"><span class="guide-num">Ej</span><div><div class="guide-q">Ejemplos</div><div class="guide-a">Las rondas mensuales de <b>Urgencias</b> (nueve rondas, de mañana, tarde y noche), las de una <b>UGC de Atención Primaria</b> y cuatro minicasos.</div></div><span class="guide-go">›</span></a>
        <a class="guide-card" href="#/aprende"><span class="guide-num">?</span><div><div class="guide-q">Aprende</div><div class="guide-a">${C.TEMAS.length} temas <b>explicados fácil</b>: qué es una ronda, el programa, el cuestionario, hacerla y el seguimiento.</div></div><span class="guide-go">›</span></a>
        <a class="guide-card" href="#/prueba"><span class="guide-num">✎</span><div><div class="guide-q">Ponte a prueba</div><div class="guide-a">${C.TEST.length} preguntas y <b>dos ejercicios</b>: ¿sirve este ítem? y ¿se resuelve en el momento?</div></div><span class="guide-go">›</span></a>
        <a class="guide-card" href="#/glosario"><span class="guide-num">A–Z</span><div><div class="guide-q">Glosario</div><div class="guide-a">${C.GLOSARIO.length} términos <b>en lenguaje llano</b>, con buscador.</div></div><span class="guide-go">›</span></a>
        <!-- [eco] -->
        <a class="guide-card guide-card--hermana" href="${L.URL_AUD}" target="_blank" rel="noopener"><span class="guide-num">✓</span><div><div class="guide-q">Auditorías ↗</div><div class="guide-a">App hermana: si un punto caliente se repite, <b>mídelo con una auditoría</b> y llévalo a tu Plan Anual.</div></div><span class="guide-go">›</span></a>
        <a class="guide-card guide-card--hermana" href="${L.URL_MAPA}" target="_blank" rel="noopener"><span class="guide-num">◆</span><div><div class="guide-q">Mapa de Riesgos ↗</div><div class="guide-a">App hermana: los fallos de tu <b>mapa de riesgos</b> son la mejor guía para elegir las preguntas («Traer de Mapa de Riesgos»).</div></div><span class="guide-go">›</span></a>
        <a class="guide-card guide-card--hermana" href="${L.URL_AMFE}" target="_blank" rel="noopener"><span class="guide-num">!</span><div><div class="guide-q">AMFE ↗</div><div class="guide-a">App hermana: <b>qué puede fallar</b> en un proceso; sus fallos prioritarios se traen como preguntas.</div></div><span class="guide-go">›</span></a>
        <a class="guide-card guide-card--hermana" href="${L.URL_IND}" target="_blank" rel="noopener"><span class="guide-num">%</span><div><div class="guide-q">Indicadores ↗</div><div class="guide-a">App hermana: <b>diseña el indicador</b> con el que medirás una acción.</div></div><span class="guide-go">›</span></a>
        <a class="guide-card guide-card--hermana" href="${L.URL_DAFO}" target="_blank" rel="noopener"><span class="guide-num">▦</span><div><div class="guide-q">DAFO · CAME ↗</div><div class="guide-a">App hermana: lo que aprendes en las rondas es un <b>dato para el DAFO</b> de tu unidad.</div></div><span class="guide-go">›</span></a>
        <a class="guide-card guide-card--hermana" href="${L.URL_FLUJO}" target="_blank" rel="noopener"><span class="guide-num">→</span><div><div class="guide-q">Flujograma ↗</div><div class="guide-a">App hermana: <b>dibuja el proceso</b> con sus puntos críticos.</div></div><span class="guide-go">›</span></a>
        <a class="guide-card guide-card--hermana" href="${L.URL_TM}" target="_blank" rel="noopener"><span class="guide-num">n</span><div><div class="guide-q">Tamaño Muestral ↗</div><div class="guide-a">App hermana: <b>cuántos casos revisar</b> si un hallazgo pasa a una auditoría.</div></div><span class="guide-go">›</span></a>
        <a class="guide-card guide-card--hermana" href="${L.URL_LC}" target="_blank" rel="noopener"><span class="guide-num">LC</span><div><div class="guide-q">Lectura Crítica ↗</div><div class="guide-a">App hermana: <b>lee críticamente un artículo</b> para comprobar la evidencia de una práctica segura antes de llevarla al cuestionario.</div></div><span class="guide-go">›</span></a>
        <!-- [/eco] -->
      </div>
      ${practica("<b>Protección de datos:</b> la ronda mira el sistema, no a las personas. No escribas nombres de pacientes ni de profesionales, ni números de historia clínica: describe al equipo por su cargo.")}`;
  }
  const esFechaPasada = f => L.esFecha(f) && f < hoyIso();

  // ---------- Lista de unidades ----------
  function renderLista() {
    const lista = datos.unidades.slice().sort((a, b) => String(b.modificado).localeCompare(String(a.modificado)));
    view.innerHTML = `
      <h1 class="page-title">Mis unidades</h1>
      <p class="page-lead">Cada unidad tiene su programa de rondas: su cuestionario, sus rondas, sus acciones y su seguimiento.</p>
      ${facil(`<p>Una <b>ronda de seguridad</b> es una visita programada a la unidad para comprobar, donde y cuando se atiende a los pacientes, si se aplican las prácticas seguras, y para <b>escuchar</b> qué riesgos ve el equipo.</p><p>Lo que se encuentra se convierte en <b>acciones</b> con responsable y fecha, y la ronda siguiente empieza comprobándolas.</p>`)}
      <div class="toolbar no-print"><a class="btn btn--primary" href="#/unidad/nueva">+ Nuevo programa de rondas</a><a class="btn" href="#/unidad/ej-urg/3">Ver el ejemplo de Urgencias</a></div>
      ${lista.length ? `<div class="cuadro-lista">${lista.map(tarjeta).join("")}</div>`
        : `<div class="placeholder-box"><p><b>Todavía no tienes ninguna unidad.</b></p><p>Crea el programa de rondas de la tuya, o abre antes el ejemplo de Urgencias para ver cómo queda.</p></div>`}`;
  }
  function tarjeta(u) {
    const h = hoyIso(), r = L.resumen(u, h), g = L.progreso(u), hechos = L.PASOS.filter(p => g[p.n]).length;
    return `<div class="item-card">
      <a class="item-main" href="#/unidad/${u.id}">
        <b class="item-t">${lleno(L.nombreUnidad(u)) ? esc(L.nombreUnidad(u)) : '<span class="vacio">Unidad sin nombre</span>'}</b>
        <span class="item-s">${esc([L.AMBITOS[u.ambito] ? L.AMBITOS[u.ambito].nom : "", L.FRECUENCIAS[u.frecuencia] ? L.FRECUENCIAS[u.frecuencia].nom : ""].filter(lleno).join(" · ")) || "&nbsp;"}</span>
        <span class="badges"><span class="badge">${plural(r.items, "pregunta", "preguntas")}</span><span class="badge">Rondas ${r.hechas}/${r.rondas}</span>${r.ultimaPct != null ? `<span class="badge">Última ${pctBadge(r.ultimaPct)}</span>` : ""}${r.acciones.abiertas ? `<span class="badge">${plural(r.acciones.abiertas, "acción abierta", "acciones abiertas")}</span>` : ""}${r.acciones.vencidas ? `<span class="badge badge--rojo-t">${plural(r.acciones.vencidas, "vencida", "vencidas")}</span>` : ""}<span class="badge badge--prog">Pasos ${hechos}/5</span></span>
      </a>
      <div class="item-pie"><span>Modificada: ${fechaCorta(u.modificado)}</span><span><button class="link-btn" data-act="u-dup" data-id="${u.id}">Duplicar</button> · <button class="link-btn link-btn--peligro" data-act="u-del" data-id="${u.id}">Borrar</button></span></div>
    </div>`;
  }

  // ---------- Ficha de una unidad: armazón común de los pasos ----------
  let actual = null, pasoActual = 1, rondaActual = null, pasoRonda = 1;
  const avisosGenerales = (u, n) => L.avisosDe(u, n, hoyIso()).filter(x => !x.item && !x.accion).map(avisoHtml).join("");
  const pasosHtml = (u, n) => `<ol class="wiz-steps wiz-steps--5 no-print" aria-label="Pasos del programa" data-zona="pasos">${pasosInner(u, n)}</ol>`;
  function pasosInner(u, actualN) {
    const g = L.progreso(u);
    return L.PASOS.map(p => `<li><a href="#/unidad/${u.id}/${p.n}" class="wiz-step${p.n === actualN ? " actual" : g[p.n] ? " hecho" : ""}"${p.n === actualN ? ' aria-current="step"' : ""} title="${esc(p.titulo)}"><span class="wiz-num">${g[p.n] && p.n !== actualN ? "✓" : p.n}</span><span class="wiz-lbl">${p.corto}</span></a></li>`).join("");
  }
  function renderUnidad(u, n) {
    actual = u; pasoActual = n; rondaActual = null; nAyuda = 0; zonas = {};
    if (document.body.classList.contains("ver-informe")) { renderDoc(u, null, docActual || "seguimiento"); return; }
    const p = L.PASOS[n - 1];
    zonas.pasos = () => pasosInner(u, n);
    view.innerHTML = `
      <div class="wiz-top no-print">${volver(modoEjemplo ? "#/ejemplos" : "#/unidades", modoEjemplo ? "Ejemplos" : "Mis unidades")}${pasosHtml(u, n)}</div>
      <div class="wiz-titulo"><span class="wiz-paso">Paso ${n} de 5${lleno(L.nombreUnidad(u)) ? " · " + esc(corto(L.nombreUnidad(u), 60)) : ""}</span><h1 class="page-title">${p.titulo}</h1></div>
      ${RENDER[n](u)}
      <div class="wiz-nav no-print">${n > 1 ? `<a class="btn" href="#/unidad/${u.id}/${n - 1}">← ${L.PASOS[n - 2].corto}</a>` : `<span></span>`}${n < 5 ? `<a class="btn btn--primary" href="#/unidad/${u.id}/${n + 1}">${L.PASOS[n].corto} →</a>` : `<span></span>`}</div>`;
  }

  // ---------- Paso 1 · La unidad y su programa ----------
  function miembroCard(m) {
    return `<div class="miembro" data-mi="${m.id}">
      ${selector("", `data-m="${m.id}" data-f="perfil"`, m.perfil, [["", "Perfil…"], ...Object.keys(L.PERFILES).map(k => [k, L.PERFILES[k].nom])], { aria: "Perfil" })}
      ${campo(m, "papel", "", { bind: `data-m="${m.id}" data-f="papel"`, ph: m.perfil && L.PERFILES[m.perfil] ? L.PERFILES[m.perfil].sug : "Cargo o papel, sin nombre", aria: "Cargo o papel" })}
      <button type="button" class="icon-btn icon-btn--sm" data-act="m-del" data-id="${m.id}" aria-label="Quitar">✕</button>
    </div>`;
  }
  function paso1(u) {
    const amb = L.AMBITOS[u.ambito];
    return `<p class="page-lead">${L.PASOS[0].que}</p>
      ${facil(`<p>Antes de la primera ronda se decide y se escribe: <b>qué unidad</b>, <b>para qué</b> hacéis rondas, <b>cada cuánto</b>, <b>quién</b> va y <b>qué pasa después</b> con lo que se encuentre.</p><p>Es como el responsable de un restaurante que entra en la cocina una vez a la semana en plena faena: no va a examinar a nadie, mira si las neveras están a la temperatura correcta y pregunta qué está dando problemas. Y la semana siguiente vuelve para comprobar que la nevera que fallaba ya está arreglada.</p>`)}
      <div class="card">
        ${campo(u, "unidad", "Unidad", { ph: "Por ejemplo: Urgencias, 3.ª planta de Medicina Interna, Centro de Salud…", help: "La unidad donde haréis las rondas. Si son varias, crea un programa para cada una: así cada unidad tiene su cuestionario y su seguimiento.", destacado: true })}
        <div class="field"><div class="field-head"><label class="field-label">Tipo de unidad</label></div><p class="field-sub">Con esto la app te propone las preguntas del banco que tienen sentido en tu unidad.</p>
          <div class="chips">${Object.keys(L.AMBITOS).map(k => `<button type="button" class="chip${u.ambito === k ? " active" : ""}" data-act="ambito" data-v="${k}">${L.AMBITOS[k].nom}</button>`).join("")}</div>
          ${amb ? `<p class="field-sub">${esc(amb.ej)}.</p>` : ""}</div>
        <div class="field"><div class="field-head"><label class="field-label">Para qué hacéis rondas</label></div><p class="field-sub">Puede ser más de una cosa.</p>
          <div class="chips">${Object.keys(L.OBJETIVOS).map(k => `<button type="button" class="chip${u.objetivos.includes(k) ? " active" : ""}" data-act="objetivo" data-v="${k}">${L.OBJETIVOS[k]}</button>`).join("")}</div></div>
        ${campo(u, "objetivo", "Objetivo con vuestras palabras", { area: true, opt: true, ph: "Por ejemplo: complementar las auditorías de historias mirando lo que no se registra, en los tres turnos." })}
        <div class="field"><div class="field-head"><label class="field-label">Frecuencia</label></div>
          <div class="seg seg--wrap" role="group" aria-label="Frecuencia">${Object.keys(L.FRECUENCIAS).map(k => `<button type="button" class="${u.frecuencia === k ? "active" : ""}" data-act="frecuencia" data-v="${k}">${L.FRECUENCIAS[k].nom}</button>`).join("")}</div>
          <p class="field-sub">Por ejemplo, una ronda al mes en cada unidad, o cada trimestre en las de menor riesgo.</p></div>
        ${campo(u, "responsable", "Quién coordina el programa", { ph: "Cargo, sin nombre: por ejemplo, responsable de seguridad del área", opt: true })}
      </div>
      <h2 class="sec-t">El equipo de la ronda</h2>
      <div class="card">
        <p class="field-sub">Dos o tres personas: alguien de la <b>dirección o los mandos</b>, alguien de <b>calidad y seguridad</b> y, a ser posible, un profesional de <b>otra unidad</b>. Siempre acompaña un profesional de la unidad. Descríbelos por su cargo o su papel.</p>
        <div class="miembros">${u.equipo.map(miembroCard).join("") || `<p class="placeholder-box">Aún no hay nadie. Añade los perfiles:</p>`}</div>
        <div class="chips no-print">${Object.keys(L.PERFILES).map(k => `<button type="button" class="chip chip--accent" data-act="m-add" data-v="${k}">+ ${L.PERFILES[k].nom}</button>`).join("")}</div>
      </div>
      <h2 class="sec-t">El circuito de respuesta</h2>
      <div class="card">
        ${campo(u, "circuito", "Qué pasa después de cada ronda", { area: true, rows: 3, ph: "Quién recibe el informe y en cuánto tiempo, quién decide las acciones, cuáles se elevan a la dirección y cómo se comprueban.", help: "Una ronda que no produce cambios enseña lo contrario de lo que pretendía. Escribidlo antes de empezar." })}
        ${proponer("prop-circuito")}
      </div>
      ${zona("avisos", () => avisosGenerales(u, 1))}
      ${box("dirige", "Si diriges", "<p>En las rondas en las que participan los directivos, el mensaje es tan importante como los datos: «nos importa lo que os preocupa y venimos a verlo». Quien acude tiene que escuchar sin juzgar, comprometerse solo con lo que pueda cumplir y volver con respuestas.</p>")}`;
  }

  // ---------- Paso 2 · El cuestionario ----------
  let bancoTodo = false, bancoQ = "", traerLista = null;
  const contadorHtml = u => { const n = u.items.filter(it => lleno(it.texto)).length, b = new Set(u.items.filter(it => lleno(it.texto) && lleno(it.bloque)).map(it => it.bloque)).size; return `<span class="cuenta-n cuenta-n--${n >= 10 && n <= 20 ? "ok" : n ? "aviso" : "cero"}"><b>${n}</b> ${n === 1 ? "pregunta" : "preguntas"}</span><span class="field-sub">${plural(b, "bloque", "bloques")} · lo recomendable: de 10 a 20</span>`; };
  function itemCard(u, it) {
    return `<div class="pregunta" data-pi="${it.id}">
      ${campo(it, "texto", "", { area: true, bind: `data-it="${it.id}" data-f="texto"`, ph: "Algo que se vea, con respuesta sí / no / no aplica", aria: "Pregunta" })}
      <div class="pregunta-meta">
        ${selector("", `data-it="${it.id}" data-f="bloque"`, it.bloque, opcBloques, { aria: "Bloque" })}
        ${selector("", `data-it="${it.id}" data-f="donde"`, it.donde, opcDonde, { aria: "Dónde se mira" })}
        ${campo(it, "amfe", "", { bind: `data-it="${it.id}" data-f="amfe"`, ph: "Fallo del AMFE (nº)", aria: "Fallo del AMFE relacionado" })}
        <button type="button" class="icon-btn icon-btn--sm" data-act="it-del" data-id="${it.id}" aria-label="Quitar la pregunta">✕</button>
      </div>
      ${zona("av-" + it.id, () => L.avisosCuestionario(u).filter(a => a.item === it.id).map(avisoHtml).join(""))}
    </div>`;
  }
  function bancoHtml(u) {
    const q = L.sinTildes(bancoQ), base = bancoTodo ? L.BANCO : L.bancoPara(u.ambito), ya = new Set(u.items.map(it => it.id));
    const lista = base.filter(b => !q || L.sinTildes(b.t + " " + L.BLOQUES[b.b].nom).includes(q));
    const grupos = L.ORDEN_BLOQUES.map(k => ({ k, l: lista.filter(b => b.b === k) })).filter(g => g.l.length);
    return `${grupos.map(g => `<details class="banco-b"${q ? " open" : ""}><summary><b>${L.BLOQUES[g.k].nom}</b> <span class="field-sub">${g.l.filter(b => ya.has(b.id)).length} de ${g.l.length} elegidas</span></summary>
      ${g.l.map(b => `<div class="banco-i${ya.has(b.id) ? " banco-i--ya" : ""}"><span class="banco-t">${esc(b.t)}<small>${L.DONDE[b.d].ico} ${L.DONDE[b.d].nom}</small></span>${ya.has(b.id) ? `<button type="button" class="btn btn--sm" data-act="banco-quitar" data-id="${b.id}">✓ Elegida</button>` : `<button type="button" class="btn btn--sm btn--primary" data-act="banco" data-id="${b.id}">Añadir</button>`}</div>`).join("")}
    </details>`).join("") || `<p class="placeholder-box">Ninguna pregunta del banco coincide con la búsqueda.</p>`}`;
  }
  function traerHtml(u) {
    if (traerLista.error) return `<div class="card pegar no-print"><h3 class="sub-h">Traer de AMFE o de Mapa de Riesgos</h3><div class="warn">⚠ ${esc(traerLista.error)}</div><div class="toolbar"><button class="btn" data-act="traer-copia">Cargar la copia (.json)</button><button class="btn" data-act="traer-cerrar">Cerrar</button></div></div>`;
    const ya = new Set(u.items.map(it => it.origen));
    return `<div class="card pegar no-print">
      <h3 class="sub-h">Traer de ${esc(traerLista.origen)}</h3>
      <p class="field-sub">Los fallos <b>prioritarios</b> llegan como borrador de pregunta, con su número de fallo. Después, redáctalos como algo que se vea en la unidad (la app te avisará).</p>
      ${traerLista.amfes.map(a => `<h4 class="banco-amfe">${esc(a.titulo)}${a.unidad ? ` <span class="field-sub">· ${esc(a.unidad)}</span>` : ""}</h4>
        ${a.fallos.length ? a.fallos.map(f => `<div class="banco-i"><span class="banco-t"><b>${f.num ? "Fallo " + esc(f.num) + " · " : ""}</b>${esc(f.fallo)}<small>${esc([f.subproceso, f.ipr != null ? "IPR " + f.ipr : ""].filter(lleno).join(" · "))}</small></span>${ya.has(`amfe:${a.id}:${f.id}`) ? `<span class="badge">✓ Traída</span>` : `<button type="button" class="btn btn--sm btn--primary" data-act="traer-add" data-a="${esc(a.id)}" data-f="${esc(f.id)}">Añadir</button>`}</div>`).join("") : `<p class="field-sub">Sin fallos prioritarios.</p>`}`).join("") || `<p class="placeholder-box">No hay ningún análisis.</p>`}
      <div class="toolbar"><button class="btn" data-act="traer-copia">Cargar otra copia (.json)</button><button class="btn" data-act="traer-cerrar">Cerrar</button></div>
    </div>`;
  }
  function paso2(u) {
    const grupos = L.porBloques(u.items), amb = L.AMBITOS[u.ambito];
    return `<p class="page-lead">${L.PASOS[1].que}</p>
      ${facil(`<p>Un buen cuestionario tiene <b>pocos ítems</b> (de diez a veinte, lo que se comprueba en una hora), agrupados por <b>bloques</b> y <b>observables</b>: se responden sí, no o no aplica sin interpretaciones, como un criterio de auditoría.</p><p>Mal: «La medicación está bien». Bien: «Los medicamentos de alto riesgo están separados y señalizados».</p><p>Elige las preguntas del <b>banco</b> según vuestros riesgos: los fallos de vuestro <b>mapa de riesgos</b> son la mejor guía. Y añade siempre <b>dos o tres preguntas abiertas</b> para el equipo.</p>`)}
      <div class="cuenta no-print">${zona("contador", () => contadorHtml(u))}</div>
      <h2 class="sec-t">Tus preguntas</h2>
      ${grupos.length ? grupos.map(g => `<div class="card bloque-card"><h3 class="sub-h">${esc(g.nom)}</h3>${g.items.map(it => itemCard(u, it)).join("")}</div>`).join("") : `<div class="placeholder-box"><p><b>Aún no hay preguntas.</b> Elígelas en el banco de abajo o escribe las tuyas.</p></div>`}
      <div class="toolbar no-print"><button class="btn" data-act="it-add">+ Pregunta propia</button><button class="btn" data-act="traer-abrir">Traer de AMFE o de Mapa de Riesgos</button>${u.items.length ? `<button class="btn" data-act="doc" data-doc="hoja">Hoja en papel (Word / PDF)</button>` : ""}</div>
      ${traerLista ? traerHtml(u) : ""}
      ${zona("avisos", () => avisosGenerales(u, 2))}
      <h2 class="sec-t">Preguntas abiertas para el equipo</h2>
      <div class="card">
        <p class="field-sub">Se hacen en un momento tranquilo, con quien esté, de todos los estamentos. Escuchad más de lo que habláis.</p>
        ${u.abiertas.map((p, i) => `<div class="abierta">${campo({ p }, "p", "", { bind: `data-ab="${i}"`, ph: "¿…?", aria: "Pregunta abierta " + (i + 1) })}<button type="button" class="icon-btn icon-btn--sm" data-act="ab-del" data-i="${i}" aria-label="Quitar">✕</button></div>`).join("")}
        <div class="chips no-print">${L.PREGUNTAS_ABIERTAS.filter(p => !u.abiertas.includes(p)).map(p => `<button type="button" class="chip chip--accent" data-act="ab-sug" data-v="${esc(p)}">+ ${esc(p)}</button>`).join("")}<button type="button" class="chip" data-act="ab-add">+ Otra</button></div>
      </div>
      <h2 class="sec-t">Banco de preguntas</h2>
      <div class="card banco">
        <p class="field-sub">${L.BANCO.length} preguntas propias, redactadas como criterios observables. ${amb && u.ambito !== "otro" ? `Ves las que tienen sentido en <b>${esc(amb.nom)}</b>.` : u.ambito === "otro" ? "Ves todo el banco." : "Elige el tipo de unidad en el paso 1 para ver solo las que tienen sentido en ella."} Son un punto de partida: cámbialas a vuestra medida.</p>
        <div class="banco-filtros no-print"><div class="input-wrap"><input id="banco-q" type="search" placeholder="Buscar en el banco…" value="${esc(bancoQ)}" autocomplete="off" /></div>${u.ambito && u.ambito !== "otro" ? `<label class="modal-check"><input type="checkbox" data-act="banco-todo"${bancoTodo ? " checked" : ""} /> <span>Ver todo el banco</span></label>` : ""}</div>
        ${zona("banco", () => bancoHtml(u))}
      </div>
      ${trampa("No copiéis el cuestionario de otro centro sin adaptarlo: cada unidad tiene sus riesgos, y un cuestionario de UCI no vale para un centro de salud. Si usáis el trabajo de otros, citadlo o pedid permiso.")}`;
  }

  // ---------- Paso 3 · Las rondas (calendario) ----------
  function rondaFila(u, r) {
    const e = L.estadoRonda(r), s = L.resultado(r), acc = L.accionesDeRonda(u, r).filter(a => lleno(a.que)).length, pend = L.pendientesDe(u, r).length;
    const ir = e === "hecha" ? 5 : e === "curso" ? 3 : 1;
    return `<div class="item-card ronda-card ronda-card--${e}">
      <a class="item-main" href="#/unidad/${u.id}/ronda/${r.id}/${ir}">
        <b class="item-t">${esc(L.nombreRonda(r))}${r.hora ? ` <span class="field-sub">${esc(r.hora)}</span>` : ""}</b>
        <span class="badges">${turnoBadge(r.turno)}<span class="badge badge--est-${e}">${L.ESTADOS_RONDA[e]}</span>${e === "hecha" ? pctBadge(s.pct) : e === "curso" ? `<span class="badge">${L.respondidas(r)} de ${r.items.length} respondidas</span>` : ""}${acc ? `<span class="badge">${plural(acc, "acción", "acciones")}</span>` : ""}${e !== "hecha" && pend ? `<span class="badge">${plural(pend, "por comprobar", "por comprobar")}</span>` : ""}${e === "planificada" && esFechaPasada(r.fecha) ? `<span class="badge badge--rojo-t">Ya debería estar hecha</span>` : ""}${e === "hecha" && !L.esFecha(r.informe.fecha) ? `<span class="badge badge--rojo-t">Informe sin enviar</span>` : ""}</span>
      </a>
      <div class="item-pie"><span>${e === "hecha" ? `Informe: ${L.esFecha(r.informe.fecha) ? "enviado el " + fmtF(r.informe.fecha) : "sin enviar"}` : e === "curso" ? "A medias" : "Por hacer"}</span><span><a class="link-btn" href="#/unidad/${u.id}/ronda/${r.id}/${ir}">${e === "hecha" ? "Ver" : e === "curso" ? "Seguir" : "Preparar"}</a> · <button class="link-btn link-btn--peligro" data-act="r-del" data-id="${r.id}">Borrar</button></span></div>
    </div>`;
  }
  function paso3(u) {
    const R = L.rondasOrden(u), sinItems = !u.items.some(it => lleno(it.texto));
    return `<p class="page-lead">${L.PASOS[2].que}</p>
      ${facil(`<p>Las fechas las conoce la unidad, y los <b>horarios varían</b>. En un servicio con ronda mensual: enero por la mañana, febrero por la tarde, marzo de madrugada, y vuelta a empezar. Así, en un trimestre cada turno ha tenido su ronda.</p><p>Cada ronda tiene cinco pasos: <b>prepararla</b>, <b>comprobar lo pendiente</b> de la anterior, <b>mirar</b>, <b>escuchar</b> y <b>acordar</b>.</p>`)}
      ${sinItems ? `<div class="warn">⚠ Aún no hay preguntas. <a href="#/unidad/${u.id}/2">Prepara antes el cuestionario</a>: cada ronda nueva lo toma tal como esté cuando empiece.</div>` : ""}
      <div class="toolbar no-print"><a class="btn btn--primary" href="#/unidad/${u.id}/ronda/nueva">+ Nueva ronda</a><button class="btn" data-act="calendario">Proponer el calendario de ${L.FRECUENCIAS[u.frecuencia] ? (L.FRECUENCIAS[u.frecuencia].meses >= 6 ? "un año" : "seis meses") : "seis meses"}</button></div>
      ${zona("avisos", () => avisosGenerales(u, 3))}
      ${R.length ? `<div class="turnos-linea" aria-label="Turnos de las rondas">${R.map(r => `<span class="turno-pt turno-pt--${r.turno || "x"}${r.cerrada ? " hecha" : ""}" title="${esc(L.nombreRonda(r))}">${L.TURNOS[r.turno] ? L.TURNOS[r.turno].corto : "?"}</span>`).join("")}</div><p class="field-sub">M mañana · T tarde · N noche · F fin de semana. En color, las hechas.</p>
        <div class="cuadro-lista">${R.map(r => rondaFila(u, r)).join("")}</div>`
        : `<div class="placeholder-box"><p><b>Aún no hay rondas.</b></p><p>Crea la primera o pide a la app el calendario de los próximos meses, con los turnos rotando.</p></div>`}`;
  }

  // ---------- Acciones (en el paso 4 y en el paso 5 de la ronda) ----------
  function accionCard(u, a, o = {}) {
    const r = u.rondas.find(x => x.id === a.rondaId), fz = L.fuerzaMedida(a.que), h = hoyIso();
    const origen = /^item:/.test(a.origen) && r ? (r.items.find(x => x.id === a.origen.slice(5)) || {}).texto : /^conv:/.test(a.origen) && r ? (r.conversacion.find(c => c.id === a.origen.slice(5)) || {}).respuesta : /^hallazgo:/.test(a.origen) && r ? (r.hallazgos.find(x => x.id === a.origen.slice(9)) || {}).texto : /^accion:/.test(a.origen) ? "Sustituye a una acción que no funcionó: " + ((u.acciones.find(x => x.id === a.origen.slice(7)) || {}).que || "") : "";
    const comp = a.comprobada && u.rondas.find(x => x.id === a.comprobada);
    return `<div class="accion-card accion-card--${L.ESTADOS_ACCION[a.estado].c}" data-aci="${a.id}">
      <div class="accion-cab">${o.conRonda && r ? `<a class="badge" href="#/unidad/${u.id}/ronda/${r.id}/5">Ronda ${esc(fmtF(r.fecha))}</a>` : ""}${zona("acb-" + a.id, () => `${estadoBadge(a.estado)}${L.vencida(a, h) ? `<span class="badge badge--rojo-t">Fuera de plazo</span>` : ""}${L.fuerzaMedida(a.que) ? `<span class="fz-b fz-b--${L.fuerzaMedida(a.que)}">${L.FUERZAS[L.fuerzaMedida(a.que)]}</span>` : ""}`, "span", "badges")}</div>
      ${lleno(origen) ? `<p class="field-sub accion-origen">Por: «${esc(corto(origen, 140))}»</p>` : ""}
      ${campo(a, "que", "Qué se va a hacer", { area: true, bind: `data-ac="${a.id}" data-f="que"`, ph: "Una acción concreta: mejor si cambia el sistema (campo obligatorio, alarma, retirar…) que si depende de recordar" })}
      <div class="accion-g">
        ${campo(a, "responsable", "Responsable", { bind: `data-ac="${a.id}" data-f="responsable"`, ph: "Cargo, sin nombre" })}
        ${campo(a, "plazo", "Plazo", { bind: `data-ac="${a.id}" data-f="plazo"`, tipo: "date" })}
        ${selector("Estado", `data-ac="${a.id}" data-f="estado"`, a.estado, Object.keys(L.ESTADOS_ACCION).map(k => [k, L.ESTADOS_ACCION[k].nom]))}
      </div>
      <div class="chips"><button type="button" class="chip${a.eleva ? " active" : ""}" data-act="ac-eleva" data-id="${a.id}">${a.eleva ? "✓ " : ""}Se eleva a la dirección</button></div>
      ${campo(a, "indicador", "Indicador", { bind: `data-ac="${a.id}" data-f="indicador"`, opt: true, ph: "Por ejemplo: % de mayores sin acompañante marcados en la pantalla" })}
      ${campo(a, "nota", "Nota de seguimiento", { area: true, bind: `data-ac="${a.id}" data-f="nota"`, opt: true, ph: "Cómo va, qué falta…" })}
      ${comp ? `<p class="field-sub">${a.estado === "comprobada" ? "✓ Comprobada" : "Revisada"} en la ronda del ${esc(fmtF(comp.fecha))}.</p>` : ""}
      ${zona("aca-" + a.id, () => [...L.avisosAcciones(u, h), ...(rondaActual ? L.avisosRonda(u, rondaActual, h) : [])].filter(x => x.accion === a.id).filter((x, i, l) => l.findIndex(y => y.texto === x.texto) === i).map(avisoHtml).join(""))}
      <div class="toolbar no-print"><button class="link-btn link-btn--peligro" data-act="ac-del" data-id="${a.id}">Borrar la acción</button></div>
    </div>`;
  }
  let filtroAcc = "abiertas";
  function paso4(u) {
    const h = hoyIso(), ra = L.resumenAcciones(u, h), l = u.acciones.filter(a => filtroAcc === "todas" || L.sigueAbierta(u, a) || !lleno(a.que))
      .sort((a, b) => (L.vencida(b, h) - L.vencida(a, h)) || String(a.plazo || "9999").localeCompare(String(b.plazo || "9999")));
    return `<p class="page-lead">${L.PASOS[3].que}</p>
      ${facil(`<p>Cada acción tiene <b>qué</b>, <b>quién</b> y <b>para cuándo</b>. Las que dependen de la dirección (obras, equipamiento, personal, informática) se <b>elevan</b> con fecha de respuesta.</p><p>«Hecha» no es lo mismo que «comprobada»: una acción se da por cerrada cuando la <b>ronda siguiente</b> comprueba que se ha hecho y que funciona. Si no ha funcionado, acuerda otra, mejor si es más fuerte.</p>`)}
      <div class="card datos-card"><div class="datos-cifras"><span><b>${ra.n}</b><span>acordadas</span></span><span><b>${ra.abiertas}</b><span>abiertas</span></span><span><b>${ra.comprobadas}</b><span>comprobadas</span></span><span><b>${ra.vencidas}</b><span>fuera de plazo</span></span></div></div>
      ${zona("avisos", () => avisosGenerales(u, 4))}
      <div class="seg seg--wrap no-print" role="group" aria-label="Qué acciones ver"><button type="button" class="${filtroAcc === "abiertas" ? "active" : ""}" data-act="filtro-acc" data-v="abiertas">Abiertas (${ra.abiertas})</button><button type="button" class="${filtroAcc === "todas" ? "active" : ""}" data-act="filtro-acc" data-v="todas">Todas (${ra.n})</button></div>
      ${l.length ? l.map(a => accionCard(u, a, { conRonda: true })).join("") : `<div class="placeholder-box"><p>${u.acciones.length ? "No hay acciones abiertas. ¡Bien!" : "Aún no hay acciones. Se acuerdan al final de cada ronda (paso «Acordar»)."}</p></div>`}
      ${L.rondasHechas(u).length || u.rondas.length ? `<div class="toolbar no-print"><button class="btn" data-act="ac-add-libre">+ Otra acción</button></div>` : ""}
      ${idea("La ronda siguiente empieza comprobando estas acciones: así el equipo ve que lo que contó sirvió para algo.")}`;
  }

  // ---------- Paso 5 · El seguimiento ----------
  function graficoEvolucion(ev) {
    if (!ev.length) return "";
    const W = 640, H = 200, M = { l: 34, r: 8, t: 14, b: 34 }, n = ev.length, bw = Math.min(46, (W - M.l - M.r) / n * 0.7), paso = (W - M.l - M.r) / n;
    const y = p => M.t + (H - M.t - M.b) * (1 - p / 100);
    return `<div class="chart-card"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Cumplimiento por ronda" class="evol-svg">
      ${[0, 50, 75, 90, 100].map(p => `<line x1="${M.l}" x2="${W - M.r}" y1="${y(p)}" y2="${y(p)}" class="ev-grid${p === 90 ? " ev-grid--meta" : ""}"/><text x="${M.l - 6}" y="${y(p) + 4}" class="ev-eje" text-anchor="end">${p}</text>`).join("")}
      ${ev.map((e, i) => { const x = M.l + paso * i + (paso - bw) / 2, p = e.pct == null ? 0 : e.pct; return `<rect x="${x.toFixed(1)}" y="${y(p).toFixed(1)}" width="${bw.toFixed(1)}" height="${(y(0) - y(p)).toFixed(1)}" rx="4" class="ev-bar ev-bar--${L.nivelPct(e.pct)}"><title>${esc(e.nombre)}: ${e.pct == null ? "sin datos" : e.pct + " %"}</title></rect><text x="${(x + bw / 2).toFixed(1)}" y="${(y(p) - 4).toFixed(1)}" class="ev-val" text-anchor="middle">${e.pct == null ? "" : e.pct}</text><text x="${(x + bw / 2).toFixed(1)}" y="${H - 18}" class="ev-eje" text-anchor="middle">${esc(fmtF(e.fecha).slice(0, 5))}</text><text x="${(x + bw / 2).toFixed(1)}" y="${H - 5}" class="ev-eje" text-anchor="middle">${L.TURNOS[e.turno] ? L.TURNOS[e.turno].corto : ""}</text>`; }).join("")}
    </svg><p class="field-sub">Cumplimiento (%) de cada ronda hecha, con su fecha y su turno. La línea marca el 90 %.</p></div>`;
  }
  function calorHtml(u) {
    const m = L.matrizCalor(u, 8); if (!m.rondas.length) return "";
    const pc = new Set(L.puntosCalientes(u).map(p => p.id));
    return `<div class="table-wrap"><table class="mini calor"><thead><tr><th>Ítem</th>${m.rondas.map(r => `<th class="c">${esc(fmtF(r.fecha).slice(0, 5))}<br><small>${L.TURNOS[r.turno] ? L.TURNOS[r.turno].corto : ""}</small></th>`).join("")}</tr></thead><tbody>
      ${m.filas.map(f => `<tr${pc.has(f.id) ? ' class="calor-pc"' : ""}><td>${pc.has(f.id) ? "🔥 " : ""}${esc(corto(f.texto, 90))}</td>${f.valores.map(v => `<td class="c calor-${v || "x"}">${v === "si" ? "✓" : v === "no" ? "✕" : v === "na" ? "–" : ""}</td>`).join("")}</tr>`).join("")}
    </tbody></table></div><p class="field-sub">✓ se cumple · ✕ no se cumple · – no aplica · 🔥 punto caliente. Las últimas ocho rondas hechas.</p>`;
  }
  function paso5(u) {
    const h = hoyIso(), ev = L.evolucion(u), pc = L.puntosCalientes(u), pt = L.porTurno(u), ra = L.resumenAcciones(u, h);
    const pcts = ev.map(e => e.pct).filter(x => x != null), media = pcts.length ? Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length) : null;
    return `<p class="page-lead">${L.PASOS[4].que}</p>
      ${facil(`<p>Cada cierto tiempo, mirad <b>todas las rondas juntas</b>: cómo evoluciona el cumplimiento, qué bloques fallan, si hay diferencias entre turnos y qué ítems fallan <b>una y otra vez</b> (los puntos calientes).</p><p>Lo que falla siempre no se arregla con otro recordatorio: llevadlo al <b>mapa de riesgos</b> de la unidad, al <b>plan de auditorías</b> y al <b>DAFO</b>, y buscad una medida que cambie el sistema.</p>`)}
      ${ev.length ? `
      <div class="card datos-card"><div class="datos-cifras"><span><b>${ev.length}</b><span>${ev.length === 1 ? "ronda hecha" : "rondas hechas"}</span></span><span><b>${media == null ? "—" : media + " %"}</b><span>cumplimiento medio</span></span><span><b>${pc.length}</b><span>${pc.length === 1 ? "punto caliente" : "puntos calientes"}</span></span><span><b>${ra.comprobadas}/${ra.n}</b><span>acciones comprobadas</span></span></div></div>
      ${zona("avisos", () => avisosGenerales(u, 5))}
      <h2 class="sec-t">Evolución</h2>${graficoEvolucion(ev)}
      ${pt.length > 1 ? `<h2 class="sec-t">Por turno</h2><div class="turnos-res">${pt.map(x => `<div class="turno-res"><span>${turnoBadge(x.turno)} <span class="field-sub">${plural(x.rondas, "ronda", "rondas")}</span></span><span class="barra"><span class="barra-fill barra-fill--${L.nivelPct(x.pct)}" style="width:${x.pct || 0}%"></span></span><b>${x.pct == null ? "—" : x.pct + " %"}</b></div>`).join("")}</div>` : ""}
      <h2 class="sec-t">Puntos calientes</h2>
      ${pc.length ? pc.map(p => `<div class="card pc-card"><p><b>🔥 ${esc(p.texto)}</b></p><p class="field-sub">${esc(L.nombreBloque(p.bloque))} · ${esc(L.textoCaliente(p))}.</p>
        <!--[eco]--><div class="toolbar no-print"><a class="btn btn--sm" href="${L.URL_MAPA}" target="_blank" rel="noopener">Llevar al Mapa de Riesgos ↗</a><a class="btn btn--sm" href="${L.URL_AUD}" target="_blank" rel="noopener">Proponer una auditoría ↗</a></div><!--[/eco]--></div>`).join("") : `<p class="placeholder-box">Ningún ítem falla en dos de las últimas tres rondas ni en todas las de un mismo turno.</p>`}
      <h2 class="sec-t">Ítem a ítem</h2>${calorHtml(u)}
      <h2 class="sec-t">Conclusiones</h2>
      <div class="card">${campo(u, "conclusiones", "", { area: true, rows: 4, ph: "Lo que dicen las rondas juntas y qué vais a hacer con ello", aria: "Conclusiones" })}${proponer("prop-concl")}</div>`
        : `<div class="placeholder-box"><p><b>Aún no hay rondas hechas.</b></p><p>Cuando terminéis la primera, aquí veréis la evolución, los resultados por turno y lo que falla una y otra vez.</p><div class="toolbar" style="justify-content:center"><a class="btn btn--primary" href="#/unidad/${u.id}/3">Ir a las rondas →</a></div></div>`}
      <h2 class="sec-t">Documentos</h2>
      <div class="toolbar no-print"><button class="btn btn--primary" data-act="doc" data-doc="seguimiento">Programa y seguimiento (Word / PDF)</button><button class="btn" data-act="excel">⬇ Excel</button><button class="btn" data-act="copia">⬇ Copia de seguridad</button></div>
      <p class="field-sub"><!--[eco]-->Los demás apps del ecosistema que usas en este navegador pueden leer el resumen de tus rondas (sin ejemplos), igual que esta lee tu AMFE o tu Mapa de Riesgos.<!--[/eco]--><!--[ind]La copia de seguridad (.json) lleva el resumen de tus rondas (sin ejemplos) en un formato que otras herramientas pueden importar.[/ind]--></p>`;
  }
  const RENDER = { 1: paso1, 2: paso2, 3: paso3, 4: paso4, 5: paso5 };

  // ---------- Una ronda: armazón de sus 5 pasos ----------
  const pasosRondaInner = (u, r, n) => { const g = L.progresoRonda(u, r); return L.PASOS_RONDA.map(p => `<li><a href="#/unidad/${u.id}/ronda/${r.id}/${p.n}" class="wiz-step${p.n === n ? " actual" : g[p.n] ? " hecho" : ""}"${p.n === n ? ' aria-current="step"' : ""} title="${esc(p.titulo)}"><span class="wiz-num">${g[p.n] && p.n !== n ? "✓" : p.n}</span><span class="wiz-lbl">${p.corto}</span></a></li>`).join(""); };
  const avisosRondaPaso = (u, r, n) => L.avisosRonda(u, r, hoyIso()).filter(a => a.paso === n && !a.item && !a.accion).map(avisoHtml).join("");
  function renderRonda(u, r, n) {
    actual = u; rondaActual = r; pasoRonda = n; nAyuda = 0; zonas = {};
    if (L.sincronizar(u, r) && r.items.length && !esIdEjemplo(u.id) && datos.unidades.includes(u)) guardar();
    if (document.body.classList.contains("ver-informe")) { renderDoc(u, r, docActual || "informe"); return; }
    const p = L.PASOS_RONDA[n - 1];
    zonas.pasos = () => pasosRondaInner(u, r, n);
    view.innerHTML = `
      <div class="wiz-top no-print">${volver(`#/unidad/${u.id}/3`, "Rondas de " + esc(corto(nomUnidad(u), 40)))}<ol class="wiz-steps wiz-steps--5 wiz-steps--ronda" aria-label="Pasos de la ronda" data-zona="pasos">${pasosRondaInner(u, r, n)}</ol></div>
      <div class="wiz-titulo"><span class="wiz-paso">Ronda · ${esc(L.nombreRonda(r))} · paso ${n} de 5</span><h1 class="page-title">${p.titulo}</h1></div>
      ${r.cerrada && n < 5 ? `<div class="note">ℹ Esta ronda está terminada. Puedes corregir lo que haga falta; los cambios se guardan.</div>` : ""}
      ${RONDA[n](u, r)}
      <div class="wiz-nav no-print">${n > 1 ? `<a class="btn" href="#/unidad/${u.id}/ronda/${r.id}/${n - 1}">← ${L.PASOS_RONDA[n - 2].corto}</a>` : `<a class="btn" href="#/unidad/${u.id}/3">← Rondas</a>`}${n < 5 ? `<a class="btn btn--primary" href="#/unidad/${u.id}/ronda/${r.id}/${n + 1}">${L.PASOS_RONDA[n].corto} →</a>` : `<a class="btn" href="#/unidad/${u.id}/3">Rondas →</a>`}</div>`;
  }
  // Paso 1 · Preparar
  function ronda1(u, r) {
    const pend = L.pendientesDe(u, r), eq = u.equipo.filter(m => lleno(m.papel) || lleno(m.perfil));
    return `<p class="page-lead">${L.PASOS_RONDA[0].que}</p>
      <div class="card">
        <div class="accion-g">${campo(r, "fecha", "Fecha", { bind: 'data-rk="fecha"', tipo: "date" })}${campo(r, "hora", "Hora", { bind: 'data-rk="hora"', tipo: "time", opt: true })}</div>
        <div class="field"><div class="field-head"><label class="field-label">Turno</label></div>
          <div class="seg seg--wrap" role="group" aria-label="Turno">${Object.keys(L.TURNOS).map(k => `<button type="button" class="${r.turno === k ? "active" : ""}" data-act="turno" data-v="${k}">${L.TURNOS[k].nom}</button>`).join("")}</div></div>
        ${campo(r, "equipo", "Equipo de la ronda", { area: true, bind: 'data-rk="equipo"', ph: "Por su cargo o papel: responsable de seguridad, supervisora de otra unidad…", extra: eq.length ? `<div class="quick no-print"><button type="button" class="chip chip--accent" data-act="r-equipo">Usar el equipo del programa</button></div>` : "" })}
        ${campo(r, "acompana", "Quién acompaña, de la unidad", { bind: 'data-rk="acompana"', ph: "Por ejemplo: enfermera responsable del turno", help: "Siempre acompaña un profesional de la unidad visitada. Por su cargo, sin nombre." })}
      </div>
      ${zona("avisos", () => avisosRondaPaso(u, r, 1))}
      <h2 class="sec-t">Antes de salir</h2>
      <div class="card"><ul class="check-l">
        <li>Avisad a la unidad de la fecha y explicad el objetivo: <b>aprender y mejorar, no inspeccionar</b>.</li>
        <li>La ronda usará <b>${plural(r.items.length, "pregunta", "preguntas")}</b> del cuestionario${L.estadoRonda(r) === "planificada" ? ` (si cambias el cuestionario antes de empezar, la ronda lo toma tal como esté)` : ""} y ${plural(r.conversacion.length, "pregunta abierta", "preguntas abiertas")} para el equipo.</li>
        <li>${pend.length ? `Empezará comprobando <b>${plural(pend.length, "acción", "acciones")}</b> de rondas anteriores.` : "No hay acciones de rondas anteriores por comprobar."}</li>
        <li>Llevad la tableta o el móvil con esta app, o la <b>hoja en papel</b>. Molestad lo menos posible la atención.</li>
      </ul>
      <div class="toolbar no-print"><button class="btn" data-act="doc" data-doc="hoja">Hoja de la ronda (Word / PDF)</button>${r.items.length ? `<a class="btn btn--primary" href="#/unidad/${u.id}/ronda/${r.id}/${pend.length ? 2 : 3}">Empezar la ronda →</a>` : `<a class="btn btn--primary" href="#/unidad/${u.id}/2">Preparar el cuestionario →</a>`}</div></div>`;
  }
  // Paso 2 · Comprobar lo pendiente
  function ronda2(u, r) {
    const pend = L.pendientesDe(u, r);
    return `<p class="page-lead">${L.PASOS_RONDA[1].que}</p>
      ${facil(`<p>Lo primero de cada ronda es <b>comprobar las acciones de la anterior</b>. Por ejemplo: en marzo el equipo contó que la luz del pasillo de observación llevaba semanas fundida; en abril, lo primero fue comprobar que estaba cambiada, y decirle al equipo quién lo había gestionado.</p><p>Si una acción no ha funcionado, márcalo y acuerda otra en el paso «Acordar».</p>`)}
      ${pend.length ? pend.map(a => { const ro = u.rondas.find(x => x.id === a.rondaId), v = r.revisadas[a.id]; return `<div class="card pend-card${v ? " pend-card--" + v : ""}">
        <p><b>${esc(a.que)}</b></p>
        <p class="field-sub">${esc([ro ? "Ronda del " + fmtF(ro.fecha) : "", a.responsable, a.plazo ? "plazo " + fmtF(a.plazo) : "", L.ESTADOS_ACCION[a.estado].nom].filter(lleno).join(" · "))}${lleno(a.nota) ? `<br>Nota: ${esc(a.nota)}` : ""}</p>
        <div class="seg seg--wrap seg--rev" role="group" aria-label="¿Está resuelta?">${Object.keys(L.REVISION).map(k => `<button type="button" class="rev-${k}${v === k ? " active" : ""}" data-act="revisar" data-id="${a.id}" data-v="${k}">${L.REVISION[k].nom}</button>`).join("")}</div>
        ${v === "mal" && !L.sustituida(u, a) ? `<div class="toolbar"><button class="btn btn--sm btn--primary" data-act="acc-sustituir" data-id="${a.id}">Acordar otra acción</button></div>` : v === "mal" ? `<p class="field-sub">✓ Ya hay otra acción en su lugar.</p>` : ""}
      </div>`; }).join("") : `<div class="placeholder-box"><p>${L.rondasOrden(u).filter(x => x.cerrada && x.id !== r.id).length ? "No hay acciones de rondas anteriores por comprobar." : "Es la primera ronda: no hay nada pendiente."}</p></div>`}
      ${zona("avisos", () => avisosRondaPaso(u, r, 2))}`;
  }
  // Paso 3 · Mirar
  function marcadorRonda(r) {
    const s = L.resultado(r), hechas = s.si + s.no + s.na;
    return `<div class="marcador-r"><span><b>${hechas}</b> de ${s.n} respondidas</span><span class="barra"><span class="barra-fill" style="width:${s.n ? Math.round(hechas / s.n * 100) : 0}%"></span></span><span>Cumple ${pctBadge(s.pct)}</span></div>`;
  }
  function respuestaCard(r, x) {
    const abierta = abiertosR.has(x.id) || lleno(x.nota) || lleno(x.ok) || lleno(x.de);
    return `<div class="ri ri--${x.valor || "x"}" data-rid="${x.id}">
      <p class="ri-t">${esc(x.texto)}</p>
      <p class="ri-meta">${x.donde && L.DONDE[x.donde] ? `${L.DONDE[x.donde].ico} ${L.DONDE[x.donde].nom}` : ""}${x.amfe ? ` · Fallo AMFE ${esc(x.amfe)}` : ""}</p>
      <div class="seg seg--ri" role="group" aria-label="Respuesta">${[["si", "Sí"], ["no", "No"], ["na", "No aplica"]].map(([v, t]) => `<button type="button" class="ri-${v}${x.valor === v ? " active" : ""}" data-act="valor" data-id="${x.id}" data-v="${v}" aria-pressed="${x.valor === v}">${t}</button>`).join("")}</div>
      ${x.valor === "no" ? `<div class="chips"><button type="button" class="chip${x.resuelto ? " active" : ""}" data-act="resuelto" data-id="${x.id}">${x.resuelto ? "✓ " : ""}Resuelto en el momento</button></div>` : ""}
      <details class="ri-mas"${abierta ? " open" : ""} data-rmas="${x.id}"><summary>Nota y recuento</summary>
        ${campo(x, "nota", "", { area: true, bind: `data-ri="${x.id}" data-f="nota"`, ph: "Qué se vio, sin nombres de pacientes ni de profesionales", aria: "Nota" })}
        <div class="cuenta-ri"><span>Cumplen</span>${campo(x, "ok", "", { bind: `data-ri="${x.id}" data-f="ok"`, tipo: "number", aria: "Casos que cumplen" })}<span>de</span>${campo(x, "de", "", { bind: `data-ri="${x.id}" data-f="de"`, tipo: "number", aria: "Casos revisados" })}<span class="field-sub">(opcional: pacientes, boxes o historias revisados)</span></div>
      </details>
      ${zona("rav-" + x.id, () => L.avisosRonda(actual, r, hoyIso()).filter(a => a.item === x.id).map(avisoHtml).join(""))}
    </div>`;
  }
  const abiertosR = new Set();
  function ronda3(u, r) {
    return `<p class="page-lead">${L.PASOS_RONDA[2].que}</p>
      ${facil(`<p>Recorred la unidad con el cuestionario: <b>observad</b>, revisad los registros que indique el ítem y preguntad cuando haga falta. <b>Sí</b>: se cumple. <b>No</b>: no se cumple (anota qué viste). <b>No aplica</b>: no se puede valorar hoy (no cuenta en el resultado).</p><p>Lo peligroso y fácil de resolver, se resuelve allí mismo y se marca <b>«Resuelto en el momento»</b>: sigue contando como «no», porque es lo que se encontró.</p>`)}
      ${r.items.length ? `<div class="marcador-fijo no-print">${zona("marcador", () => marcadorRonda(r))}</div>
      ${L.porBloques(r.items).map(g => `<h2 class="sec-t">${esc(g.nom)}</h2>${g.items.map(x => respuestaCard(r, x)).join("")}`).join("")}` : `<div class="warn">⚠ Esta ronda no tiene preguntas. <a href="#/unidad/${u.id}/2">Prepara el cuestionario</a>.</div>`}
      <h2 class="sec-t">Otros hallazgos</h2>
      <div class="card"><p class="field-sub">Lo que veáis y no esté en el cuestionario (un riesgo nuevo, algo que funciona especialmente bien).</p>
        ${r.hallazgos.map(h => `<div class="hallazgo">${campo(h, "texto", "", { area: true, bind: `data-h="${h.id}" data-f="texto"`, ph: "Qué se vio, sin nombres", aria: "Hallazgo" })}<div class="chips"><button type="button" class="chip${h.resuelto ? " active" : ""}" data-act="h-resuelto" data-id="${h.id}">${h.resuelto ? "✓ " : ""}Resuelto en el momento</button><button type="button" class="chip" data-act="h-del" data-id="${h.id}">Quitar</button></div></div>`).join("")}
        <div class="toolbar no-print"><button class="btn btn--sm" data-act="h-add">+ Hallazgo</button></div></div>
      ${zona("avisos", () => avisosRondaPaso(u, r, 3))}
      ${practica("Lo que se arregla en el momento, se arregla en el momento: un medicamento de alto riesgo fuera de su sitio, una pulsera que falta, una camilla que tapa una salida.")}`;
  }
  // Paso 4 · Escuchar
  function ronda4(u, r) {
    return `<p class="page-lead">${L.PASOS_RONDA[3].que}</p>
      ${facil(`<p>Las preguntas abiertas funcionan mejor en un sitio tranquilo, con quien esté en ese momento (de todos los estamentos), y si quien pregunta <b>escucha más de lo que habla</b>.</p><p>Ayuda: «Cuéntame un ejemplo», «¿Qué crees que ayudaría?», «Esto lo puedo resolver yo; esto otro lo llevo a la dirección y te digo algo antes del día 15». Cierra la conversación: «Eso ya lo sabemos», «Es que no hay presupuesto».</p>`)}
      ${r.conversacion.length ? r.conversacion.map(c => `<div class="card">${campo(c, "respuesta", esc(c.pregunta), { area: true, rows: 3, bind: `data-cv="${c.id}" data-f="respuesta"`, ph: "Lo que cuenta el equipo, con sus palabras y sin nombres" })}</div>`).join("") : `<div class="warn">⚠ El programa no tiene preguntas abiertas. <a href="#/unidad/${u.id}/2">Añádelas en el cuestionario</a>.</div>`}
      ${zona("avisos", () => avisosRondaPaso(u, r, 4))}
      ${box("dirige", "Si diriges", "<p>Comprométete solo con lo que puedas cumplir, y vuelve con respuestas. Una ronda que no produce cambios enseña lo contrario de lo que pretendía.</p>")}`;
  }
  // Paso 5 · Acordar y cerrar
  function resultadoRondaHtml(r) {
    const s = L.resultado(r);
    return `<div class="res-ronda"><div class="res-pct">${pctBadge(s.pct)}<span>${s.si + s.no ? `${s.si} de ${s.si + s.no} se cumplen` : "Sin respuestas"}${s.na ? ` · ${s.na} no aplican` : ""}${s.sin ? ` · ${s.sin} sin responder` : ""}</span></div>
      <div class="table-wrap"><table class="mini"><thead><tr><th>Bloque</th><th class="c">Sí</th><th class="c">No</th><th class="c">N/A</th><th class="c">%</th></tr></thead><tbody>${s.porBloque.map(b => `<tr><td>${esc(b.nom)}</td><td class="c">${b.si}</td><td class="c${b.no ? " calor-no" : ""}">${b.no}</td><td class="c">${b.na}</td><td class="c"><b>${b.pct == null ? "—" : b.pct}</b></td></tr>`).join("")}</tbody></table></div></div>`;
  }
  function hallazgosHtml(u, r) {
    const acc = L.accionesDeRonda(u, r), tiene = o => acc.some(a => a.origen === o);
    const previa = origen => { if (!/^item:/.test(origen)) return null; const a = L.accionDeItem(u, r, origen.slice(5)); return a && a.rondaId !== r.id ? a : null; };
    const fila = (texto, sub, origen, resuelto) => { const pa = previa(origen), rp = pa && u.rondas.find(x => x.id === pa.rondaId);
      return `<div class="hall-f"><span><b>${esc(texto)}</b>${sub ? `<small>${esc(sub)}</small>` : ""}${pa ? `<small>Ya hay una acción de la ronda del ${esc(fmtF(rp ? rp.fecha : ""))}: «${esc(corto(pa.que, 80))}» (${esc(L.ESTADOS_ACCION[pa.estado].nom.toLowerCase())}).</small>` : ""}</span>${resuelto ? `<span class="badge">✓ Resuelto en el momento</span>` : ""}${tiene(origen) ? `<span class="badge">✓ Acción acordada</span>` : `<button type="button" class="btn btn--sm${resuelto || pa ? "" : " btn--primary"}" data-act="acc-de" data-o="${esc(origen)}">${pa ? "Acordar otra" : "Acordar acción"}</button>`}</div>`; };
    const s = L.resultado(r);
    const conv = r.conversacion.filter(c => lleno(c.respuesta));
    return `${s.noCumplen.length || r.hallazgos.some(h => lleno(h.texto)) ? `<h3 class="sub-h">Lo que no se cumple</h3>${s.noCumplen.map(x => fila(x.texto, x.nota, "item:" + x.id, x.resuelto)).join("")}${r.hallazgos.filter(h => lleno(h.texto)).map(h => fila(h.texto, "Fuera del cuestionario", "hallazgo:" + h.id, h.resuelto)).join("")}` : `<p class="field-sub">Todo lo comprobado se cumple.</p>`}
      ${conv.length ? `<h3 class="sub-h">Lo que contó el equipo</h3>${conv.map(c => fila(c.respuesta, c.pregunta, "conv:" + c.id, false)).join("")}` : ""}`;
  }
  function ronda5(u, r) {
    const acc = L.accionesDeRonda(u, r);
    return `<p class="page-lead">${L.PASOS_RONDA[4].que}</p>
      ${facil(`<p>Cerrad con el <b>responsable de turno</b>: un resumen breve, <b>empezando por lo que va bien</b>, y lo que se ha resuelto en el momento.</p><p>Lo demás se convierte en <b>acciones</b> con responsable y plazo. El <b>informe</b> llega a la unidad en pocos días: resultado por bloques, hallazgos, lo que contó el equipo y las acciones.</p>`)}
      <h2 class="sec-t">Resultado</h2>
      <div class="card">${zona("resultado", () => resultadoRondaHtml(r))}</div>
      <h2 class="sec-t">Hallazgos</h2>
      <div class="card">${hallazgosHtml(u, r)}</div>
      <h2 class="sec-t">Acciones acordadas en esta ronda</h2>
      ${acc.map(a => accionCard(u, a)).join("") || `<p class="placeholder-box">Aún no hay acciones. Pulsa «Acordar acción» en un hallazgo, o añade una.</p>`}
      <div class="toolbar no-print"><button class="btn" data-act="acc-de" data-o="">+ Otra acción</button></div>
      <h2 class="sec-t">Cierre con el responsable de turno</h2>
      <div class="card">
        ${campo(r, "cierre.bien", "Lo que va bien", { area: true, bind: 'data-rk="cierre.bien"', ph: "Empezad por aquí", extra: proponer("prop-bien") })}
        ${campo(r, "cierre.resumen", "Resumen de la ronda", { area: true, rows: 4, bind: 'data-rk="cierre.resumen"', ph: "Para el informe", extra: proponer("prop-resumen") })}
        <div class="toolbar">${r.cerrada ? `<span class="badge badge--est-hecha">✓ Ronda terminada</span><button class="btn btn--sm" data-act="reabrir">Reabrirla</button>` : `<button class="btn btn--primary" data-act="cerrar">✓ Terminar la ronda</button>`}</div>
      </div>
      ${zona("avisos", () => avisosRondaPaso(u, r, 5))}
      <h2 class="sec-t">Informe a la unidad</h2>
      <div class="card">
        <div class="accion-g">${campo(r, "informe.fecha", "Enviado el", { bind: 'data-rk="informe.fecha"', tipo: "date" })}${campo(r, "informe.destinatarios", "A quién", { bind: 'data-rk="informe.destinatarios"', ph: "Por ejemplo: jefatura y supervisión de la unidad" })}</div>
        <div class="toolbar no-print"><button class="btn btn--primary" data-act="doc" data-doc="informe">Informe de la ronda (Word / PDF)</button><button class="btn" data-act="doc" data-doc="hoja">Hoja de la ronda</button></div>
      </div>`;
  }
  const RONDA = { 1: ronda1, 2: ronda2, 3: ronda3, 4: ronda4, 5: ronda5 };

  // ---------- Documentos: bloques → HTML (vista previa, imprimir y PDF) y → Word ----------
  function bloquesHtml(bloques) {
    const celda = (c, cab) => { const o = c !== null && typeof c === "object" ? c : { texto: c }; const st = o.fondo ? ` style="background:#${o.fondo}"` : ""; const cl = [o.centro ? "c" : "", o.negrita ? "b" : ""].filter(Boolean).join(" "); return `<${cab ? "th" : "td"}${cl ? ` class="${cl}"` : ""}${st}>${escMl(o.texto)}</${cab ? "th" : "td"}>`; };
    return bloques.map(b => {
      if (b.t === "portada") return `<div class="doc-portada"><h1>${esc(b.titulo)}</h1>${b.sub ? `<p class="doc-sub">${esc(b.sub)}</p>` : ""}${(b.extra || []).map(x => `<p>${esc(x)}</p>`).join("")}</div>`;
      if (b.t === "h1") return `<h2 class="doc-h1">${esc(b.texto)}</h2>`;
      if (b.t === "h2") return `<h3 class="doc-h2">${esc(b.texto)}</h3>`;
      if (b.t === "p") return `<p class="doc-p${b.estilo === "nota" ? " doc-nota" : ""}">${b.runs ? b.runs.map(r => r.negrita ? `<b>${escMl(r.texto)}</b>` : escMl(r.texto)).join("") : escMl(b.texto)}</p>`;
      if (b.t === "lista") return `<ul class="doc-ul">${b.items.map(i => `<li>${esc(typeof i === "string" ? i : i.texto)}</li>`).join("")}</ul>`;
      if (b.t === "salto") return `<div class="doc-salto"></div>`;
      if (b.t === "tabla") {
        const suma = (b.anchos || []).reduce((a, x) => a + x, 0);
        const cols = b.anchos ? `<colgroup>${b.anchos.map(w => `<col style="width:${(w / suma * 100).toFixed(1)}%">`).join("")}</colgroup>` : "";
        return `<div class="table-wrap"><table class="doc-t${b.fuente && b.fuente < 9 ? " doc-t--peq" : ""}">${cols}${b.cab && !b.sinCab ? `<thead><tr>${b.cab.map(c => celda(c, true)).join("")}</tr></thead>` : ""}<tbody>${b.filas.map(f => `<tr>${f.map(c => celda(c, false)).join("")}</tr>`).join("")}</tbody></table></div>`;
      }
      return "";
    }).join("");
  }
  const DOCS = { hoja: (u, r) => L.documentoHoja(u, r), informe: (u, r) => L.documentoInforme(u, r), seguimiento: u => L.documentoSeguimiento(u, hoyIso()) };
  function renderDoc(u, r, cual) {
    if (!DOCS[cual] || (cual === "informe" && !r)) cual = r ? "informe" : "seguimiento";
    const doc = DOCS[cual](u, r);
    view.innerHTML = `<div class="informe-bar informe-only"><button class="btn" data-act="volver">← Volver</button><span class="informe-acc"><button class="btn" data-act="doc-word" data-doc="${cual}">⬇ Word</button><button class="btn btn--primary" data-act="imprimir">Guardar / imprimir</button></span></div>
      <div class="doc-prev doc-prev--informe">${bloquesHtml(doc.bloques)}</div>${informePie()}`;
  }
  function descargarWord(cual) {
    try {
      const doc = DOCS[cual](actual, rondaActual);
      const bytes = window.Docx.construirDocx(Object.assign({ pie: doc.titulo + " · Generado con la app Rondas de Seguridad" }, doc));
      compartirOBajar(new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }), `${doc.titulo.replace(/[\\/:*?"<>|%]/g, "-").slice(0, 90).trim()} ${fechaArchivo()}.docx`, "Word descargado. Ábrelo con Word, Pages o LibreOffice y ajústalo a tu gusto.");
    } catch (e) { toast("No se ha podido crear el Word.", 4000); }
  }

  // ---------- Aprende ----------
  function renderAprende(n) {
    const T = C.TEMAS, t = T.find(x => x.n === n);
    if (!t) {
      view.innerHTML = `
        <h1 class="page-title">Aprende</h1>
        <p class="page-lead">${T.length} temas, explicados fácil, para tener a mano mientras preparas y haces las rondas.</p>
        <div class="temas">${T.map(x => `<a class="tema-card pdca--${x.c}" href="#/aprende/${x.n}"><span class="tema-n">${x.n}</span><span><b>${x.titulo}</b><span>${x.sub}</span></span></a>`).join("")}</div>`;
      return;
    }
    const prev = T.find(x => x.n === n - 1), next = T.find(x => x.n === n + 1);
    view.innerHTML = `
      <div class="wiz-top no-print">${volver("#/aprende", "Aprende")}<div class="tema-pills">${T.map(x => `<a href="#/aprende/${x.n}" class="pdca--${x.c}${x.n === n ? " actual" : ""}">${x.n}</a>`).join("")}</div></div>
      <div class="wiz-titulo"><span class="wiz-paso">Tema ${n} de ${T.length}</span><h1 class="page-title">${t.titulo}</h1><p class="page-lead">${t.sub}</p></div>
      <div class="card minuto pdca--${t.c}"><h2 class="sub-h">En un minuto</h2><ul>${t.minuto.map(x => `<li>${x}</li>`).join("")}</ul></div>
      ${t.secciones.map((s, i) => `<details class="facil"${i === 0 ? " open" : ""}><summary>${s.t}</summary><div class="facil-body">${s.h}</div></details>`).join("")}
      ${box("ejemplo", "Minicaso", `<p>${t.minicaso}</p>`)}
      <div class="toolbar"><a class="btn btn--primary" href="${t.practica.href}">${t.practica.texto} →</a></div>
      <div class="wiz-nav no-print">${prev ? `<a class="btn" href="#/aprende/${prev.n}">← ${prev.titulo}</a>` : "<span></span>"}${next ? `<a class="btn" href="#/aprende/${next.n}">${next.titulo} →</a>` : "<span></span>"}</div>`;
  }

  // ---------- Ponte a prueba ----------
  const respuestas = {}, respEj = { sirve: {}, momento: {} };
  // Orden de las opciones barajado pero estable (para que la correcta no esté siempre en el mismo sitio)
  const barajar = (n, semilla) => { const a = Array.from({ length: n }, (_, i) => i); let s = semilla * 9301 + 49297; for (let i = n - 1; i > 0; i--) { s = (s * 9301 + 49297) % 233280; const j = Math.floor(s / 233280 * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const pillsPrueba = act => `<div class="tema-pills prueba-pills no-print"><a href="#/prueba" class="pdca--P${!act ? " actual" : ""}" title="Todas las preguntas">T</a>${Object.keys(C.TEMAS_TEST).map(k => `<a href="#/prueba/${k}" class="pdca--P${String(act) === k ? " actual" : ""}" title="${esc(C.TEMAS_TEST[k].nom)}">${k}</a>`).join("")}<a href="#/prueba/practica" class="pdca--V${act === "practica" ? " actual" : ""}" title="Ejercicios prácticos">✎</a></div>`;
  function marcadorHtml(Qs) {
    const hechas = Qs.filter(q => q.i in respuestas), bien = hechas.filter(q => respuestas[q.i] === q.ok).length;
    if (!hechas.length) return `<span class="field-sub">Aciertos: 0 de ${Qs.length}</span>`;
    const p = bien / hechas.length;
    return `<span><b>${bien}</b> ${bien === 1 ? "acierto" : "aciertos"} de ${hechas.length} ${hechas.length === 1 ? "respondida" : "respondidas"} (de ${Qs.length})</span>${hechas.length === Qs.length ? `<span class="sem-b sem-b--${p >= 0.8 ? "verde" : p >= 0.6 ? "ambar" : "rojo"}">${p >= 0.8 ? "¡Muy bien!" : p >= 0.6 ? "Bien: repasa los fallos" : "Repasa «Aprende»"}</span>` : ""}`;
  }
  function renderPrueba(bloque) {
    if (bloque === "practica") { renderPractica(); return; }
    const Qs = C.TEST.map((q, i) => Object.assign({ i }, q)).filter(q => !bloque || q.t === bloque);
    view.innerHTML = `
      <h1 class="page-title">Ponte a prueba</h1>
      <p class="page-lead">${C.TEST.length} preguntas sobre las rondas de seguridad${bloque ? ` (aquí, las del bloque «${esc(C.TEMAS_TEST[bloque].nom)}»)` : ""}. Toca la respuesta que creas correcta y lee la explicación. En ✎, dos ejercicios prácticos.</p>
      ${pillsPrueba(bloque)}
      <div class="marcador" data-zona-q="marcador">${marcadorHtml(Qs)}</div>
      <div class="card">${Qs.map(q => { const ord = barajar(q.o.length, q.i + 1), r = respuestas[q.i]; return `<div class="quiz-q" data-q="${q.i}">
        <p><span class="badge">${esc(C.TEMAS_TEST[q.t].nom)}</span> <b>${esc(q.q)}</b></p>
        ${ord.map(j => `<button class="quiz-o${r != null ? (j === q.ok ? " quiz-o--ok" : j === r ? " quiz-o--mal" : "") : ""}" data-act="quiz" data-q="${q.i}" data-o="${j}">${esc(q.o[j])}</button>`).join("")}
        <p class="quiz-fb"${r == null ? " hidden" : ""}>${r != null ? `${r === q.ok ? "<b>¡Correcto!</b> " : "<b>No.</b> "}${esc(q.e)} <a href="#/aprende/${C.TEMAS_TEST[q.t].aprende}">Repasar en «Aprende»</a>` : ""}</p>
      </div>`; }).join("")}</div>
      <div class="toolbar no-print"><button class="btn" data-act="quiz-reset">Empezar de nuevo</button><a class="btn btn--primary" href="#/prueba/practica">Ejercicios prácticos →</a></div>`;
  }
  function ejercicio(k, titulo, sub, items, opciones, fb) {
    const R = respEj[k], hechas = Object.keys(R).length, bien = items.filter((x, i) => R[i] === x.k).length;
    return `<h2 class="sec-t">${titulo}</h2><p class="field-sub">${sub} ${hechas ? `<b>${bien} de ${hechas}</b> bien.` : ""}</p>
      <div class="card">${items.map((x, i) => { const r = R[i], ok = x.k; return `<div class="quiz-q fec-q">
        <p><b>«${esc(x.texto)}»</b></p>
        <div class="seg seg--wrap" role="group">${opciones.map(([v, t]) => `<button type="button" class="${r === v ? (v === ok ? "fec-ok" : "fec-mal") : r && v === ok ? "fec-ok" : ""}" data-act="ej" data-k="${k}" data-i="${i}" data-v="${v}">${t}</button>`).join("")}</div>
        ${r ? `<p class="quiz-fb">${r === ok ? "<b>¡Correcto!</b> " : "<b>No.</b> "}${fb(x)}</p>` : ""}</div>`; }).join("")}</div>`;
  }
  function renderPractica() {
    const E = C.EJERCICIOS;
    view.innerHTML = `
      <h1 class="page-title">Ponte a prueba · ejercicios</h1>
      <p class="page-lead">Dos ejercicios con frases como las de una ronda real.</p>
      ${pillsPrueba("practica")}
      ${ejercicio("sirve", "1. ¿Sirve este ítem?", "Un buen ítem es observable y se responde sí, no o no aplica sin interpretaciones.", E.sirve, [["bien", "Sirve"], ["no", "No sirve"]],
        x => x.k === "bien" ? "Es concreto: dos evaluadores distintos responderían lo mismo." : esc((L.revisarItem(x.texto)[0] || { texto: "Es ambiguo: cada evaluador lo entendería a su manera." }).texto))}
      ${ejercicio("momento", "2. ¿Se resuelve en el momento o se acuerda una acción?", "Lo peligroso y fácil, en el momento; lo que necesita a otros, tiempo o dinero, una acción con responsable y plazo.", E.momento, [["momento", "En el momento"], ["accion", "Una acción"]], x => esc(x.por))}
      <div class="toolbar no-print"><button class="btn" data-act="practica-reset">Empezar de nuevo</button><a class="btn" href="#/prueba">← Preguntas del test</a></div>`;
  }

  // ---------- Ejemplos ----------
  function renderEjemplos() {
    view.innerHTML = `
      <h1 class="page-title">Ejemplos</h1>
      <p class="page-lead">Para ver cómo queda cada paso antes de hacerlo tú. Están aparte: puedes tocarlos, pero <b>no se guardan ni se mezclan con tus datos</b>. Si te sirve de punto de partida, pulsa «Copiar a mis datos».</p>
      <h2 class="sec-t">Ejemplo completo: Servicio de Urgencias</h2>
      <p class="field-sub">Un servicio de urgencias (caso docente, ficticio) incorpora una <b>ronda mensual</b> como complemento de las auditorías: las auditorías revisan historias; la ronda mira lo que no se registra. Catorce ítems elegidos del banco a partir del mapa de riesgos (con su número de fallo del AMFE) y tres preguntas abiertas. Nueve rondas de enero a septiembre, rotando mañana, tarde y noche: la de marzo, de noche, encuentra dos mayores sin acompañante sin identificar y una camilla que tapa una salida; un celador cuenta que, de noche, a veces la planta no sabe que le suben un paciente. A los seis meses, el seguimiento muestra que la identificación de los mayores sin acompañante <b>falla en todas las rondas de noche</b>.</p>
      <div class="ej-grid">${C.EJEMPLOS.fichas.map(f => `<a class="ej-card" href="${f.href}"><b>${esc(f.t)}</b><span>${esc(f.s)}</span></a>`).join("")}<a class="ej-card" href="#/unidad/ej-urg/5?informe=1&doc=seguimiento"><b>Programa y seguimiento</b><span>El documento completo, imprimible</span></a></div>
      <h2 class="sec-t">Otro ejemplo y minicasos</h2>
      <p class="field-sub">Cortos e inventados. Los minicasos traen los errores típicos del paso que trabajan: mira los avisos y corrígelos.</p>
      <div class="ej-grid ej-grid--mini">${C.EJEMPLOS.minicasos.map(f => `<a class="ej-card" href="${f.href}"><b>${esc(f.t)}</b><span>${esc(f.s)}</span></a>`).join("")}</div>
      ${practica("Los ejemplos son casos docentes: no corresponden a ningún centro real. Usa siempre los datos de tu unidad.")}`;
  }

  // ---------- Glosario ----------
  function renderGlosario() {
    view.innerHTML = `<h1 class="page-title">Glosario</h1><p class="page-lead">${C.GLOSARIO.length} términos en lenguaje llano.</p>
      <div class="input-wrap glos-buscar"><input id="glos-q" type="search" placeholder="Buscar término…" autocomplete="off" /></div>
      <dl class="glos-lista" id="glos-lista"></dl>`;
    const pinta = q => {
      const t = L.sinTildes(q);
      const l = C.GLOSARIO.filter(([a, b]) => !t || L.sinTildes(a + " " + b).includes(t)).sort((x, y) => x[0].localeCompare(y[0], "es"));
      $("#glos-lista").innerHTML = l.length ? l.map(([a, b]) => `<div class="glos-item"><dt>${esc(a)}</dt><dd>${esc(b)}</dd></div>`).join("") : `<p class="placeholder-box">Sin resultados.</p>`;
    };
    pinta(""); $("#glos-q").addEventListener("input", e => pinta(e.target.value));
  }

  // ---------- PDF en iOS (sin librerías; mismo método que Auditorías, AMFE y DAFO) ----------
  // En iOS, window.print() no hace nada cuando la app está instalada en la pantalla de inicio.
  function esIOS() { return /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1); }
  function toast(msg, ms) {
    let t = $("#toast");
    if (!msg) { if (t) t.hidden = true; return; }
    if (!t) { t = document.createElement("div"); t.id = "toast"; t.className = "toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
    t.textContent = msg; t.hidden = false; clearTimeout(toast.h);
    if (ms) toast.h = setTimeout(() => { t.hidden = true; }, ms);
  }
  function pdfDesdeJPEGs(paginas, wPt, hPt) {
    const enc = new TextEncoder(), partes = [], offs = []; let pos = 0;
    const push = x => { const b = typeof x === "string" ? enc.encode(x) : x; partes.push(b); pos += b.length; };
    const obj = (n, cuerpo) => { offs[n] = pos; push(`${n} 0 obj\n`); cuerpo(); push("\nendobj\n"); };
    push("%PDF-1.4\n"); push(new Uint8Array([37, 226, 227, 207, 211, 10]));
    const n = paginas.length;
    obj(1, () => push("<< /Type /Catalog /Pages 2 0 R >>"));
    obj(2, () => push(`<< /Type /Pages /Kids [${paginas.map((_, i) => `${3 + i * 3} 0 R`).join(" ")}] /Count ${n} >>`));
    paginas.forEach((p, i) => {
      const pg = 3 + i * 3, cont = pg + 1, img = pg + 2, flujo = `q ${wPt} 0 0 ${hPt} 0 0 cm /Im${i} Do Q`;
      obj(pg, () => push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${wPt} ${hPt}] /Resources << /XObject << /Im${i} ${img} 0 R >> >> /Contents ${cont} 0 R >>`));
      obj(cont, () => { push(`<< /Length ${flujo.length} >>\nstream\n${flujo}\nendstream`); });
      obj(img, () => { push(`<< /Type /XObject /Subtype /Image /Width ${p.w} /Height ${p.h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${p.bytes.length} >>\nstream\n`); push(p.bytes); push("\nendstream"); });
    });
    const total = 3 + n * 3, xref = pos;
    let x = `xref\n0 ${total}\n0000000000 65535 f \n`;
    for (let k = 1; k < total; k++) x += String(offs[k]).padStart(10, "0") + " 00000 n \n";
    push(x + `trailer\n<< /Size ${total} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
    return new Blob(partes, { type: "application/pdf" });
  }
  async function generarPDF() {
    const ANCHO = 720, K = 2;
    const A4W = 595.28, A4H = 841.89, MARGEN_PT = 34;
    const PX = (A4W - 2 * MARGEN_PT) / ANCHO;
    const PW = A4W / PX, PH = A4H / PX, M = MARGEN_PT / PX, ALTO_UTIL = PH - 2 * M;
    const hoja = document.createElement("div");
    hoja.className = "view";
    hoja.style.cssText = `position:absolute;left:-20000px;top:0;width:${ANCHO}px;max-width:none;margin:0;padding:0;box-shadow:none;`;
    hoja.innerHTML = $("#view").innerHTML;
    $$(".informe-bar, [id]", hoja).forEach(el => { if (el.classList.contains("informe-bar")) el.remove(); else el.removeAttribute("id"); });
    $$("details", hoja).forEach(d => { d.open = true; });
    document.body.appendChild(hoja);
    try {
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      const R0 = hoja.getBoundingClientRect();
      const ops = [], cortes = [0], bloques = [];
      const SIN_CORTE = ".print-head, .chart-card, tr, .formula, .box, .print-foot, h1, h2, h3, .ficha-cab, .leyenda";
      const rel = r => ({ x: r.left - R0.left, y: r.top - R0.top, w: r.width, h: r.height });
      const hayColor = c => !!c && c !== "transparent" && !/rgba\([^)]*,\s*0\)$/.test(c);
      const LADOS = ["Top", "Right", "Bottom", "Left"];
      const texto = (n, cs) => {
        const t = n.textContent, re = /\S+/g, rg = document.createRange(); let m;
        const font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
        while ((m = re.exec(t))) {
          rg.setStart(n, m.index); rg.setEnd(n, m.index + m[0].length);
          const rs = rg.getClientRects(); if (!rs.length) continue;
          ops.push({ t: "txt", s: cs.textTransform === "uppercase" ? m[0].toUpperCase() : m[0], r: rel(rs[0]), font, col: cs.color, ls: cs.letterSpacing });
        }
      };
      const recorre = el => {
        const cs = getComputedStyle(el);
        if (cs.display === "none" || cs.visibility === "hidden") return;
        const r = rel(el.getBoundingClientRect());
        if (r.h > 0) cortes.push(r.y + r.h);
        if (el.matches(SIN_CORTE)) bloques.push([r.y, r.y + r.h]);
        if (el instanceof SVGSVGElement) { ops.push({ t: "svg", el, r }); return; }
        const bordes = LADOS.map(l => [parseFloat(cs[`border${l}Width`]) || 0, cs[`border${l}Color`]]);
        if (hayColor(cs.backgroundColor) || bordes.some(b => b[0] > 0 && hayColor(b[1]))) ops.push({ t: "caja", r, bg: cs.backgroundColor, rad: parseFloat(cs.borderTopLeftRadius) || 0, bordes });
        if (el.tagName === "LI") {
          const ol = el.parentElement.tagName === "OL", idx = Array.prototype.indexOf.call(el.parentElement.children, el) + 1;
          ops.push({ t: "txt", s: ol ? idx + "." : "•", r: { x: r.x - (ol ? 20 : 14), y: r.y, w: 16, h: parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.4 }, font: `normal 700 ${cs.fontSize} ${cs.fontFamily}`, col: ol ? "#7a1626" : cs.color, ls: "normal" });
        }
        for (const n of el.childNodes) {
          if (n.nodeType === 1) recorre(n);
          else if (n.nodeType === 3 && n.textContent.trim()) texto(n, cs);
        }
      };
      recorre(hoja);
      for (const op of ops.filter(o => o.t === "svg")) {
        const cl = op.el.cloneNode(true), orig = [op.el, ...op.el.querySelectorAll("*")], copia = [cl, ...cl.querySelectorAll("*")];
        orig.forEach((o, i) => { const cs = getComputedStyle(o); copia[i].setAttribute("style", ["fill", "stroke", "stroke-width", "stroke-dasharray", "font-family", "font-size", "font-weight"].map(p => `${p}:${cs.getPropertyValue(p)}`).join(";")); });
        cl.setAttribute("xmlns", "http://www.w3.org/2000/svg"); cl.setAttribute("width", op.r.w); cl.setAttribute("height", op.r.h);
        op.img = await new Promise(res => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(new XMLSerializer().serializeToString(cl)); });
      }
      const alto = Math.ceil(R0.height);
      const parte = y => bloques.some(([a, b]) => a < y - 0.5 && y + 0.5 < b && b - a < ALTO_UTIL);
      const cands = [...new Set(cortes.map(c => Math.ceil(c)))].sort((a, b) => a - b);
      const pags = []; let y0 = 0;
      while (y0 < alto - 1) {
        const lim = y0 + ALTO_UTIL;
        if (lim >= alto) { pags.push([y0, alto]); break; }
        const y = cands.filter(c => c > y0 + 80 && c <= lim && !parte(c)).pop() || Math.floor(lim);
        pags.push([y0, y]); y0 = y;
      }
      const ponFuente = (ctx, f) => { ctx.font = "10px serif"; ctx.font = f; if (ctx.font === "10px serif") ctx.font = f.replace(/^(.*?\d+(\.\d+)?px).*$/, "$1 sans-serif"); };
      const caja = (ctx, op) => {
        const { x, y, w, h } = op.r, rad = Math.min(op.rad, w / 2, h / 2);
        const camino = () => { ctx.beginPath(); if (rad > 0 && ctx.roundRect) ctx.roundRect(x, y, w, h, rad); else ctx.rect(x, y, w, h); };
        if (hayColor(op.bg)) { ctx.fillStyle = op.bg; camino(); ctx.fill(); }
        const [t, d, b, l] = op.bordes;
        if (op.bordes.every(z => z[0] === t[0] && z[1] === t[1]) && t[0] > 0 && hayColor(t[1])) { ctx.strokeStyle = t[1]; ctx.lineWidth = t[0]; ctx.beginPath(); if (rad > 0 && ctx.roundRect) ctx.roundRect(x + t[0] / 2, y + t[0] / 2, w - t[0], h - t[0], Math.max(0, rad - t[0] / 2)); else ctx.rect(x + t[0] / 2, y + t[0] / 2, w - t[0], h - t[0]); ctx.stroke(); return; }
        const lado = (z, rx, ry, rw, rh) => { if (z[0] > 0 && hayColor(z[1])) { ctx.fillStyle = z[1]; ctx.fillRect(rx, ry, rw, rh); } };
        lado(t, x, y, w, t[0]); lado(b, x, y + h - b[0], w, b[0]); lado(l, x, y, l[0], h); lado(d, x + w - d[0], y, d[0], h);
      };
      const dibujaPaginas = conSVG => pags.map(([a, b]) => {
        const cv = document.createElement("canvas"); cv.width = Math.round(PW * K); cv.height = Math.round(PH * K);
        const ctx = cv.getContext("2d");
        ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, cv.width, cv.height);
        ctx.scale(K, K); ctx.translate(M, M - a);
        ctx.beginPath(); ctx.rect(-2, a, ANCHO + 4, b - a); ctx.clip();
        for (const op of ops) {
          if (op.r.y >= b || op.r.y + op.r.h <= a) continue;
          if (op.t === "caja") caja(ctx, op);
          else if (op.t === "svg") { if (conSVG && op.img) ctx.drawImage(op.img, op.r.x, op.r.y, op.r.w, op.r.h); }
          else {
            ponFuente(ctx, op.font); ctx.fillStyle = op.col; ctx.textBaseline = "alphabetic";
            if ("letterSpacing" in ctx) ctx.letterSpacing = op.ls && op.ls !== "normal" ? op.ls : "0px";
            const mt = ctx.measureText(op.s), asc = mt.fontBoundingBoxAscent || mt.actualBoundingBoxAscent || op.r.h * 0.8, desc = mt.fontBoundingBoxDescent || mt.actualBoundingBoxDescent || op.r.h * 0.2;
            ctx.fillText(op.s, op.r.x, op.r.y + (op.r.h - (asc + desc)) / 2 + asc);
          }
        }
        const url = cv.toDataURL("image/jpeg", 0.9), bin = atob(url.slice(url.indexOf(",") + 1)), bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        return { bytes, w: cv.width, h: cv.height };
      });
      let paginas;
      try { paginas = dibujaPaginas(true); } catch (e) { paginas = dibujaPaginas(false); }
      return pdfDesdeJPEGs(paginas, A4W, A4H);
    } finally { hoja.remove(); }
  }
  let pdfListo = null;
  const rutaActual = () => location.hash.split("?")[0];
  const fechaArchivo = () => new Date().toLocaleDateString("es-ES").replace(/\//g, "-");
  function nombreArchivo(ext) {
    const base = actual ? "Rondas " + (L.nombreUnidad(actual) || "").slice(0, 50) + (rondaActual && rondaActual.fecha ? " " + fmtF(rondaActual.fecha).replace(/\//g, "-") : "") : "Rondas";
    return `${base.replace(/[\\/:*?"<>|%]/g, "").trim()} ${fechaArchivo()}.${ext}`;
  }
  function prepararPDF() {
    pdfListo = null; const r = rutaActual();
    setTimeout(() => { if (rutaActual() === r && document.body.classList.contains("ver-informe")) generarPDF().then(b => { pdfListo = { r, blob: b }; }).catch(() => {}); }, 300);
  }
  async function guardarPDF() {
    if (!document.body.classList.contains("ver-informe")) return;
    let blob = pdfListo && pdfListo.r === rutaActual() ? pdfListo.blob : null;
    if (!blob) { toast("Preparando el PDF…"); try { blob = await generarPDF(); pdfListo = { r: rutaActual(), blob }; } catch (e) { toast("No se ha podido crear el PDF.", 4000); return; } }
    const file = new File([blob], nombreArchivo("pdf"), { type: "application/pdf" });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], title: file.name }); toast(""); }
      catch (e) { if (e && e.name === "AbortError") { toast(""); return; } toast("PDF listo: pulsa otra vez «Guardar / imprimir».", 4000); }
      return;
    }
    descargar(blob, file.name); toast("PDF descargado.", 3000);
  }
  function descargar(blob, nombre) {
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = nombre;
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 200);
  }
  function exportarExcel(u) {
    try {
      const bytes = window.Xlsx.construirLibroXlsx(L.hojasExcel(u, new Date().toLocaleDateString("es-ES")));
      compartirOBajar(new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), nombreArchivo("xlsx"), "Excel descargado.");
    } catch (e) { toast("No se ha podido crear el Excel.", 4000); }
  }
  function compartirOBajar(blob, nombre, msg) {
    const file = new File([blob], nombre, { type: blob.type });
    if (esIOS() && navigator.canShare && navigator.canShare({ files: [file] })) navigator.share({ files: [file], title: nombre }).catch(() => {});
    else { descargar(blob, nombre); toast(msg, 3000); }
  }
  function irDoc(doc) { location.hash = rutaActual() + "?informe=1&doc=" + doc; }
  function imprimir() { if (esIOS()) { guardarPDF(); return; } window.print(); }

  // ---------- Copia de seguridad e importar ----------
  async function copiaSeguridad() {
    const contenido = JSON.stringify({ app: "rondas", v: L.VERSION_DATOS, exportado: hoy(), unidades: datosUsuario.unidades, intercambio: L.paqueteIntercambio(datosUsuario.unidades, APP_VERSION, hoy()) }, null, 1);
    const nombre = `Rondas de Seguridad copia ${new Date().toISOString().slice(0, 10)}.json`;
    const blob = new Blob([contenido], { type: "application/json" });
    const file = new File([blob], nombre, { type: "application/json" });
    if (esIOS() && navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], title: nombre }); } catch (e) { if (e && e.name === "AbortError") return; }
    } else descargar(blob, nombre);
    datosUsuario.ultimaCopia = hoy(); guardar(true);
    toast("Copia guardada. Guárdala en un sitio seguro (Archivos, Drive, correo…).", 4500);
    if (rutaActual() === "#/" || rutaActual() === "") renderHome();
  }
  function importar(file) {
    const fr = new FileReader();
    fr.onload = () => {
      let s = null; try { s = L.sanearDatos(JSON.parse(fr.result), genId, hoy()); } catch (e) { /* */ }
      if (!s) { toast("Ese archivo no es una copia de Rondas de Seguridad.", 4000); return; }
      // Nunca se importa nada con id de ejemplo
      s.unidades.forEach(x => { if (esIdEjemplo(x.id)) x.id = genId(); });
      const aplicar = modo => {
        const r = modo === "sustituir" ? s : L.fusionar(datosUsuario, s);
        datosUsuario.unidades = r.unidades; guardar(true);
        toast(`Importadas ${plural(s.unidades.length, "unidad", "unidades")}.`, 4000);
        location.hash = "#/"; route();
      };
      if (!datosUsuario.unidades.length) { aplicar("sustituir"); return; }
      confirmar(`<p>La copia tiene <b>${plural(s.unidades.length, "unidad", "unidades")}</b>.</p><p><b>Añadir</b> las junta con las tuyas (si una está en las dos, se queda la modificada más tarde): así se trabaja en equipo. Si prefieres <b>sustituir</b> todo lo tuyo por la copia, pulsa «Sustituir».</p>`, "Añadir a mis datos", () => aplicar("anadir"), { titulo: "Importar copia", peligro: false, otro: ["Sustituir", () => confirmar("<p>Se borrarán tus unidades actuales y se quedará solo lo de la copia. Esto no se puede deshacer.</p>", "Sustituir", () => aplicar("sustituir"))] });
    };
    fr.readAsText(file);
  }

  // ---------- Confirmación ----------
  function confirmar(html, siTxt, alSi, o = {}) {
    const m = $("#modal-confirmar");
    $("#conf-titulo").textContent = o.titulo || "¿Seguro?";
    $("#conf-texto").innerHTML = html;
    const si = $("#btn-conf-si"), no = $("#btn-conf-no");
    si.textContent = siTxt; si.className = "btn " + (o.peligro === false ? "btn--primary" : "btn--peligro");
    let extra = $("#btn-conf-otro"); if (extra) extra.remove();
    if (o.otro) { extra = document.createElement("button"); extra.id = "btn-conf-otro"; extra.className = "btn"; extra.textContent = o.otro[0]; no.after(extra); extra.onclick = () => { m.hidden = true; o.otro[1](); }; }
    si.onclick = () => { m.hidden = true; alSi(); };
    no.onclick = () => { m.hidden = true; };
    m.hidden = false; si.focus();
  }

  // ---------- Copiar un ejemplo a mis datos ----------
  function copiarAMisDatos() {
    if (!actual || !esIdEjemplo(actual.id)) return;
    const c = L.renovarIds(L.sanearUnidad(Object.assign(clon(actual), { creado: hoy(), modificado: hoy() }), genId, hoy()), genId);
    c.unidad = c.unidad.replace(/\s*\((caso docente|minicaso)\)\s*$/, "");
    datosUsuario.unidades.push(c); guardar(true); location.hash = `#/unidad/${c.id}/${pasoActual}`;
    toast("Copiado a tus unidades. Ya es tuyo: cámbialo a tu gusto.", 4000);
  }

  // ---------- Traer de AMFE o de Mapa de Riesgos ----------
  // Solo lectura: cada app escribe en sus claves. Se copian los fallos prioritarios como borradores.
  function traerDelNavegador() {
    // [eco]
    for (const k of ["mapariesgos-intercambio", "amfe-intercambio"]) {
      const crudo = leer(k); if (!crudo) continue;
      try { const r = L.leerFallos(JSON.parse(crudo)); if (!r.error && r.amfes.length) return r; } catch (e) { /* */ }
    }
    // [/eco]
    return null;
  }

  // ---------- Enrutado ----------
  const NAV = [["", "Inicio"], ["unidades", "Mis unidades"], ["ejemplos", "Ejemplos"], ["aprende", "Aprende"], ["prueba", "Ponte a prueba"], ["glosario", "Glosario"]];
  function buildNav() { $("#calc-nav").innerHTML = NAV.map(([r, t]) => `<a href="#/${r}" data-r="${r}">${t}</a>`).join(""); }
  function noEncontrado(que, href, txt) { actual = null; rondaActual = null; view.innerHTML = `<div class="error-box">No se encuentra ${que} en este dispositivo.</div><p><a href="${href}">${txt}</a></p>`; }
  let previo = null, docActual = "";
  function route() {
    const [ruta, qs] = (location.hash.replace(/^#\/?/, "") || "").split("?");
    const partes = ruta.split("/"), q = new URLSearchParams(qs || "");
    const informe = q.get("informe") === "1";
    docActual = informe ? (q.get("doc") || "") : "";
    document.body.classList.toggle("ver-informe", informe);
    actual = null; rondaActual = null; zonas = {};
    const idU = partes[1] || "", ej = ejemplos();
    modoEjemplo = partes[0] === "ejemplos" || (esIdEjemplo(idU) && ej.unidades.some(x => x.id === idU));
    datos = modoEjemplo ? ej : datosUsuario;
    $("#banner-ejemplo").hidden = !modoEjemplo || informe || partes[0] === "ejemplos";
    let navR = partes[0];
    if (partes[0] === "unidad" && partes[1] === "nueva") {
      const u = L.nuevaUnidad(genId(), hoy()); borradores.set(u.id, u); previo = u.id; traerLista = null;
      history.replaceState(null, "", `#/unidad/${u.id}/1`); renderUnidad(u, 1);
      navR = "unidades";
    } else if (partes[0] === "unidad" && partes[1]) {
      const u = buscaUnidad(partes[1]) || borradores.get(partes[1]);
      navR = "unidades";
      if (!u) noEncontrado("esa unidad", "#/unidades", "Ir a mis unidades");
      else {
        if (previo !== u.id) { traerLista = null; bancoQ = ""; bancoTodo = false; abiertosR.clear(); previo = u.id; }
        if (partes[2] === "ronda") {
          if (partes[3] === "nueva") {
            const s = L.siguienteRonda(u, hoyIso()), r = Object.assign(L.nuevaRonda(genId(), s.fecha, s.turno), { hora: L.TURNOS[s.turno].hora });
            actual = u; u.rondas.push(r); L.sincronizar(u, r); tocado(u);
            history.replaceState(null, "", `#/unidad/${u.id}/ronda/${r.id}/1`); renderRonda(u, r, 1);
          } else {
            const r = u.rondas.find(x => x.id === partes[3]);
            if (!r) noEncontrado("esa ronda", `#/unidad/${u.id}/3`, "Ir a las rondas de la unidad");
            else { let n = parseInt(partes[4], 10); if (!(n >= 1 && n <= 5)) { n = 1; history.replaceState(null, "", `#/unidad/${u.id}/ronda/${r.id}/1`); } renderRonda(u, r, n); }
          }
        } else {
          let n = parseInt(partes[2], 10);
          if (!(n >= 1 && n <= 5)) { const g = L.progreso(u); n = [1, 2, 3].find(k => !g[k]) || 3; history.replaceState(null, "", `#/unidad/${u.id}/${n}${informe ? "?informe=1" : ""}`); }
          renderUnidad(u, n);
        }
      }
    } else if (partes[0] === "unidades") renderLista();
    else if (partes[0] === "ejemplos") renderEjemplos();
    else if (partes[0] === "aprende") renderAprende(parseInt(partes[1], 10) || 0);
    else if (partes[0] === "glosario") renderGlosario();
    else if (partes[0] === "prueba") renderPrueba(partes[1] === "practica" ? "practica" : Number(partes[1]) || 0);
    else { renderHome(); navR = ""; }
    if (modoEjemplo) navR = "ejemplos";
    if (informe) { $$("details").forEach(d => { d.open = true; }); if (esIOS()) prepararPDF(); }
    $$("#calc-nav a").forEach(a => a.classList.toggle("active", a.dataset.r === navR));
    const act = $("#calc-nav a.active"); if (act && act.scrollIntoView) act.scrollIntoView({ block: "nearest", inline: "center" });
    window.scrollTo(0, 0);
  }

  // ---------- Eventos ----------
  function tocado(u) {
    u.modificado = hoy();
    if (u === actual && !esVacia(u) && !datos.unidades.includes(u)) { datos.unidades.push(u); borradores.delete(u.id); }
    guardar();
  }
  function repintar() {
    const y = window.scrollY;
    if (rondaActual) renderRonda(actual, rondaActual, pasoRonda); else if (actual) renderUnidad(actual, pasoActual); else route();
    window.scrollTo(0, y);
  }
  const buscaEn = (lista, id) => lista.find(x => x.id === id);
  // Los cuadros de texto crecen con lo escrito
  function autoAlto(el) { el.style.height = "auto"; el.style.height = el.scrollHeight + 2 + "px"; }
  new MutationObserver(() => $$("textarea.txt-in", view).forEach(el => { if (!el.closest("[hidden]") && !el.closest("details:not([open])")) autoAlto(el); })).observe(view, { childList: true, subtree: true });

  view.addEventListener("input", e => {
    const t = e.target, u = actual, r = rondaActual;
    if (t.matches("textarea.txt-in")) autoAlto(t);
    if (t.id === "banco-q") { bancoQ = t.value; if (zonas.banco) $('[data-zona="banco"]', view).innerHTML = zonas.banco(); return; }
    if (!u) return;
    const f = t.dataset.f, esSel = t.tagName === "SELECT";
    if (t.dataset.m) { const m = buscaEn(u.equipo, t.dataset.m); if (!m) return; m[f] = t.value; tocado(u); if (esSel) repintar(); else refrescar(); return; }
    if (t.dataset.it) { const it = buscaEn(u.items, t.dataset.it); if (!it) return; it[f] = t.value; tocado(u); if (esSel && f === "bloque") repintar(); else refrescar(); return; }
    if (t.dataset.ab !== undefined) { u.abiertas[Number(t.dataset.ab)] = t.value; tocado(u); refrescar(); return; }
    if (t.dataset.ac) {
      const a = buscaEn(u.acciones, t.dataset.ac); if (!a) return;
      a[f] = t.value;
      tocado(u); if (esSel) repintar(); else refrescar(); return;
    }
    if (!r) { if (t.dataset.k) { setPath(u, t.dataset.k, t.value); tocado(u); refrescar(); } return; }
    if (t.dataset.rk) { setPath(r, t.dataset.rk, t.value); tocado(u); refrescar(); return; }
    if (t.dataset.ri) {
      const x = buscaEn(r.items, t.dataset.ri); if (!x) return; x[f] = t.value;
      // Si se cuentan casos y aún no hay respuesta, la cuenta la propone
      if ((f === "ok" || f === "de") && !x.valor) { const v = L.valorDeCuenta(x); if (v) { x.valor = v; tocado(u); repintar(); return; } }
      tocado(u); refrescar(); return;
    }
    if (t.dataset.cv) { const c = buscaEn(r.conversacion, t.dataset.cv); if (!c) return; c[f] = t.value; tocado(u); refrescar(); return; }
    if (t.dataset.h) { const h = buscaEn(r.hallazgos, t.dataset.h); if (!h) return; h[f] = t.value; tocado(u); refrescar(); return; }
  });
  view.addEventListener("change", e => {
    const t = e.target;
    if (t.dataset.act === "banco-todo") { bancoTodo = t.checked; if (zonas.banco) $('[data-zona="banco"]', view).innerHTML = zonas.banco(); }
  });
  view.addEventListener("toggle", e => {
    const el = e.target; if (!el.matches) return;
    if (el.matches("details[data-recordar]") && !document.body.classList.contains("ver-informe")) escribir(KEY_FACIL, el.open ? "1" : "0");
    if (el.matches("details[data-rmas]")) { if (el.open) { abiertosR.add(el.dataset.rmas); $$("textarea.txt-in", el).forEach(autoAlto); } else abiertosR.delete(el.dataset.rmas); }
  }, true);

  view.addEventListener("click", e => {
    const t = e.target; let b;
    if ((b = t.closest(".info-btn"))) { const h = $("#help-" + b.dataset.info); if (!h) return; const open = h.hidden; h.hidden = !open; b.setAttribute("aria-expanded", String(open)); return; }
    b = t.closest("[data-act]"); if (!b || b.tagName === "INPUT") return;
    const act = b.dataset.act, u = actual, r = rondaActual, id = b.dataset.id, v = b.dataset.v;
    switch (act) {
      case "copia": copiaSeguridad(); return;
      case "importar": $("#input-importar").click(); return;
      case "volver": location.hash = rutaActual(); return;
      case "imprimir": imprimir(); return;
      case "doc": irDoc(b.dataset.doc); return;
      case "doc-word": descargarWord(b.dataset.doc); return;
      case "excel": if (u) exportarExcel(u); return;
      case "quiz": { respuestas[Number(b.dataset.q)] = Number(b.dataset.o); const y = window.scrollY; renderPrueba(Number((location.hash.split("/")[2] || "").split("?")[0]) || 0); window.scrollTo(0, y); return; }
      case "quiz-reset": Object.keys(respuestas).forEach(k => delete respuestas[k]); renderPrueba(Number((location.hash.split("/")[2] || "")) || 0); return;
      case "ej": { respEj[b.dataset.k][Number(b.dataset.i)] = v; const y = window.scrollY; renderPractica(); window.scrollTo(0, y); return; }
      case "practica-reset": Object.keys(respEj).forEach(k => { respEj[k] = {}; }); renderPractica(); return;
      case "u-del": { const x = datosUsuario.unidades.find(y => y.id === id); if (!x) return;
        confirmar(`<p>Se borrará <b>${esc(nomUnidad(x))}</b> con su cuestionario, sus ${plural(x.rondas.length, "ronda", "rondas")} y sus ${plural(x.acciones.length, "acción", "acciones")}. Esto no se puede deshacer.</p><p class="field-sub">Si no tienes copia de seguridad, haz una antes.</p>`, "Borrar", () => { datosUsuario.unidades.splice(datosUsuario.unidades.indexOf(x), 1); guardar(true); renderLista(); toast("Unidad borrada.", 2500); }); return; }
      case "u-dup": { const x = datosUsuario.unidades.find(y => y.id === id); if (!x) return;
        const c = L.renovarIds(clon(x), genId); c.unidad = (c.unidad || "Unidad") + " (copia)"; c.creado = c.modificado = hoy();
        confirmar("<p>¿Duplicar también las rondas y las acciones? Si vas a montar el programa de otra unidad parecida, lo normal es copiar solo el programa y el cuestionario.</p>", "Solo programa y cuestionario", () => { c.rondas = []; c.acciones = []; datosUsuario.unidades.push(c); guardar(true); renderLista(); }, { peligro: false, otro: ["Todo", () => { datosUsuario.unidades.push(c); guardar(true); renderLista(); }] }); return; }
    }
    if (!u) return;
    switch (act) {
      // Paso 1
      case "ambito": u.ambito = u.ambito === v ? "" : v; tocado(u); repintar(); return;
      case "objetivo": { const i = u.objetivos.indexOf(v); if (i < 0) u.objetivos.push(v); else u.objetivos.splice(i, 1); tocado(u); repintar(); return; }
      case "frecuencia": u.frecuencia = u.frecuencia === v ? "" : v; tocado(u); repintar(); return;
      case "m-add": u.equipo.push(L.nuevoMiembro(genId(), v)); tocado(u); repintar(); return;
      case "m-del": u.equipo = u.equipo.filter(m => m.id !== id); tocado(u); repintar(); return;
      case "prop-circuito": {
        const txt = "El informe llega a la jefatura y a la supervisión de la unidad en menos de una semana. Las acciones se acuerdan con ellas; las que dependen de la dirección (obras, equipamiento, personal, informática) se elevan con fecha de respuesta. La ronda siguiente empieza comprobándolas.";
        const fn = () => { u.circuito = txt; tocado(u); repintar(); };
        if (lleno(u.circuito)) confirmar("<p>Se sustituirá lo que has escrito por el texto propuesto.</p>", "Sustituir", fn, { peligro: false }); else fn(); return; }
      // Paso 2
      case "banco": { const x = L.buscaBanco(id); if (!x || u.items.some(it => it.id === id)) return; u.items.push(L.itemDeBanco(x)); tocado(u); repintar(); return; }
      case "banco-quitar": u.items = u.items.filter(it => it.id !== id); tocado(u); repintar(); return;
      case "it-add": { const it = L.nuevoItem(genId()); u.items.push(it); tocado(u); repintar(); const el = $(`[data-it="${it.id}"][data-f="texto"]`); if (el) el.focus(); return; }
      case "it-del": { const it = buscaEn(u.items, id); if (!it) return; const fn = () => { u.items = u.items.filter(x => x.id !== id); tocado(u); repintar(); };
        if (lleno(it.texto) && it.origen !== "banco") confirmar(`<p>Se quitará la pregunta «${esc(corto(it.texto, 80))}» del cuestionario. Las rondas ya empezadas la conservan.</p>`, "Quitar", fn); else fn(); return; }
      case "ab-add": u.abiertas.push(""); tocado(u); repintar(); return;
      case "ab-sug": u.abiertas.push(v); tocado(u); repintar(); return;
      case "ab-del": u.abiertas.splice(Number(b.dataset.i), 1); tocado(u); repintar(); return;
      // [eco]
      case "traer-abrir": traerLista = traerDelNavegador(); if (!traerLista) { toast("En este navegador no hay datos de AMFE ni de Mapa de Riesgos. Carga su copia de seguridad (.json).", 4500); $("#input-amfe").click(); return; } repintar(); return;
      // [/eco]
      /* [ind]
      case "traer-abrir": $("#input-amfe").click(); return;
      [/ind] */
      case "traer-copia": $("#input-amfe").click(); return;
      case "traer-cerrar": traerLista = null; repintar(); return;
      case "traer-add": { const a = traerLista && traerLista.amfes.find(x => x.id === b.dataset.a), f = a && a.fallos.find(x => x.id === b.dataset.f); if (!f) return; u.items.push(L.itemDeFallo(genId, a, f)); tocado(u); repintar(); toast("Añadida como borrador: redáctala como algo que se vea y elige su bloque.", 3500); return; }
      // Paso 3
      case "calendario": {
        if (!u.items.some(it => lleno(it.texto))) { toast("Antes, prepara el cuestionario (paso 2).", 3500); return; }
        const fr = L.FRECUENCIAS[u.frecuencia] || L.FRECUENCIAS.mensual, n = Math.max(2, Math.round((fr.meses >= 6 ? 12 : 6) / fr.meses));
        confirmar(`<p>Se añadirán <b>${n} rondas</b> ${fr.nom.toLowerCase()}es${u.frecuencia ? "" : " (no has elegido frecuencia: se usa la mensual)"}, después de la última que tengas, rotando el turno: mañana, tarde, noche.</p><p class="field-sub">Luego puedes cambiar la fecha y el turno de cada una.</p>`, "Añadir el calendario", () => { L.proponerCalendario(u, hoyIso(), genId, n); tocado(u); repintar(); }, { peligro: false });
        return; }
      case "r-del": { const x = buscaEn(u.rondas, id); if (!x) return; const na = L.accionesDeRonda(u, x).length;
        confirmar(`<p>Se borrará la ronda <b>${esc(L.nombreRonda(x))}</b>${L.estadoRonda(x) !== "planificada" ? " con sus respuestas" : ""}${na ? ` y sus ${plural(na, "acción", "acciones")}` : ""}. Esto no se puede deshacer.</p>`, "Borrar", () => { u.rondas = u.rondas.filter(y => y.id !== id); u.acciones = u.acciones.filter(a => a.rondaId !== id); u.rondas.forEach(y => { Object.keys(y.revisadas).forEach(k => { if (!u.acciones.some(a => a.id === k)) delete y.revisadas[k]; }); }); tocado(u); repintar(); }); return; }
      // Acciones
      case "filtro-acc": filtroAcc = v; repintar(); return;
      case "ac-eleva": { const a = buscaEn(u.acciones, id); if (!a) return; a.eleva = !a.eleva; tocado(u); repintar(); return; }
      case "ac-del": { const a = buscaEn(u.acciones, id); if (!a) return; const fn = () => { u.acciones = u.acciones.filter(x => x.id !== id); u.rondas.forEach(y => { delete y.revisadas[id]; }); tocado(u); repintar(); };
        if (lleno(a.que)) confirmar(`<p>Se borrará la acción «${esc(corto(a.que, 80))}».</p>`, "Borrar", fn); else fn(); return; }
      case "ac-add-libre": { const ult = L.rondasHechas(u).pop() || L.rondasOrden(u)[0]; u.acciones.push(L.nuevaAccion(genId(), ult ? ult.id : "", "", "")); filtroAcc = "abiertas"; tocado(u); repintar(); return; }
      case "prop-concl": { const txt = L.conclusionesPropuestas(u, hoyIso()); if (!txt) return; const fn = () => { u.conclusiones = txt; tocado(u); repintar(); };
        if (lleno(u.conclusiones)) confirmar("<p>Se sustituirá lo que has escrito por el texto propuesto, con las cifras de las rondas.</p>", "Sustituir", fn, { peligro: false }); else fn(); return; }
    }
    if (!r) return;
    switch (act) {
      case "turno": r.turno = r.turno === v ? "" : v; if (r.turno && !lleno(r.hora)) r.hora = L.TURNOS[r.turno].hora; tocado(u); repintar(); return;
      case "r-equipo": r.equipo = u.equipo.filter(m => m.perfil !== "unidad" && (lleno(m.papel) || lleno(m.perfil))).map(m => lleno(m.papel) ? m.papel : L.PERFILES[m.perfil].nom).join("; ");
        if (!lleno(r.acompana)) { const ac = u.equipo.find(m => m.perfil === "unidad"); if (ac) r.acompana = (ac.papel || L.PERFILES.unidad.nom).replace(/\s*\(acompaña\)\s*$/, ""); }
        tocado(u); repintar(); return;
      case "revisar": L.revisar(u, r, id, v); tocado(u); repintar(); return;
      case "acc-sustituir": { const a0 = buscaEn(u.acciones, id); const a = L.nuevaAccion(genId(), r.id, "accion:" + id, ""); a.responsable = a0 ? a0.responsable : ""; a.eleva = a0 ? a0.eleva : false; u.acciones.push(a); tocado(u); location.hash = `#/unidad/${u.id}/ronda/${r.id}/5`; toast("Escribe la nueva acción: mejor si cambia el sistema.", 3500); return; }
      case "valor": { const x = buscaEn(r.items, id); if (!x) return; x.valor = x.valor === v ? "" : v; if (x.valor !== "no") x.resuelto = false; if (x.valor === "no") abiertosR.add(x.id); tocado(u); repintar(); return; }
      case "resuelto": { const x = buscaEn(r.items, id); if (!x) return; x.resuelto = !x.resuelto; tocado(u); repintar(); return; }
      case "h-add": r.hallazgos.push(L.nuevoHallazgo(genId())); tocado(u); repintar(); return;
      case "h-del": r.hallazgos = r.hallazgos.filter(h => h.id !== id); tocado(u); repintar(); return;
      case "h-resuelto": { const h = buscaEn(r.hallazgos, id); if (!h) return; h.resuelto = !h.resuelto; tocado(u); repintar(); return; }
      case "acc-de": {
        const o = b.dataset.o || "", a = L.nuevaAccion(genId(), r.id, o, "");
        if (/^conv:/.test(o)) a.que = ""; u.acciones.push(a); tocado(u); repintar();
        const el = $(`[data-ac="${a.id}"][data-f="que"]`); if (el) { el.scrollIntoView({ block: "center" }); el.focus(); }
        return; }
      case "prop-bien": { const txt = L.bienPropuesto(r); if (!txt) { toast("Aún no hay bloques sin incumplimientos ni respuesta del equipo sobre lo que va bien.", 3500); return; } const fn = () => { r.cierre.bien = txt; tocado(u); repintar(); }; if (lleno(r.cierre.bien)) confirmar("<p>Se sustituirá lo que has escrito por el texto propuesto.</p>", "Sustituir", fn, { peligro: false }); else fn(); return; }
      case "prop-resumen": { const txt = L.resumenPropuesto(u, r); if (!txt) return; const fn = () => { r.cierre.resumen = txt; tocado(u); repintar(); }; if (lleno(r.cierre.resumen)) confirmar("<p>Se sustituirá lo que has escrito por el texto propuesto, con las cifras de la ronda.</p>", "Sustituir", fn, { peligro: false }); else fn(); return; }
      case "cerrar": {
        const s = L.resultado(r), fn = () => { r.cerrada = true; if (!lleno(r.cierre.resumen)) r.cierre.resumen = L.resumenPropuesto(u, r); tocado(u); repintar(); toast("Ronda terminada. Ahora, el informe a la unidad en pocos días.", 4000); };
        if (s.sin) confirmar(`<p>Quedan <b>${plural(s.sin, "pregunta", "preguntas")}</b> sin responder: no contarán en el resultado.</p>`, "Terminar igualmente", fn, { peligro: false }); else fn(); return; }
      case "reabrir": r.cerrada = false; tocado(u); repintar(); return;
    }
  });

  // Banner de ejemplo
  $("#banner-copiar").addEventListener("click", copiarAMisDatos);
  // Importar una copia propia
  $("#input-importar").addEventListener("change", e => { const f = e.target.files && e.target.files[0]; e.target.value = ""; if (f) importar(f); });
  // Copia de seguridad de AMFE o de Mapa de Riesgos (para «Traer de…» desde otro dispositivo)
  $("#input-amfe").addEventListener("change", e => {
    const f = e.target.files && e.target.files[0]; e.target.value = ""; if (!f) return;
    const fr = new FileReader();
    fr.onload = () => {
      let l = null; try { l = L.leerFallos(JSON.parse(fr.result)); } catch (er) { l = { error: "No se puede leer ese archivo." }; }
      if (l.error) { toast(l.error, 4500); return; }
      traerLista = l; if (actual) repintar(); toast(`Cargados ${plural(l.amfes.length, "análisis", "análisis")}.`, 3000);
    };
    fr.readAsText(f);
  });

  // Imprimir: abrir los desplegables y restaurarlos después
  let cerrados = [];
  window.addEventListener("beforeprint", () => { cerrados = $$("details").filter(d => !d.open); cerrados.forEach(d => { d.open = true; }); });
  window.addEventListener("afterprint", () => { cerrados.forEach(d => { d.open = false; }); cerrados = []; });

  // ---------- Tema ----------
  function setTema(t) {
    document.documentElement.setAttribute("data-tema", t);
    const m = $("#meta-theme-color"); if (m) m.content = t === "claro" ? "#f0f7fb" : "#0d1b2a";
  }
  setTema(document.documentElement.getAttribute("data-tema") || "claro");
  $("#btn-tema").addEventListener("click", () => {
    const t = document.documentElement.getAttribute("data-tema") === "oscuro" ? "claro" : "oscuro";
    setTema(t); escribir("rondas-tema", t);
  });
  if (window.matchMedia) matchMedia("(prefers-color-scheme: dark)").addEventListener("change", ev => { if (!leer("rondas-tema")) setTema(ev.matches ? "oscuro" : "claro"); });

  // ---------- Modales ----------
  const KEY_BIENV = "rondas-bienvenida-vista";
  const mb = $("#modal-bienvenida"), ma = $("#modal-acerca");
  const vista = leer(KEY_BIENV);
  if (!vista) mb.hidden = false;
  $("#btn-bienv-ok").addEventListener("click", () => { if ($("#modal-no-repetir").checked) escribir(KEY_BIENV, "1"); mb.hidden = true; });
  $("#btn-acerca").addEventListener("click", () => { ma.hidden = false; });
  $("#btn-acerca-cerrar").addEventListener("click", () => { ma.hidden = true; });
  ma.addEventListener("click", e => { if (e.target === ma) ma.hidden = true; });
  document.addEventListener("keydown", e => { if (e.key === "Escape") { ma.hidden = true; $("#modal-confirmar").hidden = true; } });

  // ---------- Versiones y novedades ----------
  const KEY_VERSION = "rondas-version-vista";
  const listaCambios = n => `<div class="version-item"><div class="version-cab"><b>${esc(n.titulo)}</b><span class="version-tag">v${esc(n.version)} · ${esc(n.fecha)}</span></div><ul>${n.cambios.map(c => `<li>${esc(c)}</li>`).join("")}</ul></div>`;
  $("#historial-versiones").innerHTML = NOVEDADES.map(listaCambios).join("");
  $("#about-version").textContent = $("#footer-version").textContent = `Versión ${APP_VERSION}`;
  const mn = $("#modal-novedades");
  $("#btn-novedades-ok").addEventListener("click", () => { mn.hidden = true; escribir(KEY_VERSION, APP_VERSION); });
  (function gestionarNovedades() {
    const vistaV = leer(KEY_VERSION);
    if (vistaV === APP_VERSION) return;
    if (!vistaV && !vista) { escribir(KEY_VERSION, APP_VERSION); return; }
    const idx = NOVEDADES.findIndex(n => n.version === vistaV);
    const nuevas = idx > 0 ? NOVEDADES.slice(0, idx) : [NOVEDADES[0]];
    $("#novedades-sub").textContent = nuevas.length > 1 ? "Esto es lo nuevo desde tu última visita" : "Gracias por mantener la app al día";
    $("#novedades-body").innerHTML = nuevas.map(listaCambios).join("");
    if (mb.hidden) mn.hidden = false;
  })();

  // ---------- Service worker y aviso de nueva versión ----------
  let actualizando = false;
  function avisoActualizacion(reg) {
    if ($("#update-banner")) return;
    const b = document.createElement("div");
    b.id = "update-banner"; b.className = "update-banner no-print"; b.setAttribute("role", "status");
    b.innerHTML = "<span>Nueva versión disponible</span><button type=\"button\">Actualizar</button>";
    b.querySelector("button").addEventListener("click", () => { guardar(true); actualizando = true; if (reg.waiting) reg.waiting.postMessage({ type: "SKIP_WAITING" }); b.remove(); });
    document.body.appendChild(b);
  }
  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    navigator.serviceWorker.register("sw.js").then(reg => {
      if (reg.waiting && navigator.serviceWorker.controller) avisoActualizacion(reg);
      reg.addEventListener("updatefound", () => {
        const nw = reg.installing; if (!nw) return;
        nw.addEventListener("statechange", () => { if (nw.state === "installed" && navigator.serviceWorker.controller) avisoActualizacion(reg); });
      });
    }).catch(() => {});
    let recargando = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => { if (recargando || !actualizando) return; recargando = true; location.reload(); });
  }

  // ---------- Instalar como aplicación ----------
  let avisoInstalar = null;
  window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); avisoInstalar = e; const b = $("#btn-instalar"); if (b) b.hidden = false; });
  $("#btn-instalar").addEventListener("click", async () => { if (!avisoInstalar) return; avisoInstalar.prompt(); try { await avisoInstalar.userChoice; } catch (e) { /* */ } avisoInstalar = null; $("#btn-instalar").hidden = true; });
  window.addEventListener("appinstalled", () => { const b = $("#btn-instalar"); if (b) b.hidden = true; });
  if (matchMedia("(display-mode: standalone)").matches || navigator.standalone) { const i = $("#instalar-bloque"); if (i) i.classList.add("instalada"); }

  window.RondasSeguridad = { generarPDF, datos: () => datos };   // solo para pruebas desde la consola

  // ---------- Arranque ----------
  buildNav();
  window.addEventListener("hashchange", route);
  route();
})();

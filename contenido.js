// ============================================================
//  contenido.js — Solo datos · Rondas de Seguridad
//  Aprende (5 temas), glosario, «Ponte a prueba» y ejemplos. HTML de confianza
//  escrito a mano. Coherente con el capítulo 12 («Rondas de seguridad») de la
//  Guía de Calidad y Seguridad del Paciente de los autores. Los ejemplos
//  (Urgencias y la UGC de Atención Primaria) son casos docentes ficticios.
//  window.Contenido en navegador y module.exports en Node (tests).
// ============================================================
(function (raiz) {
  "use strict";
  const L = (typeof module !== "undefined" && module.exports) ? require("./logic.js") : raiz.Logica;

  // ---------- Aprende ----------
  // c = color del tema (clases pdca--P/H/V/A de styles.css, solo como color)
  const TEMAS = [
    { n: 1, c: "P", titulo: "Qué es una ronda de seguridad", sub: "Ir a donde ocurre la atención, mirar y preguntar",
      minuto: [
        "Una ronda es una <b>visita programada a la unidad</b> para comprobar, donde y cuando se atiende a los pacientes, si se aplican las prácticas seguras y qué riesgos ven los profesionales.",
        "Combina <b>mirar</b> (con una lista de preguntas que se responden sí, no o no aplica) y <b>escuchar</b> (preguntando al equipo).",
        "Es para <b>aprender y mejorar</b>, no para inspeccionar: sin nombres, empezando por lo que va bien y volviendo con respuestas."
      ],
      secciones: [
        { t: "Mirar y escuchar", h: "<p>Las auditorías de historias dicen lo que está registrado; los incidentes notificados, lo que alguien decidió contar. Pero muchos riesgos están a la vista y no constan en ningún sitio: una perfusión sin etiquetar, un carro de paradas sin revisar, un paciente sin pulsera, una camilla que tapa una salida. La ronda va a buscarlos.</p><p>Y hay otros que solo conoce el equipo: «de noche nadie tiene asignado mirar la sala de espera». Por eso la ronda siempre incluye una <b>conversación</b>.</p>" },
        { t: "Dos modalidades que se combinan", h: "<ul><li><b>Rondas de liderazgo</b> (en inglés, <i>WalkRounds</i>): directivos que visitan las unidades y preguntan a los profesionales por los incidentes, los casi-incidentes y lo que los facilita. Una variante pregunta también por <b>lo que va bien</b>, para reconocerlo.</li><li><b>Rondas con lista de verificación</b>: un equipo recorre la unidad con un cuestionario de prácticas seguras y comprueba cada ítem a pie de cama.</li></ul><p>Esta app sirve para las dos: el cuestionario es la lista de verificación y las preguntas abiertas, la conversación.</p>" },
        { t: "Lo que aporta (y lo que no)", h: "<p>Aporta lo que no está en ningún registro y lo que preocupa al equipo, implica a la dirección y transmite que la seguridad importa. Es barata: tiempo, un cuestionario bien pensado y voluntad de actuar.</p><p>No sustituye a las auditorías ni sirve para evaluar a cada profesional. Una ronda que no produce cambios enseña lo contrario de lo que pretendía.</p>" }
      ],
      minicaso: "La directora de enfermería hace su primera ronda en Urgencias a las tres de la madrugada y pregunta a la enfermera de turno qué podría hacerle daño al próximo paciente. «Que de noche nadie tiene asignado mirar la sala de espera. Nunca nos lo habían preguntado». Esa frase no estaba en ninguna notificación ni en ningún indicador, y acabó siendo una de las acciones más importantes del año.",
      practica: { href: "#/ejemplos", texto: "Ver el ejemplo de Urgencias" } },
    { n: 2, c: "P", titulo: "El programa de rondas", sub: "Antes de la primera ronda, decidid y escribid",
      minuto: [
        "<b>Objetivo</b>: comprobar las prácticas seguras, descubrir riesgos, escuchar al equipo, implicar a la dirección (o todo a la vez).",
        "<b>Frecuencia y equipo</b>: por ejemplo, una ronda al mes con dos o tres personas, y siempre un profesional de la unidad que acompaña.",
        "<b>Calendario con turnos variados</b> y un <b>circuito de respuesta</b>: quién recibe el informe, quién decide las acciones y cómo se comprueban."
      ],
      secciones: [
        { t: "El equipo de la ronda", h: "<p>Dos o tres personas: alguien de la <b>dirección o los mandos</b>, alguien de <b>calidad y seguridad</b> y, a ser posible, un profesional de <b>otra unidad</b> (mira con otros ojos). Siempre acompaña un profesional de la unidad visitada, por ejemplo la enfermera responsable del turno.</p><p>Más de cuatro personas intimidan y molestan la atención.</p>" },
        { t: "El calendario", h: "<p>Fechas conocidas por la unidad y <b>horarios variados</b>. En un servicio con ronda mensual: enero por la mañana, febrero por la tarde, marzo de madrugada, y vuelta a empezar; así, en un trimestre cada turno ha tenido su ronda. Muchas cosas solo se ven de noche o en fin de semana.</p><p>La app propone el calendario rotando los turnos según la frecuencia.</p>" },
        { t: "El circuito de respuesta", h: "<p>Escribid quién recibe el informe, cómo se deciden las acciones, cuáles se elevan a la dirección (obras, equipamiento, personal) y quién comprueba que se cumplen. Sin circuito, la ronda se queda en una visita.</p>" }
      ],
      minicaso: "Una planta de Medicina Interna hace cuatro rondas, todas un martes a las once. Todo sale bien. La primera ronda de noche descubre que el único aspirador que funciona está en la habitación del fondo y que la luz del control no deja leer las pulseras.",
      practica: { href: "#/unidad/nueva", texto: "Crear el programa de tu unidad" } },
    { n: 3, c: "H", titulo: "El cuestionario", sub: "Pocas preguntas, observables, por bloques, y una conversación",
      minuto: [
        "De <b>diez a veinte ítems</b> que se puedan comprobar en una hora, agrupados por <b>bloques</b> (identificación, medicación, infecciones, cuidados, equipos, entorno…).",
        "Cada ítem es <b>observable</b> y se responde <b>sí, no o no aplica</b>, sin ambigüedad, como un criterio de auditoría.",
        "Siempre <b>dos o tres preguntas abiertas</b>: ¿qué os preocupa?, ¿qué podría hacer daño a un paciente aquí?, ¿qué va bien?"
      ],
      secciones: [
        { t: "Ítems mal y bien redactados", h: "<table class=\"mini facil-tabla\"><tr><th>Mal redactado</th><th>Bien redactado</th></tr><tr><td>«La medicación está bien.»</td><td>«Los medicamentos de alto riesgo están separados y señalizados.»</td></tr><tr><td>«Se identifica a los pacientes.»</td><td>«Todos los pacientes en boxes y sala de espera llevan pulsera legible.»</td></tr><tr><td>«El carro de paradas está revisado.»</td><td>«El carro de paradas tiene registrada la revisión de las últimas 24 horas.»</td></tr></table><p>Palabras como «bien», «adecuado», «correcto» o «seguro» las entiende cada evaluador a su manera: la app avisa cuando las encuentra.</p>" },
        { t: "El banco de preguntas", h: "<p>En lugar de inventar el cuestionario en cada ronda, se elige de un <b>banco común</b> según los riesgos de la unidad. Así las rondas son comparables entre unidades y a lo largo del tiempo.</p><p>La mejor guía son los <b>fallos de vuestro mapa de riesgos</b> (o de vuestro AMFE) y vuestros indicadores. Con «Traer de AMFE o de Mapa de Riesgos», la app trae los fallos prioritarios como borradores de pregunta, con su número de fallo.</p>" },
        { t: "No copiéis el cuestionario de otro centro sin adaptarlo", h: "<p>Hay muchos modelos de ronda publicados o compartidos por otros hospitales. Sirven de inspiración, pero cada unidad tiene sus riesgos: un cuestionario de UCI no vale para un centro de salud. Y citad o pedid permiso cuando uséis el trabajo de otros. Las preguntas del banco de esta app son propias y son un punto de partida: cambiadlas a vuestra medida.</p>" }
      ],
      minicaso: "El cuestionario de una planta tiene 45 preguntas heredadas de otro hospital. La ronda dura dos horas y media, el equipo responde deprisa y nadie tiene tiempo de hablar con los profesionales. Al reducirlo a 16 preguntas elegidas del mapa de riesgos de la planta, la ronda dura una hora y sobra media hora para escuchar.",
      practica: { href: "#/prueba/practica", texto: "Practicar: ¿sirve este ítem?" } },
    { n: 4, c: "V", titulo: "Hacer la ronda", sub: "Para aprender, no para inspeccionar",
      minuto: [
        "<b>Presentaos</b> al responsable de turno y explicad el objetivo; <b>comprobad primero</b> las acciones de la ronda anterior.",
        "<b>Recorred</b> la unidad con el cuestionario y <b>hablad con el equipo</b> en un momento tranquilo; anotad sin nombres de pacientes ni de profesionales.",
        "<b>Cerrad</b> con el responsable de turno, empezando por lo que va bien. Lo peligroso y fácil de resolver se resuelve en el momento."
      ],
      secciones: [
        { t: "Los cinco momentos", h: "<ol><li><b>Presentarse</b> y explicar: aprender y mejorar, no inspeccionar.</li><li><b>Recorrer</b> la unidad con el cuestionario: observar, revisar los registros que indique el ítem y preguntar cuando haga falta, molestando lo menos posible.</li><li><b>Hablar con el equipo</b>: las preguntas abiertas, con los profesionales que estén, de todos los estamentos. Escuchar sin discutir.</li><li><b>Anotar</b> cada ítem (sí, no, no aplica) y lo que cuenta el equipo, sin nombres.</li><li><b>Cerrar</b> con el responsable de turno: un resumen breve, empezando por lo que va bien, y lo que se puede resolver en el momento.</li></ol>" },
        { t: "La conversación, en la práctica", h: "<p>Funciona mejor en un sitio tranquilo, con quien esté en ese momento, escuchando más que hablando. Frases que ayudan: «Cuéntame un ejemplo», «¿Qué crees que ayudaría?», «Esto lo puedo resolver yo; esto otro lo llevo a la dirección y te digo algo antes del día 15». Frases que cierran la conversación para siempre: «Eso ya lo sabemos», «Es que no hay presupuesto».</p>" },
        { t: "Lo que se arregla en el momento", h: "<p>Si aparece algo peligroso y fácil de resolver (un medicamento de alto riesgo fuera de su sitio, una pulsera que falta, una camilla que tapa una salida), se corrige allí mismo con el equipo y se anota como <b>resuelto en el momento</b>. Sigue contando como «no se cumple» en el resultado: es lo que se encontró.</p>" },
        { t: "Cómo se calcula el cumplimiento", h: "<p>Cumplimiento = ítems que se cumplen / (los que se cumplen + los que no) × 100. Los que <b>no aplican</b> quedan fuera. Con 12 sí, 2 no y 3 no aplica: 12 / 14 = 86 %.</p><p>Si contáis casos («7 de 8 pacientes con pulsera»), un solo caso que no cumple hace que el ítem no se cumpla: la app os avisa si la cuenta y la respuesta no casan.</p>" }
      ],
      minicaso: "En una ronda de marzo, de noche, en Urgencias, se cumplen doce de los catorce ítems. Dos no: dos pacientes mayores sin acompañante no están identificados en la pantalla, y una camilla en el pasillo tapa a medias una salida de emergencia (se retira en el momento). En la conversación, un celador cuenta que, cuando suben pacientes a planta de noche, a veces nadie de la planta sabe que van.",
      practica: { href: "#/unidad/ej-urg/ronda/r03/3", texto: "Ver esa ronda en el ejemplo" } },
    { n: 5, c: "A", titulo: "Devolver, actuar y seguir", sub: "La ronda siguiente empieza por la anterior",
      minuto: [
        "<b>Informe breve</b> a la unidad en pocos días: resultado por bloques, hallazgos, lo que contó el equipo y las acciones.",
        "<b>Acciones</b> con responsable, plazo y, si procede, indicador. Las que dependen de la dirección se elevan con fecha de respuesta.",
        "<b>Seguimiento</b>: cada ronda empieza comprobando las acciones de la anterior; cada cierto tiempo se miran todas juntas para ver qué falla una y otra vez."
      ],
      secciones: [
        { t: "Acciones que cambian las cosas", h: "<p>Una acción tiene <b>qué</b>, <b>quién</b> y <b>para cuándo</b>. Las medidas que cambian el sistema (un campo obligatorio, un registrador con alarma, retirar un producto) son <b>fuertes</b>; las que dependen de que la gente se acuerde (formar, recordar, poner un cartel) son <b>débiles</b>. Las débiles están bien como complemento, pero no solas cuando el riesgo es serio. La app marca la fuerza de cada medida.</p>" },
        { t: "Comprobar en la ronda siguiente", h: "<p>En la ronda de marzo, el equipo contó que la luz del pasillo de observación llevaba semanas fundida y que de noche no se leían las pulseras. En la de abril, lo primero que se comprobó fue que la luz estaba cambiada, y se le dijo al equipo quién lo había gestionado. Eso es lo que hace creíble el programa.</p><p>En la app, cada ronda tiene un paso «Comprobar lo pendiente»: resuelta, sigue pendiente o no ha funcionado. Si no ha funcionado, toca acordar otra, mejor si es más fuerte.</p>" },
        { t: "Mirar todas las rondas juntas", h: "<p>Cada cierto tiempo, revisad los resultados de todas las rondas: la evolución del cumplimiento, los bloques que fallan, las diferencias entre turnos y los <b>puntos calientes</b> (lo que no se cumple en dos de las últimas tres rondas, o en todas las de un turno).</p><p>Es material de primera para el <b>mapa de riesgos</b> y el <b>plan de auditorías</b>.</p>" }
      ],
      minicaso: "Al cabo de seis meses, la agregación de las rondas de Urgencias muestra que la identificación de los mayores sin acompañante falla en todas las rondas nocturnas. El equipo lo incorpora como hallazgo al plan de auditorías y como dato para la estrategia de frágiles de su DAFO.",
      practica: { href: "#/unidad/ej-urg/5", texto: "Ver el seguimiento del ejemplo" } }
  ];

  // ---------- Glosario ----------
  const GLOSARIO = [
    ["Ronda de seguridad", "Visita programada a una unidad para comprobar, donde y cuando se atiende a los pacientes, si se aplican las prácticas seguras, y para escuchar qué riesgos ve el equipo."],
    ["Ronda de liderazgo (WalkRounds)", "Modalidad en la que directivos visitan las unidades y preguntan a los profesionales por incidentes, casi-incidentes y lo que los facilita. La experiencia original se publicó en 2003."],
    ["Ronda con lista de verificación", "Modalidad en la que un equipo recorre la unidad con un cuestionario de prácticas seguras y comprueba cada ítem a pie de cama."],
    ["Programa de rondas", "Lo que se decide antes de la primera ronda: objetivo, unidades, frecuencia, equipo, calendario y circuito de respuesta."],
    ["Banco de preguntas", "Conjunto común de ítems del que cada unidad elige los suyos según sus riesgos. Hace comparables las rondas entre unidades y en el tiempo."],
    ["Ítem observable", "Pregunta que se puede comprobar viendo, revisando un registro o preguntando, y que se responde sí, no o no aplica sin interpretaciones."],
    ["Bloque", "Grupo de ítems de un mismo tema (identificación, medicamentos, infecciones, cuidados, equipos, entorno…). Ordena el recorrido y el resultado."],
    ["Preguntas abiertas", "Las dos o tres preguntas al equipo de cada ronda: qué os preocupa, qué podría hacer daño a un paciente aquí, qué funciona bien."],
    ["No aplica", "Respuesta para un ítem que no se puede valorar en esa ronda (por ejemplo, no hay ningún paciente con sujeción). Queda fuera del cálculo del cumplimiento."],
    ["Cumplimiento", "Porcentaje de ítems valorados que se cumplen: sí / (sí + no) × 100. Los «no aplica» no cuentan."],
    ["Hallazgo", "Lo que no se cumple o el riesgo que se descubre en la ronda, dentro o fuera del cuestionario."],
    ["Resuelto en el momento", "Hallazgo peligroso y fácil de arreglar que se corrige allí mismo con el equipo. Se anota, y sigue contando como «no se cumple»."],
    ["Acompañante de la unidad", "Profesional de la unidad visitada que acompaña al equipo de la ronda, normalmente el responsable del turno."],
    ["Circuito de respuesta", "Quién recibe el informe, quién decide las acciones, cuáles se elevan a la dirección y cómo se comprueba que se cumplen."],
    ["Acción de mejora", "Lo que se acuerda hacer ante un hallazgo, con responsable, plazo y, si procede, indicador."],
    ["Elevar a la dirección", "Pasar a la dirección una acción que la unidad no puede resolver sola (obras, equipamiento, personal, informática), con fecha de respuesta."],
    ["Comprobar lo pendiente", "Primer paso de cada ronda a partir de la segunda: ver si las acciones de la anterior se han hecho y han funcionado."],
    ["Fuerza de la medida", "Cuánto depende una acción de que la gente se acuerde. Fuerte: cambia el sistema (campo obligatorio, alarma). Débil: formar, recordar, poner un cartel."],
    ["Punto caliente", "Ítem que no se cumple una y otra vez: en dos de las últimas tres rondas, o en todas las rondas de un mismo turno."],
    ["Agregación", "Mirar juntas todas las rondas de un periodo para ver tendencias, diferencias entre turnos y lo que falla siempre."],
    ["Turno", "Mañana, tarde, noche o fin de semana. Los riesgos cambian con el turno: por eso el calendario los alterna."],
    ["Informe de la ronda", "Documento breve que recibe la unidad en pocos días: resultado por bloques, lo que va bien, hallazgos, lo que contó el equipo y acciones."],
    ["Incidente y casi-incidente", "Suceso que causa (o pudo causar) daño al paciente. El casi-incidente no llegó al paciente o no le causó daño, pero avisa de un riesgo."],
    ["Mapa de riesgos", "Documento que recoge los riesgos de un proceso, su prioridad y sus medidas. Sus fallos son la mejor guía para elegir los ítems; los puntos calientes de las rondas lo alimentan."],
    ["AMFE", "Análisis modal de fallos y efectos: método para anticipar qué puede fallar en un proceso, con qué gravedad y probabilidad, y qué hacer. Cada fallo tiene un número."],
    ["Cultura de seguridad", "Lo que una organización piensa, valora y hace respecto a la seguridad del paciente. Las rondas bien hechas la mejoran."],
    ["Indicador", "Medida que permite comprobar si una acción funciona, por ejemplo el porcentaje de mayores sin acompañante marcados en la pantalla."]
  ];

  // ---------- Ponte a prueba ----------
  const TEMAS_TEST = {
    1: { nom: "Qué es y para qué", aprende: 1 },
    2: { nom: "El programa y el cuestionario", aprende: 3 },
    3: { nom: "La ronda y después", aprende: 5 }
  };
  const Q = (t, q, o, ok, e) => ({ t, q, o, ok, e });
  const TEST = [
    Q(1, "¿Qué aporta una ronda de seguridad que no aporta la revisión de historias clínicas?", ["Nada.", "Detecta riesgos visibles que no constan en ningún registro y recoge lo que preocupa al equipo.", "Sustituye a las auditorías.", "Sirve para evaluar a cada profesional."], 1, "Ve lo que no está registrado y escucha al equipo; no sustituye a las auditorías ni evalúa a personas."),
    Q(1, "¿Qué distingue a las rondas de liderazgo?", ["Que las hacen los residentes.", "Que los directivos visitan las unidades y preguntan a los profesionales por los riesgos e incidentes.", "Que no hay conversación.", "Que solo revisan historias."], 1, "Directivos que visitan, preguntan y escuchan."),
    Q(1, "¿Con qué espíritu se hace una ronda?", ["Inspeccionar y sancionar.", "Aprender y mejorar con el equipo.", "Comprobar quién falla.", "Cumplir un trámite."], 1, "Si parece una inspección, el equipo se cierra y la ronda deja de ver lo importante."),
    Q(1, "¿Por qué importa que en la ronda participe alguien de la dirección?", ["Para controlar al equipo.", "Su presencia transmite que la seguridad importa y puede decidir sobre lo que se encuentre.", "Porque lo exige la ley.", "No importa."], 1, "La presencia de la dirección es parte de la intervención, siempre que escuche y vuelva con respuestas."),
    Q(1, "Una variante de las rondas de liderazgo pregunta también…", ["Por el sueldo de cada profesional.", "Por lo que va bien, para reconocerlo.", "Por los errores de cada persona.", "Por el número de pacientes."], 1, "Preguntar por lo que va bien se ha asociado a una mejor cultura de seguridad."),
    Q(2, "¿Cuál es un buen ítem de ronda?", ["«La unidad es segura».", "«El carro de paradas tiene registrada la revisión de las últimas 24 horas».", "«El personal está concienciado».", "«Hay buena comunicación»."], 1, "Observable, concreto y sin ambigüedad."),
    Q(2, "¿Cuántos ítems conviene que tenga el cuestionario de una ronda?", ["De tres a cinco.", "De diez a veinte.", "De cuarenta a sesenta.", "Todos los del banco."], 1, "Los justos para comprobarlos en una hora y que quede tiempo para hablar con el equipo."),
    Q(2, "¿De dónde salen mejor los ítems de una unidad?", ["Del cuestionario de otro hospital, tal cual.", "De un banco común, eligiendo según el mapa de riesgos y los indicadores de la unidad.", "Se inventan en cada ronda.", "Solo del último incidente."], 1, "Un banco común hace comparables las rondas; el mapa de riesgos dice cuáles importan en vuestra unidad."),
    Q(2, "¿Qué horario conviene para las rondas?", ["Siempre por la mañana.", "Variado: mañana, tarde, noche y fin de semana.", "Solo de noche.", "Cuando haya poco trabajo."], 1, "Muchos riesgos solo se ven en algunos turnos."),
    Q(2, "¿Cómo debería ser el equipo de la ronda?", ["Una sola persona.", "Dos o tres personas (dirección o mandos, calidad, alguien de otra unidad) y un profesional de la unidad que acompaña.", "Diez personas, para no dejarse nada.", "Solo personal de la unidad."], 1, "Pocas personas, con perfiles distintos, y siempre alguien de la unidad."),
    Q(3, "En la ronda veis un medicamento de alto riesgo fuera de su sitio. ¿Qué hacéis?", ["Esperar al informe.", "Corregirlo en el momento con el equipo y anotarlo como resuelto.", "Buscar quién lo dejó ahí.", "Nada."], 1, "Lo peligroso y fácil se corrige en el momento, y se anota."),
    Q(3, "¿Cómo debe empezar cada ronda, a partir de la segunda?", ["Con un ítem nuevo.", "Comprobando las acciones de la ronda anterior.", "Con una sanción.", "Con una encuesta."], 1, "Comprobar lo pendiente hace creíble el programa."),
    Q(3, "¿Cómo se anotan los hallazgos?", ["Con el nombre del profesional responsable.", "Sin nombres de pacientes ni de profesionales.", "Con el número de historia del paciente.", "No se anotan."], 1, "La ronda mira el sistema, no a las personas; y protege los datos de los pacientes."),
    Q(3, "¿Cuándo debe llegar el informe a la unidad?", ["Al cabo de un año.", "En pocos días.", "Solo si hay incumplimientos.", "Nunca: basta con la conversación."], 1, "Un informe que tarda meses dice que la ronda no importaba."),
    Q(3, "Un ítem no se cumple en ninguna de las rondas de noche. ¿Qué hacéis?", ["Nada: de noche hay menos personal.", "Llevarlo al mapa de riesgos y al plan de auditorías y buscar una acción que cambie el sistema.", "Quitar el ítem del cuestionario.", "Hacer las rondas solo de día."], 1, "Es un punto caliente: lo que falla siempre en un turno pide una medida fuerte."),
    Q(3, "Una ronda tiene 12 sí, 2 no y 3 no aplica. ¿Cuál es su cumplimiento?", ["71 %.", "86 %.", "100 %.", "82 %."], 1, "12 / (12 + 2) = 86 %. Los «no aplica» quedan fuera del cálculo.")
  ];
  const EJERCICIOS = {
    // ¿Sirve este ítem? (los tests comprueban que la app lo reconoce igual)
    sirve: [
      { texto: "La medicación está bien.", k: "no" },
      { texto: "Los medicamentos de alto riesgo están separados y señalizados.", k: "bien" },
      { texto: "Se identifica a los pacientes.", k: "no" },
      { texto: "Todos los pacientes en boxes y sala de espera llevan pulsera legible.", k: "bien" },
      { texto: "El carro de paradas está revisado.", k: "no" },
      { texto: "El carro de paradas tiene registrada la revisión de las últimas 24 horas.", k: "bien" },
      { texto: "El personal está concienciado con la higiene de manos.", k: "no" },
      { texto: "La unidad es segura para los pacientes.", k: "no" },
      { texto: "Los contenedores de punzantes no superan su línea de llenado.", k: "bien" },
      { texto: "Hay buena comunicación en el equipo.", k: "no" }
    ],
    // ¿Se resuelve en el momento o se acuerda una acción?
    momento: [
      { texto: "Un medicamento de alto riesgo está fuera de su sitio.", k: "momento", por: "Se coloca en su sitio con el equipo y se anota como resuelto." },
      { texto: "A un paciente de la sala de espera le falta la pulsera.", k: "momento", por: "Se le pone en ese momento; si pasa a menudo, además, una acción." },
      { texto: "Una camilla tapa a medias una salida de emergencia.", k: "momento", por: "Se retira en el momento y se anota." },
      { texto: "El contenedor de punzantes del box supera la línea de llenado.", k: "momento", por: "Se cambia en el momento." },
      { texto: "De noche nadie tiene asignado mirar la sala de espera.", k: "accion", por: "Pide una acción con responsable: asignarlo en la hoja de turno." },
      { texto: "La nevera de vacunas no registra la temperatura del fin de semana.", k: "accion", por: "Pide una acción (un registrador con alarma), que probablemente se eleva a la dirección." },
      { texto: "En el triaje no hay forma de marcar a los mayores que vienen solos.", k: "accion", por: "Pide un cambio en el sistema informático: se eleva con fecha de respuesta." },
      { texto: "Cuando suben pacientes a planta de noche, a veces la planta no sabe que van.", k: "accion", por: "Pide acordar un circuito con las plantas." }
    ]
  };

  // ---------- Ejemplos (casos docentes ficticios) ----------
  // Constructores compactos: todo lo no indicado se cumple («sí»).
  function unidadEj(o) {
    const u = Object.assign(L.nuevaUnidad(o.id, "2026-01-08T09:00:00.000Z"), { modificado: o.modificado || "2026-10-20T09:00:00.000Z" });
    ["unidad", "ambito", "objetivos", "objetivo", "frecuencia", "circuito", "responsable", "conclusiones"].forEach(k => { if (o[k] !== undefined) u[k] = o[k]; });
    if (o.abiertas) u.abiertas = o.abiertas.slice();
    u.equipo = (o.equipo || []).map((m, i) => ({ id: "m" + (i + 1), perfil: m[0], papel: m[1] }));
    u.items = o.items.map(x => { if (typeof x === "string") return L.itemDeBanco(L.buscaBanco(x)); const [id, amfe] = x; const b = L.buscaBanco(id); return b ? Object.assign(L.itemDeBanco(b), { amfe: amfe || "" }) : Object.assign(L.nuevoItem(id, amfe.bloque, amfe.texto), { origen: "" }); });
    u.rondas = (o.rondas || []).map(r => rondaEj(u, r));
    u.acciones = (o.acciones || []).map(a => Object.assign(L.nuevaAccion(a.id, a.ronda, a.origen || "", a.que), { responsable: a.resp || "", plazo: a.plazo || "", eleva: !!a.eleva, indicador: a.ind || "", estado: a.estado || "pendiente", comprobada: a.comprobada || "", nota: a.nota || "" }));
    return u;
  }
  function rondaEj(u, o) {
    const r = Object.assign(L.nuevaRonda(o.id, o.fecha, o.turno), { hora: o.hora || L.TURNOS[o.turno].hora, equipo: o.equipo || "", acompana: o.acompana || "" });
    r.items = u.items.map(L.nuevaRespuesta);
    r.conversacion = u.abiertas.map((p, i) => ({ id: "c" + (i + 1), pregunta: p, respuesta: (o.conv || [])[i] || "" }));
    if (!o.planificada) {
      r.items.forEach(x => {
        x.valor = o.no && o.no[x.id] !== undefined ? "no" : (o.na || []).includes(x.id) ? "na" : o.sin && o.sin.includes(x.id) ? "" : "si";
        if (x.valor === "no") { x.nota = o.no[x.id]; x.resuelto = (o.resueltos || []).includes(x.id); }
        if (o.cuentas && o.cuentas[x.id]) { x.ok = String(o.cuentas[x.id][0]); x.de = String(o.cuentas[x.id][1]); }
      });
      r.hallazgos = (o.hall || []).map((h, i) => ({ id: "h" + (i + 1), texto: h[0], resuelto: !!h[1] }));
      r.revisadas = o.revisadas || {};
      r.cierre = { bien: o.bien || "", resumen: o.resumen || "" };
      r.cerrada = o.cerrada !== false;
      r.informe = { fecha: o.informe || "", destinatarios: o.destinatarios || "" };
    }
    return r;
  }

  // Servicio de Urgencias: ronda mensual (mañana, tarde, noche…), 14 ítems y 3 preguntas abiertas (capítulo 12)
  const EQ_URG = "Responsable de seguridad del área; supervisora de enfermería de otra unidad", EQ_URG_DIR = EQ_URG + "; dirección de enfermería", ACOMP = "Enfermera responsable del turno";
  const DEST_URG = "Jefatura y supervisión de Urgencias";
  const urgencias = unidadEj({
    id: "ej-urg", unidad: "Servicio de Urgencias (caso docente)", ambito: "urg", frecuencia: "mensual",
    objetivos: ["adherencia", "riesgos", "escuchar", "direccion"],
    objetivo: "Complementar las auditorías de historias: la ronda mira lo que no se registra, en los tres turnos.",
    responsable: "Responsable de seguridad del área",
    equipo: [["calidad", "Responsable de seguridad del área"], ["otra", "Supervisora de enfermería de otra unidad del hospital"], ["direccion", "Dirección médica o de enfermería, una vez al trimestre"], ["unidad", "Enfermera responsable del turno (acompaña)"]],
    circuito: "El informe llega a la jefatura y a la supervisión de Urgencias en menos de una semana. Las acciones se acuerdan con ellas; las que dependen de la dirección (obras, informática, personal) se elevan a la comisión de seguridad con fecha de respuesta. La ronda siguiente empieza comprobándolas.",
    items: [["id-02", "11, 18, 29"], ["id-03", "30"], ["reg-01", "10"], ["com-01", "15, 16"], ["cui-08", "9, 16"], "med-01", "equ-01", "ent-01", "inf-01", "med-02", "inf-06", "id-06", "cui-02", "equ-03"],
    rondas: [
      { id: "r01", fecha: "2026-01-15", turno: "manana", equipo: EQ_URG_DIR, acompana: ACOMP, informe: "2026-01-19", destinatarios: DEST_URG,
        no: { "med-02": "Dos perfusiones sin etiqueta en el box 3: se acaban las etiquetas y no hay repuesto.", "inf-06": "El contenedor de punzantes del box 5 supera la línea de llenado." }, resueltos: ["inf-06"],
        cuentas: { "id-02": [9, 9] },
        conv: ["Las etiquetas de perfusión se acaban a media tarde y no hay repuesto en los boxes.", "Los pacientes que esperan en camilla en el pasillo sin que nadie los vea un rato largo.", "El triaje con las cuatro constantes: lo hacemos siempre."],
        bien: "Identificación, triaje, entorno y equipos: todo lo comprobado se cumple. El equipo destaca el triaje con las cuatro constantes." },
      { id: "r02", fecha: "2026-02-18", turno: "tarde", equipo: EQ_URG, acompana: ACOMP, informe: "2026-02-23", destinatarios: DEST_URG, revisadas: { a01: "ok" },
        no: { "cui-08": "Tres pacientes mayores solos en la sala de espera; en la pantalla no se distingue quién va sin acompañante.", "id-02": "Un paciente de la sala de espera sin pulsera." }, resueltos: ["id-02"],
        conv: ["Por la tarde se juntan las ambulancias y la sala de espera se queda sin nadie mirando.", "Un mayor que viene solo y empeora en la sala de espera sin que nadie lo vea.", "Ya hay etiquetas de perfusión en todos los boxes."] },
      { id: "r03", fecha: "2026-03-12", turno: "noche", equipo: EQ_URG, acompana: ACOMP, informe: "2026-03-16", destinatarios: DEST_URG, revisadas: { a02: "sigue" },
        no: { "cui-08": "Dos pacientes mayores sin acompañante en la sala de espera no están identificados en la pantalla.", "ent-01": "Una camilla en el pasillo tapa a medias una salida de emergencia." }, resueltos: ["ent-01"],
        conv: ["Un celador cuenta que, cuando suben pacientes a planta de noche, a veces nadie de la planta sabe que van (fallo 45 del AMFE).", "La luz del pasillo de observación lleva semanas fundida: de noche no se leen las pulseras.", "El carro de paradas está siempre revisado, también de noche."],
        bien: "Identificación con pulsera, triaje, medicación y equipos: todo lo comprobado se cumple. El equipo destaca que el carro de paradas está siempre revisado, también de noche." },
      { id: "r04", fecha: "2026-04-16", turno: "manana", equipo: EQ_URG_DIR, acompana: ACOMP, informe: "2026-04-20", destinatarios: DEST_URG, revisadas: { a02: "sigue", a03: "ok", a04: "sigue" },
        no: { "equ-01": "La revisión del carro de paradas de la noche anterior no está firmada." }, resueltos: ["equ-01"],
        conv: ["Que el aviso de los traslados a planta todavía no está claro.", "Las camillas del pasillo cuando hay mucha presión.", "Se nota que lo de la luz se arregló rápido, y nos dijisteis quién lo había gestionado."] },
      { id: "r05", fecha: "2026-05-14", turno: "tarde", equipo: EQ_URG, acompana: ACOMP, informe: "2026-05-18", destinatarios: DEST_URG, revisadas: { a02: "sigue", a04: "ok" },
        no: { "med-02": "Una perfusión sin la hora de inicio." }, resueltos: ["med-02"],
        conv: ["Que el campo de «sin acompañante» llegue ya.", "La espera larga de los pacientes pendientes de cama.", "El aviso a planta antes de subir funciona: ahora llamamos siempre."] },
      { id: "r06", fecha: "2026-06-11", turno: "noche", equipo: EQ_URG_DIR, acompana: ACOMP, informe: "2026-06-15", destinatarios: DEST_URG, revisadas: { a02: "mal" },
        no: { "cui-08": "El campo «sin acompañante» ya existe, pero de noche no se rellena: dos mayores solos sin marcar.", "id-03": "Dos camillas del pasillo sin el nombre del paciente visible." },
        conv: ["De noche, con un solo administrativo, el campo nuevo se queda sin rellenar.", "Las camillas del pasillo: no hay dónde poner el nombre.", "La llamada a planta antes de subir."] },
      { id: "r07", fecha: "2026-07-16", turno: "manana", equipo: EQ_URG, acompana: ACOMP, informe: "2026-07-20", destinatarios: DEST_URG, revisadas: { a05: "ok", a06: "sigue" },
        no: { "inf-01": "Falta solución hidroalcohólica en dos boxes." }, resueltos: ["inf-01"],
        conv: ["Las sustituciones del verano: mucha gente nueva que no conoce la unidad.", "Que el personal nuevo no sepa dónde está el carro de paradas.", "Los portanombres de las camillas."] },
      { id: "r08", fecha: "2026-08-20", turno: "tarde", equipo: EQ_URG, acompana: ACOMP, informe: "2026-08-24", destinatarios: DEST_URG, revisadas: { a06: "sigue" },
        no: { "id-06": "Un paciente con alergia registrada en la historia sin distintivo en la pulsera." }, resueltos: ["id-06"],
        conv: ["Las alergias que se registran pero no se señalan en la pulsera.", "Las tardes de agosto con la sala llena.", "El equipo de tarde se organiza bien para la reevaluación de la sala."] },
      { id: "r09", fecha: "2026-09-17", turno: "noche", equipo: EQ_URG_DIR, acompana: ACOMP, informe: "2026-09-21", destinatarios: DEST_URG, revisadas: { a06: "sigue" },
        no: { "cui-08": "Sigue sin rellenarse de noche: un mayor solo sin marcar en la pantalla.", "com-01": "Esta noche nadie tiene asignada la reevaluación de la sala de espera." },
        conv: ["Que el campo obligatorio aún no está y de noche se nos pasa.", "Que de noche nadie tiene asignado mirar la sala de espera.", "La llamada a planta y los portanombres siguen funcionando."] },
      { id: "r10", fecha: "2026-10-29", turno: "manana", planificada: true },
      { id: "r11", fecha: "2026-11-19", turno: "tarde", planificada: true }
    ],
    acciones: [
      { id: "a01", ronda: "r01", origen: "item:med-02", que: "Dejar etiquetas preimpresas de perfusión en cada box y añadirlas a la reposición diaria.", resp: "Supervisión de enfermería de Urgencias", plazo: "2026-02-15", estado: "comprobada", comprobada: "r02" },
      { id: "a02", ronda: "r02", origen: "item:cui-08", que: "Pedir a informática un campo «sin acompañante» en el triaje que se vea en la pantalla de la sala de espera.", resp: "Coordinación médica de Urgencias", plazo: "2026-05-31", eleva: true, ind: "% de mayores de 75 años sin acompañante marcados en la pantalla", estado: "ineficaz", comprobada: "r06", nota: "El campo se creó en mayo, pero de noche no se rellena." },
      { id: "a03", ronda: "r03", origen: "conv:c2", que: "Cambiar la luz del pasillo de observación.", resp: "Supervisión de enfermería con Mantenimiento", plazo: "2026-03-26", estado: "comprobada", comprobada: "r04" },
      { id: "a04", ronda: "r03", origen: "conv:c1", que: "Llevar a la reunión con las plantas el aviso previo de los traslados nocturnos y acordar un circuito (llamada a la planta antes de subir).", resp: "Supervisión de enfermería de Urgencias", plazo: "2026-04-30", eleva: true, estado: "comprobada", comprobada: "r05" },
      { id: "a05", ronda: "r06", origen: "item:id-03", que: "Instalar un portanombres fijo en las camillas del pasillo.", resp: "Supervisión de enfermería de Urgencias", plazo: "2026-07-15", estado: "comprobada", comprobada: "r07" },
      { id: "a06", ronda: "r06", origen: "accion:a02", que: "Hacer obligatorio el campo «sin acompañante»: que el triaje no se pueda cerrar sin rellenarlo.", resp: "Coordinación médica de Urgencias con Informática", plazo: "2026-09-30", eleva: true, ind: "% de mayores de 75 años con el campo relleno", estado: "curso", nota: "Informática lo tiene en su lista; sin fecha confirmada." },
      { id: "a07", ronda: "r09", origen: "item:com-01", que: "Asignar en la hoja de turno de noche quién reevalúa la sala de espera.", resp: "Supervisión de enfermería de Urgencias", plazo: "2026-10-15", estado: "hecha" }
    ]
  });

  // UGC de Atención Primaria: ronda trimestral muy breve, 10 ítems (capítulo 12, caja «En Atención Primaria»)
  const EQ_AP = "Referente de seguridad de la UGC; dirección de la UGC", ACOMP_AP = "Enfermera responsable de la sala de curas";
  const ugc = unidadEj({
    id: "ej-ugc", unidad: "UGC de Atención Primaria (caso docente)", ambito: "ap", frecuencia: "trimestral", objetivos: ["adherencia", "escuchar"],
    objetivo: "Media hora en la sala de curas y extracciones, la consulta de urgencias y el almacén de medicación.",
    responsable: "Referente de seguridad de la UGC",
    equipo: [["calidad", "Referente de seguridad de la UGC"], ["direccion", "Dirección de la UGC"], ["unidad", "Enfermera responsable de la sala de curas (acompaña)"]],
    circuito: "El informe se comenta en la reunión de equipo siguiente. Las acciones que dependen del distrito se elevan a la dirección de la UGC.",
    abiertas: ["¿Qué creéis que podría hacer daño a un paciente aquí?", "¿Qué está funcionando bien?"],
    items: ["med-05", "med-06", "med-07", "equ-02", "equ-03", "id-05", "id-07", "inf-06", "inf-01", "cul-01"],
    rondas: [
      { id: "r1", fecha: "2026-01-22", turno: "manana", equipo: EQ_AP, acompana: ACOMP_AP, informe: "2026-01-26", destinatarios: "Equipo de la UGC",
        no: { "med-05": "La nevera de vacunas no tiene registro de temperatura del fin de semana.", "med-06": "Dos sueros caducados en la sala de curas." }, resueltos: ["med-06"],
        conv: ["Que un lunes se vacune con dosis que han estado fuera de rango el fin de semana sin saberlo.", "La organización de la sala de extracciones."] },
      { id: "r2", fecha: "2026-04-23", turno: "tarde", equipo: EQ_AP, acompana: ACOMP_AP, informe: "2026-04-27", destinatarios: "Equipo de la UGC", revisadas: { b1: "ok" },
        conv: ["Las muestras de la tarde que esperan al transporte del día siguiente.", "El registrador de la nevera: avisa al móvil del centro."] },
      { id: "r3", fecha: "2026-07-16", turno: "manana", equipo: EQ_AP, acompana: ACOMP_AP, informe: "2026-07-20", destinatarios: "Equipo de la UGC",
        no: { "inf-06": "El contenedor de punzantes de la consulta de urgencias supera la línea de llenado." }, resueltos: ["inf-06"],
        conv: ["El verano con menos personal en la consulta de urgencias.", "La revisión del carro de paradas, siempre al día."] },
      { id: "r4", fecha: "2026-10-30", turno: "tarde", planificada: true }
    ],
    acciones: [{ id: "b1", ronda: "r1", origen: "item:med-05", que: "Instalar un registrador continuo de temperatura con alarma en la nevera de vacunas.", resp: "Dirección de la UGC", plazo: "2026-03-31", eleva: true, estado: "comprobada", comprobada: "r2" }]
  });

  // Minicasos: cada uno con los errores típicos del paso que trabaja (se abren en ese paso)
  const miniEterno = unidadEj({
    id: "ej-mini-eterno", unidad: "Planta de Cirugía (minicaso)", ambito: "hosp", frecuencia: "mensual", objetivos: ["adherencia"], equipo: [["calidad", "Referente de seguridad"]],
    abiertas: [],
    items: [["x1", { bloque: "med", texto: "La medicación está bien." }], ["x2", { bloque: "id", texto: "Se identifica a los pacientes." }], ["x3", { bloque: "equ", texto: "El carro de paradas está revisado." }], ["x4", { bloque: "cul", texto: "El personal está concienciado con la seguridad." }],
      "id-01", "id-04", "id-06", "med-01", "med-02", "med-04", "med-06", "med-07", "med-09", "inf-01", "inf-02", "inf-03", "inf-04", "inf-06", "cui-01", "cui-02", "cui-03", "cui-05", "cui-07", "equ-01", "ent-01", "reg-03"]
  });
  const miniManana = unidadEj({
    id: "ej-mini-manana", unidad: "Medicina Interna (minicaso)", ambito: "hosp", frecuencia: "mensual", objetivos: ["adherencia", "riesgos"], equipo: [["calidad", "Referente de seguridad"], ["direccion", "Supervisión de enfermería"]],
    circuito: "El informe va a la supervisión.",
    items: ["id-01", "id-06", "med-01", "med-02", "med-07", "inf-01", "inf-03", "cui-01", "cui-02", "cui-07", "equ-01", "equ-04", "ent-04", "com-02"],
    rondas: [
      { id: "m1", fecha: "2026-06-09", turno: "manana", equipo: "Referente de seguridad; supervisión de enfermería", acompana: "Enfermera responsable del turno", informe: "2026-06-12", conv: ["Nada especial.", "", "Todo va bien."] },
      { id: "m2", fecha: "2026-07-07", turno: "manana", equipo: "Referente de seguridad; supervisión de enfermería", acompana: "Enfermera responsable del turno", informe: "2026-07-10", conv: ["Nada especial.", "", "Todo va bien."] },
      { id: "m3", fecha: "2026-08-04", turno: "manana", equipo: "Referente de seguridad; supervisión de enfermería", acompana: "Enfermera responsable del turno", informe: "2026-08-07", conv: ["Nada especial.", "", "Todo va bien."] },
      { id: "m4", fecha: "2026-09-08", turno: "manana", planificada: true }
    ]
  });
  const miniSinRespuesta = unidadEj({
    id: "ej-mini-sinrespuesta", unidad: "Hospital de día oncológico (minicaso)", ambito: "amb", frecuencia: "trimestral", objetivos: ["adherencia"], equipo: [["calidad", "Referente de seguridad"], ["direccion", "Jefatura de servicio"]],
    items: ["id-04", "id-06", "med-01", "med-02", "med-06", "med-07", "inf-01", "inf-03", "inf-04", "inf-06", "equ-02", "equ-03", "pro-05", "pro-07"],
    rondas: [{ id: "s1", fecha: "2026-09-24", turno: "manana", equipo: "Referente de seguridad; jefatura de servicio", acompana: "Enfermera responsable del turno",
      no: { "pro-07": "", "med-02": "", "inf-04": "" }, conv: ["Que con tanta carga a veces no da tiempo al doble chequeo.", "", ""], cerrada: false }],
    acciones: [{ id: "s1a", ronda: "s1", origen: "item:pro-07", que: "Recordar al equipo en una sesión que hay que verificar el citostático entre dos." }]
  });

  const EJEMPLOS = {
    unidades: [urgencias, ugc, miniEterno, miniManana, miniSinRespuesta],
    fichas: [
      { t: "1 · El programa", s: "Objetivo, equipo, frecuencia mensual y circuito de respuesta", href: "#/unidad/ej-urg/1" },
      { t: "2 · El cuestionario", s: "14 ítems del banco ligados al AMFE y 3 preguntas abiertas", href: "#/unidad/ej-urg/2" },
      { t: "3 · Las rondas", s: "Nueve rondas hechas, de mañana, tarde y noche, y dos planificadas", href: "#/unidad/ej-urg/3" },
      { t: "La ronda de marzo, de noche", s: "12 de 14 ítems, una camilla retirada en el momento y lo que contó el celador", href: "#/unidad/ej-urg/ronda/r03/3" },
      { t: "La ronda de abril", s: "Empieza comprobando lo pendiente: la luz del pasillo, ya cambiada", href: "#/unidad/ej-urg/ronda/r04/2" },
      { t: "4 · Las acciones", s: "Siete acciones: comprobadas, una que no funcionó y su sustituta, más fuerte", href: "#/unidad/ej-urg/4" },
      { t: "5 · El seguimiento", s: "Evolución, puntos calientes y lo que solo falla de noche", href: "#/unidad/ej-urg/5" }
    ],
    minicasos: [
      { t: "UGC de Atención Primaria", s: "Ronda trimestral de media hora con diez ítems: la nevera de vacunas sin registro del fin de semana.", href: "#/unidad/ej-ugc/3" },
      { t: "Cuestionario eterno", s: "Veintiséis ítems, cuatro de ellos ambiguos, y ninguna pregunta abierta. Mira los avisos del paso 2.", href: "#/unidad/ej-mini-eterno/2" },
      { t: "Siempre de mañana", s: "Cuatro rondas, todas un martes a las once, y una que ya debería estar hecha. Paso 3.", href: "#/unidad/ej-mini-manana/3" },
      { t: "Ronda sin respuesta", s: "Tres incumplimientos sin notas ni acciones, una acción débil sin responsable ni plazo, y la ronda sin cerrar.", href: "#/unidad/ej-mini-sinrespuesta/ronda/s1/5" }
    ]
  };

  const API = { TEMAS, GLOSARIO, EJEMPLOS, TEST, TEMAS_TEST, EJERCICIOS };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  else raiz.Contenido = API;
})(typeof window !== "undefined" ? window : this);

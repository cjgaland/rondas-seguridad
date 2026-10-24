# Rondas de Seguridad

Aplicación web (PWA) estática, sin dependencias y utilizable sin conexión, para que un profesional monte las **rondas de seguridad de su unidad** y las siga:

1. **Programa**: unidad, tipo de unidad, objetivo, frecuencia, equipo y circuito de respuesta.
2. **Cuestionario**: de 10 a 20 preguntas observables elegidas de un banco propio (73 preguntas por bloques y tipos de unidad), preguntas propias, «Traer de AMFE o de Mapa de Riesgos» y preguntas abiertas para el equipo.
3. **Rondas**: calendario con turnos rotando y, en cada ronda, cinco pasos pensados para la tableta: preparar, comprobar lo pendiente, mirar (sí / no / no aplica), escuchar y acordar.
4. **Acciones**: responsable, plazo, indicador, fuerza de la medida, elevación a la dirección y comprobación en la ronda siguiente.
5. **Seguimiento**: evolución del cumplimiento, resultados por turno, matriz ítem × ronda y puntos calientes.

Documentos en Word y PDF (hoja de la ronda, informe de la ronda, programa y seguimiento) y Excel. «Explicado fácil», Aprende, Ponte a prueba, glosario y ejemplos (Urgencias y una UGC de Atención Primaria, casos docentes ficticios). Los datos se guardan solo en el dispositivo, con copia de seguridad `.json`.

Versión reducida y local de la aplicación de gestión de rondas de los autores (pensada para hospitales y áreas grandes). Acompaña al capítulo 12, «Rondas de seguridad», de la *Guía de Calidad y Seguridad del Paciente*. Subproyecto de la superaplicación [Auditorías](https://cjgaland.github.io/auditorias/).

Pruebas: `node tests/logic.test.mjs`.

**Autores**: Carlos J. Galán Doval (Médico de Familia · Técnico en Calidad y Seguridad del Paciente) y Rafael J. Romero de Castilla Gil (Médico de Familia · Responsable del Área de Calidad y Seguridad del Paciente), Área de Gestión Sanitaria Sur de Córdoba · Andalucía. De libre uso con fines docentes y divulgativos. No sustituye el criterio profesional.

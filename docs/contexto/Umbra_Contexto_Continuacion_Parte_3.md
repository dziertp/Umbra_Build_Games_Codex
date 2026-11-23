# PROYECTO: UMBRA — Contexto e instrucciones para continuar · Parte 3

**Estado documentado: lunes 23 de noviembre de 2026, madrugada, antes de la jornada de la hackathon.**

Actúa como colaborador de diseño y desarrollo de Umbra durante la hackathon **Build Games with Codex**. Este documento complementa a los anteriores; léelos en este orden:

1. `Context_&_Instructions_IA_v1.md` — concepto, dirección artística y mecánicas candidatas.
2. `Umbra_Contexto_Continuacion_Parte_2_V4.md` — planos, maqueta V4, geometría, escalera y mediciones. **Para cualquier detalle de la mansión, sus coordenadas o recorridos, la fuente es la Parte 2.**
3. Esta Parte 3 — reglas de la hackathon, equipo, decisiones técnicas, alcance, escenarios y futura migración a un motor.

Cuando haya diferencias sobre planificación, alcance o tecnología, **esta Parte 3 actualiza a las anteriores**. La Parte 2 sigue mandando en todo lo relativo a la mansión.

Trabajaremos principalmente con **Claude**, y también con **Codex**. Antes de la jornada, usa este contexto para entender el proyecto y prepararte.

---

## 1. Lo más importante

- **El desarrollo cierra a las 16:00, no a las 19:00.** Desde esa hora el jurado evalúa y no se puede modificar nada. Tenemos unas 7 horas reales.
- **Hay que entregar un juego jugable**, en un repositorio público, con licencia open source, README con instrucciones y créditos.
- **Se puede usar material previo** (como la maqueta V4), siempre que esté **publicado** y **declarado** en la documentación.
- **Tecnología para hoy:** JavaScript + Canvas 2D sin motor, publicado en GitHub Pages, reutilizando la geometría de V4. Más adelante se puede migrar a un motor (sección 9).
- **Meta del mediodía:** a las 12:30 debe existir una partida completa en la mansión, de principio a fin.
- **Ambición:** el juego se construye **preparado para crecer**: más entidades, más evidencias y más escenarios (gasolinería y escuela japonesa). Lo que no alcance hoy queda listo para continuar.

---

## 2. Reglas de la hackathon que nos afectan

Fuente: https://hackathon.codexparatodos.com/#jornada y la guía de participantes.

| Tema | Regla | Qué significa para nosotros |
| --- | --- | --- |
| Horario | Lunes 23-11-2026, 9:00 acreditación. **Cierre de desarrollo a las 16:00.** Ganadores a las 18:00. Mentorías aprox. 11:00–16:00. | El plan termina antes de las 16:00, con margen. |
| Uso de IA | Se espera que usemos Codex para escribir, probar y mejorar el código. No hay otras restricciones. | Usaremos Claude y Codex para código, arte, audio y documentación, declarándolo. |
| Material previo | Si usamos código, recursos o materiales desarrollados antes, deben estar **disponibles públicamente** y **referenciados**. | La maqueta V4, los planos, las imágenes de personajes y los audios preliminares se suben al propio repo y aparecen en la tabla del README. |
| Código de honor | Declaramos que el trabajo se hizo durante la jornada; lo previo queda declarado. La organización lo verifica antes de premiar. | Ser exhaustivos y honestos en la tabla de materiales. |
| Entrega | Prototipo jugable, repo público, licencia open source, instrucciones para ejecutar, recursos de terceros identificados. Se entrega por Google Forms. Un pitch o video no reemplaza el prototipo. | El enlace debe abrir sin iniciar sesión y una persona ajena debe poder jugar siguiendo el README. |
| Licencia | Recomiendan MIT o Apache 2.0. La licencia del código no cambia la de imágenes, música o sonidos. | Usaremos **MIT**. Cada recurso externo conserva su licencia. |
| Seguridad | No subir contraseñas ni claves de API. | Nada de claves en el repo. |
| Evaluación | De 1 a 10 por jurado en: **jugabilidad, arte, ejecución y pulido, originalidad**. Ganan los tres puntajes más altos. | Cada decisión debe sumar en al menos uno de estos cuatro. |
| Conducta | No contenido pornográfico ni que promueva odio o violencia contra personas o grupos. | El terror es atmosférico; sin violencia gráfica innecesaria. |

---

## 3. Equipo

| Integrante | Rol | Trabajo principal |
| --- | --- | --- |
| **Dacier Tapia** | Programación con IA (vibe coding) | Mundo y amenaza: geometría, render, oscuridad, entidad y cacerías, apagón, sistema de mapas. |
| **Isidora Vargas** | Programación con IA (vibe coding) | Investigación e interfaz: herramientas, evidencias, diario, menú, selección de escenario, resultado, audio. |
| **Anais Tapia** | Arte, audio y diseño (no programa) | Sprites, sonidos, definición de entidades y evidencias con sus textos, bocetos de los nuevos escenarios, pruebas de juego, tabla de recursos del README. |

Los tres deberían recibir créditos de Codex en la jornada. Anais también puede usar IA (Claude o Codex) para textos, ideas, bocetos de mapas o datos de entidades, sin necesidad de programar.

Con dos personas programando en paralelo en el mismo repo:

- Cada una trabaja en **archivos distintos**.
- Commits pequeños y frecuentes, y `git pull` antes de cada tarea.
- A las 9:30 se acuerdan los "contratos" entre módulos: qué funciones o datos expone cada archivo.

---

## 4. Decisiones técnicas para la jornada

| Decisión | Motivo |
| --- | --- |
| **JavaScript + Canvas 2D, sin motor** | La geometría de V4 ya funciona en la web; migrar hoy obligaría a rehacerla con el reloj encima. Claude y Codex se manejan bien con JS simple. |
| **GitHub Pages** para la versión jugable | El jurado juega con un enlace, sin instalar nada. |
| **Scripts clásicos (no ES modules)** | Así el juego también funciona abriendo `index.html` con doble clic. Los módulos fallan con `file://`. |
| **Sin dependencias, o casi** | Menos cosas que pueden romperse. Si se necesita audio avanzado, Howler.js (MIT). |
| **Licencia MIT** | Simple y recomendada por la organización. |
| **Render a baja resolución y escalado sin suavizado** | La oscuridad y la luz se ven pixel art, no realistas. |
| **Contenido en datos, no en código** | Mapas, entidades, evidencias y herramientas se describen en archivos de datos. Agregar contenido no requiere tocar la lógica, y facilita migrar a un motor después. |

### Cómo se implementa lo principal

- **Oscuridad:** polígono de visibilidad calculado con rayos contra los segmentos de muro del mapa. La linterna recorta ese polígono a un cono. Luces de habitación y luz de luna como máscaras. Pocos niveles de luz.
- **Entidad:** la cuadrícula de navegación con A\* que ya existe en `geometry.js` de V4 sirve para recorrer la casa y perseguir al jugador. Estados: deambular, manifestarse, cazar, buscar.
- **Audio:** Web Audio API, con volumen y paneo según dirección para sonidos de otras habitaciones.

---

## 5. Qué hacemos con la maqueta V4

Revisamos el ZIP de V4. Las pruebas automáticas (`node qa.cjs`) **pasan**: trece recorridos, refugios A1/A2 y escalera. Es una comprobación automática, no una prueba humana.

**Se conserva:** los datos de los dos pisos y `build_map.py`; `geometry.js` (colisiones, movimiento subdividido, escalera y A\*); los parámetros de partida (colisión 16 u, caminar 72 u/s, correr 102 u/s, escalera en x = 513); y `qa.cjs` como red de seguridad.

La geometría de la mansión no quedó revisada del todo en V4: se puede ajustar libremente durante la jornada si mejora el juego (pasos, tamaños de habitaciones, muebles, escondites). Si se cambia, actualizar `qa.cjs` para que siga sirviendo.

**Se descarta para el juego:** `app.js`, `index.html` y `style.css` (son una herramienta de medición) y el aspecto de rectángulos planos con etiquetas.

**Se guarda como referencia** en `prototypes/v4/`, porque es material previo que debe quedar público y declarado.

El código de V4 está muy comprimido. Al portarlo conviene reformatearlo **sin cambiar su lógica** y verificar con `qa.cjs`. Las puertas son fijas y siempre abiertas; volverlas dinámicas es una mejora posterior.

---

## 6. Escenarios

El juego se diseña para tener **varios escenarios** que comparten todos los sistemas (oscuridad, entidades, evidencias, herramientas, diario, cacerías). Cada escenario aporta solo sus datos: geometría, escondites, fusibles, luces, puntos de evidencia, punto de inicio y paleta.

| Escenario | Tamaño | Estado | Notas |
| --- | --- | --- | --- |
| **Mansión Umbra** | Mediano, dos pisos | Geometría lista (V4) | Escenario principal. Todo se prueba primero aquí. |
| **Gasolinería** | Pequeño | Por diseñar | Tienda, baños, bodega, garaje o taller y exterior con surtidores. Paleta con neón y lluvia. Ideal como segundo escenario por su tamaño: partidas cortas y rápidas de diseñar. |
| **Escuela japonesa** | Grande | Por diseñar | Pasillos, aulas, baños, laboratorio, gimnasio y patio. Probablemente varios pisos. Es el más costoso: requiere diseño de recorridos y ajuste de tiempos. |

Orden de construcción: mansión → gasolinería → escuela. Si en la jornada solo alcanza la mansión, el sistema de escenarios igual queda listo para agregar los otros después.

Para diseñar un escenario nuevo rápido: Anais boceta la distribución (en papel o con IA), y con Claude se convierte en un archivo de datos con el mismo formato que la mansión. Se recorre, se ajusta y se agrega al selector.

---

## 7. Entidades, evidencias y herramientas

**No hay límite fijo de entidades ni de evidencias.** El sistema se construye para que agregar una entidad o una evidencia sea agregar datos, no reprogramar.

- Cada **entidad** tiene: nombre, conjunto de evidencias, descripción para el diario y, opcionalmente, comportamientos propios (por ejemplo, apagar luces más seguido, cazar antes, moverse más rápido en la oscuridad).
- Cada **evidencia** tiene: nombre, herramienta que la detecta, cómo se manifiesta en el mapa y cómo se marca en el diario.
- Cada **herramienta** tiene: nombre, tecla o forma de uso, y qué evidencias revela.

La lista de herramientas y evidencias candidatas de la Parte 1 sigue vigente como punto de partida (termómetro, UV, EMF, Spirit Box, escritura, cámaras, orbes, láser, alteraciones ambientales). La selección final se hace el lunes con el material recopilado.

Recomendación de construcción: primero el sistema funcionando de punta a punta con algunas entidades y evidencias, y luego agregar más durante el día. Varias entidades pueden compartir las mismas evidencias; en ese caso se distinguen por su comportamiento.

### Referencias de Demonology y nombres

El lunes se adjuntarán **fotos tomadas en Demonology (Roblox)**: fantasmas, equipamiento y su ubicación, elementos del diario, evidencias y objetos malditos.

- Se usan como **base de diseño**: podemos tomar sus combinaciones de evidencias por entidad, su equipamiento y la estructura de su diario.
- **Los nombres de entidades y evidencias se recrearán el lunes** a partir de lo recopilado, con nombres propios de Umbra. Los textos se reescriben con nuestras palabras.
- Las fotos **no se suben al repo**. En el README, Demonology y Phasmophobia aparecen como **inspiración**.

---

## 8. Alcance del día por niveles

### Nivel 1 — Núcleo (antes de las 12:30)

- Mansión con sus dos pisos.
- Oscuridad con oclusión por muros, linterna y luces por habitación.
- Sistema de entidades, evidencias y herramientas funcionando con un primer grupo de contenido.
- Diario: marcar evidencias, ver descartes y elegir la entidad.
- Menú con objetivo y controles → partida → resultado.

### Nivel 2 — Juego completo (hasta ~14:15)

- Cacerías con escondites (A1/A2) y huida.
- Apagón y fusibles del garaje.
- Eventos ambientales: luces que parpadean, golpes, sonidos.
- Arte del personaje y del escenario; audio integrado.
- **Más entidades y evidencias** (Anais las prepara en datos durante la mañana).

### Nivel 3 — Expansión (si hay tiempo antes de las 15:00)

- Selector de escenario y **gasolinería**.
- Ojos blancos del personaje en oscuridad total.
- Sonido direccional, indicador de exposición o cordura.
- Puertas dinámicas.

### Para continuar después de la jornada

- Escuela japonesa.
- Objetos malditos, tropiezos, stamina.
- Migración a un motor (sección 9).

### Duración de partida

El jurado jugará pocos minutos. Apuntar a partidas de **5 a 8 minutos** en la mansión, con algo inquietante en los primeros 2 minutos y un objetivo claro desde el menú.

---

## 9. Migración futura a un motor

Hoy se trabaja en la web por velocidad. Si el proyecto sigue después de la hackathon, conviene pasar a un motor.

### Recomendación: **Godot 4**

| Motivo | Detalle |
| --- | --- |
| Iluminación 2D incluida | Luces 2D con sombras y oclusores. Lo que hoy programamos a mano (oscuridad, linterna, muros que tapan la luz) viene resuelto y se ve mejor. |
| Hecho para 2D | Escenas, tilemaps, sprites animados, cámaras, navegación con agentes y física 2D integrados. |
| Exporta a web y escritorio | Se puede seguir publicando para jugar en el navegador, y también como ejecutable para Windows, macOS y Linux. |
| Licencia MIT, gratis | Sin regalías ni costos; compatible con un repo open source. |
| GDScript | Lenguaje parecido a Python. Claude lo maneja bien y es fácil de leer para el equipo. |
| Editor visual | Anais puede colocar muebles, luces y escondites directamente en el editor, sin programar. |

### Alternativas consideradas

- **Phaser 3:** la migración más corta porque sigue siendo JavaScript, pero su iluminación no bloquea la luz con muros y seguiríamos programando la oscuridad a mano. Útil solo si queremos quedarnos en la web sin cambiar de lenguaje.
- **Unity:** potente, pero pesado para un juego 2D de este tamaño; compilaciones web grandes y lentas.
- **LÖVE:** simple, pero sin editor visual y con menos herramientas para iluminación y escenarios.

### Cómo dejamos preparada la migración desde hoy

- **Mapas, entidades, evidencias y herramientas en archivos de datos** (JSON o equivalentes), separados de la lógica. Godot puede leerlos con un script de importación que genera muros, oclusores, escondites y puntos de evidencia.
- **Lógica separada del dibujo**: las reglas del juego (evidencias, diario, cacería) no dependen de cómo se dibuja. Así se reimplementan en GDScript siguiendo el mismo diseño.
- **Assets en formatos estándar** (PNG para sprites, WAV/OGG para audio) y a una escala fija, para reutilizarlos tal cual.
- Mantener el **README y los documentos de contexto** al día para que la IA pueda hacer la migración con todo el contexto.

**No se recomienda migrar durante la jornada**: el cierre de las 16:00 no deja margen para aprender el motor y rehacer sistemas. La migración es el primer paso natural después de la hackathon.

---

## 10. Documentación de la entrega

El README sigue la plantilla oficial de la hackathon, con **una sola tabla** que incluye tanto recursos de terceros como materiales propios desarrollados antes de la jornada. Ya existe un borrador (`README.md`).

La tabla se completa **durante el día**, cada vez que se agrega un recurso: nombre, autor, enlace público, licencia y cambios realizados.

Materiales previos ya identificados:

- Maqueta de recorridos V4 (código propio).
- Planos estructurales y mediciones (propios).
- Documentos de contexto para IA (propios).
- Imágenes de referencia de personajes (Hannah, Turner, Chloe): confirmar cómo se crearon y con qué herramienta.
- Audios preliminares (`Umbra_Ambiente_Exploracion_28s`, `Umbra_Tropiezo_Sutil_078s`): confirmar origen.

Todo lo que se genere con IA (código, imágenes, audio, textos) también se declara, indicando la herramienta (Claude, Codex u otra).

---

## 11. Cómo quiero que trabajes durante la jornada

1. **Respeta el cierre de las 16:00.** A las 15:00 se dejan de agregar funcionalidades.
2. **Primero el núcleo jugable, después la expansión.** Pero construye cada sistema pensando en que crecerá: más entidades, evidencias y escenarios.
3. **Contenido en datos.** Si algo es contenido (una entidad, una evidencia, un mapa), va en un archivo de datos, no escrito dentro de la lógica.
4. **Cambios pequeños y comprobables.** Después de cada cambio, explica qué hiciste y cómo lo comprobaste. Si algo no se pudo verificar, dilo.
5. **Si vamos atrasados, avisa** y propone qué mover al siguiente nivel, sin recortar el menú, el final de partida ni el README.
6. **Registra cada recurso externo** en la tabla del README al incorporarlo.
7. **Evalúa con criterio.** No apruebes todo, pero tampoco inventes problemas.
8. Distingue siempre entre lo **decidido**, lo **propuesto**, lo **implementado** y lo **probado por personas**.

---

## 12. Pendientes al empezar la jornada

- Revisar las fotos de Demonology y definir nuestras entidades, evidencias y herramientas con nombres propios.
- Crear el repo público, la licencia y la estructura; publicar V4 y los materiales previos en `prototypes/` y `docs/`.
- Confirmar el reparto de tareas entre Dacier, Isidora y Anais.
- Boceto inicial de la gasolinería (Anais), para tenerlo listo si llegamos al Nivel 3.

Documentos relacionados: `Plan_Hackathon_Umbra.md` (horario y reparto) y `README.md` (borrador de entrega).

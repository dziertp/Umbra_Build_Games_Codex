# PROYECTO: UMBRA — Contexto e instrucciones para continuar · Parte 2

**Estado documentado: 23 de noviembre de 2026 · Avance hasta la maqueta V4.**

Actúa como mi colaborador de diseño de videojuegos, diseño de niveles y desarrollo de prototipos. Este documento está pensado para continuar el proyecto con Codex, Claude u otra IA, aunque no tenga acceso al historial anterior.

Lee primero el documento **«Context_&_Instructions_IA_v1.md»**, que también puede aparecer como **«Context_&_Instructions_IA_v1(1).md»**, y después esta continuación. Ambos se complementan. **Cuando haya diferencias sobre el estado del proyecto, la distribución o lo implementado, esta Parte 2 actualiza la Parte 1 hasta V4.** Si aporto versiones posteriores, revisa esas versiones antes de trabajar.

Voy a adjuntar las imágenes de personajes, escenarios y planos hasta V4. Úsalas como referencias junto con este texto. No asumas que una imagen de personaje ya es un spritesheet listo para integrar ni que una captura del mapa sustituye a sus datos de colisión.

## 1. Qué estamos construyendo

Umbra es un juego pequeño de **terror psicológico e investigación paranormal en 2D, con vista superior y estética pixel art**, preparado en el contexto de una hackathon/game jam.

La experiencia que buscamos es explorar, detectar actividad, reunir evidencias, registrarlas, identificar la entidad y sobrevivir o terminar la investigación. La duración objetivo inicial de una partida completa sigue siendo aproximadamente **8–15 minutos**; todavía no se ha validado ese objetivo con una partida completa.

Se mantiene la dirección de la Parte 1:

- Jugabilidad inspirada en Demonology y Phasmophobia; referencias visuales de Hotline Miami, Undertale y Pokémon; conexiones de escenarios inspiradas en Resident Evil 7/Village.
- Vista superior clara, sin isometría, habitaciones legibles y asimétricas, mobiliario contenido y espacios para investigar.
- Paleta oscura y desaturada, madera apagada, luz lunar azulada y luces cálidas tenues.
- Terror construido con oscuridad, sonidos, incertidumbre y comportamiento del entorno.
- Un alcance realizable, iterativo y reutilizable en otros escenarios.

**La novedad respecto a la Parte 1 es que ya pasamos de planos conceptuales a una maqueta programada y recorrible.** Todavía no equivale a un juego de investigación completo.

## 2. Actualizaciones que sustituyen información anterior

| La Parte 1 describía | Estado alcanzado hasta V4 |
| --- | --- |
| Principalmente preproducción, sin implementación confirmada | Existe una maqueta web funcional de movimiento, colisiones, refugios, mediciones y dos pisos conectados. |
| Dos dormitorios en la planta baja preliminar | La planta baja actual tiene **un dormitorio**. Arriba hay otros dos. |
| Patio lateral de servicio y fusibles exteriores | En la distribución actual se eliminó el patio lateral y los **fusibles están dentro del garaje**. |
| Cuarto de servicio como posibilidad en revisiones intermedias | Fue eliminado. El armario A1 quedó en la galería trasera. |
| Segundo piso pendiente de diseñar | Está diseñado e integrado a la maqueta V4. |
| Escalera lateral genérica | Se desplazó **40 u hacia la derecha** y debe conservar exactamente la misma posición en ambos pisos. |
| Prioridad inmediata: revisar el primer plano | Ya se hicieron revisiones, maquetas y pruebas. La propuesta siguiente es evaluar oscuridad e iluminación. |

El motor definitivo continúa sin estar confirmado. **No supongas que ya elegimos Godot, Unity u otro motor.** Sí existe una implementación web que debe aprovecharse y conservarse como referencia.

## 3. Evolución de planos y maquetas

| Etapa | Avance relevante |
| --- | --- |
| Planos iniciales y revisiones V1/V2 | Se exploraron alas menos simétricas, garaje, conexiones secundarias y ubicación de fusibles/refugios. La V2 todavía contemplaba un cuarto de servicio reducido. |
| Planta baja estructural V3 | Se eliminó el cuarto de servicio, se acercó el garaje al hall y quedó un dormitorio abajo. A1 pasó a la galería. Se mantuvieron terraza y circuito interior. |
| Maqueta de recorridos V3 | Se convirtió el plano en una prueba recorrible, con colisiones, interacción del armario/fusibles, cronómetro y exportación de mediciones. |
| Maqueta V3.1 | Se probaron tamaños de colisión, velocidades y el paso junto a la escalera. Hay CSV históricos con distintos parámetros. |
| Maqueta V3.2 | Se aplicó por defecto el desplazamiento de escalera de +40 u; se ampliaron living y comedor; se separó tamaño visual de tamaño de colisión y se incorporó carrera con Shift. |
| Segundo piso, distribución V1 | Se propusieron dos dormitorios, baño, sala de estar, vestidor, galería/distribuidor y A2. La primera entrega tuvo un error de alineación de escalera, explicado abajo. |
| Maqueta V4 | Se corrigió la escalera y se conectaron ambos pisos. Se añadieron recorridos superiores y entre pisos, A2 y registro de cambios de piso. Después hice pruebas y exporté las mediciones de V4. |

**Importante sobre los nombres:** el plano superior sigue llamándose `Umbra_Segundo_Piso_Distribucion_v1`, pero sus archivos PNG/SVG fueron actualizados para corregir la escalera. No recuperes por error la primera imagen sin el desplazamiento.

## 4. Planta baja actual: base V3.2 conservada en V4

La entrada principal y el porche quedan en la parte inferior del plano; la terraza posterior, arriba. Mantén la misma orientación entre pisos.

Espacios actuales:

- Entrada principal con porche y vestíbulo.
- Hall central como referencia de orientación, con la escalera lateral.
- Living, oficina/estudio, un dormitorio, baño y pequeño distribuidor/paso.
- Comedor, cocina y despensa.
- Galería trasera y terraza posterior.
- Garaje, con caja de fusibles.

Conexiones y funciones importantes:

- **Circuito interior:** hall → comedor → cocina → galería → hall.
- **Garaje:** acceso peatonal único desde el hall. El portón vehicular permanece cerrado y no funciona como atajo.
- **Fusibles:** dentro del garaje, hacia el extremo opuesto al acceso. Llegar y regresar implica exponerse al recorrido; todavía no hay un enemigo que convierta esa exposición en peligro real.
- **Armario A1:** en la galería trasera. Abres, entras por completo y cierras para activar el estado de protección.
- El cuarto de servicio y el patio lateral ya no pertenecen a esta distribución.

Ajustes de V3.2 que no deben perderse:

- Living ampliado **60 u hacia la izquierda y 40 u hacia el frente**. Se desplazó el sofá conservando su tamaño.
- Comedor ampliado **60 u hacia la derecha**. Mesa y sillas se desplazaron 45 u, conservando sus tamaños.
- Se corrigieron pasos concretos de living, comedor, oficina y entrada cocina/comedor.

## 5. Segundo piso actual

Se diseñó una planta superior más compacta, con:

- Dormitorio principal.
- Dormitorio secundario.
- Baño y pequeño paso de acceso independiente.
- Sala de estar.
- Vestidor.
- Galería/pasillo y distribuidor de llegada.
- **Armario A2 en la sala de estar.**

Tiene un circuito secundario: **distribuidor → galería → dormitorio principal → vestidor → distribuidor**.

No hay piso superior jugable sobre living, vestíbulo ni garaje. Las áreas representadas con borde discontinuo son cubiertas del primer piso, **sin acceso**, no nuevas habitaciones ni terrazas transitables.

Los pisos son mapas separados y conectados. Durante la validación existen botones para inspeccionarlos directamente; esos botones son ayudas de la maqueta y no una decisión de permitir teletransporte en el juego final.

## 6. La escalera: corrección indispensable

Este fue un error real que ya se corrigió y no debe repetirse:

1. La escalera original estaba en **x = 473**.
2. Durante las pruebas se acordó desplazarla **40 u hacia la derecha** para despejar el paso junto al muro y la oficina.
3. La primera propuesta de segundo piso reutilizó la V3 anterior y volvió a dibujarla pegada al muro, omitiendo esas 40 u.
4. Lo señalé y se corrigieron tanto el plano superior como la maqueta de ambos pisos.

**Geometría actual, idéntica en los dos mapas:**

```text
Escalera = [x, y, ancho, largo] = [513, 585, 78, 207]
Extensión horizontal: x = 513..591
Extensión vertical: y = 585..792
Desplazamiento respecto de la V3 original: +40 u en X
Paso hasta la cara interior del muro del hall: 59,5 u
```

Las 40 u ya están incorporadas a las coordenadas. **No vuelvas a sumarlas al dibujar o al calcular colisiones.**

En V4 los peldaños son transitables y las barandas impiden entrar desde los costados. Se sube entrando por el extremo inferior en planta baja y se cambia a 2F al completar el tramo; al bajar se recorre desde el extremo superior de 2F y se vuelve al hall de 1F. No hace falta pulsar E para cambiar de piso.

## 7. Qué está implementado en la maqueta V4

| Sistema | Estado real |
| --- | --- |
| Movimiento | WASD/flechas, carrera con Shift y normalización de movimiento diagonal. |
| Colisiones | Muros, muebles, hojas de puertas representadas abiertas, barandas y armarios. |
| Dos pisos | Subida/bajada por la escalera, actualización del piso y del armario activo. |
| A1 y A2 | Abrir/cerrar con E, entrar completamente y obtener estado de protección al cerrar. Cada armario conserva su estado al cambiar de piso. |
| Fusibles | Interacción con E y mensaje de electricidad restablecida en la prueba. **Aún no existe un sistema real de apagones e iluminación conectado a ellos.** |
| Mediciones | Cronómetro, distancia recorrida, carrera, parámetros de prueba y cambios de piso. |
| Referencia de ruta | Cálculo geométrico orientativo caminando; puede visualizarse. |
| Inspección | Vista completa, vista cercana, selección de piso y exploración libre. |
| Historial | Guardado local en el navegador, hasta las últimas 50 mediciones, y exportación CSV. |
| Personaje | Referencia geométrica circular; las imágenes de personajes todavía no están integradas como personaje animado. |

El estado «protegido» es una lógica de la maqueta y una indicación visual. **No demuestra que exista una IA enemiga ni una cacería implementada.**

Las puertas de habitaciones se representan abiertas y sus hojas tienen colisión; no supongas que ya existe interacción dinámica de abrir/cerrar todas las puertas. La interacción de abrir/cerrar implementada corresponde a los armarios.

### Controles

| Acción | Control |
| --- | --- |
| Moverse | WASD o flechas |
| Correr | Mantener Shift |
| Abrir/cerrar armario o usar fusibles | E |
| Subir/bajar | Caminar por la escalera hasta completar el tramo |
| Pausar/reanudar una prueba | Espacio o botón |
| Preparar de nuevo el recorrido seleccionado | R |

El reloj empieza con el primer movimiento después de preparar la prueba. Cambiar parámetros cancela/reinicia la medición en curso. Los botones de inspección de piso no cuentan como tránsito medido entre plantas.

## 8. Parámetros y unidades que estamos usando

| Parámetro inicial de V4 | Valor |
| --- | ---: |
| Ancho/diámetro de colisión | 16 u |
| Referencia visual mínima del personaje | 24 u |
| Velocidad caminando | 72 u/s |
| Velocidad corriendo | 102 u/s |
| Desplazamiento aplicado a la escalera | +40 u |

`u` significa unidades del plano, no metros ni píxeles definitivos del juego. Los parámetros son ajustables para probar; no son todavía una escala artística final.

**Colisión de 16 u y referencia visual de 24 u son intencionalmente distintas.** No las unifiques por suposición. En V3.1 se probaron otros tamaños y velocidades; compara mediciones teniendo en cuenta esa diferencia.

La carrera actual no tiene stamina. Se corrigió además un problema de movimiento en fotogramas lentos: el desplazamiento conserva el tiempo transcurrido y se divide en pasos pequeños para comprobar colisiones. No regreses al comportamiento que ralentizaba el movimiento mientras el cronómetro seguía contando tiempo real.

## 9. Los trece recorridos disponibles

1. 1F · Entrada a fusibles.
2. 1F · Fusibles a refugio A1.
3. 1F · Living a refugio A1.
4. 1F · Dormitorio a refugio A1.
5. 1F · Oficina al hall.
6. 1F · Circuito interior.
7. Escalera · Subir a 2F.
8. Escalera · Bajar a 1F.
9. 2F · Dormitorio a refugio A2.
10. 2F · Dormitorio secundario a A2.
11. 2F · Circuito por el vestidor.
12. Dos pisos · Dormitorio a fusibles.
13. Dos pisos · Fusibles a refugio A2.

Los trayectos de refugio terminan al entrar y cerrar el armario correcto; los de fusibles requieren interactuar con la caja. Los circuitos usan marcas/puntos de recorrido.

## 10. Pruebas técnicas realizadas y sus límites

En el desarrollo de V4 se verificaron automáticamente:

- Igualdad exacta de posición y tamaño de la escalera entre pisos, con +40 u aplicadas.
- Tránsito y llegada segura de la escalera con colisiones de 16, 24 y 36 u.
- Los 13 trayectos con colisiones de 16 y 24 u: **26 simulaciones caminando**.
- Tres pruebas adicionales corriendo: subir, bajar y fusibles → A2.
- Entrada/cierre/protección en A1 y A2.
- Los pasos corregidos de living, comedor, oficina y entrada cocina/comedor.
- Cronómetro, pausa, reinicio por parámetros, inspección de piso y movimiento en un fotograma lento.

También se comprobaron la subida y la bajada mediante controles en Chrome durante la previsualización. La publicación de V4 fue verificada como exitosa.

**Estas pruebas automáticas y las pruebas del navegador no son las mediciones humanas del CSV.** No presentes los tiempos sintéticos como mis resultados. Tampoco afirman que todo el juego esté equilibrado, que no exista ningún fallo o que se hayan probado cacerías/iluminación.

## 11. Mis mediciones reales de V4

Entregué el archivo **`Umbra_mediciones_dos_pisos_V4.csv`** después de recorrer la maqueta.

Contiene 50 registros conservados en el historial:

- **14 registros de V4, correspondientes a 7 tipos de recorrido.**
- 1 registro de V3.2.
- 35 registros de V3.1.

No son 50 pruebas de V4 ni evidencia de que yo haya medido personalmente los 13 trayectos nuevos. El archivo conserva historial anterior.

Las 14 mediciones de V4 usan la misma configuración: colisión 16 u, visual 24 u, caminar 72 u/s, correr 102 u/s y escalera desplazada 40 u.

### Resultados individuales registrados

Los valores son segundos; son muestras individuales, no promedios estadísticos.

| Recorrido | Caminando / casi caminando | Prueba(s) con carrera | Aclaración |
| --- | ---: | ---: | --- |
| Subir a 2F | 2,764 | 1,965 | La segunda fue completamente corriendo. |
| Bajar a 1F | 2,814 | 2,614 | En la segunda solo hubo 0,483 s de carrera. |
| Dormitorio principal → A2 | 11,690 | 10,408 | La segunda combinó caminar y correr: 7,011 s de carrera. |
| Dormitorio secundario → A2 | 17,253 | 15,188 | La primera incluyó solo 0,250 s de carrera; la segunda, 11,140 s. |
| Circuito por el vestidor | 11,974 | 10,824 | La segunda incluyó 8,526 s de carrera. |
| Dormitorio superior → fusibles | Sin muestra solo caminando | 12,956 y 14,405 | Ambas usaron carrera: 12,757 s y 10,658 s, respectivamente. |
| Fusibles → A2, entre pisos | 18,285 | 12,939 | La segunda fue casi toda corriendo: 12,406 s. |

### Qué observamos y qué sigue siendo hipótesis

- Subir y bajar caminando dio alrededor de 2,8 s en estas muestras, muy cerca de las referencias geométricas.
- Fusibles → A2 bajó de 18,285 a 12,939 s, una reducción aproximada del 29 %. Aquí las distancias recorridas fueron parecidas.
- Dormitorio secundario → A2 tomó 17,253 s prácticamente a pie. Es un recorrido a observar cuando exista oscuridad o amenaza; todavía no se decidió añadir una puerta ni mover el refugio.
- En el circuito superior, la muestra con carrera recorrió 1.023,97 u frente a 854,92 u caminando: aproximadamente un 20 % más de distancia. Podría haber diferencias de ruta, correcciones o dificultad al girar; **el CSV no identifica la causa**.
- Correr no siempre ahorró tanto tiempo porque varias pruebas mezclaron velocidades y siguieron caminos de distinta longitud.
- El CSV registra pruebas completadas; por sí solo no demuestra ausencia de atascos o intentos abandonados.
- No se ha validado todavía si esos tiempos son adecuados para una cacería ni si el escenario resulta divertido o aterrador.

### Cómo leer correctamente el CSV

Las columnas incluyen fecha, recorrido, tiempo activo, distancia, diámetro de colisión, velocidad caminando, desplazamiento de escalera, referencia geométrica, versión, velocidad corriendo, tiempo corriendo, ancho visual, piso inicial, piso final y cantidad de cambios de piso.

`referencia_geometrica_s` es una referencia **caminando**, no el tiempo obligatorio del recorrido ni una referencia de carrera. Los peldaños efectivamente caminados suman distancia; el cambio de mapa no agrega una distancia ficticia entre coordenadas de plantas distintas.

Las etiquetas `V4 · 1F` y `V4 · 2F` identifican el piso en el que termina el registro dentro de V4; no son dos versiones distintas del prototipo. Las filas históricas pueden carecer de columnas añadidas después.

## 12. Ideas artísticas, de sonido y de jugabilidad que debemos conservar

### Personajes y presentación

Conserva las referencias de personaje de la Parte 1 y las imágenes que voy a aportar. Se han explorado también propuestas de contraparte femenina; revisa mis adjuntos antes de describir su aspecto o elegir una variante definitiva. No asumas selección de personaje ni animaciones implementadas.

Sigue vigente la idea de que, en oscuridad absoluta, puedan verse solamente **dos pequeñas rayas blancas como ojos**. Es una propuesta de identidad visual, no una función ya implementada.

El objetivo de iluminación sigue siendo revelar únicamente lo alcanzado por linterna, velas, lámparas, electricidad o luz lunar, con oclusión de muros y una estética compatible con pixel art.

### Audio

Se exploraron recursos de ambiente y un sonido breve de tropiezo. Existen recursos preliminares con nombres:

- `Umbra_Ambiente_Exploracion_28s.wav` y su versión MP3.
- `Umbra_Tropiezo_Sutil_078s.wav`.

Su existencia no implica que estén integrados en V4 ni que la mecánica de tropiezo esté aprobada. Son recursos para revisar y probar.

También queremos sonidos de pisadas, caídas de objetos, apagones, interruptores de ampolletas y linterna, cambios de cámara tipo monitor, estática y bisagras. Al incorporar audios externos habrá que verificar formato, licencia y necesidad de atribución; no supongas que ya se hizo esa selección.

### Mecánicas candidatas

Siguen en evaluación las herramientas y evidencias de la Parte 1: termómetro, UV, EMF, Spirit Box, escritura, cámaras, orbes, láser y alteraciones ambientales. También el diario, las entidades, sus manifestaciones, exposición/cordura y cacerías.

**No conviertas esa lista de ideas en una lista de funcionalidades ya construidas o comprometidas para la próxima entrega.** Los futuros escenarios de escuela, gasolinería y hospital continúan siendo posibilidades posteriores.

## 13. Qué propusimos hacer después: una V5 acotada

Después de revisar mis mediciones, la recomendación fue conservar provisionalmente la distribución y avanzar a una prueba de **oscuridad e iluminación**:

1. Oscuridad y linterna direccional, con muros que bloqueen la visión/luz.
2. Luces por habitación e interruptores.
3. Apagón y recuperación de la iluminación mediante los fusibles del garaje.

El objetivo de esa prueba es responder: **¿puedo orientarme, encontrar la escalera y alcanzar un refugio cuando ya no veo toda la casa?**

Después se propuso un ciclo pequeño de investigación con un instrumento, una evidencia y un diario sencillo. La amenaza/cacería se deberá diseñar y ajustar con sus propias pruebas.

**Estado de esa propuesta al redactar este documento: V5 no está implementada y su alcance no ha sido aprobado en detalle.** No hay que confundir mi solicitud de preparar este contexto con una orden de desarrollar todos esos sistemas inmediatamente.

Antes de ampliar el alcance, define conmigo una prueba concreta y sus criterios de aceptación. Si luego te pido implementarla, utiliza V4 como base y avanza sin repetir toda la preproducción.

Posibles criterios para una primera prueba de iluminación, todavía por acordar:

- No ver automáticamente habitaciones separadas por muros.
- Linterna comprensible y utilizable al caminar y correr.
- Interruptores y fusibles con efecto visible sobre las luces.
- Mantener la geometría y las colisiones de V4 para poder comparar recorridos.
- Conservar una vista de diagnóstico para revisar problemas sin confundirla con la vista de juego.
- Repetir algunos recorridos con los mismos parámetros, ahora bajo visibilidad limitada.

No ajustes a la vez mapa, velocidad, colisiones y luces sin una razón concreta: necesitamos saber qué cambio produjo cada resultado.

## 14. Información técnica para continuar sin reconstruir el trabajo

La maqueta está hecha con **HTML, CSS y JavaScript, dibujado en Canvas 2D**, y puede ejecutarse en navegador. No requiere asumir un proyecto de motor de videojuegos que todavía no hemos elegido.

La organización de fuentes usada en la entrega V4 incluye:

| Archivo | Función |
| --- | --- |
| `map-source.json` | Geometría editable de la planta baja. |
| `upper-map-source.json` | Geometría editable del segundo piso. |
| `build_map.py` | Genera datos del navegador y comprueba la igualdad de escaleras. |
| `dist/map-data.js` | Datos generados de los dos pisos. |
| `dist/geometry.js` | Colisiones, movimiento, rutas y transición de escalera. |
| `dist/app.js` | Estado de la prueba, controles, dibujo, interacciones, historial y CSV. |
| `dist/index.html` y `dist/style.css` | Interfaz de la maqueta. |
| `qa.cjs` | Verificaciones deterministas. |
| `qa-report.json` | Resultados de pruebas automáticas, no mediciones humanas. |
| `qa-layout-report.json` | Registro de la comprobación en navegador. |
| `README.md` | Descripción técnica, controles, alcance y comprobaciones. |

En la entrega V4 se utilizaba `python3 build_map.py` para regenerar datos y `node qa.cjs` para verificarlos. Inspecciona las fuentes que tengas antes de ejecutar o editar: esos archivos pueden no estar disponibles automáticamente en otra sesión o plataforma.

> **Nota de la versión pública:** en este repositorio se omitieron el enlace a la publicación privada de V4 y sus identificadores internos. El código fuente completo de V4 está publicado en `prototypes/v4/`.

**Si solo puedes ver imágenes o el enlace, no finjas haber recuperado ni ejecutado las fuentes.** Trabaja con lo que sí tengas y pide únicamente el código o archivo concreto que falte para continuar. No reconstruyas toda la maqueta desde capturas si es posible recuperar la implementación existente.

## 15. Archivos y referencias que puedo aportar

- Parte 1: `Context_&_Instructions_IA_v1.md` o su copia con `(1)`.
- Esta Parte 2: `Umbra_Contexto_Continuacion_Parte_2_V4.md`.
- `Umbra_Planta_Baja_Estructural_v3.2.png`.
- `Umbra_Segundo_Piso_Distribucion_v1.png` y `.svg`, en su **revisión corregida con escalera +40 u**.
- `Umbra_mediciones_dos_pisos_V4.csv`.
- Históricos: `Umbra_mediciones_V3.csv` y `Umbra_mediciones_V3_1.csv`.
- Imágenes de personajes, variantes y referencias de escenarios que adjuntaré.
- Código/paquete de V4, si hace falta para implementar y tu entorno no puede recuperarlo.

El texto de esta Parte 2 incluye un resumen de las mediciones para que puedas entender el avance aunque no estén todos los adjuntos. Para hacer análisis adicionales, utiliza el CSV real. Para programar sobre V4, utiliza sus fuentes reales.

## 16. Cómo quiero que trabajes conmigo desde ahora

1. Continúa desde el estado de V4. No vuelvas a plantear que solo tenemos conceptos o que falta diseñar el segundo piso.
2. Distingue decisiones adoptadas, propuestas, funciones implementadas, comprobaciones automáticas y pruebas humanas.
3. Conserva la escalera +40 u, las ampliaciones y las correcciones de circulación. Si detectas un problema nuevo, señálalo y explica el cambio necesario.
4. Evalúa mis ideas con criterio; no apruebes todo automáticamente ni inventes problemas para justificar rediseños.
5. Mantén el alcance pequeño y las entregas comprobables. No añadas de una vez todas las herramientas, entidades, multijugador, reconocimiento de voz o IA generativa.
6. Quiero que propongas que tecnologías podríamos usar, como el motor o el uso de otros recursos.
7. Las referencias visuales no equivalen a assets terminados. No prometas animaciones o sistemas que no hayas integrado y verificado.
8. Explica en lenguaje claro qué cambió, para qué y cómo se comprobó. Si algo no pudo verificarse, dilo.
9. No repitas instalaciones o pruebas ya satisfactorias sin un motivo concreto. Prioriza lo necesario para avanzar hacia un prototipo jugable.
10. Mantén la estética y el objetivo del juego por encima de un exceso de habitaciones, decoración o funcionalidades.

## 17. Primera tarea al retomar

Con este contexto y los adjuntos que te entregue:

1. Comprueba que entiendes la planta baja V3.2, el segundo piso corregido y la maqueta V4 de dos pisos.
2. Resume brevemente qué existe y qué está pendiente, sin volver a contar todo el documento.
3. Revisa los recursos realmente disponibles y avisa si falta algo imprescindible para programar.
4. Ayúdame a definir el siguiente incremento, tomando como propuesta principal la V5 de iluminación, con un alcance pequeño y criterios claros de prueba.
5. Si te pido comenzar la implementación, trabaja sobre V4 y conserva las correcciones y parámetros indicados, salvo que acordemos un cambio justificado.

**Mi intención es seguir convirtiendo esta maqueta comprobable en un juego pequeño, atmosférico y terminable, con avances que podamos jugar y evaluar juntos.**

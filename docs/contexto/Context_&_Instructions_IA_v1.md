# PROYECTO: UMBRA — Videojuego de investigación paranormal

## 1\. Contexto general

Estamos preparando un videojuego para una hackathon de desarrollo de videojuegos.

La idea es desarrollar un juego de **terror psicológico e investigación paranormal en 2D, con pixel art y perspectiva superior (top-down)**.

La inspiración principal en términos de jugabilidad proviene de *Demonology* (Roblox) y *Phasmophobia*, mientras que las referencias visuales y de diseño incluyen *Hotline Miami*, *Undertale*, *Pokémon* y, para la estructura de los escenarios, *Resident Evil 7* y *Resident Evil Village*.

El objetivo no es copiar ninguno de estos juegos, sino combinar sus mejores elementos para desarrollar una experiencia original.

**Concepto principal:**

El jugador interpreta a un investigador paranormal que explora lugares presuntamente embrujados. Utilizando instrumentos especializados, debe descubrir evidencias sobrenaturales, registrar sus hallazgos en un diario e identificar correctamente el tipo de entidad presente, procurando sobrevivir a sus manifestaciones.

El juego estará orientado a partidas relativamente cortas, aproximadamente de 8 a 15 minutos como objetivo inicial, con posibilidad de repetir escenarios y encontrar entidades diferentes.

No buscamos desarrollar un RPG tradicional, un juego lineal con una historia demasiado extensa ni un mundo abierto.

La investigación, la incertidumbre y la interacción con el entorno deben ser el centro de la experiencia.

## 2\. Dirección artística acordada

Este apartado es especialmente importante porque hemos descartado algunas propuestas visuales anteriores.

### Perspectiva y escenarios

* Vista superior inspirada principalmente en Hotline Miami.
* Muros claramente definidos que permitan visualizar la distribución de habitaciones.
* Espacios suficientemente amplios para caminar, investigar y colocar instrumentos.
* Personajes y objetos con pixel art sencillo y expresivo, más cercano a Undertale que a un RPG tradicional como Chrono Trigger.
* El escenario no debe parecer una ilustración isométrica.
* Evitar escenarios demasiado recargados visualmente.

### Paleta de colores

Preferimos una paleta reducida, con colores poco saturados.

Para la mansión inicial:

* Negro y gris oscuro como colores predominantes.
* Tonos marrones apagados para pisos, muebles y elementos de madera.
* Grises claros y blancos envejecidos para ciertos muros.
* Azules oscuros y azul lunar para iluminación proveniente de ventanas.
* Amarillos cálidos tenues para velas, lámparas y linternas.

Cada escenario futuro podrá tener una identidad cromática ligeramente diferente.

### La oscuridad como mecánica

**La oscuridad es uno de los elementos más importantes del videojuego.**

No queremos que el jugador pueda observar automáticamente todo el mapa.

El escenario debe permanecer prácticamente invisible cuando no existen fuentes de iluminación.

Las fuentes de luz revelan únicamente una parte del entorno:

* Velas: iluminación circular pequeña, cálida y progresivamente atenuada.
* Lámparas: iluminación ambiental más amplia.
* Luz de luna: iluminación azulada que atraviesa ventanas.
* Linterna: haz de luz direccional controlado por el jugador.
* Electricidad: permite iluminar ciertas habitaciones hasta que ocurra un apagón.

Preferimos que el efecto de iluminación tenga una estética compatible con pixel art, evitando un aspecto excesivamente realista.

### Personaje principal

Ya tenemos un diseño visual preliminar de un investigador:

* Cabello negro y ligeramente despeinado.
* Rostro claro.
* Vestimenta oscura.
* Mochila marrón.
* Diseño compacto y expresivo.

Se diseñó una hoja de referencia con cuatro orientaciones: frente, espalda, izquierda y derecha.

También tenemos una idea importante para situaciones de oscuridad absoluta: **cuando el personaje queda completamente oculto, pueden verse únicamente sus dos ojos como pequeñas rayas blancas sobre el fondo negro**, evocando el recurso visual de los dibujos animados.

Esto puede convertirse en un recurso distintivo del juego.

Las imágenes del personaje serán entregadas como referencia. No asumir que constituyen spritesheets técnicamente terminados, con animaciones y dimensiones listas para implementar.

## 3\. Mecánicas principales

El ciclo de juego propuesto es:

**Entrar al escenario → Explorar → Detectar actividad paranormal → Reunir evidencias → Registrar hallazgos → Identificar la entidad → Escapar o finalizar la investigación.**

Las herramientas y evidencias consideradas son:

1. Termómetro: temperaturas sobrenaturalmente bajas.
2. Linterna ultravioleta: huellas y marcas invisibles.
3. Spirit Box: comunicación con entidades mediante preguntas.
4. Libro de escritura: mensajes paranormales.
5. Cámara fotográfica: capturar manifestaciones y acontecimientos.
6. Cámara de video: detectar orbes sobrenaturales.
7. Detector EMF: anomalías electromagnéticas.
8. Proyector láser: detectar siluetas invisibles.
9. Marchitamiento o alteraciones ambientales: flores, fotografías y objetos que cambian.

Estas son mecánicas candidatas, **no todas están aprobadas para la primera versión**.

Debemos seleccionar las más viables para desarrollar un prototipo funcional durante la hackathon.

### Diario de investigación

El diario será uno de los sistemas centrales.

Debe permitir:

* Consultar tipos de entidades.
* Marcar evidencias descubiertas.
* Descartar entidades incompatibles con las evidencias.
* Consultar herramientas y sus usos.
* Revisar fotografías y hallazgos.
* Registrar observaciones de la investigación.

Para la primera versión puede simplificarse, conservando como prioridad el sistema de evidencias e identificación.

### Comportamiento paranormal

Se proponen interacciones como:

* Luces que parpadean o se apagan.
* Puertas que se abren o cierran.
* Objetos que cambian de posición.
* Golpes y sonidos procedentes de otras habitaciones.
* Apariciones breves.
* Manifestaciones relacionadas con el tipo de entidad.
* Cacerías en las que el jugador debe esconderse o escapar.

Nos interesa especialmente que el jugador deba interpretar comportamientos y no solamente marcar evidencias de forma mecánica.

También consideramos un sistema simplificado de cordura o exposición paranormal, aunque su implementación todavía debe evaluarse.

## 4\. Primer escenario: Mansión Umbra

Hemos comenzado a diseñar el primer escenario, denominado provisionalmente **Mansión Umbra**.

Se trata de una mansión antigua de dos pisos, aparentemente abandonada, con muebles antiguos, habitaciones amplias y diferentes fuentes de iluminación.

Las referencias arquitectónicas incluyen el diseño de exploración de Resident Evil 7 y Resident Evil Village.

Sin embargo, el escenario no debe ser tan grande como los de esos videojuegos.

Necesitamos un mapa compacto, rejugable y apropiado para partidas cortas.

### Primer piso: distribución preliminar

Ya se generaron planos conceptuales y una versión revisada de la distribución.

Los espacios considerados son:

* Entrada principal con porche.
* Vestíbulo.
* Hall principal amplio.
* Escalera lateral que conduce al segundo piso.
* Living.
* Oficina o estudio.
* Dos dormitorios.
* Baño pequeño.
* Comedor.
* Cocina.
* Despensa.
* Galería trasera.
* Terraza posterior.
* Garaje.
* Patio lateral de servicio.
* Caja de fusibles exterior.

**La distribución aún no está aprobada como definitiva.**

### Decisiones de diseño del mapa

El hall principal debe funcionar como una referencia de orientación para el jugador.

Las alas de la mansión no deben ser perfectamente simétricas. Buscamos una estructura arquitectónica natural, con habitaciones de diferentes dimensiones.

Se desean conexiones secundarias entre habitaciones para que la exploración no dependa completamente del hall.

Las escaleras deben ser visibles desde el primer piso, pero no se debe mostrar lo que existe arriba hasta que el personaje suba. El segundo piso se tratará como otro mapa o nivel conectado.

La terraza y el patio deben permitir eventos sobrenaturales en exteriores.

El garaje debe ser un espacio explorable y tener una conexión coherente con la residencia o el patio.

### Caja de fusibles

La caja de fusibles debe estar ubicada en un lateral exterior de la mansión.

Será una mecánica de riesgo y exploración:

1. El espíritu provoca un apagón.
2. El jugador pierde gran parte de la iluminación artificial.
3. Debe desplazarse hasta la caja de fusibles.
4. Puede intentar restablecer la electricidad.
5. El recorrido puede exponerlo a eventos paranormales o cacerías.

Este sistema debe ser simple, entendible y reutilizable en otros mapas.

### Tamaño del escenario

Aunque visualmente queremos habitaciones amplias, no queremos construir una mansión gigantesca.

Es importante equilibrar:

* Tiempo de desplazamiento.
* Cantidad de habitaciones investigables.
* Distancia hasta la caja de fusibles.
* Posibles escondites.
* Ubicación de evidencias.
* Duración total de una partida.
* Posibilidad de reutilizar sistemas y herramientas en futuros escenarios.

El diseño debe priorizar la experiencia jugable antes que el realismo arquitectónico.

## 5\. Otros escenarios futuros

Además de la mansión, nos interesa explorar:

**Escuela japonesa abandonada:** aulas, pasillos, baños, laboratorios, gimnasio y patio, con una atmósfera nocturna inquietante.

**Gasolinería aislada:** tienda, surtidores, garaje, exteriores, lluvia, neón y fallas eléctricas.

**Hospital abandonado:** habitaciones, archivos médicos, pasillos y salas cerradas.

Estos escenarios son propuestas futuras y no deben incorporarse automáticamente al alcance inicial de la hackathon.

Idealmente, el diseño técnico permitirá reutilizar el sistema de evidencias, la iluminación, las entidades y el diario entre distintos mapas.

## 6\. Filosofía de diseño y restricciones

El videojuego debe ser fácil de comprender, pero suficientemente interesante para que cada partida genere incertidumbre.

Principios:

* Priorizar un prototipo jugable por encima de numerosas características incompletas.
* El terror debe surgir principalmente de la atmósfera, los sonidos, la oscuridad y la incertidumbre.
* Evitar depender exclusivamente de jumpscares.
* Permitir que el jugador explore y tome decisiones.
* Mantener una identidad artística consistente.
* Diseñar sistemas reutilizables.
* Evitar un exceso de habitaciones sin propósito.
* No asumir que todos los conceptos propuestos serán implementados.
* No añadir multijugador, IA generativa ni reconocimiento de voz real sin evaluar primero el tiempo y la complejidad.
* No introducir historia extensa o misiones lineales como eje del proyecto.

El motor de videojuego y la arquitectura técnica todavía no están definidos en esta conversación.

## 7\. Estado actual del proyecto

Hasta ahora hemos trabajado principalmente en preproducción conceptual.

Contamos con:

* Concepto general del videojuego.
* Referencias visuales y mecánicas.
* Dirección artística preliminar.
* Modelo conceptual del personaje.
* Referencia de las cuatro orientaciones.
* Idea visual del personaje en oscuridad absoluta.
* Conceptos de iluminación y ocultamiento.
* Primeros planos de la mansión.
* Distribución revisada con garaje, patio y caja de fusibles.
* Lista preliminar de herramientas, evidencias y eventos paranormales.

**No se ha confirmado en esta conversación la existencia de un proyecto programado, motor seleccionado, sistemas implementados ni pruebas de funcionamiento.**

Las imágenes aportadas son referencias conceptuales y deben utilizarse para comprender nuestras decisiones visuales y de diseño.

## 8\. Cómo quiero que continúes trabajando conmigo

Actúa como colaborador de diseño de videojuegos, diseñador de niveles y asesor técnico para una hackathon.

No quiero que simplemente apruebes todas mis ideas. Quiero que evalúes su utilidad, complejidad y coherencia, que señales problemas de diseño y que propongas alternativas.

Distingue siempre entre:

* Decisiones ya acordadas.
* Propuestas que todavía estamos evaluando.
* Características prioritarias.
* Características opcionales o futuras.
* Elementos efectivamente implementados y comprobados.

Prefiero que trabajemos de forma iterativa, tomando decisiones juntos.

No debemos comenzar generando grandes cantidades de código o recursos artísticos sin definir antes un alcance razonable.

### Primera tarea

Revisa las imágenes que voy a adjuntar, especialmente los planos esquemáticos de la Mansión Umbra y las referencias visuales del personaje.

A partir de ellas:

1. Analiza críticamente la distribución del primer piso.
2. Identifica problemas de circulación, conexiones, accesos, puertas y proporciones.
3. Evalúa si el tamaño es adecuado para partidas cortas.
4. Propón mejoras para el garaje, el patio lateral, la caja de fusibles, las escaleras y las rutas secundarias.
5. Evalúa qué habitaciones realmente aportan a la investigación y cuáles podrían combinarse o eliminarse.
6. Propón una distribución optimizada, sin perder la identidad visual y arquitectónica que hemos definido.
7. Después, ayúdame a construir un plan de producción realista para la hackathon, desde el prototipo jugable hasta una demostración final.

Por ahora, **prioriza la revisión del plano esquemático y las decisiones de diseño del primer piso**. No generes todavía una interpretación pixel art definitiva.

Quiero que desarrollemos un videojuego pequeño, atractivo, atmosférico y realmente jugable, en lugar de una propuesta demasiado ambiciosa que no podamos terminar durante la hackathon.

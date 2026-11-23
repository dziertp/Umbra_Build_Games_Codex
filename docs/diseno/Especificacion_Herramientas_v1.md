# Especificación: herramientas y evidencias (v1)

Pedido del equipo el 23-11-2026, 15:55. Decisiones de implementación en la sección final.

## 0. Inventario y sonido

Que la linterna esté en el inventario de forma predeterminada, pero que la puedas botar.

Que se puedan ocupar/activarlos objetos clickeandolos en las casillas cuadradas de abajo.
Como, encender la linterna dejar el libro con las inscripciones en el suelo, dejar las flores para que se marchiten en el suelo, click para activar cámara de video y demás.

Y que esté con sonido predeterminadamente.

## 1. Sistema general de evidencias

Cada partida debe seleccionar aleatoriamente una entidad y una habitación favorita dentro de la mansión.

Esta habitación debe poder pertenecer al primer o segundo piso y debe ser accesible para el jugador.

La habitación favorita será el lugar principal donde se manifiestan las evidencias. No debe cambiar arbitrariamente cada vez que se usa una herramienta.

Las evidencias disponibles dependen exclusivamente de:

state.entity.type.evidence

Usar las ocho evidencias actuales:

- emf
- uv
- spiritbox
- orbs
- freezing
- writing
- laser
- wither

Las herramientas no deben producir evidencias que la entidad seleccionada no posea.

El jugador debe explorar y localizar la actividad paranormal mediante sus instrumentos.

Las evidencias deben tener:
- Estado.
- Posición en el mundo.
- Piso correspondiente.
- Condiciones de aparición.
- Animación o representación visual.
- Posibilidad de observarlas y registrarlas.

No emitir evidence:found únicamente por entrar en una habitación o pulsar F. Emitirlo cuando la evidencia realmente se manifieste y el jugador pueda detectarla correctamente.

Evitar registrar la misma evidencia repetidamente.

## 2. Cámara de video — visión nocturna y orbes

Herramienta camera.

### Visión nocturna

Al equipar la cámara y activarla con F:

- Activar una visión nocturna de color verde.
- Aplicar una capa visual verde sobre el escenario visible.
- Oscurecer los tonos normales.
- Añadir un pequeño efecto de ruido o interferencia.
- Mostrar un marco de cámara y un indicador REC.
- Mostrar batería restante.

La cámara debe permitir caminar por la casa mientras está encendida.

No bloquear el movimiento normal del jugador.

### Batería

Implementar una batería que disminuya mientras la cámara está activa.

Propuesta:
- Batería inicial: 100 %.
- Duración aproximada: 90 segundos de uso continuo.
- Mostrar porcentaje o indicador de batería.
- Avisar cuando queda poca energía.
- Cuando llegue a cero, la visión nocturna se apaga.
- Poder recargarla al devolverla al panel de equipo del campamento.

La batería no debe consumirse cuando la cámara esté apagada.

### Orbes

Si la entidad tiene la evidencia orbs:

- Generar uno o varios orbes verdes pequeños.
- Deben desplazarse lentamente dentro de su habitación favorita.
- Usar movimientos flotantes suaves y ligeramente aleatorios.
- No atravesar paredes.
- No permanecer siempre en el mismo punto.
- Solo deben resultar visibles con la visión nocturna activa.
- No mostrar orbes si la entidad no tiene esa evidencia.

La habitación donde aparecen debe depender de la habitación aleatoria elegida para el fantasma en esa partida.

El jugador debe recorrer la mansión con la cámara para encontrarlos.

## 3. Flores — colocación y marchitamiento

Herramienta flowers.

Permitir colocar las flores en el suelo dentro de cualquier habitación de la mansión.

Al presionar F:
- Colocar el ramo frente al jugador.
- Mostrarlo como objeto pixel art en el suelo.
- Conservar su posición y piso.
- Retirarlo del inventario mientras esté colocado.
- Permitir recuperarlo acercándose y utilizando E.

Las flores comienzan frescas.

Si la entidad tiene wither:
- Después de una cacería, los ramos colocados dentro de la mansión pueden marchitarse, independientemente de la habitación donde se dejaron.
- Cambiar visualmente sus colores y forma.
- Utilizar tonos marrones, grises y hojas caídas.
- Mantenerlas marchitas hasta que el jugador las recoja o finalice la partida.
- Registrar la evidencia cuando el jugador observe un ramo marchito.

Si la entidad no tiene wither, las flores permanecen frescas.

No permitir falsos positivos.

## 4. Termómetro — temperaturas bajo cero

Herramienta thermometer.

El termómetro debe mostrar una temperatura numérica real en grados Celsius.

Funcionamiento:
- Mostrar lectura mientras está equipado y activo.
- Actualizarla periódicamente.
- Utilizar pequeñas fluctuaciones para que parezca una medición real.
- Mostrar la lectura en el HUD y, si es posible, en el dibujo del instrumento.

En habitaciones normales:
- Temperaturas ambientales positivas y variables.

En la habitación favorita de la entidad:
- Si tiene freezing, mostrar temperaturas menores a 0 °C, por ejemplo entre −2 °C y −8 °C.
- Si no tiene freezing, mantener temperaturas positivas aunque puedan ser bajas.

El jugador debe recorrer las habitaciones para encontrar la zona fría.

No registrar evidencia si la temperatura sigue sobre 0 °C.

## 5. Linterna UV — huellas fluorescentes

Herramienta uv.

Al activarla:
- Emitir un haz de luz morada desde el jugador.
- Orientarlo hacia donde está mirando.
- Iluminar puertas, paredes y suelo cercanos.
- Mantener el efecto visual dentro del estilo pixel art.

Si la entidad tiene uv:
- Generar huellas de manos o pisadas en superficies cercanas a su actividad.
- Las huellas deben ser invisibles con iluminación normal.
- Al iluminarlas con UV, aparecerán en verde fosforescente.
- Las pisadas deben tener forma reconocible y orientación.
- Las huellas deben aparecer en posiciones coherentes con el recorrido o los eventos del fantasma.
- Permanecer durante un tiempo suficiente para encontrarlas.

Si la entidad no tiene uv, el haz morado sigue funcionando, pero no aparecen huellas paranormales.

Evitar que la luz atraviese paredes.

## 6. Linterna normal

Herramienta flashlight.

Debe funcionar independientemente de la entidad seleccionada.

Reglas:
- Iluminar en la dirección del jugador.
- Encender y apagar con L.
- Funcionar solamente cuando la linterna está en una de las cuatro ranuras.
- Mantener la iluminación y las sombras existentes.
- No generar ninguna evidencia paranormal.
- Respetar el parpadeo durante cacerías.

No reemplazar el sistema de iluminación existente si ya cumple estas funciones.

## 7. Cuaderno — escritura paranormal

Herramienta book.

Al presionar F:
- Dejar el cuaderno abierto en el suelo.
- Mostrar sus páginas.
- Retirarlo temporalmente del inventario.
- Permitir recogerlo nuevamente con E.

Puede colocarse en cualquier habitación.

Si la entidad tiene writing:
- Cuando el cuaderno esté en su habitación favorita o cerca de su recorrido, podrá escribir después de cierto tiempo.
- La escritura no debe aparecer instantáneamente.
- Mostrar rayones, símbolos o palabras oscuras sobre las páginas.
- Preferentemente utilizar una pequeña animación de escritura.
- La escritura permanece visible para que el jugador pueda volver y revisarla.

Si la entidad no tiene writing, el cuaderno permanece en blanco.

Registrar evidencia cuando el jugador vea la escritura al acercarse o examinar el cuaderno.

## 8. Medidor EMF — indicador visual de cinco niveles

Herramienta emf.

Crear una representación gráfica de cinco luces o barras.

Funcionamiento:
- Nivel 1: ambiente normal.
- Nivel 2–4: actividad electromagnética o eventos cercanos.
- Nivel 5: evidencia paranormal específica.

Si la entidad tiene emf:
- Al acercarse a su actividad o durante ciertos eventos, el medidor puede alcanzar nivel 5.
- Encender las cinco luces.
- Mostrar cambios visuales y emitir el sonido de detección ya integrado.

Si la entidad no tiene emf:
- Puede detectar actividad menor para mantener el suspenso.
- Nunca debe mostrar nivel 5 como evidencia real.

La medición debe depender de la distancia, el piso y la actividad de la entidad.

No debe bastar con equipar el medidor para detectar automáticamente EMF 5.

## 9. Proyector láser — puntos verdes y siluetas

Herramienta laser.

Quiero que tenga dos formas de uso.

### Modo portátil

El jugador puede llevarlo encendido en la mano.

- F enciende o apaga el proyector.
- Proyecta múltiples puntos verdes en la dirección del jugador.
- El efecto debe desplazarse con el movimiento y orientación del personaje.

### Modo colocado

Permitir dejarlo sobre el suelo mediante una tecla libre, preferentemente G, previa comprobación de conflictos.

- Guardar su posición, piso y dirección.
- Mantenerlo encendido después de colocarlo.
- Retirarlo del inventario mientras está en el suelo.
- Permitir recogerlo con E.

### Evidencia de silueta

Si la entidad tiene laser:
- Cuando el fantasma se encuentre dentro del área proyectada, mostrar brevemente una silueta.
- La silueta debe aparecer entre los puntos verdes.
- Debe resultar visible como una interrupción, deformación o figura que atraviesa la malla.
- Puede aparecer en movimiento y desaparecer rápidamente.

Si la entidad no tiene laser, la proyección sigue funcionando, pero nunca aparece una silueta paranormal.

Los puntos verdes deben respetar razonablemente los límites de las habitaciones.

## 10. Radio de espíritus

Conservar spiritbox y mejorar su representación gráfica.

- Mostrar frecuencias cambiantes.
- Animar pequeñas barras de señal.
- Mantener el sonido de estática.
- Si la entidad tiene spiritbox y se cumplen las condiciones, permitir una respuesta breve.
- Si no tiene esa evidencia, mostrar únicamente ruido y ausencia de respuesta.

No eliminar las integraciones existentes de audio.

## 11. Objetos colocados en el mundo

Crear una estructura común para objetos colocables.

Cada objeto debe registrar:
- Identificador de herramienta.
- Posición X/Y.
- Piso.
- Estado activo o apagado.
- Estado paranormal, si corresponde.
- Tiempo transcurrido cuando sea necesario.

Los objetos deben:
- Permanecer visibles al alejarse.
- Conservar su estado al cambiar de piso.
- No duplicarse.
- No aparecer sobre paredes ni muebles sólidos.
- Poder recogerse nuevamente.
- Liberar y recuperar correctamente espacios del inventario.

Respetar las interacciones existentes de E con armarios, interruptores, campamento y otros objetos.

## 12. Entidad aleatoria en cada partida

Conservar la selección aleatoria existente.

Cada partida nueva debe:
- Elegir una entidad del catálogo.
- Elegir una habitación favorita accesible.
- Reiniciar evidencias y objetos colocados.
- Reiniciar la batería.
- Reiniciar el inventario.
- Reiniciar los temporizadores paranormales.

Cuando el jugador muera:
- Mostrar primero la pantalla de derrota.
- Al volver al menú e iniciar otra partida, elegir una nueva entidad.
- Para evitar repetición inmediata después de morir, excluir la entidad anterior del sorteo si existen otras disponibles.

No cambiar la entidad a mitad de una investigación.

No mostrar el tipo de entidad al jugador fuera del modo depuración.

## 13. Integración con el diario

Mantener las ocho evidencias y el filtrado de entidades.

Cada evidencia debe quedar confirmada solo después de una observación válida.

No permitir que una herramienta detecte evidencias fuera de sus condiciones.

Conservar la opción de marcar o descartar evidencias manualmente en el diario.

No convertir automáticamente una lectura normal en evidencia confirmada.

## 14. Cacerías y coherencia

Conservar:
- hunt:start
- hunt:end
- hunt:step
- player:caught

Las herramientas electrónicas pueden mostrar interferencias durante una cacería, como ya ocurre.

No permitir registrar evidencias falsas por estas interferencias.

Las flores se actualizan al finalizar la cacería cuando corresponda.

Los objetos colocados deben seguir existiendo después de una cacería.

No afectar el movimiento, las escaleras ni la IA del fantasma.

## Decisiones de implementación (acordadas)

- **F** usa el objeto equipado (linterna incluida; **L** sigue como atajo). **Clic en una ranura**: si no está equipada, la equipa; si ya está equipada, la usa (igual que F).
- **G** suelta en el suelo el objeto equipado (cualquiera). Los objetos colocables (cuaderno, flores, láser) se colocan con F o con G; el láser colocado sigue encendido. **E** recoge objetos del suelo.
- La linterna empieza en la ranura 1; se puede soltar (G) o devolver al panel.
- El sonido empieza activado.
- Objetos colocados: lista común `state.placed = [{ id, tool, x, y, floor, on, paranormal, t }]`.
- `evidence:found` solo cuando la evidencia se manifiesta y el jugador la observa; una vez por evidencia; nunca durante interferencia de cacería.

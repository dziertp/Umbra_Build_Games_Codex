# Propuesta de interfaz: tablero de objetivos

**Diseño:** Anais Tapia, con asistencia de Codex.  
**Estado:** mockup para revisión; todavía no está integrado al juego.

## Vista

- `Tablero_Objetivos_Anais_v1.png`: pantalla conceptual a 480 × 270, ampliada al doble para conservar los píxeles.

El tablero adapta la estructura de la referencia compartida por Anais al estilo pixel art de Umbra: marco de madera, papel cálido, objetivos numerados y casillas de avance. El ejemplo muestra tres tareas completadas y una pendiente, para contextualizar el guiño «Queda una pura misión». En una integración real, el estado de las casillas y esa frase tendrían que actualizarse con el progreso del jugador.

## Objetivos propuestos

1. Identificar a la entidad con las pistas del diario.
2. Escapar de una cacería escondiéndose.
3. Registrar un evento paranormal.
4. Detectar actividad EMF con el medidor.

Son textos de propuesta basados en mecánicas que ya aparecen en el juego; su seguimiento visual y cualquier cambio a la interfaz requieren coordinación con la persona responsable de `src/journal.js` y `src/ui.js`.

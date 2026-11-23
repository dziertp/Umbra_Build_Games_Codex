# Entidades de Umbra — primera selección

**Responsable:** Anais Tapia  
**Alcance de esta versión:** cuatro entidades para el catálogo inicial. El repositorio tenía 24 nombres provisionales; esta propuesta los reemplaza por cuatro perfiles con identidad visual, tres pistas y un comportamiento distinguible. Se puede ampliar después de probar el ritmo de investigación.

Las tarjetas de Demonology (Roblox) del diario del equipo sirvieron como referencia de género y lectura visual. Los nombres, descripciones y conceptos de abajo son nuevos; no se reutilizan sus nombres ni sus ilustraciones.

| ID | Nombre de Umbra | Evidencias | Comportamiento | Idea visual |
| --- | --- | --- | --- | --- |
| `pliegasombra` | La Pliegasombra | Temperatura bajo cero, orbes, EMF nivel 5 | Sus cacerías comienzan antes (`huntEarly`). | Manto oscuro suspendido, pliegues que se deshacen en humo y ojos pálidos. |
| `hilvanado` | El Hilvanado | Temperatura bajo cero, silueta en el láser, escritura | Se mueve más lento en habitaciones iluminadas (`slowInLight`). | Cintas rotas de tela y papel, costuras visibles y una máscara pequeña de un solo ojo. |
| `brasa-velada` | La Brasa Velada | Orbes, silueta en el láser, huellas | Sus cacerías son más probables cuando el jugador está a oscuras (`prefersDark`). | Figura compacta de humo con una cavidad de luz fría en el pecho y dos colas curvas. |
| `enramado` | El Enramado | Escritura, flores marchitas, respuesta en la radio | Corre un poco más rápido durante la cacería (`speed: 1.08`). | Silueta encorvada; mangas y espalda se abren en raíces finas, sin cuernos ni astas. |

## Láminas visuales

Cada PNG es una hoja conceptual de 1024 × 1024 con cuatro vistas aproximadas: frente, espalda y dos perfiles. El fondo es opaco y las figuras no están separadas en celdas; por eso son referencias de diseño, no sprites listos para importar al juego. Se generaron para este proyecto con OpenAI API (`gpt-image-2`) a partir de descripciones originales y luego se asignaron nombres y rasgos para Umbra.

- [La Pliegasombra](../../assets/entities/concept_sheets/pliegasombra_4_vistas.png)
- [El Hilvanado](../../assets/entities/concept_sheets/hilvanado_4_vistas.png)
- [La Brasa Velada](../../assets/entities/concept_sheets/brasa_velada_4_vistas.png)
- [El Enramado](../../assets/entities/concept_sheets/enramado_4_vistas.png)

## Datos del juego

Los cuatro registros están en `src/data/entities.js`; cada uno usa exactamente tres IDs existentes en `src/data/evidence.js`. Los rasgos se limitan a los comportamientos que reconoce `src/entity.js`. Las imágenes quedan como guía para una futura adaptación al tamaño, paleta y transparencia de los sprites del juego.

## Créditos de generación

Conceptos visuales producidos con OpenAI API, modelo `gpt-image-2`, por encargo de Anais Tapia. Según los términos de OpenAI, la salida se asigna al cliente; los PNG no quedan cubiertos por la licencia MIT del código del repositorio. La selección final y los nombres son trabajo de diseño para Umbra.


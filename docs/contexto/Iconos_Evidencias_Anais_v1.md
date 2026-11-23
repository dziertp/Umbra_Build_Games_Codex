# Iconos pixel art de evidencias — Anais v1

**Responsable:** Anais Tapia
**Alcance:** ocho propuestas de iconos para las evidencias actuales de Umbra, dibujadas en pixel art compacto para mantener la escala y paleta de los personajes.

## Correspondencia

| ID | Evidencia del juego | Motivo del icono | Archivo |
| --- | --- | --- | --- |
| `emf` | EMF nivel 5 | Medidor con luces rojas | [emf_12x12.png](../../assets/evidence/icons_12x12/emf_12x12.png) |
| `uv` | Huellas | Marca de mano violeta | [uv_12x12.png](../../assets/evidence/icons_12x12/uv_12x12.png) |
| `spiritbox` | Respuesta en la radio | Radio con pantalla y señal | [spiritbox_12x12.png](../../assets/evidence/icons_12x12/spiritbox_12x12.png) |
| `orbs` | Orbes | Tres luces flotantes | [orbs_12x12.png](../../assets/evidence/icons_12x12/orbs_12x12.png) |
| `freezing` | Temperatura bajo cero | Copo de nieve | [freezing_12x12.png](../../assets/evidence/icons_12x12/freezing_12x12.png) |
| `writing` | Escritura | Cuaderno abierto con marcas | [writing_12x12.png](../../assets/evidence/icons_12x12/writing_12x12.png) |
| `laser` | Silueta en el láser | Retícula verde interrumpida | [laser_12x12.png](../../assets/evidence/icons_12x12/laser_12x12.png) |
| `wither` | Flores marchitas | Flor caída y tallo seco | [wither_12x12.png](../../assets/evidence/icons_12x12/wither_12x12.png) |

## Formato

Cada archivo individual mide **12 × 12 píxeles**, usa transparencia RGBA y una paleta corta. La hoja [evidencias_8_iconos_12x12.png](../../assets/evidence/evidencias_8_iconos_12x12.png) agrupa los ocho cuadros en una grilla de 4 × 2: EMF, huellas, radio, orbes en la primera fila; frío, escritura, láser y flor marchita en la segunda.

## Estado

Son conceptos visuales nuevos, separados de los iconos que el diario ya dibuja desde `src/journal.js`. Esta entrega solo añade archivos bajo `assets/evidence/` y esta guía; no cambia `src/data/evidence.js`, `src/journal.js` ni ninguna lógica. Isidora puede revisar la propuesta antes de decidir si la integra.

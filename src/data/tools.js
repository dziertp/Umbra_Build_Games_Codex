// Herramientas de investigación. Una por evidencia; teclas 1 a 8.
// idleReading: lectura normal. readings[evidencia]: lectura cuando la detecta.
Umbra.data.tools = [
  { id: 'emf', hint: 'F: mídelo en la habitación de la entidad. Nivel 5 = evidencia.', name: 'Medidor EMF', key: 'Digit1', evidence: ['emf'], idleReading: 'Nivel 1 / 5', readings: { emf: 'Nivel 5 / 5' },
    description: 'Mide la actividad electromagnética. Cinco luces encendidas cuentan como evidencia; menos, solo indican actividad cercana.' },
  { id: 'uv', hint: 'F: ilumina paredes y puertas buscando huellas.', name: 'Linterna UV', key: 'Digit2', evidence: ['uv'], idleReading: 'Nada a la vista', readings: { uv: 'Huellas en la pared' },
    description: 'Ilumina superficies con luz ultravioleta para revelar huellas que no se ven a simple vista.' },
  { id: 'spiritbox', hint: 'F: pregunta en la habitación de la entidad. Si responde, es evidencia.', name: 'Radio de espíritus', key: 'Digit3', evidence: ['spiritbox'], idleReading: 'Estática…', readings: { spiritbox: '«…aquí…»' },
    description: 'Recorre frecuencias de radio. Úsala en silencio y haz una pregunta: a veces algo contesta.' },
  { id: 'camera', hint: 'F: graba la habitación. Orbes flotando = evidencia.', name: 'Cámara de video', key: 'Digit4', evidence: ['orbs'], idleReading: 'Imagen limpia', readings: { orbs: 'Orbes en la imagen' },
    description: 'Graba en visión nocturna. Algunas presencias aparecen como luces flotantes.' },
  { id: 'thermometer', hint: 'F: mide la temperatura. Bajo 0 °C = evidencia.', name: 'Termómetro', key: 'Digit5', evidence: ['freezing'], idleReading: '12 °C', readings: { freezing: '−4 °C' },
    description: 'Mide la temperatura de la habitación. Bajo cero es una señal clara de presencia.' },
  { id: 'book', hint: 'F: déjalo abierto en su habitación. Si escribe, es evidencia.', name: 'Cuaderno', key: 'Digit6', evidence: ['writing'], idleReading: 'Página en blanco', readings: { writing: '«NO MIRES ATRÁS»' },
    description: 'Déjalo abierto cerca de la presencia. Algunas entidades escriben en él.' },
  { id: 'laser', hint: 'F: proyecta la malla. Una silueta = evidencia.', name: 'Proyector láser', key: 'Digit7', evidence: ['laser'], idleReading: 'Malla estable', readings: { laser: 'Una silueta cruza la malla' },
    description: 'Proyecta una malla de puntos verdes. Una figura invisible la deforma al moverse.' },
  { id: 'flowers', hint: 'F: déjalas en su habitación. Si se marchitan, es evidencia.', name: 'Flores', key: 'Digit8', evidence: ['wither'], idleReading: 'Flores frescas', readings: { wither: 'Flores marchitas' },
    description: 'Un ramo fresco. Algunas entidades lo marchitan al pasar cerca.' },
  { id: 'flashlight', hint: 'F o L: enciende o apaga la linterna.', name: 'Linterna', evidence: [], light: true, description: 'Linterna de mano. Sin ella, la casa está a oscuras.' },
  { id: 'completo', name: 'Completo italiano', evidence: [], description: 'No sirve de mucho, pero por si te da hambre.', hint: 'F: darle un mordisco.' },
];

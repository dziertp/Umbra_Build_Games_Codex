// Catálogo inicial de Umbra: cuatro entidades originales para la primera versión.
// Cada una tiene tres evidencias del catálogo de src/data/evidence.js.
// Las láminas de cuatro vistas son conceptos visuales; aún no son sprites del juego.
// Rasgos con efecto activo en la lógica actual de src/entity.js:
// speed, huntEarly, prefersDark, slowInLight y quiet.
Umbra.data.entities = [
  {
    id: 'pliegasombra',
    name: 'La Pliegasombra',
    evidence: ['freezing', 'orbs', 'emf'],
    description: 'Una sombra envuelta en pliegues que guarda frío en la habitación. Sus cacerías comienzan antes que las de otras presencias.',
    traits: { huntEarly: true },
  },
  {
    id: 'hilvanado',
    name: 'El Hilvanado',
    evidence: ['freezing', 'laser', 'writing'],
    description: 'Cintas de tela y papel cubren su rostro. Se mueve más despacio cuando la habitación está iluminada.',
    traits: { slowInLight: true },
  },
  {
    id: 'brasa-velada',
    name: 'La Brasa Velada',
    evidence: ['orbs', 'laser', 'uv'],
    description: 'Una cavidad de luz fría late bajo su manto. Sus cacerías son más probables cuando estás a oscuras.',
    traits: { prefersDark: true },
  },
  {
    id: 'enramado',
    name: 'El Enramado',
    evidence: ['writing', 'wither', 'spiritbox'],
    description: 'Sus mangas terminan en raíces secas. Durante una cacería corre un poco más rápido que otras presencias.',
    traits: { speed: 1.08 },
  },
];


// Entidades de Umbra: 3 evidencias cada una (de las 8 de evidence.js).
// NOMBRES PROVISIONALES: Anais los reemplaza por nombres propios de Umbra.
// Las combinaciones de evidencias se basan en Demonology (Roblox), usada como referencia de diseño;
// los textos están escritos por el equipo.
//
// traits (comportamiento, opcionales; los usa entity.js):
//   speed        multiplicador de velocidad en cacería (1 = normal)
//   huntEarly    caza antes / con más frecuencia
//   eventRate    multiplicador de frecuencia de eventos (1 = normal)
//   prefersDark  más activa con poca luz
//   slowInLight  más lenta en habitaciones iluminadas
//   killsLights  corta la luz más seguido
//   quiet        no hace ruido de pasos
//   throws       lanza objetos con más frecuencia
//   wallhack     puede rastrear o moverse a través de muros
Umbra.data.entities = [
  { id: 'aswang', name: 'Aswang', evidence: ['emf', 'writing', 'wither'],
    description: 'Criatura hambrienta que nació en islas lejanas y ahora aparece en cualquier parte. Se vuelve más rápida con cada víctima.',
    traits: { speed: 1.1 } },
  { id: 'banshee', name: 'Banshee', evidence: ['freezing', 'orbs', 'uv'],
    description: 'Su llanto rompe vidrios. Durante la cacería lanza un grito que la delata.',
    traits: { eventRate: 1.2 } },
  { id: 'demon', name: 'Demonio', evidence: ['emf', 'freezing', 'uv'],
    description: 'Agresivo y paciente a la vez. Caza más seguido que cualquier otra entidad.',
    traits: { huntEarly: true } },
  { id: 'doppelganger', name: 'Doppelgänger', evidence: ['freezing', 'writing', 'spiritbox'],
    description: 'Imita a otras presencias y puede fingir señales que no le pertenecen.',
    traits: { eventRate: 1.1 } },
  { id: 'dullahan', name: 'Dullahan', evidence: ['freezing', 'laser', 'wither'],
    description: 'Una figura sin cabeza. Se acelera mientras más tiempo la miras.',
    traits: { speed: 1.05 } },
  { id: 'dybbuk', name: 'Dybbuk', evidence: ['freezing', 'uv', 'wither'],
    description: 'Arroja lo que encuentra. Una melodía conocida lo deja aturdido un momento.',
    traits: { throws: true } },
  { id: 'entity', name: 'Ente', evidence: ['uv', 'laser', 'spiritbox'],
    description: 'Aparece y desaparece de un lugar a otro, y hace lo mismo con los objetos antes de arrojarlos.',
    traits: { throws: true } },
  { id: 'ghoul', name: 'Ghoul', evidence: ['freezing', 'orbs', 'spiritbox'],
    description: 'Reacciona a las voces. No puede apagar los aparatos electrónicos.',
    traits: { eventRate: 0.9 } },
  { id: 'keres', name: 'Keres', evidence: ['uv', 'spiritbox', 'wither'],
    description: 'Busca primero a quien está más débil. Se vuelve más lenta con cada víctima.',
    traits: { speed: 0.95 } },
  { id: 'leviathan', name: 'Leviatán', evidence: ['writing', 'uv', 'orbs'],
    description: 'Hace parpadear los equipos y corta la luz incluso cuando no está cazando.',
    traits: { killsLights: true } },
  { id: 'nightmare', name: 'Pesadilla', evidence: ['emf', 'orbs', 'spiritbox'],
    description: 'Provoca visiones. Caza con más frecuencia en la oscuridad.',
    traits: { prefersDark: true } },
  { id: 'oni', name: 'Oni', evidence: ['freezing', 'laser', 'spiritbox'],
    description: 'Muy activo: se manifiesta seguido y corre durante la cacería.',
    traits: { eventRate: 1.4, speed: 1.1 } },
  { id: 'phantom', name: 'Fantasma', evidence: ['emf', 'uv', 'orbs'],
    description: 'Durante la cacería parpadea más lento y se mueve más rápido cuando no se ve.',
    traits: { speed: 1.05 } },
  { id: 'ravager', name: 'Asolador', evidence: ['emf', 'writing', 'spiritbox'],
    description: 'Lanza varios objetos a la vez. Todo lo que hace deja el medidor al máximo.',
    traits: { throws: true } },
  { id: 'shadow', name: 'Sombra', evidence: ['emf', 'writing', 'laser'],
    description: 'Enfría el ambiente y se calma en habitaciones bien iluminadas.',
    traits: { prefersDark: true, eventRate: 0.8 } },
  { id: 'siren', name: 'Sirena', evidence: ['emf', 'spiritbox', 'wither'],
    description: 'Atrae a quien la ve durante la cacería. Siempre responde con voz de mujer.',
    traits: { eventRate: 1 } },
  { id: 'specter', name: 'Espectro', evidence: ['emf', 'freezing', 'laser'],
    description: 'No deambula: solo se mueve cuando caza, y suele lanzar objetos.',
    traits: { throws: true, eventRate: 0.8 } },
  { id: 'spirit', name: 'Espíritu', evidence: ['writing', 'uv', 'spiritbox'],
    description: 'La presencia más común. No tiene fortalezas claras; puede cambiar el color de las velas.',
    traits: {} },
  { id: 'wisp', name: 'Fuego fatuo', evidence: ['orbs', 'laser', 'wither'],
    description: 'Atraviesa el fuego. Solo empieza a cazar desde su habitación favorita.',
    traits: { eventRate: 0.9 } },
  { id: 'umbra', name: 'Umbra (renombrar)', evidence: ['uv', 'orbs', 'laser'],
    description: 'No hace ruido al caminar. Se mueve más lento en habitaciones iluminadas.',
    traits: { quiet: true, slowInLight: true } },
  { id: 'vesper', name: 'Vesper', evidence: ['writing', 'uv', 'wither'],
    description: 'Caza guiada solo por el sonido y puede seguirte a través de los muros.',
    traits: { wallhack: true } },
  { id: 'vex', name: 'Vex', evidence: ['freezing', 'orbs', 'wither'],
    description: 'Invisible para los escáneres y capaz de atravesar paredes.',
    traits: { wallhack: true } },
  { id: 'wraith', name: 'Espanto', evidence: ['emf', 'laser', 'spiritbox'],
    description: 'Agota rápido a quien la enfrenta y evita cruzar las líneas de sal.',
    traits: { huntEarly: true } },
  { id: 'wretch', name: 'Desdichado', evidence: ['writing', 'orbs', 'laser'],
    description: 'Busca cerca de las llamas encendidas y se acelera cuando el grupo está agotado.',
    traits: { speed: 1.05 } },
];

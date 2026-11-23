// Umbra — núcleo compartido. Se carga antes que cualquier otro script del juego.
// Contrato entre módulos: cada sistema se registra con Umbra.register({...}).
(function () {
  'use strict';
  const listeners = {};
  const Umbra = {
    data: {},      // contenido: entities, evidence, tools, maps (archivos en src/data/)
    systems: [],   // sistemas registrados (oscuridad, entidad, herramientas, diario...)
    state: null,   // estado de la partida; lo crea main.js
    // Registra un sistema. Todos los métodos son opcionales:
    //   start(state)              al empezar una partida
    //   update(dt, state)         cada fotograma de juego
    //   onKey(event, state)       tecla pulsada en partida; devolver true la consume
    //   drawWorld(ctx, state)     dibujo en coordenadas del mundo, bajo el jugador
    //   drawLight(ctx, state)     capa de luz/oscuridad, coordenadas de pantalla
    //   drawUI(ctx, state)        interfaz, coordenadas de pantalla, encima de todo
    // order: número menor se ejecuta y dibuja antes (por defecto 0).
    register(system) {
      Umbra.systems.push(system);
      Umbra.systems.sort((a, b) => (a.order || 0) - (b.order || 0));
      return system;
    },
    on(name, fn) {
      (listeners[name] = listeners[name] || []).push(fn);
    },
    emit(name, payload) {
      for (const fn of listeners[name] || []) fn(payload, Umbra.state);
    },
    call(method, ...args) {
      for (const s of Umbra.systems) if (typeof s[method] === 'function') s[method](...args);
    },
  };
  globalThis.Umbra = Umbra;
})();

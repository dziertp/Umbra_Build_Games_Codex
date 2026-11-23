(function () {
  'use strict';

  let context, master, noiseBuffer, drone, droneGain;
  let muted = false;
  let previousPosition, stepDistance, previousLamps, outageSource;
  let pendingPower, lastPower;
  const voices = new Set();

  function unlock() {
    const Audio = globalThis.AudioContext;
    if (!Audio || muted) return;
    if (!context) {
      context = new Audio();
      master = context.createGain();
      master.gain.value = 0.65;
      master.connect(context.destination);
      noiseBuffer = context.createBuffer(1, Math.ceil(context.sampleRate * 0.6), context.sampleRate);
      const samples = noiseBuffer.getChannelData(0);
      for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
    }
    if (context.state === 'suspended') context.resume().catch(() => {});
  }

  function output(state, position) {
    if (state.scene !== 'play' || muted || context?.state !== 'running') return null;
    if (!position) return { volume: 1, pan: 0 };
    const dx = position.x - state.player.x;
    const dy = position.y - state.player.y;
    const distance = Math.hypot(dx, dy);
    const floorGain = position.floor === state.floor ? 1 : 0.28;
    return {
      volume: floorGain / (1 + (distance / 150) ** 2),
      pan: Math.max(-0.85, Math.min(0.85, dx / 180)),
    };
  }

  function voice(settings, duration, level, from, to, type) {
    if (!settings || voices.size >= 16 || settings.volume < 0.015) return;
    const now = context.currentTime;
    const end = now + duration;
    const envelope = context.createGain();
    envelope.gain.setValueAtTime(0.0001, now);
    envelope.gain.exponentialRampToValueAtTime(Math.max(0.0001, level * settings.volume), now + 0.008);
    envelope.gain.exponentialRampToValueAtTime(0.0001, end);
    const pan = context.createStereoPanner();
    pan.pan.value = settings.pan;
    envelope.connect(pan).connect(master);

    let source, filter;
    if (type === 'noise') {
      source = context.createBufferSource();
      source.buffer = noiseBuffer;
      filter = context.createBiquadFilter();
      filter.type = 'bandpass';
      source.connect(filter).connect(envelope);
    } else {
      source = context.createOscillator();
      source.type = type;
      source.connect(envelope);
    }
    const frequency = (filter || source).frequency;
    frequency.setValueAtTime(from, now);
    frequency.exponentialRampToValueAtTime(to, end);
    voices.add(source);
    source.onended = () => {
      voices.delete(source);
      source.disconnect();
      filter?.disconnect();
      envelope.disconnect();
      pan.disconnect();
    };
    source.start(now);
    source.stop(end);
  }

  function stopDrone() {
    if (!drone) return;
    const now = context.currentTime;
    droneGain.gain.setTargetAtTime(0, now, 0.045);
    drone.stop(now + 0.2);
    drone = null;
    droneGain = null;
  }

  function updateDrone(active) {
    if (!active) {
      stopDrone();
      return;
    }
    if (drone || muted || context?.state !== 'running') return;
    const source = context.createOscillator();
    const gain = context.createGain();
    source.type = 'triangle';
    source.frequency.value = 46;
    gain.gain.value = 0;
    gain.gain.setTargetAtTime(0.034, context.currentTime, 0.35);
    source.connect(gain).connect(master);
    source.onended = () => {
      source.disconnect();
      gain.disconnect();
    };
    source.start();
    drone = source;
    droneGain = gain;
  }

  function updateSteps(state) {
    const { x, y } = state.player;
    const { floor } = state;
    const distance = previousPosition?.floor === floor
      ? Math.hypot(x - previousPosition.x, y - previousPosition.y) : 0;
    previousPosition = { x, y, floor };
    if (!distance || distance > 28 || state.journal?.open) {
      stepDistance = 0;
      return;
    }
    stepDistance += distance;
    const running = state.keys.has('ShiftLeft') || state.keys.has('ShiftRight');
    if (stepDistance < (running ? 24 : 30)) return;
    stepDistance = 0;
    voice(output(state), 0.11, running ? 0.12 : 0.08, 250, 95, 'noise');
  }

  function updatePower(state) {
    // Comprueba cambios reales, incluso si se pulsa E con los fusibles ya activos.
    const power = state.power;
    if (!power) return;
    if (pendingPower !== undefined) {
      voice(output(state, power.on ? null : outageSource), 0.26, 0.18,
        power.on ? 72 : 115, power.on ? 118 : 28, 'triangle');
      pendingPower = undefined;
    }
    outageSource = null;

    for (const [floor, lamps] of power.lamps.entries()) {
      for (const [index, on] of lamps.entries()) {
        if (previousLamps[floor][index] === on) continue;
        previousLamps[floor][index] = on;
        const { x, y } = power.switches[floor][index];
        voice(output(state, { x, y, floor }), 0.045, 0.11, 1800, 600, 'noise');
      }
    }
  }

  function queuePower(_, state) {
    if (!state.power || lastPower === state.power.on) return;
    lastPower = state.power.on;
    pendingPower = lastPower;
  }

  // power.js procesa la transición primero. El evento ambiental aporta la posición.
  Umbra.on('power:off', queuePower);
  Umbra.on('power:on', queuePower);
  Umbra.on('entity:event', (event, state) => {
    if (event.kind === 'power') {
      outageSource = event;
      return;
    }
    const settings = output(state, event);
    switch (event.kind) {
      case 'thud': voice(settings, 0.17, 0.24, 91, 35, 'triangle'); break;
      case 'creak': voice(settings, 0.44, 0.10, 225, 320, 'sawtooth'); break;
      case 'door': voice(settings, 0.36, 0.19, 530, 120, 'noise'); break;
      case 'whisper': voice(settings, 0.52, 0.13, 1600, 720, 'noise'); break;
      case 'steps': voice(settings, 0.15, 0.15, 180, 80, 'noise'); break;
    }
  });
  Umbra.on('hunt:start', (_, state) => {
    const settings = output(state);
    voice(settings, 0.44, 0.31, 80, 31, 'triangle');
    voice(settings, 0.58, 0.07, 150, 63, 'sawtooth');
  });
  Umbra.on('hunt:step', (event, state) => {
    voice(output(state, event), 0.16, 0.23, 90, 36, 'triangle');
  });
  Umbra.on('hunt:end', (event, state) => {
    if (!event?.caught) voice(output(state), 0.35, 0.11, 110, 165, 'sine');
  });
  Umbra.on('tool:used', ({ id, evidence }, state) => {
    if (id === 'spiritbox') voice(output(state), 0.19, 0.15, 2700, 1250, 'noise');
    if (id === 'emf' && evidence === 'emf') voice(output(state), 0.14, 0.11, 990, 880, 'sine');
  });

  // El menú procesa Enter antes de los sistemas. M funciona también aquí y en el diario.
  addEventListener('keydown', (event) => {
    if (event.code !== 'KeyM' || event.repeat) return;
    muted = !muted;
    if (muted) {
      stopDrone();
      for (const source of voices) source.stop();
    } else {
      unlock();
    }
    if (master) master.gain.setTargetAtTime(muted ? 0 : 0.65, context.currentTime, 0.015);
  });

  Umbra.register({
    order: 90,
    start(state) {
      unlock();
      previousPosition = null;
      stepDistance = 0;
      lastPower = state.power.on;
      pendingPower = undefined;
      previousLamps = state.power.lamps.map(lamps => lamps.slice());
      outageSource = null;
    },
    updateAudio(state) {
      const playing = state.scene === 'play';
      updateDrone(playing);
      if (!playing) return;
      updateSteps(state);
      updatePower(state);
    },
  });
})();

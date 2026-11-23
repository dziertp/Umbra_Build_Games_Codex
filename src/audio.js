(function () {
  'use strict';

  let context, master, entityGain, noiseBuffer, drone, droneGain;
  let footsteps, switchClick;
  let muted = false;
  let previousPosition, previousLamps, outageSource;
  let walking = false;
  let pendingPower, lastPower;
  let menuTracks, menuCurrent, menuNext;
  let menuEnabled = false;
  let menuLevel = 0;
  let menuFrame;
  const menuFade = 0.32;
  const menuButton = { x: 146, y: 197, w: 188, h: 18 };
  const voices = new Set();
  const volumeControls = [
    { id: 'master', label: 'Volumen general', initial: 90 },
    { id: 'steps', label: 'Pasos del jugador', initial: 85 },
    { id: 'switches', label: 'Interruptores', initial: 90 },
    { id: 'ambience', label: 'Ambiente', initial: 80 },
    { id: 'entities', label: 'Entidades y cacerías', initial: 90 },
    { id: 'menuMusic', label: 'Música del menú', initial: 65 },
  ];
  const storageKey = 'umbra.audio.volumes';
  const clampVolume = value => Math.max(0, Math.min(100, Math.round(value)));
  const volumes = Object.fromEntries(volumeControls.map(({ id, initial }) => [id, initial]));
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    for (const { id } of volumeControls) {
      if (Number.isFinite(saved?.[id])) volumes[id] = clampVolume(saved[id]);
    }
  } catch {}

  function applyVolumes() {
    const general = muted ? 0 : volumes.master / 100;
    if (footsteps) footsteps.volume = 0.42 * general * volumes.steps / 100;
    if (switchClick) switchClick.volume = 0.47 * general * volumes.switches / 100;
    if (master) master.gain.setTargetAtTime(0.65 * general, context.currentTime, 0.015);
    if (entityGain) entityGain.gain.setTargetAtTime(volumes.entities / 100, context.currentTime, 0.015);
    if (droneGain) droneGain.gain.setTargetAtTime(0.042 * volumes.ambience / 100, context.currentTime, 0.05);
  }

  Umbra.audio = {
    volumeControls,
    volume: id => volumes[id],
    menuClick(x, y) {
      const b = menuButton;
      if (x < b.x || x >= b.x + b.w || y < b.y || y >= b.y + b.h) return false;
      toggleMute(Umbra.state);
      return true;
    },
    setVolume(id, value) {
      if (!Object.hasOwn(volumes, id) || !Number.isFinite(value)) return;
      volumes[id] = clampVolume(value);
      applyVolumes();
      try { localStorage.setItem(storageKey, JSON.stringify(volumes)); } catch {}
    },
  };

  function loadSample(file) {
    // La reproducción directa admite rutas file:// sin fetch ni servidor.
    const sample = new Audio('assets/audio/' + file);
    sample.preload = 'auto';
    return sample;
  }

  // Dos reproductores reutilizables para solapar el final con el inicio en file://.
  function playMenuTrack(track) {
    track.currentTime = 0;
    track.volume = 0;
    track.play().catch(error => {
      if (error.name === 'AbortError') return;
      menuEnabled = false;
      stopMenuMusic();
    });
  }

  function startMenuMusic() {
    if (menuCurrent || typeof globalThis.Audio !== 'function') return;
    menuTracks ||= [0, 1].map(() => loadSample('u_thxw0i7h4n-terror-213743.mp3'));
    [menuCurrent] = menuTracks;
    playMenuTrack(menuCurrent);
  }

  function stopMenuMusic() {
    menuCurrent?.pause();
    menuNext?.pause();
    menuCurrent = menuNext = null;
    menuLevel = 0;
  }

  function updateMenuMusic(state) {
    const now = performance.now();
    const dt = Math.min(0.1, (now - (menuFrame ?? now)) / 1000);
    menuFrame = now;
    const wanted = state.scene === 'menu' && menuEnabled && !muted;
    if (wanted) startMenuMusic();
    if (!menuCurrent) return;

    menuLevel = wanted ? Math.min(1, menuLevel + dt / 0.55) : Math.max(0, menuLevel - dt / 0.16);
    if (!wanted && !menuLevel) {
      stopMenuMusic();
      return;
    }

    const remaining = menuCurrent.duration - menuCurrent.currentTime;
    if (wanted && !menuNext && (remaining <= menuFade || menuCurrent.ended)) {
      menuNext = menuTracks.find(track => track !== menuCurrent);
      playMenuTrack(menuNext);
    }
    const volume = 0.4 * menuLevel * volumes.master * volumes.menuMusic / 10000;
    // El reloj del MP3 mantiene la mezcla aun si cae la frecuencia de cuadros.
    const mix = menuNext ? Math.max(0, Math.min(1, 1 - remaining / menuFade)) : 0;
    menuCurrent.volume = volume * (1 - mix);
    if (menuNext) {
      menuNext.volume = volume * mix;
      if (menuCurrent.ended || remaining <= 0.005) {
        menuCurrent.pause();
        menuCurrent = menuNext;
        menuNext = null;
        menuCurrent.volume = volume;
      }
    }
  }

  function unlock() {
    if (muted) return;
    if (!footsteps && typeof globalThis.Audio === 'function') {
      footsteps = loadSample('freesound_community-pasos-steps-40285.mp3');
      footsteps.loop = true;
      switchClick = loadSample('emilianodleon-select-button-ui-395763.mp3');
      applyVolumes();
    }
    const AudioContext = globalThis.AudioContext;
    if (!AudioContext) return;
    if (!context) {
      context = new AudioContext();
      master = context.createGain();
      master.gain.value = 0.65 * volumes.master / 100;
      master.connect(context.destination);
      entityGain = context.createGain();
      entityGain.gain.value = volumes.entities / 100;
      entityGain.connect(master);
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

  function voice(settings, duration, level, from, to, type, bus = master) {
    if (!settings || voices.size >= 16 || settings.volume < 0.015) return;
    const now = context.currentTime;
    const end = now + duration;
    const envelope = context.createGain();
    envelope.gain.setValueAtTime(0.0001, now);
    envelope.gain.exponentialRampToValueAtTime(Math.max(0.0001, level * settings.volume), now + 0.008);
    envelope.gain.exponentialRampToValueAtTime(0.0001, end);
    const pan = context.createStereoPanner();
    pan.pan.value = settings.pan;
    envelope.connect(pan).connect(bus);

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
    gain.gain.setTargetAtTime(0.042 * volumes.ambience / 100, context.currentTime, 0.35);
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
    if (!footsteps || muted || !distance || distance > 28 || state.journal?.open) {
      stopSteps();
      return;
    }
    const running = state.player.canRun !== false && (state.keys.has('ShiftLeft') || state.keys.has('ShiftRight'));
    const rate = running ? 1.42 : 1;
    if (footsteps.playbackRate !== rate) footsteps.playbackRate = rate;
    if (walking) return;
    walking = true;
    footsteps.play().catch(() => {});
  }

  function stopSteps() {
    if (!walking) return;
    footsteps.pause();
    walking = false;
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
        if (muted || !power.on || !switchClick) continue;
        switchClick.currentTime = 0;
        switchClick.play().catch(() => {});
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
      case 'thud': voice(settings, 0.17, 0.24, 91, 35, 'triangle', entityGain); break;
      case 'creak': voice(settings, 0.44, 0.10, 225, 320, 'sawtooth', entityGain); break;
      case 'door': voice(settings, 0.36, 0.19, 530, 120, 'noise', entityGain); break;
      case 'whisper': voice(settings, 0.52, 0.13, 1600, 720, 'noise', entityGain); break;
      case 'steps': voice(settings, 0.15, 0.15, 180, 80, 'noise', entityGain); break;
    }
  });
  Umbra.on('hunt:start', (_, state) => {
    const settings = output(state);
    voice(settings, 0.44, 0.31, 80, 31, 'triangle', entityGain);
    voice(settings, 0.58, 0.07, 150, 63, 'sawtooth', entityGain);
  });
  Umbra.on('hunt:step', (event, state) => {
    voice(output(state, event), 0.16, 0.23, 90, 36, 'triangle', entityGain);
  });
  Umbra.on('hunt:end', (event, state) => {
    if (!event?.caught) voice(output(state), 0.35, 0.11, 110, 165, 'sine', entityGain);
  });
  Umbra.on('tool:used', ({ id, evidence }, state) => {
    if (id === 'spiritbox') voice(output(state), 0.19, 0.15, 2700, 1250, 'noise');
    if (id === 'emf' && evidence === 'emf') voice(output(state), 0.14, 0.11, 990, 880, 'sine');
  });

  function toggleMute(state) {
    if (state?.scene === 'menu' && !menuEnabled) {
      menuEnabled = true;
      muted = false;
    } else {
      muted = !muted;
    }
    if (muted) {
      stopMenuMusic();
      stopDrone();
      stopSteps();
      switchClick?.pause();
      for (const source of voices) source.stop();
    } else {
      unlock();
      if (state?.scene === 'menu') startMenuMusic();
    }
    applyVolumes();
  }

  // El menú procesa Enter antes de los sistemas. M funciona también aquí y en el diario.
  addEventListener('keydown', (event) => {
    if (event.code === 'KeyM' && !event.repeat) toggleMute(Umbra.state);
  });

  Umbra.register({
    order: 90,
    start(state) {
      menuEnabled = true;
      unlock();
      previousPosition = null;
      stopSteps();
      switchClick?.pause();
      lastPower = state.power.on;
      pendingPower = undefined;
      previousLamps = state.power.lamps.map(lamps => lamps.slice());
      outageSource = null;
    },
    updateAudio(state) {
      const playing = state.scene === 'play';
      updateMenuMusic(state);
      updateDrone(playing && !menuCurrent);
      if (!playing) {
        stopSteps();
        if (switchClick && !switchClick.paused) switchClick.pause();
        return;
      }
      updateSteps(state);
      updatePower(state);
    },
    drawMenu(ctx) {
      const { x, y, w, h } = menuButton;
      ctx.save();
      ctx.fillStyle = '#20201e';
      ctx.fillRect(x, y, w, h);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#a5b4c1';
      ctx.font = '9px monospace';
      ctx.fillText(!menuEnabled || muted ? 'M · Activar sonido' : 'M · Silenciar sonido', x + w / 2, y + 12);
      ctx.restore();
    },
  });
})();

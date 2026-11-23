# Umbra — Maqueta de dos pisos V4

La planta baja conserva las ampliaciones de V3.2. Se añade la distribución superior con dos dormitorios, baño, sala de estar, vestidor y armario A2.

## Escalera compartida

En ambos mapas la escalera ocupa exactamente `[513, 585, 78, 207]`. Las 40 u de desplazamiento se aplicaron una sola vez, directamente en la geometría. El paso hasta la cara interior del muro del hall mide 59,5 u.

Los peldaños se recorren caminando; las barandas impiden entrar desde los costados. Al alcanzar el extremo superior en 1F se llega al distribuidor de 2F. Al completar la bajada en 2F se vuelve al hall de 1F. Los dos mapas comparten orientación y posición de escalera.

Los botones de piso sirven para inspección libre y cancelan una medición activa. Para medir el tránsito entre pisos se usa la escalera.

## Controles y mediciones

WASD/flechas: moverse. Shift: correr. E: armarios/fusibles. Espacio: pausa. R: preparar el recorrido de nuevo. El reloj empieza con el primer movimiento.

Colisión inicial de 16 u y referencia visual de 24 u. Caminar 72 u/s y correr 102 u/s, ajustables. El motor subdivide el desplazamiento para mantener colisiones incluso en fotogramas lentos.

A1 en la galería de 1F y A2 en la sala de estar de 2F protegen al entrar completamente y cerrar. Cada armario conserva su estado durante el cambio de piso. La caja de fusibles está en el garaje de 1F.

Hay trece pruebas, incluyendo circuitos de cada piso, subida, bajada, dormitorio superior a fusibles y fusibles a A2. El CSV mantiene sus columnas anteriores y añade piso inicial, piso final y cantidad de cambios de piso. El desplazamiento visual entre mapas no suma distancia; los peldaños efectivamente caminados sí se cuentan.

## Fuentes y comprobación

`map-source.json` y `upper-map-source.json` contienen la geometría editable. `python3 build_map.py` genera `dist/map-data.js` y comprueba que ambas escaleras sean idénticas.

`node qa.cjs` verifica los trece trayectos con colisiones de 16 y 24 u, tres recorridos corriendo, las transferencias de escalera a 16/24/36 u, entrada y protección en A1/A2, regresiones de living/comedor/oficina/cocina, cronómetro, pausa y reinicio. Los resultados de `qa-report.json` son simulaciones, no mediciones de partidas humanas.

Se comprobó también la subida y bajada mediante controles en Chrome. No hay cacerías, oscuridad de juego, stamina ni arte definitivo; la evaluación humana de la distribución sigue pendiente.

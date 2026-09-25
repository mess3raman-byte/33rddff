# Bolt's Journal

## 2025-05-20 - Per-frame allocation & DOM thrashing in Three.js animation loops
**Learning:** In Three.js / Canvas animation loops (`requestAnimationFrame`), allocating new arrays (e.g. `array.map().filter()`) or updating DOM elements (`element.innerHTML = ...`) on every frame causes heavy garbage collection pauses and unnecessary browser DOM recalculation/reflow.
**Action:** Pre-calculate static arrays for raycasting and cache hover/selection state so DOM updates only occur when state actually changes.

## 2025-09-26 - Avoid per-frame DOM updates & array allocations in Three.js render loop

**Learning:** In Three.js / WebGL application requestAnimationFrame loops:
1. Re-creating filter/map arrays every frame (e.g., `planetObjects.map(...).filter(...)` for raycasting) causes constant GC allocation & garbage collection pauses.
2. Unconditionally overwriting `element.innerHTML` or DOM properties every frame (60 FPS) causes unnecessary HTML parsing, reflows, and layout thrashing, even if the text content hasn't changed.

**Action:** Pre-compute static geometry/mesh arrays outside the animation loop, and track previous state (e.g. `currentHoveredPlanet`) to update DOM elements only on actual state changes.

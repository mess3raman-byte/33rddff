## 2026-10-03 - 60 FPS Animation Loop Optimization in Three.js / WebGL App

**Learning:** Updating `innerHTML` on every animation frame causes continuous DOM tree thrashing, layout recalculations, and unwanted garbage collection pauses even when text content doesn't change. Also, mapping and filtering arrays (`planetObjects.map(...).filter(...)`) inside `requestAnimationFrame` allocates temporary arrays 60 times a second.

**Action:**
1. Maintain state (`currentHoveredPlanet`) to update DOM elements only when hovered object state actually changes.
2. Pre-allocate and cache raycasting mesh target arrays outside the animation loop.
3. Attach object references to `mesh.userData` during initialization to allow O(1) object lookup upon raycaster intersection instead of executing `Array.prototype.find()` on every frame.

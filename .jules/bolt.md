# Bolt's Journal - Critical Learnings

## 2025-05-18 - Per-Frame Raycasting and DOM Allocation Anti-Pattern
**Learning:** Performing array mapping/filtering (`map()`, `filter()`), array searching (`find()`), and DOM string mutations (`innerHTML`) on every single `requestAnimationFrame` tick (60fps) introduces significant CPU overhead and garbage collection pressure in Three.js applications.
**Action:** Pre-allocate target arrays and lookup Maps for raycaster targets, track active hovered state to guard DOM updates, and ensure animation loop wrappers don't duplicate `requestAnimationFrame` calls or trigger infinite recursions.

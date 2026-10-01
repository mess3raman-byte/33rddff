# Bolt's Journal - Critical Learnings

## 2026-09-30 - Raycasting and DOM thrashing in requestAnimationFrame loop

**Learning:** In Three.js web apps, creating new arrays (`map`/`filter`) and calling DOM mutations (`innerHTML`) on every `requestAnimationFrame` tick (60 FPS) causes garbage collection pauses and unnecessary browser paint/layout recalculations.
**Action:** Pre-cache Three.js mesh references for raycasting and track hovered object state to mutate the DOM only when hover state changes.

# Bolt's Journal - Critical Learnings

## 2025-09-29 - Per-Frame Allocation and DOM Writes in 60 FPS Animation Loops
**Learning:** In Three.js / Canvas animation loops, calling `.map().filter()` creates garbage collections every frame, and writing to `element.innerHTML` on every tick causes layout/reflow recalculations even when contents haven't changed.
**Action:** Cache interactive mesh arrays outside `requestAnimationFrame` and state-check hovered elements to update DOM only on selection state changes.

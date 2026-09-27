# Bolt's Journal - Critical Learnings

## 2025-09-27 - Avoid Per-Frame Allocations and DOM Mutations in Animation Loops
**Learning:** In Three.js / Canvas animation loops (`requestAnimationFrame`), running `.map()`, `.filter()`, or other array allocations every frame creates significant garbage collection overhead. Additionally, updating DOM properties like `element.innerHTML` on every tick causes unnecessary reflow/repaint calculations, even if the content didn't change.
**Action:** Pre-compute static arrays for raycasting targets once, and cache state to only update DOM nodes when the rendered content actually changes.

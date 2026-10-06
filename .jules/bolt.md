# Bolt's Journal - Critical Learnings

## 2023-10-06 - Avoid Unconditional DOM Mutations and Dynamic Allocation in Animation Loops
**Learning:** In 60 FPS Three.js / WebGL animation loops (`requestAnimationFrame`), calling array methods like `.map()` or `.filter()` creates allocations and GC pressure every frame. Additionally, assigning `element.innerHTML` unconditionally on every frame triggers expensive DOM layout and HTML parsing even when the string content is identical.
**Action:**
1. Pre-allocate and cache interactive mesh collections outside the loop, using a `Map` or reference for O(1) lookups.
2. Maintain local state (e.g., `currentHoveredPlanet`) and only update `innerHTML` when hover state actually changes.

# Bolt's Journal - Critical Learnings

## 2024-10-01 - Avoid Array Allocation and DOM Mutations in Animation Loops
**Learning:** In Three.js render loops (running at 60 FPS), performing `.map()` and `.filter()` operations to populate array parameters for `raycaster.intersectObjects()` allocates garbage every frame and degrades frame rates. Furthermore, unconditionally writing to `element.innerHTML` on every tick causes DOM layout thrashing even when the content hasn't changed.
**Action:** Cache interactive target meshes once after scene initialization and track hover state to only update the DOM when hover state changes.

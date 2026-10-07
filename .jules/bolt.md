# Bolt's Journal - Critical Learnings

## 2023-10-07 - Avoid allocations and DOM churn in requestAnimationFrame loops
**Learning:** In Three.js and HTML5 Canvas animation loops, calling array methods (`map`, `filter`, `find`) and mutating DOM elements (`innerHTML`) every frame causes high garbage collection pressure and layout/reflow overhead, leading to frame drops.
**Action:** Pre-compute and cache target mesh arrays and map lookups at initialization. Store hover/interaction state to only perform DOM updates when state changes.

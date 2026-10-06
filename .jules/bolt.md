## 2025-05-10 - Animation Loop Raycasting & Unnecessary DOM Mutating
**Learning:** In Three.js render/animation loops (`requestAnimationFrame`), array transformations (`.map().filter()`) and array searches (`.find()`) cause GC pressure and redundant CPU work every frame. Additionally, writing to DOM `innerHTML` every frame even when content hasn't changed triggers continuous DOM reflows / layout trashing.
**Action:** Always pre-allocate interactive geometry arrays and use `Map` for $O(1)$ object lookups. Guard DOM updates behind state change checks (`newVal !== oldVal`).

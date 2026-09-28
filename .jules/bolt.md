# Bolt's Journal

## 2025-05-18 - Avoid array allocations and filtering in requestAnimationFrame
**Learning:** Calling `.map()` and `.filter()` inside the `animate()` render loop creates unnecessary array allocations and triggers Garbage Collection pauses at 60 FPS in Three.js animations.
**Action:** Pre-allocate or cache target mesh lists during initialization when geometry doesn't change dynamically per frame.

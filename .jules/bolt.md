# Bolt's Performance Journal - Critical Learnings

## 2023-10-02 - Raycasting & DOM Thrashing in Animation Frame Loop
**Learning:** Calling `.map()` and `.filter()` inside a 60 FPS `requestAnimationFrame` loop creates unnecessary array allocations and GC pressure. Additionally, updating `element.innerHTML` on every frame even when the content hasn't changed causes severe DOM parsing overhead and layout thrashing.
**Action:** Pre-cache interactive mesh target arrays on setup/creation and track hovered state to only update `innerHTML` when the selection actually changes.

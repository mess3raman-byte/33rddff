## 2025-05-10 - Raycaster allocation in animation loop
**Learning:** Calling raycaster.intersectObjects with array mapping and filtering every frame causes constant Garbage Collection pressure.
**Action:** Pre-compute sphere meshes array or reuse array to avoid per-frame allocations.

/**
 * 3D PCF Viewer Application Logic & Rendering Engine
 * Powered by Three.js
 */

// Global App State
const state = {
    pcfData: null,
    selectedComponent: null,
    colorMode: 'type', // 'type', 'bore', 'spec', 'line'
    filterType: 'ALL',
    searchQuery: '',
    scene: null,
    camera: null,
    renderer: null,
    controls: null,
    gridHelper: null,
    axesHelper: null,
    componentMeshes: new Map(), // map component.id -> Mesh/Group
    meshToComponentMap: new Map(), // map mesh UUID -> component
    highlightMesh: null,
    wireframeMode: false,
    raycaster: new THREE.Raycaster(),
    mouse: new THREE.Vector2(),
    samplePCFData: {}
};

// Color palettes for visualization modes
const COLOR_PALETTES = {
    TYPES: {
        'PIPE': 0x4a90e2,       // Steel Blue
        'ELBOW': 0xf5a623,      // Amber / Orange
        'TEE': 0x7ed321,        // Bright Green
        'FLANGE': 0x9013fe,     // Deep Purple
        'VALVE': 0xd0021b,      // Red
        'VALVE-OPERATOR': 0xe67e22, // Dark Orange
        'REDUCER-CONCENTRIC': 0x50e3c2, // Teal
        'REDUCER-ECCENTRIC': 0x00b894,  // Dark Teal
        'SUPPORT': 0x8b572a,    // Brown
        'INSTRUMENT': 0xe84393, // Pink
        'GASKET': 0xf1c40f,     // Gold
        'BOLT': 0x95a5a6,       // Silver
        'OLET': 0x16a085,       // Emerald
        'CAP': 0x34495e,        // Dark Slate
        'WELD': 0x00cec9,       // Cyan
        'DEFAULT': 0x7f8c8d     // Grey
    },
    BORES: [
        0x3498db, 0x2ecc71, 0xe67e22, 0xe74c3c, 0x9b59b6, 0x1abc9c, 0xf1c40f, 0x34495e
    ]
};

// Embedded Sample PCF Datasets
state.samplePCFData['simple-pipeline'] = `ISOGEN-FILES
    UNITS-BORE INCH
    UNITS-CO-ORDINATES MM
    PIPELINE-REFERENCE 6-PROC-101-CS150
    PROJECT-NAME CHEMICAL_PLANT_UNIT_2
    PIPING-SPEC CS150
    DATE-CREATED 2026-03-30

PIPE
    END-POINT 0.00 0.00 0.00 6.00
    END-POINT 1500.00 0.00 0.00 6.00
    PIPING-SPEC CS150
    ITEM-DESCRIPTION Pipe, Seamless Carbon Steel ASTM A106 Gr B
    FABRICATION-ITEM

FLANGE
    END-POINT 1500.00 0.00 0.00 6.00
    END-POINT 1620.00 0.00 0.00 6.00
    PIPING-SPEC CS150
    ITEM-DESCRIPTION Flange, Weld Neck Class 150 ASME B16.5
    RATING 150

VALVE
    END-POINT 1620.00 0.00 0.00 6.00
    END-POINT 1920.00 0.00 0.00 6.00
    CENTRE-POINT 1770.00 0.00 0.00 6.00
    PIPING-SPEC CS150
    ITEM-DESCRIPTION Gate Valve, Flanged Class 150 Handwheel
    VALVE-IDENTIFIER GV-101

FLANGE
    END-POINT 1920.00 0.00 0.00 6.00
    END-POINT 2040.00 0.00 0.00 6.00
    PIPING-SPEC CS150
    ITEM-DESCRIPTION Flange, Weld Neck Class 150 ASME B16.5

PIPE
    END-POINT 2040.00 0.00 0.00 6.00
    END-POINT 3500.00 0.00 0.00 6.00
    PIPING-SPEC CS150
    ITEM-DESCRIPTION Pipe, Seamless Carbon Steel ASTM A106 Gr B

ELBOW
    END-POINT 3500.00 0.00 0.00 6.00
    END-POINT 3500.00 0.00 1000.00 6.00
    CENTRE-POINT 3500.00 0.00 0.00
    PIPING-SPEC CS150
    ITEM-DESCRIPTION Elbow 90 Deg LR ASME B16.9

PIPE
    END-POINT 3500.00 0.00 1000.00 6.00
    END-POINT 3500.00 0.00 2500.00 6.00
    PIPING-SPEC CS150
    ITEM-DESCRIPTION Pipe, Seamless Carbon Steel ASTM A106 Gr B
`;

state.samplePCFData['complex-manifold'] = `ISOGEN-FILES
    UNITS-BORE INCH
    UNITS-CO-ORDINATES MM
    PIPELINE-REFERENCE 8-MANIFOLD-200-SS316
    PROJECT-NAME OFFSHORE_PLATFORM_ALPHA
    PIPING-SPEC SS316-300
    DATE-CREATED 2026-03-30

PIPE
    END-POINT 0.00 0.00 0.00 8.00
    END-POINT 2000.00 0.00 0.00 8.00
    PIPING-SPEC SS316-300
    ITEM-DESCRIPTION Pipe, Stainless Steel 316L Sch 40S

TEE
    END-POINT 2000.00 0.00 0.00 8.00
    END-POINT 2600.00 0.00 0.00 8.00
    BRANCH1-POINT 2300.00 800.00 0.00 4.00
    CENTRE-POINT 2300.00 0.00 0.00 8.00
    PIPING-SPEC SS316-300
    ITEM-DESCRIPTION Equal/Reducing Tee ASME B16.9

PIPE
    END-POINT 2300.00 800.00 0.00 4.00
    END-POINT 2300.00 1800.00 0.00 4.00
    PIPING-SPEC SS316-300
    ITEM-DESCRIPTION Branch Pipe 4 Inch SS316L

VALVE
    END-POINT 2300.00 1800.00 0.00 4.00
    END-POINT 2300.00 2100.00 0.00 4.00
    CENTRE-POINT 2300.00 1950.00 0.00 4.00
    PIPING-SPEC SS316-300
    ITEM-DESCRIPTION Ball Valve Class 300 Stainless Steel

PIPE
    END-POINT 2600.00 0.00 0.00 8.00
    END-POINT 4000.00 0.00 0.00 8.00
    PIPING-SPEC SS316-300
    ITEM-DESCRIPTION Pipe, Stainless Steel 316L Sch 40S

ELBOW
    END-POINT 4000.00 0.00 0.00 8.00
    END-POINT 4000.00 1200.00 0.00 8.00
    CENTRE-POINT 4000.00 0.00 0.00
    PIPING-SPEC SS316-300
    ITEM-DESCRIPTION Elbow 90 Deg LR Stainless Steel

PIPE
    END-POINT 4000.00 1200.00 0.00 8.00
    END-POINT 4000.00 2500.00 0.00 8.00
    PIPING-SPEC SS316-300
    ITEM-DESCRIPTION Pipe, Stainless Steel 316L Sch 40S
`;

state.samplePCFData['branched-line'] = `ISOGEN-FILES
    UNITS-BORE INCH
    UNITS-CO-ORDINATES MM
    PIPELINE-REFERENCE 10-FEED-501-A1
    PROJECT-NAME REFINERY_EXPANSION_PHASE1
    PIPING-SPEC CS300
    DATE-CREATED 2026-03-30

PIPE
    END-POINT 0.00 0.00 0.00 10.00
    END-POINT 1800.00 0.00 0.00 10.00
    PIPING-SPEC CS300
    ITEM-DESCRIPTION 10 Inch Main Feed Line Pipe

REDUCER-CONCENTRIC
    END-POINT 1800.00 0.00 0.00 10.00
    END-POINT 2100.00 0.00 0.00 6.00
    PIPING-SPEC CS300
    ITEM-DESCRIPTION Concentric Reducer 10x6 Inch ASME B16.9

PIPE
    END-POINT 2100.00 0.00 0.00 6.00
    END-POINT 3500.00 0.00 0.00 6.00
    PIPING-SPEC CS300
    ITEM-DESCRIPTION 6 Inch Pipe Carbon Steel

FLANGE
    END-POINT 3500.00 0.00 0.00 6.00
    END-POINT 3620.00 0.00 0.00 6.00
    PIPING-SPEC CS300
    ITEM-DESCRIPTION Weld Neck Flange Class 300

VALVE
    END-POINT 3620.00 0.00 0.00 6.00
    END-POINT 3920.00 0.00 0.00 6.00
    CENTRE-POINT 3770.00 0.00 0.00 6.00
    PIPING-SPEC CS300
    ITEM-DESCRIPTION Control Globe Valve Class 300

FLANGE
    END-POINT 3920.00 0.00 0.00 6.00
    END-POINT 4040.00 0.00 0.00 6.00
    PIPING-SPEC CS300
    ITEM-DESCRIPTION Weld Neck Flange Class 300
`;

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    initThreeJS();
    initUIEvents();
    loadSamplePCF('simple-pipeline');
});

/**
 * Initializes Three.js Scene, Camera, Renderer, Controls
 */
function initThreeJS() {
    const container = document.getElementById('three-canvas-container');
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || 600;

    // Scene
    state.scene = new THREE.Scene();
    state.scene.background = new THREE.Color(0x0f1423);

    // Camera
    state.camera = new THREE.PerspectiveCamera(50, width / height, 1, 100000);
    state.camera.position.set(3000, 3000, 4000);

    // Renderer
    state.renderer = new THREE.WebGLRenderer({ antialias: true });
    state.renderer.setSize(width, height);
    state.renderer.setPixelRatio(window.devicePixelRatio);
    state.renderer.shadowMap.enabled = true;
    container.appendChild(state.renderer.domElement);

    // Orbit Controls
    state.controls = new THREE.OrbitControls(state.camera, state.renderer.domElement);
    state.controls.enableDamping = true;
    state.controls.dampingFactor = 0.08;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    state.scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight1.position.set(5000, 10000, 7000);
    state.scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x4080ff, 0.4);
    dirLight2.position.set(-5000, -5000, -5000);
    state.scene.add(dirLight2);

    // Grid Floor
    state.gridHelper = new THREE.GridHelper(10000, 50, 0x00adb5, 0x222831);
    state.gridHelper.position.y = -10;
    state.scene.add(state.gridHelper);

    // Axes Helper (X: Red, Y: Green, Z: Blue)
    state.axesHelper = new THREE.AxesHelper(1000);
    state.scene.add(state.axesHelper);

    // Highlight bounding mesh
    const highlightGeo = new THREE.BoxGeometry(1, 1, 1);
    const highlightMat = new THREE.MeshBasicMaterial({
        color: 0x00fff0,
        wireframe: true,
        transparent: true,
        opacity: 0.8
    });
    state.highlightMesh = new THREE.Mesh(highlightGeo, highlightMat);
    state.highlightMesh.visible = false;
    state.scene.add(state.highlightMesh);

    // Window Resize Handler
    window.addEventListener('resize', onWindowResize);

    // Mouse Move & Click Handlers for 3D Viewport Interaction
    state.renderer.domElement.addEventListener('mousemove', onViewportMouseMove);
    state.renderer.domElement.addEventListener('click', onViewportMouseClick);

    // Render loop
    animate();
}

function animate() {
    requestAnimationFrame(animate);
    state.controls.update();
    state.renderer.render(state.scene, state.camera);
}

function onWindowResize() {
    const container = document.getElementById('three-canvas-container');
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    state.camera.aspect = width / height;
    state.camera.updateProjectionMatrix();
    state.renderer.setSize(width, height);
}

/**
 * Loads a PCF file content string and builds 3D models and UI panels
 */
function loadPCFText(pcfText, fileName = 'pipeline.pcf') {
    try {
        const parser = new PCFParser();
        state.pcfData = parser.parse(pcfText);
        state.selectedComponent = null;

        render3DPipeline();
        updateHeaderInfoPanel();
        updateComponentTreePanel();
        updateBOMPanel();
        updateLegendPanel();
        updateStatusMessage(`Loaded '${fileName}' successfully (${state.pcfData.components.length} components).`);

        // Reset view to fit model bounds
        fitCameraToPipeline();
    } catch (err) {
        console.error("Error parsing PCF file:", err);
        updateStatusMessage(`Failed to parse PCF file: ${err.message}`, true);
    }
}

function loadSamplePCF(sampleKey) {
    if (state.samplePCFData[sampleKey]) {
        loadPCFText(state.samplePCFData[sampleKey], `${sampleKey}.pcf`);
    }
}

/**
 * Rebuilds the 3D meshes in Three.js scene based on parsed PCF data
 */
function render3DPipeline() {
    // Clear existing component meshes
    state.componentMeshes.forEach(mesh => state.scene.remove(mesh));
    state.componentMeshes.clear();
    state.meshToComponentMap.clear();

    if (!state.pcfData || !state.pcfData.components) return;

    state.pcfData.components.forEach(comp => {
        const mesh = createComponentMesh(comp);
        if (mesh) {
            state.scene.add(mesh);
            state.componentMeshes.set(comp.id, mesh);

            // Map sub-meshes to component for raycasting selection
            mesh.traverse(child => {
                if (child.isMesh) {
                    state.meshToComponentMap.set(child.uuid, comp);
                }
            });
        }
    });
}

/**
 * Creates 3D Three.js Mesh / Group for a PCF Component
 */
function createComponentMesh(comp) {
    const group = new THREE.Group();
    const color = getComponentColor(comp);
    const material = new THREE.MeshStandardMaterial({
        color: color,
        roughness: 0.3,
        metalness: 0.6,
        wireframe: state.wireframeMode
    });

    const boreRadius = getRadiusFromBore(comp.mainBore);

    switch (comp.type) {
        case 'PIPE': {
            if (comp.endpoints.length >= 2) {
                const p1 = comp.endpoints[0];
                const p2 = comp.endpoints[1];
                const cylinder = createCylinderBetweenPoints(p1, p2, boreRadius, material);
                group.add(cylinder);
            }
            break;
        }

        case 'ELBOW': {
            if (comp.endpoints.length >= 2) {
                const p1 = comp.endpoints[0];
                const p2 = comp.endpoints[1];
                const center = comp.centerPoint || {
                    x: (p1.x + p2.x) / 2,
                    y: (p1.y + p2.y) / 2,
                    z: (p1.z + p2.z) / 2
                };

                const elbowMesh = createElbowMesh(p1, p2, center, boreRadius, material);
                group.add(elbowMesh);
            }
            break;
        }

        case 'TEE': {
            if (comp.endpoints.length >= 2) {
                const p1 = comp.endpoints[0];
                const p2 = comp.endpoints[1];
                const mainPipe = createCylinderBetweenPoints(p1, p2, boreRadius, material);
                group.add(mainPipe);

                if (comp.branchPoints && comp.branchPoints.length > 0) {
                    const branchPt = comp.branchPoints[0];
                    const center = comp.centerPoint || {
                        x: (p1.x + p2.x) / 2,
                        y: (p1.y + p2.y) / 2,
                        z: (p1.z + p2.z) / 2
                    };
                    const branchRadius = getRadiusFromBore(branchPt.bore || comp.mainBore);
                    const branchPipe = createCylinderBetweenPoints(center, branchPt, branchRadius, material);
                    group.add(branchPipe);
                }
            }
            break;
        }

        case 'FLANGE': {
            if (comp.endpoints.length >= 2) {
                const p1 = comp.endpoints[0];
                const p2 = comp.endpoints[1];
                // Flange outer ring
                const flangeRadius = boreRadius * 1.6;
                const cylinder = createCylinderBetweenPoints(p1, p2, flangeRadius, material);
                group.add(cylinder);
            } else if (comp.endpoints.length === 1) {
                const p = comp.endpoints[0];
                const geo = new THREE.CylinderGeometry(boreRadius * 1.6, boreRadius * 1.6, boreRadius, 24);
                const mesh = new THREE.Mesh(geo, material);
                mesh.position.set(p.x, p.y, p.z);
                group.add(mesh);
            }
            break;
        }

        case 'VALVE': {
            if (comp.endpoints.length >= 2) {
                const p1 = comp.endpoints[0];
                const p2 = comp.endpoints[1];
                const center = comp.centerPoint || {
                    x: (p1.x + p2.x) / 2,
                    y: (p1.y + p2.y) / 2,
                    z: (p1.z + p2.z) / 2
                };

                // Valve Body (two cones joined)
                const v1 = new THREE.Vector3(p1.x, p1.y, p1.z);
                const v2 = new THREE.Vector3(p2.x, p2.y, p2.z);
                const vc = new THREE.Vector3(center.x, center.y, center.z);

                const cone1 = createCone(v1, vc, boreRadius * 1.5, boreRadius, material);
                const cone2 = createCone(v2, vc, boreRadius * 1.5, boreRadius, material);
                group.add(cone1);
                group.add(cone2);

                // Valve Handwheel / Operator
                const handwheelGeo = new THREE.TorusGeometry(boreRadius * 1.2, boreRadius * 0.2, 12, 24);
                const handwheelMat = new THREE.MeshStandardMaterial({ color: 0xe74c3c, roughness: 0.4 });
                const handwheel = new THREE.Mesh(handwheelGeo, handwheelMat);
                handwheel.position.copy(vc).add(new THREE.Vector3(0, boreRadius * 2.5, 0));
                handwheel.rotation.x = Math.PI / 2;
                group.add(handwheel);

                // Handwheel Stem
                const stemGeo = new THREE.CylinderGeometry(boreRadius * 0.2, boreRadius * 0.2, boreRadius * 2.5, 12);
                const stem = new THREE.Mesh(stemGeo, material);
                stem.position.copy(vc).add(new THREE.Vector3(0, boreRadius * 1.25, 0));
                group.add(stem);
            }
            break;
        }

        case 'REDUCER-CONCENTRIC':
        case 'REDUCER-ECCENTRIC': {
            if (comp.endpoints.length >= 2) {
                const p1 = comp.endpoints[0];
                const p2 = comp.endpoints[1];
                const r1 = getRadiusFromBore(p1.bore || comp.mainBore);
                const r2 = getRadiusFromBore(p2.bore || comp.mainBore * 0.75);

                const cone = createCone(p1, p2, r1, r2, material);
                group.add(cone);
            }
            break;
        }

        case 'WELD': {
            if (comp.endpoints.length >= 1) {
                const p = comp.endpoints[0];
                const weldGeo = new THREE.TorusGeometry(boreRadius * 1.08, boreRadius * 0.15, 12, 24);
                const weldMat = new THREE.MeshStandardMaterial({ color: 0x00cec9, metalness: 0.8 });
                const weldMesh = new THREE.Mesh(weldGeo, weldMat);
                weldMesh.position.set(p.x, p.y, p.z);
                group.add(weldMesh);
            }
            break;
        }

        default: {
            // Generic cylinder / box representation
            if (comp.endpoints.length >= 2) {
                const p1 = comp.endpoints[0];
                const p2 = comp.endpoints[1];
                const cylinder = createCylinderBetweenPoints(p1, p2, boreRadius, material);
                group.add(cylinder);
            } else if (comp.endpoints.length === 1) {
                const p = comp.endpoints[0];
                const sphereGeo = new THREE.SphereGeometry(boreRadius * 1.3, 16, 16);
                const sphere = new THREE.Mesh(sphereGeo, material);
                sphere.position.set(p.x, p.y, p.z);
                group.add(sphere);
            }
            break;
        }
    }

    group.userData = { componentId: comp.id };
    return group;
}

/**
 * Helper: Converts Nominal Bore in inch or mm to 3D rendering radius
 */
function getRadiusFromBore(bore) {
    if (!bore || bore <= 0) return 40;
    // If bore <= 24, assume inches; if > 24, assume mm
    const mmBore = bore <= 24 ? bore * 25.4 : bore;
    return Math.max(mmBore / 2, 8); // scale radius
}

/**
 * Creates a cylinder mesh positioned and oriented between 2 points
 */
function createCylinderBetweenPoints(p1, p2, radius, material) {
    const v1 = new THREE.Vector3(p1.x, p1.y, p1.z);
    const v2 = new THREE.Vector3(p2.x, p2.y, p2.z);
    const distance = v1.distanceTo(v2);

    if (distance <= 0.001) {
        const sphereGeo = new THREE.SphereGeometry(radius, 16, 16);
        const mesh = new THREE.Mesh(sphereGeo, material);
        mesh.position.copy(v1);
        return mesh;
    }

    const geometry = new THREE.CylinderGeometry(radius, radius, distance, 24);
    const mesh = new THREE.Mesh(geometry, material);

    // Position cylinder center
    const midpoint = new THREE.Vector3().addVectors(v1, v2).multiplyScalar(0.5);
    mesh.position.copy(midpoint);

    // Orient cylinder along vector v1 -> v2
    const orientation = new THREE.Matrix4();
    const up = new THREE.Vector3(0, 1, 0);
    const dir = new THREE.Vector3().subVectors(v2, v1).normalize();
    orientation.lookAt(v1, v2, up);

    mesh.quaternion.setFromUnitVectors(up, dir);
    return mesh;
}

/**
 * Creates a cone mesh between 2 points with different start and end radii
 */
function createCone(v1Point, v2Point, radius1, radius2, material) {
    const v1 = v1Point.isVector3 ? v1Point : new THREE.Vector3(v1Point.x, v1Point.y, v1Point.z);
    const v2 = v2Point.isVector3 ? v2Point : new THREE.Vector3(v2Point.x, v2Point.y, v2Point.z);
    const distance = v1.distanceTo(v2);

    const geometry = new THREE.CylinderGeometry(radius2, radius1, distance, 24);
    const mesh = new THREE.Mesh(geometry, material);

    const midpoint = new THREE.Vector3().addVectors(v1, v2).multiplyScalar(0.5);
    mesh.position.copy(midpoint);

    const up = new THREE.Vector3(0, 1, 0);
    const dir = new THREE.Vector3().subVectors(v2, v1).normalize();
    mesh.quaternion.setFromUnitVectors(up, dir);

    return mesh;
}

/**
 * Creates curved elbow tube mesh using QuadraticBezierCurve3
 */
function createElbowMesh(p1, p2, center, radius, material) {
    const v1 = new THREE.Vector3(p1.x, p1.y, p1.z);
    const v2 = new THREE.Vector3(p2.x, p2.y, p2.z);
    const vc = new THREE.Vector3(center.x, center.y, center.z);

    const curve = new THREE.QuadraticBezierCurve3(v1, vc, v2);
    const tubeGeometry = new THREE.TubeGeometry(curve, 20, radius, 16, false);
    return new THREE.Mesh(tubeGeometry, material);
}

/**
 * Calculates component material color according to active colorMode
 */
function getComponentColor(comp) {
    if (state.colorMode === 'type') {
        return COLOR_PALETTES.TYPES[comp.type] || COLOR_PALETTES.TYPES['DEFAULT'];
    } else if (state.colorMode === 'bore') {
        const boreIdx = Math.abs(Math.round(comp.mainBore)) % COLOR_PALETTES.BORES.length;
        return COLOR_PALETTES.BORES[boreIdx];
    } else if (state.colorMode === 'spec') {
        const spec = comp.attributes['PIPING-SPEC'] || 'DEFAULT';
        let hash = 0;
        for (let i = 0; i < spec.length; i++) hash = spec.charCodeAt(i) + ((hash << 5) - hash);
        return Math.abs(hash) % 0xffffff;
    }
    return COLOR_PALETTES.TYPES[comp.type] || COLOR_PALETTES.TYPES['DEFAULT'];
}

/**
 * Adjusts camera position and zoom to enclose all 3D components
 */
function fitCameraToPipeline() {
    if (state.componentMeshes.size === 0) return;

    const bbox = new THREE.Box3();
    state.componentMeshes.forEach(group => bbox.expandByObject(group));

    if (bbox.isEmpty()) return;

    const center = new THREE.Vector3();
    bbox.getCenter(center);
    const size = new THREE.Vector3();
    bbox.getSize(size);

    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = state.camera.fov * (Math.PI / 180);
    let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2)) * 2.2;
    cameraZ = Math.max(cameraZ, 500);

    state.camera.position.set(center.x + cameraZ * 0.8, center.y + cameraZ * 0.8, center.z + cameraZ);
    state.controls.target.copy(center);
    state.controls.update();

    // Update Status Bounds
    document.getElementById('status-bbox').textContent =
        `Bounds: [${Math.round(size.x)} x ${Math.round(size.y)} x ${Math.round(size.z)} mm]`;
}

/**
 * Updates Left Panel: Header Attributes & Metrics
 */
function updateHeaderInfoPanel() {
    const container = document.getElementById('header-attributes');
    if (!state.pcfData || !state.pcfData.header) {
        container.innerHTML = '<p class="empty-msg">No PCF file loaded</p>';
        return;
    }

    const header = state.pcfData.header;
    let html = '';
    for (const [key, val] of Object.entries(header)) {
        html += `
            <div class="kv-item">
                <span class="kv-key">${key}:</span>
                <span class="kv-val">${val}</span>
            </div>
        `;
    }
    container.innerHTML = html || '<p class="empty-msg">No header attributes found</p>';

    // Update Pipeline Metrics Cards
    const summary = state.pcfData.summary;
    document.getElementById('metric-components-count').textContent = summary.totalComponents;
    document.getElementById('metric-pipe-length').textContent = `${(summary.totalPipeLength / 1000).toFixed(2)}m`;
    document.getElementById('metric-max-bore').textContent = `${summary.maxBore}"`;
    document.getElementById('metric-weld-count').textContent = summary.weldCount;
}

/**
 * Updates Left Panel: Component Tree List
 */
function updateComponentTreePanel() {
    const container = document.getElementById('component-tree-list');
    if (!state.pcfData || !state.pcfData.components) {
        container.innerHTML = '<p class="empty-msg">Load a PCF file to inspect items</p>';
        return;
    }

    let filtered = state.pcfData.components.filter(c => {
        if (state.filterType !== 'ALL' && c.type !== state.filterType) {
            return false;
        }
        if (state.searchQuery) {
            const query = state.searchQuery.toLowerCase();
            const text = `${c.type} ${c.displayName} ${JSON.stringify(c.attributes)}`.toLowerCase();
            return text.includes(query);
        }
        return true;
    });

    if (filtered.length === 0) {
        container.innerHTML = '<p class="empty-msg">No components match search criteria</p>';
        return;
    }

    let html = '';
    filtered.forEach(c => {
        const isSelected = state.selectedComponent && state.selectedComponent.id === c.id;
        const colorHex = '#' + getComponentColor(c).toString(16).padStart(6, '0');

        html += `
            <div class="tree-item ${isSelected ? 'selected' : ''}" data-id="${c.id}">
                <span class="tree-icon" style="background-color: ${colorHex}"></span>
                <span class="tree-type">${c.type}</span>
                <span class="tree-desc">#${c.id} - ${c.mainBore}" N.B.</span>
            </div>
        `;
    });

    container.innerHTML = html;

    // Attach click events
    container.querySelectorAll('.tree-item').forEach(el => {
        el.addEventListener('click', () => {
            const id = parseInt(el.getAttribute('data-id'));
            selectComponentById(id);
        });
    });
}

/**
 * Updates Right Panel: Component Inspector Properties
 */
function updateComponentInspector() {
    const container = document.getElementById('component-inspector');
    if (!state.selectedComponent) {
        container.innerHTML = `
            <div class="inspector-placeholder">
                <i class="fa-solid fa-mouse-pointer"></i>
                <p>Click any piping component in the 3D model or tree list to view detailed geometry and material properties.</p>
            </div>
        `;
        return;
    }

    const c = state.selectedComponent;
    let endpointsHtml = '';
    c.endpoints.forEach((ep, idx) => {
        endpointsHtml += `
            <div class="coord-badge">
                Point ${idx + 1}: (${ep.x.toFixed(1)}, ${ep.y.toFixed(1)}, ${ep.z.toFixed(1)}) ${ep.bore ? '| Bore: ' + ep.bore + '"' : ''}
            </div>
        `;
    });

    let attrsHtml = '';
    for (const [key, val] of Object.entries(c.attributes)) {
        attrsHtml += `
            <div class="kv-item">
                <span class="kv-key">${key}:</span>
                <span class="kv-val">${val}</span>
            </div>
        `;
    }

    container.innerHTML = `
        <div class="panel-section">
            <div class="inspector-header">
                <span class="component-badge">${c.type}</span>
                <h3>Item #${c.id}</h3>
            </div>
            <p class="component-title">${c.displayName}</p>
        </div>

        <div class="panel-section">
            <h3><i class="fa-solid fa-ruler-combined"></i> Geometry & Coordinates</h3>
            <div class="kv-container">
                <div class="kv-item">
                    <span class="kv-key">Nominal Bore:</span>
                    <span class="kv-val">${c.mainBore}"</span>
                </div>
                <div class="kv-item">
                    <span class="kv-key">Length:</span>
                    <span class="kv-val">${c.length ? c.length.toFixed(1) + ' mm' : 'N/A'}</span>
                </div>
            </div>
            <div class="coord-list">
                ${endpointsHtml}
            </div>
        </div>

        <div class="panel-section">
            <h3><i class="fa-solid fa-tags"></i> PCF Attributes</h3>
            <div class="kv-container">
                ${attrsHtml || '<p class="empty-msg">No extra attributes</p>'}
            </div>
        </div>
    `;
}

/**
 * Updates Right Panel: Bill of Materials (BOM) Table
 */
function updateBOMPanel() {
    const tbody = document.getElementById('bom-table-body');
    if (!state.pcfData || !state.pcfData.components) {
        tbody.innerHTML = '<tr><td colspan="4" class="empty-msg">No data available</td></tr>';
        return;
    }

    // Aggregate components by Type & Bore
    const bomMap = new Map();

    state.pcfData.components.forEach(c => {
        const key = `${c.type}|${c.mainBore}|${c.attributes['ITEM-DESCRIPTION'] || ''}`;
        if (!bomMap.has(key)) {
            bomMap.set(key, {
                type: c.type,
                bore: c.mainBore,
                desc: c.attributes['ITEM-DESCRIPTION'] || c.displayName,
                qty: 0,
                length: 0
            });
        }
        const item = bomMap.get(key);
        item.qty += 1;
        if (c.type === 'PIPE') {
            item.length += c.length;
        }
    });

    let html = '';
    let index = 1;
    bomMap.forEach(item => {
        const qtyOrLen = item.type === 'PIPE' ? `${(item.length / 1000).toFixed(2)} m` : `${item.qty} pcs`;
        html += `
            <tr>
                <td>${index++}</td>
                <td><strong>${item.type}</strong><br><small style="color:#aaa">${item.desc}</small></td>
                <td>${item.bore}"</td>
                <td>${qtyOrLen}</td>
            </tr>
        `;
    });

    tbody.innerHTML = html || '<tr><td colspan="4" class="empty-msg">No items</td></tr>';
}

/**
 * Updates viewport legend panel according to active coloring mode
 */
function updateLegendPanel() {
    const container = document.getElementById('legend-items');
    let html = '';

    if (state.colorMode === 'type') {
        const usedTypes = new Set(state.pcfData ? state.pcfData.components.map(c => c.type) : []);
        usedTypes.forEach(type => {
            const color = COLOR_PALETTES.TYPES[type] || COLOR_PALETTES.TYPES['DEFAULT'];
            const hex = '#' + color.toString(16).padStart(6, '0');
            html += `
                <div class="legend-item">
                    <span class="legend-color" style="background-color: ${hex}"></span>
                    <span>${type}</span>
                </div>
            `;
        });
    } else {
        html = '<div class="legend-item"><span>Color mode active</span></div>';
    }

    container.innerHTML = html || '<div class="legend-item"><span>Standard palette</span></div>';
}

/**
 * Selects a PCF Component by ID and highlights it in 3D scene & panels
 */
function selectComponentById(id) {
    if (!state.pcfData) return;

    const comp = state.pcfData.components.find(c => c.id === id);
    state.selectedComponent = comp;

    updateComponentInspector();
    updateComponentTreePanel();

    if (comp) {
        const meshGroup = state.componentMeshes.get(comp.id);
        if (meshGroup) {
            // Compute bounding box of selected mesh group
            const bbox = new THREE.Box3().setFromObject(meshGroup);
            const center = new THREE.Vector3();
            const size = new THREE.Vector3();
            bbox.getCenter(center);
            bbox.getSize(size);

            state.highlightMesh.scale.copy(size.addScalar(20));
            state.highlightMesh.position.copy(center);
            state.highlightMesh.visible = true;

            // Smoothly move camera towards component
            state.controls.target.copy(center);
        }
    } else {
        state.highlightMesh.visible = false;
    }
}

/**
 * Raycasting logic on Mouse Hover / Click in 3D Viewport
 */
function onViewportMouseMove(event) {
    const rect = state.renderer.domElement.getBoundingClientRect();
    state.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    state.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    // Raycast check
    state.raycaster.setFromCamera(state.mouse, state.camera);
    const intersects = state.raycaster.intersectObjects(state.scene.children, true);

    const tooltip = document.getElementById('hover-tooltip');

    let hitComponent = null;
    for (const hit of intersects) {
        if (hit.object === state.highlightMesh || hit.object.type === 'LineSegments' || hit.object.type === 'GridHelper') {
            continue;
        }
        hitComponent = state.meshToComponentMap.get(hit.object.uuid);
        if (hitComponent) {
            // Update Footer Coords
            document.getElementById('status-coords').textContent =
                `X: ${hit.point.x.toFixed(1)} | Y: ${hit.point.y.toFixed(1)} | Z: ${hit.point.z.toFixed(1)}`;
            break;
        }
    }

    if (hitComponent) {
        tooltip.style.display = 'block';
        tooltip.style.left = `${event.clientX + 15}px`;
        tooltip.style.top = `${event.clientY + 15}px`;
        tooltip.innerHTML = `<strong>${hitComponent.type}</strong> (#${hitComponent.id})<br>${hitComponent.mainBore}" N.B.`;
    } else {
        tooltip.style.display = 'none';
    }
}

function onViewportMouseClick(event) {
    state.raycaster.setFromCamera(state.mouse, state.camera);
    const intersects = state.raycaster.intersectObjects(state.scene.children, true);

    for (const hit of intersects) {
        if (hit.object === state.highlightMesh || hit.object.type === 'LineSegments' || hit.object.type === 'GridHelper') {
            continue;
        }
        const comp = state.meshToComponentMap.get(hit.object.uuid);
        if (comp) {
            selectComponentById(comp.id);
            return;
        }
    }

    // Clicked empty space
    selectComponentById(null);
}

/**
 * UI Event Listeners Initialization
 */
function initUIEvents() {
    // File Input Loader
    const fileInput = document.getElementById('file-input');
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (evt) => loadPCFText(evt.target.result, file.name);
            reader.readAsText(file);
        }
    });

    // Sample Selector
    const sampleSelect = document.getElementById('sample-select');
    sampleSelect.addEventListener('change', (e) => {
        loadSamplePCF(e.target.value);
    });

    // Toolbar Buttons
    document.getElementById('btn-reset-view').addEventListener('click', fitCameraToPipeline);

    const btnGrid = document.getElementById('btn-toggle-grid');
    btnGrid.addEventListener('click', () => {
        state.gridHelper.visible = !state.gridHelper.visible;
        btnGrid.classList.toggle('active', state.gridHelper.visible);
    });

    const btnAxes = document.getElementById('btn-toggle-axes');
    btnAxes.addEventListener('click', () => {
        state.axesHelper.visible = !state.axesHelper.visible;
        btnAxes.classList.toggle('active', state.axesHelper.visible);
    });

    const btnWireframe = document.getElementById('btn-toggle-wireframe');
    btnWireframe.addEventListener('click', () => {
        state.wireframeMode = !state.wireframeMode;
        btnWireframe.classList.toggle('active', state.wireframeMode);
        render3DPipeline();
    });

    // Coloring mode select
    document.getElementById('color-mode-select').addEventListener('change', (e) => {
        state.colorMode = e.target.value;
        render3DPipeline();
        updateLegendPanel();
    });

    // Export BOM to CSV
    document.getElementById('btn-export-bom').addEventListener('click', exportBOMToCSV);

    // Sidebar Tab Switching
    document.querySelectorAll('.sidebar-tabs').forEach(tabGroup => {
        tabGroup.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const targetTabId = btn.getAttribute('data-tab');
                const sidebar = btn.closest('.sidebar');

                sidebar.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                sidebar.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));

                btn.classList.add('active');
                sidebar.querySelector(`#${targetTabId}`).classList.add('active');
            });
        });
    });

    // Sidebar Collapse / Expand Toggles
    document.getElementById('toggle-left-sidebar').addEventListener('click', () => {
        document.getElementById('left-sidebar').classList.toggle('collapsed');
    });

    document.getElementById('toggle-right-sidebar').addEventListener('click', () => {
        document.getElementById('right-sidebar').classList.toggle('collapsed');
    });

    // Search and Filters
    const searchInput = document.getElementById('component-search');
    searchInput.addEventListener('input', (e) => {
        state.searchQuery = e.target.value;
        updateComponentTreePanel();
    });

    document.querySelectorAll('#filter-tags .filter-tag').forEach(tag => {
        tag.addEventListener('click', () => {
            document.querySelectorAll('#filter-tags .filter-tag').forEach(t => t.classList.remove('active'));
            tag.classList.add('active');
            state.filterType = tag.getAttribute('data-filter');
            updateComponentTreePanel();
        });
    });

    // Preset Camera View Controls
    document.querySelectorAll('.btn-preset').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.btn-preset').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const view = btn.getAttribute('data-view');
            setPresetCameraView(view);
        });
    });

    // Drag and Drop PCF Files into 3D Viewport
    const dropZone = document.getElementById('drop-zone');
    const dragOverlay = document.getElementById('drag-overlay');

    window.addEventListener('dragover', (e) => {
        e.preventDefault();
        dragOverlay.classList.add('active');
    });

    dragOverlay.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dragOverlay.classList.remove('active');
    });

    dragOverlay.addEventListener('drop', (e) => {
        e.preventDefault();
        dragOverlay.classList.remove('active');

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            const reader = new FileReader();
            reader.onload = (evt) => loadPCFText(evt.target.result, file.name);
            reader.readAsText(file);
        }
    });
}

/**
 * Sets preset camera orientation (ISO, TOP, FRONT, SIDE)
 */
function setPresetCameraView(viewType) {
    if (!state.pcfData) return;

    const bbox = new THREE.Box3();
    state.componentMeshes.forEach(group => bbox.expandByObject(group));
    const center = new THREE.Vector3();
    bbox.getCenter(center);
    const size = new THREE.Vector3();
    bbox.getSize(size);

    const dist = Math.max(size.x, size.y, size.z, 2000) * 1.8;

    switch (viewType) {
        case 'top':
            state.camera.position.set(center.x, center.y + dist, center.z + 1);
            break;
        case 'front':
            state.camera.position.set(center.x, center.y, center.z + dist);
            break;
        case 'side':
            state.camera.position.set(center.x + dist, center.y, center.z);
            break;
        case 'iso':
        default:
            state.camera.position.set(center.x + dist * 0.7, center.y + dist * 0.7, center.z + dist * 0.7);
            break;
    }

    state.controls.target.copy(center);
    state.controls.update();
}

/**
 * Exports PCF Bill of Materials to CSV file
 */
function exportBOMToCSV() {
    if (!state.pcfData || !state.pcfData.components) {
        alert("No PCF file loaded to export.");
        return;
    }

    let csvContent = "data:text/csv;charset=utf-8,Item,Component Type,Nominal Bore (in),Description,Quantity / Length\n";

    const bomMap = new Map();
    state.pcfData.components.forEach(c => {
        const key = `${c.type}|${c.mainBore}|${c.attributes['ITEM-DESCRIPTION'] || ''}`;
        if (!bomMap.has(key)) {
            bomMap.set(key, {
                type: c.type,
                bore: c.mainBore,
                desc: c.attributes['ITEM-DESCRIPTION'] || c.displayName,
                qty: 0,
                length: 0
            });
        }
        const item = bomMap.get(key);
        item.qty += 1;
        if (c.type === 'PIPE') item.length += c.length;
    });

    let index = 1;
    bomMap.forEach(item => {
        const qtyOrLen = item.type === 'PIPE' ? `${(item.length / 1000).toFixed(2)} m` : `${item.qty} pcs`;
        const cleanDesc = `"${(item.desc || '').replace(/"/g, '""')}"`;
        csvContent += `${index++},${item.type},${item.bore},${cleanDesc},${qtyOrLen}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `BOM_${state.pcfData.summary.pipelineRef || 'pipeline'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function updateStatusMessage(msg, isError = false) {
    const el = document.getElementById('status-message');
    if (isError) {
        el.innerHTML = `<i class="fa-solid fa-circle-exclamation status-err"></i> ${msg}`;
    } else {
        el.innerHTML = `<i class="fa-solid fa-circle-check status-ok"></i> ${msg}`;
    }
}

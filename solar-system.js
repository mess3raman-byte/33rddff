// Solar System Visualization using Three.js

// Time Zone Offset Definitions (in hours)
const TIMEZONE_OFFSETS = {
    UTC: 0,
    IST: 5.5,  // Indian Standard Time (UTC+5:30)
    Perth: 8   // Australian Western Standard Time (UTC+8)
};

// Scene setup
const scene = new THREE.Scene();
const container = document.getElementById('solar-system');
const width = container.clientWidth;
const height = container.clientHeight;

// Camera setup
const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 10000);
camera.position.set(0, 300, 800);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(width, height);
renderer.setPixelRatio(window.devicePixelRatio);
container.appendChild(renderer.domElement);

// Controls
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 100;
controls.maxDistance = 5000;

// Lighting
const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(1, 0, 1);
scene.add(directionalLight);

// Starfield background
const createStarfield = () => {
    const starsGeometry = new THREE.BufferGeometry();
    const starsMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.5,
        transparent: true,
        opacity: 0.8
    });
    
    const starsVertices = [];
    for (let i = 0; i < 5000; i++) {
        const x = (Math.random() - 0.5) * 10000;
        const y = (Math.random() - 0.5) * 10000;
        const z = (Math.random() - 0.5) * 10000;
        starsVertices.push(x, y, z);
    }
    
    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
    return new THREE.Points(starsGeometry, starsMaterial);
};

scene.add(createStarfield());

// Planet data (scaled for visualization)
const planets = [
    {
        name: 'Sun',
        radius: 60,
        distance: 0,
        color: 0xffcc00,
        orbitSpeed: 0,
        rotationSpeed: 0.002,
        emission: 0xffaa00,
        emissionIntensity: 0.8,
        description: 'The Sun is the star at the center of our Solar System. It is a nearly perfect sphere of hot plasma.'
    },
    {
        name: 'Mercury',
        radius: 8,
        distance: 80,
        color: 0xaaaaaa,
        orbitSpeed: 0.04,
        rotationSpeed: 0.01,
        description: 'Mercury is the smallest and innermost planet. It orbits the Sun in just 88 Earth days.'
    },
    {
        name: 'Venus',
        radius: 12,
        distance: 120,
        color: 0xffcc99,
        orbitSpeed: 0.025,
        rotationSpeed: 0.005,
        description: 'Venus is the second planet from the Sun. It is similar in size to Earth but has a thick, toxic atmosphere.'
    },
    {
        name: 'Earth',
        radius: 13,
        distance: 180,
        color: 0x3399ff,
        orbitSpeed: 0.02,
        rotationSpeed: 0.01,
        description: 'Earth is the third planet from the Sun and the only astronomical object known to harbor life.'
    },
    {
        name: 'Mars',
        radius: 10,
        distance: 250,
        color: 0xff6600,
        orbitSpeed: 0.015,
        rotationSpeed: 0.008,
        description: 'Mars is the fourth planet from the Sun. It is often called the "Red Planet" because of its reddish appearance.'
    },
    {
        name: 'Jupiter',
        radius: 35,
        distance: 350,
        color: 0xffcc99,
        orbitSpeed: 0.008,
        rotationSpeed: 0.02,
        description: 'Jupiter is the largest planet in our Solar System. It is a gas giant with a mass more than two and a half times that of all the other planets combined.'
    },
    {
        name: 'Saturn',
        radius: 30,
        distance: 450,
        color: 0xffcc66,
        orbitSpeed: 0.005,
        rotationSpeed: 0.015,
        ring: true,
        ringSize: 50,
        description: 'Saturn is the sixth planet from the Sun and is famous for its stunning ring system.'
    },
    {
        name: 'Uranus',
        radius: 18,
        distance: 550,
        color: 0x99ccff,
        orbitSpeed: 0.003,
        rotationSpeed: 0.01,
        description: 'Uranus is the seventh planet from the Sun. It has the third-largest diameter in our Solar System.'
    },
    {
        name: 'Neptune',
        radius: 17,
        distance: 650,
        color: 0x0066cc,
        orbitSpeed: 0.002,
        rotationSpeed: 0.008,
        description: 'Neptune is the eighth and farthest-known planet from the Sun. It is the fourth-largest planet by diameter.'
    }
];

// Create planets and their orbits
const planetObjects = [];
const orbitLines = [];
const planetLabels = [];

planets.forEach((planet, index) => {
    // Create orbit path (elliptical)
    if (planet.distance > 0) {
        const orbitGeometry = new THREE.EllipseCurve(
            0, 0,            // ax, aY
            planet.distance, planet.distance, // xRadius, yRadius
            0, 2 * Math.PI, // aStartAngle, aEndAngle
            false,           // aClockwise
            0                // aRotation
        );
        
        const points = orbitGeometry.getPoints(100);
        const orbitPath = new THREE.BufferGeometry().setFromPoints(points);
        const orbitMaterial = new THREE.LineBasicMaterial({
            color: 0x333333,
            transparent: true,
            opacity: 0.3
        });
        const orbitLine = new THREE.Line(orbitPath, orbitMaterial);
        orbitLine.rotation.x = Math.PI / 2; // Rotate to be in the XY plane
        scene.add(orbitLine);
        orbitLines.push(orbitLine);
    }
    
    // Create planet group
    const planetGroup = new THREE.Group();
    
    // Create planet sphere
    const geometry = new THREE.SphereGeometry(planet.radius, 32, 32);
    
    let material;
    if (planet.name === 'Sun') {
        material = new THREE.MeshBasicMaterial({
            color: planet.color
        });
        
        // Add glow effect to Sun
        const glowGeometry = new THREE.SphereGeometry(planet.radius * 1.2, 32, 32);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: planet.emission,
            transparent: true,
            opacity: 0.3
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        planetGroup.add(glow);
    } else {
        material = new THREE.MeshPhongMaterial({
            color: planet.color,
            shininess: 30,
            specular: 0x333333
        });
    }
    
    const planetMesh = new THREE.Mesh(geometry, material);
    planetGroup.add(planetMesh);
    
    // Add rings to Saturn
    if (planet.ring) {
        const ringGeometry = new THREE.RingGeometry(
            planet.radius * 1.4, 
            planet.radius * planet.ringSize / planet.radius,
            32
        );
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0xcccc99,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.7
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = Math.PI / 2.5;
        planetGroup.add(ring);
    }
    
    // Position planet
    if (planet.distance > 0) {
        planetGroup.position.x = planet.distance;
    }
    
    scene.add(planetGroup);
    planetObjects.push({
        group: planetGroup,
        mesh: planetMesh,
        data: planet,
        angle: Math.random() * Math.PI * 2,
        rotationAngle: 0
    });
    
    // Add label
    const labelCanvas = document.createElement('canvas');
    labelCanvas.width = 256;
    labelCanvas.height = 128;
    const labelContext = labelCanvas.getContext('2d');
    labelContext.fillStyle = 'rgba(0, 0, 0, 0.7)';
    labelContext.fillRect(0, 0, labelCanvas.width, labelCanvas.height);
    labelContext.font = 'Bold 16px Arial';
    labelContext.fillStyle = '#ffffff';
    labelContext.textAlign = 'center';
    labelContext.fillText(planet.name, labelCanvas.width / 2, labelCanvas.height / 2);
    
    const labelTexture = new THREE.CanvasTexture(labelCanvas);
    const labelMaterial = new THREE.SpriteMaterial({ map: labelTexture, transparent: true });
    const labelSprite = new THREE.Sprite(labelMaterial);
    labelSprite.position.y = planet.radius + 20;
    labelSprite.scale.set(20, 10, 1);
    planetGroup.add(labelSprite);
    
    planetLabels.push({
        sprite: labelSprite,
        visible: true
    });
});

// Raycaster for mouse interaction
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function onMouseMove(event) {
    // Calculate mouse position in normalized device coordinates
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

window.addEventListener('mousemove', onMouseMove, false);

// Animation state
let animationSpeed = 1;
let isPaused = false;
let showLabels = true;
let showOrbits = true;

// Update controls
const speedSlider = document.getElementById('speed');
const speedValue = document.getElementById('speed-value');
const toggleOrbitBtn = document.getElementById('toggle-orbit');
const showLabelsCheckbox = document.getElementById('show-labels');
const showOrbitsCheckbox = document.getElementById('show-orbits');

speedSlider.addEventListener('input', (e) => {
    animationSpeed = parseFloat(e.target.value);
    speedValue.textContent = animationSpeed + 'x';
});

toggleOrbitBtn.addEventListener('click', () => {
    isPaused = !isPaused;
    toggleOrbitBtn.textContent = isPaused ? 'Resume Orbits' : 'Pause Orbits';
});

showLabelsCheckbox.addEventListener('change', (e) => {
    showLabels = e.target.checked;
    planetLabels.forEach(label => {
        label.sprite.visible = showLabels;
    });
});

showOrbitsCheckbox.addEventListener('change', (e) => {
    showOrbits = e.target.checked;
    orbitLines.forEach(orbit => {
        orbit.visible = showOrbits;
    });
});

// Info panel
const planetInfo = document.getElementById('planet-info');

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    // Check for planet intersection
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(
        planetObjects.map(p => p.mesh).filter(m => m.geometry.type === 'SphereGeometry')
    );
    
    if (intersects.length > 0) {
        const planet = planetObjects.find(p => p.mesh === intersects[0].object);
        if (planet) {
            planetInfo.innerHTML = `
                <p><strong>Name:</strong> ${planet.data.name}</p>
                <p><strong>Distance from Sun:</strong> ${planet.data.distance} AU</p>
                <p><strong>Radius:</strong> ${planet.data.radius} (scaled)</p>
                <p><strong>Description:</strong> ${planet.data.description}</p>
            `;
        }
    } else {
        planetInfo.innerHTML = '<p>Hover over a planet to see details</p>';
    }
    
    // Rotate planets
    if (!isPaused) {
        planetObjects.forEach((planetObj, index) => {
            if (planetObj.data.distance > 0) {
                // Orbit around Sun
                planetObj.angle += planetObj.data.orbitSpeed * animationSpeed * 0.01;
                planetObj.group.position.x = Math.cos(planetObj.angle) * planetObj.data.distance;
                planetObj.group.position.z = Math.sin(planetObj.angle) * planetObj.data.distance;
            }
            
            // Rotate planet on its axis
            planetObj.rotationAngle += planetObj.data.rotationSpeed * animationSpeed * 0.01;
            planetObj.mesh.rotation.y = planetObj.rotationAngle;
        });
    }
    
    // Rotate Sun
    const sun = planetObjects[0];
    if (sun) {
        sun.mesh.rotation.y += 0.002 * animationSpeed;
    }
    
    controls.update();
    renderer.render(scene, camera);
}

// Handle window resize
window.addEventListener('resize', () => {
    const newWidth = container.clientWidth;
    const newHeight = container.clientHeight;
    
    camera.aspect = newWidth / newHeight;
    camera.updateProjectionMatrix();
    
    renderer.setSize(newWidth, newHeight);
});

// Start animation
animate();

// Add some atmosphere to planets
planetObjects.forEach((planetObj) => {
    if (planetObj.data.name === 'Earth' || planetObj.data.name === 'Jupiter' || planetObj.data.name === 'Saturn') {
        const atmosphereGeometry = new THREE.SphereGeometry(
            planetObj.data.radius * 1.05, 
            32, 
            32
        );
        const atmosphereMaterial = new THREE.MeshBasicMaterial({
            color: 0x3399ff,
            transparent: true,
            opacity: 0.2,
            side: THREE.BackSide
        });
        const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
        planetObj.group.add(atmosphere);
    }
});

// Add moon to Earth
const earth = planetObjects.find(p => p.data.name === 'Earth');
if (earth) {
    const moonGeometry = new THREE.SphereGeometry(3, 16, 16);
    const moonMaterial = new THREE.MeshPhongMaterial({
        color: 0xcccccc,
        shininess: 10
    });
    const moon = new THREE.Mesh(moonGeometry, moonMaterial);
    moon.position.x = 25;
    earth.group.add(moon);
    
    // Moon orbit animation
    let moonAngle = 0;
    
    // Override Earth's animate function to include moon
    const originalAnimate = animate;
    window.animate = function() {
        originalAnimate();
        
        if (!isPaused) {
            moonAngle += 0.05 * animationSpeed * 0.01;
            moon.position.x = Math.cos(moonAngle) * 25;
            moon.position.z = Math.sin(moonAngle) * 25;
            moon.rotation.y += 0.01 * animationSpeed;
        }
    };
}

// Time Zone Slider Functionality
function initTimeSlider() {
    const timeSlider = document.getElementById('time-slider');
    const utcTimeDisplay = document.getElementById('utc-time');
    const istTimeDisplay = document.getElementById('ist-time');
    const perthTimeDisplay = document.getElementById('perth-time');
    const currentDateDisplay = document.getElementById('current-date');
    const sliderHoursDisplay = document.getElementById('slider-hours');

    // Get current date and time
    const now = new Date();
    const currentDate = now.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    // Set current date
    if (currentDateDisplay) {
        currentDateDisplay.textContent = currentDate;
    }

    // Update time displays based on slider value
    function updateTimeDisplays(hours) {
        // Calculate total seconds from hours (including fractional part)
        const totalSeconds = Math.floor(hours * 3600);
        const displayHours = Math.floor(hours);
        const displayMinutes = Math.floor((hours - displayHours) * 60);
        const displaySeconds = totalSeconds % 60;

        // Format time as HH:MM:SS
        const formatTime = (h, m, s) => {
            const formattedH = String(h).padStart(2, '0');
            const formattedM = String(m).padStart(2, '0');
            const formattedS = String(s).padStart(2, '0');
            return `${formattedH}:${formattedM}:${formattedS}`;
        };

        // UTC time (base time from slider)
        const utcH = displayHours % 24;
        const utcM = displayMinutes;
        const utcS = displaySeconds;
        
        // IST time (UTC + 5:30)
        let istTotalHours = hours + TIMEZONE_OFFSETS.IST;
        const istH = Math.floor(istTotalHours) % 24;
        const istM = Math.floor((istTotalHours - Math.floor(istTotalHours)) * 60) + displayMinutes;
        const istS = displaySeconds;
        
        // Adjust IST minutes if they overflow
        let adjustedIstM = istM;
        let adjustedIstH = istH;
        if (istM >= 60) {
            adjustedIstM = istM - 60;
            adjustedIstH = (istH + 1) % 24;
        }
        
        // Perth time (UTC + 8)
        let perthTotalHours = hours + TIMEZONE_OFFSETS.Perth;
        const perthH = Math.floor(perthTotalHours) % 24;
        const perthM = Math.floor((perthTotalHours - Math.floor(perthTotalHours)) * 60) + displayMinutes;
        const perthS = displaySeconds;
        
        // Adjust Perth minutes if they overflow
        let adjustedPerthM = perthM;
        let adjustedPerthH = perthH;
        if (perthM >= 60) {
            adjustedPerthM = perthM - 60;
            adjustedPerthH = (perthH + 1) % 24;
        }

        // Update displays
        if (utcTimeDisplay) {
            utcTimeDisplay.textContent = formatTime(utcH, utcM, utcS);
        }
        if (istTimeDisplay) {
            istTimeDisplay.textContent = formatTime(adjustedIstH, adjustedIstM, istS);
        }
        if (perthTimeDisplay) {
            perthTimeDisplay.textContent = formatTime(adjustedPerthH, adjustedPerthM, perthS);
        }
        if (sliderHoursDisplay) {
            sliderHoursDisplay.textContent = `${Math.floor(hours)} hours`;
        }
    }

    // Initialize with current UTC hour
    const currentUtcHour = now.getUTCHours() + (now.getUTCMinutes() / 60) + (now.getUTCSeconds() / 3600);
    if (timeSlider) {
        timeSlider.value = currentUtcHour;
    }

    // Set initial time displays
    updateTimeDisplays(currentUtcHour);

    // Add event listener for slider changes
    if (timeSlider) {
        timeSlider.addEventListener('input', (e) => {
            const hours = parseFloat(e.target.value);
            updateTimeDisplays(hours);
        });
    }

    // Auto-update time every second
    setInterval(() => {
        const now = new Date();
        const currentUtcHour = now.getUTCHours() + (now.getUTCMinutes() / 60) + (now.getUTCSeconds() / 3600);
        if (timeSlider) {
            // Only update slider if it hasn't been manually changed recently
            // (This prevents the slider from jumping back when user is interacting with it)
            const sliderValue = parseFloat(timeSlider.value);
            const diff = Math.abs(currentUtcHour - sliderValue);
            
            // Update if difference is more than 1 hour (user likely not interacting)
            if (diff > 1) {
                timeSlider.value = currentUtcHour;
                updateTimeDisplays(currentUtcHour);
            }
        }
    }, 1000);
}

// Initialize time slider when DOM is ready
document.addEventListener('DOMContentLoaded', initTimeSlider);


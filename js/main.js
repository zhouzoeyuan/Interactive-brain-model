let scene, camera, renderer, controls;
let brainModel;
let originalMaterials = new Map(); // Store original materials
let labels = {};

let brainRegions = {
    frontal: {
        description: "The frontal lobe is involved in executive functions, including planning, decision-making, and motor control. It contains the primary motor cortex and Broca's area for speech production.\n\n额叶参与执行功能，包括计划、决策和运动控制。它包含初级运动皮层和布洛卡区（负责语言产生）。",
        color: 0x4CAF50,
        bounds: {
            minZ: 0.5,     // Only front third
            maxZ: 2.0,
            minY: -0.2,    // Above temporal lobe
            maxY: 2.0,     // Top of brain
            maxX: 1.0,     // Limit sides
            minX: -1.0
        },
        labelPosition: new THREE.Vector3(0, 0.2, 1.0),  // Moved more to the front
        labelText: "Frontal | 额叶"
    },
    parietal: {
        description: "The parietal lobe processes sensory information and is involved in spatial awareness, navigation, and attention. It contains the primary somatosensory cortex.\n\n顶叶处理感觉信息，参与空间感知、导航和注意力。它包含初级躯体感觉皮层。",
        color: 0x2196F3,
        bounds: {
            minZ: -0.3,    // Middle section
            maxZ: 0.5,     // Behind frontal
            minY: 0.3,     // Upper half only
            maxY: 2.0,     // Top of brain
            maxX: 1.0,     // Limit sides
            minX: -1.0
        },
        labelPosition: new THREE.Vector3(0, 1.0, 0),  // Moved higher up for top view
        labelText: "Parietal | 顶叶"
    },
    temporal: {
        description: "The temporal lobe processes auditory information and is crucial for memory formation. It contains the primary auditory cortex and Wernicke's area for language comprehension.\n\n颞叶处理听觉信息，对记忆形成至关重要。它包含初级听觉皮层和韦尼克区（负责语言理解）。",
        color: 0xF44336,
        bounds: {
            minY: -0.5,    // Middle height
            maxY: 0.3,     // Below parietal
            absX: 0.8,     // Side parts only
            minZ: -0.3,    // Middle section
            maxZ: 0.5
        },
        labelPosition: new THREE.Vector3(1.2, -0.1, 0.3),  // Moved more to the right and slightly forward
        labelText: "Temporal | 颞叶"
    },
    occipital: {
        description: "The occipital lobe processes visual information. It contains the primary visual cortex and is essential for interpreting what we see.\n\n枕叶处理视觉信息。它包含初级视觉皮层，对解释我们所看到的内容至关重要。",
        color: 0xFFC107,
        bounds: {
            maxZ: -0.3,    // Back section only
            minY: 0.0,     // Upper half
            maxY: 2.0,
            maxX: 0.8,     // Limit sides
            minX: -0.8
        },
        labelPosition: new THREE.Vector3(0, 0.2, -0.8),
        labelText: "Occipital | 枕叶"
    },
    cerebellum: {
        description: "The cerebellum coordinates movement and balance, and is involved in motor learning and certain cognitive functions.\n\n小脑协调运动和平衡，参与运动学习和某些认知功能。",
        color: 0x9C27B0,
        bounds: {
            maxY: -0.3,    // Lower back only
            minY: -0.8,    // Above brainstem
            maxZ: -0.2,    // Back section
            minZ: -2.0,
            maxX: 0.8,     // Limit sides
            minX: -0.8
        },
        labelPosition: new THREE.Vector3(0.6, -0.5, -0.6),  // Moved to bottom right
        labelText: "Cerebellum | 小脑"
    },
    brainstem: {
        description: "The brainstem controls basic life functions like breathing, heart rate, and consciousness. It connects the brain to the spinal cord.\n\n脑干控制基本生命功能，如呼吸、心率和意识。它连接大脑和脊髓。",
        color: 0xFF9800,
        bounds: {
            maxY: -0.8,    // Bottom only
            minY: -2.0,
            maxX: 0.3,     // Center part only
            minX: -0.3,
            minZ: -0.5,    // Center to front
            maxZ: 0.5
        },
        labelPosition: new THREE.Vector3(0, -0.9, 0),  // Moved lower down
        labelText: "Brainstem | 脑干"
    }
};

function init() {
    // Create scene with a gradient background
    scene = new THREE.Scene();
    
    // Create a subtle gradient background
    const bgTexture = createGradientTexture();
    scene.background = bgTexture;

    // Add ambient environment lighting with increased intensity
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.8);
    hemiLight.color.setHSL(0.6, 1, 0.6);
    hemiLight.groundColor.setHSL(0.095, 1, 0.75);
    hemiLight.position.set(0, 50, 0);
    scene.add(hemiLight);

    // Add soft environmental lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 2.0);
    scene.add(ambientLight);

    // Add multiple directional lights for better coverage
    // Front light
    const frontLight = new THREE.DirectionalLight(0xffffff, 0.8);
    frontLight.position.set(0, 0, 5);
    scene.add(frontLight);

    // Back light
    const backLight = new THREE.DirectionalLight(0xffffff, 0.8);
    backLight.position.set(0, 0, -5);
    scene.add(backLight);

    // Side lights
    const leftLight = new THREE.DirectionalLight(0xffffff, 0.6);
    leftLight.position.set(-5, 0, 0);
    scene.add(leftLight);

    const rightLight = new THREE.DirectionalLight(0xffffff, 0.6);
    rightLight.position.set(5, 0, 0);
    scene.add(rightLight);

    // Top light for better overall illumination
    const topLight = new THREE.DirectionalLight(0xffffff, 0.5);
    topLight.position.set(0, 5, 0);
    scene.add(topLight);

    // Create camera
    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.z = 5;

    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('brain-container').appendChild(renderer.domElement);

    // Add OrbitControls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // Add these lines to limit zoom
    controls.minDistance = 4;  // Minimum distance to prevent zooming too close
    controls.maxDistance = 10; // Maximum distance to prevent zooming too far
    controls.enablePan = false; // Disable panning to keep brain centered

    // Add touch event handling for OrbitControls
    controls.touches = {
        ONE: THREE.TOUCH.ROTATE,
        TWO: THREE.TOUCH.DOLLY_PAN
    };
    controls.enableZoom = true;
    controls.enableRotate = true;
    controls.rotateSpeed = 0.5;
    controls.zoomSpeed = 1.2;
    controls.touchStart = function() {
        // Handle touch start
    };
    controls.touchEnd = function() {
        // Handle touch end
    };

    // Prevent default touch behavior
    renderer.domElement.addEventListener('touchmove', function(e) {
        e.preventDefault();
    }, { passive: false });

    // Add event listener for region selection
    document.getElementById('region-selector').addEventListener('change', (e) => {
        const selectedRegion = e.target.value;
        updateRegionInfo(selectedRegion);
        highlightRegion(selectedRegion);
    });

    // Load 3D brain model
    const loader = new THREE.GLTFLoader();
    loader.load(
        './brain_model.glb',
        function (gltf) {
            console.log('=== START MODEL INSPECTION ===');
            brainModel = gltf.scene;
            
            // Log the entire model structure
            console.log('Full model:', gltf);
            console.log('Scene:', gltf.scene);
            
            // Inspect each object in the scene
            let meshCount = 0;
            gltf.scene.traverse((object) => {
                console.log('Object found:', {
                    name: object.name,
                    type: object.type,
                    isGroup: object.isGroup,
                    isMesh: object.isMesh
                });
                if (object.isMesh) meshCount++;
            });
            
            console.log('Total meshes found:', meshCount);
            console.log('=== END MODEL INSPECTION ===');
            
            // Add detailed logging of the model structure
            console.log('=== Model Mesh Names ===');
            brainModel.traverse((child) => {
                if (child.isMesh) {
                    console.log('Mesh name:', child.name);
                    console.log('Mesh type:', child.type);
                    console.log('------------------------');
                    originalMaterials.set(child, child.material.clone());
                }
            });
            
            // Set maximum dimensions
            const maxSize = 4;
            const box = new THREE.Box3().setFromObject(gltf.scene);
            const size = box.getSize(new THREE.Vector3());
            const maxDimension = Math.max(size.x, size.y, size.z);
            
            // Calculate scale to fit within maxSize
            const scale = maxSize / maxDimension;
            gltf.scene.scale.set(scale, scale, scale);
            
            scene.add(gltf.scene);
            
            // Center the model
            const centerBox = new THREE.Box3().setFromObject(gltf.scene);
            const center = centerBox.getCenter(new THREE.Vector3());
            gltf.scene.position.sub(center);
            
            // Set camera position based on model size
            camera.position.z = maxSize * 1.5;

            console.log('Model structure:');
            brainModel.traverse((child) => {
                if (child.isMesh) {
                    console.log('Found mesh:', child.name);
                }
            });

            // Create labels after model is set up
            setTimeout(createLabels, 100); // Small delay to ensure model is ready
        },
        function (xhr) {
            console.log((xhr.loaded / xhr.total * 100) + '% loaded');
        },
        function (error) {
            console.error('An error occurred loading the model:', error);
            const errorDiv = document.createElement('div');
            errorDiv.style.color = 'red';
            errorDiv.style.position = 'absolute';
            errorDiv.style.top = '50%';
            errorDiv.style.left = '50%';
            errorDiv.style.transform = 'translate(-50%, -50%)';
            errorDiv.textContent = 'Error loading model: ' + error.message;
            document.body.appendChild(errorDiv);
        }
    );

    // Handle window resize
    window.addEventListener('resize', onWindowResize, false);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    updateLabels();
    renderer.render(scene, camera);
}

function updateRegionInfo(regionName) {
    const description = document.getElementById('region-description');
    if (regionName && brainRegions[regionName]) {
        description.textContent = brainRegions[regionName].description;
    } else {
        description.textContent = 'Select a brain region to learn more.';
    }
}

// Add this function to highlight regions
function highlightRegion(regionName) {
    // Don't highlight if occipital is selected
    if (regionName === 'occipital') {
        return; // Exit the function without making any changes
    }

    // Reset all materials to original state first
    brainModel.traverse((child) => {
        if (child.isMesh) {
            const originalMaterial = originalMaterials.get(child);
            if (originalMaterial) {
                child.material = originalMaterial.clone();
            }
        }
    });

    // If a region is selected, highlight based on position
    if (regionName && brainRegions[regionName]) {
        brainModel.traverse((child) => {
            if (child.isMesh) {
                const geometry = child.geometry;
                const position = geometry.attributes.position;
                const vector = new THREE.Vector3();
                let verticesInRegion = 0;
                let totalVertices = 0;

                // Check each vertex
                for (let i = 0; i < position.count; i++) {
                    vector.fromBufferAttribute(position, i);
                    vector.applyMatrix4(child.matrixWorld);
                    totalVertices++;

                    const bounds = brainRegions[regionName].bounds;
                    let inRegion = true;

                    // Special handling for temporal lobe (side parts)
                    if (bounds.absX) {
                        if (Math.abs(vector.x) < bounds.absX) inRegion = false;
                    } else {
                        if (bounds.minX && vector.x < bounds.minX) inRegion = false;
                        if (bounds.maxX && vector.x > bounds.maxX) inRegion = false;
                    }

                    if (bounds.minY && vector.y < bounds.minY) inRegion = false;
                    if (bounds.maxY && vector.y > bounds.maxY) inRegion = false;
                    if (bounds.minZ && vector.z < bounds.minZ) inRegion = false;
                    if (bounds.maxZ && vector.z > bounds.maxZ) inRegion = false;

                    if (inRegion) verticesInRegion++;
                }

                // Only highlight if enough vertices are in the region (30% threshold)
                if (verticesInRegion / totalVertices > 0.3) {
                    const newMaterial = child.material.clone();
                    newMaterial.emissive.setHex(brainRegions[regionName].color);
                    newMaterial.emissiveIntensity = 0.3;
                    child.material = newMaterial;
                }
            }
        });
    }
}

function createLabels() {
    // Remove any existing labels
    Object.values(labels).forEach(label => {
        if (label.element) {
            document.body.removeChild(label.element);
        }
    });
    labels = {};

    // Create new labels for each region
    Object.entries(brainRegions).forEach(([name, region]) => {
        const element = document.createElement('div');
        element.className = 'brain-label';
        element.textContent = region.labelText;
        element.style.backgroundColor = '#' + region.color.toString(16).padStart(6, '0');
        
        // Initialize with the position from the brain model
        element.style.left = '0';
        element.style.top = '0';
        element.style.display = 'none';  // Hide initially
        
        document.body.appendChild(element);
        
        if (name === 'temporal') {
            labels[name] = {
                element: element,
                position: region.labelPosition.clone().multiplyScalar(1.0)
            };
        } else {
            labels[name] = {
                element: element,
                position: region.labelPosition.clone().multiplyScalar(1.0)
            };
        }
    });
}

function updateLabels() {
    Object.entries(labels).forEach(([name, label]) => {
        if (!label.element) return;

        const screenPosition = label.position.clone().project(camera);
        const x = (screenPosition.x * 0.5 + 0.5) * window.innerWidth;
        const y = (-screenPosition.y * 0.5 + 0.5) * window.innerHeight;

        if (isNaN(x) || isNaN(y)) {
            label.element.style.display = 'none';
            return;
        }

        const isBehind = screenPosition.z > 1;
        const cameraAngle = Math.atan2(camera.position.x, camera.position.z);
        let offsetX = 0;
        let offsetY = 0;
        let shouldShow = true;

        switch(name) {
            case 'frontal':
                // Show frontal label only when viewing more from front or left side
                shouldShow = (camera.position.z > Math.abs(camera.position.x) * 0.3) || 
                             (camera.position.x < -Math.abs(camera.position.z) * 0.5);
                
                if (shouldShow) {
                    if (camera.position.y < -0.5) {
                        // Bottom view
                        offsetY = -60;
                        offsetX = 0;
                    } else if (camera.position.x < -Math.abs(camera.position.z) * 0.5) {
                        // Left side view
                        offsetX = -60;  // Move label more to the left
                        offsetY = 0;
                    } else {
                        // Normal front view
                        offsetX = Math.sin(cameraAngle) * 20;
                        offsetY = 0;
                    }
                    label.element.style.zIndex = "1100";
                }
                break;
            case 'parietal':
                // Show when viewing from top or front-top
                shouldShow = camera.position.y > 0;
                
                // Adjust position based on viewing angle
                if (camera.position.y > Math.abs(camera.position.z)) {
                    // Top view adjustments
                    offsetY = -40;  // Move label up more
                    offsetX = Math.sin(cameraAngle) * 10;
                } else {
                    // Normal view adjustments
                    offsetY = -30;
                    offsetX = Math.sin(cameraAngle) * 15;
                }
                break;
            case 'temporal':
                const sideView = Math.abs(camera.position.x) > Math.abs(camera.position.z) * 0.5;
                const rightSide = camera.position.x > 0;
                
                // Only show temporal when viewing from sides or front, not from back
                shouldShow = (sideView && camera.position.z > -Math.abs(camera.position.x) * 0.3) || 
                             (camera.position.y < -0.5 && camera.position.z > 0);
                
                // Hide when viewing from back
                if (camera.position.z < 0) {
                    shouldShow = false;
                }
                
                if (shouldShow) {
                    if (camera.position.y < -0.5) {
                        // Bottom view positioning
                        offsetY = -30;
                        offsetX = 0;
                        label.element.style.zIndex = "1050";
                    } else {
                        // Side view positioning
                        offsetX = rightSide ? 60 : -60;
                        offsetY = 0;
                    }
                    
                    // Calculate screen position for temporal label
                    const screenPosition = label.position.clone().project(camera);
                    const x = (screenPosition.x * 0.5 + 0.5) * window.innerWidth;
                    const y = (-screenPosition.y * 0.5 + 0.5) * window.innerHeight;
                    
                    // Only show and position if the position is valid
                    if (!isNaN(x) && !isNaN(y)) {
                        label.element.style.left = `${x + offsetX}px`;
                        label.element.style.top = `${y + offsetY}px`;
                        label.element.style.display = 'block';
                    } else {
                        label.element.style.display = 'none';
                    }
                } else {
                    label.element.style.display = 'none';
                }
                break;
            case 'occipital':
                // Show label only when viewing from back
                const viewingFromBack = camera.position.z < 0;
                const viewingFromBackSide = Math.abs(camera.position.x) < Math.abs(camera.position.z);
                shouldShow = viewingFromBack && viewingFromBackSide && camera.position.y > -0.3;
                
                // Adjust position based on viewing angle
                if (shouldShow) {
                    // Base offset
                    offsetX = -Math.sin(cameraAngle) * 30;
                    offsetY = 0;
                    
                    // Additional adjustments based on camera position
                    if (camera.position.y > 0.3) {
                        offsetY += 20; // Move label down when viewing from above
                    } else if (camera.position.y < -0.3) {
                        offsetY -= 20; // Move label up when viewing from below
                    }
                    
                    // Adjust for extreme angles
                    if (Math.abs(camera.position.x) > Math.abs(camera.position.z) * 0.8) {
                        offsetX *= 0.5; // Reduce horizontal offset when viewing from sides
                    }
                }
                break;
            case 'cerebellum':
                shouldShow = camera.position.y < 0.5;
                if (camera.position.y < -0.5) {
                    // Bottom view positioning
                    offsetX = 40;  // Move to the right
                    offsetY = 20;  // Moved down (positive value moves down)
                    label.element.style.zIndex = "1200";
                } else if (camera.position.z < 0) {
                    // Back view positioning
                    offsetX = Math.sin(cameraAngle) * 30;
                    offsetY = 40;  // Moved down more
                    
                    // Additional adjustment for side views
                    if (Math.abs(camera.position.x) > Math.abs(camera.position.z) * 0.5) {
                        offsetX += 30;
                    }
                    label.element.style.zIndex = "1000";
                } else {
                    shouldShow = false;
                }
                break;
            case 'brainstem':
                shouldShow = camera.position.y < 0;
                if (camera.position.y < -0.5) {
                    // Bottom view positioning
                    offsetY = 40;  // Moved down (positive value moves down)
                    offsetX = 0;
                    label.element.style.zIndex = "1100";
                } else {
                    offsetY = 60;  // Moved down even more for other views
                    // Additional adjustments for other views...
                }
                break;
        }

        label.element.style.display = shouldShow && !isBehind ? 'block' : 'none';
        if (shouldShow && !isBehind) {
            label.element.style.left = `${x + offsetX}px`;
            label.element.style.top = `${y + offsetY}px`;
        }
    });
}

function setupMinimizeButton() {
    const minimizeBtn = document.getElementById('minimize-btn');
    const infoPanel = document.getElementById('info');
    let isPanelMinimized = false;

    minimizeBtn.addEventListener('click', () => {
        isPanelMinimized = !isPanelMinimized;
        infoPanel.classList.toggle('minimized');
        minimizeBtn.innerHTML = isPanelMinimized ? '&#43;' : '&minus;';  // Use &#43; for plus sign, &minus; for minus
    });
}

// Add device orientation handling if needed
function handleDeviceOrientation() {
    if (window.DeviceOrientationEvent) {
        window.addEventListener('deviceorientation', function(event) {
            // Handle device orientation if needed
        });
    }
}

// Helper function to create gradient background texture
function createGradientTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 2;
    canvas.height = 2;

    const context = canvas.getContext('2d');

    // Create gradient
    const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#e8f4f8');  // Light blue-ish top
    gradient.addColorStop(1, '#ffffff');   // White bottom

    // Fill with gradient
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;

    return texture;
}

init();
animate();
setupMinimizeButton(); 
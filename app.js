const fileInput = document.getElementById('file-input');
const info = document.getElementById('info');


fileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const extension = file.name.split('.').pop().toLowerCase();
    let loader;
    switch (extension) {
        case 'stl':
            loader = new THREE.STLLoader();
            break;
        case 'obj':
            loader = new THREE.OBJLoader();
            break;
        case '3mf':
            loader = new THREE.ThreeMFLoader();
            break;
        default:
            info.textContent = 'Unsupported file format.';
            return;
    }

    const reader = new FileReader();
    reader.addEventListener('load', (event) => {
        const data = event.target.result;
        loader.parse(data, (object) => {
            const volume = calculateVolume(object);
            const cost = calculateCost(volume, /* parameters */);
            info.textContent = `Volume: ${volume.toFixed(2)} cm³, Cost: $${cost.toFixed(2)}`;
        });
    });

    reader.readAsArrayBuffer(file);
});

function calculateVolume(object) {
    let volume = 0;
    object.traverse((child) => {
        if (child instanceof THREE.Mesh) {
            const geometry = child.geometry;
            if (geometry.isBufferGeometry) {
                geometry.computeFaceNormals();
                const positions = geometry.getAttribute('position').array;
                const index = geometry.getIndex().array;
                for (let i = 0; i < index.length; i += 3) {
                    const a = new THREE.Vector3().fromArray(positions, index[i] * 3);
                    const b = new THREE.Vector3().fromArray(positions, index[i + 1] * 3);
                    const c = new THREE.Vector3().fromArray(positions, index[i + 2] * 3);

                    volume += tetrahedronVolume(a, b, c);
                }
            }
        }
    });

    return Math.abs(volume);
}

function tetrahedronVolume(a, b, c) {
    const v321 = c.x * b.y * a.z;
    const v231 = b.x * c.y * a.z;
}

function calculateCost(volume, volumetricFlowRate, costPerHour, materialUsed) {
    const printTime = volume / volumetricFlowRate; // Time in hours
    const materialCost = volume * materialUsed; // Cost of material used
    const printCost = printTime * costPerHour; // Cost of printing based on time

    return materialCost + printCost;
}


const volumetricFlowRate = 10; // Example: 10 cm³ per hour
const costPerHour = 5; // Example: $5 per hour of printing
const materialUsed = 0.03; // Example: $0.03 per cm³ of material

loader.parse(data, (object) => {
    // Remove the previous object from the scene, if any
    scene.children
        .filter((child) => child.userData.is3DObject)
        .forEach((child) => scene.remove(child));

    // Add the new object to the scene
    object.userData.is3DObject = true;
    scene.add(object);

    // Center the object in the viewer
    const box = new THREE.Box3().setFromObject(object);
    const center = box.getCenter(new THREE.Vector3());
    object.position.sub(center);

    // Calculate the volume and cost
    const volume = calculateVolume(object);
    const cost = calculateCost(volume, volumetricFlowRate, costPerHour, materialUsed);
    info.textContent = `Volume: ${volume.toFixed(2)} cm³, Cost: $${cost.toFixed(2)}`;

    // Fit the camera to the object
    const maxSize = box.getSize(new THREE.Vector3()).length();
    const fov = camera.fov * (Math.PI / 180);
    const distance = Math.abs(maxSize / Math.sin(fov / 2));
    camera.position.set(distance, distance, distance);
    camera.lookAt(center);
    controls.update();
});

// Set up the 3D viewer
const viewer = document.getElementById('viewer');
const width = viewer.clientWidth;
const height = viewer.clientHeight;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
camera.position.z = 5;

const renderer = new THREE.WebGLRenderer({ alpha: true });
renderer.setSize(width, height);
viewer.appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.25;
controls.enableZoom = true;

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();

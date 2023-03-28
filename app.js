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
    const volume = calculateVolume(object);
    const cost = calculateCost(volume, volumetricFlowRate, costPerHour, materialUsed);
    info.textContent = `Volume: ${volume.toFixed(2)} cm³, Cost: $${cost.toFixed(2)}`;
});



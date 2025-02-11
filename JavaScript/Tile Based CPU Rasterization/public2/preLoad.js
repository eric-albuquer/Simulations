const canvas = document.getElementById("screen")

const WIDTH = window.innerWidth
const HEIGHT = window.innerHeight

canvas.width = WIDTH
canvas.height = HEIGHT

canvas.addEventListener('click', function () {
    canvas.requestPointerLock(); // Solicita o bloqueio do ponteiro no canvas
});

const ctx = canvas.getContext("2d")

ctx.font = '20px Arial';  // Define o tamanho e fonte do texto
ctx.fillStyle = 'white';  // Cor do texto

const imageData = ctx.createImageData(WIDTH, HEIGHT)

const frame = imageData.data

const workersLen = 11
const trianglesLen =  meshTriangles.length / 3

const deltaWidth = Math.ceil(WIDTH / workersLen)
const deltaTriangle = Math.ceil(trianglesLen / workersLen)

let workDone = 0

const workers = new Array(workersLen)
const workerBox = new Array(workersLen)
const workerTriangleBatch = new Array(workersLen)
const sharedFrameBuffer = new SharedArrayBuffer(WIDTH * HEIGHT * 4)
const frameBuffer = new Uint8ClampedArray(sharedFrameBuffer)
const triangles = new Uint32Array(meshTriangles)
const vertices = new Float32Array(meshVertices)
const colors = new Float32Array(meshColors)
const sharedMatrix = new SharedArrayBuffer(16 * 4)
const matrix = new Float32Array(sharedMatrix)
const sharedTriangleData = new SharedArrayBuffer(trianglesLen * 33 * 4)
const sharedDone = new SharedArrayBuffer(workersLen)

for (let i = 0; i < workersLen; i++) {
    const startX = i * deltaWidth
    const endX = Math.min((i + 1) * deltaWidth, WIDTH)

    workerBox[i] = {
        minX: startX,
        maxX: endX,
        minY: 0,
        maxY: HEIGHT
    }

    const startTriangle = i * deltaTriangle
    const endTriangle = Math.min((i + 1) * deltaTriangle, trianglesLen)

    workerTriangleBatch[i] = {
        start: startTriangle,
        end: endTriangle
    }

    const worker = new Worker("worker.js")

    worker.onmessage = (_) => { workDone++ }

    workers[i] = worker
}

const playerVelocity = 0.1
const mouseSensitivity = 0.002

const pi2 = Math.PI / 2

let cameraX = -2, cameraY = 1, cameraZ = 4
let angleX = 0, angleY = 0

canvas.addEventListener('mousemove', function (event) {
    if (document.pointerLockElement === canvas) {
        angleX += event.movementY * mouseSensitivity
        angleY -= event.movementX * mouseSensitivity

        if (angleX >= pi2)
            angleX = pi2
        else if (angleX <= -pi2)
            angleX = -pi2
    }
});

const keys = ["w", "a", "s", "d", "Shift", " "]

const keyboardKeys = new Map(keys.map(key => [key, false])); // Inicializa a Map corretamente

document.addEventListener('keydown', function (event) {
    keyboardKeys[event.key] = true
});

document.addEventListener('keyup', function (event) {
    keyboardKeys[event.key] = false
});

function updatePos() {
    const psin = playerVelocity * Math.sin(angleY)
    const pcos = playerVelocity * Math.cos(angleY)
    if (keyboardKeys["w"]) {
        cameraX += psin
        cameraZ -= pcos
    }
    if (keyboardKeys["s"]) {
        cameraX -= psin
        cameraZ += pcos
    }
    if (keyboardKeys["a"]) {
        cameraX += pcos
        cameraZ += psin
    }
    if (keyboardKeys["d"]) {
        cameraX -= pcos
        cameraZ -= psin
    }
    if (keyboardKeys["Shift"]) {
        cameraY -= playerVelocity
    }
    if (keyboardKeys[" "]) {
        cameraY += playerVelocity
    }
}
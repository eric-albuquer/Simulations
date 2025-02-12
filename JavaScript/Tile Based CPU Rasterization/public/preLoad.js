const canvas = document.getElementById("screen")

const WIDTH = window.innerWidth
const HEIGHT = window.innerHeight

const CENTERX = WIDTH >> 1
const CENTERY = HEIGHT >> 1

const PI2 = Math.PI * 2

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

const deltaWidth = Math.ceil(WIDTH / workersLen)

let workDone = 0

const workers = new Array(workersLen)
const workerBox = new Array(workersLen)
const sharedFrameBuffer = new SharedArrayBuffer(WIDTH * HEIGHT * 4)
const frameBuffer = new Uint8ClampedArray(sharedFrameBuffer)
const sharedMatrix = new SharedArrayBuffer(16 * 4)
const matrix = new Float32Array(sharedMatrix)
const sharedTriangleData = new SharedArrayBuffer(maxTriangleCapacity * 94)
const sharedDone = new SharedArrayBuffer(workersLen)

let lastFrameTime = Date.now();

for (let i = 0; i < workersLen; i++) {
    const startX = i * deltaWidth
    const endX = Math.min((i + 1) * deltaWidth, WIDTH)

    workerBox[i] = {
        minX: startX,
        maxX: endX,
        minY: 0,
        maxY: HEIGHT
    }

    const worker = new Worker("worker.js")

    worker.onmessage = (_) => { workDone++ }

    workers[i] = worker
}

const playerVelocity = 0.005
const jumpForce = 0.05
const mouseSensitivity = 0.002

const pi2 = Math.PI / 2

let cameraX = -2, cameraY = 1, cameraZ = -10
let angleX = 0, angleY = 0

let mouse1 = false
let mouse2 = false

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

canvas.addEventListener('mouseup', function (event) {
    if (event.button === 0) { // 0 representa o botão esquerdo (mouse1)
        mouse1 = false
    }
    if (event.button === 2){
        mouse2 = false
    }
});
canvas.addEventListener('mousedown', function (event) {
    if (event.button === 0) { // 0 representa o botão esquerdo (mouse1)
        mouse1 = true
    }
    if (event.button === 2){
        mouse2 = true
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

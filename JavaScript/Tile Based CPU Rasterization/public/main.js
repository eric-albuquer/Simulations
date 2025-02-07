const canvas = document.getElementById("screen")

canvas.addEventListener('click', function () {
    canvas.requestPointerLock(); // Solicita o bloqueio do ponteiro no canvas
});

const width = window.innerWidth
const height = window.innerHeight

canvas.width = width
canvas.height = height

let fps = 0;

const aspectRatio = width / height

let fov = Math.PI / 3
const near = 0.1
const far = 1000

const pi2 = Math.PI / 2

const mouseSensitivity = 0.002
const playerVelocity = 0.5

let angleX = 0
let angleY = 0

let cameraX = -2
let cameraY = 1
let cameraZ = 4

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

const ctx = canvas.getContext("2d")

ctx.font = '20px Arial';  // Define o tamanho e fonte do texto
ctx.fillStyle = 'white';  // Cor do texto

const imageData = ctx.createImageData(width, height)

const frame = imageData.data

const sharedFrameBuffer = new SharedArrayBuffer(width * height * 4)
const frameBuffer = new Uint8ClampedArray(sharedFrameBuffer)

const sharedZBuffer = new SharedArrayBuffer(width * height * 4)
const zBuffer = new Int32Array(sharedZBuffer)

const sharedMatrix = new SharedArrayBuffer(4 * 16)
const matrix = new Float32Array(sharedMatrix)

const trianglesLen = Math.floor(meshTriangles.length / 3)

const sharedVertices = new SharedArrayBuffer(4 * trianglesLen * 9)
const sharedColors = new SharedArrayBuffer(4 * trianglesLen * 9)
const sharedTriangles = new SharedArrayBuffer(trianglesLen * 4 * 3)

const vertices = new Float32Array(sharedVertices)
const colors = new Float32Array(sharedColors)
const triangles = new Uint32Array(sharedTriangles)

vertices.set(meshVertices)
colors.set(meshColors)
triangles.set(meshTriangles)

const sharedScreenVertices = new SharedArrayBuffer(trianglesLen * 36)
const sharedScreenColors = new SharedArrayBuffer(trianglesLen * 9)
const sharedTrianglesBox = new SharedArrayBuffer(trianglesLen * 4 * 4)

let renderThreads = navigator.hardwareConcurrency - 1

const workersLen = renderThreads

wPerH = 1
wPerW = renderThreads

const sqrtLen = Math.sqrt(workersLen)
const workers = new Array(workersLen)

const sharedDone = new SharedArrayBuffer(workersLen)

const doneArray = new Uint8Array(sharedDone)

const dw = Math.ceil(width / wPerW)

const dTri = Math.ceil(trianglesLen / workersLen)

const screenBoundingBox = new Array(workersLen)
const triangleBatch = new Array(workersLen)

let done = 0

const minY = 0
const maxY = height

for (let i = 0; i < wPerW; i++) {
    const minX = i * dw
    const maxX = Math.min(minX + dw, width)

    screenBoundingBox[i] = { minX, maxX, minY, maxY }

    const start = i * dTri
    const end = Math.min(trianglesLen, start + dTri)
    triangleBatch[i] = { start, end }

    const worker = new Worker("worker.js")

    worker.onmessage = (_) => {
        if (++done === workersLen) {
            done = 0

            frame.set(frameBuffer)
            ctx.putImageData(imageData, 0, 0)
            requestAnimationFrame(render)
        }
    }

    workers[i] = worker
}

function setup() {
    for (let i = 0; i < workersLen; i++) {
        workers[i].postMessage({
            init: true,
            width,
            height,
            sharedFrameBuffer,
            sharedZBuffer,
            boundingBox: screenBoundingBox[i],
            triangleBatch: triangleBatch[i],
            sharedVertices,
            sharedColors,
            sharedScreenVertices,
            sharedScreenColors,
            sharedTrianglesBox,
            sharedDone,
            workerIdx: i,
            sharedMatrix,
            sharedTriangles
        })
    }
}

// Função para desenhar o FPS no contexto2d
function renderFPS(fps) {
    const fpsText = `FPS: ${fps}`;

    ctx.fillText(fpsText, 10, 30);
}

let lastFrameTime = performance.now();
let frameCount = 0;

function render() {
    let currentTime = performance.now();
    let deltaTime = currentTime - lastFrameTime;

    if (deltaTime >= 1000) {  // A cada 1000ms (1 segundo)
        lastFrameTime = currentTime;
        fps = frameCount;
        frameCount = 0;
    }
    // Atualiza o contador de FPS
    frameCount++;

    updatePos()

    // Limpeza de buffers
    zBuffer.fill(0x800000);
    doneArray.fill(0);
    frameBuffer.fill(0);

    // Processamento de matriz e transformações
    perspective(matrix, fov, aspectRatio, near, far);
    rotateX(matrix, angleX);
    rotateY(matrix, angleY);
    translate(matrix, cameraX, cameraY, cameraZ);

    // Enviar mensagens para os workers
    for (let i = 0; i < workersLen; i++) {
        workers[i].postMessage(0);
    }

    // Renderizar FPS na tela
    renderFPS(fps);
}

setup()

render()

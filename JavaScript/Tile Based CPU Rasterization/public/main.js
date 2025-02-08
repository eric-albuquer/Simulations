const canvas = document.getElementById("screen")

canvas.addEventListener('click', function () {
    canvas.requestPointerLock(); // Solicita o bloqueio do ponteiro no canvas
});

const width = window.innerWidth
const height = window.innerHeight

canvas.width = width
canvas.height = height

let fps = 0;

const aspectRatio = height / width

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

let frameCount = 0;

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

const workersLen = navigator.hardwareConcurrency - 1

const workers = new Array(workersLen)

const sharedDone = new SharedArrayBuffer(workersLen)

const doneArray = new Uint8Array(sharedDone)

const dw = Math.ceil(width / workersLen)

const dTri = Math.ceil(trianglesLen / workersLen)

const screenBoundingBox = new Array(workersLen)
const triangleBatch = new Array(workersLen)

let done = 0

for (let i = 0; i < workersLen; i++) {
    const minX = i * dw
    const maxX = Math.min(minX + dw, width)

    screenBoundingBox[i] = { minX, maxX, minY: 0, maxY: height }

    const start = i * dTri
    const end = Math.min(trianglesLen, start + dTri)
    triangleBatch[i] = { start, end }

    workers[i] = new Worker("worker.js")
}

for (let i = 0; i < workersLen; i++) {
    workers[i].onmessage = () => {
        done++
    }
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
            sharedTriangles,
        })
    }

    for (const worker of workers) {
        worker.postMessage(0)
    }
}

// Função para desenhar o FPS no contexto2d
function renderFPS(fps) {
    const fpsText = `FPS: ${fps}`;

    ctx.fillText(fpsText, 10, 30);
}

let lastFrameTime = Date.now();

function render() {
    updatePos();

    if (done >= workersLen) {
        done = 0
        const currentTime = Date.now();
        const deltaTime = currentTime - lastFrameTime;

        if (deltaTime >= 1000) {
            lastFrameTime = currentTime;
            fps = frameCount;
            frameCount = 0;
        }
        frameCount++;
        frame.set(frameBuffer)
        ctx.putImageData(imageData, 0, 0)
        renderFPS(fps);

        // Processamento de matriz e transformações
        perspective(matrix, fov, aspectRatio, near, far);
        rotateX(matrix, angleX);
        rotateY(matrix, angleY);
        translate(matrix, cameraX, cameraY, cameraZ);

        for (const worker of workers) {
            worker.postMessage(0)
        }
    }

    requestAnimationFrame(render)
}

setup()

render()

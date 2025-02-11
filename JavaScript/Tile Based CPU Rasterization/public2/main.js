const fov = Math.PI / 3
const aspectRatio = HEIGHT / WIDTH
const near = 1
const far = 1000

let fps = 0, frameCount = 0

function setup() {
    for (let i = 0; i < workersLen; i++) {
        workers[i].postMessage({
            init: true,
            WIDTH,
            HEIGHT,
            sharedFrameBuffer,
            workerBox: workerBox[i],
            triangleBatch: workerTriangleBatch[i],
            sharedMatrix,
            sharedTriangleData,
            vertices,
            colors,
            triangles,
            sharedDone,
            workerIdx: i,
            trianglesLen
        })
    }

    for (const worker of workers) {
        worker.postMessage(0)
    }
}

function renderFPS(fps) {
    const fpsText = `FPS: ${fps}`;

    ctx.fillText(fpsText, 10, 30);
}

let lastFrameTime = Date.now();

function render() {
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
    renderFPS(fps)

    perspective(matrix, fov, aspectRatio, near, far)
    rotateX(matrix, angleX)
    rotateY(matrix, angleY)
    translate(matrix, cameraX, cameraY, cameraZ)

    for (const worker of workers) {
        worker.postMessage(0)
    }
}

function update() {
    updatePos()
    if (workDone >= workersLen) {
        workDone = 0
        render()
    }
    
    requestAnimationFrame(update)
}

setup()
update()
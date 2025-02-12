const fov = Math.PI / 3
const aspectRatio = HEIGHT / WIDTH
const near = 1
const far = 1000

gravity = -0.0005

function setup() {
    for (let i = 0; i < workersLen; i++) {
        workers[i].postMessage({
            init: true,
            WIDTH,
            HEIGHT,
            sharedFrameBuffer,
            workerBox: workerBox[i],
            sharedMatrix,
            sharedTriangleData,
            sharedVertices,
            sharedColors,
            sharedTriangles,
            sharedDone,
            workerIdx: i,
            trianglesLen
        })
    }

    for (const worker of workers) {
        worker.postMessage(trianglesLen)
    }
}

function render() {
    if (workDone < workersLen)
        return
    workDone = 0
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
    ctx.fillText(`FPS: ${fps}`, 10, 30);
    ctx.fillText(`Position: ${intCameraX}, ${intCameraY}, ${intCameraZ}`, 10, 60);
    ctx.fillText(`Chunk: ${chunkX}, ${chunkZ}`, 10, 90);
    ctx.beginPath();
    ctx.arc(CENTERX, CENTERY, 5, 0, PI2); // Desenha um círculo completo
    ctx.fill(); // Preenche o círculo

    perspective(matrix, fov, aspectRatio, near, far)
    rotateX(matrix, angleX)
    rotateY(matrix, angleY)
    translate(matrix, cameraX, cameraY, cameraZ)

    for (const worker of workers) {
        worker.postMessage(trianglesLen)
    }
}

function update() {
    updatePos()

    render()
    requestAnimationFrame(update)
}

setup()
update()

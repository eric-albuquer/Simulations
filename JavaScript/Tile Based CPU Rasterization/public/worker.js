let frameBuffer, zBuffer, vertices, colors, screenVertices, screenColors;
let trianglesBox, done, matrix, triangles;
let width, height, workerIdx, centerX, centerY;
let triangleBatch, boundingBox
let vIdx, startTidx, startScreenIdx
let tIdxArray, startIdxFragment, deltaHFrag
let canRender, doneRender
const floatToInt = 0x800000

const p0 = { x: 0, y: 0 }

const box = {
    minX: 0,
    maxX: width,
    minY: 0,
    maxY: height
}

class vec3 {
    constructor(x, y, z) {
        this.x = x
        this.y = y
        this.z = z
    }
}

class color {
    constructor(r, g, b) {
        this.r = r
        this.g = g
        this.b = b
    }
}

const vec = new vec3(0, 0, 0)
const v0 = new vec3(0, 0, 0)
const v1 = new vec3(0, 0, 0)
const v2 = new vec3(0, 0, 0)

const c0 = new color(0, 0, 0)
const c1 = new color(0, 0, 0)
const c2 = new color(0, 0, 0)

function max(a, b) {
    return a > b ? a : b
}

function min(a, b) {
    return a < b ? a : b
}

function dot(m, v) {
    const x = v.x
    const y = v.y
    const z = v.z

    v.x = m[0] * x + m[1] * y + m[2] * z + m[3]
    v.y = m[4] * x + m[5] * y + m[6] * z + m[7]
    v.z = m[8] * x + m[9] * y + m[10] * z + m[11]
    const w = m[12] * x + m[13] * y + m[14] * z + m[15]

    if (w !== 0) {
        const invW = 1 / w
        v.x *= invW
        v.y *= invW
        v.z *= invW
    }
}

function clearBuffers() {
    let idxRow = startScreenIdx
    let fIdxRow = startIdxFragment
    for (let y = boundingBox.minY; y < boundingBox.maxY; y++) {
        let idx = idxRow
        let fIdx = fIdxRow
        for (let x = boundingBox.minX; x < boundingBox.maxX; x++) {
            zBuffer[idx++] = floatToInt
            frameBuffer[fIdx++] = 0
            frameBuffer[fIdx++] = 0
            frameBuffer[fIdx++] = 0
            frameBuffer[fIdx++] = 0
        }
        idxRow += width
        fIdxRow += deltaHFrag
    }
}

function insideScreen(v) {
    return (
        v.x >= 0 && v.x < width &&
        v.y >= 0 && v.y < height &&
        v.z >= -floatToInt && v.z <= floatToInt
    )
}


function toScreen(v, centerX, centerY) {
    v.x = (v.x + 1) * centerX
    v.y = (v.y + 1) * centerY
    v.z *= floatToInt
}

function vertexShader() {
    done[workerIdx] = 0
    let idx = vIdx
    let tIdx = startTidx

    for (let i = triangleBatch.start; i < triangleBatch.end; i++) {
        let minX = width
        let maxX = 0
        let minY = height
        let maxY = 0

        for (let j = 0; j < 3; j++) {
            const i0 = triangles[idx++] * 3
            const i1 = i0 + 1
            const i2 = i1 + 1

            vec.x = vertices[i0]
            vec.y = vertices[i1]
            vec.z = vertices[i2]

            dot(matrix, vec)
            toScreen(vec, centerX, centerY)

            screenVertices[i0] = vec.x
            screenVertices[i1] = vec.y
            screenVertices[i2] = vec.z

            minX = min(vec.x, minX)
            maxX = max(vec.x, maxX)
            minY = min(vec.y, minY)
            maxY = max(vec.y, maxY)

            screenColors[i0] = colors[i0] * 255
            screenColors[i1] = colors[i1] * 255
            screenColors[i2] = colors[i2] * 255
        }
        trianglesBox[tIdx++] = max(0, minX)
        trianglesBox[tIdx++] = max(0, minY)
        trianglesBox[tIdx++] = min(width, maxX)
        trianglesBox[tIdx++] = min(height, maxY)
    }

    done[workerIdx] = 1
}

function intersect() {
    const x1 = max(boundingBox.minX, box.minX)
    const y1 = max(boundingBox.minY, box.minY)
    const x2 = min(boundingBox.maxX, box.maxX)
    const y2 = min(boundingBox.maxY, box.maxY)

    if (x1 < x2 && y1 < y2) {
        box.minX = x1
        box.minY = y1
        box.maxX = x2
        box.maxY = y2

        return true
    }

    return false
}

function isTopLeft(start, end) {
    const edge = { x: end.x - start.x, y: end.y - start.y }

    return (edge.y === 0 && edge.x > 0) || edge.y < 0
}

function cross2d(a, b, p) {
    const ab = { x: b.x - a.x, y: b.y - a.y }
    const ap = { x: p.x - a.x, y: p.y - a.y }

    return ab.x * ap.y - ab.y * ap.x
}

function rasterize() {
    const area = cross2d(v0, v1, v2)

    if (area < 0)
        return

    const invArea = 1 / area

    const dW0Col = v1.y - v2.y
    const dW1Col = v2.y - v0.y
    const dW2Col = v0.y - v1.y

    const dW0Row = v2.x - v1.x
    const dW1Row = v0.x - v2.x
    const dW2Row = v1.x - v0.x

    const bias0 = isTopLeft(v1, v2) ? 0 : -0.0001
    const bias1 = isTopLeft(v2, v0) ? 0 : -0.0001
    const bias2 = isTopLeft(v0, v1) ? 0 : -0.0001

    p0.x = box.minX + 0.5
    p0.y = box.minY + 0.5

    let w0Row = cross2d(v1, v2, p0) + bias0
    let w1Row = cross2d(v2, v0, p0) + bias1
    let w2Row = cross2d(v0, v1, p0) + bias2

    let idxRow = box.minY * width + box.minX

    for (let y = box.minY; y < box.maxY; y++) {
        let idx = idxRow
        let w0 = w0Row
        let w1 = w1Row
        let w2 = w2Row
        for (let x = box.minX; x < box.maxX; x++) {

            const isInside = w0 >= 0 && w1 >= 0 && w2 >= 0

            if (isInside) {
                const alpha = w0 * invArea
                const beta = w1 * invArea
                const gamma = 1 - alpha - beta

                const depth = alpha * v0.z + beta * v1.z + gamma * v2.z

                if (depth < zBuffer[idx]) {
                    zBuffer[idx] = depth

                    const r = alpha * c0.r + beta * c1.r + gamma * c2.r
                    const g = alpha * c0.g + beta * c1.g + gamma * c2.g
                    const b = alpha * c0.b + beta * c1.b + gamma * c2.b

                    let fIdx = idx << 2

                    frameBuffer[fIdx] = r
                    frameBuffer[++fIdx] = g
                    frameBuffer[++fIdx] = b
                    frameBuffer[++fIdx] = 255
                }
            }
            idx++
            w0 += dW0Col
            w1 += dW1Col
            w2 += dW2Col
        }
        idxRow += width
        w0Row += dW0Row
        w1Row += dW1Row
        w2Row += dW2Row
    }
}

function fragmentShader() {
    let idxRow = startIdxFragment

    for (let y = boundingBox.minY; y < boundingBox.maxY; y++) {
        let idx = idxRow
        for (let x = boundingBox.minX; x < boundingBox.maxX; x++) {
            const alpha = frameBuffer[idx + 3]
            if (alpha === 0) {
                const yH = (y / height)
                frameBuffer[idx] = (1 - yH) * 100 + 255 * yH
                frameBuffer[idx + 1] = (1 - yH) * 171 + 255 * yH
                frameBuffer[idx + 2] = (1 - yH) * 221 + 255 * yH
                frameBuffer[idx + 3] = 255
            }
            idx += 4
        }
        idxRow += deltaHFrag
    }
}

function render() {
    vertexShader()

    clearBuffers()

    let idxBox = 0

    let i = 0

    while (done.includes(0)) { }

    while (i < triangles.length) {
        const i0 = tIdxArray[i++]
        const i1 = tIdxArray[i++]
        const i2 = tIdxArray[i++]

        box.minX = trianglesBox[idxBox++];
        box.minY = trianglesBox[idxBox++];
        box.maxX = trianglesBox[idxBox++];
        box.maxY = trianglesBox[idxBox++];

        if (intersect()) {
            v0.x = screenVertices[i0]; v0.y = screenVertices[i0 + 1]; v0.z = screenVertices[i0 + 2];
            v1.x = screenVertices[i1]; v1.y = screenVertices[i1 + 1]; v1.z = screenVertices[i1 + 2];
            v2.x = screenVertices[i2]; v2.y = screenVertices[i2 + 1]; v2.z = screenVertices[i2 + 2];

            if (insideScreen(v0) || insideScreen(v1) || insideScreen(v2)) {
                c0.r = screenColors[i0]; c0.g = screenColors[i0 + 1]; c0.b = screenColors[i0 + 2];
                c1.r = screenColors[i1]; c1.g = screenColors[i1 + 1]; c1.b = screenColors[i1 + 2];
                c2.r = screenColors[i2]; c2.g = screenColors[i2 + 1]; c2.b = screenColors[i2 + 2];

                rasterize()
            }
        }
    }

    fragmentShader()
}

self.onmessage = (event) => {
    if (event.data.init) {
        frameBuffer = new Uint8ClampedArray(event.data.sharedFrameBuffer);
        zBuffer = new Int32Array(event.data.sharedZBuffer);
        vertices = new Float32Array(event.data.sharedVertices);
        colors = new Float32Array(event.data.sharedColors);
        screenVertices = new Int32Array(event.data.sharedScreenVertices);
        screenColors = new Uint8ClampedArray(event.data.sharedScreenColors);
        trianglesBox = new Uint32Array(event.data.sharedTrianglesBox);
        done = new Uint8Array(event.data.sharedDone);
        matrix = new Float32Array(event.data.sharedMatrix);
        triangles = new Uint32Array(event.data.sharedTriangles);
        width = event.data.width
        height = event.data.height
        workerIdx = event.data.workerIdx
        triangleBatch = event.data.triangleBatch
        boundingBox = event.data.boundingBox
        centerX = width >> 1
        centerY = height >> 1
        vIdx = 3 * triangleBatch.start
        startTidx = triangleBatch.start << 2
        deltaHFrag = width << 2
        startScreenIdx = boundingBox.minY * width + boundingBox.minX
        startIdxFragment = startScreenIdx << 2
        tIdxArray = new Uint32Array(triangles.length)
        for (let i = 0; i < triangles.length; i++) {
            tIdxArray[i] = triangles[i] * 3
        }
        return
    }

    render()
    self.postMessage(0)
}

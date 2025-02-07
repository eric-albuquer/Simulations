let frameBuffer, zBuffer, vertices, colors, screenVertices, screenColors;
let trianglesBox, done, matrix, triangles;
let width, height, workerIdx;
let triangleBatch, boundingBox

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

function insideScreen(v) {
    return (
        v.x >= 0 && v.x < width &&
        v.y >= 0 && v.y < height &&
        v.z >= -0x3fffffff && v.z <= 0x3fffffff
    )
}


function toScreen(v, centerX, centerY) {
    v.x = (v.x + 1) * centerX
    v.y = (v.y + 1) * centerY
    v.z *= 0x3fffffff
}

function vertexShader() {
    const start = triangleBatch.start
    const end = triangleBatch.end
    if (start < end) {
        const centerX = width >> 1
        const centerY = height >> 1

        let idx = 3 * start
        let tIdx = start << 2

        const w_1 = width - 1
        const h_1 = height - 1

        for (let i = start; i < end; i++) {
            let minX = w_1
            let maxX = 0
            let minY = h_1
            let maxY = 0

            for (let j = 0; j < 3; j++) {
                const i0 = triangles[idx++] * 3
                const i1 = i0 + 1
                const i2 = i1 + 1

                const vec = new vec3(vertices[i0], vertices[i1], vertices[i2])

                dot(matrix, vec)

                toScreen(vec, centerX, centerY)

                screenVertices[i0] = vec.x
                screenVertices[i1] = vec.y
                screenVertices[i2] = vec.z

                if (vec.x < minX)
                    minX = vec.x
                if (vec.x > maxX)
                    maxX = vec.x
                if (vec.y < minY)
                    minY = vec.y
                if (vec.y > maxY)
                    maxY = vec.y

                screenColors[i0] = colors[i0] * 255
                screenColors[i1] = colors[i1] * 255
                screenColors[i2] = colors[i2] * 255
            }
            trianglesBox[tIdx++] = Math.max(0, minX)
            trianglesBox[tIdx++] = Math.max(0, minY)
            trianglesBox[tIdx++] = Math.min(w_1, maxX)
            trianglesBox[tIdx++] = Math.min(h_1, maxY)
        }
    }

    done[workerIdx] = 1
    while (done.includes(0)) { }
}

function intersect(tri, box) {
    const x1 = Math.max(tri.minX, box.minX)
    const y1 = Math.max(tri.minY, box.minY)
    const x2 = Math.min(tri.maxX, box.maxX)
    const y2 = Math.min(tri.maxY, box.maxY)

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
    const ab = {x: b.x - a.x, y: b.y - a.y}
    const ap = {x: p.x - a.x, y: p.y - a.y}

    return ab.x * ap.y - ab.y * ap.x
}

function rasterize(v0, v1, v2, c0, c1, c2, box) {
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

    const p0 = { x: box.minX + 0.5, y: box.minY + 0.5 }

    let w0Row = cross2d(v1, v2, p0) + bias0
    let w1Row = cross2d(v2, v0, p0) + bias1
    let w2Row = cross2d(v0, v1, p0) + bias2

    let idxRow = box.minY * width + box.minX

    for (let y = box.minY; y <= box.maxY; y++) {
        let idx = idxRow
        let w0 = w0Row
        let w1 = w1Row
        let w2 = w2Row
        for (let x = box.minX; x <= box.maxX; x++) {

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
        triangles = new Uint16Array(event.data.sharedTriangles);
        width = event.data.width
        height = event.data.height
        workerIdx = event.data.workerIdx
        triangleBatch = event.data.triangleBatch
        boundingBox = event.data.boundingBox
        return;
    }

    vertexShader()

    let idxBox = 0

    for (let i = 0; i < triangles.length; i += 3) {
        const i0 = triangles[i] * 3
        const i1 = triangles[i + 1] * 3
        const i2 = triangles[i + 2] * 3

        const box = {
            minX: trianglesBox[idxBox++],
            minY: trianglesBox[idxBox++],
            maxX: trianglesBox[idxBox++],
            maxY: trianglesBox[idxBox++],
        }

        if (!intersect(boundingBox, box))
            continue

        const v0 = new vec3(screenVertices[i0], screenVertices[i0 + 1], screenVertices[i0 + 2])
        const v1 = new vec3(screenVertices[i1], screenVertices[i1 + 1], screenVertices[i1 + 2])
        const v2 = new vec3(screenVertices[i2], screenVertices[i2 + 1], screenVertices[i2 + 2])

        if (!insideScreen(v0) && !insideScreen(v1) && !insideScreen(v2))
            continue

        const c0 = new color(screenColors[i0], screenColors[i0 + 1], screenColors[i0 + 2])
        const c1 = new color(screenColors[i1], screenColors[i1 + 1], screenColors[i1 + 2])
        const c2 = new color(screenColors[i2], screenColors[i2 + 1], screenColors[i2 + 2])

        rasterize(v0, v1, v2, c0, c1, c2, box)
    }

    self.postMessage(true)
}
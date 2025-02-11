let WIDTH,
    HEIGHT,
    frameBuffer,
    workerBox,
    startBatch,
    endBatch,
    matrix,
    triangleData,
    vertices,
    triangles,
    colors,
    triangleIdxArray,
    centerX, centerY,
    localFrameBuffer,
    localZBuffer,
    workerWidth,
    workerHeight,
    deltaFrameIdx,
    deltaLocalFrameIdx,
    startIdxFrame,
    doneArray,
    workerIdx,
    startTriangleIdx,
    startTriangleDataIdx,
    trianglesLen

function vec3(x, y, z) {
    return { x, y, z }
}

function createBox(minX, minY, maxX, maxY) {
    return { minX, minY, maxX, maxY }
}

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
    localFrameBuffer.fill(0)
    localZBuffer.fill(Infinity)
}

function insideScreen(v) {
    return (
        v.x > -1 && v.x < 1 &&
        v.y > -1 && v.y < 1 &&
        v.z > -1 && v.z < 1
    )
}

function toScreen(v) {
    v.x = Math.floor((v.x + 1) * centerX)
    v.y = Math.floor((v.y + 1) * centerY)
}

function toLocal(box) {
    box.minX = box.minX - workerBox.minX
    box.minY = box.minY
    box.maxX = box.maxX - workerBox.minX
    box.maxY = box.maxY
}

function intersect(a, b) {
    const x1 = max(a.minX, b.minX)
    const y1 = max(a.minY, b.minY)
    const x2 = min(a.maxX, b.maxX)
    const y2 = min(a.maxY, b.maxY)

    if (x1 < x2 && y1 < y2) {
        b.minX = x1
        b.minY = y1
        b.maxX = x2
        b.maxY = y2

        return true
    }

    return false
}

function isTopLeft(start, end) {
    const edgeX = end.x - start.x
    const edgeY = end.y - start.y

    return (edgeY === 0 && edgeX > 0) || edgeY < 0
}

function cross2d(a, b, p) {
    const abx = b.x - a.x
    const aby = b.y - a.y
    const apx = p.x - a.x
    const apy = p.y - a.y

    return abx * apy - aby * apx
}

function vertexShader() {
    doneArray[workerIdx] = 0
    let triangleIdx = startTriangleIdx
    let triangleDataIdx = startTriangleDataIdx
    let minX, minY, maxX, maxY, v0Idx, visible, area
    let v = [vec3(0, 0, 0), vec3(0, 0, 0), vec3(0, 0, 0)]
    let c = [vec3(0, 0, 0), vec3(0, 0, 0), vec3(0, 0, 0)]
    for (let i = startBatch; i < endBatch; i++) {
        minX = WIDTH
        minY = HEIGHT
        maxX = 0
        maxY = 0
        visible = false
        for (let j = 0; j < 3; j++) {
            v0Idx = triangleIdxArray[triangleIdx++]

            v[j].x = vertices[v0Idx]
            v[j].y = vertices[v0Idx + 1]
            v[j].z = vertices[v0Idx + 2]

            c[j].x = colors[v0Idx] * 255
            c[j].y = colors[v0Idx + 1] * 255
            c[j].z = colors[v0Idx + 2] * 255

            dot(matrix, v[j])

            if (insideScreen(v[j]))
                visible = true

            toScreen(v[j])

            minX = min(v[j].x, minX)
            minY = min(v[j].y, minY)
            maxX = max(v[j].x, maxX)
            maxY = max(v[j].y, maxY)
        }
        area = cross2d(v[0], v[1], v[2])

        visible = visible && area > 0

        triangleData.setUint8(triangleDataIdx, visible, true)

        if (visible) {
            triangleData.setInt16(triangleDataIdx + 1, minX, true)
            triangleData.setInt16(triangleDataIdx + 3, minY, true)
            triangleData.setInt16(triangleDataIdx + 5, maxX, true)
            triangleData.setInt16(triangleDataIdx + 7, maxY, true)

            triangleData.setInt32(triangleDataIdx + 9, v[0].x, true)
            triangleData.setInt32(triangleDataIdx + 13, v[0].y, true)
            triangleData.setFloat32(triangleDataIdx + 17, v[0].z, true)

            triangleData.setInt32(triangleDataIdx + 21, v[1].x, true)
            triangleData.setInt32(triangleDataIdx + 25, v[1].y, true)
            triangleData.setFloat32(triangleDataIdx + 29, v[1].z, true)

            triangleData.setInt32(triangleDataIdx + 33, v[2].x, true)
            triangleData.setInt32(triangleDataIdx + 37, v[2].y, true)
            triangleData.setFloat32(triangleDataIdx + 41, v[2].z, true)

            triangleData.setUint8(triangleDataIdx + 45, c[0].x, true)
            triangleData.setUint8(triangleDataIdx + 46, c[0].y, true)
            triangleData.setUint8(triangleDataIdx + 47, c[0].z, true)

            triangleData.setUint8(triangleDataIdx + 48, c[1].x, true)
            triangleData.setUint8(triangleDataIdx + 49, c[1].y, true)
            triangleData.setUint8(triangleDataIdx + 50, c[1].z, true)

            triangleData.setUint8(triangleDataIdx + 51, c[2].x, true)
            triangleData.setUint8(triangleDataIdx + 52, c[2].y, true)
            triangleData.setUint8(triangleDataIdx + 53, c[2].z, true)

            triangleData.setFloat32(triangleDataIdx + 54, 1 / area, true)

            triangleData.setFloat32(triangleDataIdx + 58, v[1].y - v[2].y, true)
            triangleData.setFloat32(triangleDataIdx + 62, v[2].y - v[0].y, true)
            triangleData.setFloat32(triangleDataIdx + 66, v[0].y - v[1].y, true)

            triangleData.setFloat32(triangleDataIdx + 70, v[2].x - v[1].x, true)
            triangleData.setFloat32(triangleDataIdx + 74, v[0].x - v[2].x, true)
            triangleData.setFloat32(triangleDataIdx + 78, v[1].x - v[0].x, true)

            triangleData.setFloat32(triangleDataIdx + 82, isTopLeft(v[1], v[2]) ? 0 : -0.0001, true)
            triangleData.setFloat32(triangleDataIdx + 86, isTopLeft(v[2], v[0]) ? 0 : -0.0001, true)
            triangleData.setFloat32(triangleDataIdx + 90, isTopLeft(v[0], v[1]) ? 0 : -0.0001, true)
        }

        triangleDataIdx += 94
    }

    doneArray[workerIdx] = 1
}

function rasterize(v0, v1, v2, c0, c1, c2, invArea, dW0Col, dW1Col, dW2Col, dW0Row, dW1Row, dW2Row, bias0, bias1, bias2, box, p0) {
    let w0Row = cross2d(v1, v2, p0) + bias0
    let w1Row = cross2d(v2, v0, p0) + bias1
    let w2Row = cross2d(v0, v1, p0) + bias2

    let idxRow = box.minY * workerWidth + box.minX

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

                if (depth < localZBuffer[idx]) {
                    localZBuffer[idx] = depth

                    const r = alpha * c0.x + beta * c1.x + gamma * c2.x
                    const g = alpha * c0.y + beta * c1.y + gamma * c2.y
                    const b = alpha * c0.z + beta * c1.z + gamma * c2.z

                    let fIdx = idx << 2

                    localFrameBuffer[fIdx] = r
                    localFrameBuffer[++fIdx] = g
                    localFrameBuffer[++fIdx] = b
                    localFrameBuffer[++fIdx] = 255
                }
            }
            idx++
            w0 += dW0Col
            w1 += dW1Col
            w2 += dW2Col
        }
        idxRow += workerWidth
        w0Row += dW0Row
        w1Row += dW1Row
        w2Row += dW2Row
    }
}

function fragmentShader() {
    let idxRow = startIdxFrame
    let localIdxRow = 0
    let idx, localIdx, alpha

    for (let y = 0; y < HEIGHT; y++) {
        idx = idxRow
        localIdx = localIdxRow
        for (let x = 0; x < workerWidth; x++) {
            alpha = localFrameBuffer[localIdx + 3]
            if (!alpha) {
                const yH = (y / HEIGHT)
                frameBuffer[idx] = (1 - yH) * 100 + 255 * yH
                frameBuffer[idx + 1] = (1 - yH) * 171 + 255 * yH
                frameBuffer[idx + 2] = (1 - yH) * 221 + 255 * yH
                frameBuffer[idx + 3] = 255
            } else {
                frameBuffer[idx] = localFrameBuffer[localIdx]
                frameBuffer[idx + 1] = localFrameBuffer[localIdx + 1]
                frameBuffer[idx + 2] = localFrameBuffer[localIdx + 2]
                frameBuffer[idx + 3] = localFrameBuffer[localIdx + 3]
            }
            idx += 4
            localIdx += 4
        }
        idxRow += deltaFrameIdx
        localIdxRow += deltaLocalFrameIdx
    }
}

function render() {
    vertexShader()

    clearBuffers()

    let box = createBox(0, 0, 0, 0), v0 = vec3(0, 0, 0), v1 = vec3(0, 0, 0), v2 = vec3(0, 0, 0), c0 = vec3(0, 0, 0), c1 = vec3(0, 0, 0), c2 = vec3(0, 0, 0), invArea,
        dW0Col, dW1Col, dW2Col, dW0Row, dW1Row, dW2Row, bias0, bias1, bias2, p0 = { x: 0, y: 0 }, localIdx = 0

    while (doneArray.includes(0)) { }

    for (let i = 0; i < trianglesLen; i++) {
        if (triangleData.getUint8(localIdx, true)) {

            box.minX = triangleData.getInt16(localIdx + 1, true); box.minY = triangleData.getInt16(localIdx + 3, true)
            box.maxX = triangleData.getInt16(localIdx + 5, true); box.maxY = triangleData.getInt16(localIdx + 7, true)

            if (intersect(workerBox, box)) {

                v0.x = triangleData.getInt32(localIdx + 9, true); v0.y = triangleData.getInt32(localIdx + 13, true); v0.z = triangleData.getFloat32(localIdx + 17, true)
                v1.x = triangleData.getInt32(localIdx + 21, true); v1.y = triangleData.getInt32(localIdx + 25, true); v1.z = triangleData.getFloat32(localIdx + 29, true)
                v2.x = triangleData.getInt32(localIdx + 33, true); v2.y = triangleData.getInt32(localIdx + 37, true); v2.z = triangleData.getFloat32(localIdx + 41, true)

                c0.x = triangleData.getUint8(localIdx + 45, true); c0.y = triangleData.getUint8(localIdx + 46, true); c0.z = triangleData.getUint8(localIdx + 47, true)
                c1.x = triangleData.getUint8(localIdx + 48, true); c1.y = triangleData.getUint8(localIdx + 49, true); c1.z = triangleData.getUint8(localIdx + 50, true)
                c2.x = triangleData.getUint8(localIdx + 51, true); c2.y = triangleData.getUint8(localIdx + 52, true); c2.z = triangleData.getUint8(localIdx + 53, true)

                invArea = triangleData.getFloat32(localIdx + 54, true)

                dW0Col = triangleData.getFloat32(localIdx + 58, true); dW1Col = triangleData.getFloat32(localIdx + 62, true); dW2Col = triangleData.getFloat32(localIdx + 66, true)
                dW0Row = triangleData.getFloat32(localIdx + 70, true); dW1Row = triangleData.getFloat32(localIdx + 74, true); dW2Row = triangleData.getFloat32(localIdx + 78, true)

                bias0 = triangleData.getFloat32(localIdx + 82, true); bias1 = triangleData.getFloat32(localIdx + 86, true); bias2 = triangleData.getFloat32(localIdx + 90, true);

                p0.x = box.minX + 0.5
                p0.y = box.minY + 0.5

                toLocal(box)

                rasterize(v0, v1, v2, c0, c1, c2, invArea, dW0Col, dW1Col, dW2Col, dW0Row, dW1Row, dW2Row, bias0, bias1, bias2, box, p0)
            }
        }
        localIdx += 94
    }

    fragmentShader()
}

self.onmessage = (event) => {
    if (event.data.init) {
        WIDTH = event.data.WIDTH
        HEIGHT = event.data.HEIGHT
        workerBox = event.data.workerBox
        startBatch = event.data.triangleBatch.start
        endBatch = event.data.triangleBatch.end
        frameBuffer = new Uint8ClampedArray(event.data.sharedFrameBuffer)
        matrix = new Float32Array(event.data.sharedMatrix)
        triangleData = new DataView(event.data.sharedTriangleData)
        vertices = event.data.vertices
        colors = event.data.colors
        triangles = event.data.triangles
        triangleIdxArray = new Uint32Array(triangles.length)
        centerX = WIDTH / 2
        centerY = HEIGHT / 2
        workerHeight = workerBox.maxY - workerBox.minY
        workerWidth = workerBox.maxX - workerBox.minX
        localFrameBuffer = new Uint8ClampedArray(workerHeight * workerWidth * 4)
        localZBuffer = new Float32Array(workerHeight * workerWidth)
        deltaFrameIdx = WIDTH * 4
        deltaLocalFrameIdx = workerWidth * 4
        startIdxFrame = workerBox.minX << 2
        doneArray = new Uint8Array(event.data.sharedDone)
        workerIdx = event.data.workerIdx
        startTriangleIdx = startBatch * 3
        startTriangleDataIdx = startBatch * 94
        trianglesLen = event.data.trianglesLen

        for (let i = 0; i < triangles.length; i++) {
            triangleIdxArray[i] = triangles[i] * 3
        }
        return
    }

    render()
    self.postMessage(0)
}

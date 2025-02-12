let gravity = -0.0005

let ySpeed = 0
let xSpeed = 0
let zSpeed = 0

let fps = 0, frameCount = 0
let intCameraX
let intCameraZ
let intCameraY
let chunkX
let chunkZ

function toKey(a, b) {
    return `${a},${b}`
}

function rayCast(sinY, cosY, maxDist = 6) {
    const cosX = Math.cos(angleX)

    const dx = -sinY * cosX
    const dy = Math.sin(angleX)
    const dz = cosY * cosX

    let x = -cameraX, y = -cameraY, z = -cameraZ

    let lnx, lny, lnz, lBlock

    for (let i = 0; i <= maxDist; i++) {
        x += dx
        y += dy
        z += dz
        let nx = Math.floor(x)
        let ny = Math.floor(y)
        let nz = Math.floor(z)

        let chunkX = nx >> 4
        let chunkZ = nz >> 4

        const key = toKey(chunkX, chunkZ)
        if (chunks.has(key) && ny >= 0 && ny < 256) {
            const block = chunks.get(key)[Math.abs(nx) % 16][ny][Math.abs(nz % 16)]
            if (block && mouse1) {
                const tIdx = block >> 1
                const tOffset = tIdx * 3
                triangles.set(new Array(36).fill(0), tOffset)
                chunks.get(key)[Math.abs(nx) % 16][ny][Math.abs(nz % 16)] = 0
                mouse1 = false
                break
            } else if (block && (lBlock === 0) && mouse2) {
                createCube(lnx, lny, lnz)
                mouse2 = false
                break
            }
            lBlock = block
        } else {
            continue
        }
        lnx = nx
        lny = ny
        lnz = nz
    }
}

function getBlock(chunkKey, x, y, z) {
    return chunks.get(chunkKey)[Math.abs(x % 16)][y][Math.abs(z % 16)]
}

function updatePos() {
    const sinY = Math.sin(angleY)
    const cosY = Math.cos(angleY)
    const psin = playerVelocity * sinY
    const pcos = playerVelocity * cosY

    zSpeed *= 0.95
    xSpeed *= 0.95

    if (keyboardKeys["w"]) {
        xSpeed += psin
        zSpeed -= pcos
    }
    if (keyboardKeys["s"]) {
        xSpeed -= psin
        zSpeed += pcos
    }
    if (keyboardKeys["a"]) {
        xSpeed += pcos
        zSpeed += psin
    }
    if (keyboardKeys["d"]) {
        xSpeed -= pcos
        zSpeed -= psin
    }
    if (keyboardKeys["Shift"]) {
        ySpeed = -jumpForce * 2
    }
    if (keyboardKeys[" "]) {
        ySpeed = jumpForce
    }

    ySpeed += gravity

    intCameraX = Math.floor(-cameraX)
    intCameraZ = Math.floor(-cameraZ)
    intCameraY = Math.floor(-cameraY)
    chunkX = intCameraX >> 4
    chunkZ = intCameraZ >> 4

    const key = toKey(chunkX, chunkZ)
    const northKey = toKey(chunkX, (intCameraZ + 1) >> 4)
    const southKey = toKey(chunkX, (intCameraZ - 1) >> 4)
    const eastKey = toKey((intCameraX + 1) >> 4, chunkZ)
    const westKey = toKey((intCameraX - 1) >> 4, chunkZ)

    if (chunks.has(key)) {
        if (intCameraY >= -2 && intCameraY < 254 && chunks.get(key)[Math.abs(intCameraX % 16)][intCameraY + 2][Math.abs(intCameraZ % 16)]) {
            ySpeed = ySpeed > 0 ? ySpeed : 0
        }
        if (intCameraY >= 1 && intCameraY < 257 && chunks.get(key)[Math.abs(intCameraX % 16)][intCameraY - 1][Math.abs(intCameraZ % 16)]) {
            ySpeed = ySpeed < 0 ? ySpeed : 0
        }
    }

    if (intCameraY >= 0 && intCameraY < 256) {
        if (chunks.has(northKey)) {
            if (getBlock(northKey, intCameraX, intCameraY, intCameraZ + 1) || getBlock(northKey, intCameraX, intCameraY + 1, intCameraZ + 1)) {
                zSpeed = zSpeed > 0 ? zSpeed : 0
            }
        }
        if (chunks.has(southKey)) {
            if (getBlock(southKey, intCameraX, intCameraY, intCameraZ - 1) || getBlock(southKey, intCameraX, intCameraY + 1, intCameraZ - 1)) {
                zSpeed = zSpeed < 0 ? zSpeed : 0
            }
        }
        if (chunks.has(eastKey)) {
            if (getBlock(eastKey, intCameraX + 1, intCameraY, intCameraZ) || getBlock(eastKey, intCameraX + 1, intCameraY + 1, intCameraZ)) {
                xSpeed = xSpeed > 0 ? xSpeed : 0
            }
        }
        if (chunks.has(westKey)) {
            if (getBlock(westKey, intCameraX - 1, intCameraY, intCameraZ) || getBlock(westKey, intCameraX - 1, intCameraY + 1, intCameraZ)) {
                xSpeed = xSpeed < 0 ? xSpeed : 0
            }
        }
    }

    cameraY += ySpeed
    cameraX += xSpeed
    cameraZ += zSpeed

    rayCast(sinY, cosY, 5)
}
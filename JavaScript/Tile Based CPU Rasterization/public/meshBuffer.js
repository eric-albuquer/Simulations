let trianglesLen = 0
const maxTriangleCapacity = 500_000

let verticesOffset = 0
let colorsOffset = 0
let trianglesOffset = 0

const sharedTriangles = new SharedArrayBuffer(maxTriangleCapacity * 3 * 4)
const sharedVertices = new SharedArrayBuffer(maxTriangleCapacity * 9 * 4)
const sharedColors = new SharedArrayBuffer(maxTriangleCapacity * 9 * 4)
const triangles = new Uint32Array(sharedTriangles)
const vertices = new Float32Array(sharedVertices)
const colors = new Float32Array(sharedColors)

function chunkMatrix() {
    return Array.from({ length: 16 }, () => Array.from({ length: 256 }, () => new Uint32Array(16).fill(0)))
}

const chunks = new Map()

function createCube(x, y, z) {
    const startX = Math.floor(x / 16), startZ = Math.floor(z / 16)
    const chunkKey = `${startX},${startZ}`

    if (!chunks.has(chunkKey)) {
        chunks.set(chunkKey, chunkMatrix())
    }
    chunks.get(chunkKey)[Math.abs(x) % 16][y][Math.abs(z) % 16] = 1 | (trianglesLen << 1)

    vertices.set(
        //Frente
        [x, y, z + 1,
        x, y + 1, z + 1,
        x + 1, y, z + 1,
        x + 1, y + 1, z + 1,

        //Trás
        x, y, z,
        x, y + 1, z,
        x + 1, y, z,
        x + 1, y + 1, z,

        //Esquerda
        x, y, z,
        x, y, z + 1,
        x, y + 1, z,
        x, y + 1, z + 1,

        //Direita
        x + 1, y, z,
        x + 1, y, z + 1,
        x + 1, y + 1, z,
        x + 1, y + 1, z + 1,

        //Cima
        x, y + 1, z,
        x, y + 1, z + 1,
        x + 1, y + 1, z,
        x + 1, y + 1, z + 1,

        //Baixo
        x, y, z,
        x, y, z + 1,
        x + 1, y, z,
        x + 1, y, z + 1]
    , verticesOffset)

    verticesOffset += 72

    colors.set(
        //Frente
        [0, 0, 1,
        0, 1, 1,
        1, 0, 1,
        1, 1, 1,

        //Trás
        0, 0, 0,
        0, 1, 0,
        1, 0, 0,
        1, 1, 0,

        //Esquerda
        0, 0, 0,
        0, 0, 1,
        0, 1, 0,
        0, 1, 1,

        //Direita
        1, 0, 0,
        1, 0, 1,
        1, 1, 0,
        1, 1, 1,

        //Cima
        0, 1, 0,
        0, 1, 1,
        1, 1, 0,
        1, 1, 1,

        //Baixo
        0, 0, 0,
        0, 0, 1,
        1, 0, 0,
        1, 0, 1]
    , colorsOffset)

    colorsOffset += 72

    let idx = trianglesLen << 1

    triangles.set(
        //Frente
        [idx + 0, idx + 1, idx + 2,
        idx + 1, idx + 3, idx + 2,

        //Trás
        idx + 4, idx + 6, idx + 5,
        idx + 5, idx + 6, idx + 7,

        //Esquerda
        idx + 8, idx + 10, idx + 9,
        idx + 9, idx + 10, idx + 11,

        //Direita
        idx + 12, idx + 13, idx + 14,
        idx + 13, idx + 15, idx + 14,

        //Cima
        idx + 16, idx + 18, idx + 17,
        idx + 17, idx + 18, idx + 19,

        //Baixo
        idx + 20, idx + 21, idx + 22,
        idx + 21, idx + 23, idx + 22]
    , trianglesOffset)

    trianglesOffset += 36

    trianglesLen += 12
}

for (let i = 0; i < 20; i++) {
    for (let j = 0; j < 20; j++) {
        for (let k = 0; k < 20; k++) {
            if (i === 0 || i === 19 || j === 0 || j === 19 || k === 19)
                createCube(i, k, j)
        }
    }
}


const meshVertices = [

]

const meshColors = [

]

const meshTriangles = [

]

function createCube(x, y, z) {
    meshVertices.push(
        //Frente
        x, y, z + 1,
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
        x + 1, y, z + 1
    )

    meshColors.push(
        //Frente
        0, 0, 1,
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
        1, 0, 1,
    )

    let idx = (meshTriangles.length << 1) / 3

    meshTriangles.push(
        //Frente
        idx + 0, idx + 1, idx + 2,
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
        idx + 21, idx + 23, idx + 22
    )
}

for (let i = 0; i < 20; i++) {
    for (let j = 0; j < 20; j++) {
        for (let k = 0; k < 20; k++) {
            if (i === 0 || i === 19 || j === 0 || j === 19 || k === 19)
            createCube(i, k, j)
        }
    }
}

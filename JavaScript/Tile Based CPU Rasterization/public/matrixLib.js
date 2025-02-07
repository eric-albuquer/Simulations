function identidy(m){
    m[0] = m[5] = m[10] = m[15] = 1
    m[1] = m[2] = m[3] = m[4] = m[6] = m[7] = m[8] = m[9] = m[11] = m[12] = m[13] = m[14] = 0
}

function perspective(matrix, fov, aspectRatio, zNear, zFar) {
    const invTanHF = 1 / Math.tan(fov / 2)
    const invFN = 1 / (zFar - zNear)

    matrix[0] = invTanHF / aspectRatio
    matrix[1] = 0
    matrix[2] = 0
    matrix[3] = 0
    matrix[4] = 0
    matrix[5] = invTanHF
    matrix[6] = 0
    matrix[7] = 0
    matrix[8] = 0
    matrix[9] = 0
    matrix[10] = zFar * invFN
    matrix[11] = (-zFar * zNear) * invFN
    matrix[12] = 0
    matrix[13] = 0
    matrix[14] = 1
    matrix[15] = 0
}

function rotateX(matrix, theta) {
    const sinTheta = Math.sin(theta)
    const cosTheta = Math.cos(theta)

    const b = matrix[1]
    const c = matrix[2]
    const f = matrix[5]
    const g = matrix[6]
    const j = matrix[9]
    const k = matrix[10]
    const n = matrix[13]
    const o = matrix[14]

    matrix[1] = b * cosTheta + c * sinTheta
    matrix[2] = - b * sinTheta + c * cosTheta
    matrix[5] = f * cosTheta + g * sinTheta
    matrix[6] = - f * sinTheta + g * cosTheta
    matrix[9] = j * cosTheta + k * sinTheta
    matrix[10] = - j * sinTheta + k * cosTheta
    matrix[13] = n * cosTheta + o * sinTheta
    matrix[14] = - n * sinTheta + o * cosTheta
}

function rotateY(matrix, theta) {
    const sinTheta = Math.sin(theta)
    const cosTheta = Math.cos(theta)

    const a = matrix[0]
    const c = matrix[2]
    const e = matrix[4]
    const g = matrix[6]
    const i = matrix[8]
    const k = matrix[10]
    const m = matrix[12]
    const o = matrix[14]

    matrix[0] = a * cosTheta - c * sinTheta
    matrix[2] = a * sinTheta + c * cosTheta
    matrix[4] = e * cosTheta - g * sinTheta
    matrix[6] = e * sinTheta + g * cosTheta
    matrix[8] = i * cosTheta - k * sinTheta
    matrix[10] = i * sinTheta + k * cosTheta
    matrix[12] = m * cosTheta - o * sinTheta
    matrix[14] = m * sinTheta + o * cosTheta
}

function translate(matrix, x, y, z) {
    matrix[3] += matrix[0] * x + matrix[1] * y + matrix[2] * z
    matrix[7] += matrix[4] * x + matrix[5] * y + matrix[6] * z
    matrix[11] += matrix[8] * x + matrix[9] * y + matrix[10] * z
    matrix[15] += matrix[12] * x + matrix[13] * y + matrix[14] * z
}
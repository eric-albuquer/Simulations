#include "mat4.h"
#include <math.h>

Mat4 createMat4(){
    return (Mat4){{
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1,
    }};
}

void Identidy(float m[16]){
    m[0] = m[5] = m[10] = m[15] = 1;
    m[1] = m[2] = m[3] = m[4] = m[6] = m[7] = m[8] = m[9] = m[11] = m[12] = m[13] = m[14] = 0;
}

void Perspective(float m[16], float fov, float aspect, float zNear, float zFar) {
    float f = 1.0f / tanf(fov * 0.5f);
    float rangeInv = 1.0f / (zFar - zNear);

    m[ 0] = f / aspect;
    m[ 1] = 0.0f;
    m[ 2] = 0.0f;
    m[ 3] = 0.0f;

    m[ 4] = 0.0f;
    m[ 5] = f;
    m[ 6] = 0.0f;
    m[ 7] = 0.0f;

    m[ 8]  = 0.0f;
    m[ 9]  = 0.0f;
    m[10] = (zFar + zNear) * rangeInv;
    m[11] = -1.0f;

    m[12] = 0.0f;
    m[13] = 0.0f;
    m[14] = 2.0f * zFar * zNear * rangeInv;
    m[15] = 0.0f;
}

void Translate(float m[16], float x, float y, float z) {
    m[12] += m[0] * x + m[4] * y + m[8]  * z;
    m[13] += m[1] * x + m[5] * y + m[9]  * z;
    m[14] += m[2] * x + m[6] * y + m[10] * z;
    m[15] += m[3] * x + m[7] * y + m[11] * z;
}

void RotateX(float m[16], float theta) {
    float c = cosf(theta);
    float s = sinf(theta);

    for (int i = 0; i < 4; ++i) {
        float y = m[4 + i]; // linha 1
        float z = m[8 + i]; // linha 2

        m[4 + i] = y * c + z * s;
        m[8 + i] = -y * s + z * c;
    }
}

void RotateY(float m[16], float theta) {
    float c = cosf(theta);
    float s = sinf(theta);

    for (int i = 0; i < 4; ++i) {
        float x = m[0 + i];
        float z = m[8 + i];

        m[0 + i] = x * c - z * s;
        m[8 + i] = x * s + z * c;
    }
}

void RotateZ(float m[16], float theta) {
    float c = cosf(theta);
    float s = sinf(theta);

    for (int i = 0; i < 4; ++i) {
        float x = m[0 + i];
        float y = m[4 + i];

        m[0 + i] = x * c + y * s;
        m[4 + i] = -x * s + y * c;
    }
}

static int invert4x4(const float m[16], float invOut[16]) {
    float inv[16];
    float det;

    inv[0]  =   m[5]*m[10]*m[15] - m[5]*m[11]*m[14] - m[9]*m[6]*m[15]
              + m[9]*m[7]*m[14] + m[13]*m[6]*m[11] - m[13]*m[7]*m[10];

    inv[4]  =  -m[4]*m[10]*m[15] + m[4]*m[11]*m[14] + m[8]*m[6]*m[15]
              - m[8]*m[7]*m[14] - m[12]*m[6]*m[11] + m[12]*m[7]*m[10];

    inv[8]  =   m[4]*m[9]*m[15]  - m[4]*m[11]*m[13] - m[8]*m[5]*m[15]
              + m[8]*m[7]*m[13] + m[12]*m[5]*m[11] - m[12]*m[7]*m[9];

    inv[12] =  -m[4]*m[9]*m[14]  + m[4]*m[10]*m[13] + m[8]*m[5]*m[14]
              - m[8]*m[6]*m[13] - m[12]*m[5]*m[10] + m[12]*m[6]*m[9];

    inv[1]  =  -m[1]*m[10]*m[15] + m[1]*m[11]*m[14] + m[9]*m[2]*m[15]
              - m[9]*m[3]*m[14] - m[13]*m[2]*m[11] + m[13]*m[3]*m[10];

    inv[5]  =   m[0]*m[10]*m[15] - m[0]*m[11]*m[14] - m[8]*m[2]*m[15]
              + m[8]*m[3]*m[14] + m[12]*m[2]*m[11] - m[12]*m[3]*m[10];

    inv[9]  =  -m[0]*m[9]*m[15]  + m[0]*m[11]*m[13] + m[8]*m[1]*m[15]
              - m[8]*m[3]*m[13] - m[12]*m[1]*m[11] + m[12]*m[3]*m[9];

    inv[13] =   m[0]*m[9]*m[14]  - m[0]*m[10]*m[13] - m[8]*m[1]*m[14]
              + m[8]*m[2]*m[13] + m[12]*m[1]*m[10] - m[12]*m[2]*m[9];

    inv[2]  =   m[1]*m[6]*m[15]  - m[1]*m[7]*m[14] - m[5]*m[2]*m[15]
              + m[5]*m[3]*m[14] + m[13]*m[2]*m[7]  - m[13]*m[3]*m[6];

    inv[6]  =  -m[0]*m[6]*m[15]  + m[0]*m[7]*m[14] + m[4]*m[2]*m[15]
              - m[4]*m[3]*m[14] - m[12]*m[2]*m[7]  + m[12]*m[3]*m[6];

    inv[10] =   m[0]*m[5]*m[15]  - m[0]*m[7]*m[13] - m[4]*m[1]*m[15]
              + m[4]*m[3]*m[13] + m[12]*m[1]*m[7]  - m[12]*m[3]*m[5];

    inv[14] =  -m[0]*m[5]*m[14]  + m[0]*m[6]*m[13] + m[4]*m[1]*m[14]
              - m[4]*m[2]*m[13] - m[12]*m[1]*m[6]  + m[12]*m[2]*m[5];

    inv[3]  =  -m[1]*m[6]*m[11]  + m[1]*m[7]*m[10] + m[5]*m[2]*m[11]
              - m[5]*m[3]*m[10] - m[9]*m[2]*m[7]   + m[9]*m[3]*m[6];

    inv[7]  =   m[0]*m[6]*m[11]  - m[0]*m[7]*m[10] - m[4]*m[2]*m[11]
              + m[4]*m[3]*m[10] + m[8]*m[2]*m[7]   - m[8]*m[3]*m[6];

    inv[11] =  -m[0]*m[5]*m[11]  + m[0]*m[7]*m[9]  + m[4]*m[1]*m[11]
              - m[4]*m[3]*m[9]  - m[8]*m[1]*m[7]   + m[8]*m[3]*m[5];

    inv[15] =   m[0]*m[5]*m[10]  - m[0]*m[6]*m[9]  - m[4]*m[1]*m[10]
              + m[4]*m[2]*m[9]  + m[8]*m[1]*m[6]   - m[8]*m[2]*m[5];

    det = m[0]*inv[0] + m[1]*inv[4] + m[2]*inv[8] + m[3]*inv[12];

    if (fabsf(det) < 1e-6f)
        return 0; // matriz não invertível

    float invDet = 1.0f / det;
    for (int i = 0; i < 16; i++)
        invOut[i] = inv[i] * invDet;

    return 1;
}

void invertAndTranspose4x4(float *out, const float *matrix) {
    float inv[16];
    if (!invert4x4(matrix, inv)) {
        // caso não seja invertível, usa identidade como fallback
        for (int i = 0; i < 16; i++)
            out[i] = (i % 5 == 0) ? 1.0f : 0.0f;
        return;
    }

    // Transpõe a matriz invertida
    for (int row = 0; row < 4; row++)
        for (int col = 0; col < 4; col++)
            out[col * 4 + row] = inv[row * 4 + col];
}

void vec3Transform(const float* matrix, const vec3* vIn, vec3* vOut){
    float x = vIn->x, y = vIn->y, z = vIn->z;

    // Produto matriz (column-major) * vetor coluna (x, y, z, 1)
    float tx = x * matrix[0] + y * matrix[4] + z * matrix[8]  + matrix[12];
    float ty = x * matrix[1] + y * matrix[5] + z * matrix[9]  + matrix[13];
    float tz = x * matrix[2] + y * matrix[6] + z * matrix[10] + matrix[14];
    float tw = x * matrix[3] + y * matrix[7] + z * matrix[11] + matrix[15];

    if (tw) {
        float invW = 1.0f / tw;
        tx *= invW;
        ty *= invW;
        tz *= invW;
    }

    vOut->x = tx;
    vOut->y = ty;
    vOut->z = tz;
}

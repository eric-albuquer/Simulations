#include "vertex.h"
#include "mat4.h"

Vertex createVertex(vec3 vec, vec3 color){
    return (Vertex){
        vec, color
    };
}

void transformVertex(const float *restrict matrix, const Vertex *restrict v, TransformedVertex *restrict vT) {
    float x = v->vec.x, y = v->vec.y, z = v->vec.z;

    // Produto matriz (column-major) * vetor coluna (x, y, z, 1)
    float tx = x * matrix[0] + y * matrix[4] + z * matrix[8]  + matrix[12];
    float ty = x * matrix[1] + y * matrix[5] + z * matrix[9]  + matrix[13];
    float tz = x * matrix[2] + y * matrix[6] + z * matrix[10] + matrix[14];
    float tw = x * matrix[3] + y * matrix[7] + z * matrix[11] + matrix[15];

    vT->vec.w = tw;

    if (tw) {
        float invW = 1.0f / tw;
        tx *= invW;
        ty *= invW;
        tz *= invW;
    }

    vT->vec.x = tx;
    vT->vec.y = ty;
    vT->vec.z = tz;
}
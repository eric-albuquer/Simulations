#include "utils.h"
#include "float.h"
#include <math.h>

int imin(int a, int b){
    return a < b ? a : b;
}

int imax(int a, int b){
    return a > b ? a : b;
}

BoundingBox2D getIntersectionBox(BoundingBox2D * restrict boxA, BoundingBox2D * restrict boxB){
    return (BoundingBox2D){
        imax(boxB->minX, boxA->minX),
        imax(boxB->minY, boxA->minY),
        imin(boxB->maxX, boxA->maxX),
        imin(boxB->maxY, boxA->maxY),
    };
}

float cross2D(const vec4 * restrict a, const vec4 * restrict b, const vec4 * restrict p){
    vec2 ab = {b->x - a->x, b->y - a->y};
    vec2 ap = {p->x - a->x, p->y - a->y};

    return ab.x * ap.y - ab.y * ap.x;
}

int isTopLeft(const vec4* restrict start, const vec4* restrict end){
    vec2 edge = {end->x - start->x, end->y - start->y};

    int isTopEdge = edge.y == 0 && edge.x > 0;
    int isLeftEdge = edge.y < 0;

    return isTopEdge || isLeftEdge;
}

vec3 vec3Sub(vec3 a, vec3 b){
    return (vec3){
        a.x - b.x,
        a.y - b.y,
        a.z - b.z
    };
}

vec3 cross(const vec3 a, const vec3 b) {
    return (vec3){
        .x = a.y * b.z - a.z * b.y,
        .y = a.z * b.x - a.x * b.z,
        .z = a.x * b.y - a.y * b.x
    };
}

void normalize(vec3 *v) {
    float len = sqrtf(v->x * v->x + v->y * v->y + v->z * v->z);
    if (len > 0.0f) {
        float invLen = 1.0f / len;
        v->x *= invLen;
        v->y *= invLen;
        v->z *= invLen;
    }
}
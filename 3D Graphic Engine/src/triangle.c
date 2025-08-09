#include "triangle.h"
#include <math.h>

Triangle createTriangle(unsigned int v0, unsigned int v1, unsigned int v2){
    return (Triangle){
        v0, v1, v2
    };
}

BoundingBox2D getTriangleBox(vec4 * restrict v0, vec4 * restrict v1, vec4 * restrict v2, BoundingBox2D* restrict box){
    return (BoundingBox2D){
        imax(box->minX, floorf(fminf(v0->x, fminf(v1->x, v2->x)))),
        imax(box->minY, floorf(fminf(v0->y, fminf(v1->y, v2->y)))),
        imin(box->maxX, ceilf(fmaxf(v0->x, fmaxf(v1->x, v2->x)))),
        imin(box->maxY, ceilf(fmaxf(v0->y, fmaxf(v1->y, v2->y)))),
    };
}
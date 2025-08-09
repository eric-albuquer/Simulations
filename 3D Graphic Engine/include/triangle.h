#ifndef TRIANGLE_H
#define TRIANGLE_H

#include "utils.h"

typedef struct {
    unsigned int v0, v1, v2;
    int textureId;
} Triangle;

Triangle createTriangle(unsigned int v0, unsigned int v1, unsigned int v2);

BoundingBox2D getTriangleBox(vec4 * restrict v0, vec4 * restrict v1, vec4 * restrict v2, BoundingBox2D* restrict box);

#endif
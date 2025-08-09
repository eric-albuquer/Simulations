#ifndef VERTEX_H
#define VERTEX_H

#include "utils.h"
#include "mat4.h"

typedef struct {
    vec3 vec;
    vec3 color;
    vec2 uv;
    vec3 normal;
} Vertex;

typedef struct {
    vec4 vec;
    vec3 color;
    vec3 normal;
} TransformedVertex;

Vertex createVertex(vec3 vec, vec3 color);

void transformVertex(const float *restrict matrix, const Vertex *restrict v, TransformedVertex *restrict vT);

#endif
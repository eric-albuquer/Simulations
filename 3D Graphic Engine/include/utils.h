#ifndef UTILS_H
#define UTILS_H

#define ALPHA_MAX_COLOR 4278190080U

typedef struct {
    float x, y;
} vec2;

typedef struct {
    float x, y, z;
} vec3;

typedef struct {
    float x, y, z, w;
} vec4;

typedef struct{
    int minX, minY;
    int maxX, maxY;
} BoundingBox2D;

typedef unsigned int color;

int imin(int a, int b);
int imax(int a, int b);

BoundingBox2D getIntersectionBox(BoundingBox2D * restrict boxA, BoundingBox2D * restrict boxB);

float cross2D(const vec4 * restrict a, const vec4 * restrict b, const vec4 * restrict p);
int isTopLeft(const vec4* restrict start, const vec4* restrict end);

vec3 cross(const vec3 a, const vec3 b);

void normalize(vec3 *v);

vec3 vec3Sub(vec3 a, vec3 b);

#endif
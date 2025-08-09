#ifndef MAT4_H
#define MAT4_H

#include "utils.h"

typedef struct {
    float m[16];
} Mat4;

Mat4 createMat4();

void Identidy(float m[16]);

void Perspective(float m[16], float fov, float aspect, float zNear, float zFar);

void Translate(float m[16], float x, float y, float z);

void RotateX(float m[16], float theta);

void RotateY(float m[16], float theta);

void RotateZ(float m[16], float theta);

void invertAndTranspose4x4(float *out, const float *matrix);

void vec3Transform(const float* matrix, const vec3* vIn, vec3* vOut);

#endif

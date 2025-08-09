#ifndef TEMAKI_GL
#define TEMAKI_GL

#include "raylib.h"
#include "utils.h"
#include "triangle.h"
#include "mat4.h"
#include "vertex.h"

void loadObj(const char *objPath, const char* mtlPath);

void unloadObj();

void setTexture(const char* path, unsigned int id);

void setVertexArray(Vertex *vertex, unsigned int length);
void setTriangleArray(Triangle *triangles, unsigned int length);

void setViewMatrix(Mat4* matrix);

void setNormalMatrix(Mat4* matrix);

void setBackgroundColor(color color);

void loadBuffers(int width, int height);

void unloadBuffers();

void render();

#endif
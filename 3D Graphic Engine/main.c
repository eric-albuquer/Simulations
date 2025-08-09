#include "temakiGL.h"
#include <stdio.h>
#include <time.h>

int main()
{
    SetConfigFlags(FLAG_FULLSCREEN_MODE);
    InitWindow(GetMonitorWidth(0), GetMonitorHeight(0), "Rasterization");

    float WIDTH = GetScreenWidth();
    float HEIGHT = GetScreenHeight();

    loadBuffers(WIDTH, HEIGHT);

    Vertex vertices[] = {
        {{-1, -1, -1}, {1, 0, 0}, {0, 0}}, {{1, -1, -1}, {1, 1, 0}, {1, 0}}, {{1, -1, 1}, {1, 0, 0}, {1, 1}}, {{-1, -1, 1}, {1, 0, 1}, {0, 1}},
        {{-1, 1, -1}, {0, 1, 1}, {0, 0}}, {{1, 1, -1}, {0, 1, 0}, {1, 0}}, {{1, 1, 1}, {1, 1, 0}, {1, 1}}, {{-1, 1, 1}, {0, 1, 0}, {0, 1}},
    };

    Triangle triangles[] = {
        {0, 1, 2, 2}, {0, 2, 3, 2},
        {4, 7, 6, 2}, {4, 6, 5, 2},
        {0, 3, 7, 2}, {0, 7, 4, 2},
        {1, 5, 6, 2}, {1, 6, 2, 2},
        {0, 4, 5, 2}, {0, 5, 1, 2},
        {3, 2, 6, 2}, {3, 6, 7, 2}
    };

    setTexture("textures/pathTracing.png", 1);
    setTexture("textures/creeper.png", 2);

    setVertexArray(vertices, sizeof(vertices) / sizeof(Vertex));
    setTriangleArray(triangles, sizeof(triangles) / sizeof(Triangle));

    //loadObj("3dmodels/Casa/tinker.obj", "3dmodels/Casa/obj.mtl");

    Mat4 viewMatrix = createMat4();
    Mat4 modelMatrix = createMat4();
    Mat4 normalMatrix = createMat4();
    float *mMatrix = modelMatrix.m;
    float *matrix = viewMatrix.m;
    float *nMatrix = normalMatrix.m;

    float fov = PI / 3;
    float aspect = WIDTH / HEIGHT;

    Vector3 camera = {0, 0, -5};
    float thetaX = PI * 0.45;
    float thetaY = 0;
    float thetaZ = -PI / 3;

    setViewMatrix(&viewMatrix);
    setNormalMatrix(&normalMatrix);

    float time;

    while (!WindowShouldClose())
    {
        time = GetFrameTime();

        Perspective(matrix, fov, aspect, 0.1f, 10000.0f);
        Translate(matrix, camera.x, camera.y, camera.z);
        RotateX(matrix, thetaX);
        RotateY(matrix, thetaY);
        RotateZ(matrix, thetaZ);

        Identidy(mMatrix);
        RotateX(mMatrix, thetaX);
        RotateY(mMatrix, thetaY);
        RotateZ(mMatrix, thetaZ);

        invertAndTranspose4x4(nMatrix, mMatrix);

        thetaX += 0.04 * time;
        thetaY += 0.5 * time;
        thetaZ += 0.2 * time;
        render();
    }

    unloadBuffers();
    unloadObj();

    CloseWindow();
    return 0;
}
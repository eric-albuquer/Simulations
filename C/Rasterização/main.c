#include <stdio.h>
#include <math.h>
#include <SDL3/SDL.h>

#define WIDTH 1000
#define HEIGHT 1000

#define CENTER_X (WIDTH >> 1)
#define CENTER_Y (HEIGHT >> 1)

#define INF 2147483647
#define MAX_TRIANGLES 10000

//#define M_PI_2 (M_PI / 2)

#define BUFFER_LENGTH (WIDTH * HEIGHT)

#define FIXED_SHIFT 12
#define FIXED_ONE (1 << FIXED_SHIFT)

#define FIXED_TO_COLOR_SHIFT (FIXED_SHIFT - 8)

#define FOV (M_PI / 3)
#define ASPECT_RATIO (HEIGHT / WIDTH)
#define ZNEAR 0.001
#define ZFAR 1000

#define PLAYER_VELOCITY 0.1
#define MOUSE_SENSITIVITY 0.001

typedef int FIXED_POINT;

int trianglesLen = 0;

float matrix[16] = {
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1};

float vertices[MAX_TRIANGLES * 3];

float colors[MAX_TRIANGLES * 3];

int triangles[MAX_TRIANGLES];

float cameraX = 2;
float cameraY = 0;
float cameraZ = 8;

float angleX = 0;
float angleY = 0;

FIXED_POINT zBuffer[BUFFER_LENGTH];

FIXED_POINT toFixed(float n)
{
    return (FIXED_POINT)(n * FIXED_ONE);
}

float fromFixed(FIXED_POINT n)
{
    return (float)(n / FIXED_ONE);
}

FIXED_POINT mul(FIXED_POINT a, FIXED_POINT b)
{
    return (FIXED_POINT)((((long long)a * b) >> FIXED_SHIFT));
}

FIXED_POINT div(FIXED_POINT a, FIXED_POINT b)
{
    return (FIXED_POINT)(((long long)a << FIXED_SHIFT) / b);
}

struct vec3
{
    float x;
    float y;
    float z;
};

struct vec3F
{
    FIXED_POINT x;
    FIXED_POINT y;
    FIXED_POINT z;
};

struct color
{
    FIXED_POINT r;
    FIXED_POINT g;
    FIXED_POINT b;
};

struct vec2
{
    FIXED_POINT x;
    FIXED_POINT y;
};

struct color color(float r, float g, float b)
{
    struct color c;
    c.r = toFixed(r);
    c.g = toFixed(g);
    c.b = toFixed(b);
    return c;
}

struct vec3F vec3F(FIXED_POINT x, FIXED_POINT y, FIXED_POINT z)
{
    struct vec3F v;
    v.x = x;
    v.y = y;
    v.z = z;
    return v;
}

struct vec3 vec3(float x, float y, float z)
{
    struct vec3 v;
    v.x = x;
    v.y = y;
    v.z = z;
    return v;
}

struct vec2 vec2(FIXED_POINT x, FIXED_POINT y)
{
    struct vec2 v;
    v.x = x;
    v.y = y;
    return v;
}

FIXED_POINT cross2d(struct vec3F a, struct vec3F b, struct vec3F p)
{
    struct vec2 ab = vec2(b.x - a.x, b.y - a.y);
    struct vec2 ap = vec2(p.x - a.x, p.y - a.y);

    return mul(ab.x, ap.y) - mul(ab.y, ap.x);
}

void dot(float m[16], struct vec3 *v)
{
    float x = v->x;
    float y = v->y;
    float z = v->z;

    v->x = m[0] * x + m[1] * y + m[2] * z + m[3];
    v->y = m[4] * x + m[5] * y + m[6] * z + m[7];
    v->z = m[8] * x + m[9] * y + m[10] * z + m[11];
    float w = m[12] * x + m[13] * y + m[14] * z + m[15];

    if (w != 0)
    {
        const float invW = 1 / w;
        v->x *= invW;
        v->y *= invW;
        v->z *= invW;
    }
}

void perspective(float matrix[16], float fov, float aspectRatio, float zNear, float zFar)
{
    float invTanHF = 1 / tan(fov / 2);
    float invFN = 1 / (zFar - zNear);

    matrix[0] = aspectRatio * invTanHF;
    matrix[1] = 0;
    matrix[2] = 0;
    matrix[3] = 0;
    matrix[4] = 0;
    matrix[5] = invTanHF;
    matrix[6] = 0;
    matrix[7] = 0;
    matrix[8] = 0;
    matrix[9] = 0;
    matrix[10] = zFar * invFN;
    matrix[11] = (-zFar * zNear) * invFN;
    matrix[12] = 0;
    matrix[13] = 0;
    matrix[14] = 1;
    matrix[15] = 0;
}

void translate(float matrix[16], float x, float y, float z)
{
    matrix[3] += matrix[0] * x + matrix[1] * y + matrix[2] * z;
    matrix[7] += matrix[4] * x + matrix[5] * y + matrix[6] * z;
    matrix[11] += matrix[8] * x + matrix[9] * y + matrix[10] * z;
    matrix[15] += matrix[12] * x + matrix[13] * y + matrix[14] * z;
}

void rotateY(float matrix[16], float theta)
{
    float sinTheta = sin(theta);
    float cosTheta = cos(theta);

    float a = matrix[0];
    float c = matrix[2];
    float e = matrix[4];
    float g = matrix[6];
    float i = matrix[8];
    float k = matrix[10];
    float m = matrix[12];
    float o = matrix[14];

    matrix[0] = a * cosTheta - c * sinTheta;
    matrix[2] = a * sinTheta + c * cosTheta;
    matrix[4] = e * cosTheta - g * sinTheta;
    matrix[6] = e * sinTheta + g * cosTheta;
    matrix[8] = i * cosTheta - k * sinTheta;
    matrix[10] = i * sinTheta + k * cosTheta;
    matrix[12] = m * cosTheta - o * sinTheta;
    matrix[14] = m * sinTheta + o * cosTheta;
}

void rotateX(float matrix[16], float theta)
{
    float sinTheta = sin(theta);
    float cosTheta = cos(theta);

    float b = matrix[1];
    float c = matrix[2];
    float f = matrix[5];
    float g = matrix[6];
    float j = matrix[9];
    float k = matrix[10];
    float n = matrix[13];
    float o = matrix[14];

    matrix[1] = b * cosTheta + c * sinTheta;
    matrix[2] = -b * sinTheta + c * cosTheta;
    matrix[5] = f * cosTheta + g * sinTheta;
    matrix[6] = -f * sinTheta + g * cosTheta;
    matrix[9] = j * cosTheta + k * sinTheta;
    matrix[10] = -j * sinTheta + k * cosTheta;
    matrix[13] = n * cosTheta + o * sinTheta;
    matrix[14] = -n * sinTheta + o * cosTheta;
}

short insideScreen(struct vec3 v)
{
    return (
        v.x >= -1 && v.x <= 1 &&
        v.y >= -1 && v.y <= 1 &&
        v.z >= -1 && v.z <= 1);
}

struct vec3F toScreen(struct vec3 v)
{
    FIXED_POINT x = toFixed((v.x + 1) * CENTER_X);
    FIXED_POINT y = toFixed((v.y + 1) * CENTER_Y);
    FIXED_POINT z = toFixed(v.z * FIXED_ONE);
    return vec3F(x, y, z);
}

int max(int a, int b)
{
    return a > b ? a : b;
}

int min(int a, int b)
{
    return a < b ? a : b;
}

void clearScreen(uint32_t *pixels)
{
    for (int i = 0; i < BUFFER_LENGTH; i++)
    {
        pixels[i] = 0xFF000000;
    }
}

void clearZBuffer()
{
    for (int i = 0; i < BUFFER_LENGTH; i++)
    {
        zBuffer[i] = INF;
    }
}

void rasterize(struct vec3F v0, struct vec3F v1, struct vec3F v2, struct color c0, struct color c1, struct color c2, uint32_t *pixels)
{
    FIXED_POINT area = cross2d(v0, v1, v2);
    if (area < 0)
        return;

    FIXED_POINT minX = max(min(min(v0.x, v1.x), v2.x), 0);
    FIXED_POINT minY = max(min(min(v0.y, v1.y), v2.y), 0);
    FIXED_POINT maxX = min(max(max(v0.x, v1.x), v2.x), (WIDTH - 1) << FIXED_SHIFT);
    FIXED_POINT maxY = min(max(max(v0.y, v1.y), v2.y), (HEIGHT - 1) << FIXED_SHIFT);

    FIXED_POINT deltaW0Col = v1.y - v2.y;
    FIXED_POINT deltaW1Col = v2.y - v0.y;
    FIXED_POINT deltaW2Col = v0.y - v1.y;

    FIXED_POINT deltaW0Row = v2.x - v1.x;
    FIXED_POINT deltaW1Row = v0.x - v2.x;
    FIXED_POINT deltaW2Row = v1.x - v0.x;

    FIXED_POINT half = 1 << (FIXED_SHIFT - 1);

    struct vec3F p0 = vec3F(minX + half, minY + half, 0);

    FIXED_POINT w0Row = cross2d(v1, v2, p0);
    FIXED_POINT w1Row = cross2d(v2, v0, p0);
    FIXED_POINT w2Row = cross2d(v0, v1, p0);

    int idxRow = ((minY >> FIXED_SHIFT) * WIDTH + (minX >> FIXED_SHIFT));

    for (FIXED_POINT y = minY; y <= maxY; y += FIXED_ONE)
    {
        FIXED_POINT w0 = w0Row;
        FIXED_POINT w1 = w1Row;
        FIXED_POINT w2 = w2Row;
        int idx = idxRow;

        for (FIXED_POINT x = minX; x <= maxX; x += FIXED_ONE)
        {
            short isInside = w0 >= 0 && w1 >= 0 && w2 >= 0;
            if (isInside)
            {
                FIXED_POINT alpha = div(w0, area);
                FIXED_POINT beta = div(w1, area);
                FIXED_POINT gamma = FIXED_ONE - alpha - beta;

                FIXED_POINT depth = mul(alpha, v0.z) + mul(beta, v1.z) + mul(gamma, v2.z);

                if (depth < zBuffer[idx])
                {
                    zBuffer[idx] = depth;

                    FIXED_POINT r = (mul(alpha, c0.r) + mul(beta, c1.r) + mul(gamma, c2.r)) >> FIXED_TO_COLOR_SHIFT;
                    FIXED_POINT g = (mul(alpha, c0.g) + mul(beta, c1.g) + mul(gamma, c2.g)) >> FIXED_TO_COLOR_SHIFT;
                    FIXED_POINT b = (mul(alpha, c0.b) + mul(beta, c1.b) + mul(gamma, c2.b)) >> FIXED_TO_COLOR_SHIFT;

                    pixels[idx] = (255 << 24) | (r << 16) | (g << 8) | b;
                }
            }
            w0 += deltaW0Col;
            w1 += deltaW1Col;
            w2 += deltaW2Col;
            idx++;
        }
        w0Row += deltaW0Row;
        w1Row += deltaW1Row;
        w2Row += deltaW2Row;
        idxRow += WIDTH;
    }
}

void vertexShader(float vertices[], float colors[], float matrix[16], int triangles[], uint32_t *pixels)
{
    clearScreen(pixels);
    for (int i = 0; i < trianglesLen; i += 3)
    {
        int i0 = triangles[i] * 3;
        int i1 = triangles[i + 1] * 3;
        int i2 = triangles[i + 2] * 3;

        struct vec3 v0 = vec3(vertices[i0], vertices[i0 + 1], vertices[i0 + 2]);
        struct vec3 v1 = vec3(vertices[i1], vertices[i1 + 1], vertices[i1 + 2]);
        struct vec3 v2 = vec3(vertices[i2], vertices[i2 + 1], vertices[i2 + 2]);

        dot(matrix, &v0);
        dot(matrix, &v1);
        dot(matrix, &v2);

        struct vec3F v0s = toScreen(v0);
        struct vec3F v1s = toScreen(v1);
        struct vec3F v2s = toScreen(v2);

        struct color c0 = color(colors[i0], colors[i0 + 1], colors[i0 + 2]);
        struct color c1 = color(colors[i1], colors[i1 + 1], colors[i1 + 2]);
        struct color c2 = color(colors[i2], colors[i2 + 1], colors[i2 + 2]);

        rasterize(v0s, v1s, v2s, c0, c1, c2, pixels);
    }
}

void createCube(float vertices[], float colors[], int triangles[], float x, float y, float z)
{
    float cubeV[] = {
        x, y, z + 1,
        x, y + 1, z + 1,
        x + 1, y, z + 1,
        x + 1, y + 1, z + 1,

        // Trás
        x, y, z,
        x, y + 1, z,
        x + 1, y, z,
        x + 1, y + 1, z,

        // Esquerda
        x, y, z,
        x, y, z + 1,
        x, y + 1, z,
        x, y + 1, z + 1,

        // Direita
        x + 1, y, z,
        x + 1, y, z + 1,
        x + 1, y + 1, z,
        x + 1, y + 1, z + 1,

        // Cima
        x, y + 1, z,
        x, y + 1, z + 1,
        x + 1, y + 1, z,
        x + 1, y + 1, z + 1,

        // Baixo
        x, y, z,
        x, y, z + 1,
        x + 1, y, z,
        x + 1, y, z + 1};

    float cubeC[] = {
        // Frente
        0,
        0,
        1,
        0,
        1,
        1,
        1,
        0,
        1,
        1,
        1,
        1,

        // Trás
        0,
        0,
        0,
        0,
        1,
        0,
        1,
        0,
        0,
        1,
        1,
        0,

        // Esquerda
        0,
        0,
        0,
        0,
        0,
        1,
        0,
        1,
        0,
        0,
        1,
        1,

        // Direita
        1,
        0,
        0,
        1,
        0,
        1,
        1,
        1,
        0,
        1,
        1,
        1,

        // Cima
        0,
        1,
        0,
        0,
        1,
        1,
        1,
        1,
        0,
        1,
        1,
        1,

        // Baixo
        0,
        0,
        0,
        0,
        0,
        1,
        1,
        0,
        0,
        1,
        0,
        1,
    };

    int idx = (trianglesLen << 1) / 3;

    int cubeT[] = {
        // Frente
        idx + 0, idx + 1, idx + 2,
        idx + 1, idx + 3, idx + 2,

        // Trás
        idx + 4, idx + 6, idx + 5,
        idx + 5, idx + 6, idx + 7,

        // Esquerda
        idx + 8, idx + 10, idx + 9,
        idx + 9, idx + 10, idx + 11,

        // Direita
        idx + 12, idx + 13, idx + 14,
        idx + 13, idx + 15, idx + 14,

        // Cima
        idx + 16, idx + 18, idx + 17,
        idx + 17, idx + 18, idx + 19,

        // Baixo
        idx + 20, idx + 21, idx + 22,
        idx + 21, idx + 23, idx + 22};

    int vIdx = trianglesLen << 1;

    for (int i = 0; i < 72; i++)
    {
        vertices[i + vIdx] = cubeV[i];
        colors[i + vIdx] = cubeC[i];
    }

    for (int i = 0; i < 36; i++)
    {
        triangles[i + trianglesLen] = cubeT[i];
    }

    trianglesLen += 36;
}

void update(SDL_Event *event)
{
    SDL_Event e = *(event);
    if (e.type == SDL_EVENT_KEY_DOWN)
    {
        float sinY = sin(angleY);
        float cosY = cos(angleY);
        float ps = PLAYER_VELOCITY * sinY;
        float pc = PLAYER_VELOCITY * cosY;
        if (e.key.scancode == SDL_SCANCODE_A)
        {
            cameraX += pc;
            cameraZ += ps;
        }
        if (e.key.scancode == SDL_SCANCODE_D)
        {
            cameraX -= pc;
            cameraZ -= ps;
        }
        if (e.key.scancode == SDL_SCANCODE_W)
        {
            cameraX += ps;
            cameraZ -= pc;
        }
        if (e.key.scancode == SDL_SCANCODE_S)
        {
            cameraX -= ps;
            cameraZ += pc;
        }
        if (e.key.scancode == SDL_SCANCODE_SPACE)
        {
            cameraY += PLAYER_VELOCITY;
        }
        if (e.key.scancode == SDL_SCANCODE_LSHIFT)
        {
            cameraY -= PLAYER_VELOCITY;
        }
    }
}

void main()
{
    for (int i = 0; i < 3; i++)
    {
        for (int j = 0; j < 3; j++)
        {
            for (int k = 0; k < 3; k++)
            {
                if (!(k == 1 && i == 1))
                {
                    createCube(vertices, colors, triangles, i, j, k);
                }
            }
        }
    }

    SDL_Init(SDL_INIT_VIDEO);

    SDL_Window *window = SDL_CreateWindow("Manipulação de Pixels SDL3", WIDTH, HEIGHT, 0);
    SDL_Renderer *renderer = SDL_CreateRenderer(window, "opengl");

    // Criando uma textura para manipular pixels manualmente
    SDL_Texture *texture = SDL_CreateTexture(renderer, SDL_PIXELFORMAT_ARGB8888, SDL_TEXTUREACCESS_STREAMING, WIDTH, HEIGHT);

    SDL_HideCursor();

    SDL_SetWindowRelativeMouseMode(window, true);

    int running = 1;
    float mouseX, mouseY;
    SDL_Event event;

    uint32_t *pixels;
    int pitch;

    while (running)
    {
        while (SDL_PollEvent(&event))
        {
            if (event.type == SDL_EVENT_QUIT)
            {
                running = 0;
            }

            update(&event);
        }

        // Obtém a posição do mouse em relação à janela
        SDL_GetRelativeMouseState(&mouseX, &mouseY);

        float dx = mouseX;
        float dy = mouseY;

        angleY -= dx * MOUSE_SENSITIVITY;
        angleX += dy * MOUSE_SENSITIVITY;

        if (angleX >= M_PI_2)
            angleX = M_PI_2;
        else if (angleX <= -M_PI_2)
            angleX = -M_PI_2;

        perspective(matrix, FOV, ASPECT_RATIO, ZNEAR, ZFAR);
        rotateX(matrix, angleX);
        rotateY(matrix, angleY);
        translate(matrix, cameraX, cameraY, cameraZ);

        clearZBuffer();

        SDL_LockTexture(texture, NULL, (void **)&pixels, &pitch);

        vertexShader(vertices, colors, matrix, triangles, pixels);

        SDL_UnlockTexture(texture);

        // Renderiza a textura na tela
        SDL_RenderTexture(renderer, texture, NULL, NULL);
        SDL_RenderPresent(renderer);
        SDL_Delay(7);
    }

    // Libera recursos
    SDL_DestroyTexture(texture);
    SDL_DestroyRenderer(renderer);
    SDL_DestroyWindow(window);
    SDL_Quit();
}

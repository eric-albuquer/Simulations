#include <stdlib.h>
#include "temakiGL.h"
#include <omp.h>
#include <stdio.h>
#include <float.h>
#include <math.h>
#include <time.h>
#include <stdatomic.h>
#include <string.h>

#define MAX_VERTEX 1000000
#define MAX_TRIANGLES 1000000
#define MAX_TEXTURES 10

typedef struct
{
    Triangle *triangle;
    float area;
    vec3 invZ;
    vec3 deltaWCol;
    vec3 deltaWRow;
    vec3 bias;
} ProcessedTriangle;

typedef struct
{
    int length;
    ProcessedTriangle *data;
} ProcessedTriangleBuffer;

typedef struct
{
    unsigned int processedTriangle;
    BoundingBox2D box;
} TriangleTile;

typedef struct
{
    int length;
    TriangleTile *data;
} TileBuffer;

typedef struct
{
    unsigned int width;
    unsigned int height;
    color *pixels;
} TextureRam;

typedef struct
{
    int start;
    int end;
} Batch;

typedef struct
{
    _Alignas(64) atomic_int_fast32_t length;
    unsigned int *tiles;
} TileWorkQueue;

typedef struct Node
{
    unsigned int tile;
    struct Node *next;
} Node;

typedef struct
{
    int x, y;
} PixelPos;

static color *frameBuffer;
static color *backgroundBuffer;
static float *zBuffer;
static PixelPos *pixelPosBuffer;
static vec2 *screenUVBuffer;

static vec3 *normalBuffer;

static int numThreads;

static int tileSizeShift = 6;
static int tileSize;
static int tileRows;
static int tileCols;

static int totalTiles;

static int *tileIdxCulling;

static BoundingBox2D *tileSpace;

static BoundingBox2D screenBox;

static unsigned int vertexBufferLen;
static Vertex *vertexBuffer;
static TransformedVertex *transformedVertexBuffer;

static unsigned int triangleBufferLen;
static Triangle *triangleBuffer;

static TileBuffer *triangleGrid;
static TileBuffer *triangleGridT;
static ProcessedTriangleBuffer processedTriangles;

static Batch *triangleBatches;
static Batch *vertexBatches;
static Batch *pixelBathces;
static Batch *tilesBatches;

static float *viewMatrix;
static float *normalMatrix;

static color backgroundColor = {0};

static TextureRam textures[MAX_TEXTURES];

static int WIDTH;
static int HEIGHT;

static float halfWidth;
static float halfHeight;

static int TOTAL_PIXELS;

static Texture2D texture;

static TileWorkQueue workQueue;

_Atomic(Node *) topWork = NULL;

void pushWork(unsigned int tile)
{
    Node *node = malloc(sizeof(Node));
    node->tile = tile;

    Node *oldTop;
    do
    {
        oldTop = atomic_load(&topWork);
        node->next = oldTop;
    } while (!atomic_compare_exchange_weak(&topWork, &oldTop, node));
}

int popWork(unsigned int *restrict tile)
{
    Node *oldTop;
    Node *next;
    do
    {
        oldTop = atomic_load(&topWork);
        if (oldTop == NULL)
            return 0;
        next = oldTop->next;
    } while (!atomic_compare_exchange_weak(&topWork, &oldTop, next));

    *tile = oldTop->tile;
    free(oldTop);
    return 1;
}

void pushWorkQueue(unsigned int tile)
{
    int topIdx = atomic_fetch_add_explicit(&workQueue.length, 1, memory_order_relaxed);
    workQueue.tiles[topIdx] = tile;
}

int popWorkQueue(unsigned int *tile)
{
    int topIdx = atomic_fetch_sub_explicit(&workQueue.length, 1, memory_order_acquire) - 1;
    if (topIdx < 0)
    {
        atomic_fetch_add_explicit(&workQueue.length, 1, memory_order_relaxed); // devolve índice
        return 0;
    }
    *tile = workQueue.tiles[topIdx];
    return 1;
}

static void precomputeParallelVertex()
{
    int deltaV = ceilf(vertexBufferLen / (float)numThreads);
    for (int i = 0; i < numThreads; i++)
    {
        vertexBatches[i].start = i * deltaV;
        vertexBatches[i].end = imin((i + 1) * deltaV, vertexBufferLen);
    }
}

static void precomputeParallelTriangle()
{
    int deltaT = ceilf(triangleBufferLen / (float)numThreads);
    for (int i = 0; i < numThreads; i++)
    {
        triangleBatches[i].start = i * deltaT;
        triangleBatches[i].end = imin((i + 1) * deltaT, triangleBufferLen);
    }
}

void setBackgroundPixels()
{
#pragma omp parallel
    {
        float haldDiagonalSqr = (0.5f * 0.5f) + (0.5f * 0.5f) * 1.5;
        float invHDS = 1 / haldDiagonalSqr;
        int threadId = omp_get_thread_num();
        for (int i = pixelBathces[threadId].start; i < pixelBathces[threadId].end; i++)
        {
            float xCenter = screenUVBuffer[i].x - 0.5f;
            float yCenter = screenUVBuffer[i].y - 0.5f;
            int gray = imax(121 * (1 - ((xCenter * xCenter) + (yCenter * yCenter)) * invHDS), 0);
            backgroundBuffer[i] = ALPHA_MAX_COLOR | gray | (gray << 8) | (gray << 16);
        }
    }
}

void loadObj(const char *objPath, const char *mtlPath)
{
    char line[256];
    char colorsNames[10000][100];
    vec3 colors[10000];
    int cLen = 0;

    FILE *file = fopen(mtlPath, "r");
    if (!file)
    {
        printf("Erro ao abrir arquivo\n");
        return;
    }

    while (fgets(line, sizeof(line), file))
    {
        if (strncmp(line, "newmtl", 6) == 0)
        {
            strncpy(colorsNames[cLen], line + 7, sizeof(colorsNames[0]) - 1);

            size_t len = strlen(colorsNames[cLen]);
            if (len > 0 && colorsNames[cLen][len - 1] == '\n')
                colorsNames[cLen][len - 1] = '\0';
        }
        else if (line[0] == 'K' && line[1] == 'd')
        {
            vec3 v;
            sscanf(line, "Kd %f %f %f", &v.x, &v.y, &v.z);
            colors[cLen++] = v;
        }
    }

    fclose(file);

    file = fopen(objPath, "r");
    if (!file)
    {
        printf("Erro ao abrir arquivo\n");
        return;
    }

    vertexBuffer = (Vertex *)malloc(sizeof(Vertex) * MAX_VERTEX);
    triangleBuffer = (Triangle *)malloc(sizeof(Triangle) * MAX_TRIANGLES);

    vertexBufferLen = 0;
    triangleBufferLen = 0;

    vec3 color;

    while (fgets(line, sizeof(line), file))
    {

        if (line[0] == 'v' && line[1] == ' ')
        {
            sscanf(line, "v %f %f %f", &vertexBuffer[vertexBufferLen].vec.x, &vertexBuffer[vertexBufferLen].vec.y, &vertexBuffer[vertexBufferLen].vec.z);
            // vertexBuffer[vertexBufferLen].color = color;
            vertexBufferLen++;
        }
        else if (strncmp(line, "usemtl", 6) == 0)
        {
            char useColor[1000];
            strncpy(useColor, line + 7, sizeof(useColor) - 1);

            size_t len = strlen(useColor);
            if (len > 0 && useColor[len - 1] == '\n')
                useColor[len - 1] = '\0';

            for (int i = 0; i < cLen; i++)
            {
                if (strcmp(useColor, colorsNames[i]) == 0)
                {
                    color = colors[i];
                }
            }
        }
        else if (line[0] == 'f')
        {
            int v0, v1, v2;
            sscanf(line, "f %d %d %d", &v0, &v1, &v2);
            v0--;
            v1--;
            v2--;
            vec3 A = vertexBuffer[v0].vec;
            vec3 B = vertexBuffer[v1].vec;
            vec3 C = vertexBuffer[v2].vec;
            vec3 AB = vec3Sub(B, A);
            vec3 AC = vec3Sub(C, A);
            vec3 normal = cross(AB, AC);
            normalize(&normal);
            vertexBuffer[v0].normal = normal;
            vertexBuffer[v1].normal = normal;
            vertexBuffer[v2].normal = normal;
            vertexBuffer[v0].color = color;
            vertexBuffer[v1].color = color;
            vertexBuffer[v2].color = color;
            triangleBuffer[triangleBufferLen].v0 = v0;
            triangleBuffer[triangleBufferLen].v1 = v1;
            triangleBuffer[triangleBufferLen].v2 = v2;
            triangleBuffer[triangleBufferLen].textureId = -1;
            triangleBufferLen++;
        }
    }

    precomputeParallelVertex();
    precomputeParallelTriangle();

    fclose(file);
}

void unloadObj()
{
    free(vertexBuffer);
    vertexBuffer = NULL;
    free(triangleBuffer);
    triangleBuffer = NULL;
    vertexBufferLen = 0;
    triangleBufferLen = 0;
}

void setTexture(const char *path, unsigned int id)
{
    Image temp = LoadImage(path);
    TextureRam tex = {
        temp.width,
        temp.height,
        (color *)LoadImageColors(temp)};
    UnloadImage(temp);
    textures[id] = tex;
}

void setVertexArray(Vertex *vertex, unsigned int length)
{
    vertexBufferLen = length;
    vertexBuffer = vertex;

    precomputeParallelVertex();
}

void setTriangleArray(Triangle *triangles, unsigned int length)
{
    triangleBufferLen = length;
    triangleBuffer = triangles;

    precomputeParallelTriangle();
}

void setViewMatrix(Mat4 *matrix)
{
    viewMatrix = matrix->m;
}

void setNormalMatrix(Mat4 *matrix)
{
    normalMatrix = matrix->m;
}

void setBackgroundColor(color color)
{
    backgroundColor = color;
}

void loadBuffers(int width, int height)
{
    tileSize = 1 << tileSizeShift;

    WIDTH = width;
    HEIGHT = height;

    halfWidth = WIDTH * 0.5f;
    halfHeight = HEIGHT * 0.5f;

    TOTAL_PIXELS = width * height;

    pixelPosBuffer = malloc(sizeof(PixelPos) * TOTAL_PIXELS);
    screenUVBuffer = malloc(sizeof(vec2) * TOTAL_PIXELS);

    normalBuffer = malloc(sizeof(vec3) * TOTAL_PIXELS);

    int idx = 0;
    for (int i = 0; i < HEIGHT; i++)
    {
        for (int j = 0; j < WIDTH; j++)
        {
            pixelPosBuffer[idx] = (PixelPos){j, i};
            screenUVBuffer[idx] = (vec2){j / (float)WIDTH, i / (float)HEIGHT};
            idx++;
        }
    }

    frameBuffer = (color *)malloc(sizeof(color) * TOTAL_PIXELS);
    backgroundBuffer = (color *)malloc(sizeof(color) * TOTAL_PIXELS);
    zBuffer = (float *)malloc(sizeof(float) * TOTAL_PIXELS);
    texture = LoadTextureFromImage(GenImageColor(width, height, BLACK));
    SetTextureFilter(texture, TEXTURE_FILTER_POINT);

    transformedVertexBuffer = (TransformedVertex *)malloc(sizeof(TransformedVertex) * MAX_VERTEX);
    processedTriangles.length = 0;
    processedTriangles.data = (ProcessedTriangle *)malloc(sizeof(ProcessedTriangle) * MAX_TRIANGLES);

    numThreads = omp_get_max_threads();
    omp_set_num_threads(numThreads);

    tileRows = ceilf(HEIGHT / (float)tileSize);
    tileCols = ceilf(WIDTH / (float)tileSize);

    totalTiles = tileRows * tileCols;

    tileSpace = (BoundingBox2D *)malloc(sizeof(BoundingBox2D) * totalTiles);

    triangleGrid = (TileBuffer *)malloc(sizeof(TileBuffer) * numThreads * totalTiles);
    triangleGridT = (TileBuffer *)malloc(sizeof(TileBuffer) * numThreads * totalTiles);

    for (int i = 0; i < tileRows; i++)
    {
        for (int j = 0; j < tileCols; j++)
        {
            int tileIdx = i * tileCols + j;
            tileSpace[tileIdx].minX = tileSize * j;
            tileSpace[tileIdx].minY = tileSize * i;
            tileSpace[tileIdx].maxX = imin(tileSize * (j + 1), width) - 1;
            tileSpace[tileIdx].maxY = imin(tileSize * (i + 1), height) - 1;
        }
    }

    for (int i = 0; i < numThreads * totalTiles; i++)
    {
        triangleGrid[i].data = malloc(sizeof(TriangleTile) * MAX_TRIANGLES / numThreads);
        triangleGrid[i].length = 0;
    }

    triangleBatches = (Batch *)malloc(sizeof(Batch) * numThreads);
    vertexBatches = (Batch *)malloc(sizeof(Batch) * numThreads);
    pixelBathces = (Batch *)malloc(sizeof(Batch) * numThreads);

    int deltaPixel = ceilf(TOTAL_PIXELS / (float)numThreads);
    for (int i = 0; i < numThreads; i++)
    {
        pixelBathces[i].start = i * deltaPixel;
        pixelBathces[i].end = fmin((i + 1) * deltaPixel, TOTAL_PIXELS);
    }

    for (int i = 0; i < MAX_TEXTURES; i++)
    {
        UnloadImageColors((Color *)textures[i].pixels);
    }

    screenBox.minX = 0;
    screenBox.minY = 0;
    screenBox.maxX = width - 1;
    screenBox.maxY = height - 1;

    tilesBatches = (Batch *)malloc(sizeof(Batch) * numThreads);
    int deltaTile = ceilf(totalTiles / (float)numThreads);
    for (int i = 0; i < numThreads; i++)
    {
        tilesBatches[i] = (Batch){
            i * deltaTile,
            imin((i + 1) * deltaTile, totalTiles),
        };
    }

    tileIdxCulling = (int *)malloc(sizeof(int) * numThreads);
    for (int i = 0; i < numThreads; i++)
    {
        tileIdxCulling[i] = i * totalTiles;
    }

    workQueue.length = 0;
    workQueue.tiles = malloc(sizeof(unsigned int) * totalTiles);

    setBackgroundPixels();
}

void unloadBuffers()
{
    free(frameBuffer);
    free(zBuffer);
    free(pixelPosBuffer);
    free(transformedVertexBuffer);
    free(screenUVBuffer);

    free(normalBuffer);

    free(triangleBatches);
    free(vertexBatches);
    free(pixelBathces);

    free(tileSpace);

    for (int i = 0; i < numThreads * totalTiles; i++)
    {
        free(triangleGrid[i].data);
    }

    free(processedTriangles.data);
    free(workQueue.tiles);

    free(triangleGrid);
    free(triangleGridT);

    free(tilesBatches);

    free(tileIdxCulling);

    UnloadTexture(texture);
}

static bool insideScreen(TransformedVertex *restrict v0, TransformedVertex *restrict v1, TransformedVertex *restrict v2)
{
    return (
        (v0->vec.x >= 0 && v0->vec.x < WIDTH && v0->vec.y >= 0 && v0->vec.y < HEIGHT && v0->vec.z >= 0 && v0->vec.z <= 1) ||
        (v1->vec.x >= 0 && v1->vec.x < WIDTH && v1->vec.y >= 0 && v1->vec.y < HEIGHT && v1->vec.z >= 0 && v1->vec.z <= 1) ||
        (v2->vec.x >= 0 && v2->vec.x < WIDTH && v2->vec.y >= 0 && v2->vec.y < HEIGHT && v2->vec.z >= 0 && v2->vec.z <= 1));
}

static void rasterizeTileColor(const ProcessedTriangle *restrict t, const BoundingBox2D box, float *restrict zBuffer, color *restrict frameBuffer)
{
    const TransformedVertex *v0 = transformedVertexBuffer + t->triangle->v0;
    const TransformedVertex *v1 = transformedVertexBuffer + t->triangle->v1;
    const TransformedVertex *v2 = transformedVertexBuffer + t->triangle->v2;

    const float deltaW0Col = t->deltaWCol.x, deltaW0Row = t->deltaWRow.x;
    const float deltaW1Col = t->deltaWCol.y, deltaW1Row = t->deltaWRow.y;
    const float deltaW2Col = t->deltaWCol.z, deltaW2Row = t->deltaWRow.z;

    const float r0 = v0->color.x, r1 = v1->color.x, r2 = v2->color.x;
    const float g0 = v0->color.y, g1 = v1->color.y, g2 = v2->color.y;
    const float b0 = v0->color.z, b1 = v1->color.z, b2 = v2->color.z;

    const float nx0 = v0->normal.x, ny0 = v0->normal.y, nz0 = v0->normal.z;
    const float nx1 = v1->normal.x, ny1 = v1->normal.y, nz1 = v1->normal.z;
    const float nx2 = v2->normal.x, ny2 = v2->normal.y, nz2 = v2->normal.z;

    const vec4 p0 = {box.minX + 0.5f, box.minY + 0.5f};

    float w0Row = (cross2D(&v1->vec, &v2->vec, &p0) + t->bias.x) * t->invZ.x;
    float w1Row = (cross2D(&v2->vec, &v0->vec, &p0) + t->bias.y) * t->invZ.y;
    float w2Row = (cross2D(&v0->vec, &v1->vec, &p0) + t->bias.z) * t->invZ.z;

    unsigned int idxRow = box.minY * WIDTH + box.minX;

    for (int y = box.minY; y <= box.maxY; y++)
    {
        float w0 = w0Row;
        float w1 = w1Row;
        float w2 = w2Row;

        unsigned int idx = idxRow;
        for (int x = box.minX; x <= box.maxX; x++)
        {
            if (w0 > 0 && w1 > 0 && w2 > 0)
            {
                float depth = 1 / (w0 + w1 + w2);

                if (depth < zBuffer[idx])
                {
                    zBuffer[idx] = depth;

                    unsigned int red = (r0 * w0 + r1 * w1 + r2 * w2) * depth;
                    unsigned int green = (g0 * w0 + g1 * w1 + g2 * w2) * depth;
                    unsigned int blue = (b0 * w0 + b1 * w1 + b2 * w2) * depth;

                    normalBuffer[idx] = (vec3){
                        (nx0 * w0 + nx1 * w1 + nx2 * w2) * depth,
                        (ny0 * w0 + ny1 * w1 + ny2 * w2) * depth,
                        (nz0 * w0 + nz1 * w1 + nz2 * w2) * depth};

                    frameBuffer[idx] = red | (green << 8) | (blue << 16) | ALPHA_MAX_COLOR;
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

static void rasterizeTileTexture(const ProcessedTriangle *restrict t, const BoundingBox2D box, float *restrict zBuffer, color *restrict frameBuffer)
{
    const TransformedVertex *v0 = transformedVertexBuffer + t->triangle->v0;
    const TransformedVertex *v1 = transformedVertexBuffer + t->triangle->v1;
    const TransformedVertex *v2 = transformedVertexBuffer + t->triangle->v2;

    const vec2 uv0 = (vertexBuffer + t->triangle->v0)->uv;
    const vec2 uv1 = (vertexBuffer + t->triangle->v1)->uv;
    const vec2 uv2 = (vertexBuffer + t->triangle->v2)->uv;

    const float deltaW0Col = t->deltaWCol.x, deltaW0Row = t->deltaWRow.x;
    const float deltaW1Col = t->deltaWCol.y, deltaW1Row = t->deltaWRow.y;
    const float deltaW2Col = t->deltaWCol.z, deltaW2Row = t->deltaWRow.z;

    const TextureRam *texture = textures + t->triangle->textureId;
    const color *tPixels = texture->pixels;
    const int tWidth = texture->width;
    const int tHeight = texture->height;

    const vec4 p0 = {box.minX + 0.5f, box.minY + 0.5f};

    float w0Row = (cross2D(&v1->vec, &v2->vec, &p0) + t->bias.x) * t->invZ.x;
    float w1Row = (cross2D(&v2->vec, &v0->vec, &p0) + t->bias.y) * t->invZ.y;
    float w2Row = (cross2D(&v0->vec, &v1->vec, &p0) + t->bias.z) * t->invZ.z;

    unsigned int idxRow = box.minY * WIDTH + box.minX;

    for (int y = box.minY; y <= box.maxY; y++)
    {
        float w0 = w0Row;
        float w1 = w1Row;
        float w2 = w2Row;

        unsigned int idx = idxRow;
        for (int x = box.minX; x <= box.maxX; x++)
        {
            if (w0 > 0 && w1 > 0 && w2 > 0)
            {
                float depth = 1 / (w0 + w1 + w2);

                if (depth < zBuffer[idx])
                {
                    zBuffer[idx] = depth;

                    int u = (uv0.x * w0 + uv1.x * w1 + uv2.x * w2) * depth * (tWidth - 1);
                    int v = (uv0.y * w0 + uv1.y * w1 + uv2.y * w2) * depth * (tHeight - 1);

                    frameBuffer[idx] = tPixels[v * tWidth + u];
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

static void geometryShader(float *restrict zBuffer, color *restrict frameBuffer, const Vertex *restrict vertexBuffer, TransformedVertex *restrict transformedVertexBuffer)
{
#pragma omp parallel
    {
        int threadId = omp_get_thread_num();
        int start = pixelBathces[threadId].start;
        int end = pixelBathces[threadId].end;
#pragma omp simd
        for (int i = start; i < end; i++)
        {
            zBuffer[i] = FLT_MAX;
            // frameBuffer[i] = backgroundColor;
        }
        memcpy(&frameBuffer[start], &backgroundBuffer[start], (end - start) * sizeof(color));

        for (int i = vertexBatches[threadId].start; i < vertexBatches[threadId].end; i++)
        {
            const Vertex* vertex = vertexBuffer + i;
            TransformedVertex *vertexT = transformedVertexBuffer + i;
            transformVertex(viewMatrix, vertex, vertexT);
            vec3Transform(normalMatrix, &vertex->normal, &vertexT->normal);

            vec4 *v = &transformedVertexBuffer[i].vec;

            v->x = (v->x + 1.0f) * halfWidth;
            v->y = (v->y + 1.0f) * halfHeight;
            v->z = (v->z + 1.0f) * 0.5f;

            vec3 *c = &transformedVertexBuffer[i].color;
            const vec3 *src = &vertexBuffer[i].color;

            c->x = src->x * 255.0f;
            c->y = src->y * 255.0f;
            c->z = src->z * 255.0f;
        }
    }
}

static void triangleCulling(TransformedVertex *restrict transformedVertexBuffer, ProcessedTriangle *restrict data)
{
#pragma omp parallel
    {
        int threadId = omp_get_thread_num();
        int tileIdx = tileIdxCulling[threadId];
        Batch batch = triangleBatches[threadId];
        for (int i = batch.start; i < batch.end; i++)
        {
            Triangle *triangle = triangleBuffer + i;
            TransformedVertex *v0 = transformedVertexBuffer + triangle->v0;
            TransformedVertex *v1 = transformedVertexBuffer + triangle->v1;
            TransformedVertex *v2 = transformedVertexBuffer + triangle->v2;

            if (!insideScreen(v0, v1, v2))
                continue;

            float area = cross2D(&v0->vec, &v1->vec, &v2->vec);
            if (area < 0)
                continue;

            vec3 invZ = {
                1 / (v0->vec.w * area),
                1 / (v1->vec.w * area),
                1 / (v2->vec.w * area)};

            vec3 deltaWCol = {
                (v1->vec.y - v2->vec.y) * invZ.x,
                (v2->vec.y - v0->vec.y) * invZ.y,
                (v0->vec.y - v1->vec.y) * invZ.z};

            vec3 deltaWRow = {
                (v2->vec.x - v1->vec.x) * invZ.x,
                (v0->vec.x - v2->vec.x) * invZ.y,
                (v1->vec.x - v0->vec.x) * invZ.z};

            vec3 bias = {
                isTopLeft(&v1->vec, &v2->vec) ? 0 : -0.0001f,
                isTopLeft(&v2->vec, &v0->vec) ? 0 : -0.0001f,
                isTopLeft(&v0->vec, &v1->vec) ? 0 : -0.0001f,
            };

            BoundingBox2D triangleBox = getTriangleBox(&v0->vec, &v1->vec, &v2->vec, &screenBox);
            BoundingBox2D tilesLimits = {
                triangleBox.minX >> tileSizeShift,
                triangleBox.minY >> tileSizeShift,
                triangleBox.maxX >> tileSizeShift,
                triangleBox.maxY >> tileSizeShift,
            };

            data[i] = (ProcessedTriangle){
                triangle, area, invZ, deltaWCol, deltaWRow, bias};

            int tileIdxRow = tilesLimits.minY * tileCols + tilesLimits.minX;

            for (int tileY = tilesLimits.minY; tileY <= tilesLimits.maxY; tileY++)
            {
                int tileIdxCol = tileIdxRow;
                for (int tileX = tilesLimits.minX; tileX <= tilesLimits.maxX; tileX++)
                {
                    BoundingBox2D box = getIntersectionBox(&triangleBox, tileSpace + tileIdxCol);
                    if (box.maxY - box.minY >= 0 && box.maxX - box.minX >= 0)
                    {
                        TileBuffer *buffer = triangleGrid + tileIdx + tileIdxCol;
                        buffer->data[buffer->length++] = (TriangleTile){
                            i, box};
                    }
                    tileIdxCol++;
                }
                tileIdxRow += tileCols;
            }
        }
    }
}

static void balanceWork(TileBuffer *restrict triangleGrid, TileBuffer *restrict triangleGridT)
{
#pragma omp parallel
    {
        int threadId = omp_get_thread_num();
        unsigned int tIdx = tilesBatches[threadId].start * numThreads;
        for (int i = tilesBatches[threadId].start; i < tilesBatches[threadId].end; i++)
        {
            int threadIdx = i;
            int hasWork = 0;
            for (int j = 0; j < numThreads; j++)
            {
                triangleGridT[tIdx + j] = triangleGrid[threadIdx];
                if (!hasWork && triangleGrid[threadIdx].length)
                {
                    hasWork = 1;
                    pushWorkQueue(tIdx);
                }
                triangleGrid[threadIdx].length = 0;
                threadIdx += totalTiles;
            }
            tIdx += numThreads;
        }
    }
}

static void rasterize(TileBuffer *restrict triangleGridT)
{
#pragma omp parallel
    {
        unsigned int tileIdx;
        while (popWorkQueue(&tileIdx))
        {
            for (int j = 0; j < numThreads; j++)
            {
                TileBuffer *tile = triangleGridT + tileIdx + j;
                for (int k = 0; k < tile->length; k++)
                {
                    TriangleTile *t = tile->data + k;
                    ProcessedTriangle *pT = processedTriangles.data + t->processedTriangle;
                    if (pT->triangle->textureId > -1)
                        rasterizeTileTexture(pT, t->box, zBuffer, frameBuffer);
                    else
                        rasterizeTileColor(pT, t->box, zBuffer, frameBuffer);
                }
            }
        }
    }
}

static void fragmentShader(const float *restrict zBuffer, color *restrict frameBuffer, vec3 *restrict normalBuffer)
{
    vec3 lightDir = {-0.5, -1.0f, 1.0f}; // Luz apontando para frente no eixo Z
    normalize(&lightDir);
    const float ambientIntensity = 0.2f; // Luz ambiente fraca
    const float diffuseIntensity = 0.8f; // Intensidade da luz difusa

#pragma omp parallel
    {
        int threadId = omp_get_thread_num();
        for (int i = pixelBathces[threadId].start; i < pixelBathces[threadId].end; i++)
        {
            if (zBuffer[i] < FLT_MAX)
            {
                vec3 *n = normalBuffer + i;

                // Normaliza a normal
                float len = sqrtf(n->x * n->x + n->y * n->y + n->z * n->z);
                if (len > 0.0f)
                {
                    float invLen = 1.0f / len;
                    n->x *= invLen;
                    n->y *= invLen;
                    n->z *= invLen;
                }

                // Calcula iluminação difusa (Lambert)
                float NdotL = n->x * lightDir.x + n->y * lightDir.y + n->z * lightDir.z;
                if (NdotL < 0.0f)
                    NdotL = 0.0f;

                float intensity = ambientIntensity + diffuseIntensity * NdotL;
                if (intensity > 1.0f)
                    intensity = 1.0f;

                // Extrai cor atual do framebuffer (supondo formato 0xAARRGGBB)
                unsigned int color = frameBuffer[i];
                unsigned int r = (color) & 0xFF;
                unsigned int g = (color >> 8) & 0xFF;
                unsigned int b = (color >> 16) & 0xFF;
                unsigned int a = (color >> 24) & 0xFF;

                // Aplica intensidade à cor (clamp para 0-255)
                r = (unsigned int)(r * intensity);
                g = (unsigned int)(g * intensity);
                b = (unsigned int)(b * intensity);

                if (r > 255)
                    r = 255;
                if (g > 255)
                    g = 255;
                if (b > 255)
                    b = 255;

                // Escreve cor de volta no framebuffer (mantém alfa)
                frameBuffer[i] = (a << 24) | (b << 16) | (g << 8) | r;
            }
        }
    }
}

void render()
{
    geometryShader(zBuffer, frameBuffer, vertexBuffer, transformedVertexBuffer);

    triangleCulling(transformedVertexBuffer, processedTriangles.data);

    balanceWork(triangleGrid, triangleGridT);

    rasterize(triangleGridT);

    fragmentShader(zBuffer, frameBuffer, normalBuffer);

    UpdateTexture(texture, frameBuffer);

    BeginDrawing();
    DrawTexture(texture, 0, 0, WHITE);
    EndDrawing();
}
import math
import pygame

PI = math.pi

#Largura e altura do mapa
ROWS = 15
COLS = 15

#Fov horizontal e vertical
FOV_V = 1.2
FOV_H = PI / 3

#Distância de visão
VIEW_DISTANCE = math.sqrt((ROWS - 3) ** 2 + (COLS - 3) ** 2)

#Velocidade do jogador
VELOCITY = 0.05

#Velocidade da mundança de ângulo
ANGLE_VELOCITY = 0.03

pygame.init()

#Criando um mapa com bordas
map = []
for i in range(ROWS):
    map.append([])
    for j in range(COLS):
        color = 0
        if i == 0: color = [255, 0, 0]
        elif j == 0: color = [0, 255, 0]
        elif i == ROWS - 1: color = [0, 0, 255]
        elif j == COLS - 1: color = [255, 0, 255]

        map[i].append(color)

map[10][10] = [255, 255, 0]
map[5][5] = [255, 100, 100]
map[7][3] = [0, 150, 100]
map[11][4] = [200, 150, 50]
map[10][4] = [200, 150, 50]

#Função do pygame para obter a altura e largura da tela
info = pygame.display.Info()
WIDTH = info.current_w
HEIGHT = info.current_h

#Tamanho da celula do mini mapa
CELL_SIZE = WIDTH / (5 * ROWS)

#Função que desenha o mini mapa
def drawMap(screen, cell_size):
    pygame.draw.rect(screen, (127, 127, 127), (0, 0, cell_size * COLS, cell_size * ROWS))
    for i in range(ROWS):
        y = cell_size * i
        for j in range(COLS):
            x = cell_size * j
            color = (0, 0, 0) if map[i][j] == 0 else map[i][j]
            pygame.draw.rect(screen, color, (x, y, cell_size - 1, cell_size - 1))

#Função para desenhar um circulo representando o player no mapa
def drawPlayer(screen, px, py, cell_size):
    pygame.draw.circle(screen, (255, 255, 0), (px * cell_size, py * cell_size), cell_size / 4)

#Função que desenha um raio de luz no mapa   
def drawRay(screen, ray, px, py, cell_size):
    x = (ray[1] + px) * cell_size
    y = (ray[2] + py) * cell_size
    pygame.draw.line(screen, (255, 0, 0), (px * cell_size, py * cell_size), (x, y), 2)

#Algoritmo principal para calcular a distancia de um raio até atingir uma parede
def raycast(x, y, angle):
    deltaX = math.cos(angle)
    deltaY = math.sin(angle)
    a = abs(math.tan(angle))
    dist_x = 0
    dist_y = 0
    stepX = 1 if deltaX > 0 else -1
    stepY = 1 if deltaY > 0 else -1
    d = 1e-15
    rx, ry = 0, 0
     
    while 0 <= x < COLS and 0 <= y < ROWS:
        if map[int(y + stepY * d)][int(x + stepX * d)] != 0: break
         
        if deltaX > 0: rx = int(x + 1) - x
        else: rx = x - int(x - d)
        if deltaY > 0: ry = int(y + 1) - y
        else: ry = y - int(y - d)
         
        if a * rx < ry:
            x += rx * stepX
            y += a * rx * stepY
            dist_x += rx
            dist_y += a * rx
        else:
            x += ry / a * stepX
            y += ry * stepY
            dist_x += ry / a
            dist_y += ry
    
    v = y == int(y)
    value = map[int(y + stepY * d)][int(x + stepX * d)]
    distance = math.sqrt(dist_x ** 2 + dist_y ** 2)   
     
    return [distance, dist_x * stepX, dist_y * stepY, value, v]

#Algoritmo para transformar a distancia de um raio em uma linha horizontal aplicando efeitos de sombra
def draw3d(screen, x, y, angle, fov_h, fov_v, max_dist):
    rays = []
    for i in range(WIDTH):
        dAlpha = fov_h / WIDTH
        alpha = angle - fov_h / 2 + i * dAlpha
        ray = raycast(x, y, alpha)
        rays.append(ray)
        dist = ray[0]
        visible_dist = dist if dist < max_dist else max_dist
        corrected_dist = visible_dist * math.cos(alpha - angle)
        line_h = HEIGHT / (fov_v * corrected_dist)
        h0 = HEIGHT / 2 - line_h
        h1 = HEIGHT / 2 + line_h
        if h0 <= 0: h0 = 0
        if h1 >= HEIGHT: h1 = HEIGHT
        shadow = 1 - (visible_dist / max_dist)
        if ray[4]: shadow *= 0.8
        r, g, b = ray[3]
        color = (max(r * shadow, 0), max(g * shadow, 0), max(b * shadow, 0))
        
        pygame.draw.line(screen, (199, 137, 88), (i, h1), (i, HEIGHT), 1)
        pygame.draw.line(screen, color, (i, h0), (i, h1), 1)
        pygame.draw.line(screen, (150, 150, 255), (i, 0), (i, h0), 1)

    return rays

#Função que verifica se a próxima posição é válida (sem paredes)
def playerCanMove(px, py):
    return map[int(py)][int(px)] == 0

#Função para desenhar o jogo e receber os inputs do teclado
def draw():
    screen = pygame.display.set_mode((WIDTH, HEIGHT))
    running = True
    angle = 4
    px = 4.5
    py = 4.5
    dx, dy = 0, 0
    
    while running:
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False
        
        # Obter as teclas pressionadas
        keys = pygame.key.get_pressed()

        # Movimentar o jogador com as setas do teclado
        if keys[pygame.K_LEFT]:
            angle -= ANGLE_VELOCITY
        if keys[pygame.K_RIGHT]:
            angle += ANGLE_VELOCITY
        if keys[pygame.K_UP]:
            dx = math.cos(angle) * VELOCITY
            dy = math.sin(angle) * VELOCITY
        if keys[pygame.K_DOWN]:
            dx = - math.cos(angle) * VELOCITY
            dy = - math.sin(angle) * VELOCITY
        if keys[pygame.K_d]:
            dx = math.cos(angle + PI / 2) * VELOCITY
            dy = math.sin(angle + PI / 2) * VELOCITY
        if keys[pygame.K_a]:
            dx = - math.cos(angle + PI / 2) * VELOCITY
            dy = - math.sin(angle + PI / 2) * VELOCITY
        if keys[pygame.K_ESCAPE]:
            running = False

        if playerCanMove(px, py + dy):
            py += dy
        
        if playerCanMove(px + dx, py):
            px += dx

        dx, dy = 0, 0

        rays = draw3d(screen, px, py, angle, FOV_H, FOV_V, VIEW_DISTANCE)
        drawMap(screen, CELL_SIZE)
        drawPlayer(screen, px, py, CELL_SIZE)
        for ray in rays:
            drawRay(screen, ray, px, py, CELL_SIZE)
        
        pygame.display.flip()
    pygame.quit()
    
draw()

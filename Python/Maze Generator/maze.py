from cell import Cell
import pygame
import numpy as np
import time

colors = {
    "black": (0, 0, 0),
    "white": (255, 255, 255),
    "purple": (50, 0, 50),
    "green": (0, 255, 0),
    "red": (255, 0, 0),
    "orange": (200, 125, 0),
    "blue": (0, 0, 255),
    "gray": (120, 120, 120)
}

WIDTH, HEIGHT = 1000, 1000
CELL_SIZE = 30
COLS, ROWS = WIDTH // CELL_SIZE, HEIGHT // CELL_SIZE


grid = [[Cell(i, j) for j in range(COLS)] for i in range(ROWS)]

def draw_grid(screen, grid):
    for row in grid:
        for cell in row:
            x, y = cell.j * CELL_SIZE, cell.i * CELL_SIZE
            if cell.visited:
                pygame.draw.rect(screen, colors["purple"], (x, y, CELL_SIZE, CELL_SIZE))
            if cell.head_left:
                pygame.draw.rect(screen, colors["orange"], (x, y, CELL_SIZE, CELL_SIZE))
            if cell.head_right:
                pygame.draw.rect(screen, colors["blue"], (x, y, CELL_SIZE, CELL_SIZE))
            if cell.head_left and cell.head_right:
                pygame.draw.rect(screen, colors["gray"], (x, y, CELL_SIZE, CELL_SIZE))
            if cell.highlight:
                pygame.draw.rect(screen, colors["green"], (x, y, CELL_SIZE, CELL_SIZE))
            if cell.top:
                pygame.draw.line(screen, colors["white"], (x, y), (x + CELL_SIZE, y))
            if cell.left:
                pygame.draw.line(screen, colors["white"], (x, y), (x, y + CELL_SIZE))
            if cell.bottom:
                pygame.draw.line(screen, colors["white"], (x + CELL_SIZE, y + CELL_SIZE), (x, y + CELL_SIZE))
            if cell.right:
                pygame.draw.line(screen, colors["white"], (x + CELL_SIZE, y + CELL_SIZE), (x + CELL_SIZE, y))

def remove_walls(current, next):
    dx, dy = next.j - current.j, next.i - current.i

    if dx == 1:
        current.right = False
        next.left = False
    elif dx == -1:
        current.left = False
        next.right = False
    elif dy == 1:
        current.bottom = False
        next.top = False
    elif dy == -1:
        current.top = False
        next.bottom = False

def maze_done():
    for row in grid:
        for cell in row:
            if not cell.visited:
                return False
    return True

def main():
    current = grid[0][0]
    stack = []
    for i in range(200**3): 
        
        current.visited = True
        if i % 200 ** 2 == 0 and maze_done():
            break
        next = current.check_neighbors(grid)
        if next != -1:
            next.visited
            stack.append(current)
            remove_walls(current, next)
            current = next
        elif len(stack) > 0:
            current = stack.pop(0)     

def draw():
    pygame.init()
    screen = pygame.display.set_mode((COLS * CELL_SIZE, ROWS * CELL_SIZE))
    pygame.display.set_caption("Matriz no Pygame")

    #clock = pygame.time.Clock()
    running = True

    current = grid[0][0]
    stack = []

    frame = 0

    while running:
        frame += 1
        if frame % 200 == 0 and maze_done():
            running = False
        screen.fill(colors["black"])
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False

        current.highlight = True

        draw_grid(screen, grid)

        current.visited = True
        current.highlight = False
        next = current.check_neighbors(grid)
        if next != -1:
            next.visited
            stack.append(current)
            remove_walls(current, next)
            current = next
        elif len(stack) > 0:
            current = stack.pop(0)

        pygame.display.flip()
        
        #clock.tick(10)
    pygame.quit()

def draw2(path = None):
    pygame.init()
    screen = pygame.display.set_mode((COLS * CELL_SIZE, ROWS * CELL_SIZE))
    pygame.display.set_caption("Matriz no Pygame")

    #clock = pygame.time.Clock()
    running = True

    while running:
        screen.fill(colors["black"])
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False


        if path:
            for x, y in path:
                grid[y][x].highlight = True
        draw_grid(screen, grid)
        
        pygame.display.flip()
        #clock.tick(10)

def draw_robot(draw_maze = False):
    if draw_maze:
        draw()
    else:
        main()
    pygame.init()
    screen = pygame.display.set_mode((COLS * CELL_SIZE, ROWS * CELL_SIZE))
    pygame.display.set_caption("Matriz no Pygame")

    running = True

    x, y = 0, 0
    dx, dy = 0, 1

    x2, y2 = 0, 0
    dx2, dy2 = 1, 0

    while running:
        screen.fill(colors["black"])
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False

        cell = grid[y][x]
        cell.head_left = True

        cell2 = grid[y2][x2]
        cell2.head_right = True

        if not (x == COLS - 1 and y == ROWS - 1):

            dx, dy = dy, -dx
            nx, ny = x + dx, y + dy
            
            while (dx == 1 and cell.right) or (dx == -1 and cell.left) or (dy == 1 and cell.bottom) or (dy == -1 and cell.top) or not (0 <= nx < COLS and 0 <= ny < ROWS):  
                dx, dy = -dy, dx
                nx, ny = x + dx, y + dy

            x += dx
            y += dy

        if not (x2 == COLS - 1 and y2 == ROWS - 1):

            dx2, dy2 = -dy2, dx2
            nx2, ny2 = x2 + dx2, y2 + dy2
            
            while (dx2 == 1 and cell2.right) or (dx2 == -1 and cell2.left) or (dy2 == 1 and cell2.bottom) or (dy2 == -1 and cell2.top) or not (0 <= nx2 < COLS and 0 <= ny2 < ROWS):  
                dx2, dy2 = dy2, - dx2
                nx2, ny2 = x2 + dx2, y2 + dy2

            x2 += dx2
            y2 += dy2

        if (x == COLS - 1 and y == ROWS - 1) and (x2 == COLS - 1 and y2 == ROWS - 1):
            grid[ROWS - 1][COLS - 1].head_left = True
            grid[ROWS - 1][COLS - 1].head_right = True
            running = False

        draw_grid(screen, grid)
        # cell.head_left = False
        # cell2.head_right = False 

        pygame.display.flip()
        #clock.tick(5)

    time.sleep(2)
    pygame.quit()
    path = find_path(0, 0, COLS - 1, ROWS - 1)
    draw2(path)

def distance_table(x, y):
    rows = len(grid)
    cols = len(grid[0])
    distances = np.full((rows, cols), -1, dtype=int)
    distances[y, x] = 0
    stack = [(x, y)]

    while stack:
        x, y = stack.pop(0)

        for dx, dy in [(1, 0), (-1, 0), (0, 1), (0, -1)]:
            nx, ny = x + dx, y + dy

            if 0 <= nx < cols and 0 <= ny < rows and distances[ny, nx] == -1:

                cell = grid[y][x]
                if (dx == 1 and not cell.right) or (dx == -1 and not cell.left) or (dy == 1 and not cell.bottom) or (dy == -1 and not cell.top):
                    distances[ny, nx] = distances[y, x] + 1
                    stack.append((nx, ny))

    return distances

def find_path(x1, y1, x2, y2):
    distances = distance_table(x2, y2)
    rows, cols = len(distances), len(distances[0])
    x, y = x1, y1
    path = [(x, y)]

    while not (x == x2 and y == y2):
        dist = distances[y, x]

        for dx, dy in [(1, 0), (-1, 0), (0, 1), (0, -1)]:
            nx, ny = x + dx, y + dy

            cell = grid[y][x]
            if 0 <= nx < cols and 0 <= ny < rows:
                n_dist = distances[ny, nx]
                if n_dist < dist:
                    if (dx == 1 and not cell.right) or (dx == -1 and not cell.left) or (dy == 1 and not cell.bottom) or (dy == -1 and not cell.top):
                        x, y = nx, ny
                        path.append((x, y))
                        break
    return path

#main()
# path = find_path(0, 0, COLS - 1, ROWS - 1)
# draw2()
draw_robot(True)
#draw()

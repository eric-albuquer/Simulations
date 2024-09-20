import pygame
import sys
import random
import matplotlib.pyplot as plt
import math

# Initialize Pygame
pygame.init()

# Set up the display
width = pygame.display.Info().current_w
height = pygame.display.Info().current_h
diagonal = math.sqrt(width + height)

screen = pygame.display.set_mode((width, height))
pygame.display.set_caption("Melhor caminho")

TOTAL_POINTS = 30

INITAL_MAP_STATES = 600

EPOCHS = 40

# Define colors
black = (0, 0, 0)
white = (255, 255, 255)
red = (255, 0, 0)
green = (0, 255, 0)
blue = (0, 0, 255)

class Point:
    def __init__(self, x, y, color) -> None:
        self.x = x
        self.y = y
        self.color = color

    def draw(self):
        pygame.draw.circle(screen, self.color, (self.x, self.y), 4)

    def copy(self):
        return Point(self.x, self.y, self.color)

map = [Point(10, 10, blue)]
for i in range(TOTAL_POINTS):
    x = random.random() * width
    y = random.random() * height
    map.append(Point(x, y, red))

map.append(Point(width - 10, height - 10, green))

def drawMap(map):
    for idx, p in enumerate(map):
        p.draw()
        if idx > 0:
            x0, y0 = p.x, p.y
            x1, y1 = map[idx - 1].x, map[idx - 1].y
            pygame.draw.line(screen, white, (x0, y0), (x1, y1))

def copy(map):
    return [p.copy() for p in map]

def randomize(map, amount):
    list_map = []

    for _ in range(amount):
        map_copy = copy(map)
        new_map = [map_copy[0]]
        for _ in range(TOTAL_POINTS):
            idx = int(random.random() * (len(map_copy) - 2)) + 1
            point = map_copy.pop(idx)
            new_map.append(point)

        new_map.append(map_copy[-1])
        list_map.append(new_map)

    return list_map

def dist(x0, y0, x1, y1):
    deltaX = x1 - x0
    deltaY = y1 - y0
    return math.sqrt(deltaX ** 2 + deltaY ** 2)

def cost(map):
    sum = 0
    for i, p in enumerate(map):
        if (i > 0):
            x0, y0 = p.x, p.y
            x1, y1 = map[i - 1].x, map[i - 1].y

            sum += dist(x0, y0, x1, y1)

    return sum / diagonal

def permute(map, start, end):
    initial = map[start].copy()
    final = map[end].copy()
    map[start] = final
    map[end] = initial

def closers(map):
    list_maps = [copy(map)]

    for i in range(TOTAL_POINTS):
        for j in range(i + 1, TOTAL_POINTS):
            map_copy = copy(map)
            permute(map_copy, i + 1, j + 1)
            list_maps.append(map_copy)

    return list_maps

def best(maps):
    lower_cost = cost(maps[0])
    best_map = maps[0]

    for i in range(1, len(maps)):
        actual_map = maps[i]
        actual_cost = cost(actual_map)
        if actual_cost < lower_cost:
            lower_cost = actual_cost
            best_map = actual_map

    return best_map, lower_cost

def main(inital_states, epochs):
    plt.ion()
    x = []
    y = []

    fig, ax = plt.subplots()
    line, = ax.plot(x, y, "b-o")
    ax.set_xlim(0, TOTAL_POINTS)
    ax.set_ylim(0, 500000)

    list_maps = randomize(map, inital_states)

    for e in range(epochs):
        lower_cost = float("inf")
        for i, m in enumerate(list_maps):
            adjacents = closers(m)
            best_map = best(adjacents)
            list_maps[i] = best_map[0]
            if best_map[1] < lower_cost:
                lower_cost = best_map[1]

        x.append(e)
        y.append(lower_cost)
        line.set_xdata(x)
        line.set_ydata(y)
        ax.relim()
        ax.autoscale_view()
        plt.draw()
        plt.pause(0.5)
        print(f"Epoch: {e + 1}/{epochs}, cost: {lower_cost}")

    plt.ioff()
    plt.show()

    return best(list_maps)

#map = main(INITAL_MAP_STATES, EPOCHS)[0]

list_maps = randomize(map, INITAL_MAP_STATES)

e = 0

plt.ion()
x = []
y = []

fig, ax = plt.subplots()
line, = ax.plot(x, y, "b-o")
ax.set_xlim(0, EPOCHS)
ax.set_ylim(0, 300)

# Main loop
running = True
while running:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
        elif event.type == pygame.KEYDOWN:
            if event.key == pygame.K_ESCAPE:
                running = False

    # Fill the background
    screen.fill(black)

    if e < EPOCHS:

        lower_cost = float("inf")
        best_path = copy(map)
        for i, m in enumerate(list_maps):
            adjacents = closers(m)
            best_map = best(adjacents)
            list_maps[i] = best_map[0]
            if best_map[1] < lower_cost:
                lower_cost = best_map[1]
                best_path = copy(best_map[0])

        x.append(e)
        y.append(lower_cost)
        line.set_xdata(x)
        line.set_ydata(y)
        ax.relim()
        ax.autoscale_view()
        plt.draw()
        plt.pause(0.5)
        print(f"Epoch: {e + 1}/{EPOCHS}, cost: {lower_cost}")

        e += 1
    
    drawMap(best_path)

    # Update the display
    pygame.display.flip()

plt.ioff()
plt.show()

# Quit Pygame
pygame.quit()
sys.exit()

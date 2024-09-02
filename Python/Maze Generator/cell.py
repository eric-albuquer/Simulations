import random

class Cell:
    def __init__(self, i, j) -> None:
        self.i = i
        self.j = j

        self.highlight = False

        self.head_left = False
        self.head_right = False

        self.top = True
        self.bottom = True
        self.right = True
        self.left = True

        self.visited = False

    def check_neighbors(self, grid):
        rows, cols = len(grid), len(grid[0])
        neighbors = []

        for dx, dy in [(1, 0), (-1, 0), (0, 1), (0, -1)]:
            nx, ny = self.j + dx, self.i + dy

            if 0 <= nx < cols and 0 <= ny < rows:

                neighbor = grid[ny][nx]

                if not neighbor.visited:
                    neighbors.append(neighbor)
        
        if len(neighbors) > 0:
            return random.choice(neighbors)
        return -1

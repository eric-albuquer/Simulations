class Point {
    constructor(x, y) {
        this.x = x
        this.y = y
        this.visited = false
    }
}

class Map {
    points = []
    conections = []
    clickedConections = []

    constructor(width, height) {
        this.width = width
        this.height = height
    }

    addPoint(point) {
        this.points.push(point)
    }

    setPoints(points) {
        this.points = points
    }

    findCloser() {
        this.points[0].visited = true
        this.conections = [this.points[0]]

        for (let i = 0; i < this.points.length; i++) {
            const lastPoint = this.conections[this.conections.length - 1]

            let closerDistance = Infinity
            let closer = 0

            for (let j = 0; j < this.points.length; j++) {
                if (this.points[j].visited) continue

                const point = this.points[j]

                const deltaX = point.x - lastPoint.x
                const deltaY = point.y - lastPoint.y

                const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

                if (distance < closerDistance) {
                    closerDistance = distance
                    closer = j
                }
            }

            if (closer !== 0) {
                this.conections.push(this.points[closer])
                this.points[closer].visited = true
            }
        }

        return this.conections
    }

    evaluate(conections) {
        let evaluation = 0

        for (let i = 0; i < conections.length - 1; i++) {
            const deltaX = conections[i].x - conections[i + 1].x
            const deltaY = conections[i].y - conections[i + 1].y

            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
            evaluation += distance
        }
        return evaluation
    }

    evaluateClicked() {
        return this.evaluate(this.clickedConections)
    }

    find2() {
        function evaluate(conections) {
            let evaluation = 0

            for (let i = 0; i < conections.length - 1; i++) {
                const deltaX = conections[i].x - conections[i + 1].x
                const deltaY = conections[i].y - conections[i + 1].y

                const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
                evaluation += distance
            }
            return evaluation
        }

        function shuffleArray(array) {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]]; // Troca os elementos
            }
            return array;
        }

        function copy(conections) {
            return conections.map(c => new Point(c.x, c.y))
        }

        function createConections(conections) {
            conections = copy(conections)
            const start = conections.shift()
            const end = conections.pop()

            const new_conections = shuffleArray(conections)
            new_conections.unshift(start)
            new_conections.push(end)

            return new_conections
        }

        function createSolutions(size, points) {
            const solutions = []

            for (let i = 0; i < size; i++) {
                solutions.push(createConections(points))
            }

            return solutions
        }

        function bestSolution(solutions) {
            let bestSolution = 0
            let bestEvaluation = evaluate(solutions[bestSolution])

            for (let i = 1; i < solutions.length; i++) {
                const actual_evaluation = evaluate(solutions[i])
                if (actual_evaluation < bestEvaluation) {
                    bestSolution = i
                    bestEvaluation = actual_evaluation
                }
            }

            return [solutions[bestSolution], bestEvaluation]
        }

        function permute(startIdx, endIdx, solution) {
            const startElement = solution[startIdx]
            const endElement = solution[endIdx]

            solution[startIdx] = endElement
            solution[endIdx] = startElement

            return solution
        }

        function createNeighbors(bestS, depth = 5) {
            const neighbors = [];

            for (let i = 1; i < bestS.length - 2; i++) {
                for (let j = i + 1; j < bestS.length - 1; j++) {
                    const bestN = copy(bestS);
                    permute(i, j, bestN);

                    if (depth === 0) {
                        neighbors.push(bestN);
                    } else {
                        neighbors.push(...createNeighbors(bestN, depth - 1));
                    }
                }
            }

            neighbors.push(bestS)
            return neighbors;
        }


        function mutate(bestS, rate) {
            const bestCopy = copy(bestS)
            for (let i = 1; i < bestS.length - 1; i++) {
                if (Math.random() < rate) {
                    const other = []
                    for (let j = 1; j < bestS.length - 1; j++) {
                        if (j !== i) other.push(j)
                    }

                    const otherIdx = Math.floor(Math.random() * other.length)
                    const changeGene = other[otherIdx]
                    permute(i, changeGene, bestCopy)
                }
            }

            return bestCopy
        }

        function createNextPop(size, rate, bestS) {
            const new_solutions = [copy(bestS)]
            for (let i = 1; i < size; i++) {
                const bestCopy = copy(bestS)
                const mutated = mutate(bestCopy, rate)
                new_solutions.push(mutated)
            }

            return new_solutions
        }

        function nextGen(gens, solutions) {
            let bestEval = Infinity
            for (let i = 0; i < gens; i++) {
                const bestSE = bestSolution(solutions)
                const bestS = bestSE[0]
                if (bestEval === bestSE[1])
                    break
                
                bestEval = bestSE[1]
                solutions = createNeighbors(bestS, 0)

                
                //solutions = createNextPop(10000, 0.15, bestS)
            }
            const best = bestSolution(solutions)
            return best[0]
        }

        const solutions = createSolutions(1000, this.points)
        const allSolutions = []

        for (const solution of solutions) {
            allSolutions.push(nextGen(100, [solution]))
        }

        const bestS = bestSolution(allSolutions)[0]

        //const bestS = nextGen(100, solutions)
        this.conections = bestS
        console.log(evaluate(bestS))
        return this.conections

    }

    drawArrows() {
        fill(255)
        for (let i = 0; i < this.conections.length; i++) {
            const point = this.conections[i]
            if (i < this.conections.length - 1) {
                let x1, y1, x2, y2
                x1 = point.x
                y1 = point.y
                x2 = this.conections[i + 1].x
                y2 = this.conections[i + 1].y
                this.arrow(x1, y1, x2, y2)
            }
        }

        for (let i = 0; i < this.clickedConections.length; i++) {
            const point = this.clickedConections[i]
            if (i < this.clickedConections.length - 1) {
                let x1, y1, x2, y2
                x1 = point.x
                y1 = point.y
                x2 = this.clickedConections[i + 1].x
                y2 = this.clickedConections[i + 1].y
                this.arrow(x1, y1, x2, y2, [255, 0, 0])
            }
        }
    }

    draw() {
        fill(255)
        stroke(255)
        for (let i = 0; i < this.points.length; i++) {
            const point = this.points[i]
            ellipse(point.x, point.y, 8, 8)
        }
    }

    arrow(x1, y1, x2, y2, color = 255) {
        stroke(color)
        strokeWeight(1);
        line(x1, y1, x2, y2)

        const angle = atan2(y2 - y1, x2 - x1);

        let arrowSize = 15;

        push();
        translate(x2, y2);
        rotate(angle);
        noStroke();
        fill(255);
        triangle(0, 0, -arrowSize, arrowSize / 2, -arrowSize, -arrowSize / 2);
        pop();
    }
}

function createPoints(size, width, height) {
    const points = []

    for (let i = 1; i < size - 1; i++) {
        const x = Math.floor(Math.random() * width)
        const y = Math.floor(Math.random() * height)

        points.push(new Point(x, y))
    }

    points.unshift(new Point(width / 20, height / 20))
    points.push(new Point(width - width / 20, height - height / 20))

    return points
}

document.getElementById('saveButton').addEventListener('click', () => {
    const size = 20;
    const width = 900;
    const height = 900;

    const points = createPoints(size, width, height);

    const json = JSON.stringify(points, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'points.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
});

function loadPoints() {
    fetch('points.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load points');
            }
            return response.json();
        })
        .then(points => {
            map.points = []
            points.forEach(point => {
                map.addPoint(new Point(point.x, point.y))
                // You can perform any further processing here
            });
            map.find2()
        })
        .catch(error => {
            console.error('Error loading points:', error);
        });
}

document.getElementById('loadButton').addEventListener('click', loadPoints);

const WIDTH = 900
const HEIGHT = 900
const map = new Map(WIDTH, HEIGHT)

map.setPoints(createPoints(30, WIDTH, HEIGHT))
map.find2()

function mousePressed() {
    for (const point of map.points) {
        if (Math.abs(mouseX - point.x) < 10 && Math.abs(mouseY - point.y) < 10 && point.visited === false) {
            map.clickedConections.push(point)
            point.visited = true
        }
    }
}

function setup() {
    createCanvas(WIDTH, HEIGHT)
}

function draw() {
    background(0)
    map.draw()
    map.drawArrows()
}

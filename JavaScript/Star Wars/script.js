const width = window.innerWidth
const height = window.innerHeight

const dt = 1e-3
const total = 500

const yellow = [255, 255, 0]
const blue = [0, 0, 255]
const red = [255, 0, 0]
const white = [255, 255, 255]

class Star {
    constructor(x, y, radius, color) {
        this.x = x
        this.y = y
        this.radius = radius
        this.sRadius = radius
        this.color = color
    }

    draw() {
        fill(this.color)
        stroke(this.color)
        circle(this.x, this.y, this.radius)
    }

    update() {
        let dist = Math.sqrt(this.x * this.x + this.y * this.y)
        dist = Math.pow(dist, 1.5)
        const angle = Math.atan2(this.y, this.x)
        this.x += Math.cos(angle) * dist * dt
        this.y += Math.sin(angle) * dist * dt
        this.radius = this.sRadius * dist / (width * 2)

        if (this.x < - width / 2 || this.x > width / 2 || this.y < - height / 2 || this.y > height / 2)
            this.restart()
    }

    restart(){
        this.x = Math.random() * 10 - 5
        this.y = Math.random() * 10 - 5
        this.radius = 0
    }
}

const stars = []

for (let i = 0; i < total; i++) {
    const x = Math.random() * width - width / 2
    const y = Math.random() * height - height / 2
    const radius = Math.random() * 3 + 1
    const c = Math.random()

    let color = white

    if (c < 0.1)color = red 
    else if (c < 0.3) color = blue
    else if (c < 0.5) color = yellow

    stars.push(new Star(x, y, radius, color))
}

function drawAll() {
    for (const s of stars) {
        s.draw()
        s.update()
    }
}

function setup() {
    createCanvas(width, height)
    frameRate(144)
}

function draw() {
    noStroke()
    fill(0, 50)
    rect(0, 0, width, height)
    translate(width / 2, height / 2);
    drawAll()
}

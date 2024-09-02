const G = 1e-3
let dt = 1e-1
const particles = 400
const distanceScale = 6e+10
const senseSeed = Math.random()

const width = window.innerWidth
const height = window.innerHeight
const size = Math.min(width, height)

const sunRadius = 14e+8
const sumMass = 2e+30
const sumDensity = sumMass / sunRadius
const sumColor = [255, 255, 0]

const planetsDensity = 1e+16
const planetsMass = 1e+25

class Vector {
    constructor(x, y) {
        this.x = x
        this.y = y
        this.magnitude = Math.sqrt(x * x + y * y)
        this.thetaX = Math.acos(this.x / this.magnitude)
        this.thetaY = Math.acos(this.y / this.magnitude)
    }

    fx(force) {
        return force * Math.cos(this.thetaY)
    }

    fy(force) {
        return force * Math.cos(this.thetaX)
    }

    normal(sense){
        return new Vector(-this.y * sense, this.x * sense)
    }
}

class Planet {
    constructor(x, y, dx, dy, radius, mass, color) {
        this.x = x
        this.y = y
        this.dx = dx
        this.dy = dy
        this.radius = radius
        this.mass = mass
        this.color = color
    }

    update(dt) {
        this.x += this.dx * dt
        this.y += this.dy * dt
    }

    accelerate(fx, fy) {
        const ax = fx / this.mass
        const ay = fy / this.mass
        this.dx += ax
        this.dy += ay
    }

    draw() {
        fill(this.color)
        circle(this.x / distanceScale * size / 2, this.y / distanceScale * size / 2, this.radius / distanceScale * size / 2)
    }

    colide(other) {
        const dist = distance(this.x, this.y, other.x, other.y)
        if (dist < this.radius / 2 + other.radius / 2) {
            this.mass += other.mass
            this.radius = Math.sqrt(this.radius * this.radius + other.radius * other.radius)
            this.dx = (other.dx * other.mass + this.mass * this.dx) / (this.mass + other.mass)
            this.dy = (other.dy * other.mass + this.mass * this.dy) / (this.mass + other.mass)
            return true
        }
        return false
    }
}

function distance(x1, y1, x2, y2) {
    const deltaX = x2 - x1
    const deltaY = y2 - y1
    return Math.sqrt(deltaX * deltaX + deltaY * deltaY)
}

function gravity(a, b, dt) {
    const vector = new Vector(b.x - a.x, b.y - a.y)
    const force = G * a.mass * b.mass / (vector.magnitude * vector.magnitude)
    const fax = vector.fy(force) * dt
    const fay = vector.fx(force) * dt
    const fbx = -vector.fy(force) * dt
    const fby = -vector.fx(force) * dt
    a.accelerate(fax, fay)
    b.accelerate(fbx, fby)
}

const sun = new Planet(0, 0, 0, 0, sunRadius, sumMass, sumColor)

const planets = [sun]

let initalDx = 0
let initalDy = 0
let totalMass = 0
 
for (let i = 0; i < particles; i++) {
    const x = Math.random() * distanceScale * 2 - distanceScale
    const y = Math.random() * distanceScale * 2 - distanceScale
    const vector = new Vector(x, y)
    const sense = Math.random() < senseSeed ? 1 : -1
    const normalVector = vector.normal(sense)
    const v = Math.sqrt(G * sumMass / vector.magnitude)
    const vy = normalVector.fx(v)
    const vx = normalVector.fy(v)
    const mass = Math.random() * planetsMass
    const radius = mass / planetsDensity
    initalDx += vx / mass
    initalDy += vy / mass
    totalMass += mass
    planets.push(new Planet(x, y, vx, vy, radius, mass, [255, 100, 100]))
}

function centerMass(){
    let centerX = 0
    let centerY = 0

    for (const planet of planets) {
        centerX += planet.x * planet.mass / totalMass
        centerY += planet.y * planet.mass / totalMass
    }

    return {x: centerX, y:centerY}
}

function orbitCenterMass(){
    const cMass = centerMass()
    for (const planet of planets) {
        const vector = new Vector(planet.x - cMass.x, planet.y - cMass.y)
        const sense = Math.random() < 0.4 ? 1 : -1
        const normalVector = vector.normal(sense)
        const v = Math.sqrt(G * totalMass / vector.magnitude)
        planet.dy = normalVector.fx(v) * 0.5
        planet.dx = normalVector.fy(v) * 0.5
    }
}

function gravityAll(dt) {
    for (let i = 0; i < planets.length; i++) {
        const planetA = planets[i]
        for (let j = i + 1; j < planets.length; j++) {
            const planetB = planets[j]
            gravity(planetA, planetB, dt)
            if (planetA.colide(planetB)) planets.splice(j, 1)
        }
        planetA.update(dt)
    }
}

function gravityDiffAll(dt) {
    for (let t = 0; t < 1 / dt; t++) {
        gravityAll(dt)
    }
}

function drawPlanets() {
    for (const planet of planets) {
        planet.draw()
    }
}

let img

function preload(){
    img = loadImage("https://cdn.hswstatic.com/gif/outer-space.jpg")
}

function setup() {
    createCanvas(width, height)
    frameRate(60)
}

//orbitCenterMass()

function draw() {
    tint(100, 80);  // Escurece e deixa a imagem translúcida
    image(img, 0, 0, width, height)
    translate(width / 2, height / 2)
    gravityDiffAll(dt)
    drawPlanets()
    dt = ((1e-1 - 1e-5)/particles) * planets.length + 1e-5
}

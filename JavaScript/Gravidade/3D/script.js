const G = 0.1

class Octree {
    static theta = 0.5
    constructor(x, y, z, size, capacity, hSize = size / 2) {
        this.x = x
        this.y = y
        this.z = z
        this.centerX = 0
        this.centerY = 0
        this.centerZ = 0
        this.mass = 0
        this.size = size
        this.hSize = hSize
        this.capacity = capacity
        this.divided = false
        this.points = []
    }

    getCenterMass() {
        return [
            this.centerX / this.mass,
            this.centerY / this.mass,
            this.centerZ / this.mass,
        ]
    }

    contains(p) {
        return (
            p.x > this.x - this.hSize &&
            p.x <= this.x + this.hSize &&
            p.y > this.y - this.hSize &&
            p.y <= this.y + this.hSize &&
            p.z > this.z - this.hSize &&
            p.z <= this.z + this.hSize
        )
    }

    subdivide() {
        const qSize = this.hSize / 2

        this.boundary = new Array(8)
        let dx, dy, dz
        for (let i = 0; i < 8; i++) {
            dx = i & 1 ? qSize : -qSize
            dy = i & 2 ? qSize : -qSize
            dz = i & 4 ? qSize : -qSize

            this.boundary[i] = new Octree(
                this.x + dx,
                this.y + dy,
                this.z + dz,
                this.hSize,
                this.capacity,
                qSize
            )
        }

        while (this.points.length) {
            const p = this.points.pop()
            for (let i = 0; i < 8; i++) {
                if (this.boundary[i].insert(p))
                    break
            }
        }

        this.divided = true
    }

    insert(p) {
        if (!this.contains(p))
            return false

        this.centerX += p.x * p.mass
        this.centerY += p.y * p.mass
        this.centerZ += p.z * p.mass
        this.mass += p.mass

        if (!this.divided) {
            if (this.points.length < this.capacity) {
                this.points.push(p)
                return true
            }

            this.subdivide()
        }

        for (let i = 0; i < 8; i++) {
            if (this.boundary[i].insert(p))
                return true
        }
    }

    draw() {
        if (!this.divided) {
            push()
            translate(this.x, this.y, this.z)
            noFill()
            stroke(255)
            box(this.size)
            pop()
        } else {
            for (let i = 0; i < 8; i++) {
                this.boundary[i].draw()
            }
        }
    }

    gravity(p) {
        let fx, fy, fz

        fx = fy = fz = 0

        if (!this.mass)
            return { fx, fy, fz }

        const [cx, cy, cz] = this.getCenterMass()

        const dx = cx - p.x
        const dy = cy - p.y
        const dz = cz - p.z

        const dist2 = dx * dx + dy * dy + dz * dz
        const dist = Math.sqrt(dist2)

        if (this.divided) {
            if (this.hSize / dist < Octree.theta) {
                const force = G * p.mass * this.mass / dist2
                fx = force * dx / dist
                fy = force * dy / dist
                fz = force * dz / dist
            } else {
                for (let i = 0; i < 8; i++) {
                    const sForce = this.boundary[i].gravity(p)
                    fx += sForce.fx
                    fy += sForce.fy
                    fz += sForce.fz
                }
            }
        }

        return { fx, fy, fz }
    }
}

class Particle {
    constructor(x, y, z, mass, dx, dy, dz) {
        this.x = x
        this.y = y
        this.z = z
        this.mass = mass
        this.radius = Math.cbrt(mass)
        this.dx = dx
        this.dy = dy
        this.dz = dz
    }

    update() {
        this.x += this.dx
        this.y += this.dy
        this.z += this.dz
    }

    addForce(fx, fy, fz) {
        this.dx += fx / this.mass
        this.dy += fy / this.mass
        this.dz += fz / this.mass
    }

    draw() {
        push()
        translate(this.x, this.y, this.z)
        fill(255, 255, 0)
        sphere(this.radius)
        pop()
    }
}

const totalP = 20000
const M = 10000
const octCapacity = 100
const maxDist = 4000
const drawOct = false
const particles = new Array(totalP)

function setup() {
    createCanvas(window.innerWidth, window.innerHeight, WEBGL)
    createEasyCam()
    noStroke()

    Octree.theta = 0.5

    let x, y, z, mass, dx, dy, dz, r, v

    const m2 = maxDist / 2

    for (let i = 0; i < totalP; i++) {
        x = Math.random() * maxDist - m2
        y = Math.random() * maxDist - m2
        z = Math.random() * maxDist - m2
        r = Math.sqrt(x * x + y * y + z * z);
        mass = Math.random() * 30 + 10
        v = Math.sqrt(G * M / r)
        dx = -v * y / r;  // Velocidade na direção X
        dy = v * x / r;   // Velocidade na direção Y
        dz = Math.random() - 0.5

        particles[i] = new Particle(
            x, y, z, mass, dx, dy, dz
        )
    }
}

function drawP() {
    const oct = new Octree(0, 0, 0, maxDist, octCapacity)
    for (let i = 0; i < particles.length; i++) {
        oct.insert(particles[i])
        particles[i].update()
        particles[i].draw()
    }

    for (let i = 0; i < particles.length; i++) {
        const force = oct.gravity(particles[i])
        particles[i].addForce(force.fx, force.fy, force.fz)
    }

    if (drawOct)
        oct.draw()
}

function draw() {
    background(0)
    drawP()
}

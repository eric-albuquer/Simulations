function setup() {
    createCanvas(window.innerWidth, window.innerHeight)
}

function drawAndares(hospital) {
    textAlign(CENTER, CENTER)
    const andares = hospital.andares
    const salas = hospital.salas
    const leitos = hospital.leitosSala
    for (let i = 0; i < andares; i++) {
        const dx = 2 * width / andares
        const dy = height / 2

        const x = dx * (i % (Math.floor(andares / 2)))
        const y = dy * Math.floor(i / (andares / 2))
        for (let j = 0; j < salas; j++) {
            const ddx = dx / 2 
            const ddy = dy / (salas / 2) 

            const xx = ddx * Math.floor(j / (salas / 2)) + x
            const yy = ddy * (j % (salas / 2)) + y
            stroke(0, 0, 255)
            for (let k = 0; k < leitos; k++) {
                const dddx = ddx / leitos
                const xxx = k * dddx + xx
                strokeWeight(0.1)
                const idx = i * salas * leitos + j * leitos + k
                const tempo = hospital.leitos[idx].previsaoAlta
                if (hospital.leitos[idx].condicao)
                    fill(255, 255, 0)
                else 
                    fill(0)
                rect(xxx, yy, xxx + dddx, yy + ddy)
                strokeWeight(1)
                textSize(12)
                fill(0, 0, 255)
                text(idx, xxx + dddx / 2, yy + ddy / 2)
                noFill()
            }
            stroke(255, 0, 0)
            strokeWeight(2)
            rect(xx, yy, xx + ddx, yy + ddy)
        }
        stroke(255)
        strokeWeight(5)
        rect(x, y, x + dx, y + dy)
        noStroke()
        fill(255)
        textSize(20)
        if (i < andares)
            text(`Andar ${i + 1}`, x + dx / 2, y + dy / 2)
    }
}

function draw() {
    background(0)
    drawAndares(portugues)
}
function setup() {
    createCanvas(window.innerWidth, window.innerHeight)
    textAlign(CENTER, CENTER)
}

function drawAndares(hospital) {
    portugues.forward()
    if (frameCount % 60 === 0) {
        increase()
        portugues.limparLeitos()
    }

    if (frameCount % 240 === 0) {
        portugues.prevAlta()
        portugues.checkPay()
    }

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
            
            for (let k = 0; k < leitos; k++) {
                const dddx = ddx / leitos
                const xxx = k * dddx + xx
                const idx = i * salas * leitos + j * leitos + k
                const cor = colorHours(dataAtual, hospital.leitos[idx].previsaoAlta)

                if (hospital.leitos[idx].reinternacao) {
                    fill(cor, cor, 0)
                }
                else if (hospital.leitos[idx].previsaoAlta) {
                    fill(0, cor, 0)
                }
                else if (hospital.leitos[idx].podePagar()) {
                    fill(0, 255, 255)
                }
                else if (hospital.leitos[idx].prevAlta()) {
                    fill(0, 0, 255)
                }
                else if (hospital.leitos[idx].condicao === Condicao.limpeza) {
                    fill(255, 0, 255)
                }
                else {
                    fill(0)
                }
                stroke(0, 0, 255)

                rect(xxx, yy, xxx + dddx, yy + ddy)
                strokeWeight(1)
                textSize(12)
                stroke(0)
                fill(0)
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
        textSize(30)
        if (i < andares)
            text(`Andar ${i + 1}`, x + dx / 2, y + dy / 2)
    }

    textSize(20)
    text(dataAtual, 300, 20)
}

function draw() {
    background(0)
    drawAndares(portugues)
}

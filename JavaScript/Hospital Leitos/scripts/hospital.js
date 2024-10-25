class Hospital {
    constructor(andares, salas, leitosSala) {
        this.andares = andares
        this.salas = salas
        this.leitosSala = leitosSala

        this.listaEspera = []
        for (let i = 0; i < 10; i++) {
            this.listaEspera[i] = []
        }

        this.leitos = []
        this.quantLeitos = andares * salas * leitosSala

        for (let i = 0; i < andares; i++) {
            for (let j = 0; j < salas; j++) {
                for (let k = 0; k < leitosSala; k++) {
                    const tipoLeito = j % 5
                    const equip = []
                    for (const key in Equipamentos) {
                        if (Math.random() < 0.9)
                            equip.push(Equipamentos[key])
                    }
                    this.leitos.push(
                        new Leito(
                            Condicao.livre,
                            null,
                            i * salas * leitosSala + j * leitosSala + k,
                            tipoLeito,
                            `Piso ${i}, sala ${j + 1}, leito ${k + 1}`,
                            null,
                            null,
                            equip,
                            []
                        )
                    )
                }
            }
        }
    }

    leitosLivres() {
        let c = 0
        for (const l of this.leitos) {
            if (l.livre())
                c++
        }
        return c
    }

    toString() {
        for (const leito of this.leitos) {
            console.log(leito.toString(), "\n")
        }
    }

    getPaciente(paciente) {
        const gravidade = paciente.gravidade
        this.listaEspera[gravidade].unshift(paciente)
    }

    procurarLeito(paciente) {
        const leitosIdx = []
        for (let i = 0; i < this.leitos.length; i++) {
            const leito = this.leitos[i]
            if (leito.podeReceber(paciente)) {
                if (leito.livre()) return i
                leitosIdx.push(i)
            }
        }
        return leitosIdx
    }

    esperaPessoas() {
        let total = 0
        for (let i = 0; i < 10; i++) {
            total += this.listaEspera[i].length
        }
        return total
    }

    possuiEspera() {
        return this.esperaPessoas() > 0
    }

    prioridadeEspera() {
        let paciente = null
        for (let i = 9; i >= 0; i--) {
            if (this.listaEspera[i].length)
                paciente = this.listaEspera[i].pop()
        }
        return paciente
    }

    checkPay(){
        for (const leito of this.leitos) {
            if (leito.podePagar()){
                leito.paciente.pagar()
            }
        }
    }

    prevAlta() {
        for (let i = 0; i < this.quantLeitos; i++) {
            if (this.leitos[i].prevAlta() && Math.random() < 0.5) {
                const paciente = this.leitos[i].paciente
                const gravidade = paciente.gravidade
                const dias = gravidade * Math.random() * 4 + 1
                const alta = new Date(dataAtual)
                alta.setDate(alta.getDate() + dias)
                this.leitos[i].previsaoAlta = alta
            }
        }
    }

    alta() {
        for (let i = 0; i < this.quantLeitos; i++) {
            if (this.leitos[i].previsaoAlta) {
                const time = this.leitos[i].previsaoAlta - dataAtual
                if (time < 0) {
                    if (Math.random() < 0.2) {
                        const alta = new Date(dataAtual)
                        const dias = Math.floor(Math.random() * 3 + 1)
                        this.leitos[i].reinternacao = true
                        this.leitos[i].previsaoAlta.setDate(alta.getDate() + dias)
                    } else {
                        this.leitos[i].liberarPaciente()
                    }

                }
            }
        }
    }

    buscarReinternacao() {
        const leitos = []
        for (let i = 0; i < this.quantLeitos; i++) {
            if (this.leitos[i].reinternacao)
                leitos.push(i)
        }

        return leitos
    }

    leitosALimpar() {
        const leitos = []
        for (const leito of this.leitos) {
            if (leito.condicao === Condicao.limpeza)
                leitos.push(leito.localizacao)
        }
        return leitos
    }

    limparLeitos() {
        for (const leito of this.leitos) {
            if (leito.condicao === Condicao.limpeza && Math.random() < 0.1) {
                leito.condicao = Condicao.livre
            }
        }
    }

    semAlta(){
        const leitos = []
        for (const leito of this.leitos) {
            if (leito.prevAlta())
                leitos.push(leito)
        }
        return leitos
    }

    forward() {
        this.alta()
        const paciente = this.prioridadeEspera()
        if (!paciente) return
        const leitoIdx = this.procurarLeito(paciente)
        if (Array.isArray(leitoIdx)) {
            this.getPaciente(paciente)
            return leitoIdx
        }
        this.leitos[leitoIdx].addPaciente(paciente, dataAtual, null)
        return leitoIdx
    }
}

class Leito {
    constructor(condicao, paciente, id, tipo, localizacao, dataOcupacao, previsaoAlta, equipamentos, historico) {
        this.condicao = condicao
        this.paciente = paciente
        this.id = id
        this.tipo = tipo
        this.localizacao = localizacao
        this.dataOcupacao = dataOcupacao
        this.previsaoAlta = previsaoAlta
        this.equipamentos = equipamentos || []
        this.historico = historico || []
    }

    toString() {
        const strCond = keyName(Condicao, this.condicao)
        const strTipo = keyName(TipoLeito, this.tipo)
        const equipD = []
        for (const e of this.equipamentos) {
            equipD.push(keyName(Equipamentos, e))
        }
        let text = `Condição: ${strCond}\nPaciente: \n\n${this.paciente ? this.paciente.toString() : "sem paciente"}\n\nId: ${this.id}\nTipo do leito: ${strTipo}\nLocalização: ${this.localizacao}\nData de ocupação: ${this.dataOcupacao ? this.dataOcupacao : "sem data de ocupação"}\nPrevisão de alta: ${this.previsaoAlta ? this.previsaoAlta : "sem previsão de data"}\nEquipamentos disponíveis: ${equipD.join(", ")}\nHistórico médico: ${this.historico.length > 0 ? this.historico.join(", ") : "histórico vazio"}`
        return text
    }

    addEquip(equip) {
        if (!this.possuiEquip(equip))
            this.equipamentos.push(equip)
    }

    removeEquip(equip) {
        for (let i = 0; i < this.equipamentos.length; i++) {
            if (this.equipamentos[i] === equip) {
                this.equipamentos.splice(i, 1)
                return true
            }
        }
        return false
    }

    possuiEquip(equipamentos) {
        for (const e of equipamentos) {
            let possui = false
            for (const le of this.equipamentos) {
                if (e === le)
                    possui = true
            }
            if (!possui) return false
        }
        return true
    }

    livre() {
        return this.condicao === Condicao.livre
    }

    podeReceber(paciente) {
        if (!this.possuiEquip(paciente.necessidadeEquip))
            return false
        if (this.tipo !== paciente.necessidadeLeito)
            return false
        return true
    }

    addPaciente(paciente, dataOcupacao, dataAlta) {
        this.paciente = paciente
        this.dataOcupacao = dataOcupacao
        this.dataAlta = dataAlta
        this.condicao = Condicao.ocupado
    }

    prevAlta(){
        return this.condicao === Condicao.ocupado && !this.previsaoAlta
    }

    limpar() {
        this.condicao = Condicao.limpeza
    }

    desativar() {
        this.condicao = Condicao.desativado
    }

    manutencao() {
        this.condicao = Condicao.manutencao
    }

    liberar() {
        this.condicao = Condicao.livre
    }

    liberarPaciente() {
        if (this.livre())
            return false

        this.historico.push({
            paciente: this.paciente,
            dataEntrada: this.dataOcupacao,
            dataAlta: this.dataAlta
        })

        this.paciente = null
        const prob = Math.random()
        if (prob < 0.01)
            this.desativar()
        else if (prob < 0.1)
            this.manutencao()
        else
            this.limpar()

        this.dataOcupacao = null
        this.dataAlta = null
    }
}
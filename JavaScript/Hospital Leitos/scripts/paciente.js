class Paciente {
    constructor(nome, idade, sexo, peso, registo, tipoInternacao, diagnostico, historico, necessidadeEquip, necessidadeLeito, planoSaude, statusPagamento, gravidade) {
        this.nome = nome
        this.idade = idade
        this.sexo = sexo
        this.peso = peso
        this.registo = registo
        this.tipoInternacao = tipoInternacao
        this.diagnostico = diagnostico
        this.historico = historico || []
        this.necessidadeEquip = necessidadeEquip || []
        this.necessidadeLeito = necessidadeLeito
        this.planoSaude = planoSaude
        this.statusPagamento = statusPagamento
        this.gravidade = gravidade
    }

    toString() {
        const strSexo = this.sexo === Sexo.masculino ? "masculino" : "feminino"
        const strTipoInt = keyName(TipoInternacao, this.tipoInternacao)
        const strLeito = keyName(TipoLeito, this.necessidadeLeito)
        const strNE = []
        for (const e of this.necessidadeEquip) {
            strNE.push(keyName(Equipamentos, e))
        }
        let text = `Nome: ${this.nome}\nIdade: ${this.idade}\nPeso: ${this.peso} kg\nSexo: ${strSexo}\nNúmero registro: ${this.registo}\nTipo da internação: ${strTipoInt}\nDiagnóstico: ${this.diagnostico}\nHistórico médico: ${this.historico.length > 0 ? this.historico.join(", ") : "histórico vazio"}\nNecessidade de Equipamentos: ${strNE.join(", ")}\nNecessidade de leito: ${strLeito}\nGravidade (0 - 9): ${this.gravidade}\nPlano de sáude: ${this.planoSaude ? "possui" : "não possui"}\nStatus do pagamento: ${this.statusPagamento ? "pago" : "não pago"}`

        return text
    }
}
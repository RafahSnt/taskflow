export class Tarefa {
  constructor(id, titulo, descricao, prioridade, prazo, responsavelId, status = 'A Fazer') {
    this.id = id;
    this.titulo = titulo;
    this.descricao = descricao;
    this.prioridade = prioridade;
    this.prazo = prazo;
    this.responsavelId = responsavelId;
    this.status = status;
  }
}
export function filtrarTarefas(tarefas, filtros) {
  return tarefas.filter((tarefa) => {
    const filtroResponsavel = filtros.responsavelId
      ? String(tarefa.responsavelId) === String(filtros.responsavelId)
      : true;

    const filtroStatus = filtros.status
      ? tarefa.status === filtros.status
      : true;

    const filtroPrioridade = filtros.prioridade
      ? tarefa.prioridade === filtros.prioridade
      : true;

    return filtroResponsavel && filtroStatus && filtroPrioridade;
  });
}

export function calcularRelatorio(tarefas) {
  const total = tarefas.length;
  const concluidas = tarefas.filter((t) => t.status === 'Concluído').length;
  const emAndamento = tarefas.filter((t) => t.status === 'Em Andamento').length;
  const aFazer = tarefas.filter((t) => t.status === 'A Fazer').length;

  return {
    total,
    concluidas,
    emAndamento,
    aFazer,
  };
}
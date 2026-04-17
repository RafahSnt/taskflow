import { useState } from 'react';
import './App.css';
import { Usuario } from './models/Usuario';
import { Tarefa } from './models/Tarefa';
import { filtrarTarefas, calcularRelatorio } from './services/taskService';

function App() {
  const [usuarios, setUsuarios] = useState([
    new Usuario(1, 'João Silva', 'joao@email.com', 'Desenvolvedor'),
    new Usuario(2, 'Maria Souza', 'maria@email.com', 'Analista'),
  ]);

  const [tarefas, setTarefas] = useState([
    new Tarefa(
      1,
      'Implementar tela de login',
      'Criar formulário de autenticação',
      'Alta',
      '2026-04-10',
      1,
      'A Fazer'
    ),
    new Tarefa(
      2,
      'Criar API',
      'Desenvolver endpoint inicial',
      'Alta',
      '2026-04-12',
      1,
      'Em Andamento'
    ),
    new Tarefa(
      3,
      'Documentar fluxo',
      'Escrever documentação básica',
      'Média',
      '2026-04-15',
      2,
      'Concluído'
    ),
  ]);

  const [novoUsuario, setNovoUsuario] = useState({
    nome: '',
    email: '',
    funcao: '',
  });

  const [novaTarefa, setNovaTarefa] = useState({
    titulo: '',
    descricao: '',
    prioridade: 'Média',
    prazo: '',
    responsavelId: '',
    status: 'A Fazer',
  });

  const [filtros, setFiltros] = useState({
    responsavelId: '',
    status: '',
    prioridade: '',
  });

  function cadastrarUsuario(e) {
    e.preventDefault();

    if (!novoUsuario.nome || !novoUsuario.email || !novoUsuario.funcao) {
      alert('Preencha todos os campos do usuário.');
      return;
    }

    const usuario = new Usuario(
      Date.now(),
      novoUsuario.nome,
      novoUsuario.email,
      novoUsuario.funcao
    );

    setUsuarios([...usuarios, usuario]);
    setNovoUsuario({ nome: '', email: '', funcao: '' });
  }

  function cadastrarTarefa(e) {
    e.preventDefault();

    if (
      !novaTarefa.titulo ||
      !novaTarefa.descricao ||
      !novaTarefa.prioridade ||
      !novaTarefa.prazo ||
      !novaTarefa.responsavelId ||
      !novaTarefa.status
    ) {
      alert('Preencha todos os campos da tarefa.');
      return;
    }

    const tarefa = new Tarefa(
      Date.now(),
      novaTarefa.titulo,
      novaTarefa.descricao,
      novaTarefa.prioridade,
      novaTarefa.prazo,
      Number(novaTarefa.responsavelId),
      novaTarefa.status
    );

    setTarefas([...tarefas, tarefa]);
    setNovaTarefa({
      titulo: '',
      descricao: '',
      prioridade: 'Média',
      prazo: '',
      responsavelId: '',
      status: 'A Fazer',
    });
  }
  function alterarStatusTarefa(id, novoStatus) {
    const listaAtualizada = tarefas.map((tarefa) =>
      tarefa.id === id ? { ...tarefa, status: novoStatus } : tarefa
    );

    setTarefas(listaAtualizada);
  }

  function buscarNomeResponsavel(responsavelId) {
    const usuario = usuarios.find((u) => u.id === responsavelId);
    return usuario ? usuario.nome : 'Não encontrado';
  }

  const tarefasFiltradas = filtrarTarefas(tarefas, filtros);
  const relatorio = calcularRelatorio(tarefas);

  return (
    <div className="container">
      <header className="header">
        <h1>TaskFlow</h1>
        <p>Sistema simples de gestão de tarefas</p>
      </header>

      <section className="grid-2">
        <div className="card">
          <h2>Cadastro de Usuários</h2>
          <form onSubmit={cadastrarUsuario} className="form">
            <input
              type="text"
              placeholder="Nome"
              value={novoUsuario.nome}
              onChange={(e) => setNovoUsuario({ ...novoUsuario, nome: e.target.value })}
            />
            <input
              type="email"
              placeholder="Email"
              value={novoUsuario.email}
              onChange={(e) => setNovoUsuario({ ...novoUsuario, email: e.target.value })}
            />
            <input
              type="text"
              placeholder="Função"
              value={novoUsuario.funcao}
              onChange={(e) => setNovoUsuario({ ...novoUsuario, funcao: e.target.value })}
            />
            <button type="submit">Cadastrar Usuário</button>
          </form>
        </div>

        <div className="card">
          <h2>Cadastro de Tarefas</h2>
          <form onSubmit={cadastrarTarefa} className="form">
            <input
              type="text"
              placeholder="Título"
              value={novaTarefa.titulo}
              onChange={(e) => setNovaTarefa({ ...novaTarefa, titulo: e.target.value })}
            />
            <textarea
              placeholder="Descrição"
              value={novaTarefa.descricao}
              onChange={(e) => setNovaTarefa({ ...novaTarefa, descricao: e.target.value })}
            />
            <select
              value={novaTarefa.prioridade}
              onChange={(e) => setNovaTarefa({ ...novaTarefa, prioridade: e.target.value })}
            >
              <option value="Alta">Alta</option>
              <option value="Média">Média</option>
              <option value="Baixa">Baixa</option>
            </select>
            <input
              type="date"
              value={novaTarefa.prazo}
              onChange={(e) => setNovaTarefa({ ...novaTarefa, prazo: e.target.value })}
            />
            <select
              value={novaTarefa.responsavelId}
              onChange={(e) =>
                setNovaTarefa({ ...novaTarefa, responsavelId: e.target.value })
              }
            >
              <option value="">Selecione o responsável</option>
              {usuarios.map((usuario) => (
                <option key={usuario.id} value={usuario.id}>
                  {usuario.nome}
                </option>
              ))}
            </select>
            <select
              value={novaTarefa.status}
              onChange={(e) => setNovaTarefa({ ...novaTarefa, status: e.target.value })}
            >
              <option value="A Fazer">A Fazer</option>
              <option value="Em Andamento">Em Andamento</option>
              <option value="Concluído">Concluído</option>
            </select>
            <button type="submit">Cadastrar Tarefa</button>
          </form>
        </div>
      </section>

      <section className="card">
        <h2>Filtros</h2>
        <div className="filters">
          <select
            value={filtros.responsavelId}
            onChange={(e) => setFiltros({ ...filtros, responsavelId: e.target.value })}
          >
            <option value="">Todos os responsáveis</option>
            {usuarios.map((usuario) => (
              <option key={usuario.id} value={usuario.id}>
                {usuario.nome}
              </option>
            ))}
          </select>

          <select
            value={filtros.status}
            onChange={(e) => setFiltros({ ...filtros, status: e.target.value })}
          >
            <option value="">Todos os status</option>
            <option value="A Fazer">A Fazer</option>
            <option value="Em Andamento">Em Andamento</option>
            <option value="Concluído">Concluído</option>
          </select>
           <select
            value={filtros.prioridade}
            onChange={(e) => setFiltros({ ...filtros, prioridade: e.target.value })}
          >
            <option value="">Todas as prioridades</option>
            <option value="Alta">Alta</option>
            <option value="Média">Média</option>
            <option value="Baixa">Baixa</option>
          </select>

          <button
            type="button"
            className="secondary"
            onClick={() =>
              setFiltros({
                responsavelId: '',
                status: '',
                prioridade: '',
              })
            }
          >
            Limpar filtros
          </button>
        </div>
      </section>

      <section className="grid-2">
        <div className="card">
          <h2>Relatório</h2>
          <div className="report">
            <p><strong>Total de tarefas:</strong> {relatorio.total}</p>
            <p><strong>Concluídas:</strong> {relatorio.concluidas}</p>
            <p><strong>Em andamento:</strong> {relatorio.emAndamento}</p>
            <p><strong>A fazer:</strong> {relatorio.aFazer}</p>
          </div>
        </div>

        <div className="card">
          <h2>Usuários cadastrados</h2>
          <ul className="list">
            {usuarios.map((usuario) => (
              <li key={usuario.id}>
                <strong>{usuario.nome}</strong> — {usuario.email} — {usuario.funcao}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="card">
        <h2>Lista de Tarefas</h2>
        {tarefasFiltradas.length === 0 ? (
          <p>Nenhuma tarefa encontrada.</p>
        ) : (
          <div className="task-list">
            {tarefasFiltradas.map((tarefa) => (
              <div key={tarefa.id} className="task-item">
                <h3>{tarefa.titulo}</h3>
                <p><strong>Descrição:</strong> {tarefa.descricao}</p>
                <p><strong>Prioridade:</strong> {tarefa.prioridade}</p>
                <p><strong>Prazo:</strong> {tarefa.prazo}</p>
                <p><strong>Responsável:</strong> {buscarNomeResponsavel(tarefa.responsavelId)}</p>
                <p><strong>Status:</strong> {tarefa.status}</p>

                <select
                  value={tarefa.status}
                  onChange={(e) => alterarStatusTarefa(tarefa.id, e.target.value)}
                >
                  <option value="A Fazer">A Fazer</option>
                  <option value="Em Andamento">Em Andamento</option>
                  <option value="Concluído">Concluído</option>
                </select>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default 

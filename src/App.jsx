import { useState } from 'react';
import './App.css';
import { Usuario } from './models/Usuario';
import { Tarefa } from './models/Tarefa';
import { filtrarTarefas, calcularRelatorio } from './services/taskService';

function App() {
  const [usuarios, setUsuarios] = useState([
    new Usuario(1, 'João Silva', '12345678', 'Desenvolvedor'),
    new Usuario(2, 'Maria Souza', '87654321', 'Analista'),
  ]);

  const [tarefas, setTarefas] = useState([
    new Tarefa(1,'Implementar tela de login','Criar formulário de autenticação','Alta','2026-04-10',1,'A Fazer'),
    new Tarefa(2,'Criar API','Desenvolver endpoint inicial','Alta','2026-04-12',1,'Em Andamento'),
    new Tarefa(3,'Documentar fluxo','Escrever documentação básica','Média','2026-04-15',2,'Concluído'),
  ]);

  const [novoUsuario, setNovoUsuario] = useState({
    nome: '',
    matricula: '',
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

    if (!novoUsuario.nome || !novoUsuario.matricula || !novoUsuario.funcao) {
      alert('Preencha todos os campos do usuário.');
      return;
    }

    if (!/^\d{8}$/.test(novoUsuario.matricula)) {
      alert('A matrícula deve conter exatamente 8 dígitos numéricos.');
      return;
    }

    const usuario = new Usuario(
      Date.now(),
      novoUsuario.nome,
      novoUsuario.matricula,
      novoUsuario.funcao
    );

    setUsuarios([...usuarios, usuario]);
    setNovoUsuario({ nome: '', matricula: '', funcao: '' });
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
              type="text"
              placeholder="Matrícula (8 dígitos)"
              maxLength={8}
              value={novoUsuario.matricula}
              onChange={(e) =>
                setNovoUsuario({
                  ...novoUsuario,
                  matricula: e.target.value.replace(/\D/g, ''),
                })
              }
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

        {/* restante do código permanece igual */}

        <div className="card">
          <h2>Usuários cadastrados</h2>
          <ul className="list">
            {usuarios.map((usuario) => (
              <li key={usuario.id}>
                <strong>{usuario.nome}</strong> — Matrícula: {usuario.matricula} — {usuario.funcao}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}

export default App;

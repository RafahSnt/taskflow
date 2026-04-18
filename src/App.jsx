import { useState, useEffect } from 'react';
import './App.css';
import Login from './Login';

const API = 'http://localhost:3001/api';

async function api(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.erro || 'Erro na requisição');
  }
  return res.json();
}

function filtrarTarefas(tarefas, filtros) {
  return tarefas.filter((t) => {
    if (filtros.responsavelId && String(t.responsavelId) !== String(filtros.responsavelId)) return false;
    if (filtros.status && t.status !== filtros.status) return false;
    if (filtros.prioridade && t.prioridade !== filtros.prioridade) return false;
    return true;
  });
}

function calcularRelatorio(tarefas) {
  return {
    total: tarefas.length,
    concluidas: tarefas.filter((t) => t.status === 'Concluído').length,
    emAndamento: tarefas.filter((t) => t.status === 'Em Andamento').length,
    aFazer: tarefas.filter((t) => t.status === 'A Fazer').length,
  };
}

export default function App() {
  const [usuarioLogado, setUsuarioLogado] = useState(() => {
    const salvo = localStorage.getItem('usuarioLogado');
    return salvo ? JSON.parse(salvo) : null;
  });

  const [usuarios, setUsuarios] = useState([]);
  const [tarefas, setTarefas] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [docAberta, setDocAberta] = useState(null);
  const [docConteudo, setDocConteudo] = useState('');
  const [gerandoDoc, setGerandoDoc] = useState(false);

  const [novoUsuario, setNovoUsuario] = useState({ nome: '', email: '', funcao: '' });
  const [novaTarefa, setNovaTarefa] = useState({
    titulo: '', descricao: '', prioridade: 'Alta', prazo: '', responsavelId: '', status: 'A Fazer',
  });
  const [filtros, setFiltros] = useState({ responsavelId: '', status: '', prioridade: '' });

  const tarefasFiltradas = filtrarTarefas(tarefas, filtros);
  const relatorio = calcularRelatorio(tarefas);

  useEffect(() => {
    if (usuarioLogado) carregarDados();
  }, [usuarioLogado]);

  async function carregarDados() {
    setCarregando(true);
    try {
      const [u, t] = await Promise.all([api('/usuarios'), api('/tarefas')]);
      setUsuarios(u);
      setTarefas(t);
    } catch (err) {
      alert('Erro ao carregar dados: ' + err.message);
    }
    setCarregando(false);
  }

  function handleLogin(usuario) {
    setUsuarioLogado(usuario);
  }

  function handleLogout() {
    localStorage.removeItem('usuarioLogado');
    setUsuarioLogado(null);
    setUsuarios([]);
    setTarefas([]);
  }

  function buscarNomeResponsavel(id) {
    const u = usuarios.find((u) => u.id === Number(id));
    return u ? u.nome : 'Desconhecido';
  }

  async function cadastrarUsuario(e) {
    e.preventDefault();
    if (!novoUsuario.nome || !novoUsuario.email || !novoUsuario.funcao) {
      alert('Preencha todos os campos.');
      return;
    }
    try {
      const criado = await api('/usuarios', {
        method: 'POST',
        body: JSON.stringify(novoUsuario),
      });
      setUsuarios([...usuarios, criado]);
      setNovoUsuario({ nome: '', email: '', funcao: '' });
    } catch (err) {
      alert(err.message);
    }
  }

  async function cadastrarTarefa(e) {
    e.preventDefault();
    if (!novaTarefa.titulo || !novaTarefa.responsavelId) {
      alert('Preencha título e responsável.');
      return;
    }
    try {
      const criada = await api('/tarefas', {
        method: 'POST',
        body: JSON.stringify(novaTarefa),
      });
      setTarefas([...tarefas, criada]);
      setNovaTarefa({ titulo: '', descricao: '', prioridade: 'Alta', prazo: '', responsavelId: '', status: 'A Fazer' });
    } catch (err) {
      alert(err.message);
    }
  }

  async function alterarStatusTarefa(id, novoStatus) {
    try {
      const atualizada = await api(`/tarefas/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: novoStatus }),
      });
      setTarefas(tarefas.map((t) => (t.id === id ? atualizada : t)));
    } catch (err) {
      alert(err.message);
    }
  }

  async function gerarDocumentacao(tarefa) {
    setDocAberta(tarefa);
    setDocConteudo('');
    setGerandoDoc(true);
    try {
      const res = await api(`/tarefas/${tarefa.id}/documentar`, { method: 'POST' });
      setDocConteudo(res.documentacao);
    } catch (err) {
      setDocConteudo('Erro ao gerar documentação: ' + err.message);
    }
    setGerandoDoc(false);
  }

  if (!usuarioLogado) return <Login onLogin={handleLogin} />;

  return (
    <div className="container">
      {/* Header com info do usuário */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '1rem 0', marginBottom: '1rem', borderBottom: '1px solid #eee',
      }}>
        <h1 style={{ margin: 0 }}>Gerenciador de Tarefas</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 14, color: '#555' }}>
            Olá, <strong>{usuarioLogado.nome}</strong> ({usuarioLogado.funcao})
          </span>
          <button
            onClick={handleLogout}
            style={{
              padding: '6px 14px', background: '#fff', border: '1px solid #ddd',
              borderRadius: 8, cursor: 'pointer', fontSize: 13, color: '#444',
            }}
          >
            Sair
          </button>
        </div>
      </div>

      {carregando && <p style={{ textAlign: 'center', color: '#888' }}>Carregando dados...</p>}

      <section className="grid-2">
        <div className="card">
          <h2>Cadastro de Usuário</h2>
          <form onSubmit={cadastrarUsuario} className="form">
            <input type="text" placeholder="Nome" value={novoUsuario.nome}
              onChange={(e) => setNovoUsuario({ ...novoUsuario, nome: e.target.value })} />
            <input type="email" placeholder="Email" value={novoUsuario.email}
              onChange={(e) => setNovoUsuario({ ...novoUsuario, email: e.target.value })} />
            <input type="text" placeholder="Função" value={novoUsuario.funcao}
              onChange={(e) => setNovoUsuario({ ...novoUsuario, funcao: e.target.value })} />
            <button type="submit">Cadastrar Usuário</button>
          </form>
        </div>

        <div className="card">
          <h2>Cadastro de Tarefas</h2>
          <form onSubmit={cadastrarTarefa} className="form">
            <input type="text" placeholder="Título" value={novaTarefa.titulo}
              onChange={(e) => setNovaTarefa({ ...novaTarefa, titulo: e.target.value })} />
            <textarea placeholder="Descrição" value={novaTarefa.descricao}
              onChange={(e) => setNovaTarefa({ ...novaTarefa, descricao: e.target.value })} />
            <select value={novaTarefa.prioridade}
              onChange={(e) => setNovaTarefa({ ...novaTarefa, prioridade: e.target.value })}>
              <option value="Alta">Alta</option>
              <option value="Média">Média</option>
              <option value="Baixa">Baixa</option>
            </select>
            <input type="date" value={novaTarefa.prazo}
              onChange={(e) => setNovaTarefa({ ...novaTarefa, prazo: e.target.value })} />
            <select value={novaTarefa.responsavelId}
              onChange={(e) => setNovaTarefa({ ...novaTarefa, responsavelId: e.target.value })}>
              <option value="">Selecione o responsável</option>
              {usuarios.map((u) => (
                <option key={u.id} value={u.id}>{u.nome}</option>
              ))}
            </select>
            <select value={novaTarefa.status}
              onChange={(e) => setNovaTarefa({ ...novaTarefa, status: e.target.value })}>
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
          <select value={filtros.responsavelId}
            onChange={(e) => setFiltros({ ...filtros, responsavelId: e.target.value })}>
            <option value="">Todos os responsáveis</option>
            {usuarios.map((u) => <option key={u.id} value={u.id}>{u.nome}</option>)}
          </select>
          <select value={filtros.status}
            onChange={(e) => setFiltros({ ...filtros, status: e.target.value })}>
            <option value="">Todos os status</option>
            <option value="A Fazer">A Fazer</option>
            <option value="Em Andamento">Em Andamento</option>
            <option value="Concluído">Concluído</option>
          </select>
          <select value={filtros.prioridade}
            onChange={(e) => setFiltros({ ...filtros, prioridade: e.target.value })}>
            <option value="">Todas as prioridades</option>
            <option value="Alta">Alta</option>
            <option value="Média">Média</option>
            <option value="Baixa">Baixa</option>
          </select>
          <button type="button" className="secondary"
            onClick={() => setFiltros({ responsavelId: '', status: '', prioridade: '' })}>
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
            {usuarios.map((u) => (
              <li key={u.id}>
                <strong>{u.nome}</strong> — {u.email} — {u.funcao}
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

                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
                  <select value={tarefa.status}
                    onChange={(e) => alterarStatusTarefa(tarefa.id, e.target.value)}>
                    <option value="A Fazer">A Fazer</option>
                    <option value="Em Andamento">Em Andamento</option>
                    <option value="Concluído">Concluído</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => gerarDocumentacao(tarefa)}
                    style={{
                      padding: '6px 12px',
                      background: '#1a1a2e',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontSize: 13,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Gerar Documentação IA
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Modal de Documentação */}
      {docAberta && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem',
        }}>
          <div style={{
            background: '#fff', borderRadius: 16, maxWidth: 680, width: '100%',
            maxHeight: '85vh', overflow: 'auto', padding: '2rem',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 20 }}>Documentação da Tarefa</h2>
                <p style={{ margin: '4px 0 0', color: '#666', fontSize: 14 }}>{docAberta.titulo}</p>
              </div>
              <button
                onClick={() => { setDocAberta(null); setDocConteudo(''); }}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 22, color: '#888', lineHeight: 1,
                }}
              >
                ✕
              </button>
            </div>

            {gerandoDoc ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
                <p>Gerando documentação com IA...</p>
              </div>
            ) : (
              <div style={{
                background: '#f8f8f8', borderRadius: 10, padding: '1.5rem',
                fontSize: 14, lineHeight: 1.8, whiteSpace: 'pre-wrap', fontFamily: 'monospace',
              }}>
                {docConteudo}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

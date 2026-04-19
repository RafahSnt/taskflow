import { useState, useEffect } from 'react';
import Login from './Login';
import { supabase } from './supabase';

function filtrarTarefas(tarefas, filtros) {
  return tarefas.filter((t) => {
    if (filtros.responsavelId && String(t.responsavel_id) !== String(filtros.responsavelId)) return false;
    if (filtros.status && t.status !== filtros.status) return false;
    if (filtros.prioridade && t.prioridade !== filtros.prioridade) return false;
    return true;
  });
}

const estiloCard = {
  background: '#fff',
  borderRadius: 16,
  border: '1px solid #ebebeb',
  padding: '1.5rem',
  marginBottom: '1.5rem',
};

const estiloInput = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: 10,
  border: '1.5px solid #e8e8e8',
  fontSize: 14,
  outline: 'none',
  fontFamily: 'sans-serif',
  boxSizing: 'border-box',
  background: '#fafafa',
  color: '#1a1a2e',
  transition: 'border-color 0.2s, background 0.2s',
};

const estiloSelect = {
  ...estiloInput,
  cursor: 'pointer',
  appearance: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 14px center',
  paddingRight: 36,
};

const prioridadeCor = {
  'Alta':  { bg: '#fff0f0', color: '#c0392b', dot: '#e74c3c' },
  'Média': { bg: '#fff8e6', color: '#b7770d', dot: '#f39c12' },
  'Baixa': { bg: '#f0faf5', color: '#1a7a45', dot: '#27ae60' },
};

const statusCor = {
  'Pendente':      { bg: '#f0f0ff', color: '#5340c0' },
  'Em Andamento':  { bg: '#fff8e6', color: '#b7770d' },
  'Concluído':     { bg: '#f0faf5', color: '#1a7a45' },
};

export default function App() {
  const [usuarioLogado, setUsuarioLogado] = useState(() => {
    const salvo = localStorage.getItem('usuarioLogado');
    return salvo ? JSON.parse(salvo) : null;
  });

  const [usuarios, setUsuarios] = useState([]);
  const [tarefas,  setTarefas]  = useState([]);
  const [carregando, setCarregando] = useState(false);

  const [docAberta,   setDocAberta]   = useState(null);
  const [docConteudo, setDocConteudo] = useState('');
  const [gerandoDoc,  setGerandoDoc]  = useState(false);

  const [novaTarefa, setNovaTarefa] = useState({
    titulo: '', descricao: '', prioridade: 'Baixa', prazo: '', responsavelId: '', status: 'Pendente',
  });

  const [filtros, setFiltros] = useState({ responsavelId: '', status: '', prioridade: '' });
  const [mostrarFormTarefa, setMostrarFormTarefa] = useState(false);

  const tarefasFiltradas = filtrarTarefas(tarefas, filtros);

  const relatorio = {
    total:       tarefas.length,
    concluidas:  tarefas.filter((t) => t.status === 'Concluído').length,
    emAndamento: tarefas.filter((t) => t.status === 'Em Andamento').length,
    pendente:    tarefas.filter((t) => t.status === 'Pendente').length,
  };

  useEffect(() => {
    if (usuarioLogado) carregarDados();
  }, [usuarioLogado]);

  async function carregarDados() {
    setCarregando(true);
    const [{ data: u }, { data: t }] = await Promise.all([
      supabase.from('usuarios').select('id, nome, email, funcao'),
      supabase.from('tarefas').select('*'),
    ]);
    setUsuarios(u || []);
    setTarefas(t || []);
    setCarregando(false);
  }

  function handleLogin(usuario) { setUsuarioLogado(usuario); }

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

  async function cadastrarTarefa(e) {
    e.preventDefault();
    if (!novaTarefa.titulo || !novaTarefa.responsavelId) {
      alert('Preencha título e responsável.');
      return;
    }
    const { data, error } = await supabase.from('tarefas').insert([{
      titulo:         novaTarefa.titulo,
      descricao:      novaTarefa.descricao,
      prioridade:     novaTarefa.prioridade,
      prazo:          novaTarefa.prazo,
      responsavel_id: Number(novaTarefa.responsavelId),
      status:         novaTarefa.status,
    }]).select().single();

    if (error) { alert('Erro ao cadastrar tarefa.'); return; }
    setTarefas([...tarefas, data]);
    setNovaTarefa({ titulo: '', descricao: '', prioridade: 'Baixa', prazo: '', responsavelId: '', status: 'Pendente' });
    setMostrarFormTarefa(false);
  }

  async function alterarStatusTarefa(id, novoStatus) {
    const { error } = await supabase.from('tarefas').update({ status: novoStatus }).eq('id', id);
    if (!error) setTarefas(tarefas.map((t) => (t.id === id ? { ...t, status: novoStatus } : t)));
  }

  async function gerarDocumentacao(tarefa) {
    setDocAberta(tarefa);
    setDocConteudo('');
    setGerandoDoc(true);

    const nomeResponsavel = buscarNomeResponsavel(tarefa.responsavel_id);
    const prompt = `Gere uma documentação básica e profissional para a seguinte tarefa de software:

- Título: ${tarefa.titulo}
- Descrição: ${tarefa.descricao || 'Não informada'}
- Prioridade: ${tarefa.prioridade}
- Prazo: ${tarefa.prazo || 'Não definido'}
- Responsável: ${nomeResponsavel}
- Status atual: ${tarefa.status}

A documentação deve conter:
1. Resumo objetivo (2-3 linhas)
2. Objetivo principal
3. Critérios de aceite (3-5 itens)
4. Riscos e dependências
5. Estimativa de esforço

Responda em português, de forma clara e técnica.`;

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      const data = await response.json();
      setDocConteudo(data.content?.[0]?.text || 'Não foi possível gerar a documentação.');
    } catch {
      setDocConteudo('Erro ao conectar com a IA.');
    }
    setGerandoDoc(false);
  }

  if (!usuarioLogado) return <Login onLogin={handleLogin} />;

  return (
    <div style={{ minHeight: '100vh', background: '#f7f7f5', fontFamily: 'sans-serif' }}>

      {/* Header */}
      <div style={{
        background: '#1a1a2e', padding: '0 2rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: 60, position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="11" width="18" height="11" rx="2" stroke="white" strokeWidth="1.5"/>
            <path d="M7 11V7a5 5 0 0110 0v4" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>Gerenciador de Tarefas</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%', background: '#ffffff22',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 700, fontSize: 13,
          }}>
            {usuarioLogado.nome?.charAt(0).toUpperCase()}
          </div>
          <span style={{ color: '#ffffffbb', fontSize: 13 }}>{usuarioLogado.nome}</span>
          <button onClick={handleLogout} style={{
            padding: '6px 14px', background: 'transparent', border: '1px solid #ffffff44',
            borderRadius: 8, cursor: 'pointer', fontSize: 12, color: '#ffffffbb',
            transition: 'all 0.2s',
          }}>Sair</button>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 1.5rem' }}>

        {carregando && (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>
            Carregando dados...
          </div>
        )}

        {/* Cards de Relatório */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: '1.5rem' }}>
          {[
            { label: 'Total',        valor: relatorio.total,       cor: '#1a1a2e', bg: '#fff' },
            { label: 'Pendente',     valor: relatorio.pendente,    cor: '#5340c0', bg: '#f0f0ff' },
            { label: 'Em Andamento', valor: relatorio.emAndamento, cor: '#b7770d', bg: '#fff8e6' },
            { label: 'Concluídas',   valor: relatorio.concluidas,  cor: '#1a7a45', bg: '#f0faf5' },
          ].map((item) => (
            <div key={item.label} style={{
              background: '#fff', borderRadius: 16, border: '1px solid #ebebeb',
              padding: '1.25rem 1.5rem',
            }}>
              <p style={{ margin: 0, fontSize: 12, color: '#888', fontWeight: 500 }}>{item.label}</p>
              <p style={{ margin: '6px 0 0', fontSize: 28, fontWeight: 700, color: item.cor }}>{item.valor}</p>
            </div>
          ))}
        </div>

        {/* Filtros + botão nova tarefa */}
        <div style={{ ...estiloCard, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <select style={{ ...estiloSelect, flex: 1, minWidth: 160 }}
            value={filtros.responsavelId}
            onChange={(e) => setFiltros({ ...filtros, responsavelId: e.target.value })}>
            <option value="">Todos os responsáveis</option>
            {usuarios.map((u) => <option key={u.id} value={u.id}>{u.nome}</option>)}
          </select>

          <select style={{ ...estiloSelect, flex: 1, minWidth: 140 }}
            value={filtros.status}
            onChange={(e) => setFiltros({ ...filtros, status: e.target.value })}>
            <option value="">Todos os status</option>
            <option value="Pendente">Pendente</option>
            <option value="Em Andamento">Em Andamento</option>
            <option value="Concluído">Concluído</option>
          </select>

          <select style={{ ...estiloSelect, flex: 1, minWidth: 140 }}
            value={filtros.prioridade}
            onChange={(e) => setFiltros({ ...filtros, prioridade: e.target.value })}>
            <option value="">Todas as prioridades</option>
            <option value="Baixa">Baixa</option>
            <option value="Média">Média</option>
            <option value="Alta">Alta</option>
          </select>

          <button onClick={() => setFiltros({ responsavelId: '', status: '', prioridade: '' })} style={{
            padding: '10px 16px', background: '#f0f0f0', border: 'none',
            borderRadius: 10, cursor: 'pointer', fontSize: 13, color: '#555', fontWeight: 500,
          }}>Limpar</button>

          <button onClick={() => setMostrarFormTarefa(!mostrarFormTarefa)} style={{
            padding: '10px 20px', background: '#1a1a2e', border: 'none',
            borderRadius: 10, cursor: 'pointer', fontSize: 13, color: '#fff', fontWeight: 600,
            marginLeft: 'auto',
          }}>
            {mostrarFormTarefa ? '✕ Cancelar' : '+ Nova Tarefa'}
          </button>
        </div>

        {/* Formulário Nova Tarefa */}
        {mostrarFormTarefa && (
          <div style={estiloCard}>
            <h3 style={{ margin: '0 0 1.25rem', fontSize: 16, color: '#1a1a2e' }}>Nova Tarefa</h3>
            <form onSubmit={cadastrarTarefa}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <input style={estiloInput} type="text" placeholder="Título" value={novaTarefa.titulo}
                  onChange={(e) => setNovaTarefa({ ...novaTarefa, titulo: e.target.value })}
                  onFocus={(e) => { e.target.style.borderColor = '#1a1a2e'; e.target.style.background = '#fff'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#e8e8e8'; e.target.style.background = '#fafafa'; }} />

                <select style={estiloSelect} value={novaTarefa.responsavelId}
                  onChange={(e) => setNovaTarefa({ ...novaTarefa, responsavelId: e.target.value })}>
                  <option value="">Selecione o responsável</option>
                  {usuarios.map((u) => <option key={u.id} value={u.id}>{u.nome}</option>)}
                </select>
              </div>

              <textarea style={{ ...estiloInput, resize: 'vertical', minHeight: 80, marginBottom: 12 }}
                placeholder="Descrição" value={novaTarefa.descricao}
                onChange={(e) => setNovaTarefa({ ...novaTarefa, descricao: e.target.value })}
                onFocus={(e) => { e.target.style.borderColor = '#1a1a2e'; e.target.style.background = '#fff'; }}
                onBlur={(e) => { e.target.style.borderColor = '#e8e8e8'; e.target.style.background = '#fafafa'; }} />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
                <select style={estiloSelect} value={novaTarefa.prioridade}
                  onChange={(e) => setNovaTarefa({ ...novaTarefa, prioridade: e.target.value })}>
                  <option value="Baixa">Baixa</option>
                  <option value="Média">Média</option>
                  <option value="Alta">Alta</option>
                </select>

                <input style={estiloInput} type="date" value={novaTarefa.prazo}
                  onChange={(e) => setNovaTarefa({ ...novaTarefa, prazo: e.target.value })} />

                <select style={estiloSelect} value={novaTarefa.status}
                  onChange={(e) => setNovaTarefa({ ...novaTarefa, status: e.target.value })}>
                  <option value="Pendente">Pendente</option>
                  <option value="Em Andamento">Em Andamento</option>
                  <option value="Concluído">Concluído</option>
                </select>
              </div>

              <button type="submit" style={{
                padding: '10px 24px', background: '#1a1a2e', color: '#fff',
                border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 600,
              }}>
                Cadastrar Tarefa
              </button>
            </form>
          </div>
        )}

        {/* Lista de Tarefas */}
        <div style={estiloCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ margin: 0, fontSize: 16, color: '#1a1a2e' }}>
              Tarefas <span style={{ color: '#888', fontWeight: 400, fontSize: 14 }}>({tarefasFiltradas.length})</span>
            </h3>
          </div>

          {tarefasFiltradas.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#aaa' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
              <p style={{ margin: 0 }}>Nenhuma tarefa encontrada.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {tarefasFiltradas.map((tarefa) => {
                const pCor = prioridadeCor[tarefa.prioridade] || prioridadeCor['Média'];
                const sCor = statusCor[tarefa.status] || statusCor['A Fazer'];
                return (
                  <div key={tarefa.id} style={{
                    background: '#fafafa', borderRadius: 12, border: '1px solid #ebebeb',
                    padding: '1rem 1.25rem', transition: 'box-shadow 0.2s',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div>
                        <h4 style={{ margin: '0 0 4px', fontSize: 15, color: '#1a1a2e' }}>{tarefa.titulo}</h4>
                        {tarefa.descricao && <p style={{ margin: 0, fontSize: 13, color: '#888' }}>{tarefa.descricao}</p>}
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0, marginLeft: 12 }}>
                        <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: pCor.bg, color: pCor.color }}>
                          {tarefa.prioridade}
                        </span>
                        <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: sCor.bg, color: sCor.color }}>
                          {tarefa.status}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 10, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 12, color: '#888' }}>
                        👤 {buscarNomeResponsavel(tarefa.responsavel_id)}
                      </span>
                      {tarefa.prazo && (
                        <span style={{ fontSize: 12, color: '#888' }}>📅 {tarefa.prazo}</span>
                      )}

                      <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                        <select value={tarefa.status}
                          onChange={(e) => alterarStatusTarefa(tarefa.id, e.target.value)}
                          style={{ ...estiloSelect, fontSize: 12, padding: '6px 30px 6px 10px', width: 'auto' }}>
                          <option value="Pendente">Pendente</option>
                          <option value="Em Andamento">Em Andamento</option>
                          <option value="Concluído">Concluído</option>
                        </select>

                        <button onClick={() => gerarDocumentacao(tarefa)} style={{
                          padding: '6px 12px', background: '#1a1a2e', color: '#fff',
                          border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 500,
                          whiteSpace: 'nowrap',
                        }}>
                          Gerar Doc IA
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal Documentação */}
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
                <h2 style={{ margin: 0, fontSize: 18, color: '#1a1a2e' }}>Documentação da Tarefa</h2>
                <p style={{ margin: '4px 0 0', color: '#888', fontSize: 13 }}>{docAberta.titulo}</p>
              </div>
              <button onClick={() => { setDocAberta(null); setDocConteudo(''); }} style={{
                background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: '#888',
              }}>✕</button>
            </div>

            {gerandoDoc ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>
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

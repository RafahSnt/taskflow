import { useState, useEffect } from 'react';
import Login from './Login';
import { supabase } from './supabase';

const PRIORIDADES = ['Baixa', 'Média', 'Alta'];
const STATUS = ['Pendente', 'Em Andamento', 'Concluído'];

const COR_PRIORIDADE = {
  'Alta':  { bg: '#fff0f0', color: '#c0392b' },
  'Média': { bg: '#fff8e6', color: '#b7770d' },
  'Baixa': { bg: '#f0faf5', color: '#1a7a45' },
};

const COR_STATUS = {
  'Pendente':     { bg: '#f0f0ff', color: '#5340c0' },
  'Em Andamento': { bg: '#fff8e6', color: '#b7770d' },
  'Concluído':    { bg: '#f0faf5', color: '#1a7a45' },
};

const sInput = {
  width: '100%', padding: '10px 14px', borderRadius: 10,
  border: '1.5px solid #e8e8e8', fontSize: 14, outline: 'none',
  fontFamily: 'sans-serif', boxSizing: 'border-box',
  background: '#fafafa', color: '#1a1a2e',
};

const sSelect = {
  ...sInput, cursor: 'pointer', appearance: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center', paddingRight: 36,
};

const sCard = {
  background: '#fff', borderRadius: 16,
  border: '1px solid #ebebeb', padding: '1.5rem', marginBottom: '1.5rem',
};

const sBotao = (variante = 'dark') => ({
  padding: '10px 20px', border: 'none', borderRadius: 10, cursor: 'pointer',
  fontSize: 13, fontWeight: 600, fontFamily: 'sans-serif',
  background: variante === 'dark' ? '#1a1a2e' : '#f0f0f0',
  color: variante === 'dark' ? '#fff' : '#555',
});

export default function App() {
  const [usuarioLogado, setUsuarioLogado] = useState(() => {
    const s = localStorage.getItem('usuarioLogado');
    return s ? JSON.parse(s) : null;
  });

  const [usuarios, setUsuarios]         = useState([]);
  const [tarefas, setTarefas]           = useState([]);
  const [carregando, setCarregando]     = useState(false);
  const [mostrarForm, setMostrarForm]   = useState(false);
  const [docAberta, setDocAberta]       = useState(null);
  const [docTexto, setDocTexto]         = useState('');
  const [gerandoDoc, setGerandoDoc]     = useState(false);

  const [novaTarefa, setNovaTarefa] = useState({
    titulo: '', descricao: '', prioridade: 'Baixa', prazo: '', responsavelId: '', status: 'Pendente',
  });

  const [filtros, setFiltros] = useState({ responsavelId: '', status: '', prioridade: '' });

  const tarefasFiltradas = tarefas.filter((t) => {
    if (filtros.responsavelId && String(t.responsavel_id) !== filtros.responsavelId) return false;
    if (filtros.status && t.status !== filtros.status) return false;
    if (filtros.prioridade && t.prioridade !== filtros.prioridade) return false;
    return true;
  });

  const relatorio = {
    total:       tarefas.length,
    pendente:    tarefas.filter((t) => t.status === 'Pendente').length,
    emAndamento: tarefas.filter((t) => t.status === 'Em Andamento').length,
    concluidas:  tarefas.filter((t) => t.status === 'Concluído').length,
  };

  useEffect(() => { if (usuarioLogado) carregar(); }, [usuarioLogado]);

  async function carregar() {
    setCarregando(true);
    const [{ data: u }, { data: t }] = await Promise.all([
      supabase.from('usuarios').select('id, nome, email, funcao'),
      supabase.from('tarefas').select('*'),
    ]);
    setUsuarios(u || []);
    setTarefas(t || []);
    setCarregando(false);
  }

  function nomeResponsavel(id) {
    return usuarios.find((u) => u.id === Number(id))?.nome || 'Desconhecido';
  }

  function handleLogin(u) { setUsuarioLogado(u); }

  function handleLogout() {
    localStorage.removeItem('usuarioLogado');
    setUsuarioLogado(null);
    setUsuarios([]);
    setTarefas([]);
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
    setMostrarForm(false);
  }

  async function alterarStatus(id, status) {
    const { error } = await supabase.from('tarefas').update({ status }).eq('id', id);
    if (!error) setTarefas(tarefas.map((t) => t.id === id ? { ...t, status } : t));
  }

  async function excluirTarefa(id) {
    if (!confirm('Tem certeza que deseja excluir esta tarefa?')) return;
    const { error } = await supabase.from('tarefas').delete().eq('id', id);
    if (!error) setTarefas(tarefas.filter((t) => t.id !== id));
    else alert('Erro ao excluir tarefa.');
  }

  async function gerarDoc(tarefa) {
    setDocAberta(tarefa);
    setDocTexto('');
    setGerandoDoc(true);
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{ role: 'user', content:
            `Gere uma documentação básica para esta tarefa:\n\n- Título: ${tarefa.titulo}\n- Descrição: ${tarefa.descricao || 'Não informada'}\n- Prioridade: ${tarefa.prioridade}\n- Prazo: ${tarefa.prazo || 'Não definido'}\n- Responsável: ${nomeResponsavel(tarefa.responsavel_id)}\n- Status: ${tarefa.status}\n\nInclua: resumo, objetivo, critérios de aceite, riscos e estimativa de esforço. Responda em português.`
          }],
        }),
      });
      const d = await res.json();
      setDocTexto(d.content?.[0]?.text || 'Erro ao gerar.');
    } catch {
      setDocTexto('Erro ao conectar com a IA.');
    }
    setGerandoDoc(false);
  }

  if (!usuarioLogado) return <Login onLogin={handleLogin} />;

  return (
    <div style={{ minHeight: '100vh', background: '#f7f7f5', fontFamily: 'sans-serif' }}>

      {/* Header */}
      <div style={{
        background: '#1a1a2e', height: 60, padding: '0 2rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <span style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>Gerenciador de Tarefas</span>
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
            padding: '6px 14px', background: 'transparent',
            border: '1px solid #ffffff44', borderRadius: 8,
            cursor: 'pointer', fontSize: 12, color: '#ffffffbb',
          }}>Sair</button>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 1.5rem' }}>

        {carregando && <p style={{ textAlign: 'center', color: '#888' }}>Carregando...</p>}

        {/* Relatório */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: '1.5rem' }}>
          {[
            { label: 'Total',        valor: relatorio.total,       cor: '#1a1a2e' },
            { label: 'Pendente',     valor: relatorio.pendente,    cor: '#5340c0' },
            { label: 'Em Andamento', valor: relatorio.emAndamento, cor: '#b7770d' },
            { label: 'Concluídas',   valor: relatorio.concluidas,  cor: '#1a7a45' },
          ].map((item) => (
            <div key={item.label} style={{ background: '#fff', borderRadius: 16, border: '1px solid #ebebeb', padding: '1.25rem 1.5rem' }}>
              <p style={{ margin: 0, fontSize: 12, color: '#888', fontWeight: 500 }}>{item.label}</p>
              <p style={{ margin: '6px 0 0', fontSize: 28, fontWeight: 700, color: item.cor }}>{item.valor}</p>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div style={{ ...sCard, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <select style={{ ...sSelect, flex: 1, minWidth: 160 }}
            value={filtros.responsavelId}
            onChange={(e) => setFiltros({ ...filtros, responsavelId: e.target.value })}>
            <option value="">Todos os responsáveis</option>
            {usuarios.map((u) => <option key={u.id} value={u.id}>{u.nome}</option>)}
          </select>

          <select style={{ ...sSelect, flex: 1, minWidth: 140 }}
            value={filtros.status}
            onChange={(e) => setFiltros({ ...filtros, status: e.target.value })}>
            <option value="">Todos os status</option>
            {STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>

          <select style={{ ...sSelect, flex: 1, minWidth: 140 }}
            value={filtros.prioridade}
            onChange={(e) => setFiltros({ ...filtros, prioridade: e.target.value })}>
            <option value="">Todas as prioridades</option>
            {PRIORIDADES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>

          <button onClick={() => setFiltros({ responsavelId: '', status: '', prioridade: '' })} style={sBotao('light')}>
            Limpar
          </button>
          <button onClick={() => setMostrarForm(!mostrarForm)} style={{ ...sBotao('dark'), marginLeft: 'auto' }}>
            {mostrarForm ? '✕ Cancelar' : '+ Nova Tarefa'}
          </button>
        </div>

        {/* Formulário Nova Tarefa */}
        {mostrarForm && (
          <div style={sCard}>
            <h3 style={{ margin: '0 0 1.25rem', fontSize: 16, color: '#1a1a2e' }}>Nova Tarefa</h3>
            <form onSubmit={cadastrarTarefa}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <input style={sInput} type="text" placeholder="Título" value={novaTarefa.titulo}
                  onChange={(e) => setNovaTarefa({ ...novaTarefa, titulo: e.target.value })} />
                <select style={sSelect} value={novaTarefa.responsavelId}
                  onChange={(e) => setNovaTarefa({ ...novaTarefa, responsavelId: e.target.value })}>
                  <option value="">Selecione o responsável</option>
                  {usuarios.map((u) => <option key={u.id} value={u.id}>{u.nome}</option>)}
                </select>
              </div>

              <textarea style={{ ...sInput, resize: 'vertical', minHeight: 80, marginBottom: 12 }}
                placeholder="Descrição" value={novaTarefa.descricao}
                onChange={(e) => setNovaTarefa({ ...novaTarefa, descricao: e.target.value })} />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
                <select style={sSelect} value={novaTarefa.prioridade}
                  onChange={(e) => setNovaTarefa({ ...novaTarefa, prioridade: e.target.value })}>
                  {PRIORIDADES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
                <input style={sInput} type="date" value={novaTarefa.prazo}
                  onChange={(e) => setNovaTarefa({ ...novaTarefa, prazo: e.target.value })} />
                <select style={sSelect} value={novaTarefa.status}
                  onChange={(e) => setNovaTarefa({ ...novaTarefa, status: e.target.value })}>
                  {STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <button type="submit" style={sBotao('dark')}>Cadastrar Tarefa</button>
            </form>
          </div>
        )}

        {/* Lista de Tarefas */}
        <div style={sCard}>
          <h3 style={{ margin: '0 0 1.25rem', fontSize: 16, color: '#1a1a2e' }}>
            Tarefas <span style={{ color: '#888', fontWeight: 400, fontSize: 14 }}>({tarefasFiltradas.length})</span>
          </h3>

          {tarefasFiltradas.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#aaa' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
              <p style={{ margin: 0 }}>Nenhuma tarefa encontrada.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {tarefasFiltradas.map((tarefa) => {
                const pCor = COR_PRIORIDADE[tarefa.prioridade] || COR_PRIORIDADE['Baixa'];
                const sCor = COR_STATUS[tarefa.status]         || COR_STATUS['Pendente'];
                return (
                  <div key={tarefa.id} style={{
                    background: '#fafafa', borderRadius: 12,
                    border: '1px solid #ebebeb', padding: '1rem 1.25rem',
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
                      <span style={{ fontSize: 12, color: '#888' }}>👤 {nomeResponsavel(tarefa.responsavel_id)}</span>
                      {tarefa.prazo && <span style={{ fontSize: 12, color: '#888' }}>📅 {tarefa.prazo}</span>}
                      <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                        <select value={tarefa.status}
                          onChange={(e) => alterarStatus(tarefa.id, e.target.value)}
                          style={{ ...sSelect, fontSize: 12, padding: '6px 30px 6px 10px', width: 'auto' }}>
                          {STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>

                        <button onClick={() => excluirTarefa(tarefa.id)} style={{
                          padding: '6px 12px', background: '#fff0f0', color: '#c0392b',
                          border: '1px solid #ffc5c5', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 500,
                        }}>
                          Excluir
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
            background: '#fff', borderRadius: 16, maxWidth: 680,
            width: '100%', maxHeight: '85vh', overflow: 'auto', padding: '2rem',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 18, color: '#1a1a2e' }}>Documentação da Tarefa</h2>
                <p style={{ margin: '4px 0 0', color: '#888', fontSize: 13 }}>{docAberta.titulo}</p>
              </div>
              <button onClick={() => { setDocAberta(null); setDocTexto(''); }} style={{
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
                {docTexto}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

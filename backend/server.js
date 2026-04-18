const express = require('express');
const cors = require('cors');
const Anthropic = require('@anthropic-ai/sdk');

const app = express();
app.use(cors());
app.use(express.json());

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─── Banco de dados em memória (substitua por PostgreSQL/MySQL em produção) ───
let usuarios = [
  { id: 1, nome: 'João Silva',  email: 'joao@email.com',  senha: '123456', funcao: 'Desenvolvedor' },
  { id: 2, nome: 'Maria Souza', email: 'maria@email.com', senha: '123456', funcao: 'Analista' },
];

let tarefas = [
  { id: 1, titulo: 'Implementar tela de login',  descricao: 'Criar formulário de autenticação', prioridade: 'Alta',  prazo: '2026-04-10', responsavelId: 1, status: 'A Fazer'      },
  { id: 2, titulo: 'Criar API',                  descricao: 'Desenvolver endpoint inicial',     prioridade: 'Alta',  prazo: '2026-04-12', responsavelId: 1, status: 'Em Andamento' },
  { id: 3, titulo: 'Documentar fluxo',            descricao: 'Escrever documentação básica',    prioridade: 'Média', prazo: '2026-04-15', responsavelId: 2, status: 'Concluído'    },
];

// ─── Auth ─────────────────────────────────────────────────────────────────────

app.post('/api/login', (req, res) => {
  const { email, senha } = req.body;

  const usuario = usuarios.find(u => u.email === email && u.senha === senha);
  if (!usuario) {
    return res.status(401).json({ erro: 'Email ou senha incorretos.' });
  }

  const { senha: _, ...usuarioSemSenha } = usuario;
  res.json({ usuario: usuarioSemSenha, token: `token-${usuario.id}-${Date.now()}` });
});

// ─── Usuários ─────────────────────────────────────────────────────────────────

app.get('/api/usuarios', (req, res) => {
  const lista = usuarios.map(({ senha: _, ...u }) => u);
  res.json(lista);
});

app.post('/api/usuarios', (req, res) => {
  const { nome, email, funcao } = req.body;

  if (!nome || !email || !funcao) {
    return res.status(400).json({ erro: 'Campos obrigatórios: nome, email, funcao.' });
  }

  if (usuarios.find(u => u.email === email)) {
    return res.status(409).json({ erro: 'Email já cadastrado.' });
  }

  const novo = { id: Date.now(), nome, email, senha: '123456', funcao };
  usuarios.push(novo);

  const { senha: _, ...usuarioSemSenha } = novo;
  res.status(201).json(usuarioSemSenha);
});

// ─── Tarefas ──────────────────────────────────────────────────────────────────

app.get('/api/tarefas', (req, res) => {
  const { responsavelId, status, prioridade } = req.query;
  let resultado = [...tarefas];

  if (responsavelId) resultado = resultado.filter(t => t.responsavelId === Number(responsavelId));
  if (status)        resultado = resultado.filter(t => t.status === status);
  if (prioridade)    resultado = resultado.filter(t => t.prioridade === prioridade);

  res.json(resultado);
});

app.post('/api/tarefas', (req, res) => {
  const { titulo, descricao, prioridade, prazo, responsavelId, status } = req.body;

  if (!titulo || !responsavelId) {
    return res.status(400).json({ erro: 'Campos obrigatórios: titulo, responsavelId.' });
  }

  const nova = {
    id: Date.now(),
    titulo,
    descricao: descricao || '',
    prioridade: prioridade || 'Média',
    prazo: prazo || '',
    responsavelId: Number(responsavelId),
    status: status || 'A Fazer',
  };

  tarefas.push(nova);
  res.status(201).json(nova);
});

app.put('/api/tarefas/:id', (req, res) => {
  const id = Number(req.params.id);
  const idx = tarefas.findIndex(t => t.id === id);

  if (idx === -1) return res.status(404).json({ erro: 'Tarefa não encontrada.' });

  tarefas[idx] = { ...tarefas[idx], ...req.body, id };
  res.json(tarefas[idx]);
});

app.delete('/api/tarefas/:id', (req, res) => {
  const id = Number(req.params.id);
  const idx = tarefas.findIndex(t => t.id === id);

  if (idx === -1) return res.status(404).json({ erro: 'Tarefa não encontrada.' });

  tarefas.splice(idx, 1);
  res.json({ mensagem: 'Tarefa removida com sucesso.' });
});

// ─── Documentação automática via IA ──────────────────────────────────────────

app.post('/api/tarefas/:id/documentar', async (req, res) => {
  const id = Number(req.params.id);
  const tarefa = tarefas.find(t => t.id === id);

  if (!tarefa) return res.status(404).json({ erro: 'Tarefa não encontrada.' });

  const responsavel = usuarios.find(u => u.id === tarefa.responsavelId);
  const nomeResponsavel = responsavel ? responsavel.nome : 'Não atribuído';

  const prompt = `
Você é um assistente técnico. Gere uma documentação básica e profissional para a seguinte tarefa de software:

- Título: ${tarefa.titulo}
- Descrição: ${tarefa.descricao || 'Não informada'}
- Prioridade: ${tarefa.prioridade}
- Prazo: ${tarefa.prazo || 'Não definido'}
- Responsável: ${nomeResponsavel}
- Status atual: ${tarefa.status}

A documentação deve conter:
1. Resumo objetivo (2-3 linhas)
2. Objetivo principal
3. Critérios de aceite (3-5 itens em lista)
4. Riscos e dependências
5. Estimativa de esforço (baseada na prioridade)

Responda em português, de forma clara e técnica.
`;

  try {
    const resposta = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const documentacao = resposta.content[0].text;
    res.json({ documentacao, tarefaId: id });
  } catch (err) {
    console.error('Erro na API Anthropic:', err.message);
    res.status(500).json({ erro: 'Falha ao gerar documentação.' });
  }
});

// ─── Relatório ────────────────────────────────────────────────────────────────

app.get('/api/relatorio', (req, res) => {
  res.json({
    total:       tarefas.length,
    concluidas:  tarefas.filter(t => t.status === 'Concluído').length,
    emAndamento: tarefas.filter(t => t.status === 'Em Andamento').length,
    aFazer:      tarefas.filter(t => t.status === 'A Fazer').length,
  });
});

// ─── Start ────────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});

import { useState } from 'react';
import { supabase } from './supabase';

// ─── Fora do Login para não recriar a cada render e perder o foco ─────────────
const estiloInput = {
  width: '100%', padding: '10px 14px', borderRadius: 8,
  border: '1.5px solid #e0e0e0', fontSize: 15, outline: 'none',
  fontFamily: 'sans-serif', boxSizing: 'border-box', transition: 'border-color 0.2s',
};

const estiloLabel = {
  display: 'block', fontSize: 12, fontWeight: 600, color: '#444',
  marginBottom: 6, fontFamily: 'sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em',
};

const estiloBotao = {
  width: '100%', padding: '12px', background: '#1a1a2e', color: '#fff',
  border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600,
  cursor: 'pointer', fontFamily: 'sans-serif', letterSpacing: '0.02em',
};

function InputSenha({ value, onChange, mostrar, setMostrar, placeholder = '••••••••' }) {
  return (
    <div style={{ position: 'relative' }}>
      <input
        type={mostrar ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required
        style={{ ...estiloInput, paddingRight: 44 }}
        onFocus={(e) => e.target.style.borderColor = '#1a1a2e'}
        onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
      />
      <button type="button" onClick={() => setMostrar(!mostrar)} style={{
        position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
        background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#888',
      }}>
        {mostrar ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
            <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
            <line x1="1" y1="1" x2="23" y2="23"/>
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        )}
      </button>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function Login({ onLogin }) {
  const [tela, setTela] = useState('login');
  const [email, setEmail] = useState(() => localStorage.getItem('emailSalvo') || '');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [lembrar, setLembrar] = useState(() => !!localStorage.getItem('emailSalvo'));
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [sucesso, setSucesso] = useState('');

  const [cadastro, setCadastro] = useState({ nome: '', email: '', funcao: '', senha: '', confirmarSenha: '' });
  const [mostrarSenhaCadastro, setMostrarSenhaCadastro] = useState(false);
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setErro('');
    setCarregando(true);

    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', email)
      .eq('senha', senha)
      .single();

    if (error || !data) {
      setErro('Email ou senha incorretos.');
    } else {
      if (lembrar) {
        localStorage.setItem('emailSalvo', email);
      } else {
        localStorage.removeItem('emailSalvo');
      }
      const { senha: _, ...usuarioSemSenha } = data;
      localStorage.setItem('usuarioLogado', JSON.stringify(usuarioSemSenha));
      onLogin(usuarioSemSenha);
    }
    setCarregando(false);
  }

  async function handleCadastro(e) {
    e.preventDefault();
    setErro('');

    if (!cadastro.nome || !cadastro.email || !cadastro.funcao || !cadastro.senha) {
      setErro('Preencha todos os campos.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cadastro.email)) {
      setErro('Email inválido.');
      return;
    }
    if (cadastro.senha.length < 6) {
      setErro('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (cadastro.senha !== cadastro.confirmarSenha) {
      setErro('As senhas não coincidem.');
      return;
    }

    setCarregando(true);

    const { error } = await supabase.from('usuarios').insert([{
      nome: cadastro.nome,
      email: cadastro.email,
      senha: cadastro.senha,
      funcao: cadastro.funcao,
    }]);

    if (error) {
      setErro(error.code === '23505' ? 'Este email já está cadastrado.' : 'Erro ao cadastrar. Tente novamente.');
    } else {
      setSucesso('Cadastro realizado! Faça seu login.');
      setCadastro({ nome: '', email: '', funcao: '', senha: '', confirmarSenha: '' });
      setTimeout(() => { setTela('login'); setSucesso(''); }, 1800);
    }
    setCarregando(false);
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#f5f5f0', fontFamily: "'Georgia', serif",
    }}>
      <div style={{ width: '100%', maxWidth: 420, padding: '0 1.5rem' }}>

        <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <div style={{
            width: 52, height: 52, borderRadius: '50%', background: '#1a1a2e',
            margin: '0 auto 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="11" width="18" height="11" rx="2" stroke="white" strokeWidth="1.5"/>
              <path d="M7 11V7a5 5 0 0110 0v4" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1a1a2e', margin: 0 }}>Gerenciador de Tarefas</h1>
          <p style={{ color: '#777', marginTop: 6, fontSize: 14, fontFamily: 'sans-serif' }}>
            {tela === 'login' ? 'Faça login para continuar' : 'Crie sua conta'}
          </p>
        </div>

        <div style={{ display: 'flex', background: '#e8e8e4', borderRadius: 10, padding: 4, marginBottom: '1.5rem' }}>
          {['login', 'cadastro'].map((t) => (
            <button key={t} type="button" onClick={() => { setTela(t); setErro(''); setSucesso(''); }} style={{
              flex: 1, padding: '8px 0', borderRadius: 8, border: 'none',
              background: tela === t ? '#fff' : 'transparent',
              fontWeight: tela === t ? 600 : 400,
              color: tela === t ? '#1a1a2e' : '#888',
              cursor: 'pointer', fontSize: 14, fontFamily: 'sans-serif',
              boxShadow: tela === t ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
            }}>
              {t === 'login' ? 'Entrar' : 'Cadastrar'}
            </button>
          ))}
        </div>

        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e5e5', padding: '2rem' }}>
          {sucesso && (
            <div style={{ background: '#f0faf5', border: '1px solid #a8e6c8', borderRadius: 8, padding: '10px 14px', marginBottom: '1rem', fontSize: 13, color: '#1a7a45', fontFamily: 'sans-serif' }}>
              ✓ {sucesso}
            </div>
          )}
          {erro && (
            <div style={{ background: '#fff0f0', border: '1px solid #ffc5c5', borderRadius: 8, padding: '10px 14px', marginBottom: '1rem', fontSize: 13, color: '#c0392b', fontFamily: 'sans-serif' }}>
              {erro}
            </div>
          )}

          {tela === 'login' && (
            <form onSubmit={handleLogin}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={estiloLabel}>Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com" required style={estiloInput}
                  onFocus={(e) => e.target.style.borderColor = '#1a1a2e'}
                  onBlur={(e) => e.target.style.borderColor = '#e0e0e0'} />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={estiloLabel}>Senha</label>
                <InputSenha value={senha} onChange={(e) => setSenha(e.target.value)}
                  mostrar={mostrarSenha} setMostrar={setMostrarSenha} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1.5rem' }}>
                <input type="checkbox" id="lembrar" checked={lembrar} onChange={(e) => setLembrar(e.target.checked)}
                  style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#1a1a2e' }} />
                <label htmlFor="lembrar" style={{ fontSize: 13, color: '#555', fontFamily: 'sans-serif', cursor: 'pointer' }}>
                  Lembrar meu email
                </label>
              </div>
              <button type="submit" disabled={carregando} style={{
                ...estiloBotao, background: carregando ? '#888' : '#1a1a2e', cursor: carregando ? 'not-allowed' : 'pointer',
              }}>
                {carregando ? 'Entrando...' : 'Entrar'}
              </button>
            </form>
          )}

          {tela === 'cadastro' && (
            <form onSubmit={handleCadastro}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={estiloLabel}>Nome completo</label>
                <input type="text" placeholder="Seu nome" value={cadastro.nome} required
                  onChange={(e) => setCadastro({ ...cadastro, nome: e.target.value })} style={estiloInput}
                  onFocus={(e) => e.target.style.borderColor = '#1a1a2e'}
                  onBlur={(e) => e.target.style.borderColor = '#e0e0e0'} />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={estiloLabel}>Função / Cargo</label>
                <input type="text" placeholder="Ex: Desenvolvedor, Analista..." value={cadastro.funcao} required
                  onChange={(e) => setCadastro({ ...cadastro, funcao: e.target.value })} style={estiloInput}
                  onFocus={(e) => e.target.style.borderColor = '#1a1a2e'}
                  onBlur={(e) => e.target.style.borderColor = '#e0e0e0'} />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={estiloLabel}>Email</label>
                <input type="email" placeholder="seu@email.com" value={cadastro.email} required
                  onChange={(e) => setCadastro({ ...cadastro, email: e.target.value })} style={estiloInput}
                  onFocus={(e) => e.target.style.borderColor = '#1a1a2e'}
                  onBlur={(e) => e.target.style.borderColor = '#e0e0e0'} />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={estiloLabel}>Senha</label>
                <InputSenha value={cadastro.senha}
                  onChange={(e) => setCadastro({ ...cadastro, senha: e.target.value })}
                  mostrar={mostrarSenhaCadastro} setMostrar={setMostrarSenhaCadastro}
                  placeholder="Mínimo 6 caracteres" />
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={estiloLabel}>Confirmar senha</label>
                <InputSenha value={cadastro.confirmarSenha}
                  onChange={(e) => setCadastro({ ...cadastro, confirmarSenha: e.target.value })}
                  mostrar={mostrarConfirmar} setMostrar={setMostrarConfirmar}
                  placeholder="Repita a senha" />
              </div>
              <button type="submit" disabled={carregando} style={{
                ...estiloBotao, background: carregando ? '#888' : '#1a1a2e', cursor: carregando ? 'not-allowed' : 'pointer',
              }}>
                {carregando ? 'Criando conta...' : 'Criar conta'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';

const USUARIOS_MOCK = [
  { id: 1, nome: 'João Silva', email: 'joao@email.com', senha: '123456', funcao: 'Desenvolvedor' },
  { id: 2, nome: 'Maria Souza', email: 'maria@email.com', senha: '123456', funcao: 'Analista' },
];

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setErro('');
    setCarregando(true);

    await new Promise((r) => setTimeout(r, 800));

    const usuario = USUARIOS_MOCK.find(
      (u) => u.email === email && u.senha === senha
    );

    if (usuario) {
      localStorage.setItem('usuarioLogado', JSON.stringify(usuario));
      onLogin(usuario);
    } else {
      setErro('Email ou senha incorretos.');
    }

    setCarregando(false);
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f5f5f0',
      fontFamily: "'Georgia', serif",
    }}>
      <div style={{
        width: '100%',
        maxWidth: 420,
        padding: '0 1.5rem',
      }}>
        <div style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
          <div style={{
            width: 52,
            height: 52,
            borderRadius: '50%',
            background: '#1a1a2e',
            margin: '0 auto 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="11" width="18" height="11" rx="2" stroke="white" strokeWidth="1.5"/>
              <path d="M7 11V7a5 5 0 0110 0v4" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#1a1a2e', margin: 0 }}>
            Gerenciador de Tarefas
          </h1>
          <p style={{ color: '#777', marginTop: 6, fontSize: 14, fontFamily: 'sans-serif' }}>
            Faça login para continuar
          </p>
        </div>

        <div style={{
          background: '#fff',
          borderRadius: 16,
          border: '1px solid #e5e5e5',
          padding: '2rem',
        }}>
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{
                display: 'block',
                fontSize: 12,
                fontWeight: 600,
                color: '#444',
                marginBottom: 6,
                fontFamily: 'sans-serif',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 8,
                  border: '1.5px solid #e0e0e0',
                  fontSize: 15,
                  outline: 'none',
                  fontFamily: 'sans-serif',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => e.target.style.borderColor = '#1a1a2e'}
                onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                fontSize: 12,
                fontWeight: 600,
                color: '#444',
                marginBottom: 6,
                fontFamily: 'sans-serif',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}>
                Senha
              </label>
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="••••••••"
                required
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 8,
                  border: '1.5px solid #e0e0e0',
                  fontSize: 15,
                  outline: 'none',
                  fontFamily: 'sans-serif',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => e.target.style.borderColor = '#1a1a2e'}
                onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
              />
            </div>

            {erro && (
              <div style={{
                background: '#fff0f0',
                border: '1px solid #ffc5c5',
                borderRadius: 8,
                padding: '10px 14px',
                marginBottom: '1rem',
                fontSize: 13,
                color: '#c0392b',
                fontFamily: 'sans-serif',
              }}>
                {erro}
              </div>
            )}

            <button
              type="submit"
              disabled={carregando}
              style={{
                width: '100%',
                padding: '12px',
                background: carregando ? '#888' : '#1a1a2e',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontSize: 15,
                fontWeight: 600,
                cursor: carregando ? 'not-allowed' : 'pointer',
                fontFamily: 'sans-serif',
                transition: 'background 0.2s',
                letterSpacing: '0.02em',
              }}
            >
              {carregando ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <div style={{
            marginTop: '1.5rem',
            padding: '1rem',
            background: '#f8f8f8',
            borderRadius: 8,
            fontSize: 12,
            color: '#888',
            fontFamily: 'sans-serif',
          }}>
            <p style={{ margin: '0 0 4px', fontWeight: 600, color: '#555' }}>Credenciais de teste:</p>
            <p style={{ margin: 0 }}>joao@email.com / 123456</p>
            <p style={{ margin: 0 }}>maria@email.com / 123456</p>
          </div>
        </div>
      </div>
    </div>
  );
}

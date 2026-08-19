import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function Login() {
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setErro('');
    setCarregando(true);
    try {
      await login(usuario, senha);
      navigate('/');
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <img src="/moringa-logo.png" alt="Portaria Moringa" className="login-logo" />
        <h1>Controle de encomendas</h1>
        <p className="subtitle">Condomínio Moringa</p>

        <label>
          Usuário
          <input
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            autoFocus
            required
          />
        </label>

        <label>
          Senha
          <input
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
          />
        </label>

        {erro && <p className="erro">{erro}</p>}

        <button type="submit" disabled={carregando}>
          {carregando ? 'entrando...' : 'entrar'}
        </button>
      </form>
    </div>
  );
}
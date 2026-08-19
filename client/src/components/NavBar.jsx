import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function NavBar() {
  const { usuario, logout } = useAuth();

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <img src="/moringa-logo.png" alt="Portaria Moringa" className="navbar-logo" />
      </div>
      <div className="navbar-links">
        <NavLink to="/" end>Pendentes</NavLink>
        <NavLink to="/nova">Nova encomenda</NavLink>
        <NavLink to="/historico">Histórico</NavLink>
        <NavLink to="/moradores">Moradores</NavLink>
      </div>
      <div className="navbar-user">
        <span>{usuario}</span>
        <button onClick={logout} className="btn-ghost">Sair</button>
      </div>
    </nav>
  );
}
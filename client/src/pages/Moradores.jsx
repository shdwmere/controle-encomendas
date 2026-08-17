import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

export function Moradores() {
  const { token } = useAuth();
  const [moradores, setMoradores] = useState([]);
  const [casa, setCasa] = useState('');
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  const [editandoId, setEditandoId] = useState(null);
  const [editCasa, setEditCasa] = useState('');
  const [editNome, setEditNome] = useState('');
  const [editTelefone, setEditTelefone] = useState('');
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);

  async function carregar() {
    const dados = await api.listarMoradores(token);
    setMoradores(dados);
  }

  useEffect(() => {
    carregar();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setErro('');
    setSalvando(true);
    try {
      await api.criarMorador(token, { casa, nome, telefone });
      setCasa('');
      setNome('');
      setTelefone('');
      carregar();
    } catch (err) {
      setErro(err.message);
    } finally {
      setSalvando(false);
    }
  }

  function iniciarEdicao(m) {
    setEditandoId(m.id_morador);
    setEditCasa(m.casa);
    setEditNome(m.nome);
    setEditTelefone(m.telefone);
  }

  function cancelarEdicao() {
    setEditandoId(null);
  }

  async function salvarEdicao(id) {
    setSalvandoEdicao(true);
    try {
      await api.atualizarMorador(token, id, {
        casa: editCasa,
        nome: editNome,
        telefone: editTelefone,
      });
      setEditandoId(null);
      carregar();
    } catch (err) {
      alert(err.message);
    } finally {
      setSalvandoEdicao(false);
    }
  }

  async function handleExcluir(m) {
    if (!confirm(`Excluir o morador da casa ${m.casa} (${m.nome})?`)) return;
    try {
      await api.excluirMorador(token, m.id_morador);
      carregar();
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div className="page">
      <h1>Moradores</h1>

      <form className="form-card form-inline" onSubmit={handleSubmit}>
        <label>
          Casa
          <input value={casa} onChange={(e) => setCasa(e.target.value)} required />
        </label>
        <label>
          Nome
          <input value={nome} onChange={(e) => setNome(e.target.value)} required />
        </label>
        <label>
          WhatsApp (opcional)
          <input value={telefone} onChange={(e) => setTelefone(e.target.value)} />
        </label>
        <button type="submit" disabled={salvando}>
          {salvando ? 'salvando...' : 'adicionar'}
        </button>
      </form>

      {erro && <p className="erro">{erro}</p>}

      <table className="tabela">
        <thead>
          <tr>
            <th>casa</th>
            <th>nome</th>
            <th>whatsapp</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {moradores.map((m) =>
            editandoId === m.id_morador ? (
              <tr key={m.id_morador} className="linha-edicao">
                <td>
                  <input value={editCasa} onChange={(e) => setEditCasa(e.target.value)} />
                </td>
                <td>
                  <input value={editNome} onChange={(e) => setEditNome(e.target.value)} />
                </td>
                <td>
                  <input value={editTelefone} onChange={(e) => setEditTelefone(e.target.value)} />
                </td>
                <td className="tabela-acoes">
                  <button
                    className="btn-link"
                    onClick={() => salvarEdicao(m.id_morador)}
                    disabled={salvandoEdicao}
                  >
                    salvar
                  </button>
                  <button className="btn-link btn-link-cancelar" onClick={cancelarEdicao}>
                    cancelar
                  </button>
                </td>
              </tr>
            ) : (
              <tr key={m.id_morador}>
                <td>{m.casa}</td>
                <td>{m.nome}</td>
                <td>{m.telefone || '—'}</td>
                <td className="tabela-acoes">
                  <button className="btn-link" onClick={() => iniciarEdicao(m)}>
                    editar
                  </button>
                  <button className="btn-link btn-link-perigo" onClick={() => handleExcluir(m)}>
                    excluir
                  </button>
                </td>
              </tr>
            )
          )}
        </tbody>
      </table>
    </div>
  );
}
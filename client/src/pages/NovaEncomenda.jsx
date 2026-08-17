import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

export function NovaEncomenda() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [moradores, setMoradores] = useState([]);
  const [busca, setBusca] = useState('');
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false);
  const [idMorador, setIdMorador] = useState('');

  const [destinatario, setDestinatario] = useState('');
  const [quantidade, setQuantidade] = useState(1);
  const [observacao, setObservacao] = useState('');
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    api.listarMoradores(token).then(setMoradores).catch((err) => setErro(err.message));
  }, []);

  const moradoresFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return moradores;
    return moradores.filter(
      (m) => m.casa.toLowerCase().includes(termo) || m.nome.toLowerCase().includes(termo)
    );
  }, [busca, moradores]);

  function handleBuscaChange(valor) {
    setBusca(valor);
    setMostrarSugestoes(true);
    if (idMorador) setIdMorador(''); // editou depois de já ter escolhido: força escolher de novo
  }

  function selecionarMorador(m) {
    setIdMorador(m.id_morador);
    setBusca(`casa ${m.casa} — ${m.nome}`);
    setDestinatario(m.nome);
    setMostrarSugestoes(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErro('');

    if (!idMorador || !destinatario) {
      setErro('escolha o morador na lista e confirme o destinatário');
      return;
    }

    setSalvando(true);
    try {
      await api.criarEncomenda(token, {
        id_morador: idMorador,
        destinatario,
        quantidade: Number(quantidade) || 1,
        observacao: observacao || null,
      });
      navigate('/');
    } catch (err) {
      setErro(err.message);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="page page-estreita">
      <h1>Nova encomenda</h1>

      <form className="form-card" onSubmit={handleSubmit}>
        <label className="combobox-wrapper">
          Morador / casa
          <input
            value={busca}
            onChange={(e) => handleBuscaChange(e.target.value)}
            onFocus={() => setMostrarSugestoes(true)}
            onBlur={() => setTimeout(() => setMostrarSugestoes(false), 150)}
            placeholder="busque por casa ou nome"
            autoComplete="off"
            required
          />

          {mostrarSugestoes && busca && (
            <ul className="sugestoes">
              {moradoresFiltrados.length === 0 && (
                <li className="sugestao-vazia">nenhum morador encontrado</li>
              )}
              {moradoresFiltrados.map((m) => (
                <li key={m.id_morador} onMouseDown={() => selecionarMorador(m)}>
                  casa {m.casa} — {m.nome}
                </li>
              ))}
            </ul>
          )}
        </label>

        {idMorador && <p className="hint hint-ok">morador selecionado ✓</p>}

        <label>
          Destinatário (nome no pacote)
          <input value={destinatario} onChange={(e) => setDestinatario(e.target.value)} required />
        </label>

        <label>
          Quantidade
          <input
            type="number"
            min="1"
            value={quantidade}
            onChange={(e) => setQuantidade(e.target.value)}
          />
        </label>

        <label>
          Observação
          <input
            placeholder="caixa amassada, perecível..."
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
          />
        </label>

        {erro && <p className="erro">{erro}</p>}

        <button type="submit" disabled={salvando}>
          {salvando ? 'salvando...' : 'registrar encomenda'}
        </button>
      </form>
    </div>
  );
}
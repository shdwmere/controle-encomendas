import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

function formatarData(iso) {
  return new Date(iso + 'Z').toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function linkWhatsapp(telefone, destinatario, casa) {
  const numero = (telefone || '').replace(/\D/g, '');
  const texto = encodeURIComponent(
    `Olá! Uma encomenda para ${destinatario} (casa ${casa}) chegou na portaria.`
  );
  return `https://wa.me/55${numero}?text=${texto}`;
}

export function Dashboard() {
  const { token } = useAuth();
  const [encomendas, setEncomendas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  const [editandoId, setEditandoId] = useState(null);
  const [editDestinatario, setEditDestinatario] = useState('');
  const [editQuantidade, setEditQuantidade] = useState(1);
  const [editObservacao, setEditObservacao] = useState('');
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);

  async function carregar() {
    setCarregando(true);
    try {
      const dados = await api.listarEncomendas(token, 'PENDENTE');
      setEncomendas(dados);
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  async function handleEntregar(id) {
    try {
      await api.marcarEntregue(token, id);
      setEncomendas((prev) => prev.filter((e) => e.id_encomenda !== id));
    } catch (err) {
      alert(err.message);
    }
  }

  function iniciarEdicao(e) {
    setEditandoId(e.id_encomenda);
    setEditDestinatario(e.destinatario);
    setEditQuantidade(e.quantidade);
    setEditObservacao(e.observacao || '');
  }

  function cancelarEdicao() {
    setEditandoId(null);
  }

  async function salvarEdicao(id) {
    setSalvandoEdicao(true);
    try {
      await api.atualizarEncomenda(token, id, {
        destinatario: editDestinatario,
        quantidade: Number(editQuantidade) || 1,
        observacao: editObservacao || null,
      });
      setEditandoId(null);
      carregar();
    } catch (err) {
      alert(err.message);
    } finally {
      setSalvandoEdicao(false);
    }
  }

  if (carregando) return <p className="msg">carregando...</p>;
  if (erro) return <p className="msg erro">{erro}</p>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Pendentes</h1>
        <span className="badge">{encomendas.length}</span>
      </div>

      {encomendas.length === 0 && (
        <p className="msg">nenhuma encomenda pendente. portaria em dia.</p>
      )}

      <div className="lista-encomendas">
        {encomendas.map((e) =>
          editandoId === e.id_encomenda ? (
            <div key={e.id_encomenda} className="card-encomenda card-edicao">
              <label>
                Destinatário
                <input
                  value={editDestinatario}
                  onChange={(ev) => setEditDestinatario(ev.target.value)}
                />
              </label>

              <div className="form-linha">
                <label>
                  Quantidade
                  <input
                    type="number"
                    min="1"
                    value={editQuantidade}
                    onChange={(ev) => setEditQuantidade(ev.target.value)}
                  />
                </label>
                <label>
                  Observação
                  <input
                    value={editObservacao}
                    onChange={(ev) => setEditObservacao(ev.target.value)}
                  />
                </label>
              </div>

              <div className="card-acoes">
                <button className="btn-secundario" onClick={cancelarEdicao} type="button">
                  cancelar
                </button>
                <button
                  className="btn-primario"
                  onClick={() => salvarEdicao(e.id_encomenda)}
                  disabled={salvandoEdicao}
                  type="button"
                >
                  {salvandoEdicao ? 'salvando...' : 'salvar alterações'}
                </button>
              </div>
            </div>
          ) : (
            <div key={e.id_encomenda} className="card-encomenda">
              <div className="card-topo">
                <span className="casa">casa {e.casa}</span>
                <span className="data">{formatarData(e.data_recebimento)}</span>
              </div>

              <p className="destinatario">{e.destinatario}</p>
              <p className="morador-nome">morador: {e.nome_morador}</p>

              <div className="detalhes">
                {e.quantidade > 1 && <span className="tag">{e.quantidade}x volumes</span>}
                {e.observacao && <span className="tag tag-obs">{e.observacao}</span>}
              </div>

              <div className="card-acoes">
                <button className="btn-link" onClick={() => iniciarEdicao(e)} type="button">
                  editar
                </button>
                {e.telefone ? (
                  <a
                    href={linkWhatsapp(e.telefone, e.destinatario, e.casa)}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-secundario"
                  >
                    avisar morador
                  </a>
                ) : (
                  <span className="btn-secundario btn-desabilitado" title="morador sem telefone cadastrado">
                    sem telefone
                  </span>
                )}
                <button onClick={() => handleEntregar(e.id_encomenda)} className="btn-primario" type="button">
                  marcar como entregue
                </button>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
import { useEffect, useMemo, useState } from 'react';
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

function saudacaoPorHorario(data = new Date()) {
  const minutos = data.getHours() * 60 + data.getMinutes();

  const inicioBomDia = 5 * 60; // 5:00 am
  const inicioBoaTarde = 5 * 60; // 12:01 pm
  const fimBoaTarde = 5 * 60; // 17:30 pm

  if (minutos >= inicioBomDia && minutos < inicioBoaTarde) return 'Bom dia';
  if (minutos >= inicioBoaTarde && minutos <= fimBoaTarde) return 'Boa tarde';
  return 'Boa noite'; // cobre 17:31-23:59, 00:00-04:00 e o buraco 04:01-04:59
}

function linkWhatsapp(telefone, destinatario, casa) {
  const numero = (telefone || '').replace(/\D/g, '');
  const saudacao = saudacaoPorHorario();
  const texto = encodeURIComponent(
    `${saudacao.charAt(0).toUpperCase() + saudacao.slice(1)}, ${destinatario}! chegou uma encomenda aqui na portaria.`
  );
  return `https://wa.me/55${numero}?text=${texto}`;
}

export function Dashboard() {
  const { token } = useAuth();

  const [encomendas, setEncomendas] = useState([]);
  const [busca, setBusca] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  const [editandoId, setEditandoId] = useState(null);
  const [editDestinatario, setEditDestinatario] = useState('');
  const [editQuantidade, setEditQuantidade] = useState(1);
  const [editObservacao, setEditObservacao] = useState('');
  const [editDataChegada, setEditDataChegada] = useState('');
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);

  const [confirmandoEntrega, setConfirmandoEntrega] = useState(null);
  const [entregando, setEntregando] = useState(false);

  const [confirmandoExclusao, setConfirmandoExclusao] = useState(null);
  const [excluindo, setExcluindo] = useState(false);


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

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return encomendas;
    return encomendas.filter(
      (e) =>
        e.casa.toLowerCase().includes(termo) ||
        e.nome_morador.toLowerCase().includes(termo)
    );
  }, [busca, encomendas]);

  // ====== entrega =======
  function pedirEntrega(e) {
    setConfirmandoEntrega(e);
  }

  function cancelarEntrega(e) {
    if (entregando) return;
    setConfirmandoEntrega(null);
  }

  async function confirmarEntrega() {
    if (!confirmandoEntrega) return;
    setEntregando(true);
    try {
      await api.marcarEntregue(token, confirmandoEntrega.id_encomenda);
      setEncomendas((prev) => prev.filter((e) => e.id_encomenda !== confirmandoEntrega.id_encomenda));
      setConfirmandoEntrega(null);
    } catch (err) {
      alert(err.message);
    } finally {
      setEntregando(false);
    }
  }
  // ======================

  // ====== exclusao ======
  function pedirExclusao(e) {
    setConfirmandoExclusao(e);
  }

  function cancelarExclusao(e) {
    if (excluindo) return;
    setConfirmandoExclusao(null);
  }

  async function confirmarExclusao() {
    if (!confirmandoExclusao) return;
    setExcluindo(true);
    try {
      await api.deletarEncomenda(token, confirmandoExclusao.id_encomenda);
      setEncomendas((prev) => prev.filter((e) => e.id_encomenda !== confirmandoExclusao.id_encomenda));
      setConfirmandoExclusao(null);
    } catch (err) {
      alert(err.message);
    } finally {
      setExcluindo(false);
    }
  }
  // ======================

  // ====== edicao ========
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
  // ======================

  if (carregando) return <p className="msg">carregando...</p>;
  if (erro) return <p className="msg erro">{erro}</p>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Pendentes</h1>
        <span className="badge">{encomendas.length}</span>
      </div>

      {encomendas.length > 0 && (
        <input
          className="input-busca"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="buscar por casa ou morador"
        />
      )}

      {encomendas.length === 0 && (
        <p className="msg">nenhuma encomenda pendente. portaria em dia.</p>
      )}

      {encomendas.length > 0 && filtradas.length === 0 && (
        <p className="msg">nenhuma encomenda encontrada para "{busca}".</p>
      )}

      <div className="lista-encomendas">
        {filtradas.map((e) =>
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

                <label>
                  Data e hora de chegada
                  <input
                    type="datetime-local"
                    value={editDataChegada}
                    onChange={(e) => setEditDataChegada(e.target.value)}
                    required
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
                <span className="data-e-hora-chegada">RECEBIDO EM: {formatarData(e.data_recebimento)}</span>
              </div>

              <p className="destinatario">{e.destinatario}</p>

              <div className="detalhes">
                {e.quantidade > 1 && <span className="tag">{e.quantidade}x volumes</span>}
                {e.observacao && <span className="tag tag-obs">{e.observacao}</span>}
              </div>

              <div className="card-acoes">
                <button className="btn-secundario" onClick={() => iniciarEdicao(e)} type="button">
                  EDITAR
                </button>
                {e.telefone ? (
                  <div className="btn-secundario">
                    <img src="/whatsapp.svg" width="20" height="20"/>
                    <a
                      href={linkWhatsapp(e.telefone, e.destinatario, e.casa)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      AVISAR
                    </a>
                  </div>
                ) : (
                  <span className="btn-secundario btn-desabilitado" title="morador sem telefone cadastrado">
                    sem telefone
                  </span>
                )}
                <button onClick={() => pedirEntrega(e)} 
                  className="btn-primario" 
                  type="button"
                >
                  ENTREGUE
                </button>
                <button onClick={() => pedirExclusao(e)} 
                  className="btn-danger" 
                  type="button"
                  title="excluir encomenda"
                >
                  EXCLUIR
                </button>
              </div>
            </div>
          )
        )}
      </div>

      {confirmandoEntrega && (
        <div className="modal-overlay" onClick={cancelarEntrega}>
          <div className="modal-confirmacao modal-confirmacao--positiva" onClick={(ev) => ev.stopPropagation()}>
            <h2>Marcar como entregue?</h2>
            <p>
              Confirma a entrega da encomenda de{' '}
              <strong>{confirmandoEntrega.destinatario}</strong> (casa {confirmandoEntrega.casa})?
            </p>
            <div className="card-acoes">
              <button className="btn-secundario" onClick={cancelarEntrega} type="button" disabled={entregando}>
                cancelar
              </button>
              <button className="btn-primario" onClick={confirmarEntrega} type="button" disabled={entregando}>
                {entregando ? 'confirmando...' : 'sim, entregue'}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmandoExclusao && (
        <div className="modal-overlay" onClick={cancelarExclusao}>
          <div className="modal-confirmacao" onClick={(ev) => ev.stopPropagation()}>
            <h2>Excluir encomenda?</h2>
            <p>
              Tem certeza que deseja excluir a encomenda de{' '}
              <strong>{confirmandoExclusao.destinatario}</strong> (casa {confirmandoExclusao.casa})?
              Essa ação não pode ser desfeita.
            </p>
            <div className="card-acoes">
              <button
                className="btn-secundario"
                onClick={cancelarExclusao}
                type="button"
                disabled={excluindo}
              >
                cancelar
              </button>
              <button
                className="btn-danger"
                onClick={confirmarExclusao}
                type="button"
                disabled={excluindo}
              >
                {excluindo ? 'excluindo...' : 'sim, excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
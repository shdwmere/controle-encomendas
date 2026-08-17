import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

function formatarData(iso) {
  return new Date(iso + 'Z').toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function Historico() {
  const { token } = useAuth();
  const [encomendas, setEncomendas] = useState([]);
  const [busca, setBusca] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    api
      .listarEncomendas(token, 'ENTREGUE')
      .then(setEncomendas)
      .catch((err) => setErro(err.message))
      .finally(() => setCarregando(false));
  }, []);

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return encomendas;
    return encomendas.filter(
      (e) =>
        e.casa.toLowerCase().includes(termo) ||
        e.nome_morador.toLowerCase().includes(termo) ||
        e.destinatario.toLowerCase().includes(termo)
    );
  }, [busca, encomendas]);

  if (carregando) return <p className="msg">carregando...</p>;
  if (erro) return <p className="msg erro">{erro}</p>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Histórico</h1>
        <span className="badge badge-neutro">{encomendas.length}</span>
      </div>

      <input
        className="input-busca"
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        placeholder="buscar por casa, morador ou destinatário"
      />

      {filtradas.length === 0 && <p className="msg">nada encontrado no arquivo.</p>}

      <div className="lista-encomendas">
        {filtradas.map((e) => (
          <div key={e.id_encomenda} className="card-encomenda card-arquivada">
            <div className="card-topo">
              <span className="casa">casa {e.casa}</span>
              <span className="data">entregue {formatarData(e.data_entrega)}</span>
            </div>

            <p className="destinatario">{e.destinatario}</p>
            <p className="morador-nome">
              morador: {e.nome_morador} · chegou {formatarData(e.data_recebimento)}
            </p>

            <div className="detalhes">
              {e.quantidade > 1 && <span className="tag">{e.quantidade}x volumes</span>}
              {e.observacao && <span className="tag tag-obs">{e.observacao}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
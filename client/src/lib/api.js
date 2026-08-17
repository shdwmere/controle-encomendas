const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

async function request(path, { method = 'GET', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && token) {
    // essa era uma chamada autenticada — token não é mais válido no servidor
    // (reiniciou, expirou, etc). limpa e manda pro login.
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
    throw new Error('sessão expirada, faça login novamente');
  }

  if (res.status === 204) return null;

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.erro || `erro ${res.status}`);
  }

  return data;
}

export const api = {
  login: (usuario, senha) => request('/auth/login', { method: 'POST', body: { usuario, senha } }),
  logout: (token) => request('/auth/logout', { method: 'POST', token }),

  listarMoradores: (token) => request('/moradores', { token }),
  criarMorador: (token, morador) => request('/moradores', { method: 'POST', body: morador, token }),
  atualizarMorador: (token, id, morador) =>
    request(`/moradores/${id}`, { method: 'PATCH', body: morador, token }),
  excluirMorador: (token, id) => request(`/moradores/${id}`, { method: 'DELETE', token }),

  listarEncomendas: (token, status) =>
    request(`/encomendas${status ? `?status=${status}` : ''}`, { token }),
  criarEncomenda: (token, encomenda) =>
    request('/encomendas', { method: 'POST', body: encomenda, token }),
  atualizarEncomenda: (token, id, encomenda) =>
    request(`/encomendas/${id}`, { method: 'PATCH', body: encomenda, token }),
  marcarEntregue: (token, id) =>
    request(`/encomendas/${id}/entregar`, { method: 'PATCH', token }),
};
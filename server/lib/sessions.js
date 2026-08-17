// sessoes em memória. espera-se só dois usuarios simultaneos, sem concorrencia real..
// reiniciar o server derruba os logins ativos, e tudo bem.
export const sessions = new Map();
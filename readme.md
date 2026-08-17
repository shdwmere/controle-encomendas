# Controle de Encomendas — Condomínio Moringa

Sistema interno para os porteiros registrarem e consultarem encomendas com agilidade. Sem nuvem, sem assinatura, sem intermediário — roda na rede local do condomínio.

## Sumário

- [Sobre](#sobre)
- [Stack](#stack)
- [Estrutura do repositório](#estrutura-do-repositório)
- [Funcionalidades](#funcionalidades)
- [Fora de escopo (decisão deliberada)](#fora-de-escopo-decisão-deliberada)
- [Pré-requisitos](#pré-requisitos)
- [Configuração — Servidor](#configuração--servidor)
- [Configuração — Client](#configuração--client)
- [Acesso pela rede local](#acesso-pela-rede-local)
- [Rodando no Termux](#rodando-no-termux)
- [API — referência rápida](#api--referência-rápida)
- [Modelo de dados](#modelo-de-dados)
- [Decisões de arquitetura](#decisões-de-arquitetura)
- [Manutenção e problemas conhecidos](#manutenção-e-problemas-conhecidos)

## Sobre

O painel do porteiro. O objetivo é bater o olho na tela e saber exatamente o que está ocupando espaço na portaria e deve ser entregue ao destinatario — sem histórico infinito atrapalhando, sem cadastro complicado, sem papel e caneta.

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React + Vite |
| Backend | Node.js + Express |
| Banco | SQLite (`better-sqlite3`, arquivo local) |
| Autenticação | Token em memória, sem JWT, sem OAuth |

## Estrutura do repositório

```
.
├── client/                  # frontend React + Vite
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── index.css
│       ├── lib/api.js       # client HTTP central, trata 401 globalmente
│       ├── context/AuthContext.jsx
│       ├── components/      # NavBar, ProtectedRoute
│       └── pages/           # Login, Dashboard, NovaEncomenda, Historico, Moradores
│
└── server/                  # API Express + SQLite
    ├── index.js
    ├── db/
    │   ├── schema.sql
    │   └── connection.js
    ├── routes/               # auth, moradores, encomendas
    ├── lib/                  # sessions, requireAuth
    └── scripts/
        └── criar-usuario.js
```

## Funcionalidades

- **Dashboard de pendentes** — ordenado do mais antigo pro mais novo, o que precisa de atenção primeiro.
- **Nova encomenda** — busca de morador por casa ou nome (combobox com sugestão em tempo real), destinatário pré-preenchido com o nome do morador, e data/hora de chegada editável (default: agora), pra lançar encomendas retroativas de antes do sistema existir.
- **Aviso via WhatsApp** — botão de um clique que monta o link `wa.me` com o número do morador. Se não houver telefone cadastrado, o botão vira um aviso desabilitado em vez de quebrar.
- **Edição de encomenda** — destinatário, quantidade e observação são editáveis depois de lançada, pra quando chega mais volume no mesmo dia pro mesmo morador.
- **Baixa rápida** — um botão marca como entregue e registra o timestamp.
- **Histórico** — arquivo de tudo que já foi entregue, mais recente primeiro, com busca por casa, morador ou destinatário. Nada é apagado ao dar baixa.
- **Moradores** — cadastro, edição inline e exclusão. Telefone é opcional. Exclusão é bloqueada se houver qualquer encomenda vinculada ao morador (o servidor recusa com a contagem, em vez de derrubar histórico silenciosamente).

## Fora de escopo (decisão deliberada)

Essas ideias apareceram na concepção do projeto e foram cortadas conscientemente:

- **PWA / instalação na tela inicial** — descartado. É um site normal, aberto pelo navegador.
- **Scanner de código de rastreio via câmera** — descartado junto com o PWA. Câmera exige contexto seguro (HTTPS), o que adicionaria complexidade desproporcional ao ganho.
- **Campo de rastreio** — o condomínio não usa, então nem existe mais no banco, na API ou na tela.

## Pré-requisitos

- Node.js 18+ (recomendado 20+)
- No **Termux**, instale as ferramentas de build antes de instalar as dependências do servidor (o `better-sqlite3` compila código nativo):
  ```bash
  pkg install nodejs-lts python build-essential
  ```

## Configuração — Servidor

```bash
cd server
npm install
npm run criar-usuario -- <usuario> <senha>
npm start
```

O servidor sobe em `http://0.0.0.0:3001` por padrão — escuta em todas as interfaces de propósito, pra ficar acessível por outros dispositivos na rede local, não só localhost.

O banco `server/db/encomendas.db` é criado automaticamente na primeira execução, a partir de `server/db/schema.sql`.

**Scripts disponíveis:**

| Comando | O que faz |
|---|---|
| `npm start` | Inicia o servidor |
| `npm run dev` | Inicia com `--watch`, reinicia sozinho a cada alteração |
| `npm run criar-usuario -- <usuario> <senha>` | Cria um operador (porteiro) no banco |

**Variável de ambiente opcional:** `PORT` (padrão `3001`).

## Configuração — Client

```bash
cd client
npm install
npm run dev
```

Se o servidor **não** estiver em `localhost` (caso normal — vai estar no Termux ou no PC da portaria), crie um `.env` em `client/`:

```
VITE_API_URL=http://IP_DO_SERVIDOR:3001/api
```

## Acesso pela rede local

Servidor e client precisam estar acessíveis pelos dois porteiros. Com o servidor escutando em `0.0.0.0` e o `.env` do client apontando pro IP certo, basta abrir `http://IP_DO_SERVIDOR:5173` (modo dev) de qualquer celular ou PC na mesma rede Wi-Fi.

## Rodando no Termux

Termux mata processos em segundo plano sem aviso. Mantenha o servidor de pé assim:

```bash
termux-wake-lock
pkg install tmux
tmux new -s servidor
node server/index.js
# Ctrl+B, depois D — sai da sessão sem matar o processo
```

Pra voltar depois: `tmux attach -t servidor`.

## API — referência rápida

Toda rota exige `Authorization: Bearer <token>`, exceto `/api/auth/login`.

**Auth**
| Método | Rota | Descrição |
|---|---|---|
| POST | `/api/auth/login` | Autentica, retorna token |
| POST | `/api/auth/logout` | Invalida o token atual |

**Moradores**
| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/moradores` | Lista todos |
| POST | `/api/moradores` | Cria (casa + nome obrigatórios, telefone opcional) |
| GET | `/api/moradores/:id` | Detalhe |
| PATCH | `/api/moradores/:id` | Atualiza |
| DELETE | `/api/moradores/:id` | Exclui — recusa (409) se houver encomendas vinculadas |

**Encomendas**
| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/encomendas?status=` | Lista (filtro opcional: `PENDENTE`, `ENTREGUE`, `DEVOLVIDA`) |
| POST | `/api/encomendas` | Cria (`data_recebimento` opcional, default agora) |
| GET | `/api/encomendas/:id` | Detalhe |
| PATCH | `/api/encomendas/:id` | Atualiza destinatário, quantidade e observação |
| PATCH | `/api/encomendas/:id/entregar` | Baixa — registra `data_entrega` e muda status |

## Modelo de dados

```sql
usuarios (id_usuario, usuario, senha_hash)

moradores (id_morador, casa, nome, telefone)  -- telefone opcional

encomendas (
  id_encomenda, id_morador, destinatario,
  data_recebimento, data_entrega,
  quantidade, observacao,
  status  -- PENDENTE | ENTREGUE | DEVOLVIDA
)
```

## Decisões de arquitetura

Pra quem for mexer depois e estranhar alguma escolha:

- **Sessões em memória, não em banco.** Reiniciar o servidor derruba todos os logins ativos — isso é esperado, não bug. O client detecta o 401 de uma requisição autenticada e redireciona pro login sozinho, sem precisar de F5.
- **Sem ORM.** `better-sqlite3` puro, síncrono, SQL direto. Camada de abstração seria peso morto pra esse volume de dados e dois usuários.
- **Sem HTTPS obrigatório.** Só é seguro fazer essa concessão porque câmera e PWA foram descartados — nada no sistema depende de contexto seguro do navegador.
- **Telefone do morador é opcional.** Nem todo morador quer ou precisa de aviso por WhatsApp; o sistema não pode travar por isso.
- **Exclusão de morador é protegida, não é cascata.** Apagar um morador com encomendas vinculadas apagaria histórico junto sem aviso — o servidor recusa e informa quantas encomendas estão no caminho.

## Manutenção e problemas conhecidos

- `schema.sql` usa `CREATE TABLE IF NOT EXISTS` — isso **não migra** uma tabela já existente. Se o schema mudar depois de o banco já estar em uso, apague `server/db/encomendas.db` (e os arquivos `-wal`/`-shm` junto) para recriar do zero, ou escreva uma migração manual se já houver dado real que importa.
- Lançar uma encomenda com data de chegada retroativa é intencional (pra digitar o que já estava na portaria antes do sistema existir), mas ela vai aparecer no topo dos "Pendentes" como se fosse a mais urgente — comportamento correto, não é bug.
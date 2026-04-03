
## Plano: Implementar funcionalidades faltantes + Rebrand

### 1. Rebrand — "VivaBem Emagrecimento" → "PéSaúde"
- **VivaBemLogin.tsx** → Atualizar textos ("Emagrecimento para mulheres" → "Saúde dos Pés"), ícone Heart → Footprints
- **VivaBemHome.tsx** → Mudar header, seções ("Seus Treinos" → "Seus Cuidados", "Presentes" → "Dicas Gratuitas")
- **VivaBemSidebar.tsx** → Mudar logo/nome para "PéSaúde", adicionar itens Loja e Blog
- **index.css** → Ajustar cores se necessário (manter paleta rosa/verde/grafite existente)

### 2. Quiz antes do login (nova página)
- Criar **`/quiz`** como rota inicial (antes do login)
- Fluxo: `/` (landing com CTA) → `/quiz` → após completar → `/` (login/cadastro)
- Quiz com 3-4 perguntas sobre saúde dos pés:
  - "Qual seu principal problema?" (dor, calosidade, unha encravada, etc.)
  - "Com que frequência sente desconforto?"
  - "Já consultou um podólogo?"
- Visual com cards de opção, progresso, animações
- Resultado salvo em localStorage para uso futuro

### 3. Loja de Produtos (nova página)
- Criar **`/loja`** no menu lateral
- Grid de produtos com imagem, nome, preço e botão "Comprar" que abre link externo (`sales_page_url`)
- Busca produtos do banco com `offer_type !== 'free'` e `sales_page_url` preenchido
- Se não houver `sales_page_url`, mostra botão desabilitado

### 4. Blog (nova página)
- Criar **`/blog`** no menu lateral
- Exibe módulos com `content_type = 'text'` como artigos de blog
- Card com título, descrição, data, clicável para expandir o conteúdo HTML

### Rotas atualizadas no App.tsx
```
/ → Landing simples com CTA para quiz
/quiz → Página do quiz
/login → Login/Cadastro (atual VivaBemLogin adaptado)
/home → Home (protegida)
/loja → Loja de produtos
/blog → Blog
```

### Arquivos alterados
| Arquivo | Ação |
|---|---|
| `src/pages/QuizPage.tsx` | **Criar** — Quiz de saúde dos pés |
| `src/pages/StorePage.tsx` | **Criar** — Loja com links externos |
| `src/pages/BlogPage.tsx` | **Criar** — Blog com artigos |
| `src/App.tsx` | Adicionar rotas /quiz, /loja, /blog |
| `src/components/VivaBemSidebar.tsx` | Adicionar Loja e Blog, rebrand |
| `src/pages/VivaBemLogin.tsx` | Rebrand textos e ícone |
| `src/pages/VivaBemHome.tsx` | Rebrand seções e textos |
| `index.html` | Atualizar título da página |

### Sem migração SQL necessária
Usa tabelas existentes (`products`, `modules`). Quiz salva em localStorage.

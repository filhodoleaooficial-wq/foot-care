

## Plano: Corrigir rotas faltantes na Home do VivaBem

### Problema identificado

Dois problemas causam 404 na Home:

1. **Rota `/produto/:productId` não existe** — `VivaBemHome.tsx` navega para `/produto/${product.id}` ao clicar nos cards, mas essa rota não está definida no `App.tsx`.
2. **Rota `/instalar` não existe** — O menu lateral (`VivaBemSidebar.tsx`) tem o item "Instalar Aplicativo" apontando para `/instalar`, que não existe.

### Solução

| Arquivo | Alteração |
|---|---|
| `src/pages/VivaBemProduct.tsx` | **Criar** página de visualização de produto (lista módulos e aulas do produto) |
| `src/pages/InstallAppPage.tsx` | **Criar** página simples com instruções PWA "Adicionar à tela inicial" |
| `src/App.tsx` | Adicionar rotas `/produto/:productId` e `/instalar` dentro do `VivaBemLayout` |

### Detalhes

**VivaBemProduct** — Recebe `productId` da URL, busca o produto e seus módulos/aulas no banco, exibe lista com player de vídeo/PDF/áudio conforme o tipo de conteúdo. Usa o mesmo visual VivaBem (cores, tipografia).

**InstallAppPage** — Página informativa com instruções para instalar o PWA no celular (iOS Safari: "Compartilhar > Adicionar à Tela", Android Chrome: "Menu > Instalar").


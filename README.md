# Ikatá · site institucional

Site one-page da Ikatá em HTML, CSS e JavaScript puros, publicado como Cloudflare Worker em **https://itaka.pro**.

O Worker (`src/worker.js`) faz quatro coisas: serve os arquivos de `public/`, redireciona `www.itaka.pro` para `itaka.pro`, recebe o formulário de contato em `POST /api/contato` e aplica os cabeçalhos de segurança (CSP, HSTS e afins).

## Estrutura

```
public/                   tudo o que vai para o ar
  index.html              página principal (conteúdo em português)
  privacidade.html        aviso de privacidade (PT e EN), servido em /privacidade
  assets/css/styles.css   estilos, mobile first
  assets/js/i18n.js       textos em inglês
  assets/js/main.js       menu, idioma, brasas do hero, ciclo animado, formulário e cookies
  assets/img/             logo, favicon e imagem de compartilhamento
src/worker.js             Worker: assets, redirect do www, API do formulário, cabeçalhos
migrations/               esquema do banco D1 (tabela contatos)
wrangler.jsonc            configuração do Worker, domínios e banco
tools/                    scripts que geram os arquivos de marca
```

## Rodar localmente

```bash
npm install
npx wrangler d1 migrations apply itaka-contatos --local   # só na primeira vez
npm run dev                                              # http://localhost:8787
```

## Publicar

O jeito recomendado é ligar o repositório à Cloudflare, assim cada push no branch de produção publica sozinho:

1. No painel da Cloudflare, vá em **Workers & Pages → Create → Import a repository** e escolha `ealtoti/itaka`.
2. Deixe o comando de deploy como `npx wrangler deploy`. Não precisa de comando de build.
3. Pronto. O `wrangler.jsonc` já liga os domínios `itaka.pro` e `www.itaka.pro` ao Worker e conecta o banco `itaka-contatos`.

Para publicar direto do computador: `npx wrangler login` e depois `npm run deploy`.

Se o deploy reclamar que já existe registro DNS para `itaka.pro` ou `www`, apague o registro antigo em **DNS → Records** e rode de novo.

## Formulário de contato

As mensagens ficam na tabela `contatos` do banco D1 `itaka-contatos`. Para ver as últimas:

```bash
npm run db:contatos
```

Ou no painel: **Storage & Databases → D1 → itaka-contatos → Console**, com `SELECT * FROM contatos ORDER BY id DESC;`.

O Worker valida os campos de novo no servidor, recusa envios de outros domínios e descarta o que cair no campo-armadilha contra robôs.

## Pendências

| O quê | Onde |
|---|---|
| Redes sociais | `CONFIG.social` em `public/assets/js/main.js`. Enquanto estiverem vazias, o rodapé mostra os nomes sem link e o selo "em breve". |
| Ferramenta de medição | O banner de cookies grava a escolha em `localStorage` (`ikata-cookie-consent`: `all` ou `essential`) e dispara o evento `ikata:consent`. Carregue scripts de medição só quando o valor for `all`, e inclua o domínio deles na CSP em `src/worker.js`. |
| Aviso de privacidade | Revisar com o jurídico e incluir razão social, CNPJ e canal do encarregado de dados, se houver. |
| Aviso por e-mail de novos contatos | Opcional. Hoje as mensagens só ficam no D1. |

## Idiomas

O português está escrito direto no HTML. Cada texto traduzível tem um atributo `data-i18n="chave"`, e a versão em inglês fica em `assets/js/i18n.js` com a mesma chave. Para atributos (como `aria-label` e `placeholder`), use `data-i18n-attr="atributo:chave"`.

A escolha fica salva no navegador. Também dá para abrir direto em inglês com `?lang=en`.

## Marca

- O logo é vetorizado a partir da Space Grotesk Bold, com o acento do "á" desenhado como uma chama em degradê de Brasa (#FF5A1F) para Âmbar (#FFB020).
- `tools/build_brand.py` gera, em `public/assets/img/`, `logo-light.svg`, `logo-dark.svg`, `favicon.svg` e `flame.svg` (precisa de `pip install fonttools`).
- `tools/render-images.js` gera `og-image.png`, `favicon-32.png` e `apple-touch-icon.png` (precisa do Playwright).
- As fontes em `tools/` (Space Grotesk e Inter) são usadas só para gerar as imagens. Ambas têm licença SIL Open Font License.

## Acessibilidade e movimento

- Contraste AA verificado com axe-core nas duas páginas, no celular e no desktop.
- As brasas do hero, o ciclo animado e as transições respeitam `prefers-reduced-motion`.
- O gráfico do painel Ikatá Trace tem os valores legíveis por leitor de tela, e os números estão marcados como dados ilustrativos.

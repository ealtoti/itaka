# Ikatá · site institucional

Site one-page da Ikatá, feito em HTML, CSS e JavaScript puros. Não precisa de build: é só publicar a pasta em qualquer hospedagem estática (Netlify, Vercel, Cloudflare Pages, GitHub Pages, S3…).

## Rodar localmente

```bash
npx serve .
# ou
python3 -m http.server 8080
```

## Estrutura

```
index.html            página principal (conteúdo em português)
privacidade.html      aviso de privacidade (PT e EN)
assets/css/styles.css estilos, mobile first
assets/js/i18n.js     textos em inglês
assets/js/main.js     menu, idioma, brasas do hero, ciclo animado, formulário e cookies
assets/img/           logo, favicon e imagem de compartilhamento
tools/                scripts que geram os arquivos de marca
```

## Antes de publicar

Alguns dados ainda não existem e ficaram como ponto de configuração:

| O quê | Onde |
|---|---|
| Domínio definitivo (hoje `www.ikata.com.br`) | `index.html` (canonical, Open Graph, JSON-LD), `privacidade.html`, `robots.txt`, `sitemap.xml` |
| Destino do formulário | `CONFIG.formEndpoint` em `assets/js/main.js`. Aceita qualquer URL que receba JSON via POST (Formspree, Getform, uma API própria). Sem endpoint, o botão abre o app de e-mail com a mensagem pronta para `CONFIG.contactEmail`. |
| E-mail de contato | `CONFIG.contactEmail` em `assets/js/main.js` |
| Redes sociais | `CONFIG.social` em `assets/js/main.js`. Enquanto estiverem vazias, o rodapé mostra os nomes sem link e o selo "em breve". |
| Ferramenta de medição | O banner de cookies grava a escolha em `localStorage` (`ikata-cookie-consent`: `all` ou `essential`) e dispara o evento `ikata:consent`. Carregue scripts de medição só quando o valor for `all`. |
| Aviso de privacidade | Revisar com o jurídico e incluir razão social, CNPJ e canal do encarregado de dados, se houver. |

## Idiomas

O português está escrito direto no HTML. Cada texto traduzível tem um atributo `data-i18n="chave"`, e a versão em inglês fica em `assets/js/i18n.js` com a mesma chave. Para atributos (como `aria-label` e `placeholder`), use `data-i18n-attr="atributo:chave"`.

A escolha fica salva no navegador. Também dá para abrir direto em inglês com `?lang=en`.

## Marca

- O logo é vetorizado a partir da Space Grotesk Bold, com o acento do "á" desenhado como uma chama em degradê de Brasa (#FF5A1F) para Âmbar (#FFB020).
- `tools/build_brand.py` gera `logo-light.svg`, `logo-dark.svg`, `favicon.svg` e `flame.svg` (precisa de `pip install fonttools`).
- `tools/render-images.js` gera `og-image.png`, `favicon-32.png` e `apple-touch-icon.png` (precisa do Playwright).
- As fontes em `tools/` (Space Grotesk e Inter) são usadas só para gerar as imagens. Ambas têm licença SIL Open Font License.

## Acessibilidade e movimento

- Contraste AA verificado com axe-core nas duas páginas, no celular e no desktop.
- As brasas do hero, o ciclo animado e as transições respeitam `prefers-reduced-motion`.
- O gráfico do painel Ikatá Trace tem os valores legíveis por leitor de tela, e os números estão marcados como dados ilustrativos.

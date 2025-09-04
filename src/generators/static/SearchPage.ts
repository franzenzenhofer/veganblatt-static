import path from 'path';
import { SiteConfig } from '../../types';
import { FileSystemManager } from '../../core/FileSystemManager';
import { TemplateEngine } from '../../templates/TemplateEngine';

export class SearchPage {
  constructor(
    private config: SiteConfig,
    private fs: FileSystemManager,
    private template: TemplateEngine
  ) {}

  async generate(): Promise<void> {
    const content = `<h1>Suche</h1>
    <p>Tippe, um Artikel und Rezepte zu finden.</p>
    <input id=\"q\" type=\"search\" placeholder=\"Suche…\" style=\"width:100%;padding:8px;margin:8px 0;\" aria-label=\"Suche\">
    <div id=\"results\" aria-live=\"polite\"></div>

    <script type=\"module\">
      import MiniSearch from '/js/minisearch.esm.js';
      async function init() {
        try {
          // MiniSearch.loadJSON expects a JSON string, not an object
          const idxJson = await fetch('/search-index.json', { cache: 'no-store' }).then(r => r.text());
          const mini = MiniSearch.loadJSON(idxJson, {
            fields: ['title','text'],
            storeFields: ['title','url'],
            searchOptions: { boost: { title: 3 }, fuzzy: 0.2, prefix: true }
          });
          const input = document.querySelector('#q');
          const out = document.querySelector('#results');
          function cleanBrandTitle(t) {
            const brand = 'VeganBlatt';
            const seps = [' - ', ' – ', ' — ', ' | ', ': ', ' • '];
            for (const sep of seps) {
              const suf = sep + brand;
              if (t.endsWith(suf)) return t.slice(0, -suf.length);
            }
            if (t.endsWith(brand)) return t.slice(0, -brand.length).trim();
            return t;
          }
          function render(q) {
            out.innerHTML = '';
            if (!q) return;
            const hits = mini.search(q, { prefix: true, fuzzy: 0.2 });
            out.innerHTML = hits.slice(0, 50).map(h => {
              const t = cleanBrandTitle(h.title || h.url);
              return '<article class=\"article-item\"><div class=\"article-text\"><a class=\"article-link\" href=\"' + h.url + '\">' + t + '</a></div></article>';
            }).join('');
          }
          input.addEventListener('input', e => render(e.target.value.trim()));
          input.focus();
        } catch (e) {
          console.error('Search init failed', e);
        }
      }
      init();
    </script>`;

    const html = this.template.generateLayout(
      'Suche',
      content,
      'css/styles.css',
      {
        url: '/suche.html',
        description: 'Suche nach Artikeln und Rezepten bei VeganBlatt',
        type: 'website'
      }
    );

    await this.fs.writeFile(path.join(this.config.publicDir, 'suche.html'), html);
  }
}


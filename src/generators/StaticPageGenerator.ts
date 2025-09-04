import path from 'path';
import { SiteConfig } from '../types';
import { FileSystemManager } from '../core/FileSystemManager';
import { TemplateEngine } from '../templates/TemplateEngine';

export class StaticPageGenerator {
  constructor(
    private config: SiteConfig,
    private fs: FileSystemManager,
    private template: TemplateEngine
  ) {}

  async generate(): Promise<void> {
    await this.generateImpressum();
    await this.generateSearch();
  }

  private async renderStaticPage(args: {
    filename: string;
    url: string;
    title: string;
    description: string;
    contentHtml: string;
  }): Promise<void> {
    const html = this.template.generateLayout(args.title, args.contentHtml, 'css/styles.css', {
      url: args.url,
      description: args.description,
      type: 'website'
    });
    await this.fs.writeFile(path.join(this.config.publicDir, args.filename), html);
  }

  private async generateImpressum(): Promise<void> {
    const content = `<h1>Impressum</h1>
    
    <p><strong>VeganBlatt</strong><br>
    www.veganblatt.com<br>
    Ein Projekt von Franz Enzenhofer - EPU</p>
    
    <p><strong>Geschäftsführer / Herausgeber:</strong><br>
    Franz Enzenhofer<br>
    fe+veganblatt (at) f19n dot com</p>
    
    <p><strong>Firmenadresse:</strong><br>
    Fröbelgasse 62/8-9<br>
    A-1160 Wien - Österreich</p>
    
    <p><strong>Office:</strong><br>
    Lindengasse 26 / 2. Stock<br>
    A-1070 Wien</p>
    
    <h2>Haftungshinweis</h2>
    <p>Trotz sorgfältiger inhaltlicher Kontrolle übernehmen wir keine Haftung für die Inhalte externer Links. Für den Inhalt der verlinkten Seiten sind ausschließlich deren Betreiber verantwortlich.</p>
    
    <h2>Copyright</h2>
    <p>VeganBlatt ist eine eingetragene Marke. Das Logo von VeganBlatt ist durch unser Copyright rechtlich geschützt.</p>
    
    <p><strong>Copyright Bilder:</strong> Alle Bilder sind, sofern nicht anders gekennzeichnet, Copyright des Seitenbetreibers.</p>
    
    <p><strong>Copyright Texte:</strong> Alle Texte, solang nicht anders erwähnt, sind Copyright des Seitenbetreibers.</p>
    
    <h2>Blattlinie</h2>
    <p>VeganBlatt ist ein Online-Medium mit dem Ziel vegane Lifestylethemen informativ und positiv zu beleuchten.</p>
    
    <hr class="section-divider">
    
    <h2 id="datenschutz">Datenschutzerklärung</h2>
    
    <p><strong>Verantwortlicher im Sinne der DSGVO:</strong><br>
    Franz Enzenhofer<br>
    Fröbelgasse 62/8-9<br>
    A-1160 Wien, Österreich<br>
    E-Mail: fe+veganblatt (at) f19n dot com</p>
    
    <h2>Hosting</h2>
    <p>Diese Website wird auf Cloudflare Pages gehostet. Cloudflare Pages ist ein statischer Hosting-Service, der keine serverseitige Verarbeitung durchführt. Die Server befinden sich weltweit verteilt (CDN).</p>
    
    <p>Cloudflare verarbeitet möglicherweise technische Zugriffsdaten (IP-Adressen, Zugriffszeiten) zum Zweck der Bereitstellung des Dienstes und zum Schutz vor DDoS-Angriffen. Details finden Sie in der <a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noopener noreferrer">Cloudflare Datenschutzerklärung</a>.</p>
    
    <h2>Keine Cookies</h2>
    <p>Diese Website verwendet <strong>keine Cookies</strong>. Es werden keine Informationen in Ihrem Browser gespeichert.</p>
    
    <h2>Keine Analyse-Tools</h2>
    <p>Diese Website verwendet <strong>keine Analyse-Tools</strong> wie Google Analytics, Matomo oder ähnliche Dienste. Es findet keine Nachverfolgung Ihres Surfverhaltens statt.</p>
    
    <h2>Keine Datenerhebung</h2>
    <p>Diese Website erhebt <strong>keine personenbezogenen Daten</strong>. Es gibt keine Kontaktformulare, Newsletter-Anmeldungen oder Kommentarfunktionen.</p>
    
    <h2>Externe Links</h2>
    <p>Diese Website enthält Links zu externen Websites. Beim Klicken auf diese Links verlassen Sie unsere Website. Wir haben keinen Einfluss auf die Datenverarbeitung der verlinkten Websites. Bitte informieren Sie sich dort über den jeweiligen Datenschutz.</p>
    
    <h2>YouTube-Videos</h2>
    <p>Anstelle von eingebetteten YouTube-Videos verwenden wir nur Links zu YouTube. Erst wenn Sie auf einen Link klicken, werden Sie zu YouTube weitergeleitet und YouTube kann Daten über Sie erheben.</p>
    
    <h2>Ihre Rechte nach DSGVO</h2>
    <p>Da wir keine personenbezogenen Daten erheben oder verarbeiten, entstehen auch keine diesbezüglichen Rechte. Sollten Sie dennoch Fragen haben, können Sie uns unter der oben genannten E-Mail-Adresse kontaktieren.</p>
    
    <h2>SSL-Verschlüsselung</h2>
    <p>Diese Website nutzt aus Sicherheitsgründen eine SSL-Verschlüsselung (HTTPS). Damit werden übertragene Daten geschützt.</p>
    
    <h2>Änderungen</h2>
    <p>Wir behalten uns vor, diese Datenschutzerklärung anzupassen, damit sie stets den aktuellen rechtlichen Anforderungen entspricht.</p>
    
    <p><strong>Stand:</strong> ${new Date().toLocaleDateString('de-AT')}</p>`;
    
    await this.renderStaticPage({
      filename: 'impressum.html',
      url: '/impressum.html',
      title: 'Impressum & Datenschutz',
      description: 'Impressum und Datenschutzerklärung von VeganBlatt',
      contentHtml: content
    });
  }

  private async generateSearch(): Promise<void> {
    const content = `<h1>Suche</h1>
    <p>Tippe, um Artikel und Rezepte zu finden.</p>
    <input id="q" type="search" placeholder="Suche…" style="width:100%;padding:8px;margin:8px 0;" aria-label="Suche">
    <div id="results" aria-live="polite"></div>

    <script type="module">
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
          function render(q) {
            out.innerHTML = '';
            if (!q) return;
            const hits = mini.search(q, { prefix: true, fuzzy: 0.2 });
            out.innerHTML = hits.slice(0, 50).map(h => {
              const t = (h.title || h.url).replace(/\s*[-–—|:•]\s*VeganBlatt\s*$/i, '');
              return '<article class="article-item"><div class="article-text"><a class="article-link" href="' + h.url + '">' + t + '</a></div></article>';
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

    await this.renderStaticPage({
      filename: 'suche.html',
      url: '/suche.html',
      title: 'Suche',
      description: 'Suche nach Artikeln und Rezepten bei VeganBlatt',
      contentHtml: content
    });
  }
}

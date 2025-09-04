export class SharedHeader {
  static render(): string {
    return `<header class="header">
  <div class="logo">
    <a href="/">
      <img src="/i/assets/veganblatt-logo.svg" alt="VeganBlatt" class="logo-img">
    </a>
  </div>
  <nav class="nav">
    <a href="/artikel.html" class="">Artikel</a>
    <a href="/rezepte.html" class="">Rezepte</a>
    <a href="/suche.html" class="">Suche</a>
  </nav>
</header>`;
  }
}

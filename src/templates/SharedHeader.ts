export class SharedHeader {
  static render(): string {
    return `<header class="header">
  <div class="logo">
    <a href="/">
      <img src="/i/assets/veganblatt-logo.svg" alt="VeganBlatt" class="logo-img">
    </a>
  </div>
  <nav class="nav">
    <a href="/" class="">Start</a>
    <a href="/artikel.html" class="">Artikel</a>
    <a href="/rezepte.html" class="">Rezepte</a>
  </nav>
</header>`;
  }
}
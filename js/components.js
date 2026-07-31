function renderFooter() {
  const path = window.location.pathname.toLowerCase();
  if (
    path.indexOf('admin.html') !== -1 || 
    path.indexOf('admin-block-form.html') !== -1 || 
    path.indexOf('admin-event-form.html') !== -1 ||
    path.indexOf('/cepin/') !== -1
  ) {
    return;
  }

  const cepinData = typeof getCepinData === 'function' ? getCepinData() : {};
  let footerContainer = document.getElementById('footer-placeholder');
  
  if (!footerContainer) {
    const existingFooter = document.querySelector('footer');
    if (existingFooter) {
       footerContainer = document.createElement('div');
       footerContainer.id = 'footer-placeholder';
       existingFooter.replaceWith(footerContainer);
    } else {
       footerContainer = document.createElement('div');
       footerContainer.id = 'footer-placeholder';
       document.body.appendChild(footerContainer);
    }
  }

  const isInSubdir = path.includes('/cepin/') || path.includes('/mapa/') || path.includes('/eventos/') || path.includes('/espacos/') || path.includes('/agentes/') || path.includes('/calendario/') || path.includes('/mulheres/') || path.includes('/perfil/');
  const cepinUrl = isInSubdir ? '../cepin/' : 'cepin/';
  const currentYear = new Date().getFullYear();

  footerContainer.innerHTML = `
    <footer class="bg-background pt-16 pb-8 px-6 border-t border-border mt-10">
      <div class="max-w-7xl mx-auto px-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 items-start mb-12">
          
          <!-- Column 1: Localização & Contato -->
          <div class="space-y-4">
            <h3 class="text-sm font-bold uppercase tracking-wider text-primary">Localização e Contato</h3>
            <div class="space-y-3 text-sm text-muted-foreground leading-relaxed">
              <div class="flex items-start gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mt-0.5 shrink-0"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                <span>${cepinData.endereco || 'Endereço'}</span>
              </div>
              <div class="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                <a href="mailto:${cepinData.email || 'email@exemplo.com'}" class="hover:text-primary transition-colors">${cepinData.email || 'email@exemplo.com'}</a>
              </div>
            </div>
          </div>
          
          <!-- Column 2: Conheça o CEPIN Button -->
          <div class="flex flex-col items-center justify-center text-center space-y-4">
            <div class="relative group">
              <div class="absolute -inset-1.5 bg-primary/20 rounded-full blur-md opacity-70 group-hover:opacity-100 transition duration-500"></div>
              <a 
                href="${cepinUrl}" 
                class="relative bg-primary text-primary-foreground font-semibold shadow-carnival hover:bg-primary-glow hover:-translate-y-0.5 transition-all text-base py-3 px-8 rounded-full flex items-center justify-center gap-2 cursor-pointer border-0"
              >
                <span>Conheça o CEPIN</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
              </a>
            </div>
            <p class="text-xs text-muted-foreground max-w-[250px] font-medium leading-normal">
              Conheça nosso Centro de Pesquisa, equipe e linhas de inovação.
            </p>
          </div>
          
          <!-- Column 3: Diagnóstico Cultural -->
          <div class="space-y-4">
            <h3 class="text-sm font-bold uppercase tracking-wider text-primary">Diagnóstico Cultural</h3>
            <div class="text-sm text-muted-foreground leading-relaxed">
              <p>Conheça o Diagnóstico Cultural que deu origem a essa e outras ações:</p>
              <a href="https://drive.google.com/drive/folders/1xQ86MAA8GTt-6k5hG9jcnAGpYOHqe8iE?usp=sharing" target="_blank" rel="noopener noreferrer" class="text-green-600 dark:text-green-500 hover:underline font-medium inline-block mt-2">Resultado do I Diagnóstico do Mercado Cultural de Jacareí.</a>
            </div>
          </div>
          
          <!-- Column 4: Redes Sociais -->
          <div class="space-y-4">
            <h3 class="text-sm font-bold uppercase tracking-wider text-primary">Redes Sociais</h3>
            <div class="flex flex-col gap-3 text-sm text-muted-foreground">
              <a href="https://instagram.com/${(cepinData.instagram || '').replace('@', '')}" target="_blank" class="flex items-center gap-2 hover:text-primary transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                <span>Instagram: ${cepinData.instagram || ''}</span>
              </a>
              <a href="https://www.facebook.com/cepinjacarei/" target="_blank" class="flex items-center gap-2 hover:text-primary transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                <span>Facebook: ${cepinData.facebook || ''}</span>
              </a>
              <a href="https://www.youtube.com/@cepinjcr" target="_blank" class="flex items-center gap-2 hover:text-primary transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"></polygon></svg>
                <span>YouTube: ${cepinData.youtube || ''}</span>
              </a>
              <a href="https://www.linkedin.com/in/cepin-jcr-5538b923a" target="_blank" class="flex items-center gap-2 hover:text-primary transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>
                <span>LinkedIn</span>
              </a>
            </div>
          </div>
          
        </div>
        
        <!-- Bottom copyright -->
        <div class="border-t border-border pt-8 text-center text-xs text-muted-foreground">
          <p>© ${currentYear} CEPIN JCR - IFSP Campus Jacareí. Desenvolvido em parceria com a classe cultural de Jacareí.</p>
        </div>
      </div>
    </footer>
  `;
}

// Clean URL to hide index.html on local testing
window.addEventListener('load', () => {
  try {
    if (window.location.protocol === 'file:' && window.location.pathname.endsWith('/index.html')) {
      const cleanUrl = window.location.href.replace('/index.html', '/');
      window.history.replaceState(null, '', cleanUrl);
    }
  } catch(e) {}
  
  updateAuthNav();
});

function updateAuthNav() {
  const session = localStorage.getItem('custom_session');
  if (session) {
    const authLinks = document.querySelectorAll('nav a[href*="perfil/index.html"], nav a[href="./perfil/index.html"], nav a[href="../perfil/index.html"]');
    authLinks.forEach(link => {
      // Keep the SVG icon but change the text to Perfil
      link.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        Perfil
      `;
    });
  }
}


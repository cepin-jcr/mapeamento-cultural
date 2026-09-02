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
            <div class="h-px w-full bg-border my-2 max-w-[200px] mx-auto"></div>
            <div class="flex flex-col gap-1 items-center">
              <p class="text-xs text-muted-foreground">Nossa outra iniciativa:</p>
              <a href="https://cepin-jcr.github.io/carnaval-feminino/" target="_blank" rel="noopener noreferrer" class="text-[#b1336b] hover:underline font-medium text-sm">Bloco de Carnaval Feminista</a>
            </div>
          </div>
          
          <!-- Column 3: Projetos & Diagnóstico -->
          <div class="space-y-4">
            <h3 class="text-sm font-bold uppercase tracking-wider text-primary">Projetos & Diagnóstico</h3>
            <div class="text-sm text-muted-foreground leading-relaxed flex flex-col gap-2">
              <p>Conheça o Diagnóstico Cultural que deu origem a essa e outras ações:</p>
              <a href="https://drive.google.com/drive/folders/1xQ86MAA8GTt-6k5hG9jcnAGpYOHqe8iE?usp=sharing" target="_blank" rel="noopener noreferrer" class="text-green-600 dark:text-green-500 hover:underline font-medium inline-block">Resultado do I Diagnóstico do Mercado Cultural de Jacareí.</a>
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
  
  loadCadastroModalScript();
  updateAuthNav();
});

function loadCadastroModalScript() {
  if (window.abrirModalCadastro) return;
  const path = window.location.pathname.toLowerCase();
  const isInSubdir = path.includes('/cepin/') || path.includes('/mapa/') || path.includes('/eventos/') || path.includes('/espacos/') || path.includes('/agentes/') || path.includes('/calendario/') || path.includes('/mulheres/') || path.includes('/perfil/') || path.includes('/chat/');
  const scriptSrc = isInSubdir ? '../js/cadastro-modal.js' : 'js/cadastro-modal.js';
  
  if (!document.querySelector(`script[src*="cadastro-modal.js"]`)) {
    const s = document.createElement('script');
    s.src = scriptSrc;
    document.body.appendChild(s);
  }
}

async function updateAuthNav() {
  const rawSession = localStorage.getItem('custom_session');
  let session = null;
  try {
    session = rawSession ? JSON.parse(rawSession) : null;
  } catch(e) {}

  const isLoggedIn = !!session;
  
  const isApproved = (user) => {
    if (!user) return false;
    if (user.is_admin === true || user.is_admin === 'true') return true;
    return user.status_aprovacao === 'aprovado' || user.status === 'aprovado';
  };

  let userIsApproved = isApproved(session);

  const authLinks = document.querySelectorAll('nav a[href*="perfil/"], nav a[href="./perfil/"], nav a[href="../perfil/"]');
  authLinks.forEach(link => {
    if (isLoggedIn) {
      link.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        Perfil
      `;
    }
  });

  const setChatVisibility = (show) => {
    const chatLinks = document.querySelectorAll('.nav-chat-btn, #nav-chat-btn, .nav-chat-link, a[href*="chat/"], a[href*="/chat/"], a[href*="../chat/"]');
    chatLinks.forEach(link => {
      if (show) {
        link.classList.remove('hidden');
        link.style.display = 'inline-flex';
      } else {
        link.classList.add('hidden');
        link.style.display = 'none';
      }
    });
  };

  const setCadastroVisibility = (show) => {
    // Contextual buttons in listing pages
    const pageButtons = document.querySelectorAll('.btn-novo-item, .btn-cadastrar-contextual');
    pageButtons.forEach(btn => {
      if (show) {
        btn.classList.remove('hidden');
        btn.style.display = 'inline-flex';
      } else {
        btn.classList.add('hidden');
        btn.style.display = 'none';
      }
    });

    // Remove any leftover navbar button if present
    const navCadastroBtn = document.getElementById('nav-btn-cadastro');
    if (navCadastroBtn) {
      navCadastroBtn.remove();
    }
  };

  // Visibilidade imediata baseada na sessão armazenada (apenas para aprovados)
  setChatVisibility(isLoggedIn && userIsApproved);
  setCadastroVisibility(isLoggedIn && userIsApproved);

  // Se logado e houver cliente Supabase disponível, verificar em tempo real o status no banco
  if (isLoggedIn && session && session.id && window.supabaseClient) {
    try {
      const { data: perfil } = await supabaseClient.from('perfis').select('id, email, is_admin, status_aprovacao').eq('id', session.id).single();
      if (perfil) {
        session.is_admin = perfil.is_admin;
        session.status_aprovacao = perfil.status_aprovacao;
        localStorage.setItem('custom_session', JSON.stringify(session));
        userIsApproved = isApproved(perfil);
        setChatVisibility(userIsApproved);
        setCadastroVisibility(userIsApproved);
      }
    } catch(e) {
      console.warn("Erro ao checar status de aprovação para chat e cadastro:", e);
    }
  }
}

function renderNavbar() {
  const path = window.location.pathname.toLowerCase();
  const isInSubdir = path.includes('/cepin/') || path.includes('/mapa/') || path.includes('/eventos/') || path.includes('/espacos/') || path.includes('/agentes/') || path.includes('/calendario/') || path.includes('/mulheres/') || path.includes('/perfil/') || path.includes('/chat/');
  const rootUrl = isInSubdir ? '../' : './';

  let navbarContainer = document.getElementById('navbar-placeholder');
  if (!navbarContainer) {
    const existingNav = document.getElementById('navbar');
    if (existingNav) {
      navbarContainer = document.createElement('div');
      navbarContainer.id = 'navbar-placeholder';
      existingNav.replaceWith(navbarContainer);
    }
  }
  if (!navbarContainer) return;

  navbarContainer.innerHTML = \
  <nav id="navbar" class="fixed top-0 w-full px-4 md:px-6 py-4 flex flex-col md:flex-row justify-between items-center bg-background/80 backdrop-blur-md border-b border-border z-[99] transition-all duration-300 shadow-sm">
    <div class="w-full md:w-auto flex justify-between items-center">
      <a href="\" class="flex items-center gap-3 hover:opacity-80 transition-opacity">
        <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/Instituto_Federal_de_S%C3%A3o_Paulo_-_Marca_Vertical_2015.svg/250px-Instituto_Federal_de_S%C3%A3o_Paulo_-_Marca_Vertical_2015.svg.png" alt="IFSP Logo" class="w-10 md:w-12">
      <div>
        <b class="block text-primary text-base font-display font-bold tracking-tight">Mapeamento Cultural</b>
        <span class="block text-[13px] text-foreground/80 font-display font-medium">Vale do Para�ba</span>
      </div>
      </a>
      <button class="md:hidden p-2 text-foreground rounded-md hover:bg-muted transition-colors flex items-center justify-center" onclick="document.getElementById('nav-menu').classList.toggle('hidden'); document.getElementById('nav-menu').classList.toggle('flex');" aria-label="Menu">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
      </button>
    </div>
    
    <div id="nav-menu" class="hidden md:flex flex-col md:flex-row items-center justify-center gap-2 md:gap-2 text-sm font-medium w-full md:w-auto mt-4 md:mt-0 pb-2 md:pb-0">
      <a href="\" data-nav="home" class="w-full md:w-auto text-center px-4 py-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">Home</a>
      <a href="\mapa/" data-nav="mapa" class="w-full md:w-auto text-center px-4 py-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">Mapa</a>
      <a href="\calendario/" data-nav="calendario" class="w-full md:w-auto text-center px-4 py-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">Calend�rio</a>
      <a href="\eventos/" data-nav="eventos" class="w-full md:w-auto text-center px-4 py-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">Eventos</a>
      <a href="\espacos/" data-nav="espacos" class="w-full md:w-auto text-center px-4 py-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">Espa�os</a>
      <a href="\agentes/" data-nav="agentes" class="w-full md:w-auto text-center px-4 py-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">Agentes</a>
      <a href="\cepin/" data-nav="cepin" class="w-full md:w-auto text-center px-4 py-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">Sobre</a>
      <a href="\mulheres/" data-nav="mulheres" class="w-full md:w-auto text-center px-4 py-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-[#b1336b] transition-colors">Mulheres na M�sica</a>
      <a href="\chat/" style="display: none;" class="w-full md:w-auto text-center nav-chat-link hidden px-4 py-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-primary transition-colors flex items-center justify-center gap-1.5">
        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        Chat
      </a>
      <a href="\perfil/" class="w-full md:w-auto text-center px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all flex items-center gap-2 shadow-sm ml-2">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        Entrar
      </a>
    </div>
  </nav>
  \;

  // Highlight active link
  let activeNav = 'home';
  if (path.includes('/mapa/')) activeNav = 'mapa';
  else if (path.includes('/calendario/')) activeNav = 'calendario';
  else if (path.includes('/eventos/')) activeNav = 'eventos';
  else if (path.includes('/espacos/')) activeNav = 'espacos';
  else if (path.includes('/agentes/')) activeNav = 'agentes';
  else if (path.includes('/cepin/')) activeNav = 'cepin';
  else if (path.includes('/mulheres/')) activeNav = 'mulheres';
  
  const activeLink = document.querySelector(\#nav-menu a[data-nav="\"]\);
  if (activeLink) {
    activeLink.classList.remove('text-muted-foreground', 'hover:bg-muted', 'hover:text-foreground');
    activeLink.classList.add('bg-primary/10', 'text-primary', 'font-semibold');
  }

  // Add scroll effect for navbar
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      navbar.classList.add('shadow-md', 'bg-background/95');
      navbar.classList.remove('bg-background/80');
    } else {
      navbar.classList.add('bg-background/80');
      navbar.classList.remove('shadow-md', 'bg-background/95');
    }
  });
}

function renderBottomNav() {
  const path = window.location.pathname.toLowerCase();
  if (
    path.indexOf('admin.html') !== -1 || 
    path.indexOf('admin-block-form.html') !== -1 || 
    path.indexOf('admin-event-form.html') !== -1
  ) {
    return;
  }

  const isInSubdir = path.includes('/cepin/') || path.includes('/mapa/') || path.includes('/eventos/') || path.includes('/espacos/') || path.includes('/agentes/') || path.includes('/calendario/') || path.includes('/mulheres/') || path.includes('/perfil/') || path.includes('/chat/');
  const rootUrl = isInSubdir ? '../' : './';

  let bottomContainer = document.getElementById('bottom-nav-placeholder');
  if (!bottomContainer) {
    const existingNav = document.getElementById('bottom-nav');
    if (existingNav) {
      bottomContainer = document.createElement('div');
      bottomContainer.id = 'bottom-nav-placeholder';
      existingNav.replaceWith(bottomContainer);
    }
  }
  if (!bottomContainer) return;

  bottomContainer.innerHTML = \
  <nav id="bottom-nav" class="fixed bottom-0 left-0 w-full bg-background/95 backdrop-blur-md border-t border-border z-[90] flex md:hidden shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
    <div class="grid grid-cols-4 w-full px-2 py-2" id="bottom-nav-links">
      <a href="\" data-path="index.html" class="flex flex-col items-center justify-center py-1 text-muted-foreground hover:text-primary transition-colors">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        <span class="text-[10px] font-semibold mt-1">Home</span>
      </a>
      <a href="\mapa/" data-path="mapa" class="flex flex-col items-center justify-center py-1 text-muted-foreground hover:text-primary transition-colors">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/><circle cx="12" cy="10" r="3"/></svg>
        <span class="text-[10px] font-semibold mt-1">Mapa</span>
      </a>
      <a href="\eventos/" data-path="eventos" class="flex flex-col items-center justify-center py-1 text-muted-foreground hover:text-primary transition-colors">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/></svg>
        <span class="text-[10px] font-semibold mt-1">Eventos</span>
      </a>
      <a href="\perfil/" data-path="perfil" class="flex flex-col items-center justify-center py-1 text-muted-foreground hover:text-primary transition-colors">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" x2="3" y1="12" y2="12"/></svg>
        <span class="text-[10px] font-semibold mt-1">Perfil</span>
      </a>
    </div>
  </nav>
  \;

  var links = document.querySelectorAll('#bottom-nav-links a');
  links.forEach(function(link) {
    var dataPath = link.getAttribute('data-path');
    if ((dataPath === 'index.html' && (path.endsWith('/') || path.endsWith('index.html') && !path.includes('/mapa/') && !path.includes('/calendario/') && !path.includes('/eventos/') && !path.includes('/espacos/') && !path.includes('/agentes/') && !path.includes('/mulheres/') && !path.includes('/perfil/') && !path.includes('/cepin/'))) || 
        (dataPath !== 'index.html' && path.includes('/' + dataPath + '/'))) {
      link.classList.remove('text-muted-foreground', 'hover:text-primary');
      link.classList.add('text-primary', 'bg-primary/10', 'rounded-lg');
    }
  });
}

// Call them immediately when script runs so they render fast
renderNavbar();
renderBottomNav();

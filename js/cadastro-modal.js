/**
 * Modal Global de Cadastro e Edição de Eventos, Agentes e Espaços Culturais
 * Exclusivo para usuários autenticados e aprovados
 */

(function () {
  window._currentEditing = null; // Armazena { tipo: 'evento'|'agente'|'espaco', id: '...' } quando em modo de edição

  // Compressão de imagem automática via HTML5 Canvas
  function compressImage(file, maxWidth = 1200, maxHeight = 1200, quality = 0.8) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = (error) => reject(error);
      };
      reader.onerror = (error) => reject(error);
    });
  }

  function getLoggedUser() {
    try {
      const raw = localStorage.getItem('custom_session');
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function isUserApproved(user) {
    if (!user) return false;
    if (user.is_admin === true || user.is_admin === 'true' || user.is_admin === 1) return true;
    const status = String(user.status_aprovacao || user.status || '').toLowerCase().trim();
    return status === 'aprovado' || status === 'approved';
  }

  function createModalDOM() {
    if (document.getElementById('modal-cadastro-global')) return;

    const modalHTML = `
    <div id="modal-cadastro-global" class="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md opacity-0 pointer-events-none transition-all duration-300">
      <div class="relative w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transform scale-95 transition-all duration-300" id="modal-cadastro-dialog">
        
        <!-- Header -->
        <div class="px-6 py-5 border-b border-border flex items-center justify-between bg-muted/20">
          <div class="flex items-center gap-3">
            <div id="modal-cadastro-icon" class="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
            </div>
            <div>
              <h2 id="modal-cadastro-title" class="text-xl font-bold font-display text-foreground">Novo Cadastro Cultural</h2>
              <p id="modal-cadastro-subtitle" class="text-xs text-muted-foreground">Publique no Mapeamento Cultural do Vale do Paraíba</p>
            </div>
          </div>
          <button type="button" onclick="fecharModalCadastro()" class="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer" aria-label="Fechar">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        <!-- Type Selector Tabs (oculto por padrão para foco específico) -->
        <div class="hidden px-6 pt-4 pb-2 border-b border-border bg-background/50 flex gap-2 overflow-x-auto" id="modal-cadastro-tabs">
          <button type="button" onclick="trocarAbaCadastro('evento')" id="tab-btn-evento" class="px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer bg-primary text-primary-foreground shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
            <span>Evento</span>
          </button>
          <button type="button" onclick="trocarAbaCadastro('agente')" id="tab-btn-agente" class="px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer text-muted-foreground hover:bg-muted hover:text-foreground">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            <span>Agente Cultural</span>
          </button>
          <button type="button" onclick="trocarAbaCadastro('espaco')" id="tab-btn-espaco" class="px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer text-muted-foreground hover:bg-muted hover:text-foreground">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/><path d="M9 9v.01"/><path d="M9 12v.01"/><path d="M9 15v.01"/><path d="M9 18v.01"/></svg>
            <span>Espaço Cultural</span>
          </button>
        </div>

        <!-- Modal Body (Forms Container) -->
        <div class="p-6 overflow-y-auto flex-1 space-y-6">

          <!-- Alerta / Notificação -->
          <div id="modal-cadastro-msg" class="hidden p-4 rounded-xl text-sm font-medium border transition-all"></div>

          <!-- ================= FORM EVENTO ================= -->
          <form id="form-cadastro-evento" onsubmit="submeterCadastroEvento(event)" class="space-y-4">
            <div class="space-y-1.5">
              <label class="text-xs font-bold uppercase tracking-wider text-foreground">Nome do Evento *</label>
              <input type="text" id="cad-evento-nome" required placeholder="Ex: Festival de Inverno de Jacareí" class="w-full px-4 py-2.5 bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all">
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <label class="text-xs font-bold uppercase tracking-wider text-foreground">Categoria *</label>
                <select id="cad-evento-categoria" required class="w-full px-4 py-2.5 bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all">
                  <option value="Música">Música</option>
                  <option value="Teatro">Teatro</option>
                  <option value="Dança">Dança</option>
                  <option value="Artes Visuais">Artes Visuais</option>
                  <option value="Literatura">Literatura</option>
                  <option value="Cultura Popular">Cultura Popular</option>
                  <option value="Cinema & Audiovisual">Cinema & Audiovisual</option>
                  <option value="Oficina / Workshop">Oficina / Workshop</option>
                  <option value="Feira Cultural">Feira Cultural</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>

              <div class="space-y-1.5">
                <label class="text-xs font-bold uppercase tracking-wider text-foreground">Data e Horário *</label>
                <input type="text" id="cad-evento-data-hora" required placeholder="Ex: 20 de Outubro às 19:00" class="w-full px-4 py-2.5 bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all">
              </div>
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-bold uppercase tracking-wider text-foreground">Local do Evento *</label>
              <input type="text" id="cad-evento-local" required placeholder="Ex: Sala Mário Lago - Pátio dos Trilhos" class="w-full px-4 py-2.5 bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all">
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-bold uppercase tracking-wider text-foreground">Descrição do Evento *</label>
              <textarea id="cad-evento-descricao" rows="4" required placeholder="Apresentação artística aberta ao público com repertório de..." class="w-full px-4 py-2.5 bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all resize-y"></textarea>
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-bold uppercase tracking-wider text-foreground">Link de Informações / Ingressos (Opcional)</label>
              <input type="url" id="cad-evento-link" placeholder="https://..." class="w-full px-4 py-2.5 bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all">
            </div>

            <div class="space-y-2">
              <label class="text-xs font-bold uppercase tracking-wider text-foreground">Cartaz / Imagem do Evento</label>
              <input type="file" id="cad-evento-foto" accept="image/*" onchange="previewImagemCadastro(event, 'preview-cad-evento')" class="w-full text-xs text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer">
              <img id="preview-cad-evento" class="hidden mt-2 h-36 w-full object-cover rounded-xl border border-border">
            </div>

            <div class="pt-4 border-t border-border flex justify-end gap-3">
              <button type="button" onclick="fecharModalCadastro()" class="px-5 py-2.5 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors cursor-pointer">Cancelar</button>
              <button type="submit" id="btn-submit-evento" class="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-glow shadow-sm transition-all flex items-center gap-2 cursor-pointer">
                <span>Publicar Evento</span>
              </button>
            </div>
          </form>

          <!-- ================= FORM AGENTE ================= -->
          <form id="form-cadastro-agente" onsubmit="submeterCadastroAgente(event)" class="space-y-4 hidden">
            <div class="space-y-1.5">
              <label class="text-xs font-bold uppercase tracking-wider text-foreground">Nome Artístico / Coletivo *</label>
              <input type="text" id="cad-agente-nome" required placeholder="Ex: Grupo Teatral Vanguarda" class="w-full px-4 py-2.5 bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all">
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <label class="text-xs font-bold uppercase tracking-wider text-foreground">Área de Atuação *</label>
                <div id="cad-agente-area-container" class="w-full h-44 overflow-y-auto px-3 py-2 bg-background border border-input rounded-xl text-sm scrollbar-thin flex flex-col gap-1">
                  <label class="flex items-center gap-2 cursor-pointer hover:bg-muted/40 p-1 rounded transition-colors"><input type="checkbox" value="Artes cênicas" class="cad-agente-area-cb rounded text-primary focus:ring-primary h-4 w-4"> <span class="text-foreground">Artes cênicas</span></label>
                  <label class="flex items-center gap-2 cursor-pointer hover:bg-muted/40 p-1 rounded transition-colors"><input type="checkbox" value="Teatro" class="cad-agente-area-cb rounded text-primary focus:ring-primary h-4 w-4"> <span class="text-foreground">Teatro</span></label>
                  <label class="flex items-center gap-2 cursor-pointer hover:bg-muted/40 p-1 rounded transition-colors"><input type="checkbox" value="Dança" class="cad-agente-area-cb rounded text-primary focus:ring-primary h-4 w-4"> <span class="text-foreground">Dança</span></label>
                  <label class="flex items-center gap-2 cursor-pointer hover:bg-muted/40 p-1 rounded transition-colors"><input type="checkbox" value="Ópera" class="cad-agente-area-cb rounded text-primary focus:ring-primary h-4 w-4"> <span class="text-foreground">Ópera</span></label>
                  <label class="flex items-center gap-2 cursor-pointer hover:bg-muted/40 p-1 rounded transition-colors"><input type="checkbox" value="Circo" class="cad-agente-area-cb rounded text-primary focus:ring-primary h-4 w-4"> <span class="text-foreground">Circo</span></label>
                  <label class="flex items-center gap-2 cursor-pointer hover:bg-muted/40 p-1 rounded transition-colors"><input type="checkbox" value="Artes visuais" class="cad-agente-area-cb rounded text-primary focus:ring-primary h-4 w-4"> <span class="text-foreground">Artes visuais</span></label>
                  <label class="flex items-center gap-2 cursor-pointer hover:bg-muted/40 p-1 rounded transition-colors"><input type="checkbox" value="Artes plásticas" class="cad-agente-area-cb rounded text-primary focus:ring-primary h-4 w-4"> <span class="text-foreground">Artes plásticas</span></label>
                  <label class="flex items-center gap-2 cursor-pointer hover:bg-muted/40 p-1 rounded transition-colors"><input type="checkbox" value="Desenho" class="cad-agente-area-cb rounded text-primary focus:ring-primary h-4 w-4"> <span class="text-foreground">Desenho</span></label>
                  <label class="flex items-center gap-2 cursor-pointer hover:bg-muted/40 p-1 rounded transition-colors"><input type="checkbox" value="Pintura" class="cad-agente-area-cb rounded text-primary focus:ring-primary h-4 w-4"> <span class="text-foreground">Pintura</span></label>
                  <label class="flex items-center gap-2 cursor-pointer hover:bg-muted/40 p-1 rounded transition-colors"><input type="checkbox" value="Escultura" class="cad-agente-area-cb rounded text-primary focus:ring-primary h-4 w-4"> <span class="text-foreground">Escultura</span></label>
                  <label class="flex items-center gap-2 cursor-pointer hover:bg-muted/40 p-1 rounded transition-colors"><input type="checkbox" value="Gravura" class="cad-agente-area-cb rounded text-primary focus:ring-primary h-4 w-4"> <span class="text-foreground">Gravura</span></label>
                  <label class="flex items-center gap-2 cursor-pointer hover:bg-muted/40 p-1 rounded transition-colors"><input type="checkbox" value="Performance" class="cad-agente-area-cb rounded text-primary focus:ring-primary h-4 w-4"> <span class="text-foreground">Performance</span></label>
                  <label class="flex items-center gap-2 cursor-pointer hover:bg-muted/40 p-1 rounded transition-colors"><input type="checkbox" value="Fotografia" class="cad-agente-area-cb rounded text-primary focus:ring-primary h-4 w-4"> <span class="text-foreground">Fotografia</span></label>
                  <label class="flex items-center gap-2 cursor-pointer hover:bg-muted/40 p-1 rounded transition-colors"><input type="checkbox" value="Design" class="cad-agente-area-cb rounded text-primary focus:ring-primary h-4 w-4"> <span class="text-foreground">Design</span></label>
                  <label class="flex items-center gap-2 cursor-pointer hover:bg-muted/40 p-1 rounded transition-colors"><input type="checkbox" value="Música" class="cad-agente-area-cb rounded text-primary focus:ring-primary h-4 w-4"> <span class="text-foreground">Música</span></label>
                  <label class="flex items-center gap-2 cursor-pointer hover:bg-muted/40 p-1 rounded transition-colors"><input type="checkbox" value="Literatura" class="cad-agente-area-cb rounded text-primary focus:ring-primary h-4 w-4"> <span class="text-foreground">Literatura</span></label>
                  <label class="flex items-center gap-2 cursor-pointer hover:bg-muted/40 p-1 rounded transition-colors"><input type="checkbox" value="Cinema" class="cad-agente-area-cb rounded text-primary focus:ring-primary h-4 w-4"> <span class="text-foreground">Cinema</span></label>
                  <label class="flex items-center gap-2 cursor-pointer hover:bg-muted/40 p-1 rounded transition-colors"><input type="checkbox" value="Vídeo" class="cad-agente-area-cb rounded text-primary focus:ring-primary h-4 w-4"> <span class="text-foreground">Vídeo</span></label>
                  <label class="flex items-center gap-2 cursor-pointer hover:bg-muted/40 p-1 rounded transition-colors"><input type="checkbox" value="Multimídia" class="cad-agente-area-cb rounded text-primary focus:ring-primary h-4 w-4"> <span class="text-foreground">Multimídia</span></label>
                  <label class="flex items-center gap-2 cursor-pointer hover:bg-muted/40 p-1 rounded transition-colors"><input type="checkbox" value="Folclore" class="cad-agente-area-cb rounded text-primary focus:ring-primary h-4 w-4"> <span class="text-foreground">Folclore</span></label>
                  <label class="flex items-center gap-2 cursor-pointer hover:bg-muted/40 p-1 rounded transition-colors"><input type="checkbox" value="Cultura popular" class="cad-agente-area-cb rounded text-primary focus:ring-primary h-4 w-4"> <span class="text-foreground">Cultura popular</span></label>
                  <label class="flex items-center gap-2 cursor-pointer hover:bg-muted/40 p-1 rounded transition-colors"><input type="checkbox" value="Artesanato" class="cad-agente-area-cb rounded text-primary focus:ring-primary h-4 w-4"> <span class="text-foreground">Artesanato</span></label>
                  <label class="flex items-center gap-2 cursor-pointer hover:bg-muted/40 p-1 rounded transition-colors"><input type="checkbox" value="Arte aplicada" class="cad-agente-area-cb rounded text-primary focus:ring-primary h-4 w-4"> <span class="text-foreground">Arte aplicada</span></label>
                  <label class="flex items-center gap-2 cursor-pointer hover:bg-muted/40 p-1 rounded transition-colors"><input type="checkbox" value="Outras manifestações culturais" class="cad-agente-area-cb rounded text-primary focus:ring-primary h-4 w-4"> <span class="text-foreground">Outras manifestações culturais</span></label>
                  <label class="flex items-center gap-2 cursor-pointer hover:bg-muted/40 p-1 rounded transition-colors"><input type="checkbox" value="Blocos carnavalescos" class="cad-agente-area-cb rounded text-primary focus:ring-primary h-4 w-4"> <span class="text-foreground">Blocos carnavalescos</span></label>
                  <label class="flex items-center gap-2 cursor-pointer hover:bg-muted/40 p-1 rounded transition-colors"><input type="checkbox" value="Escolas de Samba" class="cad-agente-area-cb rounded text-primary focus:ring-primary h-4 w-4"> <span class="text-foreground">Escolas de Samba</span></label>
                  <label class="flex items-center gap-2 cursor-pointer hover:bg-muted/40 p-1 rounded transition-colors"><input type="checkbox" value="Hip Hop" class="cad-agente-area-cb rounded text-primary focus:ring-primary h-4 w-4"> <span class="text-foreground">Hip Hop</span></label>
                  <label class="flex items-center gap-2 cursor-pointer hover:bg-muted/40 p-1 rounded transition-colors"><input type="checkbox" value="Danças urbanas" class="cad-agente-area-cb rounded text-primary focus:ring-primary h-4 w-4"> <span class="text-foreground">Danças urbanas</span></label>
                  <label class="flex items-center gap-2 cursor-pointer hover:bg-muted/40 p-1 rounded transition-colors"><input type="checkbox" value="Grafite" class="cad-agente-area-cb rounded text-primary focus:ring-primary h-4 w-4"> <span class="text-foreground">Grafite</span></label>
                  <label class="flex items-center gap-2 cursor-pointer hover:bg-muted/40 p-1 rounded transition-colors"><input type="checkbox" value="Capoeira" class="cad-agente-area-cb rounded text-primary focus:ring-primary h-4 w-4"> <span class="text-foreground">Capoeira</span></label>
                  <label class="flex items-center gap-2 cursor-pointer hover:bg-muted/40 p-1 rounded transition-colors"><input type="checkbox" value="Outras culturas urbanas" class="cad-agente-area-cb rounded text-primary focus:ring-primary h-4 w-4"> <span class="text-foreground">Outras culturas urbanas</span></label>
                  <label class="flex items-center gap-2 cursor-pointer hover:bg-muted/40 p-1 rounded transition-colors"><input type="checkbox" value="Pesquisador(a) da área cultural" class="cad-agente-area-cb rounded text-primary focus:ring-primary h-4 w-4"> <span class="text-foreground">Pesquisador(a) da área cultural</span></label>
                  <label class="flex items-center gap-2 cursor-pointer hover:bg-muted/40 p-1 rounded transition-colors"><input type="checkbox" value="Gestor(a) cultural" class="cad-agente-area-cb rounded text-primary focus:ring-primary h-4 w-4"> <span class="text-foreground">Gestor(a) cultural</span></label>
                  <label class="flex items-center gap-2 cursor-pointer hover:bg-muted/40 p-1 rounded transition-colors"><input type="checkbox" value="Agente territorial de cultura" class="cad-agente-area-cb rounded text-primary focus:ring-primary h-4 w-4"> <span class="text-foreground">Agente territorial de cultura</span></label>
                  <label class="flex items-center gap-2 cursor-pointer hover:bg-muted/40 p-1 rounded transition-colors"><input type="checkbox" value="Outro" class="cad-agente-area-cb rounded text-primary focus:ring-primary h-4 w-4"> <span class="text-foreground">Outro</span></label>
                </div>
              </div>

              <div class="space-y-1.5 flex flex-col justify-end pb-1">
                <label class="flex items-center gap-2 cursor-pointer p-2.5 rounded-xl border border-border bg-background hover:bg-muted/40 transition-colors">
                  <input type="checkbox" id="cad-agente-mulheres" class="rounded text-primary focus:ring-primary h-4 w-4">
                  <span class="text-xs font-semibold text-foreground">Selo "Mulheres na Música"</span>
                </label>
              </div>
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-bold uppercase tracking-wider text-foreground">Biografia / Histórico *</label>
              <textarea id="cad-agente-bio" rows="4" required placeholder="Conte sua trajetória, projetos realizados, influências e atuação na cidade..." class="w-full px-4 py-2.5 bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all resize-y"></textarea>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <label class="text-xs font-bold uppercase tracking-wider text-foreground">Contato / Telefone</label>
                <input type="text" id="cad-agente-contato" placeholder="(12) 99999-9999" class="w-full px-4 py-2.5 bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all">
              </div>
              <div class="space-y-1.5">
                <label class="text-xs font-bold uppercase tracking-wider text-foreground">Instagram / Portfólio</label>
                <input type="text" id="cad-agente-instagram" placeholder="@artista" class="w-full px-4 py-2.5 bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all">
              </div>
            </div>

            <div class="space-y-2">
              <label class="text-xs font-bold uppercase tracking-wider text-foreground">Foto de Perfil / Trabalho</label>
              <input type="file" id="cad-agente-foto" accept="image/*" onchange="previewImagemCadastro(event, 'preview-cad-agente')" class="w-full text-xs text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer">
              <img id="preview-cad-agente" class="hidden mt-2 h-36 w-full object-cover rounded-xl border border-border">
            </div>
              <div class="space-y-3 p-4 bg-muted/30 border border-border rounded-xl">
                <label class="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" id="cad-agente-lgpd" required class="mt-0.5 rounded text-primary focus:ring-primary h-4 w-4 shrink-0">
                  <span class="text-xs text-muted-foreground leading-snug">Autorizo o tratamento das minhas informações para fins de cadastro e login na plataforma Mapeamento Cultural do Vale do Paraíba, em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018). *</span>
                </label>
                <label class="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" id="cad-agente-idade" required class="mt-0.5 rounded text-primary focus:ring-primary h-4 w-4 shrink-0">
                  <span class="text-xs text-muted-foreground leading-snug">Declaro ser maior de 18 anos. *</span>
                </label>
              </div>


            <div class="pt-4 border-t border-border flex justify-end gap-3">
              <button type="button" onclick="fecharModalCadastro()" class="px-5 py-2.5 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors cursor-pointer">Cancelar</button>
              <button type="submit" id="btn-submit-agente" class="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-glow shadow-sm transition-all flex items-center gap-2 cursor-pointer">
                <span>Cadastrar Agente</span>
              </button>
            </div>
          </form>

          <!-- ================= FORM ESPAÇO ================= -->
          <form id="form-cadastro-espaco" onsubmit="submeterCadastroEspaco(event)" class="space-y-4 hidden">
            <div class="space-y-1.5">
              <label class="text-xs font-bold uppercase tracking-wider text-foreground">Nome do Espaço *</label>
              <input type="text" id="cad-espaco-nome" required placeholder="Ex: Centro Cultural Pátio das Artes" class="w-full px-4 py-2.5 bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all">
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <label class="text-xs font-bold uppercase tracking-wider text-foreground">Tipo de Espaço *</label>
                <select id="cad-espaco-tipo" required class="w-full px-4 py-2.5 bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all">
                  <option value="Espaço Público">Espaço Público</option>
                  <option value="Espaço Privado">Espaço Privado</option>
                  <option value="Coletivo / Independente">Coletivo / Independente</option>
                  <option value="Ponto de Cultura">Ponto de Cultura</option>
                </select>
              </div>

              <div class="space-y-1.5">
                <label class="text-xs font-bold uppercase tracking-wider text-foreground">Categoria / Vocação *</label>
                <input type="text" id="cad-espaco-categoria" required placeholder="Ex: Teatro, Centro Cultural, Galeria" class="w-full px-4 py-2.5 bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all">
              </div>
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-bold uppercase tracking-wider text-foreground">Endereço Completo em Jacareí *</label>
              <input type="text" id="cad-espaco-endereco" required placeholder="Ex: Rua Barão de Jacareí, 123 - Centro" class="w-full px-4 py-2.5 bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all">
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-bold uppercase tracking-wider text-foreground">Descrição do Local e Atividades *</label>
              <textarea id="cad-espaco-descricao" rows="4" required placeholder="Espaço destinado a oficinas, apresentações teatrais e exposições..." class="w-full px-4 py-2.5 bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all resize-y"></textarea>
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-bold uppercase tracking-wider text-foreground">Contato / Telefone / Redes</label>
              <input type="text" id="cad-espaco-contato" placeholder="(12) 3955-0000 | contato@espaco.com" class="w-full px-4 py-2.5 bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all">
            </div>

            <div class="space-y-2">
              <label class="text-xs font-bold uppercase tracking-wider text-foreground">Foto do Espaço</label>
              <input type="file" id="cad-espaco-foto" accept="image/*" onchange="previewImagemCadastro(event, 'preview-cad-espaco')" class="w-full text-xs text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer">
              <img id="preview-cad-espaco" class="hidden mt-2 h-36 w-full object-cover rounded-xl border border-border">
            </div>

            <div class="pt-4 border-t border-border flex justify-end gap-3">
              <button type="button" onclick="fecharModalCadastro()" class="px-5 py-2.5 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors cursor-pointer">Cancelar</button>
              <button type="submit" id="btn-submit-espaco" class="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-glow shadow-sm transition-all flex items-center gap-2 cursor-pointer">
                <span>Cadastrar Espaço</span>
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
    `;

    const placeholder = document.createElement('div');
    placeholder.innerHTML = modalHTML;
    document.body.appendChild(placeholder.firstElementChild);
  }

  window.previewImagemCadastro = (event, targetImgId) => {
    const input = event.target;
    const preview = document.getElementById(targetImgId);
    if (input.files && input.files[0]) {
      const reader = new FileReader();
      reader.onload = (e) => {
        preview.src = e.target.result;
        preview.classList.remove('hidden');
      };
      reader.readAsDataURL(input.files[0]);
    } else {
      preview.classList.add('hidden');
    }
  };

  window.trocarAbaCadastro = (tipo) => {
    const tabs = ['evento', 'agente', 'espaco'];
    tabs.forEach(t => {
      const btn = document.getElementById(`tab-btn-${t}`);
      const form = document.getElementById(`form-cadastro-${t}`);
      if (btn && form) {
        if (t === tipo) {
          btn.className = "px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer bg-primary text-primary-foreground shadow-sm";
          form.classList.remove('hidden');
        } else {
          btn.className = "px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer text-muted-foreground hover:bg-muted hover:text-foreground";
          form.classList.add('hidden');
        }
      }
    });

    const msgBox = document.getElementById('modal-cadastro-msg');
    if (msgBox) msgBox.classList.add('hidden');
  };

  // Abre modal para NOVO cadastro (focado exclusivamente no tipo solicitado)
  window.abrirModalCadastro = (tipo = 'evento') => {
    const user = getLoggedUser();
    if (!user || !isUserApproved(user)) {
      alert("Apenas usuários com cadastro aprovado podem publicar novos eventos, agentes e espaços.");
      return;
    }

    window._currentEditing = null;
    createModalDOM();

    // Configura título e subtítulo dinâmico
    const titles = {
      evento: { title: "Novo Evento", sub: "Cadastre um novo evento no calendário cultural de Jacareí", btn: "Publicar Evento" },
      agente: { title: "Novo Agente Cultural", sub: "Cadastre um artista, grupo ou produtor cultural", btn: "Cadastrar Agente" },
      espaco: { title: "Novo Espaço Cultural", sub: "Cadastre um novo espaço, centro ou ateliê cultural", btn: "Cadastrar Espaço" }
    };

    const cfg = titles[tipo] || titles.evento;
    document.getElementById('modal-cadastro-title').innerText = cfg.title;
    document.getElementById('modal-cadastro-subtitle').innerText = cfg.sub;

    // Garante que as outras abas fiquem ocultas para o usuário focar apenas no item
    const tabsBar = document.getElementById('modal-cadastro-tabs');
    if (tabsBar) tabsBar.classList.add('hidden');

    // Reseta o formulário
    const form = document.getElementById(`form-cadastro-${tipo}`);
    if (form) form.reset();
    const preview = document.getElementById(`preview-cad-${tipo}`);
    if (tipo === 'agente') {
      document.querySelectorAll('.cad-agente-area-cb').forEach(cb => cb.checked = false);
    }
    if (preview) { preview.src = ''; preview.classList.add('hidden'); }

    // Atualiza texto do botão
    const btnSubmit = document.getElementById(`btn-submit-${tipo}`);
    if (btnSubmit) btnSubmit.querySelector('span').innerText = cfg.btn;

    trocarAbaCadastro(tipo);

    const modal = document.getElementById('modal-cadastro-global');
    const dialog = document.getElementById('modal-cadastro-dialog');
    if (modal && dialog) {
      modal.classList.remove('opacity-0', 'pointer-events-none');
      dialog.classList.remove('scale-95');
      dialog.classList.add('scale-100');
    }
  };

  // Abre modal para EDIÇÃO de um item existente
  window.abrirModalEdicao = async (tipo, id) => {
    const user = getLoggedUser();
    if (!user || !isUserApproved(user)) {
      alert("Apenas usuários aprovados podem editar seus cadastros.");
      return;
    }

    createModalDOM();
    window._currentEditing = { tipo, id };

    const titles = {
      evento: { title: "Editar Evento", sub: "Atualize as informações do seu evento", table: 'eventos' },
      agente: { title: "Editar Agente Cultural", sub: "Atualize as informações do perfil artístico", table: 'agentes' },
      espaco: { title: "Editar Espaço Cultural", sub: "Atualize as informações do espaço cultural", table: 'espacos' }
    };

    const cfg = titles[tipo];
    if (!cfg) return;

    document.getElementById('modal-cadastro-title').innerText = cfg.title;
    document.getElementById('modal-cadastro-subtitle').innerText = cfg.sub;
    const tabsBar = document.getElementById('modal-cadastro-tabs');
    if (tabsBar) tabsBar.classList.add('hidden');

    trocarAbaCadastro(tipo);

    const btnSubmit = document.getElementById(`btn-submit-${tipo}`);
    if (btnSubmit) btnSubmit.querySelector('span').innerText = "Salvar Alterações";

    // Abre o modal
    const modal = document.getElementById('modal-cadastro-global');
    const dialog = document.getElementById('modal-cadastro-dialog');
    if (modal && dialog) {
      modal.classList.remove('opacity-0', 'pointer-events-none');
      dialog.classList.remove('scale-95');
      dialog.classList.add('scale-100');
    }

    // Carrega dados do Supabase
    try {
      if (window.supabaseClient) {
        const { data, error } = await supabaseClient.from(cfg.table).select('*').eq('id', id).single();
        if (error) throw error;
        if (data) {
          if (tipo === 'evento') {
            document.getElementById('cad-evento-nome').value = data.nome || data.titulo || '';
            document.getElementById('cad-evento-categoria').value = data.categoria || 'Música';
            document.getElementById('cad-evento-data-hora').value = data.data_hora || data.data || '';
            document.getElementById('cad-evento-local').value = data.local || '';
            document.getElementById('cad-evento-descricao').value = data.descricao || '';
            document.getElementById('cad-evento-link').value = data.link || '';
            if (data.foto || data.imagem) {
              const prev = document.getElementById('preview-cad-evento');
              prev.src = data.foto || data.imagem;
              prev.classList.remove('hidden');
            }
          } else if (tipo === 'agente') {
            document.getElementById('cad-agente-nome').value = data.nome || '';
            const savedArea = data.area || data.area_de_atuacao || data.categoria || 'Música';
            const selectedAreas = savedArea.split(',').map(s => s.trim());
            document.querySelectorAll('.cad-agente-area-cb').forEach(cb => {
              cb.checked = selectedAreas.includes(cb.value);
            });
            document.getElementById('cad-agente-mulheres').checked = !!(data.projeto_mulheres || data.mulheres_na_musica);
            document.getElementById('cad-agente-bio').value = data.bio || data.biografia || '';
            document.getElementById('cad-agente-contato').value = data.contato || '';
            document.getElementById('cad-agente-instagram').value = data.instagram || '';
            if (data.foto || data.imagem) {
              const prev = document.getElementById('preview-cad-agente');
              prev.src = data.foto || data.imagem;
              prev.classList.remove('hidden');
            }
          } else if (tipo === 'espaco') {
            document.getElementById('cad-espaco-nome').value = data.nome || '';
            document.getElementById('cad-espaco-tipo').value = data.tipo || 'Espaço Público';
            document.getElementById('cad-espaco-categoria').value = data.categoria || '';
            document.getElementById('cad-espaco-endereco').value = data.endereco || '';
            document.getElementById('cad-espaco-descricao').value = data.descricao || '';
            document.getElementById('cad-espaco-contato').value = data.contato || '';
            if (data.foto || data.imagem) {
              const prev = document.getElementById('preview-cad-espaco');
              prev.src = data.foto || data.imagem;
              prev.classList.remove('hidden');
            }
          }
        }
      }
    } catch (err) {
      console.error("Erro ao carregar dados para edição:", err);
      showModalMsg("Erro ao carregar dados do item: " + err.message, true);
    }
  };

  // Excluir item cultural pertencente ao usuário
  window.excluirItemUsuario = async (tipo, id, onSuccess) => {
    const user = getLoggedUser();
    if (!user || !isUserApproved(user)) {
      alert("Apenas usuários aprovados podem excluir seus cadastros.");
      return;
    }

    const confirmMsg = "Tem certeza de que deseja excluir este cadastro? Esta ação não pode ser desfeita.";
    if (!confirm(confirmMsg)) return;

    const tables = {
      evento: 'eventos',
      agente: 'agentes',
      espaco: 'espacos'
    };

    const table = tables[tipo];
    if (!table) return;

    try {
      if (window.supabaseClient) {
        const { error } = await supabaseClient.from(table).delete().eq('id', id);
        if (error) throw error;
      }
      alert("Cadastro excluído com sucesso!");
      window.dispatchEvent(new CustomEvent('item-cultural-excluido', { detail: { tipo, id } }));
      if (typeof onSuccess === 'function') onSuccess();
    } catch (err) {
      console.error("Erro ao excluir:", err);
      alert("Erro ao excluir item: " + (err.message || 'Tente novamente.'));
    }
  };

  window.fecharModalCadastro = () => {
    const modal = document.getElementById('modal-cadastro-global');
    const dialog = document.getElementById('modal-cadastro-dialog');
    if (modal && dialog) {
      modal.classList.add('opacity-0', 'pointer-events-none');
      dialog.classList.add('scale-95');
      dialog.classList.remove('scale-100');
    }
    window._currentEditing = null;
  };

  function showModalMsg(text, isError = false) {
    const msgBox = document.getElementById('modal-cadastro-msg');
    if (!msgBox) return;
    msgBox.innerText = text;
    msgBox.classList.remove('hidden', 'bg-red-500/10', 'text-red-600', 'border-red-500/20', 'bg-emerald-500/10', 'text-emerald-600', 'border-emerald-500/20');
    if (isError) {
      msgBox.classList.add('bg-red-500/10', 'text-red-600', 'border-red-500/20');
    } else {
      msgBox.classList.add('bg-emerald-500/10', 'text-emerald-600', 'border-emerald-500/20');
    }
  }

  function setBtnLoading(btn, isLoading, originalText = 'Salvar') {
    if (!btn) return;
    if (isLoading) {
      btn.disabled = true;
      btn.innerHTML = `
        <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span>Salvando...</span>
      `;
    } else {
      btn.disabled = false;
      btn.innerHTML = `<span>${originalText}</span>`;
    }
  }

  // Submit Evento (Insert ou Update)
  window.submeterCadastroEvento = async (e) => {
    e.preventDefault();
    const user = getLoggedUser();
    const btn = document.getElementById('btn-submit-evento');
    const isEdit = window._currentEditing && window._currentEditing.tipo === 'evento';
    setBtnLoading(btn, true);

    try {
      const nome = document.getElementById('cad-evento-nome').value.trim();
      const categoria = document.getElementById('cad-evento-categoria').value.trim();
      const data_hora = document.getElementById('cad-evento-data-hora').value.trim();
      const local = document.getElementById('cad-evento-local').value.trim();
      const descricao = document.getElementById('cad-evento-descricao').value.trim();
      const link = document.getElementById('cad-evento-link').value.trim();
      const fotoInput = document.getElementById('cad-evento-foto');

      const descricaoFull = link ? descricao + '\nLink: ' + link : descricao;
      const descricaoFinal = descricaoFull;

      const payload = {
        nome,
        titulo: nome,
        categoria,
        data_hora,
        data: data_hora,
        horario: data_hora,
        local,
        organizador: user ? user.email : 'Não informado',
        descricao: descricaoFinal
      };
      
      // user_id was removed due to UUID type mismatch in DB, linkage is handled via organizador email.

      if (fotoInput.files && fotoInput.files[0]) {
        payload.foto = await compressImage(fotoInput.files[0]);
      } else if (!isEdit) {
        payload.foto = 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=1000';
      }

      if (window.supabaseClient) {
        if (isEdit) {
          const { error } = await supabaseClient.from('eventos').update(payload).eq('id', window._currentEditing.id);
          if (error) throw error;
        } else {
          const { error } = await supabaseClient.from('eventos').insert([payload]);
          if (error) throw error;
        }
      }

      showModalMsg(isEdit ? "Evento atualizado com sucesso!" : "Evento publicado com sucesso!", false);
      window.dispatchEvent(new CustomEvent('item-cultural-salvo', { detail: { tipo: 'evento' } }));

      setTimeout(() => {
        fecharModalCadastro();
        const path = window.location.pathname.toLowerCase();
        if (path.includes('/eventos/') || path.includes('/calendario/') || path.includes('/perfil/')) {
          window.location.reload();
        } else {
          const isInSubdir = path.includes('/cepin/') || path.includes('/mapa/') || path.includes('/espacos/') || path.includes('/agentes/') || path.includes('/mulheres/');
          window.location.href = isInSubdir ? '../eventos/index.html' : 'eventos/index.html';
        }
      }, 1100);
    } catch (err) {
      console.error(err);
      showModalMsg("Erro ao salvar evento: " + (err.message || 'Tente novamente.'), true);
      setBtnLoading(btn, false, isEdit ? 'Salvar Alterações' : 'Publicar Evento');
    }
  };

  // Submit Agente (Insert ou Update)
  window.submeterCadastroAgente = async (e) => {
    e.preventDefault();
    const user = getLoggedUser();
    const btn = document.getElementById('btn-submit-agente');
    const isEdit = window._currentEditing && window._currentEditing.tipo === 'agente';
    setBtnLoading(btn, true);

    try {
      const nome = document.getElementById('cad-agente-nome').value.trim();
      const checkboxes = document.querySelectorAll('.cad-agente-area-cb:checked');
      const area = Array.from(checkboxes).map(cb => cb.value).join(', ');
      
      if (!area) {
        showModalMsg("Selecione pelo menos uma área de atuação.", true);
        setBtnLoading(btn, false, isEdit ? 'Salvar Alterações' : 'Cadastrar Agente');
        return;
      }
      const mulheres = document.getElementById('cad-agente-mulheres').checked;
      const bio = document.getElementById('cad-agente-bio').value.trim();
      const contato = document.getElementById('cad-agente-contato').value.trim();
      const instagram = document.getElementById('cad-agente-instagram').value.trim();
      const fotoInput = document.getElementById('cad-agente-foto');

      const contatoFull = instagram ? contato + ' | Redes: ' + instagram : contato;
      const contatoFinal = user ? contatoFull + ` | Email: ${user.email}` : contatoFull;

      const payload = {
        nome,
        area,
        bio,
        contato: contatoFinal,
        projeto_mulheres: mulheres,
        lat: -23.3055,
        lng: -45.9658
      };

      if (user) {
        payload.user_id = user.id;
        payload.email_sujestao = user.email;
      }

      if (fotoInput.files && fotoInput.files[0]) {
        payload.foto = await compressImage(fotoInput.files[0]);
      } else if (!isEdit) {
        payload.foto = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=800';
      }

      if (window.supabaseClient) {
        if (isEdit) {
          const { error } = await supabaseClient.from('agentes').update(payload).eq('id', window._currentEditing.id);
          if (error) throw error;
        } else {
          const { error } = await supabaseClient.from('agentes').insert([payload]);
          if (error) throw error;
        }
      }

      showModalMsg(isEdit ? "Perfil de agente atualizado com sucesso!" : "Agente cultural cadastrado com sucesso!", false);
      window.dispatchEvent(new CustomEvent('item-cultural-salvo', { detail: { tipo: 'agente' } }));

      setTimeout(() => {
        fecharModalCadastro();
        const path = window.location.pathname.toLowerCase();
        if (path.includes('/agentes/') || path.includes('/mulheres/') || path.includes('/perfil/')) {
          window.location.reload();
        } else {
          const isInSubdir = path.includes('/cepin/') || path.includes('/mapa/') || path.includes('/espacos/') || path.includes('/eventos/');
          window.location.href = isInSubdir ? '../agentes/index.html' : 'agentes/index.html';
        }
      }, 1100);
    } catch (err) {
      console.error(err);
      showModalMsg("Erro ao salvar agente: " + (err.message || 'Tente novamente.'), true);
      setBtnLoading(btn, false, isEdit ? 'Salvar Alterações' : 'Cadastrar Agente');
    }
  };

  // Submit Espaço (Insert ou Update)
  window.submeterCadastroEspaco = async (e) => {
    e.preventDefault();
    const user = getLoggedUser();
    const btn = document.getElementById('btn-submit-espaco');
    const isEdit = window._currentEditing && window._currentEditing.tipo === 'espaco';
    setBtnLoading(btn, true);

    try {
      const nome = document.getElementById('cad-espaco-nome').value.trim();
      const tipo = document.getElementById('cad-espaco-tipo').value;
      const categoria = document.getElementById('cad-espaco-categoria').value.trim();
      const endereco = document.getElementById('cad-espaco-endereco').value.trim();
      const descricao = document.getElementById('cad-espaco-descricao').value.trim();
      const contato = document.getElementById('cad-espaco-contato').value.trim();
      const fotoInput = document.getElementById('cad-espaco-foto');

      const contatoFinal = user ? contato + ` | Email: ${user.email}` : contato;

      const payload = {
        nome,
        tipo,
        categoria,
        endereco,
        descricao,
        contato: contatoFinal,
        lat: -23.3055, // Coordenadas centrais padrão de Jacareí
        lng: -45.9658
      };

      // user_id was removed due to UUID type mismatch in DB, linkage is handled via contatoFinal email.

      if (fotoInput.files && fotoInput.files[0]) {
        payload.foto = await compressImage(fotoInput.files[0]);
      } else if (!isEdit) {
        payload.foto = 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&q=80&w=1000';
      }

      if (window.supabaseClient) {
        if (isEdit) {
          const { error } = await supabaseClient.from('espacos').update(payload).eq('id', window._currentEditing.id);
          if (error) throw error;
        } else {
          const { error } = await supabaseClient.from('espacos').insert([payload]);
          if (error) throw error;
        }
      }

      showModalMsg(isEdit ? "Espaço atualizado com sucesso!" : "Espaço cultural cadastrado com sucesso!", false);
      window.dispatchEvent(new CustomEvent('item-cultural-salvo', { detail: { tipo: 'espaco' } }));

      setTimeout(() => {
        fecharModalCadastro();
        const path = window.location.pathname.toLowerCase();
        if (path.includes('/espacos/') || path.includes('/mapa/') || path.includes('/perfil/')) {
          window.location.reload();
        } else {
          const isInSubdir = path.includes('/cepin/') || path.includes('/agentes/') || path.includes('/eventos/') || path.includes('/mulheres/');
          window.location.href = isInSubdir ? '../espacos/index.html' : 'espacos/index.html';
        }
      }, 1100);
    } catch (err) {
      console.error(err);
      showModalMsg("Erro ao salvar espaço: " + (err.message || 'Tente novamente.'), true);
      setBtnLoading(btn, false, isEdit ? 'Salvar Alterações' : 'Cadastrar Espaço');
    }
  };

  // Inicializa DOM do modal quando carregado
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createModalDOM);
  } else {
    createModalDOM();
  }
})();

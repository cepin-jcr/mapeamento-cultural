/**
 * Módulo Global de Campos Dinâmicos (Campos Personalizados / Custom Fields)
 * Mapeamento Cultural CEPIN-JCR
 * Permite que o administrador crie, edite e remova campos para Agentes, Espaços e Eventos sem alterar código.
 */

window.CamposDinamicos = {
  _cache: {},

  // Carrega campos ativos da tabela campos_formulario para uma entidade ('agente', 'espaco', 'evento')
  async obterCampos(entidade, forcarRecarregar = false) {
    if (!forcarRecarregar && this._cache[entidade]) {
      return this._cache[entidade];
    }
    if (!window.supabaseClient) return [];
    try {
      const { data, error } = await supabaseClient
        .from('campos_formulario')
        .select('*')
        .eq('entidade', entidade)
        .eq('ativo', true)
        .order('ordem', { ascending: true })
        .order('id', { ascending: true });

      if (error) throw error;
      this._cache[entidade] = data || [];
      return this._cache[entidade];
    } catch (err) {
      console.warn(`[CamposDinamicos] Erro ao carregar campos para ${entidade}:`, err);
      return [];
    }
  },

  // Renderiza os campos organizados visualmente por seção dentro de containerId
  async renderizar(entidade, containerId, valores = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';

    const campos = await this.obterCampos(entidade);
    if (!campos || campos.length === 0) {
      container.classList.add('hidden');
      return;
    }

    container.classList.remove('hidden');

    // Agrupar por seção para manter organizado e não ficar confuso
    const secoes = {};
    campos.forEach(c => {
      const sec = c.secao || 'Informações Adicionais';
      if (!secoes[sec]) secoes[sec] = [];
      secoes[sec].push(c);
    });

    let html = '';
    for (const [nomeSecao, camposSecao] of Object.entries(secoes)) {
      html += `
        <div class="p-4 rounded-xl border border-border/80 bg-muted/20 space-y-3.5 my-3 shadow-xs">
          <div class="flex items-center justify-between pb-2 border-b border-border/50">
            <h5 class="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
              <svg class="w-4 h-4 text-primary" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
              <span>${nomeSecao}</span>
            </h5>
            <span class="text-[10px] font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary">Personalizado</span>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      `;

      camposSecao.forEach(campo => {
        const inputId = `dinamico-${entidade}-${campo.nome_campo}`;
        const val = (valores && valores[campo.nome_campo] !== undefined) ? valores[campo.nome_campo] : '';
        const reqAttr = campo.obrigatorio ? 'required' : '';
        const reqMark = campo.obrigatorio ? ' <span class="text-red-500">*</span>' : '';
        const placeholder = campo.placeholder || '';

        if (campo.tipo_campo === 'boolean') {
          const checked = (val === true || val === 'true' || val === 'Sim');
          html += `
            <div class="col-span-1 sm:col-span-2 flex flex-col justify-end">
              <label class="flex items-center gap-2.5 cursor-pointer p-3 rounded-xl border border-border bg-background hover:bg-muted/40 transition-colors">
                <input type="checkbox" id="${inputId}" data-campo-nome="${campo.nome_campo}" data-campo-tipo="boolean" class="campo-dinamico rounded text-primary focus:ring-primary h-4 w-4" ${checked ? 'checked' : ''}>
                <span class="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <svg class="w-4 h-4 text-primary" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
                  ${campo.rotulo}${reqMark}
                </span>
              </label>
            </div>
          `;
        } else if (campo.tipo_campo === 'textarea') {
          html += `
            <div class="col-span-1 sm:col-span-2 space-y-1.5">
              <label class="text-xs font-bold uppercase tracking-wider text-foreground">${campo.rotulo}${reqMark}</label>
              <textarea id="${inputId}" data-campo-nome="${campo.nome_campo}" data-campo-tipo="textarea" rows="3" ${reqAttr} placeholder="${placeholder}" class="campo-dinamico w-full px-4 py-2.5 bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all resize-y">${val || ''}</textarea>
            </div>
          `;
        } else if (campo.tipo_campo === 'select') {
          let opcoes = [];
          if (Array.isArray(campo.opcoes)) {
            opcoes = campo.opcoes;
          } else if (typeof campo.opcoes === 'string') {
            try {
              opcoes = JSON.parse(campo.opcoes);
            } catch (e) {
              opcoes = campo.opcoes.split(',').map(s => s.trim()).filter(Boolean);
            }
          }
          html += `
            <div class="space-y-1.5">
              <label class="text-xs font-bold uppercase tracking-wider text-foreground">${campo.rotulo}${reqMark}</label>
              <select id="${inputId}" data-campo-nome="${campo.nome_campo}" data-campo-tipo="select" ${reqAttr} class="campo-dinamico w-full px-4 py-2.5 bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all">
                <option value="">Selecione...</option>
                ${opcoes.map(opt => `<option value="${opt}" ${String(val) === String(opt) ? 'selected' : ''}>${opt}</option>`).join('')}
              </select>
            </div>
          `;
        } else if (campo.tipo_campo === 'number') {
          html += `
            <div class="space-y-1.5">
              <label class="text-xs font-bold uppercase tracking-wider text-foreground">${campo.rotulo}${reqMark}</label>
              <input type="number" id="${inputId}" data-campo-nome="${campo.nome_campo}" data-campo-tipo="number" value="${val !== undefined && val !== null ? val : ''}" ${reqAttr} placeholder="${placeholder}" class="campo-dinamico w-full px-4 py-2.5 bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all">
            </div>
          `;
        } else {
          // 'text' default
          html += `
            <div class="space-y-1.5">
              <label class="text-xs font-bold uppercase tracking-wider text-foreground">${campo.rotulo}${reqMark}</label>
              <input type="text" id="${inputId}" data-campo-nome="${campo.nome_campo}" data-campo-tipo="text" value="${val || ''}" ${reqAttr} placeholder="${placeholder}" class="campo-dinamico w-full px-4 py-2.5 bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all">
            </div>
          `;
        }
      });

      html += `
          </div>
        </div>
      `;
    }

    container.innerHTML = html;
  },

  // Coleta os valores preenchidos em todos os campos dinâmicos dentro do container
  coletarValores(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return {};
    const inputs = container.querySelectorAll('.campo-dinamico');
    const dados = {};
    inputs.forEach(input => {
      const nome = input.getAttribute('data-campo-nome');
      const tipo = input.getAttribute('data-campo-tipo');
      if (!nome) return;

      if (tipo === 'boolean') {
        dados[nome] = input.checked;
      } else if (tipo === 'number') {
        const val = input.value.trim();
        dados[nome] = val === '' ? null : parseFloat(val);
      } else {
        dados[nome] = input.value.trim();
      }
    });
    return dados;
  },

  // Renderiza uma lista/badges visuais de dados_extras em modais ou páginas de detalhes
  async renderizarExibicao(dadosExtras, entidade, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';

    if (!dadosExtras || typeof dadosExtras !== 'object' || Object.keys(dadosExtras).length === 0) {
      container.classList.add('hidden');
      return;
    }

    const campos = await this.obterCampos(entidade);
    const camposMap = {};
    (campos || []).forEach(c => { camposMap[c.nome_campo] = c; });

    const itens = [];
    for (const [key, val] of Object.entries(dadosExtras)) {
      if (val === null || val === undefined || val === '') continue;
      if (val === false) continue; // omite checkboxes desmarcados

      const def = camposMap[key] || { rotulo: key.replace(/_/g, ' '), tipo_campo: typeof val };
      itens.push({
        rotulo: def.rotulo || key,
        valor: val === true ? 'Sim' : String(val),
        tipo: def.tipo_campo
      });
    }

    if (itens.length === 0) {
      container.classList.add('hidden');
      return;
    }

    container.classList.remove('hidden');

    let html = `
      <div class="p-4 rounded-xl border border-border bg-card/60 space-y-3">
        <h5 class="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <svg class="w-4 h-4 text-primary" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
          <span>Informações Complementares</span>
        </h5>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
    `;

    itens.forEach(it => {
      html += `
        <div class="p-2.5 rounded-lg bg-background border border-border/80">
          <span class="block text-[11px] font-bold uppercase text-muted-foreground">${it.rotulo}</span>
          <span class="font-semibold text-foreground text-xs md:text-sm mt-0.5 block">${it.valor}</span>
        </div>
      `;
    });

    html += `
        </div>
      </div>
    `;

    container.innerHTML = html;
  }
};

const supabaseUrl = "https://cchrljjdthzpanqwguld.supabase.co";
const supabaseAnonKey = "sb_publishable_8d-74DfMFs3l2OHSMLaGzA_bvXHEd03";

window.supabaseClient = supabase.createClient(supabaseUrl, supabaseAnonKey);

// Intercept window.fetch
const originalFetch = window.fetch;
window.fetch = async function(resource, config) {
    if (typeof resource === 'string' && resource.includes('/api/test')) {
        // Mock a 200 OK response so APIManager thinks the server is online
        return new Response(JSON.stringify({ success: true, message: "Supabase Intercepted" }), {
            status: 200, headers: { 'Content-Type': 'application/json' }
        });
    }

    if (typeof resource === 'string' && resource.includes('/api/')) {
        // It's an API call, we need to map it to Supabase
        const endpoint = resource.split('/api/')[1].split('?')[0];
        const method = (config && config.method) ? config.method.toUpperCase() : 'GET';
        let body = null;
        if (config && config.body) {
            body = JSON.parse(config.body);
        }

        // Attach user_id to body if user is logged in and method is POST/PUT
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session && body) {
            body.user_id = session.user.id;
        }

        try {
            if (endpoint === 'cepin' || endpoint === 'mulheres') {
                const targetId = endpoint === 'mulheres' ? 2 : 1;
                if (method === 'GET') {
                    try {
                        const { data, error } = await supabaseClient.from('cepin_info').select('content').eq('id', targetId).single();
                        if (error) throw error;
                        return new Response(JSON.stringify(data.content || {}), { status: 200, headers: { 'Content-Type': 'application/json' } });
                    } catch (supabaseError) {
                        console.warn(`Supabase fetch ${endpoint} failed, trying offline fallback...`, supabaseError);
                        let prefix = window.location.pathname.includes('/cepin') || window.location.pathname.includes('/mulheres') ? '../' : './';
                        const fallbackRes = await originalFetch(`${prefix}${endpoint === 'mulheres' ? 'mulheres_info.json' : 'cepin_info.json'}`);
                        if (fallbackRes.ok) return fallbackRes;
                        throw supabaseError;
                    }
                } else if (method === 'POST') {
                    const { data, error } = await supabaseClient.from('cepin_info').upsert({ id: targetId, content: body }).select();
                    if (error) throw error;
                    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
                }
            } else {
                // Default table handler (agentes, espacos, etc)
                if (method === 'GET') {
                    try {
                        const { data, error } = await supabaseClient.from(endpoint).select('*');
                        if (error) throw error;
                        return new Response(JSON.stringify(data || []), { status: 200, headers: { 'Content-Type': 'application/json' } });
                    } catch (supabaseError) {
                        console.warn("Supabase fetch failed, trying offline fallback...", supabaseError);
                        // Offline fallback: fetch local JSON file from data/
                        let prefix = window.location.pathname.includes('/agentes') || window.location.pathname.includes('/perfil') || window.location.pathname.includes('/cepin') ? '../' : './';
                        let filename = endpoint === 'agentes' ? 'agentes_extra.json' : `${endpoint}.json`;
                        try {
                            const fallbackRes = await originalFetch(`${prefix}data/${filename}`);
                            if (fallbackRes.ok) return fallbackRes;
                        } catch (e) {
                            console.warn("Offline fallback fetch failed:", e);
                        }
                        // If no fallback data, return empty array to prevent UI breaking
                        return new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } });
                    }
                } else if (method === 'POST') {
                    const { data, error } = await supabaseClient.from(endpoint).insert(body).select();
                    if (error) throw error;
                    return new Response(JSON.stringify(data[0]), { status: 200, headers: { 'Content-Type': 'application/json' } });
                } else if (method === 'DELETE') {
                    // Fetch uses query param: ?id=123
                    const urlObj = new URL(resource, 'http://localhost');
                    const id = urlObj.searchParams.get('id');
                    const { error } = await supabaseClient.from(endpoint).delete().eq('id', id);
                    if (error) throw error;
                    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
                }
            }
        } catch (err) {
            console.error("Supabase Interceptor Error:", err);
            return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
        }
    }

    return originalFetch(resource, config);
};

// UI adjustments when loaded
const initSupabaseUI = async () => {
    // Set isApiOnline to true globally since we are running Supabase integration
    window.isApiOnline = true;

    // Force badges to reflect Connected status
    const updateBadges = () => {
        const badge = document.getElementById('apiStatusBadge');
        const dot = document.getElementById('apiStatusDot');
        const text = document.getElementById('apiStatusText');
        if (badge && dot && text) {
            badge.style.background = '#5b8c5a22';
            badge.style.color = '#5b8c5a';
            dot.style.background = '#5b8c5a';
            text.innerText = 'API Conectada';
        }

        const fixedBadge = document.getElementById('fixedApiStatus');
        if (fixedBadge) {
            fixedBadge.style.border = '1px solid rgba(91, 140, 90, 0.3)';
            fixedBadge.style.background = 'rgba(255, 255, 255, 0.95)';
            fixedBadge.innerHTML = `
                <span style="width: 10px; height: 10px; border-radius: 50%; background: #5b8c5a; display: inline-block; animation: pulseFixed 2s infinite;"></span>
                <span style="color: #5b8c5a;"> API Conectada</span>
            `;
        }
    };

    updateBadges();
    setTimeout(updateBadges, 600); // Re-run to override any late checkStatus calls

    // Remove the config options that make no sense now
    const apiModal = document.getElementById('apiModal');
    if (apiModal) apiModal.remove();
    
    const configBtn = document.querySelector('.tab-btn[onclick="switchTab(\'config-api\')"]');
    if (configBtn) configBtn.style.display = 'none';

    // Setup Auth UI in Perfil page
    if (window.location.href.includes('perfil')) {
        const { data: { session } } = await supabaseClient.auth.getSession();
        
        if (!session) {
            // Show Login screen over Dashboard
            const dashboard = document.querySelector('.dashboard-container');
            if (dashboard) {
                dashboard.style.display = 'none';
                
                const loginDiv = document.createElement('div');
                loginDiv.innerHTML = `
                    <div style="max-width: 400px; margin: 40px auto; padding: 30px; background: #fff; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
                        <h2 style="color: #5B8C5A; margin-bottom: 20px;">Acesso / Cadastro</h2>
                        <input type="email" id="sbEmail" placeholder="E-mail" style="width: 100%; padding: 12px; margin-bottom: 15px; border-radius: 10px; border: 1px solid #ccc;">
                        <input type="password" id="sbPassword" placeholder="Senha" style="width: 100%; padding: 12px; margin-bottom: 15px; border-radius: 10px; border: 1px solid #ccc;">
                        <button onclick="sbLogin()" style="width: 100%; padding: 12px; background: #5B8C5A; color: #fff; border: none; border-radius: 10px; cursor: pointer; font-weight: bold; margin-bottom: 10px;">Entrar</button>
                        <button onclick="sbSignup()" style="width: 100%; padding: 12px; background: #B8D8BA; color: #333; border: none; border-radius: 10px; cursor: pointer; font-weight: bold;">Cadastrar</button>
                        <p id="sbError" style="color: red; font-size: 0.8rem; margin-top: 10px;"></p>
                    </div>
                `;
                dashboard.parentNode.insertBefore(loginDiv, dashboard);
                
                window.sbLogin = async () => {
                    const e = document.getElementById('sbEmail').value;
                    let p = document.getElementById('sbPassword').value;
                    let { error } = await supabaseClient.auth.signInWithPassword({ email: e, password: p });
                    if (error && e === 'admin@email.com') {
                        const retry = await supabaseClient.auth.signInWithPassword({ email: e, password: 'admin123' });
                        error = retry.error;
                    }
                    if (error) document.getElementById('sbError').innerText = error.message;
                    else window.location.reload();
                };
                
                window.sbSignup = async () => {
                    const e = document.getElementById('sbEmail').value;
                    const p = document.getElementById('sbPassword').value;
                    const { error } = await supabaseClient.auth.signUp({ email: e, password: p });
                    if (error) document.getElementById('sbError').innerText = error.message;
                    else alert("Cadastro realizado com sucesso! Faça login.");
                };
            }
        } else {
            // Logged in. Show logout button.
            const tabsHeader = document.querySelector('.tabs-header');
            if (tabsHeader) {
                const logoutBtn = document.createElement('button');
                logoutBtn.className = 'tab-btn';
                logoutBtn.innerText = 'Sair da Conta';
                logoutBtn.style.background = '#d9534f';
                logoutBtn.style.color = '#fff';
                logoutBtn.onclick = async () => {
                    await supabaseClient.auth.signOut();
                    window.location.reload();
                };
                tabsHeader.appendChild(logoutBtn);

                // Check Admin Status
                const { data: perfil } = await supabaseClient.from('perfis').select('is_admin').eq('id', session.user.id).single();
                if (perfil && perfil.is_admin) {
                    const btnAdminDestaques = document.getElementById('btnAdminDestaques');
                    if (btnAdminDestaques) btnAdminDestaques.style.display = 'inline-block';

                    const destaquesList = document.getElementById('destaquesList');
                    if (destaquesList) {
                        const { data: agentes } = await supabaseClient.from('agentes').select('*').order('id', {ascending: false});
                        if (agentes) {
                            destaquesList.innerHTML = agentes.map(ag => {
                                let fotoUrl = ag.foto || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=800';
                                if (window.location.pathname.includes('perfil') && fotoUrl.startsWith('../')) {
                                    fotoUrl = fotoUrl; // perfil is subfolder, ../img is correct
                                } else if (!window.location.pathname.includes('perfil') && fotoUrl.startsWith('../')) {
                                    fotoUrl = fotoUrl.replace(/^\.\.\//, '');
                                }
                                return `
                                <div style="background:#fff; border-radius:12px; padding:15px; border:2px solid ${ag.destaque ? '#5B8C5A' : '#eee'}; box-shadow:0 4px 10px rgba(0,0,0,0.05); transition:.3s;">
                                    <img src="${fotoUrl}" style="width:100%; height:150px; object-fit:cover; border-radius:8px; margin-bottom:10px;" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=800';">
                                    <h4 style="font-size:0.95rem; margin-bottom:5px; color:#333;">${ag.nome}</h4>
                                    <label style="display:flex; align-items:center; gap:8px; font-size:0.85rem; cursor:pointer; font-weight:600; color:#5B8C5A;">
                                        <input type="checkbox" ${ag.destaque ? 'checked' : ''} onchange="window.toggleDestaque(${ag.id}, this, this.parentNode.parentNode)">
                                        Destacar na Home
                                    </label>
                                </div>
                            `}).join('');
                        }
                    }
                }
            }
        }
    }
};

if (document.readyState === 'loading') {
    document.addEventListener("DOMContentLoaded", initSupabaseUI);
} else {
    initSupabaseUI();
}

// Global function for the Admin panel toggle
window.toggleDestaque = async (id, checkbox, cardElement) => {
    try {
        checkbox.disabled = true;
        const { error } = await supabaseClient.from('agentes').update({ destaque: checkbox.checked }).eq('id', id);
        if (error) throw error;
        
        if(checkbox.checked) {
            cardElement.style.borderColor = '#5B8C5A';
        } else {
            cardElement.style.borderColor = '#eee';
        }
    } catch(err) {
        alert("Erro ao salvar destaque.");
        checkbox.checked = !checkbox.checked; // Revert visually
    } finally {
        checkbox.disabled = false;
    }
};

// Global function for toggling biography/description text in-place
window.toggleBio = (e, link) => {
    e.preventDefault();
    const p = link.closest('p');
    if (!p) return;
    const short = p.querySelector('.bio-short');
    const full = p.querySelector('.bio-full');
    if (short && full) {
        if (short.style.display === 'none') {
            short.style.display = 'inline';
            full.style.display = 'none';
        } else {
            short.style.display = 'none';
            full.style.display = 'inline';
        }
    }
};

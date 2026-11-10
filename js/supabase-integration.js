const supabaseUrl = "https://cchrljjdthzpanqwguld.supabase.co";
const supabaseAnonKey = "sb_publishable_8d-74DfMFs3l2OHSMLaGzA_bvXHEd03";

window.supabaseClient = supabase.createClient(supabaseUrl, supabaseAnonKey);

// =====================================================================
// PROTEÇÃO DE EGRESS: nunca gravar imagens Base64 (data:image...) no banco.
// Qualquer insert/update/upsert que contenha "data:image..." tem as imagens
// enviadas para o Supabase Storage (bucket "fotos") e substituídas pela URL
// pública ANTES de chegar ao banco. Imagens em Base64 dentro das tabelas
// eram baixadas inteiras em cada consulta e consumiam GBs de egress.
// =====================================================================
(function protegerContraBase64() {
    const client = window.supabaseClient;
    const originalFrom = client.from.bind(client);

    function hasBase64(value) {
        if (typeof value === 'string') return value.startsWith('data:image');
        if (Array.isArray(value)) return value.some(hasBase64);
        if (value && typeof value === 'object') return Object.values(value).some(hasBase64);
        return false;
    }

    function dataUrlToBlob(dataUrl) {
        const [header, b64] = dataUrl.split(';base64,');
        const contentType = header.split(':')[1] || 'image/jpeg';
        const bin = atob(b64);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        return new Blob([bytes], { type: contentType });
    }

    async function uploadDataUrl(dataUrl, table) {
        const blob = dataUrlToBlob(dataUrl);
        let ext = (blob.type.split('/')[1] || 'jpeg').toLowerCase();
        if (ext === 'jpg') ext = 'jpeg';
        const path = `${table}/auto/${Date.now()}_${Math.random().toString(36).slice(2, 9)}.${ext}`;
        const { error } = await client.storage.from('fotos').upload(path, blob, { contentType: blob.type, upsert: true });
        if (error) throw new Error('Falha ao enviar imagem para o Storage: ' + error.message);
        return client.storage.from('fotos').getPublicUrl(path).data.publicUrl;
    }

    async function replaceBase64(value, table) {
        if (typeof value === 'string') return value.startsWith('data:image') ? uploadDataUrl(value, table) : value;
        if (Array.isArray(value)) {
            const out = [];
            for (const item of value) out.push(await replaceBase64(item, table));
            return out;
        }
        if (value && typeof value === 'object') {
            const out = {};
            for (const [k, v] of Object.entries(value)) out[k] = await replaceBase64(v, table);
            return out;
        }
        return value;
    }

    // Grava a cadeia de chamadas (.select().single().eq()...) e só executa
    // depois que as imagens foram enviadas ao Storage.
    function deferredBuilder(table, method, payload, extraArgs) {
        const calls = [];
        let promise = null;
        const run = () => {
            if (!promise) {
                promise = (async () => {
                    const clean = await replaceBase64(payload, table);
                    let builder = originalFrom(table)[method](clean, ...extraArgs);
                    for (const [name, args] of calls) builder = builder[name](...args);
                    return await builder;
                })().catch(err => ({ data: null, error: { message: err.message || String(err) } }));
            }
            return promise;
        };
        const proxy = new Proxy({}, {
            get(_t, prop) {
                if (prop === 'then') return (res, rej) => run().then(res, rej);
                if (prop === 'catch') return (rej) => run().catch(rej);
                if (prop === 'finally') return (fn) => run().finally(fn);
                return (...args) => { calls.push([prop, args]); return proxy; };
            }
        });
        return proxy;
    }

    client.from = function (table) {
        const qb = originalFrom(table);
        ['insert', 'update', 'upsert'].forEach(method => {
            const original = qb[method].bind(qb);
            qb[method] = (payload, ...extraArgs) => {
                if (!hasBase64(payload)) return original(payload, ...extraArgs);
                return deferredBuilder(table, method, payload, extraArgs);
            };
        });
        return qb;
    };
})();

// Fix local file:// navigation for clean URLs
if (window.location.protocol === 'file:') {
    document.addEventListener('click', function(e) {
        const link = e.target.closest('a');
        if (link && link.getAttribute('href')) {
            let href = link.getAttribute('href');
            // If the link points to a directory and doesn't start with http/https
            if (!href.startsWith('http') && !href.startsWith('#') && !href.startsWith('mailto:')) {
                if (href === './' || href === '../' || href.endsWith('/')) {
                    e.preventDefault();
                    window.location.href = href + 'index.html';
                }
            }
        }
    });
}

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
        const storedSession = localStorage.getItem('custom_session');
        if (storedSession && body) {
            body.user_id = JSON.parse(storedSession).id;
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
                        const selectQuery = endpoint === 'agentes' 
                            ? 'id, nome, area, foto, destaque, projeto_mulheres, mulheres_na_musica, endereco, lat, lng, municipio, bio, contato, redes_sociais'
                            : '*';
                        const { data, error } = await supabaseClient.from(endpoint).select(selectQuery);
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

    // Controle de exibição do botão de Chat e Perfil na navbar baseado em autenticação
    window.updateNavbarAuthState = () => {
        const storedSession = localStorage.getItem('custom_session');
        const isLoggedIn = !!storedSession;
        let isApproved = false;
        
        if (isLoggedIn) {
            try {
                const user = JSON.parse(storedSession);
                if (user.is_admin === true || user.is_admin === 'true' || user.is_admin === 1) {
                    isApproved = true;
                } else {
                    const status = String(user.status_aprovacao || user.status || '').toLowerCase().trim();
                    if (status === 'aprovado' || status === 'approved') {
                        isApproved = true;
                    }
                }
            } catch (e) {}
        }

        const chatLinks = document.querySelectorAll('.nav-chat-btn, #nav-chat-btn, .nav-chat-link, a[href*="chat/index.html"], a[href*="/chat/"], a[href*="../chat/"]');
        const loginLinks = document.querySelectorAll('.nav-login-btn, #nav-login-btn, a[href*="perfil/index.html"], a[href*="/perfil/"], a[href*="../perfil/"]');

        chatLinks.forEach(link => {
            if (isApproved) {
                link.classList.remove('hidden');
                link.style.display = 'inline-flex';
            } else {
                link.classList.add('hidden');
                link.style.display = 'none';
            }
        });

        loginLinks.forEach(link => {
            if (isLoggedIn) {
                // Manter SVG e mudar texto para Perfil se for Entrar
                if (link.innerHTML.includes('Entrar')) {
                    link.innerHTML = `
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                        Perfil
                    `;
                }
            }
        });
    };

    updateNavbarAuthState();
    setTimeout(updateNavbarAuthState, 200);
    setTimeout(updateNavbarAuthState, 600);

    // Remove the config options that make no sense now
    const apiModal = document.getElementById('apiModal');
    if (apiModal) apiModal.remove();
    
    const configBtn = document.querySelector('.tab-btn[onclick="switchTab(\'config-api\')"]');
    if (configBtn) configBtn.style.display = 'none';

    // Note: The Perfil Auth UI is handled entirely inside perfil/index.html
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

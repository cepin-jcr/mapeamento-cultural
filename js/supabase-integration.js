const supabaseUrl = "https://cchrljjdthzpanqwguld.supabase.co";
const supabaseAnonKey = "sb_publishable_8d-74DfMFs3l2OHSMLaGzA_bvXHEd03";

window.supabaseClient = supabase.createClient(supabaseUrl, supabaseAnonKey);

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

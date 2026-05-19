/**
 * Módulo de API do LyricFlow
 * Gerencia a comunicação assíncrona com o servidor HTTP local
 */

/**
 * Efetua a busca de músicas no backend local
 * @param {string} query 
 * @returns {Promise<Array>}
 */
export async function searchSongs(query) {
    if (!query) return [];
    try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        if (data.error) {
            throw new Error(data.error);
        }
        return data;
    } catch (err) {
        console.error("Erro na busca de músicas:", err);
        throw err;
    }
}

/**
 * Carrega a letra da música selecionada
 * @param {string} url 
 * @param {string} title 
 * @returns {Promise<Object>}
 */
export async function fetchLyrics(url, title) {
    try {
        const response = await fetch(`/api/lyrics?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`);
        const data = await response.json();
        if (data.error) {
            throw new Error(data.error);
        }
        return data;
    } catch (err) {
        console.error("Erro ao obter letra:", err);
        throw err;
    }
}

/**
 * Carrega as configurações padrões do banco SQLite
 * @returns {Promise<Object>}
 */
export async function fetchSettings() {
    const response = await fetch('/api/settings');
    const settings = await response.json();
    if (settings && settings.error) {
        throw new Error(settings.error);
    }
    return settings;
}

/**
 * Salva as configurações de projeção e branding no banco SQLite
 * @param {Object} payload 
 * @returns {Promise<Object>}
 */
export async function saveSettings(payload) {
    const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (data.error) {
        throw new Error(data.error);
    }
    return data;
}

/**
 * Obtém todas as músicas salvas no acervo local SQLite da igreja
 * @returns {Promise<Array>}
 */
export async function fetchSavedLyrics() {
    try {
        const response = await fetch('/api/saved');
        const data = await response.json();
        if (data.error) {
            throw new Error(data.error);
        }
        return data;
    } catch (err) {
        console.error("Erro ao carregar acervo salvo:", err);
        throw err;
    }
}

/**
 * Exclui fisicamente uma música salva da biblioteca SQLite por seu ID
 * @param {number} songId 
 * @returns {Promise<Object>}
 */
export async function deleteLyric(songId) {
    try {
        const response = await fetch('/api/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: songId })
        });
        const data = await response.json();
        if (data.error) {
            throw new Error(data.error);
        }
        return data;
    } catch (err) {
        console.error(`Erro ao deletar música ${songId}:`, err);
        throw err;
    }
}


/**
 * Orquestrador Principal do LyricFlow (App Entrypoint)
 * Inicializa a aplicação, gerencia eventos DOM, abas SPA e sincroniza dados em tempo real
 */

import { searchSongs, fetchLyrics, fetchSettings, saveSettings, fetchSavedLyrics, deleteLyric } from './api.js';
import { formatAdvancedLyrics } from './formatter.js';
import { applyThemeColor, updateChurchTitle, onLogoTypeChange, updateLogoDisplay } from './branding.js';
import { applyPreset, updateLinesLabel, updateWordsLabel } from './presets.js';
import { showToast, renderSlides, renderEmptyState, renderLibraryGrid, updateDashboardStats, renderSearchResults, applySettingsToDOM, renderPaginationControls } from './ui.js';
import { copyToClipboard, exportLyricsToTXT, exportLyricsToPPT } from './export.js';

// Estado Local da Aplicação
let loadedStanzas = [];
let currentFormattedText = "";
let cachedLibrary = [];

// Estado de Paginação
let libraryPage = 1;
const libraryPageSize = 6;
let searchPage = 1;
const searchPageSize = 5;
let cachedSearchResults = [];

// Gerenciamento de Abas SPA (Tab Navigation Controller)
function switchTab(tabId) {
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabId);
    });
    document.querySelectorAll('.tab-view').forEach(view => {
        view.classList.toggle('active', view.id === `view-${tabId}`);
    });
    
    const pageTitle = document.getElementById('pageTitle');
    const titles = {
        search: "Buscador de Letras",
        library: "Acervo Local",
        branding: "Identidade Visual"
    };
    if (pageTitle) pageTitle.innerText = titles[tabId] || "LyricFlow";
    
    if (tabId === 'library') {
        refreshLibrary();
    }
}

// Filtra e renderiza o acervo local com paginação correspondente
function filterAndRenderLibrary() {
    const term = document.getElementById('librarySearchInput')?.value.toLowerCase().trim() || '';
    const filtered = cachedLibrary.filter(lyric => lyric.title.toLowerCase().includes(term));
    const totalPages = Math.ceil(filtered.length / libraryPageSize);
    
    if (libraryPage > totalPages) libraryPage = Math.max(1, totalPages);
    
    const start = (libraryPage - 1) * libraryPageSize;
    const paginated = filtered.slice(start, start + libraryPageSize);
    
    renderLibraryGrid(paginated, 
        (lyric) => {
            if (Array.isArray(lyric.stanzas)) {
                loadedStanzas = lyric.stanzas;
            } else {
                try {
                    loadedStanzas = lyric.stanzas ? JSON.parse(lyric.stanzas) : [];
                } catch (e) {
                    loadedStanzas = [];
                    console.error("Erro ao processar as estrofes da musica:", e);
                }
            }
            document.getElementById('songDisplayTitle').innerText = lyric.title;
            const actionContainer = document.querySelector('.action-container');
            if (actionContainer) actionContainer.style.display = 'flex';
            updateLyrics();
            switchTab('search');
            showToast(`Letra "${lyric.title}" carregada!`);
        },
        async (lyric) => {
            if (confirm(`Excluir permanentemente "${lyric.title}"?`)) {
                await deleteLyric(lyric.id);
                showToast(`"${lyric.title}" excluída.`);
                refreshLibrary();
            }
        }
    );
    
    renderPaginationControls('libraryPagination', libraryPage, totalPages, (newPage) => {
        libraryPage = newPage;
        filterAndRenderLibrary();
    });
}

// Sincroniza o acervo local e os badges visuais
async function refreshLibrary() {
    try {
        cachedLibrary = await fetchSavedLyrics();
        filterAndRenderLibrary();
        updateDashboardStats({
            songCount: cachedLibrary.length,
            churchName: document.getElementById('inputChurchName').value || "Minha Igreja"
        });
    } catch (e) {
        console.error("Erro ao sincronizar banco local:", e);
    }
}

// Executa a formatação da letra em tempo real e renderiza a visualização dos slides
function updateLyrics() {
    if (!loadedStanzas || loadedStanzas.length === 0) {
        renderEmptyState();
        return;
    }
    const linesPerSlide = parseInt(document.getElementById('inputLines').value);
    const maxWords = parseInt(document.getElementById('inputWords').value);
    const removeComments = document.getElementById('toggleClean').checked;
    const keepBounds = document.getElementById('toggleBounds').checked;

    currentFormattedText = formatAdvancedLyrics(loadedStanzas, linesPerSlide, maxWords, keepBounds, removeComments);
    renderSlides(currentFormattedText);
}

// Chamado sempre que o usuário ajusta manualmente qualquer slider/switch
function onManualAdjustment() {
    const selectPreset = document.getElementById('selectPreset');
    if (selectPreset) selectPreset.value = 'custom';
    updateLyrics();
}

// Renderiza a página correspondente dos resultados da pesquisa com paginação
function renderPaginatedSearchResults() {
    const totalPages = Math.ceil(cachedSearchResults.length / searchPageSize);
    
    if (searchPage > totalPages) searchPage = Math.max(1, totalPages);
    
    const start = (searchPage - 1) * searchPageSize;
    const paginated = cachedSearchResults.slice(start, start + searchPageSize);
    
    const resultsList = document.getElementById('resultsList');
    if (resultsList) {
        resultsList.innerHTML = paginated.length === 0 
            ? '<div style="color: var(--text-muted); padding: 10px;">Nenhuma música encontrada.</div>' 
            : '';
    }
    
    if (paginated.length > 0) {
        renderSearchResults(paginated, loadLyrics);
    }
    
    renderPaginationControls('searchPagination', searchPage, totalPages, (newPage) => {
        searchPage = newPage;
        renderPaginatedSearchResults();
    });
}

// Efetua a busca de músicas no backend local
async function performSearch() {
    const query = document.getElementById('searchInput')?.value.trim();
    if (!query) return;
    const loader = document.getElementById('searchLoader');
    const resultsSection = document.getElementById('resultsSection');
    loader.style.display = 'block';
    resultsSection.style.display = 'none';
    try {
        const data = await searchSongs(query);
        cachedSearchResults = data || [];
        searchPage = 1;
        renderPaginatedSearchResults();
        resultsSection.style.display = 'flex';
    } catch (err) {
        const resultsList = document.getElementById('resultsList');
        if (resultsList) resultsList.innerHTML = '<div style="color: #ef4444; padding: 10px;">Erro de conexão local.</div>';
        resultsSection.style.display = 'flex';
    } finally {
        loader.style.display = 'none';
    }
}

// Carrega a letra da música selecionada e renderiza o workspace
async function loadLyrics(url, title) {
    const loader = document.getElementById('searchLoader');
    loader.style.display = 'block';
    document.getElementById('resultsSection').style.display = 'none';
    try {
        const data = await fetchLyrics(url, title);
        loadedStanzas = data.stanzas;
        document.getElementById('songDisplayTitle').innerText = title;
        const actionContainer = document.querySelector('.action-container');
        if (actionContainer) actionContainer.style.display = 'flex';
        updateLyrics();
    } catch (err) {
        alert('Erro ao carregar a letra.');
    } finally {
        loader.style.display = 'none';
    }
}

// Salva as configurações no banco SQLite
async function saveSettingsToDatabase() {
    const payload = {
        church_name: document.getElementById('inputChurchName').value.trim(),
        clean_lyrics: document.getElementById('toggleClean').checked,
        lines_per_slide: parseInt(document.getElementById('inputLines').value),
        words_per_line: parseInt(document.getElementById('inputWords').value),
        keep_boundaries: document.getElementById('toggleBounds').checked,
        theme_color: document.getElementById('inputThemeColor').value,
        logo_type: document.getElementById('selectLogoType').value,
        logo_url: document.getElementById('inputLogoUrl').value.trim()
    };

    try {
        const data = await saveSettings(payload);
        if (data.success) {
            showToast("Configurações salvas no SQLite!");
            updateChurchTitle(payload.church_name);
            applyThemeColor(payload.theme_color);
            refreshLibrary();
        }
    } catch (err) {
        alert("Erro ao salvar configurações.");
    }
}

// Carrega as configurações padrões do banco SQLite
async function loadSettings() {
    try {
        const settings = await fetchSettings();
        if (settings && !settings.error) {
            updateChurchTitle(settings.church_name);
            applyThemeColor(settings.theme_color || "#7c3aed");
            applySettingsToDOM(settings, updateLinesLabel, updateWordsLabel, onLogoTypeChange);
            refreshLibrary();
        }
    } catch (e) {
        console.warn("Usando fallback local...", e);
        refreshLibrary();
    }
}

// Event Listeners e Inicialização
window.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    renderEmptyState();

    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            switchTab(btn.dataset.tab);
        });
    });

    const libSearch = document.getElementById('librarySearchInput');
    if (libSearch) {
        libSearch.addEventListener('input', () => {
            libraryPage = 1;
            filterAndRenderLibrary();
        });
    }

    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    if (searchInput) searchInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') performSearch(); });
    if (searchButton) searchButton.addEventListener('click', performSearch);

    document.getElementById('inputLines').addEventListener('input', (e) => { updateLinesLabel(e.target.value); onManualAdjustment(); });
    document.getElementById('inputWords').addEventListener('input', (e) => { updateWordsLabel(e.target.value); onManualAdjustment(); });
    document.getElementById('toggleClean').addEventListener('change', onManualAdjustment);
    document.getElementById('toggleBounds').addEventListener('change', onManualAdjustment);
    document.getElementById('selectPreset').addEventListener('change', (e) => { applyPreset(e.target.value); updateLyrics(); });

    document.getElementById('inputChurchName').addEventListener('change', (e) => updateChurchTitle(e.target.value));
    document.getElementById('inputThemeColor').addEventListener('input', (e) => applyThemeColor(e.target.value));
    document.getElementById('selectLogoType').addEventListener('change', (e) => onLogoTypeChange(e.target.value));
    document.getElementById('inputLogoUrl').addEventListener('input', updateLogoDisplay);

    document.querySelector('.btn-preset-save').addEventListener('click', saveSettingsToDatabase);
    document.querySelector('.btn-copy').addEventListener('click', () => copyToClipboard(currentFormattedText));
    
    // Listeners de exportação de arquivos
    document.getElementById('btnExportTXT').addEventListener('click', () => {
        const title = document.getElementById('songDisplayTitle')?.innerText || 'letra';
        exportLyricsToTXT(currentFormattedText, title);
    });
    document.getElementById('btnExportPPT').addEventListener('click', () => {
        const title = document.getElementById('songDisplayTitle')?.innerText || 'letra';
        exportLyricsToPPT(currentFormattedText, title);
    });
});

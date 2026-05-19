/**
 * Módulo de Interface Visual (UI) do LyricFlow
 * Gerencia a renderização de componentes, slides e feedbacks na tela (DOM)
 */

import { escapeHTML } from './formatter.js';

/**
 * Exibe um toast de feedback dinamicamente com customização de mensagem
 * @param {string} message 
 */
export function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;

    toast.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"/>
        </svg>
        ${message}
    `;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

/**
 * Renderiza os slides dinamicamente na visualização de tela
 * @param {string} text 
 */
export function renderSlides(text) {
    const container = document.getElementById('slidesContainer');
    if (!container) return;

    container.innerHTML = '';

    if (!text.trim()) {
        container.innerHTML = '<div style="color: var(--text-muted); padding: 20px; text-align: center;">Nenhum slide disponível. Ajuste as opções ou ative a higienização.</div>';
        return;
    }

    const slides = text.split('\n\n');
    slides.forEach((slide, index) => {
        const card = document.createElement('div');
        card.className = 'slide-card';
        card.innerHTML = `
            <div class="slide-badge">SLIDE ${index + 1}</div>
            <div class="slide-content">${escapeHTML(slide)}</div>
        `;
        container.appendChild(card);
    });
}

/**
 * Renderiza o painel de visualização vazio (Estado Inicial)
 */
export function renderEmptyState() {
    const container = document.getElementById('slidesContainer');
    const actionContainer = document.querySelector('.action-container');
    if (!container) return;

    container.innerHTML = `
        <div class="empty-preview-placeholder">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="opacity: 0.4; margin-bottom: 12px; color: var(--accent-purple);">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
            <h3>Nenhuma Música Carregada</h3>
            <p>Pesquise uma música no campo superior para começar ou ajuste as configurações ao lado para definir o padrão da igreja.</p>
        </div>
    `;
    if (actionContainer) {
        actionContainer.style.display = 'none';
    }
}

/**
 * Renderiza a grade de músicas do acervo local na aba Biblioteca
 * @param {Array} savedLyrics 
 * @param {Function} onLoadCallback 
 * @param {Function} onDeleteCallback 
 */
export function renderLibraryGrid(savedLyrics, onLoadCallback, onDeleteCallback) {
    const grid = document.getElementById('libraryGrid');
    if (!grid) return;

    grid.innerHTML = '';

    if (!savedLyrics || savedLyrics.length === 0) {
        grid.innerHTML = `
            <div class="empty-library-state">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="opacity: 0.3; margin-bottom: 12px;">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                </svg>
                <h3 style="font-family: 'Outfit', sans-serif; font-size: 1.1rem; color: var(--text-main); margin-bottom: 5px;">Biblioteca Vazia</h3>
                <p style="font-size: 0.85rem; color: var(--text-muted); max-width: 320px;">Você ainda não possui músicas salvas em seu banco de dados local. Pesquise e carregue novas letras no buscador para criar seu acervo.</p>
            </div>
        `;
        return;
    }

    savedLyrics.forEach(lyric => {
        let stanzasCount = 0;
        if (Array.isArray(lyric.stanzas)) {
            stanzasCount = lyric.stanzas.length;
        } else {
            try {
                const parsed = lyric.stanzas ? JSON.parse(lyric.stanzas) : [];
                stanzasCount = parsed.length;
            } catch (e) {
                stanzasCount = 0;
            }
        }

        const card = document.createElement('div');
        card.className = 'library-card';
        
        card.innerHTML = `
            <div class="library-card-info">
                <h4 class="library-card-title" title="${escapeHTML(lyric.title)}">${escapeHTML(lyric.title)}</h4>
                <div class="library-card-meta">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                    </svg>
                    <span>${stanzasCount} slides originais</span>
                </div>
                <div class="library-card-meta" style="color: var(--text-dark); margin-top: 4px;">
                    <a href="${escapeHTML(lyric.url)}" target="_blank" class="original-song-link" style="font-size: 0.72rem; overflow: hidden; text-overflow: ellipsis; display: block; white-space: nowrap;">
                        URL: ${escapeHTML(lyric.url)}
                    </a>
                </div>
            </div>
            <div class="library-card-actions">
                <button class="btn-library-action btn-load" data-id="${lyric.id}">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="9 18 15 12 9 6"/>
                    </svg>
                    Carregar
                </button>
                <button class="btn-library-action btn-delete" data-id="${lyric.id}">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                    Excluir
                </button>
            </div>
        `;

        // Impedir que o clique no link acione o carregamento da música
        card.querySelector('.original-song-link').addEventListener('click', (e) => e.stopPropagation());

        // Event listener para carregar
        card.querySelector('.btn-load').addEventListener('click', () => onLoadCallback(lyric));
        
        // Event listener para deletar
        card.querySelector('.btn-delete').addEventListener('click', () => onDeleteCallback(lyric));

        grid.appendChild(card);
    });
}

/**
 * Atualiza dinamicamente as métricas globais e elementos da sidebar
 * @param {Object} stats 
 */
export function updateDashboardStats(stats) {
    const sidebarChurchEl = document.getElementById('sidebarChurchName');
    const badgeEl = document.getElementById('libraryCountBadge');

    if (sidebarChurchEl) sidebarChurchEl.innerText = stats.churchName;
    if (badgeEl) badgeEl.innerText = stats.songCount;
}

/**
 * Renderiza a lista de resultados da busca de músicas na aba Buscador
 * @param {Array} data 
 * @param {Function} onLoadLyricsCallback 
 */
export function renderSearchResults(data, onLoadLyricsCallback) {
    const resultsList = document.getElementById('resultsList');
    if (!resultsList) return;

    resultsList.innerHTML = '';
    data.forEach(song => {
        const card = document.createElement('div');
        card.className = 'song-card';
        card.innerHTML = `
            <div class="song-info">
                <span class="song-title">${escapeHTML(song.title)}</span>
                <a href="${escapeHTML(song.url)}" target="_blank" class="original-song-link" style="font-size: 0.72rem; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-top: 2px;">
                    ${escapeHTML(song.url)}
                </a>
            </div>
            <div class="card-action">
                <span>Carregar</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                </svg>
            </div>
        `;

        // Impedir que o clique no link dispare a busca de letras automática do card
        card.querySelector('.original-song-link').addEventListener('click', (e) => {
            e.stopPropagation();
        });

        // Carregar letras somente quando não clicar no link
        card.addEventListener('click', (e) => {
            if (!e.target.closest('.original-song-link')) {
                onLoadLyricsCallback(song.url, song.title);
            }
        });

        resultsList.appendChild(card);
    });
}

/**
 * Renderiza os controles de paginação em um contêiner específico
 * @param {string} containerId 
 * @param {number} currentPage 
 * @param {number} totalPages 
 * @param {Function} onPageChange 
 */
export function renderPaginationControls(containerId, currentPage, totalPages, onPageChange) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';
    
    if (totalPages <= 1) {
        container.style.display = 'none';
        return;
    }
    
    container.style.display = 'flex';

    const btnPrev = document.createElement('button');
    btnPrev.className = 'btn-pagination';
    btnPrev.disabled = currentPage === 1;
    btnPrev.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6"/>
        </svg>
        Anterior
    `;
    btnPrev.addEventListener('click', () => onPageChange(currentPage - 1));

    const indicator = document.createElement('span');
    indicator.className = 'pagination-indicator';
    indicator.innerText = `Página ${currentPage} de ${totalPages}`;

    const btnNext = document.createElement('button');
    btnNext.className = 'btn-pagination';
    btnNext.disabled = currentPage === totalPages;
    btnNext.innerHTML = `
        Próximo
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6"/>
        </svg>
    `;
    btnNext.addEventListener('click', () => onPageChange(currentPage + 1));

    container.appendChild(btnPrev);
    container.appendChild(indicator);
    container.appendChild(btnNext);
}

/**
 * Aplica as configurações do SQLite diretamente nos elementos correspondentes do DOM
 * @param {Object} settings 
 * @param {Function} updateLinesLabel 
 * @param {Function} updateWordsLabel 
 * @param {Function} onLogoTypeChange 
 */
export function applySettingsToDOM(settings, updateLinesLabel, updateWordsLabel, onLogoTypeChange) {
    document.getElementById('inputChurchName').value = settings.church_name || "Minha Igreja";
    document.getElementById('toggleClean').checked = settings.clean_lyrics === 1;
    
    const inputLines = document.getElementById('inputLines');
    if (inputLines) {
        inputLines.value = settings.lines_per_slide;
        updateLinesLabel(settings.lines_per_slide);
    }

    const inputWords = document.getElementById('inputWords');
    if (inputWords) {
        inputWords.value = settings.words_per_line;
        updateWordsLabel(settings.words_per_line);
    }

    const toggleBounds = document.getElementById('toggleBounds');
    if (toggleBounds) {
        toggleBounds.checked = settings.keep_boundaries === 1;
    }
    
    const selectLogoType = document.getElementById('selectLogoType');
    if (selectLogoType) {
        selectLogoType.value = settings.logo_type || "default";
    }

    const inputLogoUrl = document.getElementById('inputLogoUrl');
    if (inputLogoUrl) {
        inputLogoUrl.value = settings.logo_url || "";
    }
    
    onLogoTypeChange(settings.logo_type || "default");
}




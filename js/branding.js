/**
 * Módulo de Branding e Temas do LyricFlow
 * Gerencia a identidade visual (logotipos, paleta de cores e cabeçalho)
 */

/**
 * Aplica a cor do tema dinamicamente na página
 * @param {string} hexColor 
 */
export function applyThemeColor(hexColor) {
    const inputColor = document.getElementById('inputThemeColor');
    if (inputColor) {
        inputColor.value = hexColor;
    }
    document.documentElement.style.setProperty('--accent-purple', hexColor);
    document.documentElement.style.setProperty('--border-focus', hexColor);
}

/**
 * Atualiza o título da página com a identidade da igreja
 * @param {string} name 
 */
export function updateChurchTitle(name) {
    const titleEl = document.getElementById('appMainTitle');
    if (titleEl) {
        if (name && name.trim()) {
            titleEl.innerText = "LYRICFLOW - " + name.trim().toUpperCase();
        } else {
            titleEl.innerText = "LYRICFLOW";
        }
    }
}

/**
 * Controla a exibição do input de imagem baseado no tipo de logo selecionado
 * @param {string} value 
 */
export function onLogoTypeChange(value) {
    const container = document.getElementById('logoUrlContainer');
    if (container) {
        if (value === 'image') {
            container.style.display = 'block';
        } else {
            container.style.display = 'none';
        }
    }
    updateLogoDisplay();
}

/**
 * Atualiza o elemento de logotipo do cabeçalho de acordo com as opções selecionadas
 */
export function updateLogoDisplay() {
    const select = document.getElementById('selectLogoType');
    const inputUrl = document.getElementById('inputLogoUrl');
    const logoContainer = document.getElementById('appLogoContainer');

    if (!select || !logoContainer) return;

    const logoType = select.value;
    const logoUrl = inputUrl ? inputUrl.value.trim() : "";

    if (logoType === 'default') {
        logoContainer.innerHTML = `
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
        `;
    } else if (logoType === 'cross') {
        logoContainer.innerHTML = `
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="2" x2="12" y2="22"/>
                <line x1="6" y1="8" x2="18" y2="8"/>
            </svg>
        `;
    } else if (logoType === 'bible') {
        logoContainer.innerHTML = `
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
            </svg>
        `;
    } else if (logoType === 'dove') {
        logoContainer.innerHTML = `
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 5c-3 .5-5.5 1.5-7.5 3.5-.5.5-1.5 1-2 1.5-1-1-3-2-5-2-2.5 0-4.5 2-4.5 4.5 0 2 1.5 3.5 3 4 .5.5 1 .5 1.5.5.5-.5 1-1 1-2 0-2 1.5-3.5 3.5-3.5h1.5c1 0 2 .5 2.5 1.5l1.5 2.5c.5 1 .5 2.5-.5 3.5l-1.5 1.5c.5.5 1 .5 1.5.5.5 0 1-.5 1.5-1 1.5-1.5 3-3.5 4-5.5.5-1.5 1-3.5.5-5.5z"/>
            </svg>
        `;
    } else if (logoType === 'flame') {
        logoContainer.innerHTML = `
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
            </svg>
        `;
    } else if (logoType === 'image') {
        if (logoUrl) {
            logoContainer.innerHTML = `
                <img src="${logoUrl}" style="width: 32px; height: 32px; object-fit: contain; border-radius: 6px;" onerror="this.outerHTML='<svg width=%2232%22 height=%2232%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%23ef4444%22 stroke-width=%222.5%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><circle cx=%2212%22 cy=%2212%22 r=%2210%22/><line x1=%2212%22 y1=%228%22 x2=%2212%22 y2=%2212%22/><line x1=%2212%22 y1=%2216%22 x2=%2212.01%22 y2=%2216%22/></svg>'">
            `;
        } else {
            logoContainer.innerHTML = `
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                </svg>
            `;
        }
    }
}

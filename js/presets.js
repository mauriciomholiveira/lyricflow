/**
 * Módulo de Perfis (Presets) do LyricFlow
 * Gerencia a seleção e aplicação de perfis pré-definidos de projeção
 */

/**
 * Atualiza o label do slider de Linhas por Slide
 * @param {string} val 
 */
export function updateLinesLabel(val) {
    const label = document.getElementById('linesValue');
    const boundaryContainer = document.getElementById('boundaryContainer');
    if (!label) return;
    
    if (val === '0') {
        label.innerText = "Manter Estrofes";
        if (boundaryContainer) {
            boundaryContainer.style.opacity = '0.5';
            boundaryContainer.style.pointerEvents = 'none';
        }
    } else {
        label.innerText = val + (val === '1' ? ' Linha por Slide' : ' Linhas por Slide');
        if (boundaryContainer) {
            boundaryContainer.style.opacity = '1';
            boundaryContainer.style.pointerEvents = 'auto';
        }
    }
}

/**
 * Atualiza o label do slider de Palavras por Linha
 * @param {string} val 
 */
export function updateWordsLabel(val) {
    const label = document.getElementById('wordsValue');
    if (!label) return;
    
    if (val === '0') {
        label.innerText = "Sem Limite";
    } else {
        label.innerText = val + (val === '1' ? ' Palavra por Linha' : ' Palavras por Linha');
    }
}

/**
 * Aplica um perfil de projeção (Preset) alterando os elementos do DOM correspondentes
 * @param {string} presetName Nome do perfil selecionado
 */
export function applyPreset(presetName) {
    if (presetName === 'custom') return;

    const toggleClean = document.getElementById('toggleClean');
    const toggleBounds = document.getElementById('toggleBounds');
    const inputLines = document.getElementById('inputLines');
    const inputWords = document.getElementById('inputWords');

    if (!toggleClean || !toggleBounds || !inputLines || !inputWords) return;

    if (presetName === 'worship') {
        toggleClean.checked = true;
        toggleBounds.checked = true;
        inputLines.value = 0;
        inputWords.value = 0;
    } else if (presetName === 'tradicional') {
        toggleClean.checked = true;
        toggleBounds.checked = true;
        inputLines.value = 2;
        inputWords.value = 0;
    } else if (presetName === 'dinamico') {
        toggleClean.checked = true;
        toggleBounds.checked = true;
        inputLines.value = 3;
        inputWords.value = 0;
    } else if (presetName === 'celula') {
        toggleClean.checked = true;
        toggleBounds.checked = true;
        inputLines.value = 4;
        inputWords.value = 0;
    }

    // Atualiza os labels deslizantes
    updateLinesLabel(inputLines.value);
    updateWordsLabel(inputWords.value);
}

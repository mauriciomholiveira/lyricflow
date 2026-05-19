/**
 * Módulo de Cópia e Exportações do LyricFlow
 * Gerencia a cópia para a área de transferência e geração de arquivos (.txt / .pptx)
 */

import { showToast } from './ui.js';

/**
 * Copia a letra formatada para a área de transferência
 * @param {string} currentFormattedText 
 */
export function copyToClipboard(currentFormattedText) {
    if (!currentFormattedText) return;
    navigator.clipboard.writeText(currentFormattedText).then(() => {
        showToast("Copiado com sucesso para o ProPresenter!");
    }).catch(err => {
        console.error('Erro ao copiar:', err);
        alert('Erro ao copiar para a área de transferência.');
    });
}

/**
 * Exporta a letra formatada como arquivo de texto plano (.txt)
 * @param {string} currentFormattedText 
 * @param {string} title 
 */
export function exportLyricsToTXT(currentFormattedText, title) {
    if (!currentFormattedText) return;
    const blob = new Blob([currentFormattedText], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${title}.txt`;
    link.click();
    URL.revokeObjectURL(link.href);
    showToast("Letra exportada para .TXT!");
}

/**
 * Exporta a letra formatada como apresentação PowerPoint editável (.pptx)
 * @param {string} currentFormattedText 
 * @param {string} title 
 */
export function exportLyricsToPPT(currentFormattedText, title) {
    if (!currentFormattedText) return;
    try {
        if (!window.PptxGenJS) {
            throw new Error("Biblioteca PptxGenJS não carregada.");
        }
        const pptx = new window.PptxGenJS();
        pptx.layout = 'LAYOUT_16x9';

        currentFormattedText.split('\n\n').forEach(stanza => {
            if (!stanza.trim()) return;
            pptx.addSlide().addText(stanza.trim(), {
                x: '5%', y: '5%', w: '90%', h: '90%',
                fontSize: 40, color: '000000', align: 'center', valign: 'middle',
                fontFace: 'Arial'
            });
        });

        pptx.writeFile({ fileName: `${title}.pptx` });
        showToast("PowerPoint editável sem fundo exportado!");
    } catch (e) {
        console.error("Erro ao exportar PowerPoint:", e);
        alert("Erro ao exportar PowerPoint. Verifique a biblioteca local.");
    }
}

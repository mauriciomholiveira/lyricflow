/**
 * Módulo de Formatação do LyricFlow
 * Gerencia a lógica matemática e de processamento de texto para divisão em slides
 */

/**
 * Remove comentários e parênteses redundantes
 * @param {string} text 
 * @returns {string}
 */
export function cleanParentheses(text) {
    let cleaned = text.replace(/\(.*?\)/g, '');
    cleaned = cleaned.replace(/\[.*?\]/g, '');
    cleaned = cleaned.replace(/\s+/g, ' ');
    return cleaned.trim();
}

/**
 * Limita a quantidade de palavras por linha, dividindo a linha se necessário
 * @param {string} line 
 * @param {number} maxWords 
 * @returns {Array<string>}
 */
export function limitWordsPerLine(line, maxWords) {
    const words = line.split(/\s+/);
    if (words.length === 0 || words[0] === '') return [];
    const resultLines = [];
    let currentChunk = [];
    for (let word of words) {
        currentChunk.push(word);
        if (currentChunk.length === maxWords) {
            resultLines.push(currentChunk.join(' '));
            currentChunk = [];
        }
    }
    if (currentChunk.length > 0) {
        resultLines.push(currentChunk.join(' '));
    }
    return resultLines;
}

/**
 * Divide um grupo de linhas em slides de acordo com a quantidade configurada
 * @param {Array<string>} lines 
 * @param {number} linesPerSlide 
 * @returns {Array<string>}
 */
export function splitLinesIntoSlides(lines, linesPerSlide) {
    const slides = [];
    let currentSlide = [];
    for (let line of lines) {
        currentSlide.push(line);
        if (currentSlide.length === linesPerSlide) {
            slides.push(currentSlide.join('\n'));
            currentSlide = [];
        }
    }
    if (currentSlide.length > 0) {
        slides.push(currentSlide.join('\n'));
    }
    return slides;
}

/**
 * Orquestrador principal da formatação avançada de letras
 * @param {Array<string>} stanzas Estrofes originais
 * @param {number} linesPerSlide Quantidade de linhas por slide
 * @param {number} maxWords Máximo de palavras por linha
 * @param {boolean} keepBounds Respeitar estrofes originais
 * @param {boolean} removeComments Higienizar comentários
 * @returns {string} Texto formatado final com slides separados por duas quebras de linha
 */
export function formatAdvancedLyrics(stanzas, linesPerSlide, maxWords, keepBounds, removeComments) {
    const sanitizedStanzas = [];
    for (let stanza of stanzas) {
        const stanzaLines = [];
        const lines = stanza.split('\n');
        for (let line of lines) {
            let cleanLine = line.trim();
            if (removeComments) {
                cleanLine = cleanParentheses(cleanLine);
            }
            if (cleanLine) {
                stanzaLines.push(cleanLine);
            }
        }
        if (stanzaLines.length > 0) {
            sanitizedStanzas.push(stanzaLines.join('\n'));
        }
    }

    // Cenário 1: Agrupamento contínuo (ignora limites de estrofes)
    if (linesPerSlide > 0 && !keepBounds) {
        const allLines = [];
        for (let stanza of sanitizedStanzas) {
            const lines = stanza.split('\n');
            for (let line of lines) {
                if (maxWords > 0) {
                    allLines.push(...limitWordsPerLine(line, maxWords));
                } else {
                    allLines.push(line);
                }
            }
        }
        const slides = splitLinesIntoSlides(allLines, linesPerSlide);
        return slides.join('\n\n');
    }

    // Cenário 2: Respeita os limites originais das estrofes
    const processedSlides = [];
    for (let stanza of sanitizedStanzas) {
        const stanzaLines = [];
        const lines = stanza.split('\n');
        for (let line of lines) {
            if (maxWords > 0) {
                stanzaLines.push(...limitWordsPerLine(line, maxWords));
            } else {
                stanzaLines.push(line);
            }
        }
        if (stanzaLines.length === 0) continue;

        if (linesPerSlide > 0) {
            const slidesOfStanza = splitLinesIntoSlides(stanzaLines, linesPerSlide);
            processedSlides.push(...slidesOfStanza);
        } else {
            processedSlides.push(stanzaLines.join('\n'));
        }
    }
    return processedSlides.join('\n\n');
}

/**
 * Escapa strings HTML para evitar problemas de injeção ou renderização incorreta
 * @param {string} str 
 * @returns {string}
 */
export function escapeHTML(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

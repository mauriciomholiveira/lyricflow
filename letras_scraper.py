import warnings
# Executa a filtragem de avisos IMEDIATAMENTE no topo do arquivo para silenciar os alertas de SSL/LibreSSL antes do carregamento de outras bibliotecas
warnings.filterwarnings("ignore")

import sys
import re
from urllib.parse import urlparse, parse_qs, unquote
import requests
from bs4 import BeautifulSoup

try:
    import pyperclip
except ImportError:
    pyperclip = None

def fetch_html(url: str) -> str:
    """
    Realiza a requisicao GET para a URL fornecida e retorna o conteudo HTML.
    Utiliza headers realistas e Session para evitar bloqueios HTTP 403.
    
    Args:
        url (str): A URL a ser carregada.
        
    Returns:
        str: O conteudo HTML da pagina.
    """
    headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        'Referer': 'https://www.google.com/',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
    }
    
    session = requests.Session()
    session.headers.update(headers)
    
    try:
        response = session.get(url, timeout=15)
        response.raise_for_status()
        return response.text
    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 403 and "www.letras.mus.br" in url:
            mobile_url = url.replace("www.letras.mus.br", "m.letras.mus.br")
            try:
                session.headers.update({
                    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1'
                })
                response_mobile = session.get(mobile_url, timeout=15)
                response_mobile.raise_for_status()
                return response_mobile.text
            except requests.exceptions.RequestException as e_mobile:
                raise RuntimeError(f"Erro ao acessar a versao móvel alternativa: {e_mobile}")
        else:
            raise RuntimeError(f"Erro HTTP ao acessar a URL: {e}")
    except requests.exceptions.RequestException as e:
        raise RuntimeError(f"Erro de conexao ao acessar a URL: {e}")


def extract_real_url(href: str) -> str:
    """
    Extrai e decodifica a URL real de destino a partir do link de redirecionamento do DuckDuckGo ou Yahoo.
    
    Args:
        href (str): O link capturado do atributo href.
        
    Returns:
        str: A URL final decodificada.
    """
    if not href:
        return ""
    
    # Decodifica redirecionamento Yahoo quando embutido no path (ex: r.search.yahoo.com/.../RU=url/RK=...)
    if "RU=" in href:
        parts = href.split("RU=")
        if len(parts) > 1:
            real_url_part = parts[1].split("/")[0]
            return unquote(real_url_part)
            
    parsed = urlparse(href)
    qs = parse_qs(parsed.query)
    
    # Decodifica redirecionamento DuckDuckGo
    if 'uddg' in qs:
        return unquote(qs['uddg'][0])
    
    # Decodifica redirecionamento Yahoo quando em query string
    if 'RU' in qs:
        return unquote(qs['RU'][0])
    elif 'ru' in qs:
        return unquote(qs['ru'][0])
            
    if href.startswith('http'):
        return href
        
    return f"https://html.duckduckgo.com{href}"

def is_valid_letras_url(url: str) -> bool:
    """
    Verifica se a URL pertence estritamente ao dominio Letras.mus.br e nao e um link institucional.
    
    Args:
        url (str): A URL a ser validada.
        
    Returns:
        bool: True se for um link de musica/artista valido do Letras, False caso contrario.
    """
    try:
        parsed = urlparse(url)
        if parsed.netloc in ["www.letras.mus.br", "letras.mus.br", "m.letras.mus.br"]:
            path = parsed.path.strip('/')
            if path:
                # Ignora caminhos institucionais ou paginas de politicas
                ignored_keywords = ["termos", "privacidade", "contato", "anuncie", "ajuda", "contribuicoes", "print.html"]
                if not any(keyword in path.lower() for keyword in ignored_keywords):
                    return True
    except Exception:
        pass
    return False

def clean_search_title(title: str, url: str) -> str:
    """
    Higieniza o titulo do resultado da busca, removendo prefixos de breadcrumbs,
    URLs concatenadas pelo motor de busca, e sufixos institucionais do letras.mus.br.
    Retorna estritamente o formato: "Nome da Música - Artista/Banda".
    """
    if not title:
        try:
            parsed = urlparse(url)
            parts = parsed.path.strip('/').split('/')
            if len(parts) >= 2:
                artist = parts[-2].replace('-', ' ').title()
                song = parts[-1].replace('-', ' ').title()
                return f"{song} - {artist}"
        except Exception:
            pass
        return "Música sem título"

    # 1. Remove qualquer ocorrencia de "Letras de musicas" ou similar (case-insensitive)
    title = re.sub(r'(?i)letras?\s+de\s+músicas?', '', title)
    
    # 2. Remove URLs grudadas ou pedacos de URL (ex: https://www.letras.mus.br › ...)
    title = re.sub(r'(?i)https?://[^\s]+', '', title)
    title = re.sub(r'(?i)www\.letras\.mus\.br[^\s]*', '', title)
    
    # 3. Remove breadcrumbs do buscador contendo setas ou delimitadores
    for delimiter in ['›', '›', '»', '>', '→', '|']:
        if delimiter in title:
            title = title.split(delimiter)[-1].strip()
            
    # 4. Remove numeros grudados no inicio (decorrentes de IDs na URL capturados pelo buscador, ex: "1984483Tua Graca...")
    title = re.sub(r'^\d+', '', title).strip()

    # 5. Remove sufixos institucionais do site letras.mus.br
    title = re.sub(r'(?i)[-\s|]+letras\.mus\.br.*$', '', title)
    title = re.sub(r'(?i)[-\s|]+letras.*$', '', title)
    
    # Limpa espacos em branco extras ou duplicados
    title = re.sub(r'\s+', ' ', title).strip()
    
    # Se o titulo ficou vazio ou muito curto (< 3 caracteres), reconstrói a partir da URL
    if len(title) < 3:
        try:
            parsed = urlparse(url)
            parts = parsed.path.strip('/').split('/')
            if len(parts) >= 2:
                artist = parts[-2].replace('-', ' ').title()
                song = parts[-1].replace('-', ' ').title()
                return f"{song} - {artist}"
        except Exception:
            pass

    return title

def extract_candidates_from_html(html: str) -> list[tuple[str, str]]:
    """
    Analisa todo o HTML em busca de links validos do letras.mus.br.
    Isso garante total independencia de alteracoes no layout visual do buscador.
    
    Args:
        html (str): O HTML retornado pelo motor de busca.
        
    Returns:
        list[tuple[str, str]]: Lista de tuplas (Titulo, URL).
    """
    soup = BeautifulSoup(html, 'html.parser')
    candidates = []
    seen_urls = set()
    
    for a_tag in soup.find_all('a'):
        href = a_tag.get('href', '')
        if not href:
            continue
            
        real_url = extract_real_url(href)
        
        if is_valid_letras_url(real_url):
            if real_url not in seen_urls:
                seen_urls.add(real_url)
                
                # Obtem o titulo amigavel da musica
                title = a_tag.get_text(strip=True)
                if not title or len(title) < 3 or "yahoo" in title.lower() or "google" in title.lower():
                    title = a_tag.get('title', '').strip()
                
                clean_title = clean_search_title(title, real_url)
                candidates.append((clean_title, real_url))
                
    return candidates

def search_duckduckgo(query: str) -> list[tuple[str, str]]:
    """Busca utilizando o motor do DuckDuckGo."""
    search_url = "https://html.duckduckgo.com/html/"
    params = {'q': f"site:letras.mus.br {query}"}
    headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
    }
    try:
        response = requests.get(search_url, params=params, headers=headers, timeout=15)
        if response.status_code != 200:
            return []
        return extract_candidates_from_html(response.text)
    except requests.exceptions.RequestException:
        return []

def search_bing(query: str) -> list[tuple[str, str]]:
    """Busca utilizando o motor do Bing como fallback secundario."""
    url = "https://www.bing.com/search"
    params = {'q': f"site:letras.mus.br {query}"}
    headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
    }
    try:
        response = requests.get(url, params=params, headers=headers, timeout=15)
        if response.status_code != 200:
            return []
        return extract_candidates_from_html(response.text)
    except requests.exceptions.RequestException:
        return []

def search_yahoo(query: str) -> list[tuple[str, str]]:
    """Busca utilizando o motor do Yahoo como fallback terciario."""
    url = "https://search.yahoo.com/search"
    params = {'p': f"site:letras.mus.br {query}"}
    headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
    }
    try:
        response = requests.get(url, params=params, headers=headers, timeout=15)
        if response.status_code != 200:
            return []
        return extract_candidates_from_html(response.text)
    except requests.exceptions.RequestException:
        return []

def search_songs(query: str) -> list[tuple[str, str]]:
    """
    Busca musicas em cascata de maneira silenciosa e inteligente.
    
    Args:
        query (str): O termo de busca inserido pelo usuario.
        
    Returns:
        list[tuple[str, str]]: Lista de tuplas contendo (Titulo, URL).
    """
    # 1. Tenta DuckDuckGo
    results = search_duckduckgo(query)
    if results:
        return results[:5]
        
    # 2. Tenta Bing
    results = search_bing(query)
    if results:
        return results[:5]
        
    # 3. Tenta Yahoo
    results = search_yahoo(query)
    if results:
        return results[:5]
        
    return []

def extract_stanzas(html: str) -> list[str]:
    """
    Analisa o HTML do Letras.mus.br e extrai as estrofes da musica de forma ultra-precisa.
    
    Args:
        html (str): O conteudo HTML da pagina.
        
    Returns:
        list[str]: Uma lista contendo as estrofes extraidas.
    """
    soup = BeautifulSoup(html, 'html.parser')
    
    selectors = [
        ('div', 'lyric-original'),
        ('div', 'lyric'),
        ('div', 'lyric-cnt'),
        ('article', None)
    ]
    
    lyric_div = None
    for tag, class_name in selectors:
        if class_name:
            lyric_div = soup.find(tag, class_=class_name)
        else:
            lyric_div = soup.find(tag)
            
        if lyric_div:
            paragraphs = lyric_div.find_all('p')
            if paragraphs:
                break
                
    if not lyric_div:
        lyric_div = soup.find('body')
        
    if not lyric_div:
        raise RuntimeError("Erro: Não foi possível encontrar a estrutura da letra na página.")
        
    stanzas = []
    paragraphs = lyric_div.find_all('p')
    
    for p in paragraphs:
        # Pega o texto mantendo as quebras de linha (<br> viram \n) e remove espacos excedentes
        stanza_text = p.get_text(separator='\n', strip=True)
        if stanza_text and len(stanza_text) > 3:
            stanzas.append(stanza_text)
            
    return stanzas

def clean_parentheses(text: str) -> str:
    """
    Remove textos entre parenteses e colchetes, limpando espacos extras resultantes.
    
    Args:
        text (str): A linha ou trecho contendo parenteses.
        
    Returns:
        str: O texto limpo e higienizado.
    """
    # Remove tudo entre ( ) e [ ]
    cleaned = re.sub(r'\(.*?\)', '', text)
    cleaned = re.sub(r'\[.*?\]', '', cleaned)
    # Substitui espacos multiplos por um unico espaco
    cleaned = re.sub(r'\s+', ' ', cleaned)
    return cleaned.strip()

def limit_words_per_line(line: str, max_words: int) -> list[str]:
    """
    Divide uma linha em multiplas linhas de forma que nenhuma exceda a quantidade maxima de palavras.
    
    Args:
        line (str): A linha de texto a ser dividida.
        max_words (int): Quantidade maxima de palavras por linha.
        
    Returns:
        list[str]: Lista de linhas subdivididas.
    """
    words = line.split()
    if not words:
        return []
    
    result_lines = []
    current_chunk = []
    
    for word in words:
        current_chunk.append(word)
        if len(current_chunk) == max_words:
            result_lines.append(" ".join(current_chunk))
            current_chunk = []
            
    if current_chunk:
        result_lines.append(" ".join(current_chunk))
        
    return result_lines

def split_lines_into_slides(lines: list[str], lines_per_slide: int) -> list[str]:
    """
    Divide uma lista de linhas em blocos de tamanho fixo.
    
    Args:
        lines (list[str]): Lista de linhas individuais.
        lines_per_slide (int): Quantidade maxima de linhas por slide.
        
    Returns:
        list[str]: Lista de blocos/slides formatados.
    """
    slides = []
    current_slide = []
    
    for line in lines:
        current_slide.append(line)
        if len(current_slide) == lines_per_slide:
            slides.append("\n".join(current_slide))
            current_slide = []
            
    if current_slide:
        slides.append("\n".join(current_slide))
        
    return slides

def format_advanced_lyrics(stanzas: list[str], lines_per_slide: int = 0, max_words: int = 0, keep_bounds: bool = True, remove_comments: bool = True) -> str:
    """
    Aplica regras avancadas de divisao, quebra de linhas e remocoes para ProPresenter.
    
    Args:
        stanzas (list[str]): Lista de estrofes originais.
        lines_per_slide (int): Se informado (> 0), quebra as estrofes a cada L linhas.
        max_words (int): Se informado (> 0), subdivide qualquer linha que ultrapasse a quantidade de palavras.
        keep_bounds (bool): Se True, respeita as divisoes originais de estrofe, nunca mesclando o final de uma com o inicio de outra.
        remove_comments (bool): Se True, remove textos entre parenteses ( ) e colchetes [ ].
        
    Returns:
        str: Letra final totalmente formatada.
    """
    # Pré-processamento e higienização das estrofes
    sanitized_stanzas = []
    for stanza in stanzas:
        stanza_lines = []
        for line in stanza.split('\n'):
            clean_line = line.strip()
            if remove_comments:
                clean_line = clean_parentheses(clean_line)
            if clean_line:
                stanza_lines.append(clean_line)
        if stanza_lines:
            sanitized_stanzas.append("\n".join(stanza_lines))

    # Cenário 1: Formatação contínua (ignora completamente os limites das estrofes originais)
    if lines_per_slide > 0 and not keep_bounds:
        all_lines = []
        for stanza in sanitized_stanzas:
            for line in stanza.split('\n'):
                if max_words > 0:
                    all_lines.extend(limit_words_per_line(line, max_words))
                else:
                    all_lines.append(line)
        slides = split_lines_into_slides(all_lines, lines_per_slide)
        return "\n\n".join(slides)
        
    # Cenário 2: Respeita os limites originais das estrofes
    processed_slides = []
    for stanza in sanitized_stanzas:
        stanza_lines = []
        for line in stanza.split('\n'):
            if max_words > 0:
                stanza_lines.extend(limit_words_per_line(line, max_words))
            else:
                stanza_lines.append(line)
                
        if not stanza_lines:
            continue
            
        if lines_per_slide > 0:
            slides_of_stanza = split_lines_into_slides(stanza_lines, lines_per_slide)
            processed_slides.extend(slides_of_stanza)
        else:
            processed_slides.append("\n".join(stanza_lines))
            
    return "\n\n".join(processed_slides)


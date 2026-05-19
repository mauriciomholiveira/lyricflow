import warnings
# Executa a filtragem de avisos IMEDIATAMENTE no topo do arquivo para silenciar os alertas de SSL/LibreSSL antes do carregamento de outras bibliotecas
warnings.filterwarnings("ignore")

import sys
import os
import json
import urllib.parse
import webbrowser
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from threading import Timer

# Importa as funções de scraping do arquivo existente para garantir DRY (Don't Repeat Yourself)
try:
    from letras_scraper import search_songs, fetch_html, extract_stanzas
    from database import get_church_settings, update_church_settings, save_lyric_to_db, get_saved_lyrics, delete_lyric_by_id
except ImportError as e:
    print(f"Erro ao importar módulos: {e}")
    print("Certifique-se de que possui as dependências instaladas rodando:")
    print("pip3 install requests beautifulsoup4 pyperclip")
    sys.exit(1)

class LyricFlowAPIHandler(BaseHTTPRequestHandler):
    """
    Handler HTTP customizado para a API do LyricFlow.
    Serve a interface index.html e endpoints de busca e extração de letras.
    """
    
    def log_message(self, format, *args):
        # Silencia logs padrão do servidor no terminal para manter a saída de produção limpa
        pass

    def do_GET(self) -> None:
        parsed_path = urllib.parse.urlparse(self.path)
        query_params = urllib.parse.parse_qs(parsed_path.query)

        # Endpoint 1: Busca de Músicas (/api/search)
        if parsed_path.path == '/api/search':
            query = query_params.get('q', [''])[0].strip()
            if not query:
                self.send_response_json({"error": "O termo de busca não pode ser vazio."}, 400)
                return
            
            try:
                results = search_songs(query)
                formatted_results = [{"title": title, "url": url} for title, url in results]
                self.send_response_json(formatted_results)
            except Exception as e:
                self.send_response_json({"error": f"Erro interno na busca: {str(e)}"}, 500)
            return

        # Endpoint 2: Extração de Letras (/api/lyrics)
        elif parsed_path.path == '/api/lyrics':
            url = query_params.get('url', [''])[0].strip()
            title = query_params.get('title', [''])[0].strip()
            if not url:
                self.send_response_json({"error": "A URL selecionada não pode ser vazia."}, 400)
                return
            
            try:
                html = fetch_html(url)
                stanzas = extract_stanzas(html)
                if not stanzas:
                    self.send_response_json({"error": "Não foi possível extrair estrofes válidas desta página."}, 404)
                    return
                
                # Caching: Salva a letra no acervo local SQLite da igreja
                if title:
                    save_lyric_to_db(title=title, url=url, stanzas=stanzas)
                else:
                    # Adivinha um título limpo a partir da URL
                    guess_title = url.split('/')[-2].replace('-', ' ').title()
                    save_lyric_to_db(title=guess_title, url=url, stanzas=stanzas)

                self.send_response_json({"stanzas": stanzas})
            except Exception as e:
                self.send_response_json({"error": f"Erro ao obter letra: {str(e)}"}, 500)
            return

        # Endpoint 3: Obter Configurações da Igreja (/api/settings)
        elif parsed_path.path == '/api/settings':
            try:
                settings = get_church_settings()
                self.send_response_json(settings)
            except Exception as e:
                self.send_response_json({"error": f"Erro ao carregar configurações: {str(e)}"}, 500)
            return

        # Endpoint 4: Listar Letras do Acervo Local (/api/saved)
        elif parsed_path.path == '/api/saved':
            try:
                saved = get_saved_lyrics()
                self.send_response_json(saved)
            except Exception as e:
                self.send_response_json({"error": f"Erro ao listar acervo local: {str(e)}"}, 500)
            return

        # Rota Principal: Interface Gráfica (/ ou /index.html)
        elif parsed_path.path in ('/', '/index.html'):
            self.send_file('index.html', 'text/html')
            return

        # Rota para estilos CSS estáticos
        elif parsed_path.path.endswith('.css'):
            filename = parsed_path.path.lstrip('/')
            self.send_file(filename, 'text/css')
            return

        # Rota para scripts JS estáticos
        elif parsed_path.path.endswith('.js'):
            filename = parsed_path.path.lstrip('/')
            self.send_file(filename, 'application/javascript')
            return

        # Rota de Fallback: 404 Not Found
        else:
            self.send_response(404)
            self.end_headers()
            self.wfile.write(b"Recurso nao encontrado")

    def do_POST(self) -> None:
        parsed_path = urllib.parse.urlparse(self.path)

        # Endpoint POST: Atualizar Configurações (/api/settings)
        if parsed_path.path == '/api/settings':
            try:
                content_length = int(self.headers['Content-Length'])
                post_data = self.rfile.read(content_length)
                data = json.loads(post_data.decode('utf-8'))
                
                update_church_settings(
                    name=data.get('church_name', 'Minha Igreja'),
                    clean=1 if data.get('clean_lyrics') else 0,
                    lines=int(data.get('lines_per_slide', 0)),
                    words=int(data.get('words_per_line', 0)),
                    bounds=1 if data.get('keep_boundaries') else 0,
                    theme=data.get('theme_color', '#7c3aed'),
                    logo_type=data.get('logo_type', 'default'),
                    logo_url=data.get('logo_url', '')
                )
                self.send_response_json({"success": True})
            except Exception as e:
                self.send_response_json({"error": f"Erro ao atualizar configurações: {str(e)}"}, 500)
            return
        
        # Endpoint POST: Deletar Música da Biblioteca (/api/delete)
        elif parsed_path.path == '/api/delete':
            try:
                content_length = int(self.headers['Content-Length'])
                post_data = self.rfile.read(content_length)
                data = json.loads(post_data.decode('utf-8'))
                
                song_id = data.get('id')
                if not song_id:
                    self.send_response_json({"error": "O ID da música a ser deletada é obrigatório."}, 400)
                    return
                
                success = delete_lyric_by_id(int(song_id))
                self.send_response_json({"success": success})
            except Exception as e:
                self.send_response_json({"error": f"Erro ao deletar música: {str(e)}"}, 500)
            return
        
        else:
            self.send_response(404)
            self.end_headers()

    def send_response_json(self, data: dict, status: int = 200) -> None:
        """Auxiliar para envio de respostas estruturadas em JSON."""
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode('utf-8'))

    def send_file(self, filename: str, content_type: str) -> None:
        """Auxiliar para servir arquivos estáticos locais de forma segura prevenindo Directory Traversal."""
        # Suporte ao PyInstaller (_MEIPASS) para empacotamento em executável único portátil
        try:
            base_dir = os.path.abspath(sys._MEIPASS)
        except AttributeError:
            base_dir = os.path.abspath(os.path.dirname(os.path.abspath(__file__)))
            
        target_path = os.path.abspath(os.path.join(base_dir, filename))

        # Bloqueia acessos a qualquer arquivo fora da pasta de execução autorizada do projeto
        if not target_path.startswith(base_dir):
            self.send_response(403)
            self.end_headers()
            self.wfile.write(b"Acesso Proibido.")
            return

        if os.path.exists(target_path) and os.path.isfile(target_path):
            self.send_response(200)
            self.send_header('Content-Type', f'{content_type}; charset=utf-8')
            self.end_headers()
            with open(target_path, 'rb') as f:
                self.wfile.write(f.read())
        else:
            self.send_response(404)
            self.end_headers()
            self.wfile.write(b"Arquivo local nao encontrado.")

def open_browser() -> None:
    """Abre automaticamente o navegador padrão na interface do LyricFlow."""
    webbrowser.open("http://localhost:8000")

def main() -> None:
    port = 8000
    server_address = ('', port)
    
    print("--- Servidor LyricFlow (Interface Web SaaS) ---")
    print(f"Iniciando o servidor local concorrente em http://localhost:{port}...")
    
    # Inicia um timer em thread separada para abrir o navegador 1.5s após o boot do servidor
    Timer(1.5, open_browser).start()
    
    try:
        # Habilita o ThreadingHTTPServer (nativo desde Python 3.7) garantindo alta performance concorrente
        with ThreadingHTTPServer(server_address, LyricFlowAPIHandler) as httpd:
            print("Servidor rodando com sucesso. Pressione Ctrl+C para encerrar.")
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServidor encerrado pelo usuário.")
        sys.exit(0)
    except Exception as e:
        print(f"Erro ao iniciar o servidor: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()

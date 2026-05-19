import sqlite3
import json
import os

import sys

def get_executable_dir():
    """Retorna o diretório onde o executável do PyInstaller (ou script Python) está localizado."""
    if getattr(sys, 'frozen', False):
        return os.path.dirname(sys.executable)
    return os.path.dirname(os.path.abspath(__file__))

DB_FILE = os.path.join(get_executable_dir(), "lyricflow.db")

def get_db_connection():
    """Retorna uma conexão aberta com o banco de dados SQLite."""
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Inicializa o banco de dados e cria as tabelas necessárias se não existirem."""
    conn = get_db_connection()
    cursor = conn.cursor()

    # Tabela de Configurações da Igreja / Identidade Visual
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS church_settings (
            id INTEGER PRIMARY KEY,
            church_name TEXT NOT NULL,
            clean_lyrics INTEGER DEFAULT 1,
            lines_per_slide INTEGER DEFAULT 0,
            words_per_line INTEGER DEFAULT 0,
            keep_boundaries INTEGER DEFAULT 1,
            theme_color TEXT DEFAULT '#7c3aed'
        )
    """)

    # Tabela de Letras Salvas / Repositório Local da Igreja
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS saved_lyrics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            url TEXT UNIQUE NOT NULL,
            stanzas_json TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Cria índice para ordenação rápida de títulos no acervo local (Melhoria de Performance)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_saved_lyrics_title ON saved_lyrics (title)")

    # Adiciona colunas para logotipo se elas não existirem
    try:
        cursor.execute("ALTER TABLE church_settings ADD COLUMN logo_type TEXT DEFAULT 'default'")
    except sqlite3.OperationalError:
        pass

    try:
        cursor.execute("ALTER TABLE church_settings ADD COLUMN logo_url TEXT DEFAULT ''")
    except sqlite3.OperationalError:
        pass

    # Insere as configurações padrão iniciais se a tabela estiver vazia
    cursor.execute("SELECT COUNT(*) FROM church_settings")
    if cursor.fetchone()[0] == 0:
        cursor.execute("""
            INSERT INTO church_settings (id, church_name, clean_lyrics, lines_per_slide, words_per_line, keep_boundaries, theme_color, logo_type, logo_url)
            VALUES (1, 'Minha Igreja', 1, 0, 0, 1, '#7c3aed', 'default', '')
        """)

    conn.commit()
    conn.close()

def get_church_settings():
    """Recupera as configurações de projeção e identidade da igreja."""
    conn = get_db_connection()
    cursor = conn.cursor()
    # Uso de nomes explícitos de colunas em vez de SELECT * para maior resiliência de schema
    cursor.execute("""
        SELECT church_name, clean_lyrics, lines_per_slide, words_per_line, keep_boundaries, theme_color, logo_type, logo_url
        FROM church_settings 
        WHERE id = 1
    """)
    row = cursor.fetchone()
    conn.close()
    if row:
        d = dict(row)
        if "logo_type" not in d:
            d["logo_type"] = "default"
        if "logo_url" not in d:
            d["logo_url"] = ""
        return d
    return {
        "church_name": "Minha Igreja",
        "clean_lyrics": 1,
        "lines_per_slide": 0,
        "words_per_line": 0,
        "keep_boundaries": 1,
        "theme_color": "#7c3aed",
        "logo_type": "default",
        "logo_url": ""
    }

def update_church_settings(name: str, clean: int, lines: int, words: int, bounds: int, theme: str, logo_type: str = 'default', logo_url: str = ''):
    """Atualiza as configurações de projeção e nome da igreja no banco de dados."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE church_settings
        SET church_name = ?, clean_lyrics = ?, lines_per_slide = ?, words_per_line = ?, keep_boundaries = ?, theme_color = ?, logo_type = ?, logo_url = ?
        WHERE id = 1
    """, (name, clean, lines, words, bounds, theme, logo_type, logo_url))
    conn.commit()
    conn.close()

def save_lyric_to_db(title: str, url: str, stanzas: list):
    """Salva ou atualiza uma letra no repositório local do banco de dados (Cache/Histórico)."""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        stanzas_json = json.dumps(stanzas, ensure_ascii=False)
        cursor.execute("""
            INSERT INTO saved_lyrics (title, url, stanzas_json)
            VALUES (?, ?, ?)
            ON CONFLICT(url) DO UPDATE SET
                title = excluded.title,
                stanzas_json = excluded.stanzas_json
        """, (title, url, stanzas_json))
        conn.commit()
    except Exception as e:
        print(f"Erro ao salvar letra no banco: {e}")
    finally:
        conn.close()

def get_saved_lyrics():
    """Recupera todas as letras armazenadas no acervo local da igreja."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, title, url, stanzas_json, created_at FROM saved_lyrics ORDER BY title ASC")
    rows = cursor.fetchall()
    conn.close()
    
    result = []
    for row in rows:
        d = dict(row)
        # Mapeia o campo do banco de dados para a propriedade esperada pelo frontend
        if 'stanzas_json' in d:
            try:
                d['stanzas'] = json.loads(d.pop('stanzas_json'))
            except Exception:
                d['stanzas'] = []
        result.append(d)
    return result

def delete_lyric_by_id(song_id: int) -> bool:
    """Remove uma letra de música do acervo local da igreja através de seu ID único."""
    conn = get_db_connection()
    cursor = conn.cursor()
    success = False
    try:
        cursor.execute("DELETE FROM saved_lyrics WHERE id = ?", (song_id,))
        conn.commit()
        success = cursor.rowcount > 0
    except Exception as e:
        print(f"Erro ao deletar letra do banco: {e}")
    finally:
        conn.close()
    return success

# Garante que o banco seja inicializado ao importar o módulo
init_db()

---
description: Atue como um Engenheiro de Software Sênior e especialista em Python (Pythonic).
---

Aqui está o prompt completo e limpo, pronto para você copiar e colar e enviar para a IA gerar o seu código:

Atue como um Engenheiro de Software Sênior e especialista em Python (Pythonic). Sua missão é desenvolver um script de web scraping robusto para extrair letras de músicas do site Letras.mus.br e formatá-las perfeitamente para importação no software de projeção ProPresenter.

🧠 Mentalidade e Padrões de Código (Clean Code & Arquitetura):

Princípios SOLID e DRY: Aplique o Don't Repeat Yourself e o Princípio da Responsabilidade Única. O código deve ser estritamente modular (ex: funções distintas para requisição HTTP, extração/limpeza do HTML, formatação de texto e envio para a área de transferência).

Estética e Padrão PEP 8: O código deve ser legível, elegante e seguir rigorosamente as diretrizes de estilo da PEP 8.

Type Hinting: Utilize tipagem estática (Type Hints) em absolutamente todas as funções e variáveis principais para garantir clareza nas entradas e saídas.

Docstrings: Inclua docstrings claras, no formato padrão do Python, sob cada função explicando seu propósito, argumentos e retornos.

Tratamento de Erros e Resiliência: O script deve ser à prova de falhas. Utilize blocos try/except elegantes para lidar com exceções de rede (timeouts, HTTP 404, desconexão) e mudanças na estrutura do DOM (caso a classe HTML não seja encontrada). Retorne mensagens de erro descritivas e amigáveis no terminal.

⚙️ Requisitos Técnicos e Fluxo de Execução:

Stack Tecnológica: Utilize APENAS requests, BeautifulSoup (bs4) e pyperclip. É expressamente proibido o uso de navegadores headless (como Selenium ou Playwright).

Input: O script deve solicitar ao usuário a inserção da URL da música diretamente no terminal via input().

Processamento e Web Scraping: Faça a requisição para o Letras.mus.br. Encontre a tag/classe correta que abriga o texto da letra. Extraia o conteúdo removendo propagandas, elementos de navegação e tags HTML irrelevantes.

Formatação ProPresenter (Regra de Negócio): O ProPresenter requer delimitação de slides por parágrafos. O texto final DEVE ter uma linha em branco (dupla quebra de linha, ex: \n\n) separando cada estrofe rigorosamente.

Output Integrado: O script NÃO deve gerar arquivos físicos (.txt). O resultado final deve ser copiado silenciosa e automaticamente para a Área de Transferência do sistema operacional utilizando o pyperclip.

Feedback: Ao final da execução bem-sucedida, exiba uma mensagem elegante no terminal confirmando que a letra está pronta para ser colada no ProPresenter.

Por favor, entregue apenas o código fonte completo e, em seguida, os comandos do pip necessários para instalar as dependências.

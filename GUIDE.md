# Guia de Publicação e Teste - Vieira's Solar

Este guia descreve os passos necessários para configurar, testar e publicar sua plataforma de gestão solar.

## 1. Configuração do Ambiente (SMTP e APIs)

Para que as funcionalidades de e-mail funcionem corretamente, você deve configurar as seguintes variáveis de ambiente no painel do AI Studio:

### E-mail (SMTP)
*   `SMTP_HOST`: O endereço do servidor SMTP (ex: `smtp.gmail.com`).
*   `SMTP_PORT`: A porta do servidor (ex: `465` para SSL ou `587` para TLS).
*   `SMTP_USER`: Seu e-mail completo.
*   `SMTP_PASS`: Sua senha. **Importante:** Se estiver usando Gmail, você deve gerar uma "Senha de App" nas configurações de segurança da sua conta Google.
*   `SMTP_FROM`: O e-mail que aparecerá como remetente.

## 2. Testando a Plataforma

### Fluxo de Propostas
1.  Acesse a aba **Propostas**.
2.  Clique em **Nova Proposta**.
3.  Preencha os dados do cliente e avance.
4.  Selecione um Kit da sua lista de kits gerenciados.
5.  Defina a precificação e condições de financiamento.
6.  Na etapa final, clique em **Criar Proposta**. Isso salvará os dados e permitirá a geração do documento PDF.

### Gestão de Kits
1.  Na aba **Kits**, você pode gerenciar seu catálogo de equipamentos.
2.  É possível adicionar kits manualmente ou via upload de arquivo CSV.
3.  Os kits cadastrados aparecerão automaticamente na seleção de novas propostas.

### Clientes e Projetos
1.  Aba **Clientes**: Visualize e gerencie sua base de clientes e o histórico de projetos de cada um.
2.  Aba **Instalações**: Acompanhe o progresso das instalações em tempo real.

## 3. Resolução de Problemas Comuns

### Erro de Login Inválido no E-mail (535-5.7.8)
Este erro ocorre quando o usuário ou senha do SMTP estão incorretos.
*   **Solução:** Verifique `SMTP_USER` e `SMTP_PASS`. Se usar Gmail, use uma **Senha de App**, não a sua senha normal.

## 4. Publicação

A plataforma já está configurada para rodar em um ambiente full-stack (Express + Vite). Para publicar:
1.  Certifique-se de que todas as variáveis de ambiente estão configuradas.
2.  O AI Studio cuida do build e deploy automático para o Cloud Run.
3.  Use a **Shared App URL** para compartilhar a plataforma com seus usuários.

---
*Desenvolvido para Vieira's Solar*

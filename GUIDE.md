# Guia de Publicação e Teste - Vieira's Solar

Este guia descreve os passos necessários para configurar, testar e publicar sua plataforma de simulador solar.

## 1. Configuração do Ambiente (SMTP e APIs)

Para que as funcionalidades de e-mail e integração funcionem corretamente, você deve configurar as seguintes variáveis de ambiente no painel do AI Studio:

### E-mail (SMTP)
*   `SMTP_HOST`: O endereço do servidor SMTP (ex: `smtp.gmail.com`).
*   `SMTP_PORT`: A porta do servidor (ex: `465` para SSL ou `587` para TLS).
*   `SMTP_USER`: Seu e-mail completo.
*   `SMTP_PASS`: Sua senha. **Importante:** Se estiver usando Gmail, você deve gerar uma "Senha de App" nas configurações de segurança da sua conta Google.
*   `SMTP_FROM`: O e-mail que aparecerá como remetente.

### Integração Fortlev Solar
*   `FORTLEV_API_EMAIL`: Seu e-mail de acesso à API Fortlev.
*   `FORTLEV_API_PASSWORD`: Sua senha de acesso à API Fortlev.

## 2. Testando a Plataforma

### Fluxo de Simulação
1.  Acesse a aba **Simulador Solar**.
2.  Insira os dados do cliente e o consumo de energia.
3.  Avance para a escolha do kit. Você pode usar os kits mockados ou conectar-se à API Fortlev clicando no botão de login.
4.  Na etapa final, clique em **Gerar Proposta**. Isso fará o download do PDF e tentará enviar o e-mail para o cliente.

### Financeiro e Configurações
1.  Na aba **Financeiro**, verifique o gráfico de comissões por consultor.
2.  Na aba **Configurações**, teste o filtro de data na seção de faturas.
3.  Tente adicionar um novo kit na aba **Kits** e verifique se as validações de preço e potência (números positivos) estão funcionando.

## 3. Resolução de Problemas Comuns

### Erro de Login Inválido no E-mail (535-5.7.8)
Este erro ocorre quando o usuário ou senha do SMTP estão incorretos.
*   **Solução:** Verifique `SMTP_USER` e `SMTP_PASS`. Se usar Gmail, use uma **Senha de App**, não a sua senha normal.

### Erro de Chave Duplicada (f1)
Este erro foi corrigido alterando os IDs dos kits mockados para serem únicos.
*   **Solução:** Se o erro persistir, certifique-se de que novos kits adicionados manualmente tenham nomes ou IDs únicos.

## 4. Publicação

A plataforma já está configurada para rodar em um ambiente full-stack (Express + Vite). Para publicar:
1.  Certifique-se de que todas as variáveis de ambiente estão configuradas.
2.  O AI Studio cuida do build e deploy automático para o Cloud Run.
3.  Use a **Shared App URL** para compartilhar a plataforma com seus usuários.

---
*Desenvolvido para Vieira's Solar*

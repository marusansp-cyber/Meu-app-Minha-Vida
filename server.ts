import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import nodemailer from "nodemailer";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  console.log("Verificando configuração SMTP...");
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    console.log(`SMTP_USER detectado: ${process.env.SMTP_USER}`);
    console.log("SMTP_PASS detectado (tamanho):", process.env.SMTP_PASS.length);
  } else {
    console.warn("AVISO: SMTP_USER ou SMTP_PASS não configurados nas variáveis de ambiente.");
  }

  // Helper to get transporter with latest env vars
  const getTransporter = () => {
    // Sanitize credentials: remove spaces, trim, and remove accidental quotes if any
    const user = (process.env.SMTP_USER || "").trim().replace(/^["'](.+)["']$/, '$1');
    const pass = (process.env.SMTP_PASS || "").replace(/\s+/g, "").trim().replace(/^["'](.+)["']$/, '$1');
    const host = (process.env.SMTP_HOST || "smtp.gmail.com").trim().replace(/^["'](.+)["']$/, '$1');
    
    const isGmail = host.toLowerCase().includes("gmail.com") || host.toLowerCase().includes("googlemail.com");

    const config: any = {
      auth: {
        user: user,
        pass: pass,
      },
    };

    if (isGmail) {
      config.service = 'gmail';
    } else {
      config.host = host;
      config.port = parseInt(process.env.SMTP_PORT || "587");
      config.secure = process.env.SMTP_PORT === "465";
      config.tls = {
        rejectUnauthorized: false
      };
    }

    return nodemailer.createTransport(config);
  };

  // Proposal Email API
  app.post("/api/proposals/send", async (req, res) => {
    const { to, subject, body, pdfBase64, fileName } = req.body;

    if (!to || !pdfBase64) {
      return res.status(400).json({ success: false, message: "Destinatário e PDF são obrigatórios." });
    }

    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      return res.status(500).json({ 
        success: false, 
        message: "Configuração de e-mail incompleta. Por favor, configure SMTP_USER e SMTP_PASS nas configurações do app (ícone de engrenagem no AI Studio)." 
      });
    }

    try {
      const transporter = getTransporter();
      const host = (process.env.SMTP_HOST || "smtp.gmail.com").toLowerCase();
      const isGmail = host.includes("gmail.com") || host.includes("googlemail.com");

      const mailOptions = {
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to,
        subject: subject || "Proposta Solar - Vieira's Solar & Engenharia",
        text: body || "Olá, segue em anexo a proposta comercial para o seu sistema de energia solar.",
        attachments: [
          {
            filename: fileName || "proposta_solar.pdf",
            content: pdfBase64.split("base64,")[1] || pdfBase64,
            encoding: 'base64'
          }
        ]
      };

      await transporter.sendMail(mailOptions);
      res.json({ success: true, message: "E-mail enviado com sucesso!" });
    } catch (error) {
      console.error("Erro ao enviar e-mail:", error);
      let errorMessage = "Erro no serviço de e-mail: Verifique se as credenciais SMTP estão corretas.";
      const errorStr = String(error);
      const host = (process.env.SMTP_HOST || "smtp.gmail.com").toLowerCase();
      const isGmail = host.includes("gmail.com") || host.includes("googlemail.com");
      
      if (errorStr.includes('EAUTH') || errorStr.includes('Invalid login') || errorStr.includes('535')) {
        if (isGmail) {
          errorMessage = "Erro de Autenticação Gmail: O Google rejeitou sua senha. Você DEVE usar uma 'Senha de App' (16 dígitos). Senhas comuns NÃO funcionam. Gere uma em 'Segurança' na sua Conta Google.";
        } else {
          errorMessage = "Erro de Autenticação SMTP (535): Usuário ou senha incorretos. Verifique se o provedor exige senhas de aplicativo.";
        }
      } else if (errorStr.includes('ECONNREFUSED') || errorStr.includes('ETIMEDOUT') || errorStr.includes('ESOCKET')) {
        errorMessage = "Erro de Conexão SMTP: Não foi possível conectar ao servidor. Verifique o Host (smtp.gmail.com) e a Porta (587 ou 465).";
      }

      res.status(500).json({ 
        success: false, 
        message: errorMessage,
        error: errorStr 
      });
    }
  });

  // SMTP Test API
  app.get("/api/smtp/test", async (req, res) => {
    const user = (process.env.SMTP_USER || "").trim().replace(/^["'](.+)["']$/, '$1');
    const pass = (process.env.SMTP_PASS || "").replace(/\s+/g, "").trim().replace(/^["'](.+)["']$/, '$1');

    if (!user || !pass) {
      return res.status(500).json({ 
        success: false, 
        message: "SMTP não configurado. Defina SMTP_USER e SMTP_PASS nas variáveis de ambiente do AI Studio." 
      });
    }

    try {
      const transporter = getTransporter();
      const host = (process.env.SMTP_HOST || "smtp.gmail.com").toLowerCase();
      const isGmail = host.includes("gmail.com") || host.includes("googlemail.com");

      console.log(`Testando SMTP com Usuário: ${process.env.SMTP_USER}`);
      // Log partial password for verification without exposing it fully
      const pass = process.env.SMTP_PASS || "";
      console.log(`Senha SMTP configurada? ${pass ? "SIM (tamanho: " + pass.length + ")" : "NÃO"}`);
      if (pass.length > 0) {
        console.log(`Início da senha (limpa): ${pass.replace(/\s+/g, '').substring(0, 4)}...`);
      }
      
      await transporter.verify();
      res.json({ success: true, message: "Conexão SMTP verificada com sucesso!" });
    } catch (error) {
      console.error("Erro no teste SMTP:", error);
      let errorMessage = "Falha na conexão SMTP.";
      const errorStr = String(error);
      const host = (process.env.SMTP_HOST || "smtp.gmail.com").toLowerCase();
      const isGmail = host.includes("gmail.com") || host.includes("googlemail.com");

      if (errorStr.includes('EAUTH') || errorStr.includes('Invalid login') || errorStr.includes('535')) {
        if (isGmail) {
          errorMessage = "Erro de Autenticação Gmail: Senha Rejeitada. Você DEVE usar uma 'Senha de App' (16 dígitos). Senhas normais NÃO funcionam no Gmail SMTP.";
        } else {
          errorMessage = "Erro de Autenticação SMTP (535): Usuário ou senha incorretos.";
        }
      }
      res.status(500).json({ success: false, message: errorMessage, error: errorStr });
    }
  });


  // SMTP Status API (Safe check)
  app.get("/api/smtp/status", (req, res) => {
    const user = (process.env.SMTP_USER || "").trim().replace(/^["'](.+)["']$/, '$1');
    const pass = (process.env.SMTP_PASS || "").replace(/\s+/g, "").trim().replace(/^["'](.+)["']$/, '$1');
    const host = (process.env.SMTP_HOST || "smtp.gmail.com").trim().replace(/^["'](.+)["']$/, '$1');

    res.json({
      success: true,
      configured: !!(user && pass),
      user: user ? `${user.substring(0, 3)}***@***` : null,
      host: host,
      passLength: pass.length
    });
  });


  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

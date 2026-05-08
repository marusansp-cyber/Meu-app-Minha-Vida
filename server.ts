import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import nodemailer from "nodemailer";

async function startServer() {
  console.log("=== INICIANDO PROCESSO DE STARTUP DO SERVIDOR ===");
  try {
    const app = express();
    const PORT = 3000;
    
    app.get("/api/health", (req, res) => {
      res.json({ status: "ok", time: new Date().toISOString() });
    });

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
    const { to, subject, body, pdfBase64, fileName, smtpConfig } = req.body;

    if (!to || !pdfBase64) {
      return res.status(400).json({ success: false, message: "Destinatário e PDF são obrigatórios." });
    }

    const user = smtpConfig?.user || process.env.SMTP_USER;
    const pass = smtpConfig?.pass || process.env.SMTP_PASS;

    if (!user || !pass) {
      return res.status(500).json({ 
        success: false, 
        message: "Configuração de e-mail incompleta. Por favor, configure os dados de SMTP nas configurações do sistema." 
      });
    }

    const userClean = (user || "").trim().replace(/^["'](.+)["']$/, '$1');
    const passClean = (pass || "").replace(/\s+/g, "").trim().replace(/^["'](.+)["']$/, '$1');
    const hostClean = (smtpConfig?.host || process.env.SMTP_HOST || "smtp.gmail.com").trim().replace(/^["'](.+)["']$/, '$1');
    const isActuallyGmail = hostClean.toLowerCase().includes("gmail.com") || hostClean.toLowerCase().includes("googlemail.com");

    if (isActuallyGmail && passClean.length !== 16) {
      return res.status(401).json({
        success: false,
        message: "Erro de Configuração Gmail: A Senha de App deve ter exatamente 16 caracteres. O Google rejeitou sua senha atual possivelmente por ser sua senha comum ou estar incompleta.",
        error: "INVALID_GMAIL_PASS_LENGTH"
      });
    }

    try {
      // Helper to get transporter with either env vars or provided config
      const getTransporterWithConfig = () => {
        const u = userClean;
        const p = passClean;
        const h = hostClean;
        const port = parseInt(smtpConfig?.port || process.env.SMTP_PORT || "587");
        
        const isGmail = h.toLowerCase().includes("gmail.com") || h.toLowerCase().includes("googlemail.com");

        const config: any = {
          auth: {
            user: u,
            pass: p,
          },
        };

        if (isGmail) {
          config.service = 'gmail';
        } else {
          config.host = h;
          config.port = port;
          config.secure = port === 465;
          config.tls = {
            rejectUnauthorized: false
          };
        }

        return nodemailer.createTransport(config);
      };

      const transporter = getTransporterWithConfig();
      const mailOptions = {
        from: smtpConfig?.from || process.env.SMTP_FROM || user,
        to,
        subject: subject || "Proposta Solar - Vieira's Solar & Engenharia",
        text: body || "Olá, segue em anexo a proposta comercial para o seu sistema de energia solar.",
        headers: {
          'Disposition-Notification-To': userClean, // Requests a read receipt to the sender
          'Return-Receipt-To': userClean // Another common header for receipts
        },
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
      const usedHost = (smtpConfig?.host || process.env.SMTP_HOST || "smtp.gmail.com").toLowerCase();
      const isActuallyGmail = usedHost.includes("gmail.com") || usedHost.includes("googlemail.com");
      
      if (errorStr.includes('EAUTH') || errorStr.includes('Invalid login') || errorStr.includes('535')) {
        if (isActuallyGmail) {
          errorMessage = "Erro de Autenticação Gmail: O Google rejeitou sua senha. Você DEVE usar uma 'Senha de App' (16 dígitos). Senhas comuns NÃO funcionam. Gere uma em 'Segurança' na sua Conta Google.";
        } else {
          errorMessage = "Erro de Autenticação SMTP (535): Usuário ou senha incorretos. Verifique se o provedor exige senhas de aplicativo.";
        }
      } else if (errorStr.includes('ECONNREFUSED') || errorStr.includes('ETIMEDOUT') || errorStr.includes('ESOCKET')) {
        errorMessage = "Erro de Conexão SMTP: Não foi possível conectar ao servidor. Verifique o Host (" + usedHost + ") e a Porta.";
      }

      res.status(500).json({ 
        success: false, 
        message: errorMessage,
        error: errorStr 
      });
    }
  });

  // SMTP Test API
  app.post("/api/smtp/test", async (req, res) => {
    const { smtpConfig } = req.body;
    
    // Check if we have credentials either from body or env
    const user = (smtpConfig?.user || process.env.SMTP_USER || "").trim().replace(/^["'](.+)["']$/, '$1');
    const pass = (smtpConfig?.pass || process.env.SMTP_PASS || "").replace(/\s+/g, "").trim().replace(/^["'](.+)["']$/, '$1');
    const usedHost = (smtpConfig?.host || process.env.SMTP_HOST || "smtp.gmail.com").toLowerCase();
    const isActuallyGmail = usedHost.includes("gmail.com") || usedHost.includes("googlemail.com");

    if (!user || !pass) {
      return res.status(500).json({ 
        success: false, 
        message: "Dados SMTP não fornecidos. Preencha os campos ou configure as variáveis de ambiente." 
      });
    }

    if (isActuallyGmail && pass.length !== 16) {
      return res.status(401).json({
        success: false,
        message: "Erro de Configuração Gmail: A Senha de App deve ter exatamente 16 caracteres. O Google rejeitou sua senha atual possivelmente por ser sua senha comum ou estar incompleta.",
        error: "INVALID_GMAIL_PASS_LENGTH"
      });
    }

    try {
      // Helper to get transporter with either env vars or provided config
      const getTransporterWithConfig = () => {
        const u = user;
        const p = pass;
        const h = usedHost.trim().replace(/^["'](.+)["']$/, '$1');
        const port = parseInt(smtpConfig?.port || process.env.SMTP_PORT || "587");
        
        const isGmail = h.toLowerCase().includes("gmail.com") || h.toLowerCase().includes("googlemail.com");

        const config: any = {
          auth: {
            user: u,
            pass: p,
          },
        };

        if (isGmail) {
          config.service = 'gmail';
        } else {
          config.host = h;
          config.port = port;
          config.secure = port === 465;
          config.tls = {
            rejectUnauthorized: false
          };
        }

        return nodemailer.createTransport(config);
      };

      const transporter = getTransporterWithConfig();
      await transporter.verify();
      res.json({ success: true, message: "Conexão SMTP verificada com sucesso!" });
    } catch (error) {
      console.error("Erro no teste SMTP:", error);
      let errorMessage = "Falha na conexão SMTP.";
      const errorStr = String(error);
      const usedHost = (smtpConfig?.host || process.env.SMTP_HOST || "smtp.gmail.com").toLowerCase();
      const isActuallyGmail = usedHost.includes("gmail.com") || usedHost.includes("googlemail.com");

      if (errorStr.includes('EAUTH') || errorStr.includes('Invalid login') || errorStr.includes('535')) {
        if (isActuallyGmail) {
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
    console.log("Configurando middleware do Vite...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Middleware do Vite configurado.");
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
  } catch (error) {
    console.error("FALHA CRÍTICA AO INICIAR SERVIDOR:", error);
    process.exit(1);
  }
}

startServer();

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import nodemailer from "nodemailer";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // Email Configuration
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_PORT === "465",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

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
      
      if (errorStr.includes('EAUTH') || errorStr.includes('Invalid login') || errorStr.includes('535')) {
        if (process.env.SMTP_HOST?.includes('gmail.com')) {
          errorMessage = "Erro de Autenticação Gmail: Você DEVE usar uma 'Senha de App' (16 dígitos). Senhas normais não funcionam. Ative a Verificação em Duas Etapas no Google e gere uma Senha de App.";
        } else {
          errorMessage = "Erro de Autenticação SMTP: Usuário ou senha incorretos. Verifique se o provedor exige senhas de aplicativo.";
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
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      return res.status(500).json({ 
        success: false, 
        message: "SMTP não configurado. Defina SMTP_USER e SMTP_PASS." 
      });
    }

    try {
      await transporter.verify();
      res.json({ success: true, message: "Conexão SMTP verificada com sucesso!" });
    } catch (error) {
      console.error("Erro no teste SMTP:", error);
      let errorMessage = "Falha na conexão SMTP.";
      if (String(error).includes('EAUTH')) {
        errorMessage = "Erro de Autenticação: Usuário ou senha incorretos.";
      }
      res.status(500).json({ success: false, message: errorMessage, error: String(error) });
    }
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

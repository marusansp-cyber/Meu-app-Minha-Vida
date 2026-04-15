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

  // Fortlev Integration API
  app.post("/api/fortlev/login", (req, res) => {
    const { email, password } = req.body;
    
    // Check against environment variables if they are set
    const envEmail = process.env.FORTLEV_API_EMAIL;
    const envPassword = process.env.FORTLEV_API_PASSWORD;

    if (envEmail && envPassword) {
      if (email === envEmail && password === envPassword) {
        return res.json({ 
          success: true, 
          token: "fortlev-auth-token-secure-123", 
          user: { 
            name: "Caio Moreira Martins", 
            email,
            company: "Solar Tech Ltda",
            role: "Integrador Master"
          } 
        });
      } else {
        return res.status(401).json({ success: false, message: "Credenciais Fortlev inválidas. Verifique seu e-mail e senha." });
      }
    }

    // Fallback for demo if env vars are not set
    if (email === "caiomoreiramartins@hotmail.com" && password === "Caioandover04$") {
       return res.json({ 
         success: true, 
         token: "fortlev-auth-token-demo-123", 
         user: { 
           name: "Caio Moreira Martins", 
           email,
           company: "Solar Tech Ltda",
           role: "Integrador Master"
         } 
       });
    }

    // Default mock success for other credentials in demo mode
    res.json({ 
      success: true, 
      token: "fortlev-auth-token-demo", 
      user: { 
        name: "Usuário Demo", 
        email,
        company: "Empresa de Teste",
        role: "Integrador"
      } 
    });
  });

  app.get("/api/fortlev/kits", (req, res) => {
    // Mock kits from Fortlev with detailed components
    res.json([
      { 
        id: 'fortlev-kit-1', 
        name: 'Kit Fortlev Residencial 3.0', 
        price: 12500, 
        power: 3.0,
        description: 'Ideal para consumo até 350kWh/mês',
        components: [
          { name: 'Painéis Canadian 550W', quantity: 6, brand: 'Canadian Solar', model: 'HiKu6' },
          { name: 'Inversor Deye 3kW', quantity: 1, brand: 'Deye', model: 'SUN-3K-G04' }
        ]
      },
      { 
        id: 'fortlev-kit-2', 
        name: 'Kit Fortlev Premium 5.5', 
        price: 18900, 
        power: 5.5,
        description: 'Ideal para consumo até 600kWh/mês',
        components: [
          { name: 'Painéis Jinko 550W', quantity: 10, brand: 'Jinko Solar', model: 'Tiger Neo' },
          { name: 'Inversor Deye 5kW', quantity: 1, brand: 'Deye', model: 'SUN-5K-G04' }
        ]
      },
      { 
        id: 'fortlev-kit-3', 
        name: 'Kit Fortlev Industrial 10.0', 
        price: 32000, 
        power: 10.0,
        description: 'Ideal para pequenos comércios',
        components: [
          { name: 'Painéis Canadian 550W', quantity: 18, brand: 'Canadian Solar', model: 'HiKu6' },
          { name: 'Inversor Deye 10kW', quantity: 1, brand: 'Deye', model: 'SUN-10K-G04' }
        ]
      },
      { 
        id: 'fortlev-kit-4', 
        name: 'Kit Fortlev Agro 20.0', 
        price: 58000, 
        power: 20.0,
        description: 'Alta potência para agronegócio',
        components: [
          { name: 'Painéis Jinko 550W', quantity: 36, brand: 'Jinko Solar', model: 'Tiger Neo' },
          { name: 'Inversor Deye 20kW', quantity: 1, brand: 'Deye', model: 'SUN-20K-G04' }
        ]
      },
    ]);
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

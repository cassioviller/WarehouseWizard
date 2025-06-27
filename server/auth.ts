import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import { insertUserSchema } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  if (!stored || !stored.includes('.')) {
    return false;
  }
  const [hashed, salt] = stored.split(".");
  if (!hashed || !salt) {
    return false;
  }
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "warehouse-secret-key",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        console.log(`[AUTH] Tentativa de login para usuário: ${username}`);
        const user = await storage.getUserByUsername(username);
        
        if (!user) {
          console.log(`[AUTH] Usuário ${username} não encontrado`);
          return done(null, false);
        }
        
        console.log(`[AUTH] Usuário encontrado: ${user.username}, verificando senha...`);
        const passwordMatch = await comparePasswords(password, user.password);
        
        if (!passwordMatch) {
          console.log(`[AUTH] Senha incorreta para usuário: ${username}`);
          return done(null, false);
        }
        
        console.log(`[AUTH] Login bem-sucedido para usuário: ${username}`);
        return done(null, user);
      } catch (error) {
        console.error(`[AUTH] Erro no login para usuário ${username}:`, error);
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      
      const existingUser = await storage.getUserByUsername(validatedData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Usuário já existe" });
      }

      const user = await storage.createUser({
        ...validatedData,
        password: await hashPassword(validatedData.password),
      });

      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(user);
      });
    } catch (error) {
      res.status(400).json({ message: "Dados inválidos" });
    }
  });

  app.post("/api/login", (req, res, next) => {
    console.log(`[AUTH] Recebida requisição de login para: ${req.body.username}`);
    
    passport.authenticate("local", (err, user, info) => {
      if (err) {
        console.error(`[AUTH] Erro na autenticação:`, err);
        return res.status(500).json({ message: "Erro interno do servidor" });
      }
      
      if (!user) {
        console.log(`[AUTH] Falha na autenticação - usuário ou senha incorretos`);
        return res.status(401).json({ message: "Usuário ou senha incorretos" });
      }
      
      req.logIn(user, (err) => {
        if (err) {
          console.error(`[AUTH] Erro ao criar sessão:`, err);
          return res.status(500).json({ message: "Erro interno do servidor" });
        }
        
        console.log(`[AUTH] Login bem-sucedido, sessão criada para: ${user.username}`);
        res.status(200).json(user);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });
}

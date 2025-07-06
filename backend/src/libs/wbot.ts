import * as Sentry from "@sentry/node";
import { Client, LocalAuth, RemoteAuth, Events, MessageMedia } from 'whatsapp-web.js';
import { Op } from "sequelize";
import { FindOptions } from "sequelize/types";
import Whatsapp from "../models/Whatsapp";
import { logger } from "../utils/logger";
import AppError from "../errors/AppError";
import { getIO } from "./socket";
import { StartWhatsAppSession } from "../services/WbotServices/StartWhatsAppSession";
import NodeCache from 'node-cache';
import Contact from "../models/Contact";
import Ticket from "../models/Ticket";
import * as fs from 'fs';
import * as path from 'path';

// Tipo personalizado para la sesión que extiende Client
type Session = Client & {
  id?: number;
  name?: string;
  companyId?: number;
};

// Array para almacenar las sesiones activas
const sessions: Session[] = [];

// Map para controlar reintentos de QR code
const retriesQrCodeMap = new Map<number, number>();

// Cache para dispositivos y mensajes
const msgRetryCounterCache = new NodeCache();

/**
 * Obtiene una sesión activa por ID de WhatsApp
 */
export const getWbot = (whatsappId: number): Session => {
  const sessionIndex = sessions.findIndex(s => s.id === whatsappId);

  if (sessionIndex === -1) {
    throw new AppError("ERR_WAPP_NOT_INITIALIZED");
  }
  return sessions[sessionIndex];
};

/**
 * Remueve una sesión de WhatsApp
 */
export const removeWbot = async (
  whatsappId: number,
  isLogout = true
): Promise<void> => {
  try {
    const sessionIndex = sessions.findIndex(s => s.id === whatsappId);
    if (sessionIndex !== -1) {
      const session = sessions[sessionIndex];
      
      if (isLogout) {
        await session.logout();
      }
      
      await session.destroy();
      sessions.splice(sessionIndex, 1);
    }
  } catch (err) {
    logger.error(err);
  }
};

/**
 * Reinicia todas las sesiones de una compañía
 */
export const restartWbot = async (
  companyId: number,
  session?: any
): Promise<void> => {
  try {
    const options: FindOptions = {
      where: {
        companyId,
      },
      attributes: ["id"],
    }

    const whatsapps = await Whatsapp.findAll(options);

    for (const whatsapp of whatsapps) {
      const sessionIndex = sessions.findIndex(s => s.id === whatsapp.id);
      if (sessionIndex !== -1) {
        await sessions[sessionIndex].destroy();
        sessions.splice(sessionIndex, 1);
      }
    }

  } catch (err) {
    logger.error(err);
  }
};

/**
 * Crea la configuración de autenticación para una sesión
 */
const createAuthStrategy = (whatsapp: Whatsapp) => {
  const sessionPath = path.join(process.cwd(), '.wwebjs_auth', `session-${whatsapp.id}`);
  
  // Crear directorio si no existe
  if (!fs.existsSync(sessionPath)) {
    fs.mkdirSync(sessionPath, { recursive: true });
  }

  return new LocalAuth({
    clientId: `whatsapp-${whatsapp.id}`,
    dataPath: sessionPath
  });
};

/**
 * Inicializa una nueva sesión de WhatsApp con whatsapp-web.js
 */
export const initWASocket = async (whatsapp: Whatsapp): Promise<Session> => {
  return new Promise(async (resolve, reject) => {
    try {
      const io = getIO();

      const whatsappUpdate = await Whatsapp.findOne({
        where: { id: whatsapp.id }
      });

      if (!whatsappUpdate) {
        reject(new Error("WhatsApp instance not found"));
        return;
      }

      const { id, name, companyId } = whatsappUpdate;

      logger.info(`Starting WhatsApp session: ${name} (ID: ${id})`);

      let retriesQrCode = 0;
      
      // Configurar cliente de WhatsApp Web
      const client: Session = new Client({
        authStrategy: createAuthStrategy(whatsapp),
        puppeteer: {
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu',
            '--disable-extensions',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding'
          ],
          timeout: 60000
        },
        webVersionCache: {
          type: 'remote',
          remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html',
        },
        // Force receive all message events
        takeoverOnConflict: true,
        takeoverTimeoutMs: 0,
        // Additional options to ensure message reception
        restartOnAuthFail: true
      }) as Session;

      // Asignar propiedades personalizadas
      client.id = whatsapp.id;
      client.name = whatsapp.name;
      client.companyId = whatsapp.companyId;

      // Event: QR Code generado
      client.on('qr', async (qr: string) => {
        logger.info(`QR Code generated for session ${name}`);
        
        if (retriesQrCodeMap.get(id) && retriesQrCodeMap.get(id)! >= 3) {
          await whatsappUpdate.update({
            status: "DISCONNECTED",
            qrcode: ""
          });

          io.to(`company-${companyId}-mainchannel`).emit(`company-${companyId}-whatsappSession`, {
            action: "update",
            session: whatsappUpdate
          });

          await client.destroy();
          retriesQrCodeMap.delete(id);
          reject(new Error("Max QR code retries reached"));
        } else {
          retriesQrCode++;
          retriesQrCodeMap.set(id, retriesQrCode);

          await whatsappUpdate.update({
            qrcode: qr,
            status: "qrcode",
            retries: retriesQrCode,
            number: ""
          });

          // Agregar a sesiones si no existe
          const sessionIndex = sessions.findIndex(s => s.id === whatsapp.id);
          if (sessionIndex === -1) {
            sessions.push(client);
          }

          io.to(`company-${companyId}-mainchannel`).emit(`company-${companyId}-whatsappSession`, {
            action: "update",
            session: whatsappUpdate
          });
        }
      });

      // Event: Cliente listo/conectado
      client.on('ready', async () => {
        logger.info(`WhatsApp session ${name} is ready!`);
        console.log(`📱 WhatsApp session ${name} is fully ready and connected!`);

        const info = client.info;
        const phoneNumber = info?.wid?.user || "";

        console.log('📊 WhatsApp Session Info:', {
          name: name,
          phoneNumber: phoneNumber,
          platform: info?.platform,
          pushname: info?.pushname,
          hasWid: !!info?.wid,
          isBusiness: info?.platform === 'smba'
        });

        // Special handling for WhatsApp Business
        if (info?.platform === 'smba') {
          console.log('🏢 WhatsApp Business detected - setting up business-specific configurations');
          
          // Check for existing chats and unread messages
          try {
            const chats = await client.getChats();
            console.log(`📬 Found ${chats.length} chats in WhatsApp Business`);
            
            const unreadChats = chats.filter(chat => chat.unreadCount > 0);
            if (unreadChats.length > 0) {
              console.log('📬 Unread chats found:', unreadChats.map(chat => ({
                id: chat.id._serialized,
                name: chat.name,
                unreadCount: chat.unreadCount
              })));
            }
          } catch (error) {
            console.log('⚠️ Could not fetch WhatsApp Business chats:', error);
          }
        }

        await whatsappUpdate.update({
          status: "CONNECTED",
          qrcode: "",
          retries: 0,
          number: phoneNumber
        });

        io.to(`company-${companyId}-mainchannel`).emit(`company-${companyId}-whatsappSession`, {
          action: "update",
          session: whatsappUpdate
        });

        // Agregar a sesiones si no existe
        const sessionIndex = sessions.findIndex(s => s.id === whatsapp.id);
        if (sessionIndex === -1) {
          sessions.push(client);
        }

        retriesQrCodeMap.delete(id);
        resolve(client);
      });

      // Event: Autenticación exitosa
      client.on(Events.AUTHENTICATED, () => {
        logger.info(`WhatsApp session ${name} authenticated`);
      });

      // Event: Fallo de autenticación
      client.on(Events.AUTHENTICATION_FAILURE, async (msg: string) => {
        logger.error(`Authentication failure for session ${name}: ${msg}`);
        
        await whatsappUpdate.update({ 
          status: "PENDING", 
          session: "", 
          number: "" 
        });

        io.to(`company-${companyId}-mainchannel`).emit(`company-${companyId}-whatsappSession`, {
          action: "update",
          session: whatsappUpdate
        });

        removeWbot(id, false);
        setTimeout(() => StartWhatsAppSession(whatsapp, companyId), 5000);
      });

      // Event: Cliente desconectado
      client.on(Events.DISCONNECTED, async (reason: string) => {
        logger.info(`WhatsApp session ${name} disconnected: ${reason}`);
        
        await whatsappUpdate.update({ 
          status: "PENDING", 
          session: "", 
          number: "" 
        });

        io.to(`company-${companyId}-mainchannel`).emit(`company-${companyId}-whatsappSession`, {
          action: "update",
          session: whatsappUpdate
        });

        removeWbot(id, false);
        
        // Reconectar después de 2 segundos si no fue logout manual
        if (reason !== 'LOGOUT') {
          setTimeout(() => StartWhatsAppSession(whatsapp, companyId), 2000);
        }
      });

      // Event: Cambio de estado de conexión  
      client.on(Events.STATE_CHANGED, (state: string) => {
        logger.info(`WhatsApp session ${name} state changed: ${state}`);
      });

      // Inicializar cliente
      await client.initialize();

    } catch (error) {
      Sentry.captureException(error);
      logger.error(`Error initializing WhatsApp session ${whatsapp.name}:`, error);
      reject(error);
    }
  });
};

// Función auxiliar para verificar si una sesión está activa
export const isSessionActive = (whatsappId: number): boolean => {
  const session = sessions.find(s => s.id === whatsappId);
  return session ? session.info?.wid !== undefined : false;
};

// Función auxiliar para obtener información de la sesión
export const getSessionInfo = (whatsappId: number) => {
  const session = sessions.find(s => s.id === whatsappId);
  return session ? session.info : null;
};

// Exportar sesiones para debug (solo desarrollo)
if (process.env.NODE_ENV === 'development') {
  (global as any).sessions = sessions;
}
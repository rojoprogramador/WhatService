import { Message as WWebMessage, MessageMedia } from 'whatsapp-web.js';
import * as Sentry from "@sentry/node";
import fs from "fs";
import { exec } from "child_process";
import path from "path";
import ffmpegPath from "@ffmpeg-installer/ffmpeg";
import AppError from "../../errors/AppError";
import GetTicketWbot from "../../helpers/GetTicketWbot";
import Ticket from "../../models/Ticket";
import mime from "mime-types";
import formatBody from "../../helpers/Mustache";

interface Request {
  media: Express.Multer.File;
  ticket: Ticket;
  body?: string;
  isForwarded?: boolean;  
}

const publicFolder = path.resolve(__dirname, "..", "..", "..", "public");

const processAudio = async (audio: string): Promise<string> => {
  const outputAudio = `${publicFolder}/${new Date().getTime()}.mp3`;
  // Usar configuración específica para WhatsApp Web - MP3 con parámetros optimizados
  const command = `"${ffmpegPath.path}" -i "${audio}" -vn -acodec libmp3lame -ar 16000 -ac 1 -ab 32k -f mp3 "${outputAudio}" -y`;
  
  console.log("🎵 Processing audio command:", command);
  
  return new Promise((resolve, reject) => {
    exec(command, (error, _stdout, _stderr) => {
      if (error) {
        console.error("❌ FFmpeg error:", error.message);
        console.error("❌ FFmpeg stderr:", _stderr);
        reject(error);
        return;
      }
      
      try {
        fs.unlinkSync(audio);
        console.log("✅ Audio processed successfully (MP3 for WhatsApp):", outputAudio);
        resolve(outputAudio);
      } catch (unlinkError) {
        console.warn("⚠️ Could not delete temp file:", audio);
        resolve(outputAudio);
      }
    });
  });
};

const processAudioFile = async (audio: string): Promise<string> => {
  const outputAudio = `${publicFolder}/${new Date().getTime()}.mp3`;
  const command = `"${ffmpegPath.path}" -i "${audio}" -vn -acodec libmp3lame -ar 44100 -ac 1 -ab 128k "${outputAudio}" -y`;
  
  console.log("🎵 Processing audio file command:", command);
  
  return new Promise((resolve, reject) => {
    exec(command, (error, _stdout, _stderr) => {
      if (error) {
        console.error("❌ FFmpeg error:", error.message);
        console.error("❌ FFmpeg stderr:", _stderr);
        reject(error);
        return;
      }
      
      try {
        fs.unlinkSync(audio);
        console.log("✅ Audio file processed successfully:", outputAudio);
        resolve(outputAudio);
      } catch (unlinkError) {
        console.warn("⚠️ Could not delete temp file:", audio);
        resolve(outputAudio);
      }
    });
  });
};

export const getMessageOptions = async (
  fileName: string,
  pathMedia: string,
  body?: string
): Promise<MessageMedia | null> => {
  try {
    const mimeType = mime.lookup(pathMedia);
    
    if (!mimeType) {
      throw new Error("Invalid mimetype");
    }

    // Crear MessageMedia desde el archivo
    const media = MessageMedia.fromFilePath(pathMedia);
    media.filename = fileName;
    
    return media;
  } catch (e) {
    Sentry.captureException(e);
    console.log(e);
    return null;
  }
};

const SendWhatsAppMedia = async ({
  media,
  ticket,
  body,
  isForwarded = false
}: Request): Promise<WWebMessage> => {
  try {
    console.log("🎬 SendWhatsAppMedia called with:", {
      filename: media.originalname,
      mimetype: media.mimetype,
      size: media.size,
      ticketId: ticket.id,
      contactNumber: ticket.contact?.number
    });
    
    const wbot = await GetTicketWbot(ticket);

    // Formatear número de contacto para whatsapp-web.js
    const chatId = `${ticket.contact.number}@${ticket.isGroup ? "g.us" : "c.us"}`;
    
    // Obtener el chat
    const chat = await wbot.getChatById(chatId);
    
    const pathMedia = media.path;
    const typeMessage = media.mimetype.split("/")[0];
    const bodyMessage = formatBody(body, ticket.contact);

    let messageMedia: MessageMedia;
    let sentMessage: WWebMessage;

    if (typeMessage === "audio") {
      const isVoiceMessage = media.originalname.includes("audio-record-site");
      
      console.log("🎤 Processing audio file:", {
        isVoiceMessage,
        filename: media.originalname,
        mimetype: media.mimetype,
        size: media.size,
        path: media.path
      });
      
      // Validar que el archivo existe
      if (!fs.existsSync(pathMedia)) {
        throw new Error(`Audio file not found: ${pathMedia}`);
      }
      
      if (isVoiceMessage) {
        // Procesar audio para mensaje de voz
        const convertedAudio = await processAudio(media.path);
        messageMedia = MessageMedia.fromFilePath(convertedAudio);
        
        // Para mensajes de voz, WhatsApp Web requiere configuración específica
        messageMedia.filename = null; // WhatsApp Web no acepta filename para voice messages
        messageMedia.mimetype = "audio/mpeg"; // Forzar MIME type correcto para MP3
        
        console.log("🎤 Sending voice message with media:", {
          mimetype: messageMedia.mimetype,
          hasData: !!messageMedia.data,
          filename: messageMedia.filename
        });
        
        // Enviar como mensaje de voz (PTT)
        sentMessage = await chat.sendMessage(messageMedia, {
          sendAudioAsVoice: true
        });
        
        // Limpiar archivo convertido
        fs.unlinkSync(convertedAudio);
      } else {
        // Procesar archivo de audio normal
        const convertedAudio = await processAudioFile(media.path);
        messageMedia = MessageMedia.fromFilePath(convertedAudio);
        messageMedia.filename = media.originalname;
        
        // Enviar como archivo de audio
        sentMessage = await chat.sendMessage(messageMedia);
        
        // Limpiar archivo convertido
        fs.unlinkSync(convertedAudio);
      }
    } else {
      // Para otros tipos de media (imagen, video, documento)
      messageMedia = MessageMedia.fromFilePath(pathMedia);
      messageMedia.filename = media.originalname;
      
      // Enviar media con caption si existe
      if (bodyMessage) {
        sentMessage = await chat.sendMessage(messageMedia, {
          caption: bodyMessage
        });
      } else {
        sentMessage = await chat.sendMessage(messageMedia);
      }
    }

    // Marcar como reenviado si es necesario
    if (isForwarded && sentMessage) {
      console.log('Media sent as forwarded:', sentMessage.id._serialized);
    }

    // Actualizar último mensaje del ticket
    await ticket.update({ 
      lastMessage: bodyMessage || `📎 ${media.originalname}` 
    });

    // Limpiar archivo original después del envío exitoso
    try {
      if (fs.existsSync(pathMedia)) {
        fs.unlinkSync(pathMedia);
      }
    } catch (unlinkError) {
      console.warn('Error deleting uploaded file:', unlinkError);
    }

    return sentMessage;
  } catch (err) {
    Sentry.captureException(err);
    console.error('❌ Error sending WhatsApp media:', {
      message: err.message,
      stack: err.stack,
      filename: media?.originalname,
      mimetype: media?.mimetype,
      ticketId: ticket?.id
    });
    
    // Limpiar archivos temporales en caso de error
    try {
      if (media?.path && fs.existsSync(media.path)) {
        fs.unlinkSync(media.path);
        console.log("🧹 Cleaned up temporary file after error:", media.path);
      }
    } catch (cleanupErr) {
      console.warn("⚠️ Could not cleanup temp file:", cleanupErr.message);
    }
    
    throw new AppError("ERR_SENDING_WAPP_MSG");
  }
};

export default SendWhatsAppMedia;

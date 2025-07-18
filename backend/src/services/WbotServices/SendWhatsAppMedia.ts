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
  return new Promise((resolve, reject) => {
    exec(
      `${ffmpegPath.path} -i ${audio} -vn -ab 128k -ar 44100 -f ipod ${outputAudio} -y`,
      (error, _stdout, _stderr) => {
        if (error) reject(error);
        fs.unlinkSync(audio);
        resolve(outputAudio);
      }
    );
  });
};

const processAudioFile = async (audio: string): Promise<string> => {
  const outputAudio = `${publicFolder}/${new Date().getTime()}.mp3`;
  return new Promise((resolve, reject) => {
    exec(
      `${ffmpegPath.path} -i ${audio} -vn -ar 44100 -ac 2 -b:a 192k ${outputAudio}`,
      (error, _stdout, _stderr) => {
        if (error) reject(error);
        fs.unlinkSync(audio);
        resolve(outputAudio);
      }
    );
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
      
      if (isVoiceMessage) {
        // Procesar audio para mensaje de voz
        const convertedAudio = await processAudio(media.path);
        messageMedia = MessageMedia.fromFilePath(convertedAudio);
        messageMedia.filename = media.originalname;
        
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
    console.error('Error sending WhatsApp media:', err);
    throw new AppError("ERR_SENDING_WAPP_MSG");
  }
};

export default SendWhatsAppMedia;

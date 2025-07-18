import { Message as WWebMessage } from 'whatsapp-web.js';
import Ticket from "../models/Ticket";
import GetTicketWbot from "./GetTicketWbot";
import AppError from "../errors/AppError";
import GetMessageService from "../services/MessageServices/GetMessagesService";
import Message from "../models/Message";
import { ExtendedMessage } from "../libs/wwebjs-types";

export const GetWbotMessage = async (
  ticket: Ticket,
  messageId: string
): Promise<ExtendedMessage | Message> => {
  const wbot = await GetTicketWbot(ticket);

  const fetchWbotMessagesGradually = async (): Promise<
    ExtendedMessage | Message | null | undefined
  > => {
    try {
      // Primero intentar obtener desde la base de datos
      const msgFound = await GetMessageService({
        id: messageId
      });

      if (msgFound) {
        return msgFound;
      }

      // Si no se encuentra en la BD, intentar obtener desde WhatsApp Web
      // Obtener chats recientes y buscar el mensaje
      const chats = await wbot.getChats();
      
      for (const chat of chats.slice(0, 10)) { // Buscar en los últimos 10 chats
        try {
          const messages = await chat.fetchMessages({ limit: 50 });
          const foundMessage = messages.find(msg => 
            msg.id._serialized === messageId || 
            msg.id.id === messageId
          );
          
          if (foundMessage) {
            return foundMessage as ExtendedMessage;
          }
        } catch (chatError) {
          // Continuar con el siguiente chat si hay error
          continue;
        }
      }

      return null;
    } catch (error) {
      console.error('Error fetching message:', error);
      return null;
    }
  };

  try {
    const msgFound = await fetchWbotMessagesGradually();

    if (!msgFound) {
      throw new Error("Cannot found message within recent messages");
    }

    return msgFound;
  } catch (err) {
    throw new AppError("ERR_FETCH_WAPP_MSG");
  }
};

export default GetWbotMessage;

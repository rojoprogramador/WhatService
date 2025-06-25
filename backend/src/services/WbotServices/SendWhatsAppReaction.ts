import { Message as WWebMessage } from 'whatsapp-web.js';
import * as Sentry from "@sentry/node";
import AppError from "../../errors/AppError";
import GetTicketWbot from "../../helpers/GetTicketWbot";
import Message from "../../models/Message";
import Ticket from "../../models/Ticket";

interface ReactionRequest {
  messageId: string;
  ticket: Ticket;
  reactionType: string; // Ejemplo: '❤️', '👍', '😂', etc.
}

const SendWhatsAppReaction = async ({
  messageId,
  ticket,
  reactionType
}: ReactionRequest): Promise<WWebMessage | boolean> => {
  const wbot = await GetTicketWbot(ticket);

  // Formatear número de contacto para whatsapp-web.js
  const chatId = `${ticket.contact.number}@${ticket.isGroup ? "g.us" : "c.us"}`;

  try {
    const messageToReact = await Message.findOne({
      where: {
        id: messageId
      }
    });

    if (!messageToReact) {
      throw new AppError("Message not found");
    }

    if (!reactionType) {
      throw new AppError("ReactionType not found");
    }

    // Obtener el chat
    const chat = await wbot.getChatById(chatId);
    
    // Buscar el mensaje en WhatsApp usando el wid almacenado
    const messages = await chat.fetchMessages({ limit: 100 });
    const targetMessage = messages.find(msg => 
      msg.id._serialized === messageToReact.wid ||
      msg.body === messageToReact.body
    );

    if (!targetMessage) {
      throw new AppError("Message not found in WhatsApp chat");
    }

    // Enviar reacción al mensaje
    const reaction = await targetMessage.react(reactionType);

    console.log(`Reaction ${reactionType} sent to message ${targetMessage.id._serialized}`);

    return reaction;
  } catch (err) {
    Sentry.captureException(err);
    console.error('Error sending WhatsApp reaction:', err);
    throw new AppError("ERR_SENDING_WAPP_REACTION");
  }
};

export default SendWhatsAppReaction;

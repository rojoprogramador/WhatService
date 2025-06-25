import * as Sentry from "@sentry/node";
import { Message as WWebMessage } from 'whatsapp-web.js';
import AppError from "../../errors/AppError";
import GetTicketWbot from "../../helpers/GetTicketWbot";
import Message from "../../models/Message";
import Ticket from "../../models/Ticket";
import formatBody from "../../helpers/Mustache";
import { ExtendedMessage } from "../../libs/wwebjs-types";

interface Request {
  body: string;
  ticket: Ticket;
  quotedMsg?: Message;
  isForwarded?: boolean;  
}

const SendWhatsAppMessage = async ({
  body,
  ticket,
  quotedMsg,
  isForwarded = false
}: Request): Promise<WWebMessage> => {
  const wbot = await GetTicketWbot(ticket);

  // Formatear número de contacto para whatsapp-web.js
  const chatId = `${ticket.contact.number}@${ticket.isGroup ? "g.us" : "c.us"}`;

  try {
    // Obtener el chat
    const chat = await wbot.getChatById(chatId);
    
    // Formatear el mensaje
    const formattedBody = formatBody(body, ticket.contact);
    
    let sentMessage: WWebMessage;

    // Si hay mensaje citado, enviarlo con quote
    if (quotedMsg) {
      try {
        const chatMessages = await Message.findOne({
          where: { id: quotedMsg.id }
        });

        if (chatMessages) {
          // Intentar encontrar el mensaje original en WhatsApp
          const messages = await chat.fetchMessages({ limit: 100 });
          const originalMessage = messages.find(msg => 
            msg.id._serialized === chatMessages.wid ||
            msg.body === chatMessages.body
          );

          if (originalMessage) {
            // Enviar con cita
            sentMessage = await chat.sendMessage(formattedBody, {
              quotedMessageId: originalMessage.id._serialized
            });
          } else {
            // Si no encuentra el mensaje original, enviar normal
            sentMessage = await chat.sendMessage(formattedBody);
          }
        } else {
          sentMessage = await chat.sendMessage(formattedBody);
        }
      } catch (quoteError) {
        // Si hay error con la cita, enviar mensaje normal
        console.warn('Error sending quoted message, sending normal message:', quoteError);
        sentMessage = await chat.sendMessage(formattedBody);
      }
    } else {
      // Enviar mensaje normal
      sentMessage = await chat.sendMessage(formattedBody);
    }

    // Marcar como reenviado si es necesario
    if (isForwarded && sentMessage) {
      // WhatsApp Web JS no tiene API directa para marcar como forwarded
      // pero podemos agregar un indicador en el mensaje si es necesario
      console.log('Message sent as forwarded:', sentMessage.id._serialized);
    }

    // Actualizar último mensaje del ticket
    await ticket.update({ lastMessage: formattedBody });
    
    return sentMessage;

  } catch (err) {
    Sentry.captureException(err);
    console.error('Error sending WhatsApp message:', err);
    throw new AppError("ERR_SENDING_WAPP_MSG");
  }
};

export default SendWhatsAppMessage;

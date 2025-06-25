import { Message as WWebMessage } from 'whatsapp-web.js';
import AppError from "../../errors/AppError";
import GetTicketWbot from "../../helpers/GetTicketWbot";
import GetWbotMessage from "../../helpers/GetWbotMessage";
import Message from "../../models/Message";
import Ticket from "../../models/Ticket";
import { ExtendedClient, ExtendedMessage } from "../../libs/wwebjs-types";

const DeleteWhatsAppMessage = async (messageId: string): Promise<Message> => {
  const message = await Message.findByPk(messageId, {
    include: [
      {
        model: Ticket,
        as: "ticket",
        include: ["contact"]
      }
    ]
  });

  if (!message) {
    throw new AppError("No message found with this ID.");
  }

  const { ticket } = message;

  const messageToDelete = await GetWbotMessage(ticket, messageId);

  try {
    const wbot = await GetTicketWbot(ticket) as ExtendedClient;
    
    // Si el mensaje es una instancia de whatsapp-web.js Message
    if (messageToDelete && typeof (messageToDelete as WWebMessage).delete === 'function') {
      const wwebMessage = messageToDelete as WWebMessage;
      
      // Usar el método delete nativo de whatsapp-web.js
      await wwebMessage.delete(true); // true para eliminar para todos
    } else {
      // Si el mensaje viene de la BD, intentar encontrarlo en WhatsApp y eliminarlo
      const chatId = `${ticket.contact.number}@${ticket.isGroup ? "g.us" : "c.us"}`;
      const chat = await wbot.getChatById(chatId);
      
      // Obtener mensajes recientes del chat
      const messages = await chat.fetchMessages({ limit: 100 });
      
      // Buscar el mensaje por ID
      const wwebMessage = messages.find(msg => 
        msg.id._serialized === messageId || 
        msg.id.id === messageId ||
        msg.id._serialized === message.messageId ||
        msg.id.id === message.messageId
      );
      
      if (wwebMessage) {
        await wwebMessage.delete(true); // true para eliminar para todos
      } else {
        throw new Error("Message not found in WhatsApp chat");
      }
    }

  } catch (err) {
    console.error("Error deleting WhatsApp message:", err);
    throw new AppError("ERR_DELETE_WAPP_MSG");
  }
  
  // Marcar como eliminado en la base de datos
  await message.update({ isDeleted: true });

  return message;
};

export default DeleteWhatsAppMessage;
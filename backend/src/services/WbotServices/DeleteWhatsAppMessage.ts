import { Client } from "whatsapp-web.js";
import AppError from "../../errors/AppError";
import GetTicketWbot from "../../helpers/GetTicketWbot";
import Message from "../../models/Message";
import Ticket from "../../models/Ticket";

type Session = Client & {
  id?: number;
};

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

  try {
    const wbot = await GetTicketWbot(ticket) as Session;
    
    // En whatsapp-web.js, buscamos el mensaje por su ID serializado
    const chat = await wbot.getChatById(message.remoteJid);
    const messages = await chat.fetchMessages({ limit: 100 });
    
    // Buscar el mensaje específico
    const messageToDelete = messages.find(msg => msg.id._serialized === message.id);
    
    if (messageToDelete && messageToDelete.fromMe) {
      // Solo podemos eliminar mensajes que enviamos nosotros
      await messageToDelete.delete(true); // true = delete for everyone
    } else {
      throw new AppError("Cannot delete message: not found or not sent by us");
    }

  } catch (err) {
    console.error("Error deleting WhatsApp message:", err);
    throw new AppError("ERR_DELETE_WAPP_MSG");
  }
  
  await message.update({ isDeleted: true });

  return message;
};

export default DeleteWhatsAppMessage;

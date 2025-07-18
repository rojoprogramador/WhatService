import AppError from "../../errors/AppError";
import GetTicketWbot from "../../helpers/GetTicketWbot";
import Message from "../../models/Message";
import Ticket from "../../models/Ticket";
import formatBody from "../../helpers/Mustache";

interface Request {
  messageId: string;
  body: string;
}

const EditWhatsAppMessage = async ({
  messageId,
  body,
}: Request): Promise<{ ticket: Ticket , message: Message}> => {
  
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
  const wbot = await GetTicketWbot(ticket);
  
  // Formatear número de contacto para whatsapp-web.js
  const chatId = `${ticket.contact.number}@${ticket.isGroup ? "g.us" : "c.us"}`;
  
  try {
    // Obtener el chat
    const chat = await wbot.getChatById(chatId);
    
    // Buscar el mensaje en WhatsApp usando el wid almacenado
    const messages = await chat.fetchMessages({ limit: 100 });
    const targetMessage = messages.find(msg => 
      msg.id._serialized === (message as any).wid ||
      msg.body === message.body
    );

    if (!targetMessage) {
      throw new AppError("Message not found in WhatsApp chat for editing");
    }

    // Verificar que el mensaje es nuestro (solo podemos editar nuestros mensajes)
    if (!targetMessage.fromMe) {
      throw new AppError("Cannot edit messages that are not from me");
    }

    // Editar el mensaje
    await targetMessage.edit(body);

    // Actualizar el mensaje en la base de datos
    await message.update({ 
      body: body, 
      isEdited: true 
    });
	
    return { ticket: message.ticket , message: message };
  } catch (err) {
    console.error('Error editing WhatsApp message:', err);
    
    // Si el error es porque no se puede editar el mensaje, dar un mensaje más específico
    if (err.message?.includes('edit')) {
      throw new AppError("This message cannot be edited (too old or not from you)");
    }
    
    throw new AppError("ERR_EDITING_WAPP_MSG");
  }
};

export default EditWhatsAppMessage;
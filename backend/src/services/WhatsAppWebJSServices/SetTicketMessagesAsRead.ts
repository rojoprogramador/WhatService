import { getIO } from "../../libs/socket";
import Message from "../../models/Message";
import Ticket from "../../models/Ticket";
import { logger } from "../../utils/logger";
import GetTicketWbot from "../../helpers/GetTicketWbot";
import { ExtendedClient } from "../../libs/wwebjs-types";

const SetTicketMessagesAsRead = async (ticket: Ticket): Promise<void> => {
  await ticket.update({ unreadMessages: 0 });

  try {
    const wbot = await GetTicketWbot(ticket) as ExtendedClient;

    const getJsonMessage = await Message.findAll({
      where: {
        ticketId: ticket.id,
        fromMe: false,
        read: false
      },
      order: [["createdAt", "DESC"]]
    });

    if (getJsonMessage.length > 0) {
      try {
        // Formatear chatId para whatsapp-web.js
        const chatId = `${ticket.contact.number}@${
          ticket.isGroup ? "g.us" : "c.us"
        }`;

        // Obtener el chat
        const chat = await wbot.getChatById(chatId);
        
        if (chat) {
          // Usar sendSeen para marcar como leído
          await chat.sendSeen();
          
          logger.info(`Messages marked as read for chat: ${chatId}`);
        }
      } catch (chatError) {
        logger.warn(`Could not mark chat as read: ${chatError}`);
        
        // Método alternativo: intentar con el método individual
        try {
          const lastMessage = getJsonMessage[0];
          if (lastMessage.dataJson) {
            const messageData = JSON.parse(JSON.stringify(lastMessage.dataJson));
            
            // Si tenemos datos del mensaje, intentar marcarlo como leído
            const chatId = `${ticket.contact.number}@${
              ticket.isGroup ? "g.us" : "c.us"
            }`;
            
            const chat = await wbot.getChatById(chatId);
            if (chat) {
              await chat.sendSeen();
            }
          }
        } catch (fallbackError) {
          logger.warn(`Fallback method also failed: ${fallbackError}`);
        }
      }
    }

    // Actualizar mensajes como leídos en la base de datos
    await Message.update(
      { read: true },
      {
        where: {
          ticketId: ticket.id,
          read: false
        }
      }
    );
  } catch (err) {
    logger.warn(
      `Could not mark messages as read. Maybe WhatsApp session disconnected? Err: ${err}`
    );
  }

  // Emitir evento de actualización
  const io = getIO();
  io.to(`company-${ticket.companyId}-mainchannel`).emit(`company-${ticket.companyId}-ticket`, {
    action: "updateUnread",
    ticketId: ticket.id
  });
};

export default SetTicketMessagesAsRead;
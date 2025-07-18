import { getIO } from "../../libs/socket";
import Message from "../../models/Message";
import Ticket from "../../models/Ticket";
import Whatsapp from "../../models/Whatsapp";

interface MessageData {
  id: string;
  ticketId: number;
  body: string;
  contactId?: number;
  fromMe?: boolean;
  read?: boolean;
  mediaType?: string;
  mediaUrl?: string;
  ack?: number;
  queueId?: number;
  isForwarded?: boolean;  
}
interface Request {
  messageData: MessageData;
  companyId: number;
}

const CreateMessageService = async ({
  messageData,
  companyId
}: Request): Promise<Message> => {
  try {
    console.log('💾 Creating message in database:', {
      id: messageData.id,
      ticketId: messageData.ticketId,
      fromMe: messageData.fromMe,
      companyId
    });

    // Validate required fields
    if (!messageData.id || !messageData.ticketId || !messageData.body) {
      throw new Error("ERR_INVALID_MESSAGE_DATA");
    }

    // Upsert the message
    const upsertResult = await Message.upsert({ ...messageData, companyId });
    console.log('💾 Message upsert completed');

    // Fetch the complete message with associations
    const fullMessage = await Message.findByPk(messageData.id, {
      include: [
        "contact",
        {
          model: Ticket,
          as: "ticket",
          include: [
            "contact",
            "queue",
            {
              model: Whatsapp,
              as: "whatsapp",
              attributes: ["name"]
            }
          ]
        },
        {
          model: Message,
          as: "quotedMsg",
          include: ["contact"]
        }
      ]
    });

    if (!fullMessage) {
      throw new Error("ERR_MESSAGE_NOT_SAVED");
    }

    // Update queue if needed
    if (fullMessage.ticket.queueId !== null && fullMessage.queueId === null) {
      await fullMessage.update({ queueId: fullMessage.ticket.queueId });
    }

    // Only emit socket event if message was successfully saved
    const io = getIO();
    console.log('📤 Emitting socket event company-' + companyId + '-appMessage for message:', fullMessage.id, 'fromMe:', fullMessage.fromMe);
    
    const socketData = {
      action: "create",
      message: fullMessage,
      ticket: fullMessage.ticket,
      contact: fullMessage.ticket.contact
    };
    
    console.log('📤 Socket event data:', {
      eventName: `company-${companyId}-appMessage`,
      messageId: fullMessage.id,
      ticketId: fullMessage.ticketId,
      fromMe: fullMessage.fromMe,
      messageBody: fullMessage.body?.substring(0, 50),
      rooms: [
        fullMessage.ticketId.toString(),
        `company-${companyId}-${fullMessage.ticket.status}`,
        `company-${companyId}-notification`
      ]
    });
    
    // Emit to multiple rooms
    io.to(fullMessage.ticketId.toString())
      .to(`company-${companyId}-${fullMessage.ticket.status}`)
      .to(`company-${companyId}-notification`)
      .to(`queue-${fullMessage.ticket.queueId}-${fullMessage.ticket.status}`)
      .to(`queue-${fullMessage.ticket.queueId}-notification`)
      .emit(`company-${companyId}-appMessage`, socketData);
      
    console.log('✅ Socket event emitted successfully');

    console.log('✅ Message and socket event completed successfully');
    return fullMessage;
    
  } catch (error) {
    console.error('❌ Error in CreateMessageService:', error);
    throw new Error(`ERR_CREATING_MESSAGE: ${error.message}`);
  }
};

export default CreateMessageService;

import { Client } from "whatsapp-web.js";
import * as Sentry from "@sentry/node";

import { Op } from "sequelize";
// import { getIO } from "../../libs/socket";
import { Store } from "../../libs/store";
import Contact from "../../models/Contact";
import Setting from "../../models/Setting";
import Ticket from "../../models/Ticket";
import Whatsapp from "../../models/Whatsapp";
import { logger } from "../../utils/logger";
// import createOrUpdateBaileysService from "../BaileysServices/CreateOrUpdateBaileysService"; // No longer needed for whatsapp-web.js
import CreateMessageService from "../MessageServices/CreateMessageService";

type Session = Client & {
  id?: number;
  store?: Store;
};

interface IContact {
  contacts: any[];
}

const wbotMonitor = async (
  wbot: Session,
  whatsapp: Whatsapp,
  companyId: number
): Promise<void> => {
  try {
    // Escuchar eventos de llamadas con whatsapp-web.js
    wbot.on('call', async (call) => {
      const sendMsgCall = await Setting.findOne({
        where: { key: "call", companyId },
      });

      if (sendMsgCall?.value === "disabled") {
        const from = call.from.replace('@c.us', '');
        
        // Rechazar la llamada
        await call.reject();
        
        // Enviar mensaje automático
        const { getLocalizedMessage } = await import("../../utils/i18n");
        const automaticMessage = await getLocalizedMessage("CALL_DISABLED_MESSAGE", companyId);
        await wbot.sendMessage(call.from, automaticMessage);

        const number = from.replace(/\D/g, "");

        const contact = await Contact.findOne({
          where: { companyId, number },
        });

        if (!contact) return;

        const ticket = await Ticket.findOne({
          where: {
            contactId: contact.id,
            whatsappId: wbot.id,
            companyId
          },
        });
        
        // se não existir o ticket não faz nada.
        if (!ticket) return;

        const date = new Date();
        const hours = date.getHours();
        const minutes = date.getMinutes();

        const callLogMessage = await getLocalizedMessage("CALL_LOG_MESSAGE", companyId, {
          time: `${hours}:${minutes}`
        });
        const body = callLogMessage;
        const messageData = {
          id: call.id || `call_${Date.now()}`,
          ticketId: ticket.id,
          contactId: contact.id,
          body,
          fromMe: false,
          mediaType: "call_log",
          read: true,
          quotedMsgId: null,
          ack: 1,
        };

        await ticket.update({
          lastMessage: body,
        });

        if(ticket.status === "closed") {
          await ticket.update({
            status: "pending",
          });
        }

        return CreateMessageService({ messageData, companyId: companyId });
      }
    });

    // Escuchar cambios en contactos
    wbot.on('contact_changed', async (contact) => {
      // Para whatsapp-web.js no necesitamos el servicio de Baileys
      // Los contactos se manejan directamente
      try {
        // Opcional: logging o manejo de contactos actualizado
        logger.info(`Contact changed: ${contact.id._serialized}`);
      } catch (err) {
        logger.error('Error handling contact change:', err);
      }
    });

  } catch (err) {
    Sentry.captureException(err);
    logger.error(err);
  }
};

export default wbotMonitor;

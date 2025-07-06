import { getWbot, initWASocket } from "../../libs/wbot";
import Whatsapp from "../../models/Whatsapp";
import { wbotMessageListener } from "./wbotMessageListener";
import { getIO } from "../../libs/socket";
import wbotMonitor from "./wbotMonitor";
import { logger } from "../../utils/logger";
import * as Sentry from "@sentry/node";

export const StartWhatsAppSession = async (
  whatsapp: Whatsapp,
  companyId: number
): Promise<void> => {
  await whatsapp.update({ status: "OPENING" });

  const io = getIO();
  io.emit(`company-${companyId}-whatsappSession`, {
    action: "update",
    session: whatsapp
  });


  try {
    console.log(`🚀 Starting WhatsApp session for company ${companyId}, whatsapp ${whatsapp.id}`);
    const wbot = await initWASocket(whatsapp);

    console.log(`📱 WhatsApp client ready for ${whatsapp.name}, registering message listeners`);
    console.log(`📊 Client state:`, {
      id: wbot.id,
      state: wbot.getState ? wbot.getState() : 'unknown',
      isReady: wbot.info ? 'has info' : 'no info'
    });

    wbotMessageListener(wbot, companyId);
    console.log(`✅ Message listeners registered for WhatsApp ${whatsapp.id}`);
    
    await wbotMonitor(wbot, whatsapp, companyId);
  } catch (err) {
    console.error(`❌ Error starting WhatsApp session ${whatsapp.id}:`, err);
    Sentry.captureException(err);
    logger.error(err);
  }
};

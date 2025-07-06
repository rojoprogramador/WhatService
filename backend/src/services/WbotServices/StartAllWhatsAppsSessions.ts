import ListWhatsAppsService from "../WhatsappService/ListWhatsAppsService";
import { StartWhatsAppSession } from "./StartWhatsAppSession";
import * as Sentry from "@sentry/node";

export const StartAllWhatsAppsSessions = async (
  companyId: number
): Promise<void> => {
  try {
    console.log(`🏢 Starting all WhatsApp sessions for company ${companyId}`);
    
    const whatsapps = await ListWhatsAppsService({ companyId });
    console.log(`📱 Found ${whatsapps.length} WhatsApp instances for company ${companyId}`);
    
    if (whatsapps.length > 0) {
      whatsapps.forEach(whatsapp => {
        console.log(`🚀 Starting WhatsApp session: ${whatsapp.name} (ID: ${whatsapp.id}, Status: ${whatsapp.status})`);
        StartWhatsAppSession(whatsapp, companyId);
      });
    } else {
      console.log(`⚠️ No WhatsApp instances found for company ${companyId}`);
    }
  } catch (e) {
    console.error(`❌ Error starting WhatsApp sessions for company ${companyId}:`, e);
    Sentry.captureException(e);
  }
};

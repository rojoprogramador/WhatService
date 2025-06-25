import AppError from "../../errors/AppError";
import GetDefaultWhatsApp from "../../helpers/GetDefaultWhatsApp";
import { getWbot } from "../../libs/wbot";
import { ExtendedClient } from "../../libs/wwebjs-types";

const CheckIsValidContact = async (
  number: string,
  companyId: number
): Promise<void> => {
  const defaultWhatsapp = await GetDefaultWhatsApp(companyId);
  const wbot = getWbot(defaultWhatsapp.id) as ExtendedClient;

  try {
    // Formatear número para whatsapp-web.js
    let chatId = number;
    if (!number.includes('@')) {
      chatId = `${number}@c.us`;
    }
    
    // Usar getNumberId para verificar si el número es válido en WhatsApp
    const numberId = await wbot.getNumberId(chatId);
    
    if (!numberId) {
      throw new AppError("invalidNumber");
    }
  } catch (err: any) {
    if (err.message === "invalidNumber") {
      throw new AppError("ERR_WAPP_INVALID_CONTACT");
    }
    throw new AppError("ERR_WAPP_CHECK_CONTACT");
  }
};

export default CheckIsValidContact;
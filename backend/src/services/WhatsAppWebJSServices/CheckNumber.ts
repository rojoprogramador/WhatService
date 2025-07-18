import GetDefaultWhatsApp from "../../helpers/GetDefaultWhatsApp";
import { getWbot } from "../../libs/wbot";
import { ExtendedClient } from "../../libs/wwebjs-types";
import { logger } from "../../utils/logger";

interface IOnWhatsapp {
  jid: string;
  exists: boolean;
}

const checker = async (number: string, wbot: ExtendedClient) => {
  try {
    // Formatear número para whatsapp-web.js
    const chatId = `${number}@c.us`;
    
    // Usar getNumberId para verificar si el número existe en WhatsApp
    const numberId = await wbot.getNumberId(chatId);
    
    const validNumber: IOnWhatsapp = {
      jid: chatId,
      exists: !!numberId // numberId será null si no existe
    };

    logger.info(`Number check result: ${JSON.stringify(validNumber)}`);

    return validNumber;
  } catch (error) {
    logger.error(`Error checking number ${number}: ${error}`);
    
    // Si hay error, asumimos que el número no existe
    return {
      jid: `${number}@c.us`,
      exists: false
    };
  }
};

const CheckContactNumber = async (
  number: string,
  companyId: number
): Promise<IOnWhatsapp> => {
  const defaultWhatsapp = await GetDefaultWhatsApp(companyId);
  const wbot = getWbot(defaultWhatsapp.id) as ExtendedClient;
  
  const isNumberExit = await checker(number, wbot);

  if (!isNumberExit.exists) {
    throw new Error("ERR_CHECK_NUMBER");
  }
  
  return isNumberExit;
};

export default CheckContactNumber;
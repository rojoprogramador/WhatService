import GetDefaultWhatsApp from "../../helpers/GetDefaultWhatsApp";
import GetTicketWbot from "../../helpers/GetTicketWbot";
import { ExtendedClient } from "../../libs/wwebjs-types";
import { getWbot } from "../../libs/wbot";

const GetProfilePicUrl = async (
  number: string,
  companyId: number
): Promise<string> => {
  const defaultWhatsapp = await GetDefaultWhatsApp(companyId);
  const wbot = getWbot(defaultWhatsapp.id) as ExtendedClient;

  let profilePicUrl: string;
  try {
    // Formatear número para whatsapp-web.js
    const chatId = `${number}@c.us`;
    
    // Obtener el contacto
    const contact = await wbot.getContactById(chatId);
    
    // Intentar obtener la URL de la foto de perfil
    profilePicUrl = await contact.getProfilePicUrl();
    
    // Si no hay foto de perfil, el método puede retornar undefined
    if (!profilePicUrl) {
      profilePicUrl = `${process.env.FRONTEND_URL}/nopicture.png`;
    }
  } catch (error) {
    // Si hay error (contacto no existe, sin foto, etc.), usar imagen por defecto
    profilePicUrl = `${process.env.FRONTEND_URL}/nopicture.png`;
  }

  return profilePicUrl;
};

export default GetProfilePicUrl;
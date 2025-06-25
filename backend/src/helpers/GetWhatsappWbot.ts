import { getWbot } from "../libs/wbot";
import Whatsapp from "../models/Whatsapp";
import { ExtendedClient } from "../libs/wwebjs-types";

const GetWhatsappWbot = async (whatsapp: Whatsapp): Promise<ExtendedClient> => {
  const wbot = getWbot(whatsapp.id);
  return wbot;
};

export default GetWhatsappWbot;

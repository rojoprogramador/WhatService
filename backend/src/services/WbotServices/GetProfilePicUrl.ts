import GetDefaultWhatsApp from "../../helpers/GetDefaultWhatsApp";
import { getWbot } from "../../libs/wbot";

const GetProfilePicUrl = async (
  number: string,
  companyId: number
): Promise<string> => {
  const defaultWhatsapp = await GetDefaultWhatsApp(companyId);

  const wbot = getWbot(defaultWhatsapp.id);

  let profilePicUrl: string;
  try {
    const contact = await wbot.getContactById(`${number}@c.us`);
    profilePicUrl = await contact.getProfilePicUrl();
  } catch (error) {
    profilePicUrl = `${process.env.FRONTEND_URL}/nopicture.png`;
  }

  return profilePicUrl;
};

export default GetProfilePicUrl;

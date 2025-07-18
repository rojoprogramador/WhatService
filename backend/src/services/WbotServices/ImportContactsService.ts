import * as Sentry from "@sentry/node";
import GetDefaultWhatsApp from "../../helpers/GetDefaultWhatsApp";
import { getWbot } from "../../libs/wbot";
import Contact from "../../models/Contact";
import { logger } from "../../utils/logger";
// import ShowBaileysService from "../BaileysServices/ShowBaileysService";
import CreateContactService from "../ContactServices/CreateContactService";
import { isString, isArray } from "lodash";
import path from "path";
import fs from 'fs';

const ImportContactsService = async (companyId: number): Promise<void> => {
  const defaultWhatsapp = await GetDefaultWhatsApp(companyId);
  const wbot = getWbot(defaultWhatsapp.id);

  let phoneContacts;

  try {
    // Obtener contactos desde whatsapp-web.js
    const contacts = await wbot.getContacts();
    phoneContacts = contacts.map(contact => ({
      id: contact.id._serialized,
      name: contact.name || contact.pushname,
      notify: contact.pushname
    }));

    const publicFolder = path.resolve(__dirname, "..", "..", "..", "public");
    const beforeFilePath = path.join(publicFolder, 'contatos_antes.txt');
    fs.writeFile(beforeFilePath, JSON.stringify(phoneContacts, null, 2), (err) => {
      if (err) {
        logger.error(`Failed to write contacts to file: ${err}`);
        throw err;
      }
      console.log('O arquivo contatos_antes.txt foi criado!');
    });

  } catch (err) {
    Sentry.captureException(err);
    logger.error(`Could not get whatsapp contacts from phone. Err: ${err}`);
  }

  const publicFolder = path.resolve(__dirname, "..", "..", "..", "public");
  const afterFilePath = path.join(publicFolder, 'contatos_depois.txt');
  fs.writeFile(afterFilePath, JSON.stringify(phoneContacts, null, 2), (err) => {
    if (err) {
      logger.error(`Failed to write contacts to file: ${err}`);
      throw err;
    }
  });

  const phoneContactsList = isString(phoneContacts)
    ? JSON.parse(phoneContacts)
    : phoneContacts;

  if (isArray(phoneContactsList)) {
    phoneContactsList.forEach(async ({ id, name, notify }) => {
      if (id === "status@broadcast" || id.includes("g.us")) return;
      // Convertir formato de ID de whatsapp-web.js a número
      const number = id.replace(/@c\.us$/, '').replace(/\D/g, "");

      const existingContact = await Contact.findOne({
        where: { number, companyId }
      });

      if (existingContact) {
        // Atualiza o nome do contato existente
        existingContact.name = name || notify;
        await existingContact.save();
      } else {
        // Criar um novo contato
        try {
          await CreateContactService({
            number,
            name: name || notify,
            companyId
          });
        } catch (error) {
          Sentry.captureException(error);
          logger.warn(
            `Could not get whatsapp contacts from phone. Err: ${error}`
          );
        }
      }
    });
  }
};

export default ImportContactsService;

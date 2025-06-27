import * as Sentry from "@sentry/node";
import { writeFile } from "fs";
import { head, isNil } from "lodash";
import path, { join } from "path";
import { promisify } from "util";

import { map_msg } from "../../utils/global";

import {
  Client,
  Message as WhatsAppMessage,
  MessageMedia,
  MessageTypes,
  Events,
  Contact as WhatsAppContact,
  GroupChat,
  MessageId,
  Location,
  List,
  GroupNotification,
  MessageAck,
  WAState
} from "whatsapp-web.js";

import Contact from "../../models/Contact";
import Message from "../../models/Message";
import Ticket from "../../models/Ticket";

import ffmpeg from "fluent-ffmpeg";
import {
  AudioConfig,
  SpeechConfig,
  SpeechSynthesizer
} from "microsoft-cognitiveservices-speech-sdk";
import moment from "moment";
import OpenAI from "openai";
import { Op } from "sequelize";
import { debounce } from "../../helpers/Debounce";
import formatBody from "../../helpers/Mustache";
import { cacheLayer } from "../../libs/cache";
import { getIO } from "../../libs/socket";
import { Store } from "../../libs/store";
import MarkDeleteWhatsAppMessage from "./MarkDeleteWhatsAppMessage";
import Campaign from "../../models/Campaign";
import * as MessageUtils from "./wbotGetMessageFromType";
import CampaignShipping from "../../models/CampaignShipping";
import Queue from "../../models/Queue";
import QueueIntegrations from "../../models/QueueIntegrations";
import QueueOption from "../../models/QueueOption";
import Setting from "../../models/Setting";
import TicketTraking from "../../models/TicketTraking";
import User from "../../models/User";
import UserRating from "../../models/UserRating";
import { campaignQueue, parseToMilliseconds, randomValue } from "../../queues";
import { logger } from "../../utils/logger";
import VerifyCurrentSchedule from "../CompanyService/VerifyCurrentSchedule";
import CreateOrUpdateContactService from "../ContactServices/CreateOrUpdateContactService";
import CreateMessageService from "../MessageServices/CreateMessageService";
import ShowQueueIntegrationService from "../QueueIntegrationServices/ShowQueueIntegrationService";
import FindOrCreateATicketTrakingService from "../TicketServices/FindOrCreateATicketTrakingService";
import FindOrCreateTicketService from "../TicketServices/FindOrCreateTicketService";
import UpdateTicketService from "../TicketServices/UpdateTicketService";
import typebotListener from "../TypebotServices/typebotListener";
import ShowWhatsAppService from "../WhatsappService/ShowWhatsAppService";
import { provider } from "./providers";
import SendWhatsAppMessage from "./SendWhatsAppMessage";
import { getMessageOptions } from "./SendWhatsAppMedia";

const request = require("request");
const fs = require('fs')

type Session = Client & {
  id?: number;
  store?: Store;
};

interface SessionOpenAi extends OpenAI {
  id?: number;
}
const sessionsOpenAi: SessionOpenAi[] = [];

interface ImessageUpsert {
  messages: WhatsAppMessage[];
  type: string;
}

interface IMe {
  name: string;
  id: string;
}

interface IMessage {
  messages: WhatsAppMessage[];
  isLatest: boolean;
}

export const isNumeric = (value: string) => /^-?\d+$/.test(value);

const writeFileAsync = promisify(writeFile);

const multVecardGet = function (param: any) {
  let output = " "

  let name = param.split("\n")[2].replace(";;;", "\n").replace('N:', "").replace(";", "").replace(";", " ").replace(";;", " ").replace("\n", "")
  let inicio = param.split("\n")[4].indexOf('=')
  let fim = param.split("\n")[4].indexOf(':')
  let contact = param.split("\n")[4].substring(inicio + 1, fim).replace(";", "")
  let contactSemWhats = param.split("\n")[4].replace("item1.TEL:", "")

  if (contact != "item1.TEL") {
    output = output + name + ": 📞" + contact + "" + "\n"
  } else
    output = output + name + ": 📞" + contactSemWhats + "" + "\n"
  return output
}

const contactsArrayMessageGet = (msg: WhatsAppMessage) => {
  let vcardMulti = [];
  
  if (msg.type === MessageTypes.CONTACT_CARD_MULTI) {
    const contacts = msg.vCards;
    vcardMulti = contacts || [];
  }

  let bodymessage = ``
  vcardMulti.forEach(function (vcard, indice) {
    bodymessage += vcard + "\n\n" + ""
  })

  let contacts = bodymessage.split("BEGIN:")

  contacts.shift()
  let finalContacts = ""
  for (let contact of contacts) {
    finalContacts = finalContacts + multVecardGet(contact)
  }

  return finalContacts
}

const getTypeMessage = (msg: WhatsAppMessage): string => {
  return msg.type;
};

export function validaCpfCnpj(val) {
  if (val.length == 11) {
    var cpf = val.trim();

    cpf = cpf.replace(/\./g, '');
    cpf = cpf.replace('-', '');
    cpf = cpf.split('');

    var v1 = 0;
    var v2 = 0;
    var aux = false;

    for (var i = 1; cpf.length > i; i++) {
      if (cpf[i - 1] != cpf[i]) {
        aux = true;
      }
    }

    if (aux == false) {
      return false;
    }

    for (var i = 0, p = 10; (cpf.length - 2) > i; i++, p--) {
      v1 += cpf[i] * p;
    }

    v1 = ((v1 * 10) % 11);

    if (v1 == 10) {
      v1 = 0;
    }

    if (v1 != cpf[9]) {
      return false;
    }

    for (var i = 0, p = 11; (cpf.length - 1) > i; i++, p--) {
      v2 += cpf[i] * p;
    }

    v2 = ((v2 * 10) % 11);

    if (v2 == 10) {
      v2 = 0;
    }

    if (v2 != cpf[10]) {
      return false;
    } else {
      return true;
    }
  } else if (val.length == 14) {
    var cnpj = val.trim();

    cnpj = cnpj.replace(/\./g, '');
    cnpj = cnpj.replace('-', '');
    cnpj = cnpj.replace('/', '');
    cnpj = cnpj.split('');

    var v1 = 0;
    var v2 = 0;
    var aux = false;

    for (var i = 1; cnpj.length > i; i++) {
      if (cnpj[i - 1] != cnpj[i]) {
        aux = true;
      }
    }

    if (aux == false) {
      return false;
    }

    for (var i = 0, p1 = 5, p2 = 13; (cnpj.length - 2) > i; i++, p1--, p2--) {
      if (p1 >= 2) {
        v1 += cnpj[i] * p1;
      } else {
        v1 += cnpj[i] * p2;
      }
    }

    v1 = (v1 % 11);

    if (v1 < 2) {
      v1 = 0;
    } else {
      v1 = (11 - v1);
    }

    if (v1 != cnpj[12]) {
      return false;
    }

    for (var i = 0, p1 = 6, p2 = 14; (cnpj.length - 1) > i; i++, p1--, p2--) {
      if (p1 >= 2) {
        v2 += cnpj[i] * p1;
      } else {
        v2 += cnpj[i] * p2;
      }
    }

    v2 = (v2 % 11);

    if (v2 < 2) {
      v2 = 0;
    } else {
      v2 = (11 - v2);
    }

    if (v2 != cnpj[13]) {
      return false;
    } else {
      return true;
    }
  } else {
    return false;
  }
}

function timeout(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function sleep(time) {
  await timeout(time);
}

export const sendMessageImage = async (
  wbot: Session,
  contact,
  ticket: Ticket,
  url: string,
  caption: string
) => {

  let sentMessage
  try {
    const media = await MessageMedia.fromUrl(url);
    sentMessage = await wbot.sendMessage(
      `${contact.number}@${ticket.isGroup ? "g.us" : "c.us"}`,
      media,
      {
        caption: caption
      }
    );
  } catch (error) {
    sentMessage = await wbot.sendMessage(
      `${contact.number}@${ticket.isGroup ? "g.us" : "c.us"}`,
      'Não consegui enviar o PDF, tente novamente!'
    );
  }
  verifyMessage(sentMessage, ticket, contact);
};

export const sendMessageLink = async (
  wbot: Session,
  contact: Contact,
  ticket: Ticket,
  url: string,
  caption: string
) => {

  let sentMessage
  try {
    const media = await MessageMedia.fromUrl(url);
    sentMessage = await wbot.sendMessage(
      `${contact.number}@${ticket.isGroup ? "g.us" : "c.us"}`,
      media,
      {
        caption: caption
      }
    );
  } catch (error) {
    sentMessage = await wbot.sendMessage(
      `${contact.number}@${ticket.isGroup ? "g.us" : "c.us"}`,
      'Não consegui enviar o PDF, tente novamente!'
    );
  }
  verifyMessage(sentMessage, ticket, contact);
};

export function makeid(length) {
  var result = '';
  var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

const getBodyButton = (msg: WhatsAppMessage): string => {
  // whatsapp-web.js no tiene MessageTypes.BUTTONS, pero podemos manejar botones de otra forma
  if (msg.fromMe && msg.type === MessageTypes.LIST) {
    return msg.body || (msg as any).selectedRowId || '';
  }

  return '';
};

const msgLocation = (latitude, longitude) => {
  let data = `https://maps.google.com/maps?q=${latitude}%2C${longitude}&z=17&hl=pt-BR|${latitude}, ${longitude} `;
  return data;
};

export const getBodyMessage = (msg: WhatsAppMessage): string | null => {
  try {
    let type = getTypeMessage(msg);

    const types = {
      [MessageTypes.TEXT]: msg.body,
      [MessageTypes.IMAGE]: msg.body || '',
      [MessageTypes.VIDEO]: msg.body || '',
      [MessageTypes.AUDIO]: "Áudio",
      [MessageTypes.VOICE]: "Áudio",
      [MessageTypes.DOCUMENT]: msg.body || (msg as any).filename || '',
      [MessageTypes.STICKER]: "sticker",
      [MessageTypes.LOCATION]: msgLocation(
        (msg as any).location?.latitude,
        (msg as any).location?.longitude
      ),
      [MessageTypes.CONTACT_CARD]: (msg as any).vCards ? (msg as any).vCards[0] : '',
      [MessageTypes.CONTACT_CARD_MULTI]: contactsArrayMessageGet(msg),
      [MessageTypes.LIST]: (msg as any).selectedRowId || msg.body,
      [MessageTypes.POLL_CREATION]: msg.body || '',
      [MessageTypes.REACTION]: "reaction",
      [MessageTypes.GROUP_NOTIFICATION]: '',
      [MessageTypes.UNKNOWN]: ''
    };

    const objKey = Object.keys(types).find(key => key === type);

    if (!objKey) {
      logger.warn(`#### Nao achou o type 152: ${type}
${JSON.stringify(msg)}`);
      Sentry.setExtra("Mensagem", { BodyMsg: msg.body, msg, type });
      Sentry.captureException(
        new Error("Novo Tipo de Mensagem em getTypeMessage")
      );
    }
    return types[type] || msg.body || '';
  } catch (error) {
    Sentry.setExtra("Error getTypeMessage", { msg, BodyMsg: msg.body });
    Sentry.captureException(error);
    console.log(error);
    return msg.body || '';
  }
};

export const getQuotedMessage = (msg: WhatsAppMessage): any => {
  if (msg.hasQuotedMsg) {
    return msg.getQuotedMessage();
  }
  return null;
};

export const getQuotedMessageId = (msg: WhatsAppMessage) => {
  if (msg.hasQuotedMsg) {
    return (msg as any)._data?.quotedMsgId || null;
  }
  return null;
};

const getMeSocket = (wbot: Session): IMe => {
  return {
    id: wbot.info.wid._serialized,
    name: wbot.info.pushname || wbot.info.wid.user
  }
};

const getSenderMessage = (
  msg: WhatsAppMessage,
  wbot: Session
): string => {
  const me = getMeSocket(wbot);
  if (msg.fromMe) return me.id;

  return msg.from || msg.author || '';
};

const getContactMessage = async (msg: WhatsAppMessage, wbot: Session) => {
  const isGroup = msg.from.includes("@g.us");
  const rawNumber = msg.from.replace(/\D/g, "");
  
  if (isGroup) {
    const chat = await msg.getChat() as GroupChat;
    const contact = await msg.getContact();
    return {
      id: msg.author || msg.from,
      name: contact.pushname || contact.name || rawNumber
    };
  } else {
    const contact = await msg.getContact();
    return {
      id: msg.from,
      name: msg.fromMe ? rawNumber : (contact.pushname || contact.name || rawNumber)
    };
  }
};

const downloadMedia = async (msg: WhatsAppMessage) => {
  let media;
  try {
    if (msg.hasMedia) {
      media = await msg.downloadMedia();
    } else {
      throw new Error("Message has no media");
    }
  } catch (err) {
    console.error('Erro ao baixar mídia:', err);
    throw err;
  }

  if (!media) {
    throw new Error("Could not download media");
  }

  let filename = (msg as any).filename || "";
  
  if (!filename) {
    const ext = media.mimetype.split("/")[1].split(";")[0];
    filename = `${new Date().getTime()}.${ext}`;
  } else {
    filename = `${new Date().getTime()}_${filename}`;
  }

  const mediaData = {
    data: Buffer.from(media.data, 'base64'),
    mimetype: media.mimetype,
    filename
  };

  return mediaData;
}

const verifyContact = async (
  msgContact: IMe,
  wbot: Session,
  companyId: number
): Promise<Contact> => {
  let profilePicUrl: string;
  try {
    const contact = await wbot.getContactById(msgContact.id);
    profilePicUrl = await contact.getProfilePicUrl() || `${process.env.FRONTEND_URL}/nopicture.png`;
  } catch (e) {
    Sentry.captureException(e);
    profilePicUrl = `${process.env.FRONTEND_URL}/nopicture.png`;
  }

  const contactData = {
    name: msgContact?.name || msgContact.id.replace(/\D/g, ""),
    number: msgContact.id.replace(/\D/g, ""),
    profilePicUrl,
    isGroup: msgContact.id.includes("@g.us"),
    companyId,
    whatsappId: wbot.id
  };

  const contact = CreateOrUpdateContactService(contactData);

  return contact;
};

const verifyQuotedMessage = async (
  msg: WhatsAppMessage
): Promise<Message | null> => {
  if (!msg.hasQuotedMsg) return null;
  
  const quotedMsgId = getQuotedMessageId(msg);
  if (!quotedMsgId) return null;

  const quotedMsg = await Message.findOne({
    where: { id: quotedMsgId },
  });

  if (!quotedMsg) return null;

  return quotedMsg;
};

const sanitizeName = (name: string): string => {
  let sanitized = name.split(" ")[0];
  sanitized = sanitized.replace(/[^a-zA-Z0-9]/g, "");
  return sanitized.substring(0, 60);
};

const convertTextToSpeechAndSaveToFile = (
  text: string,
  filename: string,
  subscriptionKey: string,
  serviceRegion: string,
  voice: string = "pt-BR-FabioNeural",
  audioToFormat: string = "mp3"
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const speechConfig = SpeechConfig.fromSubscription(
      subscriptionKey,
      serviceRegion
    );
    speechConfig.speechSynthesisVoiceName = voice;
    const audioConfig = AudioConfig.fromAudioFileOutput(`${filename}.wav`);
    const synthesizer = new SpeechSynthesizer(speechConfig, audioConfig);
    synthesizer.speakTextAsync(
      text,
      result => {
        if (result) {
          convertWavToAnotherFormat(
            `${filename}.wav`,
            `${filename}.${audioToFormat}`,
            audioToFormat
          )
            .then(output => {
              resolve();
            })
            .catch(error => {
              console.error(error);
              reject(error);
            });
        } else {
          reject(new Error("No result from synthesizer"));
        }
        synthesizer.close();
      },
      error => {
        console.error(`Error: ${error}`);
        synthesizer.close();
        reject(error);
      }
    );
  });
};

const convertWavToAnotherFormat = (
  inputPath: string,
  outputPath: string,
  toFormat: string
) => {
  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(inputPath)
      .toFormat(toFormat)
      .on("end", () => resolve(outputPath))
      .on("error", (err: { message: any }) =>
        reject(new Error(`Error converting file: ${err.message}`))
      )
      .save(outputPath);
  });
};

const deleteFileSync = (path: string): void => {
  try {
    fs.unlinkSync(path);
  } catch (error) {
    console.error("Erro ao deletar o arquivo:", error);
  }
};

const keepOnlySpecifiedChars = (str: string) => {
  return str.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚâêîôûÂÊÎÔÛãõÃÕçÇ!?.,;:\s]/g, "");
};

const handleOpenAi = async (
  msg: WhatsAppMessage,
  wbot: Session,
  ticket: Ticket,
  contact: Contact,
  mediaSent: Message | undefined
): Promise<void> => {
  const bodyMessage = getBodyMessage(msg);

  if (!bodyMessage) return;

  let { prompt } = await ShowWhatsAppService(wbot.id, ticket.companyId);

  if (!prompt && !isNil(ticket?.queue?.prompt)) {
    prompt = ticket.queue.prompt;
  }

  if (!prompt) return;

  const publicFolder: string = path.resolve(
    __dirname,
    "..",
    "..",
    "..",
    "public"
  );

  let openai: OpenAI | any;
  const openAiIndex = sessionsOpenAi.findIndex(s => s.id === ticket.id);

  if (openAiIndex === -1) {
    openai = new OpenAI({ apiKey: prompt.apiKey });
    openai.id = ticket.id;
    sessionsOpenAi.push(openai);
  } else {
    openai = sessionsOpenAi[openAiIndex];
  }

  const messages = await Message.findAll({
    where: { ticketId: ticket.id },
    order: [["createdAt", "ASC"]],
    limit: prompt.maxMessages
  });

  const promptSystem = `Nas respostas utilize o nome ${sanitizeName(contact.name || "Amigo(a)")} para identificar o cliente.\nSua resposta deve usar no máximo ${prompt.maxTokens}
     tokens e cuide para não truncar o final.\nSempre que possível, mencione o nome dele para ser mais personalizado o atendimento e mais educado. Quando a resposta requer uma transferência para o setor de atendimento, comece sua resposta com 'Ação: Transferir para o setor de atendimento'.\n
  ${prompt.prompt}\n`;

  let messagesOpenAi = [];

  if (msg.type === MessageTypes.TEXT) {
    messagesOpenAi = [];
    messagesOpenAi.push({ role: "system", content: promptSystem });
    for (
      let i = 0;
      i < Math.min(prompt.maxMessages, messages.length);
      i++
    ) {
      const message = messages[i];
      if (message.mediaType === "chat") {
        if (message.fromMe) {
          messagesOpenAi.push({ role: "assistant", content: message.body });
        } else {
          messagesOpenAi.push({ role: "user", content: message.body });
        }
      }
    }
    messagesOpenAi.push({ role: "user", content: bodyMessage! });

    const chat = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-1106",
      messages: messagesOpenAi,
      max_tokens: prompt.maxTokens,
      temperature: prompt.temperature
    });

    let response = chat.choices[0].message?.content;

    if (response?.includes("Ação: Transferir para o setor de atendimento")) {
      await transferQueue(prompt.queueId, ticket, contact);
      response = response
        .replace("Ação: Transferir para o setor de atendimento", "")
        .trim();
    }

    if (prompt.voice === "texto") {
      console.log('responseVoice', response)
      const sentMessage = await wbot.sendMessage(msg.from, response!);
      await verifyMessage(sentMessage, ticket, contact);
    } else {
      const fileNameWithOutExtension = `${ticket.id}_${Date.now()}`;
      convertTextToSpeechAndSaveToFile(
        keepOnlySpecifiedChars(response!),
        `${publicFolder}/${fileNameWithOutExtension}`,
        prompt.voiceKey,
        prompt.voiceRegion,
        prompt.voice,
        "mp3"
      ).then(async () => {
        try {
          const media = MessageMedia.fromFilePath(`${publicFolder}/${fileNameWithOutExtension}.mp3`);
          const sendMessage = await wbot.sendMessage(msg.from, media, { sendAudioAsVoice: true });
          await verifyMediaMessage(sendMessage, ticket, contact);
          deleteFileSync(`${publicFolder}/${fileNameWithOutExtension}.mp3`);
          deleteFileSync(`${publicFolder}/${fileNameWithOutExtension}.wav`);
        } catch (error) {
          console.log(`Erro para responder com audio: ${error}`);
        }
      });
    }
  } else if (msg.type === MessageTypes.AUDIO || msg.type === MessageTypes.VOICE) {
    const mediaUrl = mediaSent!.mediaUrl!.split("/").pop();
    const file = fs.createReadStream(`${publicFolder}/${mediaUrl}`) as any;
    
    const transcription = await openai.audio.transcriptions.create({
      model: "whisper-1",
      file: file,
    });

    messagesOpenAi = [];
    messagesOpenAi.push({ role: "system", content: promptSystem });
    for (
      let i = 0;
      i < Math.min(prompt.maxMessages, messages.length);
      i++
    ) {
      const message = messages[i];
      if (message.mediaType === "chat") {
        if (message.fromMe) {
          messagesOpenAi.push({ role: "assistant", content: message.body });
        } else {
          messagesOpenAi.push({ role: "user", content: message.body });
        }
      }
    }
    messagesOpenAi.push({ role: "user", content: transcription.text });
    const chat = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-1106",
      messages: messagesOpenAi,
      max_tokens: prompt.maxTokens,
      temperature: prompt.temperature
    });
    let response = chat.choices[0].message?.content;

    if (response?.includes("Ação: Transferir para o setor de atendimento")) {
      await transferQueue(prompt.queueId, ticket, contact);
      response = response
        .replace("Ação: Transferir para o setor de atendimento", "")
        .trim();
    }
    if (prompt.voice === "texto") {
      console.log('responseVoice2', response)
      const sentMessage = await wbot.sendMessage(msg.from, `\u200e ${response!}`);
    } else {
      const fileNameWithOutExtension = `${ticket.id}_${Date.now()}`;
      convertTextToSpeechAndSaveToFile(
        keepOnlySpecifiedChars(response!),
        `${publicFolder}/${fileNameWithOutExtension}`,
        prompt.voiceKey,
        prompt.voiceRegion,
        prompt.voice,
        "mp3"
      ).then(async () => {
        try {
          const media = MessageMedia.fromFilePath(`${publicFolder}/${fileNameWithOutExtension}.mp3`);
          const sendMessage = await wbot.sendMessage(msg.from, media, { sendAudioAsVoice: true });
          await verifyMediaMessage(sendMessage, ticket, contact);
          deleteFileSync(`${publicFolder}/${fileNameWithOutExtension}.mp3`);
          deleteFileSync(`${publicFolder}/${fileNameWithOutExtension}.wav`);
        } catch (error) {
          console.log(`Erro para responder com audio: ${error}`);
        }
      });
    }
  }
  messagesOpenAi = [];
};

const transferQueue = async (
  queueId: number,
  ticket: Ticket,
  contact: Contact
): Promise<void> => {
  await UpdateTicketService({
    ticketData: { queueId: queueId, useIntegration: false, promptId: null },
    ticketId: ticket.id,
    companyId: ticket.companyId
  });
};

const verifyMediaMessage = async (
  msg: WhatsAppMessage,
  ticket: Ticket,
  contact: Contact
): Promise<Message> => {
  const io = getIO();
  const quotedMsg = await verifyQuotedMessage(msg);
  const media = await downloadMedia(msg);

  if (!media) {
    throw new Error("ERR_WAPP_DOWNLOAD_MEDIA");
  }

  if (!media.filename) {
    const ext = media.mimetype.split("/")[1].split(";")[0];
    media.filename = `${new Date().getTime()}.${ext}`;
  }

  try {
    await writeFileAsync(
      join(__dirname, "..", "..", "..", "public", media.filename),
      media.data,
      "base64"
    );
  } catch (err) {
    Sentry.captureException(err);
    logger.error(err);
  }

  const body = getBodyMessage(msg);

  const messageData = {
    id: msg.id._serialized,
    ticketId: ticket.id,
    contactId: msg.fromMe ? undefined : contact.id,
    body: body ? formatBody(body, ticket.contact) : media.filename,
    fromMe: msg.fromMe,
    read: msg.fromMe,
    mediaUrl: media.filename,
    mediaType: media.mimetype.split("/")[0],
    quotedMsgId: quotedMsg?.id,
    ack: msg.ack,
    remoteJid: msg.from,
    participant: msg.author,
    dataJson: JSON.stringify(msg),
  };

  await ticket.update({
    lastMessage: body || media.filename,
  });

  const newMessage = await CreateMessageService({
    messageData,
    companyId: ticket.companyId,
  });

  if (!msg.fromMe && ticket.status === "closed") {
    await ticket.update({ status: "pending" });
    await ticket.reload({
      include: [
        { model: Queue, as: "queue" },
        { model: User, as: "user" },
        { model: Contact, as: "contact" },
      ],
    });

    io.to(`company-${ticket.companyId}-closed`)
      .to(`queue-${ticket.queueId}-closed`)
      .emit(`company-${ticket.companyId}-ticket`, {
        action: "delete",
        ticket,
        ticketId: ticket.id,
      });

    io.to(`company-${ticket.companyId}-${ticket.status}`)
      .to(`queue-${ticket.queueId}-${ticket.status}`)
      .to(ticket.id.toString())
      .emit(`company-${ticket.companyId}-ticket`, {
        action: "update",
        ticket,
        ticketId: ticket.id,
      });
  }

  return newMessage;
};

function getStatus(msg, msgType) {
  if (msg.ack === MessageAck.ACK_PENDING) {
    if (msg.fromMe && msgType == "reaction"){
      return 3;
    }
    return 1
  } else if (msg.ack === MessageAck.ACK_SERVER) {
    return 1
  }
  return msg.ack;
}

export const verifyMessage = async (
  msg: WhatsAppMessage,
  ticket: Ticket,
  contact: Contact
) => {
  const io = getIO();
  const quotedMsg = await verifyQuotedMessage(msg);
  const body = getBodyMessage(msg);
  const isEdited = false; // whatsapp-web.js doesn't support edited messages directly

  const messageData = {
    id: msg.id._serialized,
    ticketId: ticket.id,
    contactId: msg.fromMe ? undefined : contact.id,
    body,
    fromMe: msg.fromMe,
    mediaType: getTypeMessage(msg),
    read: msg.fromMe,
    quotedMsgId: quotedMsg?.id,
    ack: msg.ack,
    remoteJid: msg.from,
    participant: msg.author,
    dataJson: JSON.stringify(msg),
    isEdited: isEdited,
  };

  await ticket.update({
    lastMessage: body
  });

  await CreateMessageService({ messageData, companyId: ticket.companyId });

  if (!msg.fromMe && ticket.status === "closed") {
    await ticket.update({ status: "pending" });
    await ticket.reload({
      include: [
        { model: Queue, as: "queue" },
        { model: User, as: "user" },
        { model: Contact, as: "contact" }
      ]
    });

    io.to(`company-${ticket.companyId}-closed`)
      .to(`queue-${ticket.queueId}-closed`)
      .emit(`company-${ticket.companyId}-ticket`, {
        action: "delete",
        ticket,
        ticketId: ticket.id
      });

    io.to(`company-${ticket.companyId}-${ticket.status}`)
      .to(`queue-${ticket.queueId}-${ticket.status}`)
      .emit(`company-${ticket.companyId}-ticket`, {
        action: "update",
        ticket,
        ticketId: ticket.id
      });
  }
};

const isValidMsg = (msg: WhatsAppMessage): boolean => {
  if (msg.from === "status@broadcast") return false;
  
  try {
    const msgType = getTypeMessage(msg);
    if (!msgType) {
      return false;
    }

    const validTypes = [
      MessageTypes.TEXT,
      MessageTypes.AUDIO,
      MessageTypes.VOICE,
      MessageTypes.VIDEO,
      MessageTypes.IMAGE,
      MessageTypes.DOCUMENT,
      MessageTypes.STICKER,
      MessageTypes.LIST,
      MessageTypes.LOCATION,
      MessageTypes.CONTACT_CARD,
      MessageTypes.CONTACT_CARD_MULTI,
      MessageTypes.REACTION,
      MessageTypes.POLL_CREATION,
      MessageTypes.GROUP_NOTIFICATION
    ];

    const isValid = validTypes.includes(msgType as MessageTypes);

    if (!isValid) {
      logger.warn(`#### Nao achou o type em isValidMsg: ${msgType}
${JSON.stringify(msg)}`);
      Sentry.setExtra("Mensagem", { BodyMsg: msg.body, msg, msgType });
      Sentry.captureException(new Error("Novo Tipo de Mensagem em isValidMsg"));
    }

    return isValid;
  } catch (error) {
    Sentry.setExtra("Error isValidMsg", { msg });
    Sentry.captureException(error);
    return false;
  }
};

const Push = (msg: WhatsAppMessage) => {
  return (msg as any)._data?.notifyName || '';
}

const verifyQueue = async (
  wbot: Session,
  msg: WhatsAppMessage,
  ticket: Ticket,
  contact: Contact,
  mediaSent?: Message | undefined
) => {
  const companyId = ticket.companyId;

  const { queues, greetingMessage, maxUseBotQueues, timeUseBotQueues } = await ShowWhatsAppService(
    wbot.id!,
    ticket.companyId
  )

  if (queues.length === 1) {

    const sendGreetingMessageOneQueues = await Setting.findOne({
      where: {
        key: "sendGreetingMessageOneQueues",
        companyId: ticket.companyId
      }
    });

    if (greetingMessage.length > 1 && sendGreetingMessageOneQueues?.value === "enabled") {
      const body = formatBody(`${greetingMessage}`, contact);

      console.log('body2', body)
      await wbot.sendMessage(
        `${contact.number}@${ticket.isGroup ? "g.us" : "c.us"}`,
        body
      );
    }

    const firstQueue = head(queues);
    let chatbot = false;
    if (firstQueue?.options) {
      chatbot = firstQueue.options.length > 0;
    }

    //inicia integração dialogflow/n8n
    if (
      !msg.fromMe &&
      !ticket.isGroup &&
      !isNil(queues[0]?.integrationId)
    ) {
      const integrations = await ShowQueueIntegrationService(queues[0].integrationId, companyId);

      await handleMessageIntegration(msg, wbot, integrations, ticket)

      await ticket.update({
        useIntegration: true,
        integrationId: integrations.id
      })
    }
    //inicia integração openai
    if (
      !msg.fromMe &&
      !ticket.isGroup &&
      !isNil(queues[0]?.promptId)
    ) {
      await handleOpenAi(msg, wbot, ticket, contact, mediaSent);

      await ticket.update({
        useIntegration: true,
        promptId: queues[0]?.promptId
      })
    }

    await UpdateTicketService({
      ticketData: { queueId: firstQueue.id, chatbot, status: "pending" },
      ticketId: ticket.id,
      companyId: ticket.companyId,
    });

    return;
  }

  const selectedOption = getBodyMessage(msg);
  const choosenQueue = queues[+selectedOption - 1];

  const buttonActive = await Setting.findOne({
    where: {
      key: "chatBotType",
      companyId
    }
  });

  /**
   * recebe as mensagens dos usuários e envia as opções de fila
   * tratamento de mensagens para resposta aos usuarios apartir do chatbot/fila.         
   */
  const botText = async () => {
    let options = "";

    queues.forEach((queue, index) => {
      options += `*[ ${index + 1} ]* - ${queue.name}\n`;
    });

    const textMessage = formatBody(`\u200e${greetingMessage}\n\n${options}`, contact);
    
    let lastMsg = map_msg.get(contact.number)
    let invalidOption = "Opção inválida, por favor, escolha uma opção válida."
    
    console.log('textMessage2', textMessage)
    console.log("lastMsg::::::::::::':", contact.number)
    
    if (!lastMsg?.msg || getBodyMessage(msg).includes('#') || textMessage === 'concluido' || lastMsg.msg !== textMessage && !lastMsg.invalid_option) {
      const sendMsg = await wbot.sendMessage(
        `${contact.number}@${ticket.isGroup ? "g.us" : "c.us"}`,
        textMessage
      );
      lastMsg ?? (lastMsg = {});
      lastMsg.msg = textMessage;
      lastMsg.invalid_option = false;
      map_msg.set(contact.number, lastMsg);
      await verifyMessage(sendMsg, ticket, ticket.contact);

    } else if (lastMsg.msg !== invalidOption && !lastMsg.invalid_option) {
      const sendMsg = await wbot.sendMessage(
        `${contact.number}@${ticket.isGroup ? "g.us" : "c.us"}`,
        invalidOption
      );
      lastMsg ?? (lastMsg = {});
      lastMsg.invalid_option = true;
      lastMsg.msg = invalidOption;
      map_msg.set(contact.number, lastMsg);
      await verifyMessage(sendMsg, ticket, ticket.contact);
    }
  };

  if (choosenQueue) {
    let chatbot = false;
    if (choosenQueue?.options) {
      chatbot = choosenQueue.options.length > 0;
    }

    await UpdateTicketService({
      ticketData: { queueId: choosenQueue.id, chatbot },
      ticketId: ticket.id,
      companyId: ticket.companyId,
    });

    /* Tratamento para envio de mensagem quando a fila está fora do expediente */
    if (choosenQueue.options.length === 0) {
      const queue = await Queue.findByPk(choosenQueue.id);
      const { schedules }: any = queue;
      const now = moment();
      const weekday = now.format("dddd").toLowerCase();
      let schedule;
      if (Array.isArray(schedules) && schedules.length > 0) {
        schedule = schedules.find((s) => s.weekdayEn === weekday && s.startTime !== "" && s.startTime !== null && s.endTime !== "" && s.endTime !== null);
      }

      if (queue.outOfHoursMessage !== null && queue.outOfHoursMessage !== "" && !isNil(schedule)) {
        const startTime = moment(schedule.startTime, "HH:mm");
        const endTime = moment(schedule.endTime, "HH:mm");

        if (now.isBefore(startTime) || now.isAfter(endTime)) {
          const body = formatBody(`\u200e ${queue.outOfHoursMessage}\n\n*[ # ]* - Voltar ao Menu Principal`, ticket.contact);
          console.log('body222', body)
          const sentMessage = await wbot.sendMessage(
            `${contact.number}@${ticket.isGroup ? "g.us" : "c.us"}`,
            body
          );
          await verifyMessage(sentMessage, ticket, contact);
          await UpdateTicketService({
            ticketData: { queueId: null, chatbot },
            ticketId: ticket.id,
            companyId: ticket.companyId,
          });
          return;
        }
      }

      //inicia integração dialogflow/n8n
      if (
        !msg.fromMe &&
        !ticket.isGroup &&
        choosenQueue.integrationId
      ) {
        const integrations = await ShowQueueIntegrationService(choosenQueue.integrationId, companyId);

        await handleMessageIntegration(msg, wbot, integrations, ticket)

        await ticket.update({
          useIntegration: true,
          integrationId: integrations.id
        })
      }

      //inicia integração openai
      if (
        !msg.fromMe &&
        !ticket.isGroup &&
        !isNil(choosenQueue?.promptId)
      ) {
        await handleOpenAi(msg, wbot, ticket, contact, mediaSent);

        await ticket.update({
          useIntegration: true,
          promptId: choosenQueue?.promptId
        })
      }

      const body = formatBody(`\u200e${choosenQueue.greetingMessage}`, ticket.contact);
      if (choosenQueue.greetingMessage) {
        console.log('body33333333', body)
        const sentMessage = await wbot.sendMessage(
          `${contact.number}@${ticket.isGroup ? "g.us" : "c.us"}`,
          body
        );
        await verifyMessage(sentMessage, ticket, contact);
      }
      
      if (choosenQueue.mediaPath !== null && choosenQueue.mediaPath !== "") {
        const filePath = path.resolve("public", choosenQueue.mediaPath);
        const optionsMsg = await getMessageOptions(choosenQueue.mediaName, filePath);
        let sentMessage = await wbot.sendMessage(
          `${ticket.contact.number}@${ticket.isGroup ? "g.us" : "c.us"}`, 
          optionsMsg
        );
        await verifyMediaMessage(sentMessage, ticket, contact);
      }
    }

  } else {

    if (maxUseBotQueues && maxUseBotQueues !== 0 && ticket.amountUsedBotQueues >= maxUseBotQueues) {
      return;
    }

    //Regra para desabilitar o chatbot por x minutos/horas após o primeiro envio
    const ticketTraking = await FindOrCreateATicketTrakingService({ ticketId: ticket.id, companyId });
    let dataLimite = new Date();
    let Agora = new Date();

    if (ticketTraking.chatbotAt !== null) {
      dataLimite.setMinutes(ticketTraking.chatbotAt.getMinutes() + (Number(timeUseBotQueues)));

      if (ticketTraking.chatbotAt !== null && Agora < dataLimite && timeUseBotQueues !== "0" && ticket.amountUsedBotQueues !== 0) {
        return
      }
    }
    await ticketTraking.update({
      chatbotAt: null
    })

    if (buttonActive.value === "text") {
      return botText();
    }
  }
};

export const verifyRating = (ticketTraking: TicketTraking) => {
  if (
    ticketTraking &&
    ticketTraking.finishedAt === null &&
    ticketTraking.userId !== null &&
    ticketTraking.ratingAt !== null
  ) {
    return true;
  }
  return false;
};

export const handleRating = async (
  rate: number,
  ticket: Ticket,
  ticketTraking: TicketTraking
) => {
  const io = getIO();

  const { complationMessage } = await ShowWhatsAppService(
    ticket.whatsappId,
    ticket.companyId
  );

  let finalRate = rate;

  if (rate < 1) {
    finalRate = 1;
  }
  if (rate > 5) {
    finalRate = 5;
  }

  await UserRating.create({
    ticketId: ticketTraking.ticketId,
    companyId: ticketTraking.companyId,
    userId: ticketTraking.userId,
    rate: finalRate,
  });

  if (complationMessage) {
    const body = formatBody(`\u200e${complationMessage}`, ticket.contact);
    await SendWhatsAppMessage({ body, ticket });
  }

  await ticketTraking.update({
    finishedAt: moment().toDate(),
    rated: true,
  });

  await ticket.update({
    queueId: null,
    chatbot: null,
    queueOptionId: null,
    userId: null,
    status: "closed",
  });

  io.to(`company-${ticket.companyId}-open`)
    .to(`queue-${ticket.queueId}-open`)
    .emit(`company-${ticket.companyId}-ticket`, {
      action: "delete",
      ticket,
      ticketId: ticket.id,
    });

  io.to(`company-${ticket.companyId}-${ticket.status}`)
    .to(`queue-${ticket.queueId}-${ticket.status}`)
    .to(ticket.id.toString())
    .emit(`company-${ticket.companyId}-ticket`, {
      action: "update",
      ticket,
      ticketId: ticket.id,
    });
};

const handleChartbot = async (ticket: Ticket, msg: WhatsAppMessage, wbot: Session, dontReadTheFirstQuestion: boolean = false) => {

  const queue = await Queue.findByPk(ticket.queueId, {
    include: [
      {
        model: QueueOption,
        as: "options",
        where: { parentId: null },
        order: [
          ["option", "ASC"],
          ["createdAt", "ASC"],
        ],
      },
    ],
  });

  const messageBody = getBodyMessage(msg);

  if (messageBody == "#") {
    // voltar para o menu inicial
    await ticket.update({ queueOptionId: null, chatbot: false, queueId: null });
    await verifyQueue(wbot, msg, ticket, ticket.contact);
    return;
  }

  // voltar para o menu anterior
  if (!isNil(queue) && !isNil(ticket.queueOptionId) && messageBody == "0") {
    const option = await QueueOption.findByPk(ticket.queueOptionId);
    await ticket.update({ queueOptionId: option?.parentId });

    // escolheu uma opção
  } else if (!isNil(queue) && !isNil(ticket.queueOptionId)) {

    const count = await QueueOption.count({
      where: { parentId: ticket.queueOptionId },
    });
    let option: any = {};
    if (count == 1) {
      option = await QueueOption.findOne({
        where: { parentId: ticket.queueOptionId },
      });
    } else {
      option = await QueueOption.findOne({
        where: {
          option: messageBody || "",
          parentId: ticket.queueOptionId,
        },
      });
    }
    if (option) {
      await ticket.update({ queueOptionId: option?.id });
    }

    // não linha a primeira pergunta
  } else if (!isNil(queue) && isNil(ticket.queueOptionId) && !dontReadTheFirstQuestion) {
    const option = queue?.options.find((o) => o.option == messageBody);
    if (option) {
      await ticket.update({ queueOptionId: option?.id });
    }
  }

  await ticket.reload();

  if (!isNil(queue) && isNil(ticket.queueOptionId)) {

    const queueOptions = await QueueOption.findAll({
      where: { queueId: ticket.queueId, parentId: null },
      order: [
        ["option", "ASC"],
        ["createdAt", "ASC"],
      ],
    });

    const companyId = ticket.companyId;

    const buttonActive = await Setting.findOne({
      where: {
        key: "chatBotType",
        companyId
      }
    });

    const botButton = async () => {
      const buttons = [];
      queueOptions.forEach((option, i) => {
        buttons.push({
          buttonId: `${option.option}`,
          buttonText: { displayText: option.title },
          type: 4
        });
      });
      buttons.push({
        buttonId: `#`,
        buttonText: { displayText: "Menu inicial *[ 0 ]* Menu anterior" },
        type: 4
      });

      // whatsapp-web.js doesn't support buttons like Baileys
      // Instead, we'll send a text message
      let options = "";
      queueOptions.forEach((option, i) => {
        options += `*[ ${option.option} ]* - ${option.title}\n`;
      });
      options += `\n*[ # ]* - Menu inicial`;

      const textMessage = formatBody(`\u200e${queue.greetingMessage}\n\n${options}`, ticket.contact);

      const sendMsg = await wbot.sendMessage(
        `${ticket.contact.number}@${ticket.isGroup ? "g.us" : "c.us"}`,
        textMessage
      );

      await verifyMessage(sendMsg, ticket, ticket.contact);
    }

    const botText = async () => {
      let options = "";

      queueOptions.forEach((option, i) => {
        options += `*[ ${option.option} ]* - ${option.title}\n`;
      });
      options += `\n*[ # ]* - Menu inicial`;

      const textMessage = formatBody(`\u200e${queue.greetingMessage}\n\n${options}`, ticket.contact);

      console.log('textMessage5555555555555', textMessage)
      const sendMsg = await wbot.sendMessage(
        `${ticket.contact.number}@${ticket.isGroup ? "g.us" : "c.us"}`,
        textMessage
      );

      await verifyMessage(sendMsg, ticket, ticket.contact);
    };

    if (buttonActive.value === "button" && QueueOption.length <= 4) {
      return botButton();
    }

    if (buttonActive.value === "text") {
      return botText();
    }

    if (buttonActive.value === "button" && QueueOption.length > 4) {
      return botText();
    }
  } else if (!isNil(queue) && !isNil(ticket.queueOptionId)) {
    const currentOption = await QueueOption.findByPk(ticket.queueOptionId);
    const queueOptions = await QueueOption.findAll({
      where: { parentId: ticket.queueOptionId },
      order: [
        ["option", "ASC"],
        ["createdAt", "ASC"],
      ],
    });
  
  if (queueOptions.length === 0) {
    const textMessage = formatBody(`\u200e${currentOption.message}`, ticket.contact);

    const sendMsg = await wbot.sendMessage(
      `${ticket.contact.number}@${ticket.isGroup ? "g.us" : "c.us"}`,
      textMessage
    );
    
    await verifyMessage(sendMsg, ticket, ticket.contact);
    
    if (currentOption.mediaPath !== null && currentOption.mediaPath !== "")  {
      const filePath = path.resolve("public", currentOption.mediaPath);
      const optionsMsg = await getMessageOptions(currentOption.mediaName, filePath);
      let sentMessage = await wbot.sendMessage(
        `${ticket.contact.number}@${ticket.isGroup ? "g.us" : "c.us"}`, 
        optionsMsg
      );
      await verifyMediaMessage(sentMessage, ticket, ticket.contact);
    }

    await ticket.update({
      queueOptionId: null,
      chatbot: false,
    });
    return;
  }

    if (queueOptions.length > -1) {

      const companyId = ticket.companyId;
      const buttonActive = await Setting.findOne({
        where: {
          key: "chatBotType",
          companyId
        }
      });

      const botList = async () => {
        // whatsapp-web.js doesn't support list messages like Baileys
        // Instead, we'll send a text message
        let options = "";
        queueOptions.forEach((option, i) => {
          options += `*[ ${option.option} ]* - ${option.title}\n`;
        });
        options += `\n*[ 0 ]* - Menu anterior`;
        options += `\n*[ # ]* - Menu inicial`;
        
        const textMessage = formatBody(`\u200e${currentOption.message}\n\n${options}`, ticket.contact);

        const sendMsg = await wbot.sendMessage(
          `${ticket.contact.number}@${ticket.isGroup ? "g.us" : "c.us"}`,
          textMessage
        );

        await verifyMessage(sendMsg, ticket, ticket.contact);
      }

      const botButton = async () => {
        // whatsapp-web.js doesn't support buttons like Baileys
        // Instead, we'll send a text message
        let options = "";
        queueOptions.forEach((option, i) => {
          options += `*[ ${option.option} ]* - ${option.title}\n`;
        });
        options += `\n*[ 0 ]* - Menu anterior`;
        options += `\n*[ # ]* - Menu inicial`;

        const textMessage = formatBody(`\u200e${currentOption.message}\n\n${options}`, ticket.contact);

        const sendMsg = await wbot.sendMessage(
          `${ticket.contact.number}@${ticket.isGroup ? "g.us" : "c.us"}`,
          textMessage
        );

        await verifyMessage(sendMsg, ticket, ticket.contact);
        
        if (currentOption.mediaPath !== null && currentOption.mediaPath !== "")  {
          const filePath = path.resolve("public", currentOption.mediaPath);
          const optionsMsg = await getMessageOptions(currentOption.mediaName, filePath);
          let sentMessage = await wbot.sendMessage(
            `${ticket.contact.number}@${ticket.isGroup ? "g.us" : "c.us"}`, 
            optionsMsg
          );
          await verifyMediaMessage(sentMessage, ticket, ticket.contact);
        }
      }

      const botText = async () => {

        let options = "";

        queueOptions.forEach((option, i) => {
          options += `*[ ${option.option} ]* - ${option.title}\n`;
        });
        options += `\n*[ 0 ]* - Menu anterior`;
        options += `\n*[ # ]* - Menu inicial`;
        const textMessage = formatBody(`\u200e${currentOption.message}\n\n${options}`, ticket.contact);

        console.log('textMessage6666666666', textMessage)
        const sendMsg = await wbot.sendMessage(
          `${ticket.contact.number}@${ticket.isGroup ? "g.us" : "c.us"}`,
          textMessage
        );

        await verifyMessage(sendMsg, ticket, ticket.contact);
        
        if (currentOption.mediaPath !== null && currentOption.mediaPath !== "")  {
          const filePath = path.resolve("public", currentOption.mediaPath);
          const optionsMsg = await getMessageOptions(currentOption.mediaName, filePath);
          let sentMessage = await wbot.sendMessage(
            `${ticket.contact.number}@${ticket.isGroup ? "g.us" : "c.us"}`, 
            optionsMsg
          );
          await verifyMediaMessage(sentMessage, ticket, ticket.contact);
        }
      };

      if (buttonActive.value === "list") {
        return botList();
      };

      if (buttonActive.value === "button" && QueueOption.length <= 4) {
        return botButton();
      }

      if (buttonActive.value === "text") {
        return botText();
      }

      if (buttonActive.value === "button" && QueueOption.length > 4) {
        return botText();
      }
    }
  }
}

export const handleMessageIntegration = async (
  msg: WhatsAppMessage,
  wbot: Session,
  queueIntegration: QueueIntegrations,
  ticket: Ticket
): Promise<void> => {
  const msgType = getTypeMessage(msg);

  if (queueIntegration.type === "n8n" || queueIntegration.type === "webhook") {
    if (queueIntegration?.urlN8N) {
      const options = {
        method: "POST",
        url: queueIntegration?.urlN8N,
        headers: {
          "Content-Type": "application/json"
        },
        json: msg
      };
      try {
        request(options, function (error, response) {
          if (error) {
            throw new Error(error);
          }
          else {
            console.log(response.body);
          }
        });
      } catch (error) {
        throw new Error(error);
      }
    }

  } else if (queueIntegration.type === "typebot") {
    console.log("entrou no typebot")
    await typebotListener({ ticket, msg, wbot, typebot: queueIntegration });
  }
}

const handleMessage = async (
  msg: WhatsAppMessage,
  wbot: Session,
  companyId: number
): Promise<void> => {

  let mediaSent: Message | undefined;

  if (!isValidMsg(msg)) return;
  try {
    let msgContact: IMe;
    let groupContact: Contact | undefined;

    const isGroup = msg.from?.endsWith("@g.us");

    const msgIsGroupBlock = await Setting.findOne({
      where: {
        companyId,
        key: "CheckMsgIsGroup",
      },
    });

    const bodyMessage = getBodyMessage(msg);
    const msgType = getTypeMessage(msg);

    const hasMedia = msg.hasMedia;
    
    if (msg.fromMe) {
      if (/\u200e/.test(bodyMessage)) return;

      if (
        !hasMedia &&
        msgType !== MessageTypes.TEXT &&
        msgType !== MessageTypes.CONTACT_CARD &&
        msgType !== MessageTypes.REACTION 
      )
        return;
      msgContact = await getContactMessage(msg, wbot);
    } else {
      msgContact = await getContactMessage(msg, wbot);
    }

    if (msgIsGroupBlock?.value === "enabled" && isGroup) return;

    if (isGroup) {
      const chat = await msg.getChat() as GroupChat;
      const msgGroupContact = {
        id: chat.id._serialized,
        name: chat.name
      };
      groupContact = await verifyContact(msgGroupContact, wbot, companyId);
    }

    const whatsapp = await ShowWhatsAppService(wbot.id!, companyId);
    const contact = await verifyContact(msgContact, wbot, companyId);

    let unreadMessages = 0;

    if (msg.fromMe) {
      await cacheLayer.set(`contacts:${contact.id}:unreads`, "0");
    } else {
      const unreads = await cacheLayer.get(`contacts:${contact.id}:unreads`);
      unreadMessages = +unreads + 1;
      await cacheLayer.set(
        `contacts:${contact.id}:unreads`,
        `${unreadMessages}`
      );
    }

    const lastMessage = await Message.findOne({
      where: {
        contactId: contact.id,
        companyId,
      },
      order: [["createdAt", "DESC"]],
    });

    if (unreadMessages === 0 && whatsapp.complationMessage && formatBody(whatsapp.complationMessage, contact).trim().toLowerCase() === lastMessage?.body.trim().toLowerCase()) {
      return;
    }

    const ticket = await FindOrCreateTicketService(contact, wbot.id!, unreadMessages, companyId, groupContact);

    await provider(ticket, msg, companyId, contact, wbot as any);

    // voltar para o menu inicial
    if (bodyMessage == "#") {
      await ticket.update({
        queueOptionId: null,
        chatbot: false,
        queueId: null,
      });
      await verifyQueue(wbot, msg, ticket, ticket.contact);
      return;
    }

    const ticketTraking = await FindOrCreateATicketTrakingService({
      ticketId: ticket.id,
      companyId,
      whatsappId: whatsapp?.id
    });

    try {
      if (!msg.fromMe) {
        /**
         * Tratamento para avaliação do atendente
         */
        if (ticketTraking !== null && verifyRating(ticketTraking)) {
          handleRating(parseFloat(bodyMessage), ticket, ticketTraking);
          return;
        }
      }
    } catch (e) {
      Sentry.captureException(e);
      console.log(e);
    }

    // Atualiza o ticket se a ultima mensagem foi enviada por mim, para que possa ser finalizado. 
    try {
      await ticket.update({
        fromMe: msg.fromMe,
      });
    } catch (e) {
      Sentry.captureException(e);
      console.log(e);
    }

    if (hasMedia) {
      mediaSent = await verifyMediaMessage(msg, ticket, contact);
    } else {
      await verifyMessage(msg, ticket, contact);
    }

    const currentSchedule = await VerifyCurrentSchedule(companyId);
    const scheduleType = await Setting.findOne({
      where: {
        companyId,
        key: "scheduleType"
      }
    });

    try {
      if (!msg.fromMe && scheduleType) {
        /**
         * Tratamento para envio de mensagem quando a empresa está fora do expediente
         */
        if (
          scheduleType.value === "company" &&
          !isNil(currentSchedule) &&
          (!currentSchedule || currentSchedule.inActivity === false)
        ) {
          const body = `\u200e ${whatsapp.outOfHoursMessage}`;

          console.log('body9341023', body)
          const debouncedSentMessage = debounce(
            async () => {
              await wbot.sendMessage(
                `${ticket.contact.number}@${ticket.isGroup ? "g.us" : "c.us"}`,
                body
              );
            },
            3000,
            ticket.id
          );
          debouncedSentMessage();
          return;
        }

        console.log('bodyMaaaaaaa1111aaaaaessage:', bodyMessage);
        if (scheduleType.value === "queue" && ticket.queueId !== null) {

          /**
           * Tratamento para envio de mensagem quando a fila está fora do expediente
           */

          const queue = await Queue.findByPk(ticket.queueId);

          const { schedules }: any = queue;
          const now = moment();
          const weekday = now.format("dddd").toLowerCase();
          let schedule = null;

          if (Array.isArray(schedules) && schedules.length > 0) {
            schedule = schedules.find(
              s =>
                s.weekdayEn === weekday &&
                s.startTime !== "" &&
                s.startTime !== null &&
                s.endTime !== "" &&
                s.endTime !== null
            );
          }

          if (
            scheduleType.value === "queue" &&
            queue.outOfHoursMessage !== null &&
            queue.outOfHoursMessage !== "" &&
            !isNil(schedule)
          ) {
            const startTime = moment(schedule.startTime, "HH:mm");
            const endTime = moment(schedule.endTime, "HH:mm");

            if (now.isBefore(startTime) || now.isAfter(endTime)) {
              const body = `${queue.outOfHoursMessage}`;
              console.log('body:23801', body)
              const debouncedSentMessage = debounce(
                async () => {
                  await wbot.sendMessage(
                    `${ticket.contact.number}@${ticket.isGroup ? "g.us" : "c.us"}`,
                    body
                  );
                },
                3000,
                ticket.id
              );
              debouncedSentMessage();
              return;
            }
          }
        }

      }
    } catch (e) {
      Sentry.captureException(e);
      console.log(e);
    }

    try {
      if (!msg.fromMe) {
        if (ticketTraking !== null && verifyRating(ticketTraking)) {
          handleRating(parseFloat(bodyMessage), ticket, ticketTraking);
          return;
        }
      }
    } catch (e) {
      Sentry.captureException(e);
      console.log(e);
    }

    //openai na conexao
    if (
      !ticket.queue &&
      !isGroup &&
      !msg.fromMe &&
      !ticket.userId &&
      !isNil(whatsapp.promptId)
    ) {
      await handleOpenAi(msg, wbot, ticket, contact, mediaSent);
    }

    //integraçao na conexao
    if (
      !msg.fromMe &&
      !ticket.isGroup &&
      !ticket.queue &&
      !ticket.user &&
      ticket.chatbot &&
      !isNil(whatsapp.integrationId) &&
      !ticket.useIntegration
    ) {

      const integrations = await ShowQueueIntegrationService(whatsapp.integrationId, companyId);

      await handleMessageIntegration(msg, wbot, integrations, ticket)

      return
    }

    //openai na fila
    if (
      !isGroup &&
      !msg.fromMe &&
      !ticket.userId &&
      !isNil(ticket.promptId) &&
      ticket.useIntegration &&
      ticket.queueId

    ) {
      await handleOpenAi(msg, wbot, ticket, contact, mediaSent);
    }

    if (
      !msg.fromMe &&
      !ticket.isGroup &&
      !ticket.userId &&
      ticket.integrationId &&
      ticket.useIntegration &&
      ticket.queue
    ) {

      console.log("entrou no type 1974")
      const integrations = await ShowQueueIntegrationService(ticket.integrationId, companyId);

      await handleMessageIntegration(msg, wbot, integrations, ticket)

    }

    if (
      !ticket.queue &&
      !ticket.isGroup &&
      !msg.fromMe &&
      !ticket.userId &&
      whatsapp.queues.length >= 1 &&
      !ticket.useIntegration
    ) {

      await verifyQueue(wbot, msg, ticket, contact);

      if (ticketTraking.chatbotAt === null) {
        await ticketTraking.update({
          chatbotAt: moment().toDate(),
        })
      }
    }

    const dontReadTheFirstQuestion = ticket.queue === null;

    await ticket.reload();

    try {
      //Fluxo fora do expediente
      if (!msg.fromMe && scheduleType && ticket.queueId !== null) {
        /**
         * Tratamento para envio de mensagem quando a fila está fora do expediente
         */
        const queue = await Queue.findByPk(ticket.queueId);

        const { schedules }: any = queue;
        const now = moment();
        const weekday = now.format("dddd").toLowerCase();
        let schedule = null;

        if (Array.isArray(schedules) && schedules.length > 0) {
          schedule = schedules.find(
            s =>
              s.weekdayEn === weekday &&
              s.startTime !== "" &&
              s.startTime !== null &&
              s.endTime !== "" &&
              s.endTime !== null
          );
        }

        if (
          scheduleType.value === "queue" &&
          queue.outOfHoursMessage !== null &&
          queue.outOfHoursMessage !== "" &&
          !isNil(schedule)
        ) {
          const startTime = moment(schedule.startTime, "HH:mm");
          const endTime = moment(schedule.endTime, "HH:mm");

          if (now.isBefore(startTime) || now.isAfter(endTime)) {
            const body = queue.outOfHoursMessage;
            console.log('body158964153', body)
            const debouncedSentMessage = debounce(
              async () => {
                await wbot.sendMessage(
                  `${ticket.contact.number}@${ticket.isGroup ? "g.us" : "c.us"}`,
                  body
                );
              },
              3000,
              ticket.id
            );
            debouncedSentMessage();
            return;
          }
        }
      }
    
    } catch (e) {
      Sentry.captureException(e);
      console.log(e);
    }

    if (!whatsapp?.queues?.length && !ticket.userId && !isGroup && !msg.fromMe) {

      const lastMessage = await Message.findOne({
        where: {
          ticketId: ticket.id,
          fromMe: true
        },
        order: [["createdAt", "DESC"]]
      });

      if (lastMessage && lastMessage.body.includes(whatsapp.greetingMessage)) {
        return;
      }

      if (whatsapp.greetingMessage) {

        console.log('whatsapp.greetingMessage', whatsapp.greetingMessage)
        const debouncedSentMessage = debounce(
          async () => {
            await wbot.sendMessage(
              `${ticket.contact.number}@${ticket.isGroup ? "g.us" : "c.us"}`,
              whatsapp.greetingMessage
            );
          },
          1000,
          ticket.id
        );
        debouncedSentMessage();
        return;
      }

    }

    if (whatsapp.queues.length == 1 && ticket.queue) {
      if (ticket.chatbot && !msg.fromMe) {
        await handleChartbot(ticket, msg, wbot);
      }
    }
    if (whatsapp.queues.length > 1 && ticket.queue) {
      if (ticket.chatbot && !msg.fromMe) {
        await handleChartbot(ticket, msg, wbot, dontReadTheFirstQuestion);
      }
    }

  } catch (err) {
    console.log(err)
    Sentry.captureException(err);
    logger.error(`Error handling whatsapp message: Err: ${err}`);
  }
};

const handleMsgAck = async (
  msg: WhatsAppMessage,
  ack: MessageAck
) => {
  await new Promise((r) => setTimeout(r, 500));
  const io = getIO();

  try {
    const messageToUpdate = await Message.findByPk(msg.id._serialized, {
      include: [
        "contact",
        {
          model: Message,
          as: "quotedMsg",
          include: ["contact"],
        },
      ],
    });

    if (!messageToUpdate) return;
    await messageToUpdate.update({ ack: ack });
    io.to(messageToUpdate.ticketId.toString()).emit(
      `company-${messageToUpdate.companyId}-appMessage`,
      {
        action: "update",
        message: messageToUpdate,
      }
    );
  } catch (err) {
    Sentry.captureException(err);
    logger.error(`Error handling message ack. Err: ${err}`);
  }
};

const verifyRecentCampaign = async (
  message: WhatsAppMessage,
  companyId: number
) => {
  if (!message.fromMe) {
    const number = message.from.replace(/\D/g, "");
    const campaigns = await Campaign.findAll({
      where: { companyId, status: "EM_ANDAMENTO", confirmation: true },
    });
    if (campaigns) {
      const ids = campaigns.map((c) => c.id);
      const campaignShipping = await CampaignShipping.findOne({
        where: { campaignId: { [Op.in]: ids }, number, confirmation: null },
      });

      if (campaignShipping) {
        await campaignShipping.update({
          confirmedAt: moment(),
          confirmation: true,
        });
        await campaignQueue.add(
          "DispatchCampaign",
          {
            campaignShippingId: campaignShipping.id,
            campaignId: campaignShipping.campaignId,
          },
          {
            delay: parseToMilliseconds(randomValue(0, 10)),
          }
        );
      }
    }
  }
};

const verifyCampaignMessageAndCloseTicket = async (
  message: WhatsAppMessage,
  companyId: number
) => {
  const io = getIO();
  const body = getBodyMessage(message);
  const isCampaign = /\u200c/.test(body);
  if (message.fromMe && isCampaign) {
    const messageRecord = await Message.findOne({
      where: { id: message.id._serialized, companyId },
    });
    const ticket = await Ticket.findByPk(messageRecord.ticketId);
    await ticket.update({ status: "closed" });

    io.to(`company-${ticket.companyId}-open`)
      .to(`queue-${ticket.queueId}-open`)
      .emit(`company-${ticket.companyId}-ticket`, {
        action: "delete",
        ticket,
        ticketId: ticket.id,
      });

    io.to(`company-${ticket.companyId}-${ticket.status}`)
      .to(`queue-${ticket.queueId}-${ticket.status}`)
      .to(ticket.id.toString())
      .emit(`company-${ticket.companyId}-ticket`, {
        action: "update",
        ticket,
        ticketId: ticket.id,
      });
  }
};

const filterMessages = (msg: WhatsAppMessage): boolean => {
  // whatsapp-web.js doesn't have protocolMessage or messageStubType
  return true;
};

const wbotMessageListener = async (wbot: Session, companyId: number): Promise<void> => {
  try {
    wbot.on('message', async (message: WhatsAppMessage) => {
      if (!filterMessages(message)) return;

      const messageExists = await Message.count({
        where: { id: message.id._serialized, companyId }
      });

      if (!messageExists) {
        await handleMessage(message, wbot, companyId);
        await verifyRecentCampaign(message, companyId);
        await verifyCampaignMessageAndCloseTicket(message, companyId);
      }
    });

    wbot.on('message_ack', async (message: WhatsAppMessage) => {
      await handleMsgAck(message, message.ack);
    });

    wbot.on('message_revoked_everyone', async (message: WhatsAppMessage, revoked_msg: WhatsAppMessage) => {
      if (message.from !== 'status@broadcast') {
        MarkDeleteWhatsAppMessage(message.from, null, message.id._serialized, companyId);
      }
    });

  } catch (error) {
    Sentry.captureException(error);
    logger.error(`Error handling wbot message listener. Err: ${error}`);
  }
};

export { handleMessage, wbotMessageListener };
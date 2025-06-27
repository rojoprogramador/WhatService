import { Message } from "whatsapp-web.js";

// Função para extrair informações de mensagens de texto
export const getTextMessage = (msg: Message) => {
  return msg.body;
};

// Função para extrair informações de mensagens de imagem
export const getImageMessage = (msg: Message) => {
  return msg.body || "Imagem";
};

// Função para extrair informações de mensagens de vídeo
export const getVideoMessage = (msg: Message) => {
  return msg.body || "Vídeo";
};

// Função para extrair informações de mensagens de áudio
export const getAudioMessage = (msg: Message) => {
  return "Áudio";
};

// Função para extrair informações de mensagens de documento
export const getDocumentMessage = (msg: Message) => {
  return msg.body || "Documento";
};

// Função para extrair informações de mensagens de localização
export const getLocationMessage = (msg: Message) => {
  if (msg.location) {
    return {
      latitude: msg.location.latitude,
      longitude: msg.location.longitude
    };
  }
  return {
    latitude: null,
    longitude: null
  };
};

// Função para extrair informações de mensagens de contato
export const getContactMessage = (msg: Message) => {
  return msg.body || "Contato";
};

// Função para extrair informações de mensagens de botão
export const getButtonsMessage = (msg: Message) => {
  return msg.body;
};

// Função para extrair informações de mensagens de lista
export const getListMessage = (msg: Message) => {
  return msg.body;
};

// Função para extrair informações de mensagens de reação
export const getReactionMessage = (msg: Message) => {
  return msg.body || "Reação";
};

// Função para extrair informações de mensagens de adesivo (sticker)
export const getStickerMessage = (msg: Message) => {
  return "Sticker";
};

// Função para extrair informações de mensagens de modelo (template)
export const getTemplateMessage = (msg: Message) => {
  return msg.body || "Template";
};

// Função para extrair informações de mensagens de pagamento
export const getPaymentMessage = (msg: Message) => {
  return msg.body || "Pagamento";
};

// Função para extrair informações de mensagens de convite de grupo
export const getGroupInviteMessage = (msg: Message) => {
  return msg.body || "Convite de grupo";
};

// Função para extrair informações de mensagens de chamada
export const getCallMessage = (msg: Message) => {
  return "Chamada";
};

export const getViewOnceMessage = (msg: Message): string => {
  return msg.body || "Mensagem visualizada uma vez";
};

export const getAd = (msg: Message): string => {
  return msg.body || "Anúncio";
};

export const getBodyButton = (msg: Message): string => {
  return msg.body || "Botão";
};

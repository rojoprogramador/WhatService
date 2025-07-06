import { Request, Response, NextFunction } from "express";

export interface LocalizedRequest extends Request {
  language?: string;
}

const i18nMiddleware = (req: LocalizedRequest, res: Response, next: NextFunction) => {
  // Obtener idioma del header Accept-Language
  const acceptLanguage = req.headers["accept-language"];
  
  // Prioridad: 1. Accept-Language header, 2. Español por defecto
  let language = "es"; // Español por defecto
  
  if (acceptLanguage) {
    // Parsear Accept-Language header (ej: "en-US,en;q=0.9,es;q=0.8")
    const languages = acceptLanguage.split(",").map(lang => {
      const [code, quality = "1"] = lang.trim().split(";q=");
      return { code: code.split("-")[0], quality: parseFloat(quality) };
    });
    
    // Buscar idiomas soportados en orden de preferencia
    const supportedLanguages = ["es", "en", "pt"];
    const preferredLanguage = languages
      .sort((a, b) => b.quality - a.quality)
      .find(lang => supportedLanguages.includes(lang.code));
    
    if (preferredLanguage) {
      language = preferredLanguage.code;
    }
  }
  
  req.language = language;
  next();
};

export default i18nMiddleware;
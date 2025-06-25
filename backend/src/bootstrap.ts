import dotenv from "dotenv";
import { validateEnv } from "./config/validateEnv";

dotenv.config({
  path: process.env.NODE_ENV === "test" ? ".env.test" : ".env"
});

// Validar variables de entorno en producción y desarrollo
if (process.env.NODE_ENV !== "test") {
  validateEnv();
}

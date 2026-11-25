import { Resend } from "resend";
import { env } from "../../config/index.js";

export const resend = new Resend(env.RESEND_API_KEY);
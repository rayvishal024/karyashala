
import express, { RequestHandler } from "express";
import cookieParser from "cookie-parser";

export const parsingMiddleware: RequestHandler[] = [
     express.json({ limit: "1mb" }),
     express.urlencoded({ extended: true, limit: "1mb" }),
     cookieParser(),
];

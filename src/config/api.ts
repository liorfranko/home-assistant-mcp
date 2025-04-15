import dotenv from "dotenv";

dotenv.config();

// Get environment variables
export const haUrl = process.env.HA_URL || "http://homeassistant.local:8123";
export const haToken = process.env.HA_TOKEN;
export const nodeRedUrl = process.env.NODE_RED_URL || "http://homeassistant.local:1880";
export const nodeRedUsername = process.env.NODE_RED_USERNAME;
export const nodeRedPassword = process.env.NODE_RED_PASSWORD;

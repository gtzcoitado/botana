// src/api.ts
import axios from 'axios';

export const api = axios.create({
  baseURL: 'https://bot-wpp-backend-production.up.railway.app/api',
  withCredentials: true,
});

export const api = axios.create({
  baseURL: import.meta.env.PROD
    ? 'https://bot-wpp-backend-production.up.railway.app'
    : 'http://localhost:4000'
});

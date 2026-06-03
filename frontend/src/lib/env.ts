export const env = {
  appName: process.env.NEXT_PUBLIC_APP_NAME ?? "StockFlow",
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080",
  publicAppUrl:
    process.env.NEXT_PUBLIC_PUBLIC_APP_URL ?? "http://localhost:3000",
};

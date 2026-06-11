import { toast } from "sonner";

export const appToast = {
  success: (message: string) => toast.success(message),
  error: (message: string) => toast.error(message),
  warning: (message: string) => toast.warning(message),
  info: (message: string) => toast.info(message),
};

export function getApiErrorMessage(error: unknown, fallback = "Erro inesperado.") {
  if (error instanceof Error) {
    const message = cleanErrorMessage(error.message);
    return message || fallback;
  }
  return fallback;
}

function cleanErrorMessage(message: string) {
  const trimmed = message.trim();
  if (!trimmed || looksLikeHtml(trimmed) || looksTechnical(trimmed)) {
    return "";
  }
  return trimmed;
}

function looksLikeHtml(message: string) {
  return /<html|<!doctype|<body|<title/i.test(message);
}

function looksTechnical(message: string) {
  return /^(failed|network error|api request failed with status \d+)$/i.test(message);
}

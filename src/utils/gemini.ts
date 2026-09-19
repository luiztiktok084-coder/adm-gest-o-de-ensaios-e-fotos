import { getApiSettings } from './storage';

export async function generatePhotographyPromptWithAI(
  categoryName: string,
  conceptIdea: string
): Promise<string> {
  const settings = getApiSettings();
  const apiKey = settings.geminiApiKey.trim();

  const response = await fetch('/api/generate-prompt', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      categoryName,
      conceptIdea,
      apiKey: apiKey || undefined,
      keyTier: settings.keyTier,
    }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    const message =
      errData?.error ||
      `Erro ${response.status}: Falha ao consultar o servidor Gemini.`;
    throw new Error(message);
  }

  const data = await response.json();
  if (!data?.prompt) {
    throw new Error('Nenhum prompt retornado pela API do Gemini.');
  }

  return data.prompt.trim();
}


export type RemotePage = {
  content: string;
  provider: string;
  isDocument: boolean;
};

type Attempt = {
  provider: string;
  url: string;
  parse: (response: Response) => Promise<{ content: string; isDocument: boolean }>;
};

const parseText = async (response: Response) => ({
  content: await response.text(),
  isDocument: true
});

const parseAllOrigins = async (response: Response) => {
  const data = await response.json() as { contents?: string };
  if (!data.contents) throw new Error('Proxy returned no page contents.');
  return { content: data.contents, isDocument: true };
};

const parseJina = async (response: Response) => ({
  content: await response.text(),
  isDocument: false
});

export const fetchRemotePage = async (targetUrl: string, signal?: AbortSignal, configuredProxy?: string): Promise<RemotePage> => {
  const customProxy = configuredProxy || import.meta.env.VITE_WIREBOX_PROXY_URL as string | undefined;
  const attempts: Attempt[] = [
    { provider: 'direct', url: targetUrl, parse: parseText },
    ...(customProxy ? [{ provider: 'custom-proxy', url: `${customProxy}${customProxy.includes('?') ? '&' : '?'}url=${encodeURIComponent(targetUrl)}`, parse: parseText }] : []),
    { provider: 'allorigins', url: `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`, parse: parseAllOrigins },
    { provider: 'codetabs', url: `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`, parse: parseText },
    { provider: 'jina-reader', url: `https://r.jina.ai/${targetUrl}`, parse: parseJina }
  ];
  const errors: string[] = [];

  for (const attempt of attempts) {
    try {
      const response = await fetch(attempt.url, { signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await attempt.parse(response);
      if (!result.content.trim()) throw new Error('Empty response');
      return { ...result, provider: attempt.provider };
    } catch (error) {
      errors.push(`${attempt.provider}: ${error instanceof Error ? error.message : 'request failed'}`);
    }
  }

  throw new Error(`All WireBox CORS routes failed. ${errors.join(' | ')}`);
};

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

const parseJina = async (response: Response) => ({
  content: await response.text(),
  isDocument: false
});

const escapeHtml = (value: string) => value.replace(/[&<>]/g, char => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;'
}[char] || char));

export const renderReaderMarkdown = (markdown: string, title = 'WireBox Reader') => {
  const body = markdown.split('\n').map(line => {
    const safeLine = escapeHtml(line.trim());
    if (!safeLine) return '';
    if (safeLine.startsWith('#')) {
      const heading = safeLine.replace(/^#+\s*/, '');
      return `<h2>${heading}</h2>`;
    }
    if (safeLine.startsWith('- ') || safeLine.startsWith('* ')) {
      return `<li>${safeLine.slice(2)}</li>`;
    }
    return `<p>${safeLine}</p>`;
  }).join('\n');

  return `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title><style>body{font-family:system-ui,sans-serif;max-width:860px;margin:0 auto;padding:2rem;line-height:1.65;color:#1e293b;background:#fff}h2{line-height:1.25;color:#0f172a}li{margin:.25rem 0}</style></head><body>${body}</body></html>`;
};

export const fetchRemotePage = async (targetUrl: string, signal?: AbortSignal, configuredProxy?: string): Promise<RemotePage> => {
  const customProxy = configuredProxy || import.meta.env.VITE_WIREBOX_PROXY_URL as string | undefined;
  const attempts: Attempt[] = [
    { provider: 'direct', url: targetUrl, parse: parseText },
    ...(customProxy ? [{ provider: 'custom-proxy', url: `${customProxy}${customProxy.includes('?') ? '&' : '?'}url=${encodeURIComponent(targetUrl)}`, parse: parseText }] : []),
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

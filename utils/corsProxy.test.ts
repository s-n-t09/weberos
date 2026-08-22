import { describe, expect, it } from 'vitest';
import { renderReaderMarkdown } from './corsProxy';

describe('WireBox reader fallback', () => {
  it('renders reader text as readable HTML and escapes markup', () => {
    const html = renderReaderMarkdown('# DuckDuckGo\n<script>alert(1)</script>');
    expect(html).toContain('<h2>DuckDuckGo</h2>');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).not.toContain('<pre');
  });
});

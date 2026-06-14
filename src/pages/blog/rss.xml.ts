import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const prerender = true;

const siteUrl = 'https://perfsage.com';
const slug = (id: string) => id.replace(/\.mdx?$/, '');

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export const GET: APIRoute = async () => {
  const posts = (await getCollection('blog', ({ data }) => !data.draft)).sort(
    (a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime(),
  );

  const items = posts
    .map((post) => {
      const postSlug = slug(post.id);
      const url = `${siteUrl}/blog/${postSlug}/`;
      const pubDate = post.data.pubDate.toUTCString();
      return `    <item>
      <title>${escapeXml(post.data.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description>${escapeXml(post.data.description)}</description>
      <pubDate>${pubDate}</pubDate>
      <author>${escapeXml(post.data.author)}</author>
    </item>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>PerfSage Field Notes</title>
    <link>${siteUrl}/blog/</link>
    <description>Performance engineering — JMeter analysis, p99 tail latency, SLO gates, Kubernetes RCA, and SRE lessons.</description>
    <language>en-us</language>
    <lastBuildDate>${posts[0]?.data.pubDate.toUTCString() ?? new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteUrl}/blog/rss.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};

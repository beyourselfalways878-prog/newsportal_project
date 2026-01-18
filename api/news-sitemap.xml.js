import { escapeXml, getSiteUrl, getSupabaseAdminReadClient } from './_supabase.js';

export default async function handler(req, res) {
  try {
    const siteUrl = getSiteUrl(req);
    const supabase = getSupabaseAdminReadClient();

    // Fetch articles published in the last 48 hours
    const since = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

    const { data: articles, error } = await supabase
      .from('articles')
      .select('id, title_hi, title, published_at, author')
      .gte('published_at', since)
      .order('published_at', { ascending: false })
      .limit(1000);

    if (error) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      res.end(`<?xml version="1.0" encoding="UTF-8"?><error>${escapeXml(error.message)}</error>`);
      return;
    }

    const urlEntries = (articles || []).map((a) => {
      const title = a.title_hi || a.title || '';
      const pubDate = a.published_at ? new Date(a.published_at).toISOString() : undefined;
      return {
        loc: `${siteUrl}/article/${a.id}`,
        title,
        pubDate,
        author: a.author || '24x7 Indian News',
      };
    });

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${urlEntries
  .map((u) => {
    const parts = [
      `<url>`,
      `<loc>${escapeXml(u.loc)}</loc>`,
      `<news:news>`,
      `<news:publication>`,
      `<news:name>24x7 Indian News</news:name>`,
      `<news:language>hi</news:language>`,
      `</news:publication>`,
      `<news:publication_date>${escapeXml(u.pubDate)}</news:publication_date>`,
      `<news:title>${escapeXml(u.title)}</news:title>`,
      u.author ? `<news:genres>PressRelease</news:genres>` : '',
      `</news:news>`,
      `</url>`,
    ].filter(Boolean);

    return parts.join('');
  })
  .join('\n')}
</urlset>`;

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    res.end(xml);
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.end(`<?xml version="1.0" encoding="UTF-8"?><error>${escapeXml(err?.message || 'Unknown error')}</error>`);
  }
}

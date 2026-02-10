/**
 * XSL Stylesheet for Sitemaps
 *
 * Transforms sitemap XML into a styled HTML page in browsers.
 * Uses Astra design tokens for consistent branding.
 */

import { getConfig } from '@/core/config';

export const revalidate = 3600;

export async function GET() {
  const config = await getConfig();
  const siteName = config.site.name;
  const primary600 = (config.tokens.colors.primaryPalette[600] as string) || '#4f46e5';
  const primary800 = (config.tokens.colors.primaryPalette[800] as string) || '#3730a3';
  const fontFamily = config.tokens.typography.fontFamily.sans;

  const xsl = `<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xhtml="http://www.w3.org/1999/xhtml"
  exclude-result-prefixes="sitemap xhtml">

  <xsl:output method="html" indent="yes" encoding="UTF-8" />

  <xsl:template match="/">
    <html lang="en">
      <head>
        <title>Sitemap — <xsl:value-of select="'${siteName}'" /></title>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

          body {
            font-family: ${fontFamily};
            background: #f8fafc;
            color: #0f172a;
            line-height: 1.6;
            -webkit-font-smoothing: antialiased;
          }

          .header {
            background: linear-gradient(135deg, ${primary600}, ${primary800});
            color: #fff;
            padding: 2.5rem 1.5rem;
            text-align: center;
          }
          .header h1 {
            font-size: 1.75rem;
            font-weight: 700;
            margin-bottom: 0.25rem;
          }
          .header p {
            opacity: 0.85;
            font-size: 0.95rem;
          }

          .container {
            max-width: 960px;
            margin: -1.5rem auto 2rem;
            padding: 0 1rem;
          }

          .card {
            background: #fff;
            border-radius: 0.75rem;
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
            overflow: hidden;
          }

          .card-header {
            padding: 1rem 1.5rem;
            border-bottom: 1px solid #e2e8f0;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .card-header h2 {
            font-size: 1rem;
            font-weight: 600;
            color: #334155;
          }
          .badge {
            display: inline-flex;
            align-items: center;
            padding: 0.2rem 0.65rem;
            border-radius: 9999px;
            font-size: 0.75rem;
            font-weight: 600;
            background: ${primary600};
            color: #fff;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 0.875rem;
          }
          thead th {
            text-align: left;
            padding: 0.75rem 1.5rem;
            font-weight: 600;
            color: #64748b;
            font-size: 0.75rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            border-bottom: 1px solid #e2e8f0;
          }
          tbody tr {
            border-bottom: 1px solid #f1f5f9;
            transition: background 0.15s;
          }
          tbody tr:hover {
            background: #f8fafc;
          }
          tbody tr:last-child {
            border-bottom: none;
          }
          tbody td {
            padding: 0.65rem 1.5rem;
            vertical-align: middle;
          }
          td a {
            color: ${primary600};
            text-decoration: none;
            word-break: break-all;
          }
          td a:hover {
            text-decoration: underline;
          }

          .priority {
            display: inline-flex;
            align-items: center;
            padding: 0.15rem 0.5rem;
            border-radius: 0.25rem;
            font-size: 0.75rem;
            font-weight: 600;
          }
          .priority-high { background: #dcfce7; color: #15803d; }
          .priority-med  { background: #e0e7ff; color: #4338ca; }
          .priority-low  { background: #f1f5f9; color: #64748b; }

          .footer {
            text-align: center;
            padding: 1rem;
            font-size: 0.8rem;
            color: #94a3b8;
          }

          @media (max-width: 640px) {
            .header { padding: 1.5rem 1rem; }
            .header h1 { font-size: 1.35rem; }
            thead { display: none; }
            tbody tr { display: block; padding: 0.75rem 1rem; }
            tbody td { display: block; padding: 0.15rem 0; }
            tbody td::before {
              content: attr(data-label);
              font-weight: 600;
              color: #64748b;
              font-size: 0.7rem;
              text-transform: uppercase;
              display: block;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Sitemap</h1>
          <p><xsl:value-of select="'${siteName}'" /></p>
        </div>

        <div class="container">
          <!-- Sitemap Index -->
          <xsl:if test="sitemap:sitemapindex">
            <div class="card">
              <div class="card-header">
                <h2>Sub-Sitemaps</h2>
                <span class="badge"><xsl:value-of select="count(sitemap:sitemapindex/sitemap:sitemap)" /> sitemaps</span>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Sitemap</th>
                  </tr>
                </thead>
                <tbody>
                  <xsl:for-each select="sitemap:sitemapindex/sitemap:sitemap">
                    <tr>
                      <td data-label="URL">
                        <a href="{sitemap:loc}"><xsl:value-of select="sitemap:loc" /></a>
                      </td>
                    </tr>
                  </xsl:for-each>
                </tbody>
              </table>
            </div>
          </xsl:if>

          <!-- URL Set -->
          <xsl:if test="sitemap:urlset">
            <div class="card">
              <div class="card-header">
                <h2>URLs</h2>
                <span class="badge"><xsl:value-of select="count(sitemap:urlset/sitemap:url)" /> URLs</span>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>URL</th>
                    <th>Last Modified</th>
                    <th>Priority</th>
                  </tr>
                </thead>
                <tbody>
                  <xsl:for-each select="sitemap:urlset/sitemap:url">
                    <tr>
                      <td data-label="URL">
                        <a href="{sitemap:loc}"><xsl:value-of select="sitemap:loc" /></a>
                      </td>
                      <td data-label="Last Modified">
                        <xsl:value-of select="sitemap:lastmod" />
                      </td>
                      <td data-label="Priority">
                        <xsl:choose>
                          <xsl:when test="sitemap:priority &gt;= 0.8">
                            <span class="priority priority-high"><xsl:value-of select="sitemap:priority" /></span>
                          </xsl:when>
                          <xsl:when test="sitemap:priority &gt;= 0.5">
                            <span class="priority priority-med"><xsl:value-of select="sitemap:priority" /></span>
                          </xsl:when>
                          <xsl:otherwise>
                            <span class="priority priority-low"><xsl:value-of select="sitemap:priority" /></span>
                          </xsl:otherwise>
                        </xsl:choose>
                      </td>
                    </tr>
                  </xsl:for-each>
                </tbody>
              </table>
            </div>
          </xsl:if>

          <div class="footer">
            Generated by <xsl:value-of select="'${siteName}'" />
          </div>
        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>`;

  return new Response(xsl, {
    status: 200,
    headers: {
      'Content-Type': 'application/xslt+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
}

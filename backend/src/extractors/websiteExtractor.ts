import axios from 'axios';
import * as cheerio from 'cheerio';
import { ExtractionResult, ExtractionStatus } from '../types/index.js';
import { config } from '../config/index.js';

export class WebsiteExtractor {
  private static visitedUrls = new Set<string>();

  // Regular expressions for public business contact discovery
  private static emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  private static phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/g;
  private static linkedinRegex = /https?:\/\/(?:www\.)?linkedin\.com\/(?:company|school)\/[a-zA-Z0-9_-]+/i;

  // Filter common asset / tracking file extensions that look like emails
  private static invalidEmailExtensions = new Set([
    'png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'css', 'js', 'woff', 'woff2', 'ico'
  ]);

  /**
   * Fast robots.txt check to ensure crawling is permitted
   */
  static async isAllowedByRobots(urlStr: string): Promise<boolean> {
    try {
      const parsed = new URL(urlStr);
      const robotsUrl = `${parsed.protocol}//${parsed.host}/robots.txt`;
      const res = await axios.get(robotsUrl, {
        timeout: 4000,
        headers: { 'User-Agent': config.extraction.userAgent },
        validateStatus: () => true,
      });

      if (res.status === 200 && typeof res.data === 'string') {
        const text = res.data.toLowerCase();
        // Basic check for Disallow: /
        if (text.includes('user-agent: *') && text.includes('disallow: /') && !text.includes('disallow: /admin')) {
          // Check if specific Disallow: / on its own line
          const lines = text.split('\n').map(l => l.trim());
          const isFullDisallow = lines.some(l => l === 'disallow: /');
          if (isFullDisallow) return false;
        }
      }
      return true;
    } catch {
      return true; // Fail open if robots.txt unreachable
    }
  }

  /**
   * Extracts business details from website URL and its contact page
   */
  static async extract(targetUrl: string): Promise<ExtractionResult> {
    if (!targetUrl || !targetUrl.startsWith('http')) {
      return {
        url: targetUrl,
        emails: [],
        phones: [],
        status: 'FAILED',
        errorMessage: 'Invalid URL scheme',
      };
    }

    try {
      // 1. Robots.txt check
      const allowed = await this.isAllowedByRobots(targetUrl);
      if (!allowed) {
        return {
          url: targetUrl,
          emails: [],
          phones: [],
          status: 'BLOCKED',
          errorMessage: 'Crawling prohibited by site robots.txt',
        };
      }

      // 2. Fetch Homepage HTML
      const homepageHtml = await this.fetchHtml(targetUrl);
      if (!homepageHtml) {
        return {
          url: targetUrl,
          emails: [],
          phones: [],
          status: 'FAILED',
          errorMessage: 'Unable to retrieve homepage content or response empty',
        };
      }

      const $ = cheerio.load(homepageHtml);
      const parsedUrl = new URL(targetUrl);
      const baseDomain = parsedUrl.hostname.replace(/^www\./, '');

      // Identify Company Name
      const metaOgTitle = $('meta[property="og:site_name"]').attr('content') || $('meta[property="og:title"]').attr('content');
      const pageTitle = $('title').text().trim();
      const h1 = $('h1').first().text().trim();
      const companyName = metaOgTitle || (pageTitle ? pageTitle.split(/[-–|:•]/)[0].trim() : '') || h1;

      // Business description
      const metaDesc = $('meta[name="description"]').attr('content') ||
                         $('meta[property="og:description"]').attr('content') ||
                         $('p').first().text().trim();

      // Find LinkedIn and Contact page URLs
      let contactPageUrl: string | undefined;
      let linkedinUrl: string | undefined;
      const discoveredEmails = new Set<string>();
      const discoveredPhones = new Set<string>();
      const services = new Set<string>();

      // Scan all anchor tags
      $('a').each((_, elem) => {
        const href = $(elem).attr('href');
        if (!href) return;

        // Check for mailto:
        if (href.startsWith('mailto:')) {
          const rawEmail = href.replace('mailto:', '').split('?')[0].trim();
          if (this.isValidEmail(rawEmail)) {
            discoveredEmails.add(rawEmail.toLowerCase());
          }
        }

        // Check for tel:
        if (href.startsWith('tel:')) {
          const rawTel = href.replace('tel:', '').trim();
          if (rawTel.length >= 6) {
            discoveredPhones.add(rawTel);
          }
        }

        // Check for LinkedIn
        if (!linkedinUrl && this.linkedinRegex.test(href)) {
          linkedinUrl = href.split('?')[0];
        }

        // Identify Contact Page Link
        const anchorText = $(elem).text().toLowerCase().trim();
        const lowerHref = href.toLowerCase();
        if (
          !contactPageUrl &&
          (anchorText.includes('contact') || anchorText.includes('get in touch') || lowerHref.includes('/contact'))
        ) {
          try {
            contactPageUrl = new URL(href, targetUrl).toString();
          } catch {}
        }
      });

      // Extract emails and phones from homepage text content
      const homepageText = $('body').text();
      this.extractMatches(homepageText, this.emailRegex, discoveredEmails, (e) => this.isValidEmail(e));
      this.extractMatches(homepageText, this.phoneRegex, discoveredPhones, (p) => p.replace(/\D/g, '').length >= 7);

      // Extract services or menu items
      $('nav a, .services a, footer a').each((_, elem) => {
        const txt = $(elem).text().trim();
        if (txt.length > 3 && txt.length < 35 && !txt.includes('Privacy') && !txt.includes('Terms')) {
          services.add(txt);
        }
      });

      // 3. If contact page found, visit it to get more specific emails and addresses
      let extractedAddress: string | undefined;

      // Extract address from homepage schema.org or footer first
      const schemaScript = $('script[type="application/ld+json"]').html();
      if (schemaScript) {
        try {
          const parsedSchema = JSON.parse(schemaScript);
          const addressObj = parsedSchema.address || parsedSchema?.['@graph']?.find((g: any) => g.address)?.address;
          if (addressObj) {
            extractedAddress = typeof addressObj === 'string'
              ? addressObj
              : `${addressObj.streetAddress || ''}, ${addressObj.addressLocality || ''}, ${addressObj.postalCode || ''}, ${addressObj.addressCountry || ''}`.replace(/^, /, '').trim();
          }
        } catch {}
      }

      if (contactPageUrl && contactPageUrl !== targetUrl) {
        try {
          const contactHtml = await this.fetchHtml(contactPageUrl);
          if (contactHtml) {
            const $contact = cheerio.load(contactHtml);
            const contactText = $contact('body').text();

            $contact('a[href^="mailto:"]').each((_, elem) => {
              const raw = $contact(elem).attr('href')?.replace('mailto:', '').split('?')[0].trim();
              if (raw && this.isValidEmail(raw)) discoveredEmails.add(raw.toLowerCase());
            });

            $contact('a[href^="tel:"]').each((_, elem) => {
              const raw = $contact(elem).attr('href')?.replace('tel:', '').trim();
              if (raw && raw.length >= 6) discoveredPhones.add(raw);
            });

            this.extractMatches(contactText, this.emailRegex, discoveredEmails, (e) => this.isValidEmail(e));
            this.extractMatches(contactText, this.phoneRegex, discoveredPhones, (p) => p.replace(/\D/g, '').length >= 7);

            if (!extractedAddress) {
              const addressElem = $contact('address').first().text().trim();
              if (addressElem) {
                extractedAddress = addressElem.replace(/\s+/g, ' ');
              }
            }
          }
        } catch (err: any) {
          console.warn(`[WebsiteExtractor] Failed to crawl contact page ${contactPageUrl}:`, err.message);
        }
      }

      return {
        url: targetUrl,
        companyName: companyName || undefined,
        businessDescription: metaDesc ? metaDesc.slice(0, 500) : undefined,
        emails: Array.from(discoveredEmails),
        phones: Array.from(discoveredPhones).slice(0, 3),
        address: extractedAddress,
        contactPageUrl,
        linkedinUrl,
        services: Array.from(services).slice(0, 6),
        status: 'COMPLETED',
      };
    } catch (err: any) {
      return {
        url: targetUrl,
        emails: [],
        phones: [],
        status: err.response?.status === 403 ? 'BLOCKED' : 'FAILED',
        errorMessage: err.message || 'Extraction error',
      };
    }
  }

  private static async fetchHtml(url: string): Promise<string | null> {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': config.extraction.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        timeout: config.extraction.timeoutMs,
        maxRedirects: 4,
        maxContentLength: config.extraction.maxContentLength,
        validateStatus: (s) => s >= 200 && s < 400,
      });

      return typeof response.data === 'string' ? response.data : null;
    } catch {
      return null;
    }
  }

  private static isValidEmail(email: string): boolean {
    if (!email || email.length < 5 || !email.includes('@')) return false;
    const ext = email.split('.').pop()?.toLowerCase();
    if (ext && this.invalidEmailExtensions.has(ext)) return false;
    // Check basic email format
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  private static extractMatches(
    text: string,
    regex: RegExp,
    set: Set<string>,
    filterFn: (match: string) => boolean
  ) {
    const matches = text.match(regex);
    if (matches) {
      for (const m of matches) {
        const trimmed = m.trim();
        if (filterFn(trimmed)) {
          set.add(trimmed);
        }
      }
    }
  }
}

import dns from 'dns';
import { promisify } from 'util';

const dnsLookup = promisify(dns.lookup);

// Aggregators, directory sites, social networks, and scrapers that are NEVER official company websites
const BANNED_DOMAINS = new Set([
  'ghostwritingsolution.com',
  'publishersglobal.com',
  'publishers.org.uk',
  'yelp.com',
  'yelp.co.uk',
  'yellowpages.com',
  'yellowpages.co.uk',
  'yell.com',
  'clutch.co',
  'upcity.com',
  'goodfirms.co',
  'bark.com',
  'checkatrade.com',
  'trustpilot.com',
  'tripadvisor.com',
  'facebook.com',
  'instagram.com',
  'linkedin.com',
  'twitter.com',
  'x.com',
  'youtube.com',
  'medium.com',
  'quora.com',
  'reddit.com',
  'wikipedia.org',
  'duckduckgo.com',
  'google.com',
  'google.co.uk',
  'bing.com',
  'yahoo.com',
]);

const BANNED_PATH_PATTERNS = [
  /\/blog\//i,
  /\/directory\//i,
  /\/member\//i,
  /\/article\//i,
  /\/best-/i,
  /\/top-/i,
  /\/list-of-/i,
];

export class DomainVerifier {
  private static cache = new Map<string, boolean>();

  /**
   * Verifies whether a website URL is a genuine official corporate domain
   * and resolves to a real IP address in public DNS.
   */
  static async isDomainResolvable(urlStr?: string | null): Promise<boolean> {
    if (!urlStr || typeof urlStr !== 'string' || !urlStr.startsWith('http')) {
      return false;
    }

    try {
      const parsed = new URL(urlStr);
      let hostname = parsed.hostname.toLowerCase();

      // Check banned domains (directories/social/blogs)
      for (const banned of BANNED_DOMAINS) {
        if (hostname === banned || hostname.endsWith(`.${banned}`)) {
          return false;
        }
      }

      // Check banned path patterns (listicles, articles, member pages)
      for (const pattern of BANNED_PATH_PATTERNS) {
        if (pattern.test(parsed.pathname)) {
          return false;
        }
      }

      // Check DNS cache
      if (this.cache.has(hostname)) {
        return this.cache.get(hostname)!;
      }

      // Perform real DNS lookup
      try {
        await dnsLookup(hostname);
        this.cache.set(hostname, true);
        return true;
      } catch (err: any) {
        // If no www, try adding www.
        if (!hostname.startsWith('www.')) {
          try {
            await dnsLookup(`www.${hostname}`);
            this.cache.set(hostname, true);
            return true;
          } catch {
            // failed
          }
        }
        this.cache.set(hostname, false);
        return false;
      }
    } catch {
      return false;
    }
  }

  /**
   * Cleans a website URL and returns undefined if the domain is a directory,
   * blog article, or does not exist in public DNS.
   */
  static async filterValidWebsite(urlStr?: string | null): Promise<string | undefined> {
    if (!urlStr) return undefined;

    const isValid = await this.isDomainResolvable(urlStr);
    if (!isValid) return undefined;

    try {
      const parsed = new URL(urlStr);
      // Clean query params & hash
      parsed.search = '';
      parsed.hash = '';
      let cleanUrl = parsed.toString();
      if (cleanUrl.endsWith('/') && parsed.pathname === '/') {
        cleanUrl = cleanUrl.slice(0, -1);
      }
      return cleanUrl;
    } catch {
      return undefined;
    }
  }
}

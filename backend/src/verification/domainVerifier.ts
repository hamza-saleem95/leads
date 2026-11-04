import { promises as dnsPromises } from 'dns';

const resolver = new dnsPromises.Resolver();
resolver.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);

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
  private static cache = new Map<string, string | null>();

  /**
   * Verifies whether a website URL is a genuine official corporate domain
   * and resolves to a real IP address in public DNS.
   * Returns normalized resolvable hostname or null.
   */
  static async resolveDomain(urlStr?: string | null): Promise<string | null> {
    if (!urlStr || typeof urlStr !== 'string' || !urlStr.startsWith('http')) {
      return null;
    }

    try {
      const parsed = new URL(urlStr);
      let hostname = parsed.hostname.toLowerCase();

      // Check banned domains (directories/social/blogs)
      for (const banned of BANNED_DOMAINS) {
        if (hostname === banned || hostname.endsWith(`.${banned}`)) {
          return null;
        }
      }

      // Check banned path patterns (listicles, articles, member pages)
      for (const pattern of BANNED_PATH_PATTERNS) {
        if (pattern.test(parsed.pathname)) {
          return null;
        }
      }

      // Check cache
      if (this.cache.has(hostname)) {
        return this.cache.get(hostname)!;
      }

      // Try resolving direct hostname
      try {
        const ips = await resolver.resolve4(hostname);
        if (ips && ips.length > 0) {
          this.cache.set(hostname, hostname);
          return hostname;
        }
      } catch {
        // Fallback to www. if not already present
        if (!hostname.startsWith('www.')) {
          try {
            const wwwHost = `www.${hostname}`;
            const ips = await resolver.resolve4(wwwHost);
            if (ips && ips.length > 0) {
              this.cache.set(hostname, wwwHost);
              return wwwHost;
            }
          } catch {
            // failed
          }
        }
      }

      this.cache.set(hostname, null);
      return null;
    } catch {
      return null;
    }
  }

  static async isDomainResolvable(urlStr?: string | null): Promise<boolean> {
    const res = await this.resolveDomain(urlStr);
    return res !== null;
  }

  /**
   * Cleans a website URL and returns undefined if the domain is a directory,
   * blog article, or does not exist in public DNS.
   */
  static async filterValidWebsite(urlStr?: string | null): Promise<string | undefined> {
    if (!urlStr) return undefined;

    const resolvedHost = await this.resolveDomain(urlStr);
    if (!resolvedHost) return undefined;

    try {
      const parsed = new URL(urlStr);
      parsed.hostname = resolvedHost;
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

/**
 * Data Normalization Engine
 * Normalizes company names, domains, emails, phone numbers, and addresses.
 */

export class DataNormalizer {
  /**
   * Normalizes a website URL to its base clean domain
   * e.g. "https://www.example.co.uk/about?ref=1" -> "example.co.uk"
   */
  static normalizeDomain(urlOrDomain: string | null | undefined): string {
    if (!urlOrDomain) return '';
    let domain = urlOrDomain.trim().toLowerCase();

    // Remove protocol
    domain = domain.replace(/^(https?:\/\/)/, '');
    // Remove port and path / query
    domain = domain.split('/')[0].split('?')[0].split('#')[0].split(':')[0];
    // Remove www prefix
    domain = domain.replace(/^www\./, '');
    return domain.trim();
  }

  /**
   * Normalizes company name for comparison:
   * Strips corporate suffixes (LLC, Inc, Ltd, etc.), special characters, excess whitespace
   */
  static normalizeCompanyName(name: string | null | undefined): string {
    if (!name) return '';
    let clean = name.toLowerCase().trim();

    // Remove common corporate suffixes
    const suffixes = [
      /\b(llc|l\.l\.c\.)\b/g,
      /\b(inc|inc\.|incorporated)\b/g,
      /\b(ltd|ltd\.|limited)\b/g,
      /\b(corp|corp\.|corporation)\b/g,
      /\b(co|co\.|company)\b/g,
      /\b(gmbh|ag|sarl|sl|bv|pvt|pty)\b/g,
      /\b(group|holdings|enterprises)\b/g,
    ];

    for (const suffix of suffixes) {
      clean = clean.replace(suffix, ' ');
    }

    // Replace punctuation with spaces
    clean = clean.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()@"']/g, ' ');
    // Collapse multiple whitespace
    clean = clean.replace(/\s+/g, ' ').trim();
    return clean;
  }

  /**
   * Normalizes email address
   */
  static normalizeEmail(email: string | null | undefined): string {
    if (!email) return '';
    const clean = email.trim().toLowerCase();
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
    return emailRegex.test(clean) ? clean : '';
  }

  /**
   * Normalizes phone number into standard international digit sequence
   */
  static normalizePhone(phone: string | null | undefined): string {
    if (!phone) return '';
    // Preserve leading plus if international, strip spaces, dashes, parens
    let clean = phone.trim();
    const hasPlus = clean.startsWith('+');
    const digitsOnly = clean.replace(/\D/g, '');
    if (digitsOnly.length < 6) return '';
    return hasPlus ? `+${digitsOnly}` : digitsOnly;
  }

  /**
   * Normalizes postal address string
   */
  static normalizeAddress(address: string | null | undefined): string {
    if (!address) return '';
    let clean = address.toLowerCase().trim();

    // Standardize road abbreviations
    clean = clean.replace(/\bstreet\b/g, 'st')
      .replace(/\bavenue\b/g, 'ave')
      .replace(/\bboulevard\b/g, 'blvd')
      .replace(/\broad\b/g, 'rd')
      .replace(/\bdrive\b/g, 'dr')
      .replace(/\blane\b/g, 'ln')
      .replace(/\bsuite\b/g, 'ste')
      .replace(/\bfloor\b/g, 'fl')
      .replace(/[,.#]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    return clean;
  }
}

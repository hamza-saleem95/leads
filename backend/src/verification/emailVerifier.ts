import dns from 'dns';
import { promisify } from 'util';
import axios from 'axios';
import { EmailStatus } from '../types/index.js';
import { config } from '../config/index.js';

const resolveMx = promisify(dns.resolveMx);

export interface EmailVerificationResult {
  email: string;
  status: EmailStatus;
  isDeliverable: boolean;
  isFreeMail: boolean;
  mxRecordsFound: boolean;
  provider?: string;
  reason?: string;
}

export class EmailVerifier {
  private static freeMailDomains = new Set([
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com',
    'icloud.com', 'mail.com', 'zoho.com', 'protonmail.com', 'yandex.com'
  ]);

  /**
   * Verifies an email address using syntax, MX check, and third-party API if configured
   */
  static async verify(email: string | null | undefined): Promise<EmailVerificationResult> {
    if (!email || !email.includes('@')) {
      return {
        email: email || '',
        status: 'INVALID',
        isDeliverable: false,
        isFreeMail: false,
        mxRecordsFound: false,
        reason: 'Malformed or missing email format',
      };
    }

    const cleanEmail = email.trim().toLowerCase();
    const parts = cleanEmail.split('@');
    if (parts.length !== 2) {
      return {
        email: cleanEmail,
        status: 'INVALID',
        isDeliverable: false,
        isFreeMail: false,
        mxRecordsFound: false,
        reason: 'Invalid email parts',
      };
    }

    const domain = parts[1];
    const isFreeMail = this.freeMailDomains.has(domain);

    // If Hunter / Email Verification API key is configured, use it
    if (config.providers.emailVerification.apiKey) {
      try {
        const response = await axios.get('https://api.hunter.io/v2/email-verifier', {
          params: {
            email: cleanEmail,
            api_key: config.providers.emailVerification.apiKey,
          },
          timeout: 6000,
        });

        const hunterData = response.data?.data;
        if (hunterData) {
          const resultStatus: EmailStatus = hunterData.result === 'deliverable'
            ? 'VERIFIED'
            : hunterData.result === 'undeliverable'
              ? 'INVALID'
              : 'UNVERIFIED';

          return {
            email: cleanEmail,
            status: resultStatus,
            isDeliverable: hunterData.result === 'deliverable',
            isFreeMail: Boolean(hunterData.disposable || isFreeMail),
            mxRecordsFound: Boolean(hunterData.mx_records),
            provider: 'hunter.io',
            reason: `Hunter result: ${hunterData.result} (score: ${hunterData.score})`,
          };
        }
      } catch (err: any) {
        console.warn('[EmailVerifier] Hunter API check failed, falling back to MX lookup:', err.message);
      }
    }

    // Direct DNS MX lookup verification
    try {
      const mxRecords = await resolveMx(domain);
      if (mxRecords && mxRecords.length > 0) {
        return {
          email: cleanEmail,
          status: 'UNVERIFIED', // MX verified, but inbox not smtp-probed without auth
          isDeliverable: true,
          isFreeMail,
          mxRecordsFound: true,
          provider: 'dns_mx',
          reason: `Valid MX exchange found (${mxRecords[0].exchange})`,
        };
      } else {
        return {
          email: cleanEmail,
          status: 'INVALID',
          isDeliverable: false,
          isFreeMail,
          mxRecordsFound: false,
          provider: 'dns_mx',
          reason: 'No mail exchange (MX) records found for domain',
        };
      }
    } catch (err: any) {
      return {
        email: cleanEmail,
        status: 'UNKNOWN',
        isDeliverable: false,
        isFreeMail,
        mxRecordsFound: false,
        provider: 'dns_mx',
        reason: `DNS MX check error: ${err.message}`,
      };
    }
  }
}

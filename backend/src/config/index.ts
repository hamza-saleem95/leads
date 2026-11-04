import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Bypass TLS verification for local proxies / SSL inspection
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

dotenv.config();

// Attempt to load saved keys from persistent database if not in .env
let savedOpenAIKey = process.env.OPENAI_API_KEY || '';
try {
  const dbPath = path.resolve(process.cwd(), 'data', 'app_db.json');
  if (fs.existsSync(dbPath)) {
    const raw = fs.readFileSync(dbPath, 'utf-8');
    const parsed = JSON.parse(raw);
    const cfg = parsed.providerConfigs?.find((p: any) => p.providerName === 'openai');
    if (cfg?.apiKeyEncrypted) {
      savedOpenAIKey = cfg.apiKeyEncrypted;
    }
  }
} catch {}

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  jwtSecret: process.env.JWT_SECRET || 'ai-lead-finder-super-secret-key-change-in-production-2026',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/ai_lead_finder',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',

  openai: {
    apiKey: savedOpenAIKey,
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '2000', 10),
    temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.2'),
  },

  providers: {
    tavily: {
      apiKey: process.env.TAVILY_API_KEY || '',
      baseUrl: 'https://api.tavily.com',
    },
    serpapi: {
      apiKey: process.env.SERPAPI_API_KEY || '',
      baseUrl: 'https://serpapi.com',
    },
    bing: {
      apiKey: process.env.BING_API_KEY || '',
      baseUrl: 'https://api.bing.microsoft.com/v7.0/search',
    },
    googlePlaces: {
      apiKey: process.env.GOOGLE_PLACES_API_KEY || '',
      baseUrl: 'https://maps.googleapis.com/maps/api/place',
    },
    emailVerification: {
      provider: process.env.EMAIL_VERIFIER_PROVIDER || 'hunter',
      apiKey: process.env.EMAIL_VERIFIER_API_KEY || '',
    }
  },

  extraction: {
    timeoutMs: parseInt(process.env.EXTRACTION_TIMEOUT_MS || '12000', 10),
    concurrency: parseInt(process.env.EXTRACTION_CONCURRENCY || '5', 10),
    userAgent: process.env.USER_AGENT || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 AILeadFinderBot/1.0',
    maxContentLength: 5 * 1024 * 1024,
  },

  scoringWeights: {
    industryRelevance: 30,
    locationMatch: 20,
    websiteAvailability: 10,
    emailAvailability: 15,
    phoneAvailability: 10,
    completeness: 10,
    sourceReliability: 5,
  }
};

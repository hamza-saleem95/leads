import { Response } from 'express';
import { z } from 'zod';
import axios from 'axios';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { db } from '../database/db.js';
import { DiscoveryEngine } from '../discovery/discoveryEngine.js';
import { config } from '../config/index.js';

export class SettingsController {
  static async getProviders(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user?.userId || 'user-default-admin-01';
    const configs = await db.getProviderConfigs(userId);
    const allProviders = DiscoveryEngine.getAllProviders();

    // Check OpenAI config
    const openaiCfg = configs.find(c => c.providerName.toLowerCase() === 'openai');
    const openaiConfigured = Boolean(openaiCfg?.apiKeyEncrypted || config.openai.apiKey);
    const openaiMasked = openaiCfg?.apiKeyMasked || (config.openai.apiKey ? `${config.openai.apiKey.slice(0, 7)}****${config.openai.apiKey.slice(-4)}` : null);

    const openaiItem = {
      name: 'openai',
      displayName: 'OpenAI API (GPT-4o-mini)',
      isEnabled: openaiCfg ? openaiCfg.isEnabled : true,
      apiKeyMasked: openaiMasked,
      isConfigured: openaiConfigured,
      testStatus: openaiCfg?.testStatus || (openaiConfigured ? 'CONNECTED' : 'AWAITING_CREDENTIALS'),
      lastTestedAt: openaiCfg?.lastTestedAt || null,
      lastError: openaiCfg?.lastError || null,
    };

    const providerList = allProviders.map(p => {
      const cfg = configs.find(c => c.providerName.toLowerCase() === p.name.toLowerCase());
      return {
        name: p.name,
        displayName: p.displayName,
        isEnabled: cfg ? cfg.isEnabled : true,
        apiKeyMasked: cfg?.apiKeyMasked || (p.isConfigured() ? '********configured********' : null),
        isConfigured: p.isConfigured(),
        testStatus: cfg?.testStatus || (p.isConfigured() ? 'CONNECTED' : 'AWAITING_CREDENTIALS'),
        lastTestedAt: cfg?.lastTestedAt || null,
        lastError: cfg?.lastError || null,
      };
    });

    res.json({
      success: true,
      providers: [openaiItem, ...providerList],
    });
  }

  static async updateProvider(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user?.userId || 'user-default-admin-01';
    const { name } = req.params;
    const { apiKey, isEnabled } = z.object({
      apiKey: z.string().optional(),
      isEnabled: z.boolean().optional(),
    }).parse(req.body);

    const updates: any = {};
    if (isEnabled !== undefined) updates.isEnabled = isEnabled;
    if (apiKey) {
      updates.apiKeyMasked = `${apiKey.slice(0, 7)}****${apiKey.slice(-4)}`;
      updates.apiKeyEncrypted = apiKey;

      // If updating OpenAI, update in runtime config
      if (name.toLowerCase() === 'openai') {
        config.openai.apiKey = apiKey;
      }
    }

    const updated = await db.updateProviderConfig(userId, name, updates);

    await db.createAuditLog({
      userId,
      action: 'PROVIDER_CONFIG_UPDATED',
      entity: 'ProviderConfiguration',
      details: { provider: name, isEnabled },
    });

    res.json({ success: true, config: updated });
  }

  static async testProvider(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user?.userId || 'user-default-admin-01';
    const { name } = req.params;
    const { apiKey } = req.body || {};

    if (name.toLowerCase() === 'openai') {
      const keyToTest = apiKey || config.openai.apiKey;
      if (!keyToTest) {
        res.json({
          success: true,
          result: {
            provider: 'openai',
            status: 'AWAITING_CREDENTIALS',
            message: 'OpenAI API key is missing. Please provide a key starting with sk-...',
          },
        });
        return;
      }

      const start = Date.now();
      try {
        const response = await axios.get('https://api.openai.com/v1/models', {
          headers: { Authorization: `Bearer ${keyToTest}` },
          timeout: 8000,
        });

        const latencyMs = Date.now() - start;
        const testResult = {
          provider: 'openai',
          status: 'CONNECTED',
          message: `OpenAI API connection verified successfully! Model: ${config.openai.model}`,
          latencyMs,
        };

        await db.updateProviderConfig(userId, 'openai', {
          testStatus: 'CONNECTED',
          lastTestedAt: new Date().toISOString(),
          lastError: null,
        });

        res.json({ success: true, result: testResult });
        return;
      } catch (err: any) {
        const latencyMs = Date.now() - start;
        const msg = err.response?.data?.error?.message || err.message || 'Failed to authenticate with OpenAI API';
        const testResult = {
          provider: 'openai',
          status: 'ERROR',
          message: msg,
          latencyMs,
        };

        await db.updateProviderConfig(userId, 'openai', {
          testStatus: 'ERROR',
          lastTestedAt: new Date().toISOString(),
          lastError: msg,
        });

        res.json({ success: true, result: testResult });
        return;
      }
    }

    const providerInstance = DiscoveryEngine.getProvider(name);
    if (!providerInstance) {
      res.status(404).json({ success: false, error: `Provider "${name}" not found` });
      return;
    }

    const testResult = await providerInstance.testConnection(apiKey);

    await db.updateProviderConfig(userId, name, {
      testStatus: testResult.status,
      lastTestedAt: new Date().toISOString(),
      lastError: testResult.status === 'ERROR' ? testResult.message : null,
    });

    res.json({
      success: true,
      result: testResult,
    });
  }

  static async getUsage(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user?.userId || 'user-default-admin-01';
    const stats = await db.getAPIUsageStats(userId);
    res.json({
      success: true,
      usage: stats,
    });
  }

  static async getAuditLogs(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user?.userId || 'user-default-admin-01';
    const logs = await db.getAuditLogs(userId);
    res.json({
      success: true,
      logs,
    });
  }
}

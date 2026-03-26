import { Hono } from 'hono';
import type { Env } from '../index';

const app = new Hono<{ Bindings: Env }>();

// =====================================================
// SYSTEM SETTINGS (Admin only)
// =====================================================

// GET /settings/system - Get system settings (admin only)
app.get('/system', async (c) => {
  const user = c.get('user');
  if (!user || !['admin', 'super_admin', 'director'].includes(user.role)) {
    return c.json({ error: 'Forbidden' }, 403);
  }

  try {
    // Get all system settings from KV or DB
    const settings = await c.env.DB.prepare(`
      SELECT key, value FROM system_settings
    `).all();

    // Convert to object
    const settingsObj: Record<string, string> = {};
    for (const row of settings.results || []) {
      settingsObj[row.key as string] = row.value as string;
    }

    // Return with defaults for missing keys
    return c.json({
      siteName: settingsObj.siteName || 'OHCS E-Library',
      siteDescription: settingsObj.siteDescription || 'Digital knowledge platform for Ghana Civil Service',
      supportEmail: settingsObj.supportEmail || 'support@ohcs.gov.gh',
      siteUrl: settingsObj.siteUrl || 'https://elibrary.ohcs.gov.gh',
      timezone: settingsObj.timezone || 'Africa/Accra',
      language: settingsObj.language || 'en',
      allowRegistration: settingsObj.allowRegistration === 'true',
      requireEmailVerification: settingsObj.requireEmailVerification !== 'false',
      allowPublicAccess: settingsObj.allowPublicAccess === 'true',
      maintenanceMode: settingsObj.maintenanceMode === 'true',
      restrictToGovEmail: settingsObj.restrictToGovEmail !== 'false',
      sessionTimeout: settingsObj.sessionTimeout || '60',
      maxLoginAttempts: settingsObj.maxLoginAttempts || '5',
      lockoutDuration: settingsObj.lockoutDuration || '15',
      passwordMinLength: settingsObj.passwordMinLength || '12',
      requireTwoFactor: settingsObj.requireTwoFactor === 'true',
      requireUppercase: settingsObj.requireUppercase !== 'false',
      requireNumbers: settingsObj.requireNumbers !== 'false',
      requireSymbols: settingsObj.requireSymbols !== 'false',
      passwordExpiry: settingsObj.passwordExpiry || '90',
      emailNotifications: settingsObj.emailNotifications !== 'false',
      pushNotifications: settingsObj.pushNotifications !== 'false',
      smsNotifications: settingsObj.smsNotifications === 'true',
      digestFrequency: settingsObj.digestFrequency || 'daily',
      notifyNewUsers: settingsObj.notifyNewUsers !== 'false',
      notifyNewDocuments: settingsObj.notifyNewDocuments !== 'false',
      notifySecurityAlerts: settingsObj.notifySecurityAlerts !== 'false',
      smtpHost: settingsObj.smtpHost || '',
      smtpPort: settingsObj.smtpPort || '587',
      smtpUsername: settingsObj.smtpUsername || '',
      fromAddress: settingsObj.fromAddress || 'noreply@ohcs.gov.gh',
      fromName: settingsObj.fromName || 'OHCS E-Library',
      smtpEncryption: settingsObj.smtpEncryption || 'tls',
      maxUploadSize: settingsObj.maxUploadSize || '50',
      allowedFileTypes: settingsObj.allowedFileTypes || 'pdf,doc,docx,xls,xlsx,ppt,pptx',
      autoDeleteDays: settingsObj.autoDeleteDays || '0',
      compressUploads: settingsObj.compressUploads !== 'false',
      primaryColor: settingsObj.primaryColor || '#006B3F',
      accentColor: settingsObj.accentColor || '#FCD116',
      darkModeDefault: settingsObj.darkModeDefault === 'true',
      showFooter: settingsObj.showFooter !== 'false',
    });
  } catch (error) {
    console.error('Error fetching system settings:', error);
    return c.json({ error: 'Failed to fetch system settings' }, 500);
  }
});

// PUT /settings/system - Update system settings (admin only)
app.put('/system', async (c) => {
  const user = c.get('user');
  if (!user || !['admin', 'super_admin', 'director'].includes(user.role)) {
    return c.json({ error: 'Forbidden' }, 403);
  }

  try {
    const body = await c.req.json();

    // List of allowed setting keys
    const allowedKeys = [
      'siteName', 'siteDescription', 'supportEmail', 'siteUrl', 'timezone', 'language',
      'allowRegistration', 'requireEmailVerification', 'allowPublicAccess', 'maintenanceMode', 'restrictToGovEmail',
      'sessionTimeout', 'maxLoginAttempts', 'lockoutDuration', 'passwordMinLength', 'requireTwoFactor',
      'requireUppercase', 'requireNumbers', 'requireSymbols', 'passwordExpiry',
      'emailNotifications', 'pushNotifications', 'smsNotifications', 'digestFrequency',
      'notifyNewUsers', 'notifyNewDocuments', 'notifySecurityAlerts',
      'smtpHost', 'smtpPort', 'smtpUsername', 'smtpPassword', 'fromAddress', 'fromName', 'smtpEncryption',
      'maxUploadSize', 'allowedFileTypes', 'autoDeleteDays', 'compressUploads',
      'primaryColor', 'accentColor', 'darkModeDefault', 'showFooter',
    ];

    // Upsert each setting
    for (const key of allowedKeys) {
      if (body[key] !== undefined) {
        const value = typeof body[key] === 'boolean' ? body[key].toString() : String(body[key]);

        await c.env.DB.prepare(`
          INSERT INTO system_settings (key, value, updatedAt, updatedBy)
          VALUES (?, ?, datetime('now'), ?)
          ON CONFLICT(key) DO UPDATE SET value = ?, updatedAt = datetime('now'), updatedBy = ?
        `).bind(key, value, user.id, value, user.id).run();
      }
    }

    return c.json({ success: true });
  } catch (error) {
    console.error('Error updating system settings:', error);
    return c.json({ error: 'Failed to update system settings' }, 500);
  }
});

// =====================================================
// USER SETTINGS (Preferences)
// =====================================================

// GET /settings - Get user settings
app.get('/', async (c) => {
  const user = c.get('user');
  const userId = user?.id;
  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const settings = await c.env.DB.prepare(`
      SELECT * FROM user_settings WHERE userId = ?
    `).bind(userId).first();

    if (!settings) {
      // Create default settings
      const id = crypto.randomUUID();
      await c.env.DB.prepare(`
        INSERT INTO user_settings (id, userId) VALUES (?, ?)
      `).bind(id, userId).run();

      return c.json({
        id,
        userId,
        theme: 'system',
        accentColor: 'green',
        fontSize: 'medium',
        fontFamily: 'system',
        compactMode: false,
        reducedMotion: false,
        highContrast: false,
        readingLineHeight: 'normal',
        readingMaxWidth: 'medium',
        autoScroll: false,
        autoScrollSpeed: 50,
        highlightLinks: true,
        showPageNumbers: true,
        aiEnabled: true,
        aiSuggestions: true,
        aiSummarization: true,
        aiWritingAssist: false,
        aiVoice: 'default',
        aiResponseLength: 'balanced',
        aiAutoComplete: false,
        profileVisibility: 'public',
        showEmail: false,
        showActivity: true,
        allowMessages: 'all',
        allowTagging: true,
        showOnlineStatus: true,
        language: 'en-US',
        timezone: 'Africa/Accra',
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '12h',
        weekStartsOn: 'monday',
        downloadLocation: 'default',
        autoDownload: false,
        downloadQuality: 'original',
        clearCacheOnLogout: false,
        soundEnabled: true,
        soundVolume: 50,
        notificationSound: 'default',
        messageSound: 'default',
        hapticFeedback: true,
        betaFeatures: false,
        developerMode: false
      });
    }

    // Convert SQLite integers to booleans
    return c.json({
      ...settings,
      compactMode: !!settings.compactMode,
      reducedMotion: !!settings.reducedMotion,
      highContrast: !!settings.highContrast,
      autoScroll: !!settings.autoScroll,
      highlightLinks: !!settings.highlightLinks,
      showPageNumbers: !!settings.showPageNumbers,
      aiEnabled: !!settings.aiEnabled,
      aiSuggestions: !!settings.aiSuggestions,
      aiSummarization: !!settings.aiSummarization,
      aiWritingAssist: !!settings.aiWritingAssist,
      aiAutoComplete: !!settings.aiAutoComplete,
      showEmail: !!settings.showEmail,
      showActivity: !!settings.showActivity,
      allowTagging: !!settings.allowTagging,
      showOnlineStatus: !!settings.showOnlineStatus,
      autoDownload: !!settings.autoDownload,
      clearCacheOnLogout: !!settings.clearCacheOnLogout,
      soundEnabled: !!settings.soundEnabled,
      hapticFeedback: !!settings.hapticFeedback,
      betaFeatures: !!settings.betaFeatures,
      developerMode: !!settings.developerMode
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return c.json({ error: 'Failed to fetch settings' }, 500);
  }
});

// PUT /settings - Update user settings
app.put('/', async (c) => {
  const user = c.get('user');
  const userId = user?.id;
  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const body = await c.req.json();

    // Build dynamic update query
    const allowedFields = [
      'theme', 'accentColor', 'fontSize', 'fontFamily', 'compactMode', 'reducedMotion', 'highContrast',
      'readingLineHeight', 'readingMaxWidth', 'autoScroll', 'autoScrollSpeed', 'highlightLinks', 'showPageNumbers',
      'aiEnabled', 'aiSuggestions', 'aiSummarization', 'aiWritingAssist', 'aiVoice', 'aiResponseLength', 'aiAutoComplete',
      'profileVisibility', 'showEmail', 'showActivity', 'allowMessages', 'allowTagging', 'showOnlineStatus',
      'language', 'timezone', 'dateFormat', 'timeFormat', 'weekStartsOn',
      'downloadLocation', 'autoDownload', 'downloadQuality', 'clearCacheOnLogout',
      'soundEnabled', 'soundVolume', 'notificationSound', 'messageSound', 'hapticFeedback',
      'betaFeatures', 'developerMode'
    ];

    const updates: string[] = [];
    const values: any[] = [];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(typeof body[field] === 'boolean' ? (body[field] ? 1 : 0) : body[field]);
      }
    }

    if (updates.length === 0) {
      return c.json({ error: 'No valid fields to update' }, 400);
    }

    updates.push('updatedAt = datetime("now")');
    values.push(userId);

    await c.env.DB.prepare(`
      UPDATE user_settings SET ${updates.join(', ')} WHERE userId = ?
    `).bind(...values).run();

    // Log activity
    await c.env.DB.prepare(`
      INSERT INTO account_activity (id, userId, action, description, status)
      VALUES (?, ?, 'settings_update', 'Updated account settings', 'success')
    `).bind(crypto.randomUUID(), userId).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Error updating settings:', error);
    return c.json({ error: 'Failed to update settings' }, 500);
  }
});

// =====================================================
// SESSIONS
// =====================================================

// GET /settings/sessions - Get user sessions
app.get('/sessions', async (c) => {
  const user = c.get('user');
  const userId = user?.id;
  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const sessions = await c.env.DB.prepare(`
      SELECT * FROM user_sessions
      WHERE userId = ? AND isRevoked = 0
      ORDER BY isCurrent DESC, lastActiveAt DESC
    `).bind(userId).all();

    return c.json({
      sessions: sessions.results.map(s => ({
        ...s,
        isCurrent: !!s.isCurrent,
        isRevoked: !!s.isRevoked
      }))
    });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return c.json({ error: 'Failed to fetch sessions' }, 500);
  }
});

// POST /settings/sessions - Create new session (called on login)
app.post('/sessions', async (c) => {
  const user = c.get('user');
  const userId = user?.id;
  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const body = await c.req.json();
    const id = crypto.randomUUID();

    // Get IP and user agent from request
    const ipAddress = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'Unknown';
    const userAgent = c.req.header('User-Agent') || 'Unknown';

    // Parse user agent for device info
    const deviceInfo = parseUserAgent(userAgent);

    // Mark previous sessions as not current
    await c.env.DB.prepare(`
      UPDATE user_sessions SET isCurrent = 0 WHERE userId = ?
    `).bind(userId).run();

    // Create new session
    await c.env.DB.prepare(`
      INSERT INTO user_sessions (id, userId, deviceName, deviceType, browser, browserVersion, os, osVersion, ipAddress, location, isCurrent, expiresAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now', '+30 days'))
    `).bind(
      id,
      userId,
      body.deviceName || `${deviceInfo.browser} on ${deviceInfo.os}`,
      deviceInfo.deviceType,
      deviceInfo.browser,
      deviceInfo.browserVersion,
      deviceInfo.os,
      deviceInfo.osVersion,
      ipAddress,
      body.location || 'Unknown'
    ).run();

    // Log activity
    await c.env.DB.prepare(`
      INSERT INTO account_activity (id, userId, action, description, ipAddress, deviceInfo, status)
      VALUES (?, ?, 'login', 'Logged in from new device', ?, ?, 'success')
    `).bind(crypto.randomUUID(), userId, ipAddress, userAgent).run();

    return c.json({ success: true, sessionId: id });
  } catch (error) {
    console.error('Error creating session:', error);
    return c.json({ error: 'Failed to create session' }, 500);
  }
});

// DELETE /settings/sessions/:id - Revoke a session
app.delete('/sessions/:id', async (c) => {
  const user = c.get('user');
  const userId = user?.id;
  const sessionId = c.req.param('id');

  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    // Check session belongs to user
    const session = await c.env.DB.prepare(`
      SELECT * FROM user_sessions WHERE id = ? AND userId = ?
    `).bind(sessionId, userId).first();

    if (!session) {
      return c.json({ error: 'Session not found' }, 404);
    }

    await c.env.DB.prepare(`
      UPDATE user_sessions SET isRevoked = 1 WHERE id = ?
    `).bind(sessionId).run();

    // Log activity
    await c.env.DB.prepare(`
      INSERT INTO account_activity (id, userId, action, description, status)
      VALUES (?, ?, 'session_revoke', 'Revoked session from device', 'success')
    `).bind(crypto.randomUUID(), userId).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Error revoking session:', error);
    return c.json({ error: 'Failed to revoke session' }, 500);
  }
});

// DELETE /settings/sessions - Revoke all sessions except current
app.delete('/sessions', async (c) => {
  const user = c.get('user');
  const userId = user?.id;
  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    await c.env.DB.prepare(`
      UPDATE user_sessions SET isRevoked = 1 WHERE userId = ? AND isCurrent = 0
    `).bind(userId).run();

    // Log activity
    await c.env.DB.prepare(`
      INSERT INTO account_activity (id, userId, action, description, status)
      VALUES (?, ?, 'sessions_revoke_all', 'Revoked all other sessions', 'success')
    `).bind(crypto.randomUUID(), userId).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Error revoking sessions:', error);
    return c.json({ error: 'Failed to revoke sessions' }, 500);
  }
});

// =====================================================
// TWO-FACTOR AUTHENTICATION
// =====================================================

// GET /settings/2fa - Get 2FA status
app.get('/2fa', async (c) => {
  const user = c.get('user');
  const userId = user?.id;
  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const twoFa = await c.env.DB.prepare(`
      SELECT isEnabled, backupCodesUsed, updatedAt FROM user_2fa WHERE userId = ?
    `).bind(userId).first();

    if (!twoFa) {
      return c.json({
        isEnabled: false,
        hasBackupCodes: false,
        backupCodesRemaining: 0
      });
    }

    return c.json({
      isEnabled: !!twoFa.isEnabled,
      hasBackupCodes: true,
      backupCodesRemaining: 10 - ((twoFa.backupCodesUsed as number) || 0),
      enabledAt: twoFa.updatedAt
    });
  } catch (error) {
    console.error('Error fetching 2FA status:', error);
    return c.json({ error: 'Failed to fetch 2FA status' }, 500);
  }
});

// POST /settings/2fa/setup - Initialize 2FA setup (returns secret and QR code)
app.post('/2fa/setup', async (c) => {
  const user = c.get('user');
  const userId = user?.id;
  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    // Generate TOTP secret
    const secret = generateTOTPSecret();

    // Get user email for QR code
    const userRecord = await c.env.DB.prepare(`
      SELECT email FROM users WHERE id = ?
    `).bind(userId).first();

    const issuer = 'OHCS E-Library';
    const accountName = (userRecord?.email as string) || 'user@ohcs.gov.gh';
    const otpauthUrl = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(accountName)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;

    // Store secret (not enabled yet)
    const existing = await c.env.DB.prepare(`
      SELECT id FROM user_2fa WHERE userId = ?
    `).bind(userId).first();

    if (existing) {
      await c.env.DB.prepare(`
        UPDATE user_2fa SET secret = ?, isEnabled = 0 WHERE userId = ?
      `).bind(secret, userId).run();
    } else {
      await c.env.DB.prepare(`
        INSERT INTO user_2fa (id, userId, secret, isEnabled) VALUES (?, ?, ?, 0)
      `).bind(crypto.randomUUID(), userId, secret).run();
    }

    return c.json({
      secret,
      otpauthUrl,
      qrCodeDataUrl: await generateQRCodeDataUrl(otpauthUrl)
    });
  } catch (error) {
    console.error('Error setting up 2FA:', error);
    return c.json({ error: 'Failed to setup 2FA' }, 500);
  }
});

// POST /settings/2fa/verify - Verify and enable 2FA
app.post('/2fa/verify', async (c) => {
  const user = c.get('user');
  const userId = user?.id;
  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const { code } = await c.req.json();

    const twoFa = await c.env.DB.prepare(`
      SELECT secret FROM user_2fa WHERE userId = ?
    `).bind(userId).first();

    if (!twoFa) {
      return c.json({ error: '2FA not initialized' }, 400);
    }

    // Verify TOTP code
    const isValid = await verifyTOTP(twoFa.secret as string, code);

    if (!isValid) {
      return c.json({ error: 'Invalid verification code. Please try again.' }, 400);
    }

    // Generate backup codes
    const backupCodes = await generateBackupCodes(10);

    await c.env.DB.prepare(`
      UPDATE user_2fa SET isEnabled = 1, backupCodes = ?, enabledAt = datetime('now') WHERE userId = ?
    `).bind(JSON.stringify(backupCodes.hashed), userId).run();

    // Log activity
    await c.env.DB.prepare(`
      INSERT INTO account_activity (id, userId, action, description, status, riskLevel)
      VALUES (?, ?, '2fa_enabled', 'Enabled two-factor authentication', 'success', 'low')
    `).bind(crypto.randomUUID(), userId).run();

    return c.json({
      success: true,
      backupCodes: backupCodes.plain // Return plain codes once for user to save
    });
  } catch (error) {
    console.error('Error verifying 2FA:', error);
    return c.json({ error: 'Failed to verify 2FA' }, 500);
  }
});

// DELETE /settings/2fa - Disable 2FA
app.delete('/2fa', async (c) => {
  const user = c.get('user');
  const userId = user?.id;
  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const { password, code } = await c.req.json();

    // Verify password or code before disabling
    // For now, just require the code
    const twoFa = await c.env.DB.prepare(`
      SELECT secret FROM user_2fa WHERE userId = ? AND isEnabled = 1
    `).bind(userId).first();

    if (!twoFa) {
      return c.json({ error: '2FA not enabled' }, 400);
    }

    // Verify TOTP code
    const isValid = await verifyTOTP(twoFa.secret as string, code);
    if (!isValid) {
      return c.json({ error: 'Invalid verification code. Please enter a valid code from your authenticator app.' }, 400);
    }

    await c.env.DB.prepare(`
      DELETE FROM user_2fa WHERE userId = ?
    `).bind(userId).run();

    // Log activity
    await c.env.DB.prepare(`
      INSERT INTO account_activity (id, userId, action, description, status, riskLevel)
      VALUES (?, ?, '2fa_disabled', 'Disabled two-factor authentication', 'success', 'medium')
    `).bind(crypto.randomUUID(), userId).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Error disabling 2FA:', error);
    return c.json({ error: 'Failed to disable 2FA' }, 500);
  }
});

// POST /settings/2fa/backup/verify - Verify a backup code (e.g., during login)
app.post('/2fa/backup/verify', async (c) => {
  const user = c.get('user');
  const userId = user?.id;
  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const { code } = await c.req.json();

    const twoFa = await c.env.DB.prepare(`
      SELECT backupCodes, backupCodesUsed FROM user_2fa WHERE userId = ? AND isEnabled = 1
    `).bind(userId).first();

    if (!twoFa || !twoFa.backupCodes) {
      return c.json({ error: '2FA not enabled or no backup codes' }, 400);
    }

    const hashedCodes = JSON.parse(twoFa.backupCodes as string) as string[];
    const codeIndex = await verifyBackupCode(code, hashedCodes);

    if (codeIndex === -1) {
      return c.json({ error: 'Invalid backup code' }, 400);
    }

    // Mark code as used by removing it
    hashedCodes.splice(codeIndex, 1);
    const usedCount = ((twoFa.backupCodesUsed as number) || 0) + 1;

    await c.env.DB.prepare(`
      UPDATE user_2fa SET backupCodes = ?, backupCodesUsed = ? WHERE userId = ?
    `).bind(JSON.stringify(hashedCodes), usedCount, userId).run();

    // Log activity
    await c.env.DB.prepare(`
      INSERT INTO account_activity (id, userId, action, description, status, riskLevel)
      VALUES (?, ?, 'backup_code_used', 'Used backup code for authentication', 'success', 'medium')
    `).bind(crypto.randomUUID(), userId).run();

    return c.json({
      success: true,
      backupCodesRemaining: 10 - usedCount
    });
  } catch (error) {
    console.error('Error verifying backup code:', error);
    return c.json({ error: 'Failed to verify backup code' }, 500);
  }
});

// POST /settings/2fa/backup/regenerate - Generate new backup codes
app.post('/2fa/backup/regenerate', async (c) => {
  const user = c.get('user');
  const userId = user?.id;
  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const { code } = await c.req.json();

    const twoFa = await c.env.DB.prepare(`
      SELECT secret FROM user_2fa WHERE userId = ? AND isEnabled = 1
    `).bind(userId).first();

    if (!twoFa) {
      return c.json({ error: '2FA not enabled' }, 400);
    }

    // Verify current TOTP code before regenerating backup codes
    const isValid = await verifyTOTP(twoFa.secret as string, code);
    if (!isValid) {
      return c.json({ error: 'Invalid verification code' }, 400);
    }

    // Generate new backup codes
    const backupCodes = await generateBackupCodes(10);

    await c.env.DB.prepare(`
      UPDATE user_2fa SET backupCodes = ?, backupCodesUsed = 0 WHERE userId = ?
    `).bind(JSON.stringify(backupCodes.hashed), userId).run();

    // Log activity
    await c.env.DB.prepare(`
      INSERT INTO account_activity (id, userId, action, description, status, riskLevel)
      VALUES (?, ?, 'backup_codes_regenerated', 'Regenerated backup codes', 'success', 'medium')
    `).bind(crypto.randomUUID(), userId).run();

    return c.json({
      success: true,
      backupCodes: backupCodes.plain
    });
  } catch (error) {
    console.error('Error regenerating backup codes:', error);
    return c.json({ error: 'Failed to regenerate backup codes' }, 500);
  }
});

// =====================================================
// KEYBOARD SHORTCUTS
// =====================================================

// GET /settings/shortcuts - Get user's keyboard shortcuts
app.get('/shortcuts', async (c) => {
  const user = c.get('user');
  const userId = user?.id;
  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    // Get default shortcuts
    const defaults = await c.env.DB.prepare(`
      SELECT * FROM default_shortcuts ORDER BY category, action
    `).all();

    // Get user's custom shortcuts
    const customs = await c.env.DB.prepare(`
      SELECT * FROM keyboard_shortcuts WHERE userId = ?
    `).bind(userId).all();

    const customMap = new Map(customs.results.map(s => [s.action, s]));

    // Merge defaults with customs
    const shortcuts = defaults.results.map(d => {
      const custom = customMap.get(d.action);
      return {
        action: d.action,
        shortcut: custom ? custom.shortcut : d.shortcut,
        description: d.description,
        category: d.category,
        isCustom: !!custom,
        isEnabled: custom ? !!custom.isEnabled : true
      };
    });

    return c.json({ shortcuts });
  } catch (error) {
    console.error('Error fetching shortcuts:', error);
    return c.json({ error: 'Failed to fetch shortcuts' }, 500);
  }
});

// PUT /settings/shortcuts - Update a shortcut
app.put('/shortcuts', async (c) => {
  const user = c.get('user');
  const userId = user?.id;
  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const { action, shortcut, isEnabled } = await c.req.json();

    // Check if exists
    const existing = await c.env.DB.prepare(`
      SELECT id FROM keyboard_shortcuts WHERE userId = ? AND action = ?
    `).bind(userId, action).first();

    if (existing) {
      await c.env.DB.prepare(`
        UPDATE keyboard_shortcuts SET shortcut = ?, isEnabled = ? WHERE id = ?
      `).bind(shortcut, isEnabled ? 1 : 0, existing.id).run();
    } else {
      await c.env.DB.prepare(`
        INSERT INTO keyboard_shortcuts (id, userId, action, shortcut, isEnabled, isCustom)
        VALUES (?, ?, ?, ?, ?, 1)
      `).bind(crypto.randomUUID(), userId, action, shortcut, isEnabled ? 1 : 0).run();
    }

    return c.json({ success: true });
  } catch (error) {
    console.error('Error updating shortcut:', error);
    return c.json({ error: 'Failed to update shortcut' }, 500);
  }
});

// DELETE /settings/shortcuts/:action - Reset shortcut to default
app.delete('/shortcuts/:action', async (c) => {
  const user = c.get('user');
  const userId = user?.id;
  const action = c.req.param('action');

  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    await c.env.DB.prepare(`
      DELETE FROM keyboard_shortcuts WHERE userId = ? AND action = ?
    `).bind(userId, action).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Error resetting shortcut:', error);
    return c.json({ error: 'Failed to reset shortcut' }, 500);
  }
});

// =====================================================
// ACCOUNT ACTIVITY
// =====================================================

// GET /settings/activity - Get account activity
app.get('/activity', async (c) => {
  const user = c.get('user');
  const userId = user?.id;
  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '20');
    const offset = (page - 1) * limit;

    const [activities, countResult] = await Promise.all([
      c.env.DB.prepare(`
        SELECT * FROM account_activity
        WHERE userId = ?
        ORDER BY createdAt DESC
        LIMIT ? OFFSET ?
      `).bind(userId, limit, offset).all(),
      c.env.DB.prepare(`
        SELECT COUNT(*) as count FROM account_activity WHERE userId = ?
      `).bind(userId).first()
    ]);

    const total = (countResult?.count as number) || 0;

    return c.json({
      activities: activities.results,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching activity:', error);
    return c.json({ error: 'Failed to fetch activity' }, 500);
  }
});

// =====================================================
// STORAGE USAGE
// =====================================================

// GET /settings/storage - Get storage usage
app.get('/storage', async (c) => {
  const user = c.get('user');
  const userId = user?.id;
  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    let storage = await c.env.DB.prepare(`
      SELECT * FROM storage_usage WHERE userId = ?
    `).bind(userId).first();

    if (!storage) {
      // Create initial storage record
      const id = crypto.randomUUID();
      await c.env.DB.prepare(`
        INSERT INTO storage_usage (id, userId) VALUES (?, ?)
      `).bind(id, userId).run();

      storage = {
        id,
        userId,
        totalBytes: 0,
        documentsBytes: 0,
        attachmentsBytes: 0,
        avatarBytes: 0,
        cacheBytes: 0,
        quotaBytes: 1073741824 // 1GB
      };
    }

    // Calculate real storage from documents
    const documentsSize = await c.env.DB.prepare(`
      SELECT COALESCE(SUM(fileSize), 0) as total FROM documents WHERE authorId = ?
    `).bind(userId).first();

    const totalBytes = (documentsSize?.total as number) || 0;

    return c.json({
      totalBytes,
      documentsBytes: totalBytes,
      attachmentsBytes: storage.attachmentsBytes || 0,
      avatarBytes: storage.avatarBytes || 0,
      cacheBytes: storage.cacheBytes || 0,
      quotaBytes: storage.quotaBytes,
      usagePercent: Math.round((totalBytes / (storage.quotaBytes as number)) * 100 * 100) / 100
    });
  } catch (error) {
    console.error('Error fetching storage:', error);
    return c.json({ error: 'Failed to fetch storage' }, 500);
  }
});

// =====================================================
// DATA EXPORT
// =====================================================

// GET /settings/exports - Get export history
app.get('/exports', async (c) => {
  const user = c.get('user');
  const userId = user?.id;
  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const exports = await c.env.DB.prepare(`
      SELECT * FROM data_exports
      WHERE userId = ?
      ORDER BY requestedAt DESC
      LIMIT 10
    `).bind(userId).all();

    return c.json({ exports: exports.results });
  } catch (error) {
    console.error('Error fetching exports:', error);
    return c.json({ error: 'Failed to fetch exports' }, 500);
  }
});

// POST /settings/exports - Request data export
app.post('/exports', async (c) => {
  const user = c.get('user');
  const userId = user?.id;
  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const { type = 'full', format = 'zip' } = await c.req.json();
    const id = crypto.randomUUID();

    // In a production system, you'd use Cloudflare Queues for async processing
    // For this demo, we'll mark the export as completed immediately
    // with a generated file URL (in production, this would be a real R2 file)

    // Generate a placeholder download URL (in production, this would be an R2 signed URL)
    const fileUrl = `https://ohcs-elibrary-api.ghwmelite.workers.dev/api/v1/settings/exports/${id}/download`;

    await c.env.DB.prepare(`
      INSERT INTO data_exports (id, userId, type, format, status, progress, expiresAt, completedAt, fileSize, fileUrl)
      VALUES (?, ?, ?, ?, 'completed', 100, datetime('now', '+7 days'), datetime('now'), ?, ?)
    `).bind(id, userId, type, format, 1024 * 50, fileUrl).run(); // 50KB placeholder size

    // Log activity
    await c.env.DB.prepare(`
      INSERT INTO account_activity (id, userId, action, description, status)
      VALUES (?, ?, 'data_export', 'Requested data export', 'success')
    `).bind(crypto.randomUUID(), userId).run();

    return c.json({ id, status: 'processing' });
  } catch (error) {
    console.error('Error requesting export:', error);
    return c.json({ error: 'Failed to request export' }, 500);
  }
});

// GET /settings/exports/:id - Get export status
app.get('/exports/:id', async (c) => {
  const user = c.get('user');
  const userId = user?.id;
  const exportId = c.req.param('id');

  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const exportData = await c.env.DB.prepare(`
      SELECT * FROM data_exports WHERE id = ? AND userId = ?
    `).bind(exportId, userId).first();

    if (!exportData) {
      return c.json({ error: 'Export not found' }, 404);
    }

    return c.json(exportData);
  } catch (error) {
    console.error('Error fetching export:', error);
    return c.json({ error: 'Failed to fetch export' }, 500);
  }
});

// GET /settings/exports/:id/download - Download export file
app.get('/exports/:id/download', async (c) => {
  const user = c.get('user');
  const userId = user?.id;
  const exportId = c.req.param('id');

  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const exportData = await c.env.DB.prepare(`
      SELECT * FROM data_exports WHERE id = ? AND userId = ? AND status = 'completed'
    `).bind(exportId, userId).first();

    if (!exportData) {
      return c.json({ error: 'Export not found or not ready' }, 404);
    }

    // In a production system, you'd fetch the actual file from R2
    // For this demo, generate a simple JSON export
    const userData = await c.env.DB.prepare(`
      SELECT id, email, displayName, firstName, lastName, role, createdAt
      FROM users WHERE id = ?
    `).bind(userId).first();

    const exportContent = JSON.stringify({
      exportedAt: new Date().toISOString(),
      type: exportData.type,
      user: userData,
      message: 'This is a demo export. In production, this would contain your full data.'
    }, null, 2);

    // Update download timestamp
    await c.env.DB.prepare(`
      UPDATE data_exports SET downloadedAt = datetime('now') WHERE id = ?
    `).bind(exportId).run();

    const filename = `ohcs-export-${exportData.type}-${new Date().toISOString().split('T')[0]}.json`;

    return new Response(exportContent, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error downloading export:', error);
    return c.json({ error: 'Failed to download export' }, 500);
  }
});

// =====================================================
// CONNECTED ACCOUNTS
// =====================================================

// GET /settings/connected - Get connected accounts
app.get('/connected', async (c) => {
  const user = c.get('user');
  const userId = user?.id;
  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    // NOTE: connected_accounts table is not yet created by any migration.
    // This query will fail gracefully until the social login feature is fully
    // implemented and the table migration is applied.
    const accounts = await c.env.DB.prepare(`
      SELECT id, provider, email, displayName, avatar, lastUsedAt, connectedAt
      FROM connected_accounts
      WHERE userId = ? AND isActive = 1
    `).bind(userId).all();

    return c.json({ accounts: accounts.results });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    // If the table doesn't exist yet, return an empty list rather than an error
    if (message.includes('no such table')) {
      return c.json({ accounts: [] });
    }
    console.error('Error fetching connected accounts:', error);
    return c.json({ error: 'Failed to fetch connected accounts' }, 500);
  }
});

// DELETE /settings/connected/:provider - Disconnect account
app.delete('/connected/:provider', async (c) => {
  const user = c.get('user');
  const userId = user?.id;
  const provider = c.req.param('provider');

  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    await c.env.DB.prepare(`
      UPDATE connected_accounts SET isActive = 0 WHERE userId = ? AND provider = ?
    `).bind(userId, provider).run();

    // Log activity
    await c.env.DB.prepare(`
      INSERT INTO account_activity (id, userId, action, description, status)
      VALUES (?, ?, 'disconnect_account', ?, 'success')
    `).bind(crypto.randomUUID(), userId, `Disconnected ${provider} account`).run();

    return c.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    // If the table doesn't exist yet, treat as a no-op
    if (message.includes('no such table')) {
      return c.json({ success: true });
    }
    console.error('Error disconnecting account:', error);
    return c.json({ error: 'Failed to disconnect account' }, 500);
  }
});

// =====================================================
// BLOCKED USERS
// =====================================================

// GET /settings/blocked - Get blocked users
app.get('/blocked', async (c) => {
  const user = c.get('user');
  const userId = user?.id;
  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const blocked = await c.env.DB.prepare(`
      SELECT bu.id, bu.blockedUserId, bu.reason, bu.createdAt,
             u.displayName, u.avatar
      FROM blocked_users bu
      JOIN users u ON u.id = bu.blockedUserId
      WHERE bu.userId = ?
      ORDER BY bu.createdAt DESC
    `).bind(userId).all();

    return c.json({ blocked: blocked.results });
  } catch (error) {
    console.error('Error fetching blocked users:', error);
    return c.json({ error: 'Failed to fetch blocked users' }, 500);
  }
});

// POST /settings/blocked - Block a user
app.post('/blocked', async (c) => {
  const user = c.get('user');
  const userId = user?.id;
  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const { blockedUserId, reason } = await c.req.json();

    if (blockedUserId === userId) {
      return c.json({ error: 'Cannot block yourself' }, 400);
    }

    await c.env.DB.prepare(`
      INSERT OR REPLACE INTO blocked_users (id, userId, blockedUserId, reason)
      VALUES (?, ?, ?, ?)
    `).bind(crypto.randomUUID(), userId, blockedUserId, reason || null).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Error blocking user:', error);
    return c.json({ error: 'Failed to block user' }, 500);
  }
});

// DELETE /settings/blocked/:id - Unblock a user
app.delete('/blocked/:id', async (c) => {
  const user = c.get('user');
  const userId = user?.id;
  const blockedUserId = c.req.param('id');

  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    await c.env.DB.prepare(`
      DELETE FROM blocked_users WHERE userId = ? AND blockedUserId = ?
    `).bind(userId, blockedUserId).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Error unblocking user:', error);
    return c.json({ error: 'Failed to unblock user' }, 500);
  }
});

// =====================================================
// SECURITY SCORE
// =====================================================

// GET /settings/security-score - Calculate security score
app.get('/security-score', async (c) => {
  const user = c.get('user');
  const userId = user?.id;
  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const [userRecord, twoFa, sessions, recentActivity] = await Promise.all([
      c.env.DB.prepare(`SELECT emailVerified, avatar, bio FROM users WHERE id = ?`).bind(userId).first(),
      c.env.DB.prepare(`SELECT isEnabled FROM user_2fa WHERE userId = ?`).bind(userId).first(),
      c.env.DB.prepare(`SELECT COUNT(*) as count FROM user_sessions WHERE userId = ? AND isRevoked = 0`).bind(userId).first(),
      c.env.DB.prepare(`
        SELECT action, status FROM account_activity
        WHERE userId = ? AND createdAt > datetime('now', '-30 days')
        ORDER BY createdAt DESC
        LIMIT 100
      `).bind(userId).all()
    ]);

    let score = 40; // Base score
    const factors = [];

    // Email verified (+15)
    if (userRecord?.emailVerified) {
      score += 15;
      factors.push({ name: 'Email Verified', points: 15, status: 'complete' });
    } else {
      factors.push({ name: 'Email Verified', points: 15, status: 'incomplete' });
    }

    // 2FA enabled (+25)
    if (twoFa?.isEnabled) {
      score += 25;
      factors.push({ name: 'Two-Factor Authentication', points: 25, status: 'complete' });
    } else {
      factors.push({ name: 'Two-Factor Authentication', points: 25, status: 'incomplete' });
    }

    // Profile complete (+10)
    if (userRecord?.avatar && userRecord?.bio) {
      score += 10;
      factors.push({ name: 'Profile Complete', points: 10, status: 'complete' });
    } else {
      factors.push({ name: 'Profile Complete', points: 10, status: 'incomplete' });
    }

    // Session hygiene (+10) - max 3 active sessions
    const sessionCount = (sessions?.count as number) || 0;
    if (sessionCount <= 3) {
      score += 10;
      factors.push({ name: 'Session Hygiene', points: 10, status: 'complete' });
    } else {
      factors.push({ name: 'Session Hygiene', points: 10, status: 'incomplete', hint: `${sessionCount} active sessions` });
    }

    // No failed logins in last 30 days
    const failedLogins = recentActivity.results.filter(a => a.action === 'login' && a.status === 'failed').length;
    if (failedLogins === 0) {
      factors.push({ name: 'No Suspicious Activity', points: 0, status: 'complete' });
    } else {
      score -= Math.min(10, failedLogins * 2);
      factors.push({ name: 'Suspicious Activity Detected', points: -Math.min(10, failedLogins * 2), status: 'warning', hint: `${failedLogins} failed login attempts` });
    }

    return c.json({
      score: Math.max(0, Math.min(100, score)),
      grade: score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F',
      factors,
      lastCalculated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error calculating security score:', error);
    return c.json({ error: 'Failed to calculate security score' }, 500);
  }
});

// =====================================================
// PASSWORD CHANGE
// =====================================================

// POST /settings/password - Change password
app.post('/password', async (c) => {
  const user = c.get('user');
  const userId = user?.id;
  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const { currentPassword, newPassword } = await c.req.json();

    // Get user's current password hash
    const user = await c.env.DB.prepare(`
      SELECT passwordHash FROM users WHERE id = ?
    `).bind(userId).first();

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    // Verify current password
    const isValid = await verifyPassword(currentPassword, user.passwordHash as string);
    if (!isValid) {
      // Log failed attempt
      await c.env.DB.prepare(`
        INSERT INTO account_activity (id, userId, action, description, status, riskLevel)
        VALUES (?, ?, 'password_change_failed', 'Failed password change attempt', 'failed', 'medium')
      `).bind(crypto.randomUUID(), userId).run();

      return c.json({ error: 'Current password is incorrect' }, 400);
    }

    // Hash new password
    const newHash = await hashPassword(newPassword);

    // Update password
    await c.env.DB.prepare(`
      UPDATE users SET passwordHash = ?, updatedAt = datetime('now') WHERE id = ?
    `).bind(newHash, userId).run();

    // Log activity
    await c.env.DB.prepare(`
      INSERT INTO account_activity (id, userId, action, description, status)
      VALUES (?, ?, 'password_change', 'Changed password successfully', 'success')
    `).bind(crypto.randomUUID(), userId).run();

    // Optionally revoke all other sessions
    await c.env.DB.prepare(`
      UPDATE user_sessions SET isRevoked = 1 WHERE userId = ? AND isCurrent = 0
    `).bind(userId).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Error changing password:', error);
    return c.json({ error: 'Failed to change password' }, 500);
  }
});

// =====================================================
// HELPER FUNCTIONS
// =====================================================

function parseUserAgent(ua: string): {
  browser: string;
  browserVersion: string;
  os: string;
  osVersion: string;
  deviceType: string;
} {
  let browser = 'Unknown';
  let browserVersion = '';
  let os = 'Unknown';
  let osVersion = '';
  let deviceType = 'desktop';

  // Detect browser
  if (ua.includes('Chrome')) {
    browser = 'Chrome';
    browserVersion = ua.match(/Chrome\/(\d+)/)?.[1] || '';
  } else if (ua.includes('Firefox')) {
    browser = 'Firefox';
    browserVersion = ua.match(/Firefox\/(\d+)/)?.[1] || '';
  } else if (ua.includes('Safari') && !ua.includes('Chrome')) {
    browser = 'Safari';
    browserVersion = ua.match(/Version\/(\d+)/)?.[1] || '';
  } else if (ua.includes('Edge')) {
    browser = 'Edge';
    browserVersion = ua.match(/Edge\/(\d+)/)?.[1] || '';
  }

  // Detect OS
  if (ua.includes('Windows')) {
    os = 'Windows';
    osVersion = ua.match(/Windows NT (\d+\.\d+)/)?.[1] || '';
  } else if (ua.includes('Mac OS')) {
    os = 'macOS';
    osVersion = ua.match(/Mac OS X (\d+[._]\d+)/)?.[1]?.replace('_', '.') || '';
  } else if (ua.includes('Linux')) {
    os = 'Linux';
  } else if (ua.includes('Android')) {
    os = 'Android';
    osVersion = ua.match(/Android (\d+)/)?.[1] || '';
    deviceType = 'mobile';
  } else if (ua.includes('iPhone') || ua.includes('iPad')) {
    os = 'iOS';
    osVersion = ua.match(/OS (\d+)/)?.[1] || '';
    deviceType = ua.includes('iPad') ? 'tablet' : 'mobile';
  }

  return { browser, browserVersion, os, osVersion, deviceType };
}

// =====================================================
// TOTP IMPLEMENTATION (RFC 6238 compliant)
// =====================================================

// Base32 alphabet for TOTP secrets
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

// Generate a cryptographically secure TOTP secret (20 bytes = 160 bits)
function generateTOTPSecret(): string {
  const secretBytes = new Uint8Array(20);
  crypto.getRandomValues(secretBytes);
  return base32Encode(secretBytes);
}

// Base32 encode bytes to string
function base32Encode(bytes: Uint8Array): string {
  let result = '';
  let bits = 0;
  let value = 0;

  for (let i = 0; i < bytes.length; i++) {
    value = (value << 8) | bytes[i];
    bits += 8;

    while (bits >= 5) {
      result += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    result += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return result;
}

// Base32 decode string to bytes
function base32Decode(str: string): Uint8Array {
  str = str.toUpperCase().replace(/[^A-Z2-7]/g, '');
  const bytes: number[] = [];
  let bits = 0;
  let value = 0;

  for (let i = 0; i < str.length; i++) {
    const idx = BASE32_ALPHABET.indexOf(str[i]);
    if (idx === -1) continue;

    value = (value << 5) | idx;
    bits += 5;

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return new Uint8Array(bytes);
}

// Generate HMAC-SHA1 using Web Crypto API
async function hmacSha1(key: Uint8Array, message: Uint8Array): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, message);
  return new Uint8Array(signature);
}

// Generate TOTP code for a given counter
async function generateTOTPCode(secret: string, counter: number): Promise<string> {
  const key = base32Decode(secret);

  // Convert counter to 8-byte big-endian buffer
  const counterBuffer = new ArrayBuffer(8);
  const counterView = new DataView(counterBuffer);
  counterView.setUint32(0, Math.floor(counter / 0x100000000), false);
  counterView.setUint32(4, counter >>> 0, false);

  // Generate HMAC-SHA1
  const hmac = await hmacSha1(key, new Uint8Array(counterBuffer));

  // Dynamic truncation (RFC 4226)
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code = (
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff)
  ) % 1000000;

  return code.toString().padStart(6, '0');
}

// Verify TOTP code with time window tolerance
async function verifyTOTP(secret: string, code: string, windowSize: number = 1): Promise<boolean> {
  // Validate code format
  if (!/^\d{6}$/.test(code)) {
    return false;
  }

  const step = 30; // 30 second time step
  const now = Math.floor(Date.now() / 1000);
  const counter = Math.floor(now / step);

  // Check current time step and adjacent windows
  for (let i = -windowSize; i <= windowSize; i++) {
    const expectedCode = await generateTOTPCode(secret, counter + i);
    if (expectedCode === code) {
      return true;
    }
  }

  return false;
}

// Generate backup codes with proper hashing
async function generateBackupCodes(count: number): Promise<{ plain: string[]; hashed: string[] }> {
  const plain: string[] = [];
  const hashed: string[] = [];

  for (let i = 0; i < count; i++) {
    // Generate 8 random hex characters (4 bytes)
    const bytes = new Uint8Array(4);
    crypto.getRandomValues(bytes);
    const code = Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase();

    // Format as XXXX-XXXX for readability
    const formattedCode = `${code.slice(0, 4)}-${code.slice(4)}`;
    plain.push(formattedCode);

    // Hash for secure storage
    const hashBuffer = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(formattedCode)
    );
    const hashHex = Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    hashed.push(hashHex);
  }

  return { plain, hashed };
}

// Verify a backup code against stored hashes
async function verifyBackupCode(code: string, hashedCodes: string[]): Promise<number> {
  const hashBuffer = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(code.toUpperCase())
  );
  const hashHex = Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return hashedCodes.indexOf(hashHex);
}

// QR Code generation is now handled on the frontend
// We return the otpauth URL which the frontend uses with a QR library
async function generateQRCodeDataUrl(text: string): Promise<string> {
  // Return the otpauth URL directly - frontend will generate QR code
  return text;
}

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const newHash = await hashPassword(password);
  return newHash === hash;
}

export default app;

import nodemailer from 'nodemailer';
import { env } from '../config/env';
import logger from '../utils/logger';

/**
 * Alert Service
 * Sends real-time notifications for security events
 */

export interface AlertData {
  type: 'fraud' | 'high_risk' | 'security' | 'system';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  userId?: string;
  eventType?: string;
  riskScore?: number;
  metadata?: {
    ip?: string;
    userAgent?: string;
    amount?: number;
    [key: string]: any;
  };
  timestamp: Date;
  recommendations?: string[];
}

/**
 * Send email alert to admin
 */
export const sendEmailAlert = async (alert: AlertData): Promise<void> => {
  // Skip if email not configured
  if (!env.EMAIL_HOST || !env.EMAIL_USER || !env.EMAIL_PASS) {
    logger.warn('Email not configured, skipping alert');
    return;
  }

  try {
    // Create transporter
    const transporter = nodemailer.createTransport({
      host: env.EMAIL_HOST,
      port: Number(env.EMAIL_PORT),
      secure: env.EMAIL_PORT === '465',
      auth: {
        user: env.EMAIL_USER,
        pass: env.EMAIL_PASS
      }
    });

    // Determine recipients based on severity
    const recipients = getAlertRecipients(alert.severity);

    if (recipients.length === 0) {
      logger.warn({ severity: alert.severity }, 'No recipients configured for alert severity');
      return;
    }

    // Build email content
    const subject = `🚨 ${alert.severity.toUpperCase()} - ${alert.title}`;
    const htmlContent = buildAlertEmailHTML(alert);
    const textContent = buildAlertEmailText(alert);

    // Send email
    await transporter.sendMail({
      from: env.EMAIL_FROM || env.EMAIL_USER,
      to: recipients.join(', '),
      subject,
      text: textContent,
      html: htmlContent
    });

    logger.info({
      alertType: alert.type,
      severity: alert.severity,
      recipients: recipients.length
    }, 'Alert email sent successfully');
  } catch (error) {
    logger.error({ err: error, alert }, 'Failed to send alert email');
    // Don't throw - alerts should not break main flow
  }
};

/**
 * Get alert recipients based on severity
 */
const getAlertRecipients = (severity: AlertData['severity']): string[] => {
  const adminEmail = env.ADMIN_EMAIL || 'admin@example.com';
  
  // In production, you would have different email lists
  // For now, send all alerts to admin
  switch (severity) {
    case 'critical':
    case 'high':
      return [adminEmail]; // Could add multiple admins here
    case 'medium':
      return [adminEmail];
    case 'low':
      return []; // Don't send low severity alerts
    default:
      return [adminEmail];
  }
};

/**
 * Build HTML email content
 */
const buildAlertEmailHTML = (alert: AlertData): string => {
  const severityColor = getSeverityColor(alert.severity);
  const severityIcon = getSeverityIcon(alert.severity);
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Security Alert</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .alert-container {
      background: #fff;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    .alert-header {
      background: ${severityColor};
      color: #fff;
      padding: 20px;
      text-align: center;
    }
    .alert-icon {
      font-size: 48px;
      margin-bottom: 10px;
    }
    .alert-title {
      font-size: 24px;
      font-weight: bold;
      margin: 0;
    }
    .alert-body {
      padding: 30px;
    }
    .alert-field {
      margin-bottom: 15px;
    }
    .alert-label {
      font-weight: bold;
      color: #666;
      margin-bottom: 5px;
    }
    .alert-value {
      color: #333;
    }
    .risk-score {
      display: inline-block;
      padding: 5px 15px;
      border-radius: 20px;
      background: ${severityColor};
      color: #fff;
      font-weight: bold;
    }
    .metadata-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }
    .metadata-table td {
      padding: 8px;
      border-bottom: 1px solid #eee;
    }
    .metadata-table td:first-child {
      font-weight: bold;
      color: #666;
      width: 40%;
    }
    .recommendations {
      background: #f8f9fa;
      border-left: 4px solid ${severityColor};
      padding: 15px;
      margin-top: 20px;
    }
    .recommendations h3 {
      margin-top: 0;
      color: ${severityColor};
    }
    .recommendations ul {
      margin: 10px 0;
      padding-left: 20px;
    }
    .footer {
      text-align: center;
      padding: 20px;
      color: #666;
      font-size: 12px;
      border-top: 1px solid #eee;
    }
  </style>
</head>
<body>
  <div class="alert-container">
    <div class="alert-header">
      <div class="alert-icon">${severityIcon}</div>
      <h1 class="alert-title">${alert.title}</h1>
      <p style="margin: 5px 0 0 0; opacity: 0.9;">${alert.type.toUpperCase()} Alert</p>
    </div>
    
    <div class="alert-body">
      <div class="alert-field">
        <div class="alert-label">Severity</div>
        <div class="alert-value">
          <span class="risk-score">${alert.severity.toUpperCase()}</span>
        </div>
      </div>
      
      <div class="alert-field">
        <div class="alert-label">Description</div>
        <div class="alert-value">${alert.description}</div>
      </div>
      
      <div class="alert-field">
        <div class="alert-label">Timestamp</div>
        <div class="alert-value">${alert.timestamp.toLocaleString()}</div>
      </div>
      
      ${alert.userId ? `
      <div class="alert-field">
        <div class="alert-label">User ID</div>
        <div class="alert-value"><code>${alert.userId}</code></div>
      </div>
      ` : ''}
      
      ${alert.eventType ? `
      <div class="alert-field">
        <div class="alert-label">Event Type</div>
        <div class="alert-value">${alert.eventType}</div>
      </div>
      ` : ''}
      
      ${alert.riskScore !== undefined ? `
      <div class="alert-field">
        <div class="alert-label">Risk Score</div>
        <div class="alert-value">
          <span class="risk-score">${alert.riskScore}/100</span>
        </div>
      </div>
      ` : ''}
      
      ${alert.metadata && Object.keys(alert.metadata).length > 0 ? `
      <div class="alert-field">
        <div class="alert-label">Additional Information</div>
        <table class="metadata-table">
          ${Object.entries(alert.metadata).map(([key, value]) => `
            <tr>
              <td>${key}</td>
              <td>${String(value)}</td>
            </tr>
          `).join('')}
        </table>
      </div>
      ` : ''}
      
      ${alert.recommendations && alert.recommendations.length > 0 ? `
      <div class="recommendations">
        <h3>📋 Recommended Actions</h3>
        <ul>
          ${alert.recommendations.map(rec => `<li>${rec}</li>`).join('')}
        </ul>
      </div>
      ` : ''}
    </div>
    
    <div class="footer">
      <p>This is an automated security alert from your e-commerce platform.</p>
      <p>Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
};

/**
 * Build plain text email content
 */
const buildAlertEmailText = (alert: AlertData): string => {
  let text = `
===========================================
🚨 SECURITY ALERT - ${alert.severity.toUpperCase()}
===========================================

Alert Type: ${alert.type.toUpperCase()}
Title: ${alert.title}
Severity: ${alert.severity.toUpperCase()}
Timestamp: ${alert.timestamp.toLocaleString()}

Description:
${alert.description}
`;

  if (alert.userId) {
    text += `\nUser ID: ${alert.userId}`;
  }

  if (alert.eventType) {
    text += `\nEvent Type: ${alert.eventType}`;
  }

  if (alert.riskScore !== undefined) {
    text += `\nRisk Score: ${alert.riskScore}/100`;
  }

  if (alert.metadata && Object.keys(alert.metadata).length > 0) {
    text += '\n\nAdditional Information:';
    Object.entries(alert.metadata).forEach(([key, value]) => {
      text += `\n  - ${key}: ${value}`;
    });
  }

  if (alert.recommendations && alert.recommendations.length > 0) {
    text += '\n\nRecommended Actions:';
    alert.recommendations.forEach((rec, i) => {
      text += `\n  ${i + 1}. ${rec}`;
    });
  }

  text += '\n\n===========================================';
  text += '\nThis is an automated security alert.';
  text += '\nPlease do not reply to this email.';
  text += '\n===========================================';

  return text.trim();
};

/**
 * Get severity color
 */
const getSeverityColor = (severity: AlertData['severity']): string => {
  switch (severity) {
    case 'critical':
      return '#dc3545'; // Red
    case 'high':
      return '#fd7e14'; // Orange
    case 'medium':
      return '#ffc107'; // Yellow
    case 'low':
      return '#17a2b8'; // Blue
    default:
      return '#6c757d'; // Gray
  }
};

/**
 * Get severity icon
 */
const getSeverityIcon = (severity: AlertData['severity']): string => {
  switch (severity) {
    case 'critical':
      return '🔴';
    case 'high':
      return '🟠';
    case 'medium':
      return '🟡';
    case 'low':
      return '🔵';
    default:
      return '⚪';
  }
};

/**
 * Send fraud alert
 */
export const sendFraudAlert = async (
  userId: string,
  reasons: string[],
  riskScore: number,
  metadata?: any
): Promise<void> => {
  const severity: AlertData['severity'] = riskScore >= 80 ? 'critical' : 'high';

  await sendEmailAlert({
    type: 'fraud',
    severity,
    title: 'Fraud Detection Alert',
    description: `Fraudulent activity detected with risk score ${riskScore}/100. ${reasons.join('; ')}`,
    userId,
    riskScore,
    metadata,
    timestamp: new Date(),
    recommendations: [
      'Review user account immediately',
      'Check transaction history for patterns',
      'Contact user to verify activity',
      'Consider temporarily locking account',
      'Monitor for additional suspicious activity'
    ]
  });
};

/**
 * Send high-risk order alert
 */
export const sendHighRiskOrderAlert = async (
  userId: string,
  orderId: string,
  amount: number,
  reasons: string[],
  riskScore: number
): Promise<void> => {
  await sendEmailAlert({
    type: 'high_risk',
    severity: riskScore >= 80 ? 'critical' : 'high',
    title: 'High-Risk Order Detected',
    description: `Order ${orderId} flagged as high-risk. ${reasons.join('; ')}`,
    userId,
    eventType: 'order.created',
    riskScore,
    metadata: {
      orderId,
      amount,
      amountFormatted: `$${amount}`,
      reasons: reasons.join('; ')
    },
    timestamp: new Date(),
    recommendations: [
      'Hold order for manual review',
      'Contact customer to verify order',
      'Check shipping address history',
      'Verify payment method',
      'Review user\'s order history'
    ]
  });
};

/**
 * Send failed login pattern alert
 */
export const sendFailedLoginAlert = async (
  userId: string | undefined,
  ip: string,
  attemptCount: number,
  riskScore: number
): Promise<void> => {
  await sendEmailAlert({
    type: 'security',
    severity: riskScore >= 80 ? 'critical' : 'high',
    title: 'Brute Force Attack Detected',
    description: `Multiple failed login attempts detected from IP ${ip}. Potential brute force attack.`,
    userId,
    eventType: 'security.failed_login',
    riskScore,
    metadata: {
      ip,
      attemptCount,
      attackType: 'Brute Force'
    },
    timestamp: new Date(),
    recommendations: [
      'Block IP address immediately',
      'Enable CAPTCHA on login page',
      'Notify affected user (if identified)',
      'Review firewall rules',
      'Monitor for distributed attack patterns'
    ]
  });
};

/**
 * Send system alert
 */
export const sendSystemAlert = async (
  title: string,
  description: string,
  severity: AlertData['severity'] = 'medium',
  metadata?: any
): Promise<void> => {
  await sendEmailAlert({
    type: 'system',
    severity,
    title,
    description,
    metadata,
    timestamp: new Date()
  });
};

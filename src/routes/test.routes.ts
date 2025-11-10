import { Router } from 'express';
import { sendTestEmail } from '../services/email.service';
import { sendSuccess, sendError } from '../utils/apiResponse';
import logger from '../utils/logger';

const router = Router();

/**
 * @route   POST /api/test/email
 * @desc    Send test email
 * @access  Public (only in development)
 */
router.post('/email', async (req, res, next) => {
  try {
    // Only allow in development
    if (process.env.NODE_ENV !== 'development') {
      return sendError(res, 403, 'Test endpoints are only available in development mode');
    }

    const { email } = req.body;

    if (!email) {
      return sendError(res, 400, 'Email address is required');
    }

    logger.info({ email }, 'Sending test email');

    await sendTestEmail(email);

    return sendSuccess(res, 200, 
      { message: 'Test email sent successfully! Check your inbox (and spam folder).' },
      'Test email sent'
    );
  } catch (error) {
    logger.error({ err: error }, 'Failed to send test email');
    next(error);
  }
});

/**
 * @route   GET /api/test/email-config
 * @desc    Check email configuration
 * @access  Public (only in development)
 */
router.get('/email-config', async (req, res) => {
  if (process.env.NODE_ENV !== 'development') {
    return sendError(res, 403, 'Test endpoints are only available in development mode');
  }

  const config = {
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    from: process.env.EMAIL_FROM,
    user: process.env.EMAIL_USER ? '✓ Configured' : '✗ Not set',
    pass: process.env.EMAIL_PASS ? '✓ Configured' : '✗ Not set',
    secure: process.env.EMAIL_PORT === '465'
  };

  return sendSuccess(res, 200, config, 'Email configuration');
});

export default router;

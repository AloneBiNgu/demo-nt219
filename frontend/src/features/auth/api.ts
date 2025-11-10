import { apiClient } from '../../api/client';
import {
  ApiSuccess,
  AuthResponse,
  AuthUser,
  RegisterResponse,
  EmailVerificationRequiredResponse,
  TwoFactorRequiredResponse,
  TwoFactorSetupResponse,
  SessionInfo,
  PasswordResetTokenValidation
} from '../../types/api';

// ============= Registration & Email Verification =============

export const register = async (email: string, password: string) => {
  const { data } = await apiClient.post<ApiSuccess<RegisterResponse>>('/auth/register', {
    email,
    password
  });
  return data.data;
};

export const verifyEmail = async (token: string) => {
  const { data } = await apiClient.post<ApiSuccess<{ message: string }>>('/auth/verify-email', {
    token
  });
  return data.data;
};

export const resendVerification = async (email: string) => {
  const { data } = await apiClient.post<ApiSuccess<{ message: string }>>('/auth/resend-verification', {
    email
  });
  return data.data;
};

// ============= Login & 2FA =============

export const login = async (email: string, password: string, deviceId?: string, deviceName?: string) => {
  const { data } = await apiClient.post<ApiSuccess<AuthResponse | EmailVerificationRequiredResponse | TwoFactorRequiredResponse>>(
    '/auth/login',
    { email, password, deviceId, deviceName }
  );
  return data.data;
};

export const loginWith2FA = async (tempToken: string, code: string, deviceId?: string, deviceName?: string) => {
  const { data } = await apiClient.post<ApiSuccess<AuthResponse>>('/auth/login/2fa', {
    tempToken,
    code,
    deviceId,
    deviceName
  });
  return data.data;
};

// ============= Token Management =============

export const refreshToken = async () => {
  const { data } = await apiClient.post<ApiSuccess<AuthResponse>>('/auth/refresh');
  return data.data;
};

export const logout = async () => {
  const { data } = await apiClient.post<ApiSuccess<{ message: string }>>('/auth/logout');
  return data.data;
};

// ============= Password Reset =============

export const forgotPassword = async (email: string) => {
  const { data } = await apiClient.post<ApiSuccess<{ message: string }>>('/auth/forgot-password', {
    email
  });
  return data.data;
};

export const validateResetToken = async (token: string) => {
  const { data } = await apiClient.post<ApiSuccess<PasswordResetTokenValidation>>(
    '/auth/validate-reset-token',
    { token }
  );
  return data.data;
};

export const resetPassword = async (token: string, newPassword: string) => {
  const { data } = await apiClient.post<ApiSuccess<{ message: string }>>('/auth/reset-password', {
    token,
    newPassword
  });
  return data.data;
};

export const changePassword = async (currentPassword: string, newPassword: string) => {
  const { data } = await apiClient.post<ApiSuccess<{ message: string }>>('/auth/change-password', {
    currentPassword,
    newPassword
  });
  return data.data;
};

// ============= Two-Factor Authentication =============

export const enable2FA = async () => {
  const { data } = await apiClient.post<ApiSuccess<TwoFactorSetupResponse>>('/auth/2fa/enable');
  return data.data;
};

export const verify2FASetup = async (code: string) => {
  const { data } = await apiClient.post<ApiSuccess<{ message: string }>>('/auth/2fa/verify-setup', {
    code
  });
  return data.data;
};

export const disable2FA = async (password: string, code: string) => {
  const { data } = await apiClient.post<ApiSuccess<{ message: string }>>('/auth/2fa/disable', {
    password,
    code
  });
  return data.data;
};

export const regenerateBackupCodes = async (password: string) => {
  const { data } = await apiClient.post<ApiSuccess<{ backupCodes: string[]; message: string }>>(
    '/auth/2fa/backup-codes',
    { password }
  );
  return data.data;
};

// ============= Session Management =============

export const getSessions = async () => {
  const { data } = await apiClient.get<ApiSuccess<{ sessions: SessionInfo[] }>>('/auth/sessions');
  return data.data.sessions;
};

export const revokeSession = async (sessionId: string) => {
  const { data } = await apiClient.post<ApiSuccess<{ message: string }>>('/auth/sessions/revoke', {
    sessionId
  });
  return data.data;
};

// ============= User Info =============

export const getCurrentUser = async () => {
  const { data } = await apiClient.get<ApiSuccess<{ user: AuthUser }>>('/auth/me');
  return data.data.user;
};

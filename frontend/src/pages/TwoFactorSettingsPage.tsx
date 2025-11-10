import {
  Box,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  Image,
  PinInput,
  PinInputField,
  useToast,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Code,
  Divider,
  List,
  ListItem,
  ListIcon,
  Flex,
  Badge,
  useColorModeValue
} from '@chakra-ui/react';
import { CheckCircleIcon, WarningIcon } from '@chakra-ui/icons';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { enable2FA, verify2FASetup, disable2FA, regenerateBackupCodes } from '../features/auth/api';
import { useApiErrorToast } from '../hooks/useApiErrorToast';
import { AuthPageLayout } from '../layouts/AuthPageLayout';
import { useAuth } from '../features/auth/AuthProvider';

export default function TwoFactorSettingsPage() {
  const { user, refreshMe } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const showApiError = useApiErrorToast();

  // Color mode values
  const qrBg = useColorModeValue('white', 'gray.700');
  const qrBorderColor = useColorModeValue('gray.200', 'gray.600');
  const backupCodesBg = useColorModeValue('gray.50', 'gray.700');
  const textSecondary = useColorModeValue('gray.600', 'gray.400');
  const textTertiary = useColorModeValue('gray.500', 'gray.500');

  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [setupData, setSetupData] = useState<{
    secret: string;
    qrCode: string;
    backupCodes: string[];
  } | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [disablePassword, setDisablePassword] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [showDisableForm, setShowDisableForm] = useState(false);

  // Load 2FA status from user
  useEffect(() => {
    if (user?.twoFactorEnabled) {
      setIsEnabled(true);
    }
  }, [user]);

  const handleEnable2FA = async () => {
    setIsLoading(true);
    try {
      const result = await enable2FA();
      setSetupData(result);
      toast({
        title: 'Setup Started',
        description: 'Scan the QR code with your authenticator app',
        status: 'info',
        duration: 5000,
        isClosable: true
      });
    } catch (error) {
      showApiError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifySetup = async () => {
    if (verificationCode.length !== 6) {
      toast({
        title: 'Invalid Code',
        description: 'Please enter a 6-digit code',
        status: 'warning',
        duration: 3000
      });
      return;
    }

    setIsLoading(true);
    try {
      await verify2FASetup(verificationCode);
      setIsEnabled(true);
      setSetupData(null); // Clear setup data after successful verification
      await refreshMe(); // Refresh user data to sync twoFactorEnabled
      toast({
        title: '2FA Enabled',
        description: 'Two-factor authentication is now active on your account',
        status: 'success',
        duration: 5000,
        isClosable: true
      });
    } catch (error) {
      showApiError(error);
      setVerificationCode('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!disablePassword || disableCode.length !== 6) {
      toast({
        title: 'Required Fields',
        description: 'Please provide both password and 2FA code',
        status: 'warning',
        duration: 3000
      });
      return;
    }

    setIsLoading(true);
    try {
      await disable2FA(disablePassword, disableCode);
      setIsEnabled(false);
      setSetupData(null);
      setShowDisableForm(false);
      setDisablePassword('');
      setDisableCode('');
      await refreshMe(); // Refresh user data to sync twoFactorEnabled
      toast({
        title: '2FA Disabled',
        description: 'Two-factor authentication has been removed from your account',
        status: 'success',
        duration: 5000,
        isClosable: true
      });
    } catch (error) {
      showApiError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerateBackupCodes = async () => {
    // This would need password input - simplified for now
    const password = prompt('Enter your password to regenerate backup codes:');
    if (!password) return;

    setIsLoading(true);
    try {
      const result = await regenerateBackupCodes(password);
      setSetupData(prev => prev ? { ...prev, backupCodes: result.backupCodes } : null);
      toast({
        title: 'Backup Codes Regenerated',
        description: 'Your old backup codes are now invalid',
        status: 'success',
        duration: 5000,
        isClosable: true
      });
    } catch (error) {
      showApiError(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthPageLayout maxW="2xl">
      <VStack spacing={6} align="stretch">
        <Heading size="lg">Two-Factor Authentication</Heading>

        <Alert
          status={isEnabled ? 'success' : 'warning'}
          variant="left-accent"
          borderRadius="md"
        >
          <AlertIcon as={isEnabled ? CheckCircleIcon : WarningIcon} />
          <Box>
            <AlertTitle>
              {isEnabled ? '2FA is Enabled' : '2FA is Disabled'}
            </AlertTitle>
            <AlertDescription>
              {isEnabled
                ? 'Your account is protected with two-factor authentication'
                : 'Enable 2FA to add an extra layer of security to your account'}
            </AlertDescription>
          </Box>
        </Alert>

        {!setupData && !isEnabled && (
          <VStack spacing={4} align="stretch">
            <Text color={textSecondary}>
              Two-factor authentication adds an extra layer of security to your account.
              You'll need to enter a code from your authenticator app in addition to your password when logging in.
            </Text>

            <List spacing={2}>
              <ListItem>
                <ListIcon as={CheckCircleIcon} color="success.500" />
                Protection against password theft
              </ListItem>
              <ListItem>
                <ListIcon as={CheckCircleIcon} color="success.500" />
                Works with Google Authenticator, Authy, and other TOTP apps
              </ListItem>
              <ListItem>
                <ListIcon as={CheckCircleIcon} color="success.500" />
                Backup codes in case you lose your device
              </ListItem>
            </List>

            <Button
              colorScheme="brand"
              onClick={handleEnable2FA}
              isLoading={isLoading}
            >
              Enable Two-Factor Authentication
            </Button>
          </VStack>
        )}

        {setupData && !isEnabled && (
          <VStack spacing={6} align="stretch">
            <Box>
              <Heading size="md" mb={4}>Step 1: Scan QR Code</Heading>
              <Text mb={4} color={textSecondary}>
                Scan this QR code with your authenticator app:
              </Text>
              <Flex justify="center" p={4} bg={qrBg} borderRadius="md" borderWidth={1} borderColor={qrBorderColor}>
                <Image src={setupData.qrCode} alt="2FA QR Code" maxW="250px" />
              </Flex>
              <Text mt={2} fontSize="sm" color={textTertiary}>
                Or manually enter this secret: <Code>{setupData.secret}</Code>
              </Text>
            </Box>

            <Divider />

            <Box>
              <Heading size="md" mb={4}>Step 2: Save Backup Codes</Heading>
              <Alert status="warning" mb={4}>
                <AlertIcon />
                <Text fontSize="sm">
                  Save these backup codes in a secure location. You can use them to access your account if you lose your device.
                </Text>
              </Alert>
              <VStack align="stretch" bg={backupCodesBg} p={4} borderRadius="md">
                {setupData.backupCodes.map((code, idx) => (
                  <HStack key={idx} justify="space-between">
                    <Badge colorScheme="gray">{idx + 1}</Badge>
                    <Code fontFamily="mono">{code}</Code>
                  </HStack>
                ))}
              </VStack>
            </Box>

            <Divider />

            <Box>
              <Heading size="md" mb={4}>Step 3: Verify Setup</Heading>
              <Text mb={4} color={textSecondary}>
                Enter the 6-digit code from your authenticator app:
              </Text>
              <HStack justify="center" mb={4}>
                <PinInput
                  value={verificationCode}
                  onChange={setVerificationCode}
                  size="lg"
                  otp
                  isDisabled={isLoading}
                >
                  <PinInputField />
                  <PinInputField />
                  <PinInputField />
                  <PinInputField />
                  <PinInputField />
                  <PinInputField />
                </PinInput>
              </HStack>
              <Button
                colorScheme="success"
                w="full"
                onClick={handleVerifySetup}
                isLoading={isLoading}
                isDisabled={verificationCode.length !== 6}
              >
                Verify & Enable 2FA
              </Button>
            </Box>
          </VStack>
        )}

        {isEnabled && (
          <VStack spacing={4} align="stretch">
            <Button
              colorScheme="brand"
              onClick={handleRegenerateBackupCodes}
              isLoading={isLoading}
            >
              Regenerate Backup Codes
            </Button>

            {!showDisableForm ? (
              <Button
                colorScheme="accent"
                variant="outline"
                onClick={() => setShowDisableForm(true)}
              >
                Disable 2FA
              </Button>
            ) : (
              <VStack spacing={4} align="stretch" p={4} borderWidth={1} borderRadius="md" borderColor="accent.300">
                <Heading size="sm" color="accent.600">Disable Two-Factor Authentication</Heading>
                <input
                  type="password"
                  placeholder="Your password"
                  value={disablePassword}
                  onChange={(e) => setDisablePassword(e.target.value)}
                  style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
                <HStack justify="center">
                  <PinInput
                    value={disableCode}
                    onChange={setDisableCode}
                    otp
                    isDisabled={isLoading}
                  >
                    <PinInputField />
                    <PinInputField />
                    <PinInputField />
                    <PinInputField />
                    <PinInputField />
                    <PinInputField />
                  </PinInput>
                </HStack>
                <HStack>
                  <Button
                    colorScheme="accent"
                    flex={1}
                    onClick={handleDisable2FA}
                    isLoading={isLoading}
                  >
                    Confirm Disable
                  </Button>
                  <Button
                    variant="ghost"
                    flex={1}
                    onClick={() => {
                      setShowDisableForm(false);
                      setDisablePassword('');
                      setDisableCode('');
                    }}
                  >
                    Cancel
                  </Button>
                </HStack>
              </VStack>
            )}
          </VStack>
        )}

        <Button variant="ghost" onClick={() => navigate('/account')}>
          Back to Account
        </Button>
      </VStack>
    </AuthPageLayout>
  );
}

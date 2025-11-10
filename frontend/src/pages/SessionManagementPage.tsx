import {
  Box,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  useToast,
  Card,
  CardBody,
  Badge,
  IconButton,
  Alert,
  AlertIcon,
  Spinner,
  Flex
} from '@chakra-ui/react';
import { DeleteIcon, CheckCircleIcon } from '@chakra-ui/icons';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSessions, revokeSession } from '../features/auth/api';
import { SessionInfo } from '../types/api';
import { useApiErrorToast } from '../hooks/useApiErrorToast';
import { AuthPageLayout } from '../layouts/AuthPageLayout';

export default function SessionManagementPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const showApiError = useApiErrorToast();

  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [revokingIds, setRevokingIds] = useState<Set<string>>(new Set());

  const loadSessions = async () => {
    setIsLoading(true);
    try {
      const data = await getSessions();
      setSessions(data);
    } catch (error) {
      showApiError(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const handleRevokeSession = async (sessionId: string) => {
    setRevokingIds((prev) => new Set(prev).add(sessionId));
    try {
      await revokeSession(sessionId);
      toast({
        title: 'Session Revoked',
        description: 'The session has been terminated',
        status: 'success',
        duration: 3000,
        isClosable: true
      });
      // Reload sessions
      await loadSessions();
    } catch (error) {
      showApiError(error);
    } finally {
      setRevokingIds((prev) => {
        const next = new Set(prev);
        next.delete(sessionId);
        return next;
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getDeviceIcon = (userAgent: string) => {
    if (/mobile/i.test(userAgent)) return '📱';
    if (/tablet/i.test(userAgent)) return '📱';
    return '💻';
  };

  const getBrowserName = (userAgent: string) => {
    if (/chrome/i.test(userAgent)) return 'Chrome';
    if (/firefox/i.test(userAgent)) return 'Firefox';
    if (/safari/i.test(userAgent)) return 'Safari';
    if (/edge/i.test(userAgent)) return 'Edge';
    return 'Unknown Browser';
  };

  if (isLoading) {
    return (
      <AuthPageLayout maxW="4xl">
        <VStack spacing={6}>
          <Heading size="lg">Active Sessions</Heading>
          <Spinner size="xl" />
        </VStack>
      </AuthPageLayout>
    );
  }

  return (
    <AuthPageLayout maxW="4xl">
      <VStack spacing={6} align="stretch">
        <Flex justify="space-between" align="center">
          <Heading size="lg">Active Sessions</Heading>
          <Button variant="ghost" onClick={() => navigate('/account')}>
            Back to Account
          </Button>
        </Flex>

        <Alert status="info" borderRadius="md">
          <AlertIcon />
          <Text fontSize="sm">
            These are the devices currently logged into your account. 
            If you see an unfamiliar session, revoke it immediately and change your password.
          </Text>
        </Alert>

        <Text color="gray.600">
          You have {sessions.length} active session{sessions.length !== 1 ? 's' : ''}
        </Text>

        {sessions.length === 0 ? (
          <Alert status="warning" borderRadius="md">
            <AlertIcon />
            No active sessions found
          </Alert>
        ) : (
          <VStack spacing={4} align="stretch">
            {sessions.map((session) => (
              <Card key={session._id} variant="outline">
                <CardBody>
                  <Flex justify="space-between" align="flex-start">
                    <HStack spacing={4} flex={1}>
                      <Text fontSize="3xl">{getDeviceIcon(session.userAgent)}</Text>
                      <VStack align="start" spacing={1} flex={1}>
                        <HStack>
                          <Text fontWeight="semibold">
                            {session.deviceName || getBrowserName(session.userAgent)}
                          </Text>
                          {session.isCurrentSession && (
                            <Badge colorScheme="success" display="flex" alignItems="center">
                              <CheckCircleIcon mr={1} />
                              Current
                            </Badge>
                          )}
                        </HStack>
                        <Text fontSize="sm" color="gray.600">
                          {session.ipAddress}
                          {session.location && ` • ${session.location}`}
                        </Text>
                        <Text fontSize="sm" color="gray.500">
                          Last active: {formatDate(session.lastUsedAt)}
                        </Text>
                        <Text fontSize="sm" color="gray.500">
                          Expires: {formatDate(session.expiresAt)}
                        </Text>
                      </VStack>
                    </HStack>
                    {!session.isCurrentSession && (
                      <IconButton
                        aria-label="Revoke session"
                        icon={<DeleteIcon />}
                        colorScheme="accent"
                        variant="ghost"
                        onClick={() => handleRevokeSession(session._id)}
                        isLoading={revokingIds.has(session._id)}
                      />
                    )}
                  </Flex>
                </CardBody>
              </Card>
            ))}
          </VStack>
        )}

        <Alert status="warning" borderRadius="md">
          <AlertIcon />
          <Box>
            <Text fontWeight="semibold" mb={1}>Security Tip</Text>
            <Text fontSize="sm">
              If you see unfamiliar devices or locations, revoke those sessions immediately
              and consider enabling two-factor authentication for extra security.
            </Text>
          </Box>
        </Alert>
      </VStack>
    </AuthPageLayout>
  );
}

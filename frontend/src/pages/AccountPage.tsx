import { useState } from 'react';
import { Badge, Button, Card, CardBody, Heading, Stack, Text, useToast, VStack, HStack, Icon, Divider, Alert, AlertIcon, AlertTitle, AlertDescription, Box } from '@chakra-ui/react';
import { LockIcon, ViewIcon, TimeIcon, EmailIcon, WarningIcon } from '@chakra-ui/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthProvider';
import { useApiErrorToast } from '../hooks/useApiErrorToast';

export const AccountPage = () => {
  const { user, refreshMe } = useAuth();
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const toast = useToast();
  const toastError = useApiErrorToast();

  if (!user) {
    return (
      <Stack spacing={4}>
        <Heading size="md">No account information available</Heading>
        <Text>Please sign in again to view your profile.</Text>
      </Stack>
    );
  }

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await refreshMe();
      toast({ title: 'Profile updated', status: 'success', duration: 3000, position: 'top' });
    } catch (error) {
      toastError(error, 'Failed to refresh profile');
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <VStack spacing={6} align="stretch" maxW="2xl">
      {/* Email Verification Alert */}
      {user.isEmailVerified === false && (
        <Alert status="warning" borderRadius="lg" variant="left-accent">
          <AlertIcon as={WarningIcon} />
          <Box flex="1">
            <AlertTitle>Email Not Verified</AlertTitle>
            <AlertDescription display="block">
              Please verify your email address to access all features. Check your inbox for the verification link.
            </AlertDescription>
          </Box>
          <Button 
            colorScheme="orange" 
            size="sm" 
            onClick={() => navigate('/resend-verification', { state: { email: user.email } })}
            leftIcon={<EmailIcon />}
          >
            Verify Email
          </Button>
        </Alert>
      )}

      {/* Profile Card */}
      <Card shadow="md" borderRadius="lg">
        <CardBody>
          <Stack spacing={4}>
            <Heading size="md">Profile</Heading>
            <Stack spacing={1}>
              <Text fontWeight="medium">Email</Text>
              <HStack>
                <Text>{user.email}</Text>
                {user.isEmailVerified === true && (
                  <Badge colorScheme="success" fontSize="xs">Verified</Badge>
                )}
                {user.isEmailVerified === false && (
                  <Badge colorScheme="orange" fontSize="xs">Not Verified</Badge>
                )}
              </HStack>
            </Stack>
            <Stack spacing={1}>
              <Text fontWeight="medium">Role</Text>
              <Badge colorScheme={user.role === 'admin' ? 'accent' : 'brand'} width="fit-content">
                {user.role}
              </Badge>
            </Stack>
            <Button onClick={handleRefresh} isLoading={isRefreshing} width="fit-content" colorScheme="brand">
              Refresh profile
            </Button>
          </Stack>
        </CardBody>
      </Card>

      {/* Security Settings Card */}
      <Card shadow="md" borderRadius="lg">
        <CardBody>
          <VStack spacing={4} align="stretch">
            <Heading size="md">Security Settings</Heading>
            
            <VStack spacing={3} align="stretch" divider={<Divider />}>
              <HStack justify="space-between" p={2}>
                <HStack spacing={3}>
                  <Icon as={LockIcon} color="brand.500" boxSize={5} />
                  <VStack align="start" spacing={0}>
                    <Text fontWeight="semibold">Change Password</Text>
                    <Text fontSize="sm" color="gray.600">
                      Update your password regularly
                    </Text>
                  </VStack>
                </HStack>
                <Button 
                  size="sm" 
                  colorScheme="brand" 
                  variant="outline"
                  onClick={() => navigate('/account/change-password')}
                >
                  Change
                </Button>
              </HStack>

              <HStack justify="space-between" p={2}>
                <HStack spacing={3}>
                  <Icon as={ViewIcon} color="success.500" boxSize={5} />
                  <VStack align="start" spacing={0}>
                    <Text fontWeight="semibold">Two-Factor Authentication</Text>
                    <Text fontSize="sm" color="gray.600">
                      Add an extra layer of security
                    </Text>
                  </VStack>
                </HStack>
                <Button 
                  size="sm" 
                  colorScheme="success" 
                  variant="outline"
                  onClick={() => navigate('/account/2fa')}
                >
                  Manage
                </Button>
              </HStack>

              <HStack justify="space-between" p={2}>
                <HStack spacing={3}>
                  <Icon as={TimeIcon} color="accent.500" boxSize={5} />
                  <VStack align="start" spacing={0}>
                    <Text fontWeight="semibold">Active Sessions</Text>
                    <Text fontSize="sm" color="gray.600">
                      Manage your logged-in devices
                    </Text>
                  </VStack>
                </HStack>
                <Button 
                  size="sm" 
                  colorScheme="accent" 
                  variant="outline"
                  onClick={() => navigate('/account/sessions')}
                >
                  View
                </Button>
              </HStack>
            </VStack>
          </VStack>
        </CardBody>
      </Card>
    </VStack>
  );
};

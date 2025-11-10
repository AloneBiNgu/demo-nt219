import {
  Box,
  Heading,
  Text,
  Button,
  VStack,
  FormControl,
  FormLabel,
  Input,
  PinInput,
  PinInputField,
  HStack,
  useToast,
  Alert,
  AlertIcon,
  Card,
  CardBody,
  Icon
} from '@chakra-ui/react';
import { LockIcon } from '@chakra-ui/icons';
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { loginWith2FA } from '../features/auth/api';
import { setAccessToken } from '../features/auth/session';
import { useApiErrorToast } from '../hooks/useApiErrorToast';
import { AuthPageLayout } from '../layouts/AuthPageLayout';
import { useAuth } from '../features/auth/AuthProvider';

export default function TwoFactorLoginPage() {
  const { refreshMe } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const showApiError = useApiErrorToast();

  const tempToken = (location.state as any)?.tempToken;
  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!tempToken) {
    navigate('/login', { replace: true });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (code.length !== 6) {
      toast({
        title: 'Invalid Code',
        description: 'Please enter a 6-digit code',
        status: 'warning',
        duration: 3000,
        isClosable: true
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await loginWith2FA(tempToken, code);
      setAccessToken(result.tokens.accessToken);
      
      // Refresh user data in AuthContext
      await refreshMe();
      
      toast({
        title: 'Login Successful',
        description: 'Welcome back!',
        status: 'success',
        duration: 3000,
        isClosable: true
      });

      navigate('/', { replace: true });
    } catch (error) {
      showApiError(error);
      setCode('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthPageLayout>
      <VStack spacing={8}>
        <Icon as={LockIcon} boxSize={16} color="brand.500" />
        
        <VStack spacing={3}>
          <Heading 
            size="xl" 
            bgGradient="linear(to-r, brand.500, brand.600)" 
            bgClip="text"
            textAlign="center"
          >
            Two-Factor Authentication
          </Heading>
          <Text color="gray.600" textAlign="center" fontSize="lg">
            Enter the 6-digit code from your authenticator app
          </Text>
        </VStack>

        <Card shadow="xl" borderRadius="2xl" w="full">
          <CardBody p={8}>
            <Box as="form" onSubmit={handleSubmit}>
              <VStack spacing={6}>
                <FormControl>
                  <FormLabel textAlign="center" fontWeight="semibold">Authentication Code</FormLabel>
                  <HStack justify="center" spacing={4}>
                    <PinInput
                      value={code}
                      onChange={setCode}
                      size="lg"
                      autoFocus
                      otp
                      isDisabled={isSubmitting}
                    >
                      <PinInputField />
                      <PinInputField />
                      <PinInputField />
                      <PinInputField />
                      <PinInputField />
                      <PinInputField />
                    </PinInput>
                  </HStack>
                </FormControl>

                <Button
                  type="submit"
                  colorScheme="brand"
                  w="full"
                  size="lg"
                  isLoading={isSubmitting}
                  isDisabled={code.length !== 6}
                >
                  Verify & Login
                </Button>

                <Alert status="info" borderRadius="lg" variant="left-accent">
                  <AlertIcon />
                  <Text fontSize="sm">
                    You can also use one of your backup codes if you don't have access to your authenticator app.
                  </Text>
                </Alert>

                <Button 
                  variant="ghost" 
                  onClick={() => navigate('/login')} 
                  w="full"
                  colorScheme="brand"
                >
                  Back to Login
                </Button>
              </VStack>
            </Box>
          </CardBody>
        </Card>
      </VStack>
    </AuthPageLayout>
  );
}

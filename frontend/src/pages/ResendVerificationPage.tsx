import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  VStack,
  FormControl,
  FormLabel,
  Input,
  useToast,
  Alert,
  AlertIcon,
  Card,
  CardBody,
  Icon
} from '@chakra-ui/react';
import { EmailIcon } from '@chakra-ui/icons';
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { resendVerification } from '../features/auth/api';
import { useApiErrorToast } from '../hooks/useApiErrorToast';

export default function ResendVerificationPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const showApiError = useApiErrorToast();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Check if user just registered or tried to login without verification
  const justRegistered = location.state?.justRegistered || false;
  const fromLogin = location.state?.fromLogin || false;
  const emailFromState = location.state?.email || '';

  useEffect(() => {
    if (emailFromState) {
      setEmail(emailFromState);
    }
  }, [emailFromState]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast({
        title: 'Email Required',
        description: 'Please enter your email address',
        status: 'warning',
        duration: 3000,
        isClosable: true
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await resendVerification(email);
      setSuccess(true);
      toast({
        title: 'Email Sent',
        description: result.message,
        status: 'success',
        duration: 8000,
        isClosable: true
      });
    } catch (error) {
      showApiError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container maxW="md" py={16}>
      <VStack spacing={8}>
        <Icon as={EmailIcon} boxSize={16} color="brand.500" />
        
        <VStack spacing={3}>
          <Heading 
            size="xl" 
            bgGradient="linear(to-r, brand.500, brand.600)" 
            bgClip="text"
            textAlign="center"
          >
            {justRegistered || fromLogin ? 'Verify Your Email' : 'Resend Verification Email'}
          </Heading>
          <Text color="gray.600" textAlign="center" fontSize="lg">
            {justRegistered || fromLogin
              ? 'We\'ve sent a verification link to your email. Please check your inbox and spam folder.'
              : 'Enter your email address and we\'ll send you a new verification link.'}
          </Text>
        </VStack>

        {justRegistered && (
          <Alert status="info" borderRadius="lg" variant="left-accent">
            <AlertIcon />
            <VStack align="start" spacing={1}>
              <Text fontWeight="semibold">Registration Successful!</Text>
              <Text fontSize="sm">
                Please verify your email before logging in. Didn't receive the email? Click the button below to resend.
              </Text>
            </VStack>
          </Alert>
        )}

        {fromLogin && (
          <Alert status="warning" borderRadius="lg" variant="left-accent">
            <AlertIcon />
            <VStack align="start" spacing={1}>
              <Text fontWeight="semibold">Email Verification Required</Text>
              <Text fontSize="sm">
                You must verify your email address before you can log in. Please check your inbox for the verification link, or click below to resend it.
              </Text>
            </VStack>
          </Alert>
        )}

        {success && (
          <Alert status="success" borderRadius="lg" variant="left-accent">
            <AlertIcon />
            Verification email sent! Please check your inbox and spam folder.
          </Alert>
        )}

        <Card shadow="xl" borderRadius="2xl" w="full">
          <CardBody p={8}>
            <Box as="form" onSubmit={handleSubmit}>
              <VStack spacing={6}>
                <FormControl isRequired>
                  <FormLabel fontWeight="semibold">Email Address</FormLabel>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    size="lg"
                    disabled={isSubmitting || success}
                    autoFocus={!emailFromState}
                  />
                </FormControl>

                <Button
                  type="submit"
                  colorScheme="brand"
                  w="full"
                  size="lg"
                  isLoading={isSubmitting}
                  isDisabled={success}
                >
                  {justRegistered ? 'Resend Verification Email' : 'Send Verification Email'}
                </Button>

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
    </Container>
  );
}

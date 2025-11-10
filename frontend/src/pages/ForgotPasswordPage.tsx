import {
  Box,
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
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { forgotPassword } from '../features/auth/api';
import { useApiErrorToast } from '../hooks/useApiErrorToast';
import { AuthPageLayout } from '../layouts/AuthPageLayout';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const showApiError = useApiErrorToast();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

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
      const result = await forgotPassword(email);
      setSuccess(true);
      toast({
        title: 'Email Sent',
        description: result.message,
        status: 'success',
        duration: 8000,
        isClosable: true
      });
    } catch (error) {
      // Always show success to prevent email enumeration
      setSuccess(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthPageLayout>
      <VStack spacing={8}>
        <Icon as={EmailIcon} boxSize={16} color="brand.500" />
        
        <VStack spacing={3}>
          <Heading 
            size="xl" 
            bgGradient="linear(to-r, brand.500, brand.600)" 
            bgClip="text"
            textAlign="center"
          >
            Forgot Password
          </Heading>
          <Text color="gray.600" textAlign="center" fontSize="lg">
            Enter your email address and we'll send you a link to reset your password.
          </Text>
        </VStack>

        {success && (
          <Alert status="success" borderRadius="lg" variant="left-accent">
            <AlertIcon />
            If your email is registered, you will receive a password reset link shortly.
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
                  Send Reset Link
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
    </AuthPageLayout>
  );
}

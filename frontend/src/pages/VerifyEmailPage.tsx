import { Heading, Text, Button, VStack, useToast, Alert, AlertIcon, Icon } from '@chakra-ui/react';
import { CheckCircleIcon } from '@chakra-ui/icons';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { verifyEmail } from '../features/auth/api';
import { AuthPageLayout } from '../layouts/AuthPageLayout';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [isVerifying, setIsVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const token = searchParams.get('token');

  useEffect(() => {
    let cancelled = false;
    
    const verify = async () => {
      if (!token) {
        if (!cancelled) {
          setError('Verification token is missing');
          setIsVerifying(false);
        }
        return;
      }

      try {
        const result = await verifyEmail(token);
        
        if (cancelled) return;
        
        setSuccess(true);
        toast({
          title: 'Email Verified',
          description: result.message || 'Your email has been verified successfully',
          status: 'success',
          duration: 5000,
          isClosable: true
        });

        // Redirect to login after 3 seconds
        setTimeout(() => {
          if (!cancelled) {
            navigate('/login');
          }
        }, 3000);
      } catch (err: any) {
        if (cancelled) return;
        
        const message = err.response?.data?.message || 'Failed to verify email';
        setError(message);
        toast({
          title: 'Verification Failed',
          description: message,
          status: 'error',
          duration: 8000,
          isClosable: true
        });
      } finally {
        if (!cancelled) {
          setIsVerifying(false);
        }
      }
    };

    verify();
    
    return () => {
      cancelled = true;
    };
  }, [token, navigate, toast]);

  return (
    <AuthPageLayout>
      <VStack spacing={8}>
        {!isVerifying && success && (
          <Icon as={CheckCircleIcon} boxSize={20} color="success.500" />
        )}
        
        <Heading 
          size="xl" 
          bgGradient="linear(to-r, brand.500, brand.600)" 
          bgClip="text"
          textAlign="center"
        >
          Email Verification
        </Heading>

        {isVerifying && (
          <Alert status="info" borderRadius="lg" variant="left-accent">
            <AlertIcon />
            Verifying your email address...
          </Alert>
        )}

        {success && (
          <Alert status="success" borderRadius="lg" variant="left-accent">
            <AlertIcon />
            Email verified successfully! Redirecting to login...
          </Alert>
        )}

        {error && (
          <Alert status="error" borderRadius="lg" variant="left-accent">
            <AlertIcon />
            {error}
          </Alert>
        )}

        {!isVerifying && !success && (
          <VStack spacing={4} w="full">
            <Text textAlign="center" color="gray.600">
              {error ? 'The verification link may have expired or is invalid.' : ''}
            </Text>
            <Button colorScheme="brand" onClick={() => navigate('/login')} w="full" size="lg">
              Go to Login
            </Button>
            <Button variant="ghost" onClick={() => navigate('/resend-verification')} w="full" colorScheme="brand">
              Resend Verification Email
            </Button>
          </VStack>
        )}
      </VStack>
    </AuthPageLayout>
  );
}

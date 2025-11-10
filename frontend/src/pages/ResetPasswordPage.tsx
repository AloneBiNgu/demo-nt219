import {
  Box,
  Heading,
  Text,
  Button,
  VStack,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputRightElement,
  IconButton,
  useToast,
  Alert,
  AlertIcon,
  List,
  ListItem,
  ListIcon,
  Card,
  CardBody,
  Icon,
  useColorModeValue
} from '@chakra-ui/react';
import { ViewIcon, ViewOffIcon, CheckCircleIcon, WarningIcon, LockIcon } from '@chakra-ui/icons';
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { validateResetToken, resetPassword } from '../features/auth/api';
import { useApiErrorToast } from '../hooks/useApiErrorToast';
import { AuthPageLayout } from '../layouts/AuthPageLayout';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const showApiError = useApiErrorToast();
  
  const requirementsBg = useColorModeValue('brand.50', 'gray.700');
  const requirementsBorder = useColorModeValue('brand.200', 'gray.600');
  const requirementsTextColor = useColorModeValue('brand.700', 'brand.200');

  const token = searchParams.get('token');
  const [isValidating, setIsValidating] = useState(true);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const validate = async () => {
      if (!token) {
        setIsValidating(false);
        setIsTokenValid(false);
        return;
      }

      try {
        await validateResetToken(token);
        setIsTokenValid(true);
      } catch (error) {
        setIsTokenValid(false);
        showApiError(error);
      } finally {
        setIsValidating(false);
      }
    };

    validate();
  }, [token, showApiError]);

  const passwordRequirements = [
    { met: newPassword.length >= 12, text: 'At least 12 characters' },
    { met: /[a-z]/.test(newPassword), text: 'One lowercase letter' },
    { met: /[A-Z]/.test(newPassword), text: 'One uppercase letter' },
    { met: /\d/.test(newPassword), text: 'One number' },
    { met: /[!@#$%^&*()_+=\-{};:<>?.,]/.test(newPassword), text: 'One special character' }
  ];

  const isPasswordValid = passwordRequirements.every((req) => req.met);
  const doPasswordsMatch = newPassword === confirmPassword && confirmPassword !== '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      toast({
        title: 'Invalid Token',
        description: 'Reset token is missing',
        status: 'error',
        duration: 3000
      });
      return;
    }

    if (!isPasswordValid) {
      toast({
        title: 'Invalid Password',
        description: 'Please meet all password requirements',
        status: 'warning',
        duration: 3000
      });
      return;
    }

    if (!doPasswordsMatch) {
      toast({
        title: 'Passwords Don\'t Match',
        description: 'Please make sure both passwords match',
        status: 'warning',
        duration: 3000
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await resetPassword(token, newPassword);
      toast({
        title: 'Password Reset',
        description: result.message,
        status: 'success',
        duration: 5000,
        isClosable: true
      });
      navigate('/login');
    } catch (error) {
      showApiError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isValidating) {
    return (
      <AuthPageLayout>
        <VStack spacing={8}>
          <Icon as={LockIcon} boxSize={16} color="brand.500" />
          <Heading 
            size="xl" 
            bgGradient="linear(to-r, brand.500, brand.600)" 
            bgClip="text"
            textAlign="center"
          >
            Reset Password
          </Heading>
          <Alert status="info" borderRadius="lg" variant="left-accent">
            <AlertIcon />
            Validating reset token...
          </Alert>
        </VStack>
      </AuthPageLayout>
    );
  }

  if (!isTokenValid) {
    return (
      <AuthPageLayout>
        <VStack spacing={8}>
          <Icon as={WarningIcon} boxSize={16} color="accent.500" />
          <Heading 
            size="xl" 
            bgGradient="linear(to-r, brand.500, brand.600)" 
            bgClip="text"
            textAlign="center"
          >
            Reset Password
          </Heading>
          <Alert status="error" borderRadius="lg" variant="left-accent">
            <AlertIcon />
            This password reset link is invalid or has expired.
          </Alert>
          <Button colorScheme="brand" onClick={() => navigate('/forgot-password')} w="full" size="lg">
            Request New Reset Link
          </Button>
          <Button variant="ghost" onClick={() => navigate('/login')} w="full">
            Back to Login
          </Button>
        </VStack>
      </AuthPageLayout>
    );
  }

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
            Reset Password
          </Heading>
          <Text color="gray.600" textAlign="center" fontSize="lg">
            Choose a strong password for your account
          </Text>
        </VStack>

        <Card shadow="xl" borderRadius="2xl" w="full">
          <CardBody p={8}>
            <Box as="form" onSubmit={handleSubmit}>
              <VStack spacing={6}>
                <FormControl isRequired>
                  <FormLabel fontWeight="semibold">New Password</FormLabel>
                  <InputGroup>
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      size="lg"
                    />
                    <InputRightElement height="full">
                      <IconButton
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
                        onClick={() => setShowPassword(!showPassword)}
                        variant="ghost"
                        size="sm"
                      />
                    </InputRightElement>
                  </InputGroup>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel fontWeight="semibold">Confirm Password</FormLabel>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    size="lg"
                  />
                </FormControl>

                <Box w="full" p={4} bg={requirementsBg} borderRadius="lg" border="1px" borderColor={requirementsBorder}>
                  <Text fontSize="sm" fontWeight="bold" mb={2} color={requirementsTextColor}>
                    Password Requirements:
                  </Text>
                  <List spacing={2}>
                    {passwordRequirements.map((req, idx) => (
                      <ListItem key={idx} fontSize="sm">
                        <ListIcon
                          as={req.met ? CheckCircleIcon : WarningIcon}
                          color={req.met ? 'success.500' : 'gray.400'}
                        />
                        {req.text}
                      </ListItem>
                    ))}
                  </List>
                </Box>

                {confirmPassword && (
                  <Alert status={doPasswordsMatch ? 'success' : 'warning'} borderRadius="lg" variant="left-accent">
                    <AlertIcon />
                    {doPasswordsMatch ? 'Passwords match' : 'Passwords do not match'}
                  </Alert>
                )}

                <Button
                  type="submit"
                  colorScheme="brand"
                  w="full"
                  size="lg"
                  isLoading={isSubmitting}
                  isDisabled={!isPasswordValid || !doPasswordsMatch}
                >
                  Reset Password
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

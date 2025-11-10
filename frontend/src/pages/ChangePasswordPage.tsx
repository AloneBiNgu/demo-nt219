import {
  Box,
  Heading,
  Button,
  VStack,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputRightElement,
  IconButton,
  useToast,
  List,
  ListItem,
  ListIcon,
  Alert,
  AlertIcon,
  Card,
  CardBody,
  Icon,
  useColorModeValue
} from '@chakra-ui/react';
import { ViewIcon, ViewOffIcon, CheckCircleIcon, WarningIcon, LockIcon } from '@chakra-ui/icons';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { changePassword } from '../features/auth/api';
import { clearAccessToken } from '../features/auth/session';
import { useApiErrorToast } from '../hooks/useApiErrorToast';
import { AuthPageLayout } from '../layouts/AuthPageLayout';

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const showApiError = useApiErrorToast();
  
  const requirementsBg = useColorModeValue('brand.50', 'gray.700');
  const requirementsBorder = useColorModeValue('brand.200', 'gray.600');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const passwordRequirements = [
    { met: newPassword.length >= 12, text: 'At least 12 characters' },
    { met: /[a-z]/.test(newPassword), text: 'One lowercase letter' },
    { met: /[A-Z]/.test(newPassword), text: 'One uppercase letter' },
    { met: /\d/.test(newPassword), text: 'One number' },
    { met: /[!@#$%^&*()_+=\-{};:<>?.,]/.test(newPassword), text: 'One special character' },
    { met: newPassword !== currentPassword && newPassword !== '', text: 'Different from current password' }
  ];

  const isPasswordValid = passwordRequirements.every((req) => req.met);
  const doPasswordsMatch = newPassword === confirmPassword && confirmPassword !== '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword) {
      toast({
        title: 'Current Password Required',
        description: 'Please enter your current password',
        status: 'warning',
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
      const result = await changePassword(currentPassword, newPassword);
      
      // Clear token since password change invalidates all tokens
      clearAccessToken();
      
      toast({
        title: 'Password Changed',
        description: result.message,
        status: 'success',
        duration: 5000,
        isClosable: true
      });

      // Redirect to login
      navigate('/login');
    } catch (error) {
      showApiError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthPageLayout maxW="lg">
      <VStack spacing={8}>
        <Icon as={LockIcon} boxSize={12} color="brand.500" />
        
        <Heading 
          size="lg" 
          bgGradient="linear(to-r, brand.500, brand.600)" 
          bgClip="text"
          textAlign="center"
        >
          Change Password
        </Heading>

        <Alert status="info" borderRadius="lg" variant="left-accent">
          <AlertIcon />
          After changing your password, you'll need to log in again on all devices.
        </Alert>

        <Card shadow="xl" borderRadius="2xl" w="full">
          <CardBody p={8}>
            <Box as="form" onSubmit={handleSubmit}>
              <VStack spacing={6}>
                <FormControl isRequired>
                  <FormLabel fontWeight="semibold">Current Password</FormLabel>
                  <InputGroup>
                    <Input
                      type={showPasswords ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      size="lg"
                    />
                    <InputRightElement height="full">
                      <IconButton
                        aria-label={showPasswords ? 'Hide passwords' : 'Show passwords'}
                        icon={showPasswords ? <ViewOffIcon /> : <ViewIcon />}
                        onClick={() => setShowPasswords(!showPasswords)}
                        variant="ghost"
                        size="sm"
                      />
                    </InputRightElement>
                  </InputGroup>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel fontWeight="semibold">New Password</FormLabel>
                  <Input
                    type={showPasswords ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    size="lg"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel fontWeight="semibold">Confirm New Password</FormLabel>
                  <Input
                    type={showPasswords ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    size="lg"
                  />
                </FormControl>

                <Box w="full" p={4} bg={requirementsBg} borderRadius="lg" border="1px" borderColor={requirementsBorder}>
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
                  Change Password
                </Button>

                <Button 
                  variant="ghost" 
                  onClick={() => navigate('/account')} 
                  w="full"
                  colorScheme="brand"
                >
                  Cancel
                </Button>
              </VStack>
            </Box>
          </CardBody>
        </Card>
      </VStack>
    </AuthPageLayout>
  );
}

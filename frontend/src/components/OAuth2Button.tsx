import { Button, Icon } from '@chakra-ui/react';
import { FaKey } from 'react-icons/fa';

interface OAuth2ButtonProps {
  provider?: string;
  label?: string;
}

export const OAuth2Button = ({ provider = 'OAuth2', label }: OAuth2ButtonProps) => {
  const handleOAuth2Login = () => {
    // Redirect to backend OAuth2 endpoint
    const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';
    window.location.href = `${apiUrl}/oauth/oauth2`;
  };

  return (
    <Button
      width="100%"
      leftIcon={<Icon as={FaKey} />}
      onClick={handleOAuth2Login}
      variant="outline"
      colorScheme="purple"
      size="lg"
    >
      {label || `Sign in with ${provider}`}
    </Button>
  );
};

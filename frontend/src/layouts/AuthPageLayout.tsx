import { Box, Container, useColorModeValue } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { ReactNode } from 'react';

const MotionBox = motion(Box);

interface AuthPageLayoutProps {
  children: ReactNode;
  maxW?: string;
}

export const AuthPageLayout = ({ children, maxW = 'md' }: AuthPageLayoutProps) => {
  const heroBg = useColorModeValue(
    'linear(to-br, brand.400, accent.400)',
    'linear(to-br, brand.600, accent.600)'
  );

  return (
    <Box minH="100vh" position="relative" overflow="hidden" bg={useColorModeValue('gray.50', 'gray.900')}>
      {/* Animated gradient orbs */}
      <Box
        position="absolute"
        top="-20%"
        right="-10%"
        width="500px"
        height="500px"
        borderRadius="full"
        bgGradient={heroBg}
        opacity={0.2}
        filter="blur(100px)"
        animation="float 20s ease-in-out infinite"
      />
      <Box
        position="absolute"
        bottom="-15%"
        left="-10%"
        width="400px"
        height="400px"
        borderRadius="full"
        bgGradient={heroBg}
        opacity={0.15}
        filter="blur(100px)"
        animation="float 15s ease-in-out infinite reverse"
      />

      <Container maxW={maxW} position="relative" zIndex={1} py={10} minH="100vh" display="flex" alignItems="center">
        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          width="full"
        >
          {children}
        </MotionBox>
      </Container>

      {/* CSS for floating animation */}
      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }
      `}</style>
    </Box>
  );
};

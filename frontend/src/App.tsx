import { Box } from '@chakra-ui/react';
import { AppRoutes } from './routes';
import { AppLayout } from './layouts/AppLayout';

const App = () => {
  return (
    <AppLayout>
      <Box as="main" py={6} px={{ base: 4, md: 8 }}>
        <AppRoutes />
      </Box>
    </AppLayout>
  );
};

export default App;

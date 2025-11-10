import {
  Box,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Stack,
  Text,
  useColorModeValue,
  Icon,
  HStack,
  Badge
} from '@chakra-ui/react';
import { FiSettings, FiCreditCard, FiMail, FiGlobe } from 'react-icons/fi';
import { AdminLayout } from '../../layouts/AdminLayout';

export const AdminSettingsPage = () => {
  const cardBg = useColorModeValue('white', 'gray.800');

  return (
    <AdminLayout>
      <Stack spacing={8}>
        {/* Page Header */}
        <Box>
          <Heading size="lg" mb={2}>
            Settings
          </Heading>
          <Text color="gray.500">Configure your store and admin preferences</Text>
        </Box>

        {/* Settings Cards */}
        <Stack spacing={6}>
          <Card bg={cardBg} variant="elevated">
            <CardHeader>
              <HStack>
                <Icon as={FiGlobe} color="brand.500" />
                <Heading size="md">General Settings</Heading>
              </HStack>
            </CardHeader>
            <CardBody>
              <Stack spacing={4}>
                <HStack justify="space-between">
                  <Box>
                    <Text fontWeight="medium">Store Name</Text>
                    <Text fontSize="sm" color="gray.500">
                      Secure Shop
                    </Text>
                  </Box>
                  <Badge colorScheme="green">Active</Badge>
                </HStack>
                <HStack justify="space-between">
                  <Box>
                    <Text fontWeight="medium">Store URL</Text>
                    <Text fontSize="sm" color="gray.500">
                      https://secureshop.com
                    </Text>
                  </Box>
                </HStack>
                <HStack justify="space-between">
                  <Box>
                    <Text fontWeight="medium">Default Currency</Text>
                    <Text fontSize="sm" color="gray.500">
                      USD
                    </Text>
                  </Box>
                </HStack>
              </Stack>
            </CardBody>
          </Card>

          <Card bg={cardBg} variant="elevated">
            <CardHeader>
              <HStack>
                <Icon as={FiCreditCard} color="brand.500" />
                <Heading size="md">Payment Settings</Heading>
              </HStack>
            </CardHeader>
            <CardBody>
              <Stack spacing={4}>
                <HStack justify="space-between">
                  <Box>
                    <Text fontWeight="medium">Stripe Integration</Text>
                    <Text fontSize="sm" color="gray.500">
                      Payment processing via Stripe
                    </Text>
                  </Box>
                  <Badge colorScheme="green">Enabled</Badge>
                </HStack>
                <HStack justify="space-between">
                  <Box>
                    <Text fontWeight="medium">Payment Methods</Text>
                    <Text fontSize="sm" color="gray.500">
                      Credit Card, Debit Card
                    </Text>
                  </Box>
                </HStack>
              </Stack>
            </CardBody>
          </Card>

          <Card bg={cardBg} variant="elevated">
            <CardHeader>
              <HStack>
                <Icon as={FiMail} color="brand.500" />
                <Heading size="md">Email Settings</Heading>
              </HStack>
            </CardHeader>
            <CardBody>
              <Stack spacing={4}>
                <HStack justify="space-between">
                  <Box>
                    <Text fontWeight="medium">Order Confirmation</Text>
                    <Text fontSize="sm" color="gray.500">
                      Send email on order completion
                    </Text>
                  </Box>
                  <Badge colorScheme="green">Enabled</Badge>
                </HStack>
                <HStack justify="space-between">
                  <Box>
                    <Text fontWeight="medium">Shipping Updates</Text>
                    <Text fontSize="sm" color="gray.500">
                      Notify customers of shipping status
                    </Text>
                  </Box>
                  <Badge colorScheme="green">Enabled</Badge>
                </HStack>
              </Stack>
            </CardBody>
          </Card>

          <Card bg={cardBg} variant="elevated">
            <CardHeader>
              <HStack>
                <Icon as={FiSettings} color="brand.500" />
                <Heading size="md">System Settings</Heading>
              </HStack>
            </CardHeader>
            <CardBody>
              <Stack spacing={4}>
                <HStack justify="space-between">
                  <Box>
                    <Text fontWeight="medium">API Version</Text>
                    <Text fontSize="sm" color="gray.500">
                      v1.0.0
                    </Text>
                  </Box>
                </HStack>
                <HStack justify="space-between">
                  <Box>
                    <Text fontWeight="medium">Database</Text>
                    <Text fontSize="sm" color="gray.500">
                      MongoDB
                    </Text>
                  </Box>
                  <Badge colorScheme="green">Connected</Badge>
                </HStack>
                <HStack justify="space-between">
                  <Box>
                    <Text fontWeight="medium">Cache</Text>
                    <Text fontSize="sm" color="gray.500">
                      Redis (Optional)
                    </Text>
                  </Box>
                  <Badge colorScheme="gray">Not Configured</Badge>
                </HStack>
              </Stack>
            </CardBody>
          </Card>
        </Stack>

        <Box
          p={6}
          borderRadius="lg"
          bg={useColorModeValue('blue.50', 'blue.900')}
          border="1px"
          borderColor={useColorModeValue('blue.200', 'blue.700')}
        >
          <HStack spacing={3}>
            <Icon as={FiSettings} color="blue.500" boxSize={6} />
            <Box>
              <Text fontWeight="semibold" color={useColorModeValue('blue.800', 'blue.200')}>
                Settings Management
              </Text>
              <Text fontSize="sm" color={useColorModeValue('blue.700', 'blue.300')}>
                This is a demo page. In production, these settings would be fully configurable with forms and validation.
              </Text>
            </Box>
          </HStack>
        </Box>
      </Stack>
    </AdminLayout>
  );
};

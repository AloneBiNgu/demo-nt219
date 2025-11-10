import {
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  Heading,
  Icon,
  Spinner,
  Stack,
  Table,
  Tbody,
  Td,
  Text,
  Tfoot,
  Th,
  Thead,
  Tr,
  useColorModeValue,
  useToast
} from '@chakra-ui/react';
import dayjs from 'dayjs';
import { MdPayment } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import { useMyOrdersQuery } from '../features/orders/queries';
import { formatCurrency } from '../utils/currency';

export const OrdersPage = () => {
  const { data: orders, isLoading, isError } = useMyOrdersQuery();
  const textSecondary = useColorModeValue('gray.600', 'gray.400');
  const navigate = useNavigate();
  const toast = useToast();

  const handleContinuePayment = (orderId: string) => {
    navigate(`/checkout/resume/${orderId}`);
  };

  const isOrderExpired = (createdAt: string) => {
    const orderDate = dayjs(createdAt);
    const hoursElapsed = dayjs().diff(orderDate, 'hour');
    return hoursElapsed >= 24;
  };

  if (isLoading) {
    return (
      <Stack align="center" py={16}>
        <Spinner size="lg" />
        <Text>Loading your orders...</Text>
      </Stack>
    );
  }

  if (isError) {
    return (
      <Box textAlign="center" py={16}>
        <Heading size="md" mb={2}>
          Unable to load orders
        </Heading>
        <Text color={textSecondary}>Please try again a little later.</Text>
      </Box>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <Box textAlign="center" py={16}>
        <Heading size="md" mb={2}>
          You haven&apos;t placed any orders yet
        </Heading>
        <Text color={textSecondary}>Browse our products to get started.</Text>
      </Box>
    );
  }

  return (
    <Stack spacing={6}>
      <Heading size="lg">My orders</Heading>
      <Stack spacing={4}>
        {orders.map(order => (
          <Card key={order._id} variant="outline" shadow="sm">
            <CardBody>
              <Stack spacing={4}>
                <Stack direction={{ base: 'column', md: 'row' }} justify="space-between" align={{ md: 'center' }}>
                  <Stack spacing={1}>
                    <Text fontWeight="medium">Order ID</Text>
                    <Text fontFamily="mono" fontSize="sm">
                      {order._id}
                    </Text>
                  </Stack>
                  <Stack direction="row" spacing={3} align="center">
                    <Badge colorScheme={order.status === 'paid' ? 'green' : order.status === 'cancelled' ? 'red' : 'yellow'}>
                      {order.status}
                    </Badge>
                    <Text color={textSecondary}>{dayjs(order.createdAt).format('MMM D, YYYY h:mm A')}</Text>
                  </Stack>
                </Stack>

                {/* Show "Continue Payment" button for processing orders */}
                {order.status === 'processing' && !isOrderExpired(order.createdAt) && (
                  <Button
                    leftIcon={<Icon as={MdPayment} />}
                    colorScheme="brand"
                    size="sm"
                    onClick={() => handleContinuePayment(order._id)}
                  >
                    Continue Payment
                  </Button>
                )}

                {/* Show expiration warning */}
                {order.status === 'processing' && isOrderExpired(order.createdAt) && (
                  <Text fontSize="sm" color="red.500">
                    This order has expired and will be cancelled automatically.
                  </Text>
                )}

                <Box overflowX="auto">
                  <Table size="sm" variant="simple">
                    <Thead>
                      <Tr>
                        <Th>Product</Th>
                        <Th isNumeric>Quantity</Th>
                        <Th isNumeric>Price</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {order.items.map(item => (
                        <Tr key={`${order._id}-${item.productId}`}>
                          <Td>{item.name}</Td>
                          <Td isNumeric>{item.quantity}</Td>
                          <Td isNumeric>{formatCurrency(item.price, item.currency)}</Td>
                        </Tr>
                      ))}
                    </Tbody>
                    <Tfoot>
                      <Tr>
                        <Th>Total</Th>
                        <Th />
                        <Th isNumeric>{formatCurrency(order.totalAmount, order.currency)}</Th>
                      </Tr>
                    </Tfoot>
                  </Table>
                </Box>
              </Stack>
            </CardBody>
          </Card>
        ))}
      </Stack>
    </Stack>
  );
};

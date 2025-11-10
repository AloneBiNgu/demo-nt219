import { useState } from 'react';
import {
  Box,
  Card,
  CardBody,
  CardHeader,
  Grid,
  GridItem,
  Heading,
  HStack,
  Icon,
  Select,
  Skeleton,
  Stack,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useColorModeValue,
  Progress,
  Badge
} from '@chakra-ui/react';
import { FiTrendingUp, FiDollarSign, FiPackage, FiShoppingCart } from 'react-icons/fi';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { AdminLayout } from '../../layouts/AdminLayout';
import {
  useSalesAnalyticsQuery,
  useTopProductsQuery
} from '../../features/analytics/queries';
import { formatCurrency } from '../../utils/currency';

dayjs.extend(relativeTime);

export const AdminAnalyticsPage = () => {
  const [salesPeriod, setSalesPeriod] = useState('30d');
  
  const { data: salesData, isLoading: salesLoading } = useSalesAnalyticsQuery(salesPeriod);
  const { data: topProducts, isLoading: productsLoading } = useTopProductsQuery(10);

  const cardBg = useColorModeValue('white', 'gray.800');

  const totalRevenue = salesData?.reduce((sum, point) => sum + point.revenue, 0) || 0;
  const totalOrders = salesData?.reduce((sum, point) => sum + point.orders, 0) || 0;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  return (
    <AdminLayout>
      <Stack spacing={8}>
        {/* Page Header */}
        <Box>
          <Heading size="lg" mb={2}>
            Analytics & Reports
          </Heading>
          <Text color="gray.500">Deep insights into your store's performance</Text>
        </Box>

        {/* Period Selector */}
        <HStack justify="space-between">
          <HStack>
            <Icon as={FiTrendingUp} color="brand.500" boxSize={6} />
            <Heading size="md">Sales Performance</Heading>
          </HStack>
          <Select
            w="200px"
            value={salesPeriod}
            onChange={e => setSalesPeriod(e.target.value)}
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </Select>
        </HStack>

        {/* Summary Cards */}
        <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={6}>
          <GridItem>
            <Card bg={cardBg} variant="elevated">
              <CardBody>
                <HStack spacing={3}>
                  <Box p={3} bg="green.50" borderRadius="lg">
                    <Icon as={FiDollarSign} w={6} h={6} color="green.500" />
                  </Box>
                  <Box>
                    <Text fontSize="sm" color="gray.500">
                      Total Revenue
                    </Text>
                    <Text fontSize="2xl" fontWeight="bold">
                      {formatCurrency(totalRevenue, 'USD')}
                    </Text>
                  </Box>
                </HStack>
              </CardBody>
            </Card>
          </GridItem>
          <GridItem>
            <Card bg={cardBg} variant="elevated">
              <CardBody>
                <HStack spacing={3}>
                  <Box p={3} bg="blue.50" borderRadius="lg">
                    <Icon as={FiShoppingCart} w={6} h={6} color="blue.500" />
                  </Box>
                  <Box>
                    <Text fontSize="sm" color="gray.500">
                      Total Orders
                    </Text>
                    <Text fontSize="2xl" fontWeight="bold">
                      {totalOrders}
                    </Text>
                  </Box>
                </HStack>
              </CardBody>
            </Card>
          </GridItem>
          <GridItem>
            <Card bg={cardBg} variant="elevated">
              <CardBody>
                <HStack spacing={3}>
                  <Box p={3} bg="purple.50" borderRadius="lg">
                    <Icon as={FiPackage} w={6} h={6} color="purple.500" />
                  </Box>
                  <Box>
                    <Text fontSize="sm" color="gray.500">
                      Avg. Order Value
                    </Text>
                    <Text fontSize="2xl" fontWeight="bold">
                      {formatCurrency(avgOrderValue, 'USD')}
                    </Text>
                  </Box>
                </HStack>
              </CardBody>
            </Card>
          </GridItem>
        </Grid>

        {/* Daily Sales Chart */}
        <Card bg={cardBg} variant="elevated">
          <CardHeader>
            <Heading size="md">Daily Sales Breakdown</Heading>
          </CardHeader>
          <CardBody>
            {salesLoading ? (
              <Skeleton height="400px" />
            ) : (
              <Stack spacing={3}>
                {salesData?.map((point, index) => {
                  const maxRevenue = Math.max(...(salesData?.map(p => p.revenue) || [1]));
                  const percentage = (point.revenue / maxRevenue) * 100;
                  
                  return (
                    <Box key={index}>
                      <HStack justify="space-between" mb={2}>
                        <Text fontSize="sm" fontWeight="medium">
                          {dayjs(point.date).format('MMM DD, YYYY')}
                        </Text>
                        <HStack spacing={4}>
                          <Badge colorScheme="blue">{point.orders} orders</Badge>
                          <Text fontWeight="bold">{formatCurrency(point.revenue, 'USD')}</Text>
                        </HStack>
                      </HStack>
                      <Progress value={percentage} colorScheme="green" size="sm" borderRadius="full" />
                    </Box>
                  );
                })}
              </Stack>
            )}
          </CardBody>
        </Card>

        {/* Top Products */}
        <Card bg={cardBg} variant="elevated">
          <CardHeader>
            <HStack>
              <Icon as={FiPackage} color="brand.500" />
              <Heading size="md">Top Performing Products</Heading>
            </HStack>
          </CardHeader>
          <CardBody>
            {productsLoading ? (
              <Skeleton height="300px" />
            ) : (
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Rank</Th>
                    <Th>Product</Th>
                    <Th isNumeric>Units Sold</Th>
                    <Th isNumeric>Revenue</Th>
                    <Th>Performance</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {topProducts?.map((product, index) => {
                    const maxRevenue = Math.max(...(topProducts?.map(p => p.totalRevenue) || [1]));
                    const percentage = (product.totalRevenue / maxRevenue) * 100;
                    
                    return (
                      <Tr key={index}>
                        <Td>
                          <Badge
                            colorScheme={index === 0 ? 'gold' : index === 1 ? 'gray' : index === 2 ? 'orange' : 'blue'}
                            fontSize="md"
                            px={3}
                            py={1}
                          >
                            #{index + 1}
                          </Badge>
                        </Td>
                        <Td maxW="300px">
                          <Text fontWeight="medium" noOfLines={1}>
                            {product.name}
                          </Text>
                        </Td>
                        <Td isNumeric>
                          <Text fontWeight="semibold">{product.totalSold}</Text>
                        </Td>
                        <Td isNumeric>
                          <Text fontWeight="bold" color="green.500">
                            {formatCurrency(product.totalRevenue, 'USD')}
                          </Text>
                        </Td>
                        <Td>
                          <Progress value={percentage} colorScheme="brand" size="sm" borderRadius="full" />
                        </Td>
                      </Tr>
                    );
                  })}
                </Tbody>
              </Table>
            )}
          </CardBody>
        </Card>
      </Stack>
    </AdminLayout>
  );
};

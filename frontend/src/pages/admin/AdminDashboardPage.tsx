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
  Skeleton,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Stack,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useColorModeValue,
  Badge,
  Select
} from '@chakra-ui/react';
import { useState } from 'react';
import { FiUsers, FiPackage, FiShoppingCart, FiDollarSign, FiTrendingUp, FiAlertCircle } from 'react-icons/fi';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { AdminLayout } from '../../layouts/AdminLayout';

dayjs.extend(relativeTime);
import {
  useDashboardStatsQuery,
  useSalesAnalyticsQuery,
  useTopProductsQuery,
  useRecentActivityQuery
} from '../../features/analytics/queries';
import { formatCurrency } from '../../utils/currency';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: any;
  colorScheme: string;
  helpText?: string;
  trend?: 'increase' | 'decrease';
}

const StatCard = ({ title, value, icon, colorScheme, helpText, trend }: StatCardProps) => {
  const bg = useColorModeValue('white', 'gray.800');
  const iconBg = useColorModeValue(`${colorScheme}.50`, `${colorScheme}.900`);
  const iconColor = useColorModeValue(`${colorScheme}.500`, `${colorScheme}.200`);

  return (
    <Card bg={bg} variant="elevated">
      <CardBody>
        <HStack justify="space-between">
          <Stat>
            <StatLabel color="gray.500" fontSize="sm" fontWeight="medium">
              {title}
            </StatLabel>
            <StatNumber fontSize="3xl" fontWeight="bold" mt={2}>
              {value}
            </StatNumber>
            {helpText && (
              <StatHelpText>
                {trend && <StatArrow type={trend} />}
                {helpText}
              </StatHelpText>
            )}
          </Stat>
          <Box p={3} bg={iconBg} borderRadius="lg">
            <Icon as={icon} w={8} h={8} color={iconColor} />
          </Box>
        </HStack>
      </CardBody>
    </Card>
  );
};

export const AdminDashboardPage = () => {
  const [salesPeriod, setSalesPeriod] = useState('30d');
  
  const { data: stats, isLoading: statsLoading } = useDashboardStatsQuery();
  const { data: salesData, isLoading: salesLoading } = useSalesAnalyticsQuery(salesPeriod);
  const { data: topProducts, isLoading: productsLoading } = useTopProductsQuery(5);
  const { data: activity, isLoading: activityLoading } = useRecentActivityQuery(10);

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'order':
        return FiShoppingCart;
      case 'user':
        return FiUsers;
      case 'product':
        return FiPackage;
      default:
        return FiAlertCircle;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'order':
        return 'blue';
      case 'user':
        return 'green';
      case 'product':
        return 'purple';
      default:
        return 'gray';
    }
  };

  return (
    <AdminLayout>
      <Stack spacing={8}>
        {/* Page Header */}
        <Box>
          <Heading size="lg" mb={2}>
            Dashboard Overview
          </Heading>
          <Text color="gray.500">Welcome back! Here's what's happening with your store.</Text>
        </Box>

        {/* Stats Grid */}
        <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }} gap={6}>
          <GridItem>
            {statsLoading ? (
              <Skeleton height="120px" borderRadius="lg" />
            ) : (
              <StatCard
                title="Total Users"
                value={stats?.totalUsers || 0}
                icon={FiUsers}
                colorScheme="blue"
                helpText={`${stats?.recentUsersCount || 0} new this month`}
                trend="increase"
              />
            )}
          </GridItem>
          <GridItem>
            {statsLoading ? (
              <Skeleton height="120px" borderRadius="lg" />
            ) : (
              <StatCard
                title="Total Products"
                value={stats?.totalProducts || 0}
                icon={FiPackage}
                colorScheme="purple"
                helpText={`${stats?.lowStockProducts || 0} low stock`}
              />
            )}
          </GridItem>
          <GridItem>
            {statsLoading ? (
              <Skeleton height="120px" borderRadius="lg" />
            ) : (
              <StatCard
                title="Total Orders"
                value={stats?.totalOrders || 0}
                icon={FiShoppingCart}
                colorScheme="orange"
                helpText={`${stats?.pendingOrders || 0} pending`}
              />
            )}
          </GridItem>
          <GridItem>
            {statsLoading ? (
              <Skeleton height="120px" borderRadius="lg" />
            ) : (
              <StatCard
                title="Total Revenue"
                value={formatCurrency(stats?.totalRevenue || 0, 'USD')}
                icon={FiDollarSign}
                colorScheme="green"
                helpText={`${stats?.conversionRate.toFixed(1) || 0}% conversion`}
                trend="increase"
              />
            )}
          </GridItem>
        </Grid>

        {/* Charts and Tables */}
        <Grid templateColumns={{ base: '1fr', lg: 'repeat(2, 1fr)' }} gap={6}>
          {/* Sales Chart */}
          <GridItem>
            <Card bg={cardBg} variant="elevated">
              <CardHeader>
                <HStack justify="space-between">
                  <HStack>
                    <Icon as={FiTrendingUp} color="brand.500" />
                    <Heading size="md">Sales Analytics</Heading>
                  </HStack>
                  <Select
                    w="120px"
                    size="sm"
                    value={salesPeriod}
                    onChange={e => setSalesPeriod(e.target.value)}
                  >
                    <option value="7d">7 Days</option>
                    <option value="30d">30 Days</option>
                    <option value="90d">90 Days</option>
                  </Select>
                </HStack>
              </CardHeader>
              <CardBody>
                {salesLoading ? (
                  <Skeleton height="300px" />
                ) : (
                  <Stack spacing={4}>
                    {salesData?.slice(-7).map((point, index) => (
                      <HStack key={index} justify="space-between">
                        <Text fontSize="sm" color="gray.500">
                          {dayjs(point.date).format('MMM DD')}
                        </Text>
                        <HStack spacing={4}>
                          <Badge colorScheme="blue">{point.orders} orders</Badge>
                          <Text fontWeight="semibold">{formatCurrency(point.revenue, 'USD')}</Text>
                        </HStack>
                      </HStack>
                    ))}
                  </Stack>
                )}
              </CardBody>
            </Card>
          </GridItem>

          {/* Top Products */}
          <GridItem>
            <Card bg={cardBg} variant="elevated">
              <CardHeader>
                <HStack>
                  <Icon as={FiPackage} color="brand.500" />
                  <Heading size="md">Top Products</Heading>
                </HStack>
              </CardHeader>
              <CardBody>
                {productsLoading ? (
                  <Skeleton height="300px" />
                ) : (
                  <Table variant="simple" size="sm">
                    <Thead>
                      <Tr>
                        <Th>Product</Th>
                        <Th isNumeric>Sold</Th>
                        <Th isNumeric>Revenue</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {topProducts?.map((product, index) => (
                        <Tr key={index}>
                          <Td maxW="200px" noOfLines={1}>
                            {product.name}
                          </Td>
                          <Td isNumeric>{product.totalSold}</Td>
                          <Td isNumeric fontWeight="semibold">
                            {formatCurrency(product.totalRevenue, 'USD')}
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                )}
              </CardBody>
            </Card>
          </GridItem>
        </Grid>

        {/* Recent Activity */}
        <Card bg={cardBg} variant="elevated">
          <CardHeader>
            <HStack>
              <Icon as={FiAlertCircle} color="brand.500" />
              <Heading size="md">Recent Activity</Heading>
            </HStack>
          </CardHeader>
          <CardBody>
            {activityLoading ? (
              <Skeleton height="200px" />
            ) : (
              <Stack spacing={4}>
                {activity?.map((log, index) => (
                  <HStack
                    key={index}
                    p={3}
                    borderRadius="md"
                    border="1px"
                    borderColor={borderColor}
                    justify="space-between"
                  >
                    <HStack spacing={3}>
                      <Box
                        p={2}
                        bg={useColorModeValue(`${getActivityColor(log.type)}.50`, `${getActivityColor(log.type)}.900`)}
                        borderRadius="md"
                      >
                        <Icon
                          as={getActivityIcon(log.type)}
                          color={useColorModeValue(
                            `${getActivityColor(log.type)}.500`,
                            `${getActivityColor(log.type)}.200`
                          )}
                        />
                      </Box>
                      <Box>
                        <Text fontWeight="medium">{log.description}</Text>
                        <Text fontSize="sm" color="gray.500">
                          {dayjs(log.timestamp).fromNow()}
                        </Text>
                      </Box>
                    </HStack>
                    <Badge colorScheme={getActivityColor(log.type)}>{log.type}</Badge>
                  </HStack>
                ))}
              </Stack>
            )}
          </CardBody>
        </Card>
      </Stack>
    </AdminLayout>
  );
};

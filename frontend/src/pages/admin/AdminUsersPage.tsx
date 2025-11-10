import { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Heading,
  HStack,
  Icon,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
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
  useDisclosure,
  useToast,
  Badge,
  VStack,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText
} from '@chakra-ui/react';
import { FiUsers, FiSearch, FiEdit2, FiTrash2, FiEye } from 'react-icons/fi';
import dayjs from 'dayjs';
import { AdminLayout } from '../../layouts/AdminLayout';
import {
  useUsersQuery,
  useUserActivityQuery,
  useUpdateUserRoleMutation,
  useDeleteUserMutation,
  type UserDto
} from '../../features/users/queries';
import { useApiErrorToast } from '../../hooks/useApiErrorToast';
import { formatCurrency } from '../../utils/currency';

export const AdminUsersPage = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<UserDto | null>(null);
  
  const { isOpen: isViewOpen, onOpen: onViewOpen, onClose: onViewClose } = useDisclosure();
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  
  const { data, isLoading } = useUsersQuery({
    page,
    limit: 20,
    role: roleFilter === 'all' ? undefined : roleFilter,
    search: search || undefined
  });

  const { data: activityData, isLoading: activityLoading } = useUserActivityQuery(selectedUser?._id || '');
  const updateRoleMutation = useUpdateUserRoleMutation();
  const deleteUserMutation = useDeleteUserMutation();
  const toast = useToast();
  const toastError = useApiErrorToast();

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const handleViewUser = (user: UserDto) => {
    setSelectedUser(user);
    onViewOpen();
  };

  const handleEditRole = (user: UserDto) => {
    setSelectedUser(user);
    onEditOpen();
  };

  const handleUpdateRole = async (newRole: 'user' | 'admin') => {
    if (!selectedUser) return;

    try {
      await updateRoleMutation.mutateAsync({ userId: selectedUser._id, role: newRole });
      toast({
        title: 'Role updated successfully',
        status: 'success',
        duration: 3000,
        position: 'top'
      });
      onEditClose();
    } catch (error) {
      toastError(error, 'Failed to update role');
    }
  };

  const handleDeleteUser = async (user: UserDto) => {
    const confirmed = window.confirm(`Delete user ${user.email}? This action cannot be undone.`);
    if (!confirmed) return;

    try {
      await deleteUserMutation.mutateAsync(user._id);
      toast({
        title: 'User deleted successfully',
        status: 'success',
        duration: 3000,
        position: 'top'
      });
    } catch (error) {
      toastError(error, 'Failed to delete user');
    }
  };

  return (
    <AdminLayout>
      <Stack spacing={8}>
        {/* Page Header */}
        <Box>
          <Heading size="lg" mb={2}>
            User Management
          </Heading>
          <Text color="gray.500">Manage user accounts, roles, and activity</Text>
        </Box>

        {/* Filters */}
        <Card bg={cardBg} variant="elevated">
          <CardHeader>
            <HStack spacing={4} wrap="wrap">
              <InputGroup maxW="400px">
                <InputLeftElement>
                  <Icon as={FiSearch} color="gray.400" />
                </InputLeftElement>
                <Input
                  placeholder="Search by email or name..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </InputGroup>
              <Select maxW="200px" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
                <option value="all">All Roles</option>
                <option value="user">Users</option>
                <option value="admin">Admins</option>
              </Select>
            </HStack>
          </CardHeader>

          <CardBody>
            {isLoading ? (
              <Stack spacing={3}>
                {Array.from({ length: 5 }).map((_, index) => (
                  <Skeleton key={index} height="60px" />
                ))}
              </Stack>
            ) : data?.users.length === 0 ? (
              <Box textAlign="center" py={12}>
                <Icon as={FiUsers} boxSize={12} color="gray.400" mb={4} />
                <Text color="gray.500">No users found</Text>
              </Box>
            ) : (
              <>
                <Box overflowX="auto">
                  <Table variant="simple">
                    <Thead>
                      <Tr>
                        <Th>Email</Th>
                        <Th>Role</Th>
                        <Th>Provider</Th>
                        <Th>Verified</Th>
                        <Th>Joined</Th>
                        <Th textAlign="right">Actions</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {data?.users.map(user => (
                        <Tr key={user._id}>
                          <Td>
                            <VStack align="start" spacing={0}>
                              <Text fontWeight="medium">{user.email}</Text>
                              {user.displayName && (
                                <Text fontSize="sm" color="gray.500">
                                  {user.displayName}
                                </Text>
                              )}
                            </VStack>
                          </Td>
                          <Td>
                            <Badge colorScheme={user.role === 'admin' ? 'purple' : 'blue'}>
                              {user.role}
                            </Badge>
                          </Td>
                          <Td>
                            <Badge variant="outline">{user.provider}</Badge>
                          </Td>
                          <Td>
                            <Badge colorScheme={user.isEmailVerified ? 'green' : 'yellow'}>
                              {user.isEmailVerified ? 'Verified' : 'Unverified'}
                            </Badge>
                          </Td>
                          <Td>{dayjs(user.createdAt).format('MMM DD, YYYY')}</Td>
                          <Td textAlign="right">
                            <HStack justify="flex-end" spacing={2}>
                              <IconButton
                                aria-label="View user"
                                icon={<FiEye />}
                                size="sm"
                                variant="ghost"
                                onClick={() => handleViewUser(user)}
                              />
                              <IconButton
                                aria-label="Edit role"
                                icon={<FiEdit2 />}
                                size="sm"
                                variant="ghost"
                                colorScheme="blue"
                                onClick={() => handleEditRole(user)}
                              />
                              <IconButton
                                aria-label="Delete user"
                                icon={<FiTrash2 />}
                                size="sm"
                                variant="ghost"
                                colorScheme="red"
                                onClick={() => handleDeleteUser(user)}
                                isLoading={deleteUserMutation.isPending}
                              />
                            </HStack>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>

                {/* Pagination */}
                {data && data.pagination.totalPages > 1 && (
                  <HStack justify="center" mt={6}>
                    <Button
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      isDisabled={page === 1}
                    >
                      Previous
                    </Button>
                    <Text fontSize="sm">
                      Page {page} of {data.pagination.totalPages}
                    </Text>
                    <Button
                      size="sm"
                      onClick={() => setPage(p => p + 1)}
                      isDisabled={page === data.pagination.totalPages}
                    >
                      Next
                    </Button>
                  </HStack>
                )}
              </>
            )}
          </CardBody>
        </Card>
      </Stack>

      {/* View User Modal */}
      <Modal isOpen={isViewOpen} onClose={onViewClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>User Activity</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {activityLoading ? (
              <Skeleton height="200px" />
            ) : activityData ? (
              <Stack spacing={6}>
                <VStack align="stretch" spacing={4}>
                  <Stat>
                    <StatLabel>Email</StatLabel>
                    <StatNumber fontSize="lg">{activityData.email}</StatNumber>
                  </Stat>
                  <HStack spacing={8}>
                    <Stat>
                      <StatLabel>Total Orders</StatLabel>
                      <StatNumber>{activityData.totalOrders}</StatNumber>
                    </Stat>
                    <Stat>
                      <StatLabel>Total Spent</StatLabel>
                      <StatNumber>{formatCurrency(activityData.totalSpent, 'USD')}</StatNumber>
                    </Stat>
                  </HStack>
                  <Stat>
                    <StatLabel>Member Since</StatLabel>
                    <StatHelpText>{dayjs(activityData.registeredAt).format('MMM DD, YYYY')}</StatHelpText>
                  </Stat>
                </VStack>

                {activityData.orders.length > 0 && (
                  <Box>
                    <Heading size="sm" mb={4}>
                      Recent Orders
                    </Heading>
                    <Stack spacing={2}>
                      {activityData.orders.map((order: any) => (
                        <HStack
                          key={order.id}
                          p={3}
                          borderRadius="md"
                          border="1px"
                          borderColor={borderColor}
                          justify="space-between"
                        >
                          <VStack align="start" spacing={0}>
                            <Text fontSize="sm" fontFamily="mono">
                              #{order.id}
                            </Text>
                            <Text fontSize="xs" color="gray.500">
                              {dayjs(order.createdAt).format('MMM DD, YYYY')}
                            </Text>
                          </VStack>
                          <VStack align="end" spacing={0}>
                            <Badge colorScheme={order.status === 'paid' ? 'green' : 'yellow'}>
                              {order.status}
                            </Badge>
                            <Text fontWeight="semibold">{formatCurrency(order.totalAmount, 'USD')}</Text>
                          </VStack>
                        </HStack>
                      ))}
                    </Stack>
                  </Box>
                )}
              </Stack>
            ) : (
              <Text>No activity data available</Text>
            )}
          </ModalBody>
          <ModalFooter>
            <Button onClick={onViewClose}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Edit Role Modal */}
      <Modal isOpen={isEditOpen} onClose={onEditClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Update User Role</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text mb={4}>Change role for: {selectedUser?.email}</Text>
            <HStack spacing={4}>
              <Button
                flex={1}
                colorScheme={selectedUser?.role === 'user' ? 'blue' : 'gray'}
                onClick={() => handleUpdateRole('user')}
                isLoading={updateRoleMutation.isPending}
              >
                User
              </Button>
              <Button
                flex={1}
                colorScheme={selectedUser?.role === 'admin' ? 'purple' : 'gray'}
                onClick={() => handleUpdateRole('admin')}
                isLoading={updateRoleMutation.isPending}
              >
                Admin
              </Button>
            </HStack>
          </ModalBody>
          <ModalFooter>
            <Button onClick={onEditClose}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </AdminLayout>
  );
};

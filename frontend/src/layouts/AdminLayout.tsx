import { ReactNode } from 'react';
import {
  Box,
  Flex,
  Icon,
  IconButton,
  Text,
  VStack,
  HStack,
  Drawer,
  DrawerContent,
  useDisclosure,
  useColorModeValue,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Badge
} from '@chakra-ui/react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  FiHome,
  FiUsers,
  FiShoppingBag,
  FiPackage,
  FiBarChart2,
  FiSettings,
  FiMenu,
  FiLogOut,
  FiChevronRight,
  FiShield
} from 'react-icons/fi';
import { useAuth } from '../features/auth/AuthProvider';

interface NavItemProps {
  icon: any;
  to: string;
  children: ReactNode;
  badge?: number;
}

const NavItem = ({ icon, to, children, badge }: NavItemProps) => {
  const location = useLocation();
  const isActive = location.pathname === to || location.pathname.startsWith(to + '/');
  const activeBg = useColorModeValue('brand.50', 'brand.900');
  const activeColor = useColorModeValue('brand.600', 'brand.200');
  const hoverBg = useColorModeValue('gray.100', 'gray.700');

  return (
    <Link to={to} style={{ width: '100%' }}>
      <Flex
        align="center"
        px={4}
        py={3}
        mx={2}
        borderRadius="lg"
        role="group"
        cursor="pointer"
        fontWeight={isActive ? '600' : '500'}
        bg={isActive ? activeBg : 'transparent'}
        color={isActive ? activeColor : 'inherit'}
        _hover={{
          bg: isActive ? activeBg : hoverBg,
          color: activeColor
        }}
        transition="all 0.2s"
      >
        <Icon
          mr={4}
          fontSize="20"
          as={icon}
          color={isActive ? activeColor : 'gray.500'}
        />
        <Text flex={1}>{children}</Text>
        {badge !== undefined && badge > 0 && (
          <Badge colorScheme="red" borderRadius="full">
            {badge}
          </Badge>
        )}
      </Flex>
    </Link>
  );
};

interface SidebarContentProps {
  onClose: () => void;
}

const SidebarContent = ({ onClose }: SidebarContentProps) => {
  const bg = useColorModeValue('white', 'gray.900');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <Box
      bg={bg}
      borderRight="1px"
      borderRightColor={borderColor}
      w={{ base: 'full', md: 64 }}
      h="full"
    >
      <Flex h="20" alignItems="center" mx={8} justifyContent="space-between">
        <Text fontSize="2xl" fontWeight="bold" bgGradient="linear(to-r, brand.500, brand.600)" bgClip="text">
          🛡️ Admin Panel
        </Text>
        <IconButton
          display={{ base: 'flex', md: 'none' }}
          onClick={onClose}
          variant="ghost"
          aria-label="close menu"
          icon={<FiMenu />}
        />
      </Flex>

      <VStack spacing={1} align="stretch" mt={4}>
        <NavItem icon={FiHome} to="/admin/dashboard">
          Dashboard
        </NavItem>
        <NavItem icon={FiUsers} to="/admin/users">
          Users
        </NavItem>
        <NavItem icon={FiPackage} to="/admin/products">
          Products
        </NavItem>
        <NavItem icon={FiShoppingBag} to="/admin/orders">
          Orders
        </NavItem>
        <NavItem icon={FiBarChart2} to="/admin/analytics">
          Analytics
        </NavItem>
        <NavItem icon={FiShield} to="/admin/audit-logs">
          Audit Logs
        </NavItem>
        <NavItem icon={FiSettings} to="/admin/settings">
          Settings
        </NavItem>
      </VStack>
    </Box>
  );
};

interface AdminLayoutProps {
  children: ReactNode;
}

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const bg = useColorModeValue('gray.50', 'gray.900');
  const headerBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const getBreadcrumbs = () => {
    const paths = location.pathname.split('/').filter(Boolean);
    const breadcrumbs = [{ name: 'Admin', path: '/admin/dashboard' }];

    if (paths.length > 1) {
      paths.slice(1).forEach((segment, index) => {
        const path = '/admin/' + paths.slice(1, index + 2).join('/');
        breadcrumbs.push({
          name: segment.charAt(0).toUpperCase() + segment.slice(1),
          path
        });
      });
    }

    return breadcrumbs;
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleBackToStore = () => {
    navigate('/');
  };

  return (
    <Box minH="100vh" bg={bg}>
      {/* Sidebar for desktop */}
      <Box display={{ base: 'none', md: 'block' }} position="fixed" h="full">
        <SidebarContent onClose={onClose} />
      </Box>

      {/* Drawer for mobile */}
      <Drawer
        autoFocus={false}
        isOpen={isOpen}
        placement="left"
        onClose={onClose}
        returnFocusOnClose={false}
        onOverlayClick={onClose}
        size="full"
      >
        <DrawerContent>
          <SidebarContent onClose={onClose} />
        </DrawerContent>
      </Drawer>

      {/* Main content */}
      <Box ml={{ base: 0, md: 64 }}>
        {/* Top navbar */}
        <Flex
          px={8}
          py={4}
          alignItems="center"
          bg={headerBg}
          borderBottomWidth="1px"
          borderBottomColor={borderColor}
          justifyContent="space-between"
          position="sticky"
          top={0}
          zIndex={10}
        >
          <HStack spacing={4}>
            <IconButton
              display={{ base: 'flex', md: 'none' }}
              onClick={onOpen}
              variant="ghost"
              aria-label="open menu"
              icon={<FiMenu />}
            />

            <Breadcrumb spacing={2} separator={<Icon as={FiChevronRight} color="gray.500" />}>
              {getBreadcrumbs().map((crumb, index) => (
                <BreadcrumbItem key={crumb.path} isCurrentPage={index === getBreadcrumbs().length - 1}>
                  <BreadcrumbLink as={Link} to={crumb.path}>
                    {crumb.name}
                  </BreadcrumbLink>
                </BreadcrumbItem>
              ))}
            </Breadcrumb>
          </HStack>

          <Menu>
            <MenuButton>
              <HStack spacing={3} cursor="pointer">
                <Avatar size="sm" name={user?.email} bg="brand.500" />
                <VStack display={{ base: 'none', md: 'flex' }} spacing={0} align="start">
                  <Text fontSize="sm" fontWeight="600">
                    {user?.email}
                  </Text>
                  <Text fontSize="xs" color="gray.500">
                    {user?.role}
                  </Text>
                </VStack>
              </HStack>
            </MenuButton>
            <MenuList>
              <MenuItem onClick={handleBackToStore}>Back to Store</MenuItem>
              <MenuDivider />
              <MenuItem icon={<FiLogOut />} onClick={handleLogout}>
                Logout
              </MenuItem>
            </MenuList>
          </Menu>
        </Flex>

        {/* Page content */}
        <Box p={8}>{children}</Box>
      </Box>
    </Box>
  );
};

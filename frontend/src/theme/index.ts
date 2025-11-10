import { extendTheme, type ThemeConfig } from '@chakra-ui/react';

// Color palette - Modern gradient colors
const colors = {
  brand: {
    50: '#EEF2FF',
    100: '#E0E7FF',
    200: '#C7D2FE',
    300: '#A5B4FC',
    400: '#818CF8',
    500: '#6366F1', // Primary Indigo
    600: '#4F46E5',
    700: '#4338CA',
    800: '#3730A3',
    900: '#312E81',
  },
  accent: {
    50: '#FFF1F2',
    100: '#FFE4E6',
    200: '#FECDD3',
    300: '#FDA4AF',
    400: '#FB7185',
    500: '#F43F5E', // Rose
    600: '#E11D48',
    700: '#BE123C',
    800: '#9F1239',
    900: '#881337',
  },
  success: {
    50: '#ECFDF5',
    100: '#D1FAE5',
    200: '#A7F3D0',
    300: '#6EE7B7',
    400: '#34D399',
    500: '#10B981', // Emerald
    600: '#059669',
    700: '#047857',
    800: '#065F46',
    900: '#064E3B',
  },
};

// Theme config
const config: ThemeConfig = {
  initialColorMode: 'light',
  useSystemColorMode: false,
};

// Global styles
const styles = {
  global: (props: any) => ({
    body: {
      bg: props.colorMode === 'dark' ? 'gray.900' : 'gray.50',
      color: props.colorMode === 'dark' ? 'white' : 'gray.800',
    },
    '*::placeholder': {
      color: props.colorMode === 'dark' ? 'gray.500' : 'gray.400',
    },
    '*, *::before, *::after': {
      borderColor: props.colorMode === 'dark' ? 'gray.700' : 'gray.200',
    },
  }),
};

// Component styles
const components = {
  Button: {
    baseStyle: {
      fontWeight: 'semibold',
      borderRadius: 'lg',
      transition: 'all 0.2s',
    },
    variants: {
      solid: (props: any) => {
        const isBrand = props.colorScheme === 'brand';
        const brandGradient = 'linear-gradient(135deg, var(--chakra-colors-brand-500) 0%, var(--chakra-colors-brand-600) 100%)';
        const brandHoverGradient = 'linear-gradient(135deg, var(--chakra-colors-brand-600) 0%, var(--chakra-colors-brand-700) 100%)';
        const brandActiveGradient = 'linear-gradient(135deg, var(--chakra-colors-brand-700) 0%, var(--chakra-colors-brand-800) 100%)';

        return {
          color: isBrand ? 'white' : undefined,
          bg: isBrand ? 'brand.500' : undefined,
          backgroundImage: isBrand ? brandGradient : undefined,
          _hover: {
            transform: 'translateY(-2px)',
            shadow: 'lg',
            backgroundImage: isBrand ? brandHoverGradient : undefined,
            _disabled: {
              transform: 'none',
              backgroundImage: isBrand ? brandGradient : undefined,
            },
          },
          _active: {
            transform: 'translateY(0)',
            backgroundImage: isBrand ? brandActiveGradient : undefined,
          },
        };
      },
      ghost: (props: any) => ({
        _hover: {
          bg: props.colorMode === 'dark' ? 'whiteAlpha.200' : 'brand.50',
        },
      }),
      outline: (props: any) => ({
        borderWidth: '2px',
        _hover: {
          bg: props.colorMode === 'dark' ? 'whiteAlpha.100' : 'brand.50',
          borderColor: 'brand.500',
        },
      }),
    },
    defaultProps: {
      colorScheme: 'brand',
    },
  },
  Card: {
    baseStyle: {
      container: {
        borderRadius: 'xl',
        overflow: 'hidden',
        transition: 'all 0.3s',
        _hover: {
          transform: 'translateY(-4px)',
          shadow: 'xl',
        },
      },
    },
    variants: {
      elevated: (props: any) => ({
        container: {
          bg: props.colorMode === 'dark' ? 'gray.800' : 'white',
          shadow: 'md',
        },
      }),
      outline: (props: any) => ({
        container: {
          borderWidth: '1px',
          borderColor: props.colorMode === 'dark' ? 'gray.700' : 'gray.200',
        },
      }),
      glass: {
        container: {
          bg: 'whiteAlpha.800',
          backdropFilter: 'blur(10px)',
          borderWidth: '1px',
          borderColor: 'whiteAlpha.300',
        },
      },
    },
    defaultProps: {
      variant: 'elevated',
    },
  },
  Input: {
    variants: {
      outline: {
        field: {
          borderRadius: 'lg',
          borderWidth: '2px',
          _focus: {
            borderColor: 'brand.500',
            boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)',
          },
        },
      },
    },
    defaultProps: {
      variant: 'outline',
    },
  },
  Badge: {
    baseStyle: {
      borderRadius: 'full',
      px: 3,
      py: 1,
      fontWeight: 'semibold',
      textTransform: 'uppercase',
      fontSize: 'xs',
    },
  },
  Heading: {
    baseStyle: {
      fontWeight: 'bold',
      letterSpacing: 'tight',
    },
  },
};

// Font configuration
const fonts = {
  heading: `'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif`,
  body: `'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif`,
};

// Semantic tokens for dark mode
const semanticTokens = {
  colors: {
    'card-bg': {
      default: 'white',
      _dark: 'gray.800',
    },
    'text-primary': {
      default: 'gray.900',
      _dark: 'white',
    },
    'text-secondary': {
      default: 'gray.600',
      _dark: 'gray.400',
    },
    'border': {
      default: 'gray.200',
      _dark: 'gray.700',
    },
  },
};

const theme = extendTheme({
  config,
  colors,
  styles,
  components,
  fonts,
  semanticTokens,
});

export default theme;

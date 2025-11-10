import { useEffect, useState } from 'react';
import {
  Alert,
  AlertDescription,
  AlertIcon,
  Box,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Spinner,
  Stack,
  Text,
  useToast
} from '@chakra-ui/react';
import { useNavigate, useParams } from 'react-router-dom';
import { Elements } from '@stripe/react-stripe-js';
import { getOrderPaymentDetails } from '../features/orders/api';
import { useApiErrorToast } from '../hooks/useApiErrorToast';
import { PaymentForm } from '../components/PaymentForm';
import { stripePromise } from '../utils/stripe';
import type { OrderPaymentDetails } from '../types/api';

export const ResumePaymentPage = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const toastError = useApiErrorToast();
  const [paymentDetails, setPaymentDetails] = useState<OrderPaymentDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    
    const fetchPaymentDetails = async () => {
      if (!orderId) {
        if (!cancelled) {
          setError('Invalid order ID');
          setIsLoading(false);
        }
        return;
      }

      try {
        const details = await getOrderPaymentDetails(orderId);
        if (!cancelled) {
          setPaymentDetails(details);
        }
      } catch (err) {
        if (!cancelled) {
          toastError(err, 'Failed to load payment details');
          setError('This order is no longer available for payment. It may have been completed or expired.');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchPaymentDetails();
    
    return () => {
      cancelled = true;
    };
  }, [orderId, toastError]);

  const handleSuccess = async () => {
    toast({ title: 'Payment completed successfully', status: 'success', duration: 4000, position: 'top' });
    navigate('/orders');
  };

  if (isLoading) {
    return (
      <Stack align="center" py={16} spacing={4}>
        <Spinner size="lg" />
        <Text>Loading payment details...</Text>
      </Stack>
    );
  }

  if (error || !paymentDetails) {
    return (
      <Alert status="error" borderRadius="md" maxW="2xl" mx="auto">
        <AlertIcon />
        <AlertDescription>{error || 'Payment details not found'}</AlertDescription>
      </Alert>
    );
  }

  if (!stripePromise) {
    return (
      <Alert status="error" borderRadius="md" maxW="2xl" mx="auto">
        <AlertIcon />
        <AlertDescription>Missing Stripe configuration. Please contact support.</AlertDescription>
      </Alert>
    );
  }

  return (
    <Card maxW="2xl" mx="auto" shadow="md" borderRadius="lg">
      <CardHeader>
        <Heading size="lg">Resume Payment</Heading>
        <Text fontSize="sm" color="gray.500" mt={2}>
          Complete your payment to finalize your order
        </Text>
      </CardHeader>
      <CardBody>
        <Elements 
          stripe={stripePromise} 
          options={{ clientSecret: paymentDetails.clientSecret }}
          key={paymentDetails.clientSecret}
        >
          <PaymentForm
            items={paymentDetails.items}
            orderId={paymentDetails.orderId}
            onSuccess={handleSuccess}
          />
        </Elements>
      </CardBody>
    </Card>
  );
};

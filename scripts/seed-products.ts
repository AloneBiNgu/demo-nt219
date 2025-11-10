import { connectToDatabase, disconnectFromDatabase } from '../src/config/database';
import { ProductModel, IProduct } from '../src/models/product.model';
import logger from '../src/utils/logger';

interface FakeStoreProduct {
  id: number;
  title: string;
  price: number;
  description: string;
  category: string;
  image: string;
  rating?: {
    rate: number;
    count: number;
  };
}

const FALLBACK_PRODUCTS: IProduct[] = [
  {
    name: 'iPhone 15 Pro',
    description: 'Latest flagship smartphone with A17 Pro chip',
    price: 999,
    currency: 'USD',
    stock: 50,
    isActive: true,
    prototypeImageUrl:
      'https://images.unsplash.com/photo-1695048132845-7f363df238a1?auto=format&fit=crop&w=800&q=80'
  },
  {
    name: 'MacBook Air M3',
    description: 'Thin and light laptop with M3 chip',
    price: 1299,
    currency: 'USD',
    stock: 30,
    isActive: true,
    prototypeImageUrl:
      'https://images.unsplash.com/photo-1527430253228-e93688616381?auto=format&fit=crop&w=800&q=80'
  },
  {
    name: 'AirPods Pro 2',
    description: 'Premium wireless earbuds with active noise cancellation',
    price: 249,
    currency: 'USD',
    stock: 100,
    isActive: true,
    prototypeImageUrl:
      'https://images.unsplash.com/photo-1582234372727-92397a976d05?auto=format&fit=crop&w=800&q=80'
  },
  {
    name: 'iPad Pro 12.9"',
    description: 'Powerful tablet with M2 chip and Liquid Retina XDR display',
    price: 1099,
    currency: 'USD',
    stock: 25,
    isActive: true,
    prototypeImageUrl:
      'https://images.unsplash.com/photo-1615049222091-3d1890a69f9b?auto=format&fit=crop&w=800&q=80'
  },
  {
    name: 'Apple Watch Series 9',
    description: 'Advanced smartwatch with health monitoring',
    price: 429,
    currency: 'USD',
    stock: 60,
    isActive: true,
    prototypeImageUrl:
      'https://images.unsplash.com/photo-1524594154903-091e5dca6434?auto=format&fit=crop&w=800&q=80'
  }
];

const FAKESTORE_API = process.env.FAKESTORE_API_URL ?? 'https://fakestoreapi.com/products?limit=50';

const buildProductRecords = (products: FakeStoreProduct[]): IProduct[] =>
  products.map(product => ({
    name: product.title,
    description: product.description,
    price: Number(product.price) || 0,
    currency: 'USD',
    stock: product.rating?.count ?? 50,
    isActive: true,
    prototypeImageUrl: product.image
  }));

const dedupeProducts = (products: IProduct[]): IProduct[] => {
  const map = new Map<string, IProduct>();
  products.forEach(product => {
    if (!map.has(product.name)) {
      map.set(product.name, product);
    }
  });
  return Array.from(map.values());
};

async function seedProducts() {
  try {
    await connectToDatabase();
    logger.info('Connected to database');

    // Clear existing products
    await ProductModel.deleteMany({});
    logger.info('Cleared existing products');

    let productsToInsert: IProduct[] = FALLBACK_PRODUCTS;

    try {
      logger.info({ url: FAKESTORE_API }, 'Fetching catalog from FakeStore API');
      const response = await fetch(FAKESTORE_API);
      if (!response.ok) {
        throw new Error(`FakeStore API returned ${response.status}`);
      }

      const fakeStorePayload = (await response.json()) as FakeStoreProduct[];
      logger.info({ count: fakeStorePayload.length }, 'Received products from FakeStore API');

      if (Array.isArray(fakeStorePayload) && fakeStorePayload.length > 0) {
        productsToInsert = dedupeProducts([
          ...buildProductRecords(fakeStorePayload),
          ...FALLBACK_PRODUCTS
        ]);
      }
    } catch (error) {
      logger.warn({ error }, 'Failed to fetch from FakeStore API. Falling back to static catalog');
    }

    // Insert products into MongoDB
    const products = await ProductModel.insertMany(productsToInsert, { ordered: false });
    logger.info({ count: products.length }, 'Sample products inserted');

    // Log product IDs
    products.forEach(product => {
      logger.info({ 
        id: product._id.toString(), 
        name: product.name 
      }, 'Product created');
    });

    logger.info('✅ Seed completed successfully');
  } catch (error) {
    logger.error({ error }, '❌ Seed failed');
    throw error;
  } finally {
    await disconnectFromDatabase();
  }
}

seedProducts();

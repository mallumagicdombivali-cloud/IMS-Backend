import { MongoClient, Db, Collection, Document } from 'mongodb';

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

const MONGODB_URI = process.env.MONGODB_URI || '';
const DB_NAME = process.env.DB_NAME || 'mallu_magic';

if (!MONGODB_URI) {
  throw new Error('Please define MONGODB_URI environment variable');
}

export async function connectDB(): Promise<Db> {
  if (cachedDb && cachedClient) {
    return cachedDb;
  }

  if (!cachedClient) {
    cachedClient = new MongoClient(MONGODB_URI, {
      maxPoolSize: 10,
      minPoolSize: 1,
    });
  }

  try {
    await cachedClient.connect();
    cachedDb = cachedClient.db(DB_NAME);
    console.log('Connected to MongoDB');
    return cachedDb;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    cachedClient = null;
    cachedDb = null;
    throw error;
  }
}

export async function getCollection<T extends Document>(name: string): Promise<Collection<T>> {
  const db = await connectDB();
  return db.collection<T>(name);
}

export async function closeDB(): Promise<void> {
  if (cachedClient) {
    await cachedClient.close();
    cachedClient = null;
    cachedDb = null;
  }
}


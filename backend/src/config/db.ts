import mongoose from 'mongoose';

export async function connectMongo(uri: string): Promise<void> {
  mongoose.set('strictQuery', true);
  // Conservative options that work for both local Mongo and Atlas SRV URIs.
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 15_000,
    socketTimeoutMS: 45_000,
    family: 4,
  });
  console.log('[mongo] connected');
}

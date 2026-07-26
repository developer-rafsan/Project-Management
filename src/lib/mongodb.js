import mongoose from 'mongoose';
import dns from 'node:dns';

const MONGODB_URI = process.env.NanoPiCode_MONGODB_URI;

console.log(MONGODB_URI)

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

let cached = global._mongooseConn;

if (!cached) {
  cached = global._mongooseConn = { conn: null, promise: null };
}

export async function connectDB() {
  const servers = dns.getServers();
  if (servers.length === 1 && servers[0] === '127.0.0.1') {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (cached.promise) {
    try {
      cached.conn = await cached.promise;
      return cached.conn;
    } catch {
      cached.promise = null;
    }
  }

  cached.promise = mongoose.connect(MONGODB_URI, {
    bufferCommands: false,
  });

  cached.conn = await cached.promise;
  return cached.conn;
}

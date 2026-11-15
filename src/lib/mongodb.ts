import { MongoClient, type Db } from "mongodb";

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

function getClientPromise(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is missing. Add your MongoDB Atlas connection string to .env.local.");
  if (!global._mongoClientPromise) {
    global._mongoClientPromise = new MongoClient(uri, { maxPoolSize: 10, serverSelectionTimeoutMS: 10000 }).connect();
  }
  return global._mongoClientPromise;
}

export async function getDb(): Promise<Db> {
  const client = await getClientPromise();
  return client.db(process.env.MONGODB_DB || "faruk_study_manager");
}

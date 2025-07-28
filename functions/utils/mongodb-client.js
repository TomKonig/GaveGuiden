const { MongoClient, ServerApiVersion } = require('mongodb');

// The connection string is stored in an environment variable for security
const uri = process.env.MONGODB_URI;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

let cachedDb = null;

// Function to connect to the database, reusing connections for "warm" functions
async function connectToDatabase() {
  if (cachedDb) {
    return cachedDb;
  }
  
  try {
    await client.connect();
    const db = client.db("GaveGuiden"); // The database name we chose
    cachedDb = db;
    return db;
  } catch (error) {
    console.error("Failed to connect to MongoDB", error);
    throw error;
  }
}

module.exports = { connectToDatabase };

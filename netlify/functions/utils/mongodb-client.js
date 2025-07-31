const { MongoClient, ServerApiVersion } = require('mongodb');

// The connection string is stored in an environment variable for security
const uri = process.env.MONGODB_URI;

// We will cache the client connection promise for reuse
let cachedClientPromise = null;

async function connectToDatabase() {
  // If a promise is already cached, reuse it to avoid reconnecting
  if (cachedClientPromise) {
    return cachedClientPromise;
  }

  // Create a new MongoClient with the recommended options
  const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });

  // Store the promise of the connection in the cache
  // This handles concurrent requests gracefully.
  cachedClientPromise = client.connect()
    .then(connectedClient => {
      console.log("=> New MongoDB connection established.");
      // Return the specific database from the connected client
      return connectedClient.db("GaveGuiden"); 
    })
    .catch(err => {
      // If connection fails, clear the cache so the next request can try again
      cachedClientPromise = null; 
      console.error("Failed to connect to MongoDB", err);
      throw err;
    });

  return cachedClientPromise;
}

module.exports = { connectToDatabase };

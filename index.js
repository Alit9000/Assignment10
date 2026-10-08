// ENTRY POINT: start the server.
const path = require('path');
const dotenv = require('dotenv');

// Load env early so MONGO_URI/PORT are available for DB + listen.
dotenv.config({ path: path.join(__dirname, 'config', '.env') });

const createApp = require('./src/bootstrap');
const connectDB = require('./src/db/db connection');

const PORT = process.env.PORT || 3000;

async function start() {
  await connectDB();
  const app = createApp();
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}

start().catch((err) => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});

// BOOTSTRAP: builds/configures the Express app (routes + middleware).
// index.js only starts the server. DB connect is called from index.js.
const path = require('path');
const dotenv = require('dotenv');
const express = require('express');

function createApp() {
  // Load env from config/.env (relative to project root).
  dotenv.config({ path: path.join(__dirname, '..', 'config', '.env') });

  const app = express();
  app.use(express.json());

  const controller = require('./modules/users/user controller');
  const auth = require('./middlewares/auth.middleware');

  // AUTH
  app.post('/auth/signup', controller.validateSignup, controller.signup);
  app.post('/auth/login', controller.validateLogin, controller.login);
  app.post('/auth/refresh', controller.refresh);

  // USERS (protected + authorization inside controller)
  app.get('/users/:id', auth, controller.getUser);
  // Profile update (protected). Used to demo optimistic concurrency -> 409.
  app.patch('/users/me', auth, controller.updateMe);

  // MESSAGES: send is public (truly anonymous, no login needed).
  // Inbox read is protected (only owner sees their messages).
  app.post('/messages', controller.validateMessage, controller.sendMessage);
  app.get('/messages', auth, controller.getMyMessages);

  app.get('/', (req, res) => res.json({ message: 'Saraha backend running.' }));

  return app;
}

module.exports = createApp;

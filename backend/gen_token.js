const jwt = require('jsonwebtoken');
const secret = 'supersecret_jwt_key_for_dev_only';

const token = jwt.sign({
  user_id: 'db2a54b3-c15e-4c74-8b6b-c74384c30c80', // I need a valid user ID!
  role: 'SYSTEM_ADMIN',
}, secret, { expiresIn: '1h' });

console.log(token);

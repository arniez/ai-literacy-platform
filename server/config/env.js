const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, 'config.env');

if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
}

module.exports = {};

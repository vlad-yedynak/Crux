const fs = require('fs');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
const result = dotenv.config();

if (result.error) {
  console.error('Error loading .env file:', result.error);
  // Don't exit if .env file is missing, just use defaults
  console.log('Using default environment values');
}

// Set default values if they're not in the .env file
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8080';
const NODE_ENV = process.env.NODE_ENV || 'development';

// Determine which environment file to generate
const isProduction = NODE_ENV === 'production';
const targetPath = path.resolve(__dirname, 'src/app/environments/environment' + (isProduction ? '.prod' : '') + '.ts');

// Create environment file content
const environmentFileContent = `// This file is auto-generated from .env by set-env.js
export const environment = {
  production: ${isProduction},
  apiBaseUrl: '${API_BASE_URL}'
};
`;

// Create directory if it doesn't exist
const dir = path.dirname(targetPath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

// Write environment file
fs.writeFile(targetPath, environmentFileContent, (err) => {
  if (err) {
    console.error('Error writing environment file:', err);
    process.exit(1);
  }
  console.log(`Environment configuration generated at ${targetPath}`);
});
const awsServerlessExpress = require('aws-serverless-express');
const app = require('./dist/index.js'); // Your built Express app

const server = awsServerlessExpress.createServer(app);

exports.handler = (event, context) => {
  awsServerlessExpress.proxy(server, event, context);
};
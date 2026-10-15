/**
 * Vercel Serverless Function entry point for TataDana
 * Routes all incoming HTTP traffic directly to TataDana's master request handler.
 */
const handleRequest = require('../server');

module.exports = (req, res) => {
  return handleRequest(req, res);
};

const express = require('express');
const crypto = require('crypto');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
const fs = require('fs');
const slugify = require('slugify');

const app = express();
const PORT = process.env.PORT || 3000;

// Configure CSP using Helmet.
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "https://code.jquery.com",
        "https://stackpath.bootstrapcdn.com",
        "https://cdn.datatables.net",
        "https://cdnjs.cloudflare.com"
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://stackpath.bootstrapcdn.com",
        "https://cdn.datatables.net"
      ],
      fontSrc: ["'self'", "data:", "https://stackpath.bootstrapcdn.com"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'"]
    }
  })
);

// Enable gzip compression.
app.use(compression());

// Set view engine to EJS.
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files from the public folder.
app.use(express.static(path.join(__dirname, 'public')));

// Load states mapping from JSON.
let statesData = JSON.parse(fs.readFileSync(path.join(__dirname, 'states.json'), 'utf-8'));

statesData = statesData.map(state => {
  if (!state.slug) {
    const baseSlug = slugify(state.name, { lower: true });
    // Create a deterministic hash from the state name.
    const hash = crypto.createHash('sha256').update(state.name).digest('hex').substr(0, 8);
    state.slug = `${baseSlug}-${hash}`;
  }
  return state;
});

// Homepage: list of all states.
app.get('/', (req, res) => {
  res.render('index', { states: statesData });
});

// State page route: renders the template and passes the excel file path.
app.get('/state/:slug', (req, res, next) => {
  const slug = req.params.slug;
  const state = statesData.find(s => s.slug === slug);
  if (!state) {
    return next();
  }
  res.render('state', { state: state });
});

// Dedicated route for 404 page.
app.get('/404', (req, res) => {
  res.status(404).render('404', { url: req.originalUrl });
});

// Dedicated route for 500 page.
app.get('/500', (req, res) => {
  res.status(500).render('500');
});

// Global 404 handler: Redirect to the 404 page.
app.use((req, res, next) => {
  res.redirect('/404');
});

// Global error handler: Redirect to the 500 page.
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.redirect('/500');
});

const https = require('https');
const http = require('http');
const privateKey = fs.readFileSync('key.pem', 'utf8');
const certificate = fs.readFileSync('cert.pem', 'utf8');

const credentials = { key: privateKey, cert: certificate };
const server = https.createServer(credentials, app);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Secure server running on https://localhost:${PORT}`);
});

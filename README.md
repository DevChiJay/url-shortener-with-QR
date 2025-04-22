# URL Shortener with QR Code

A robust URL shortening service with QR code generation capabilities built with Node.js, Express, and MongoDB.

## Features

- ✂️ Shorten long URLs into easily shareable links
- 🔄 Automatic redirection to original URLs
- 📱 QR code generation for shortened URLs
- ⏱️ Configurable expiration dates for URLs
- 📊 Click tracking for shortened URLs
- 🔒 Active/inactive link status management

## Technology Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose
- **QR Code**: qrcode.js
- **Unique ID Generation**: nanoid
- **Validation**: Zod

## Installation

### Prerequisites

- Node.js (v14+)
- MongoDB (local or Atlas)

### Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd URL-Shortener-with-QR
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   - Create a `.env` file based on the provided `.env.example`
   - Add your MongoDB connection string and other configuration

4. Start the server:
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## API Documentation

### Shorten a URL

**Endpoint**: `POST /api/url/shorten`

**Request Body**:
```json
{
  "originalUrl": "https://example.com/very-long-url-that-needs-shortening",
  "expirationDays": 7 // Optional, defaults to 7 days
}
```

**Response**:
```json
{
  "originalUrl": "https://example.com/very-long-url-that-needs-shortening",
  "shortUrl": "http://yourdomain.com/abc123",
  "shortCode": "abc123",
  "qrCode": "data:image/png;base64,...", // Base64 encoded QR code image
  "expiresAt": "2023-06-01T12:00:00.000Z"
}
```

### Redirect to Original URL

**Endpoint**: `GET /:shortCode`

Automatically redirects to the original URL associated with the provided short code.

### Get QR Code

**Endpoint**: `GET /api/url/:shortCode/qr`

Returns the QR code image for the shortened URL.

### Update URL Expiration

**Endpoint**: `PATCH /api/url/:shortCode/expiration`

**Request Body**:
```json
{
  "expirationDays": 30
}
```

**Response**:
```json
{
  "message": "URL expiration updated successfully",
  "expiresAt": "2023-07-01T12:00:00.000Z"
}
```

## Usage Examples

### Example: Creating a shortened URL

```javascript
// Using fetch API
const response = await fetch('http://localhost:4000/api/url/shorten', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    originalUrl: 'https://example.com/very-long-url',
    expirationDays: 14
  }),
});

const data = await response.json();
console.log('Shortened URL:', data.shortUrl);
console.log('QR Code:', data.qrCode);
```

### Example: Displaying QR Code

```html
<img src="http://localhost:4000/api/url/abc123/qr" alt="QR Code" />
```

## Project Structure

```
URL-Shortener-with-QR/
├── src/
│   ├── app.js              # Express application setup
│   ├── server.js           # Server entry point
│   ├── config/             # Configuration files
│   ├── controllers/        # Route controllers
│   ├── middleware/         # Express middleware
│   ├── models/             # Mongoose models
│   ├── routes/             # Express routes
│   └── services/           # Business logic
├── .env                    # Environment variables
├── .gitignore
├── package.json
└── README.md
```

## Key Components

### URL Model

The URL model stores:
- Original URL
- Short code
- QR code (as base64 string)
- Click count
- Expiration date
- Active status

### Services

- **Shortener Service**: Handles URL shortening, retrieval, and statistics
- **QR Code Service**: Generates QR codes for shortened URLs

## Deployment

This service can be deployed to any Node.js hosting service such as:
- Heroku
- Vercel
- DigitalOcean
- AWS

Make sure to set the appropriate environment variables in your hosting platform.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [nanoid](https://github.com/ai/nanoid) for generating unique short codes
- [qrcode](https://github.com/soldair/node-qrcode) for QR code generation
- [mongoose](https://mongoosejs.com) for MongoDB object modeling

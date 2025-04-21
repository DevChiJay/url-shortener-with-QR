const QRCode = require('qrcode');

/**
 * Generates a QR code image as a data URL (base64 string) for a given URL
 * 
 * @param {string} url - The URL to encode in the QR code
 * @returns {Promise<string>} - A promise that resolves to the QR code as a base64 string
 */
const generateQRCode = async (url) => {
  try {
    // Generate QR code as data URL (base64 string)
    const qrCodeDataUrl = await QRCode.toDataURL(url, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      margin: 1,
      scale: 4,
    });
    
    return qrCodeDataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
};

/**
 * Generates a QR code as a buffer for a given URL
 * 
 * @param {string} url - The URL to encode in the QR code
 * @returns {Promise<Buffer>} - A promise that resolves to the QR code as a buffer
 */
const generateQRCodeBuffer = async (url) => {
  try {
    // Generate QR code as buffer
    const qrCodeBuffer = await QRCode.toBuffer(url, {
      errorCorrectionLevel: 'H',
      type: 'png',
      margin: 1,
      scale: 4,
    });
    
    return qrCodeBuffer;
  } catch (error) {
    console.error('Error generating QR code buffer:', error);
    throw new Error('Failed to generate QR code buffer');
  }
};

module.exports = {
  generateQRCode,
  generateQRCodeBuffer
};

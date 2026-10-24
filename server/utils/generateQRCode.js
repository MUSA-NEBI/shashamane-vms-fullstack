/**
 * generateQRCode.js
 * Generates a QR code as a base64 data URI string.
 * The data encoded is a JSON string with key ticket info for validation.
 */

const QRCode = require('qrcode');

/**
 * @param {object} data - The data to encode in the QR code
 * @returns {Promise<string>} - Base64 data URI of the QR code image
 */
const generateQRCode = async (data) => {
  try {
    const qrData = JSON.stringify(data);
    const qrCodeDataUri = await QRCode.toDataURL(qrData, {
      width: 300,
      margin: 2,
      color: {
        dark: '#1a1a2e',
        light: '#ffffff',
      },
    });
    return { qrCode: qrCodeDataUri, qrData };
  } catch (error) {
    throw new Error(`QR code generation failed: ${error.message}`);
  }
};

module.exports = generateQRCode;

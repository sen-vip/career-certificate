const { Buffer } = require('buffer');
const XlsxPopulate = require('xlsx-populate');
const Encryptor = require('xlsx-populate/lib/Encryptor');

// Hand the original decrypted ZIP to SheetJS for parsing, preserving workbook metadata.
XlsxPopulate.decryptXlsxAsync = async (encrypted, password) => {
  const bytes = await new Encryptor().decryptAsync(Buffer.from(encrypted), password);
  if (bytes.length < 4 || bytes.readUInt32LE(0) !== 0x04034b50) {
    throw new Error('Invalid password or encrypted XLSX payload');
  }
  return bytes;
};

module.exports = XlsxPopulate;

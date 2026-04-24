const crypto = require('crypto');
const fs = require('fs');
const { pipeline } = require('stream/promises');

function getKey() {
  const secret = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET;
  return crypto.createHash('sha256').update(secret).digest();
}

async function encryptFile(filePath) {
  const key = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const tmpPath = filePath + '.enc';

  await pipeline(
    fs.createReadStream(filePath),
    cipher,
    fs.createWriteStream(tmpPath)
  );

  const authTag = cipher.getAuthTag();
  fs.renameSync(tmpPath, filePath);
  return { iv: iv.toString('hex'), authTag: authTag.toString('hex') };
}

function decryptStream(filePath, ivHex, authTagHex) {
  const key = getKey();
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  return fs.createReadStream(filePath).pipe(decipher);
}

module.exports = { encryptFile, decryptStream };

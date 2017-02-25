import * as crypto from 'crypto';

export function createSalt() {
  const len = 16;
  return crypto
    .randomBytes(Math.ceil(len / 2))
    .toString('hex')
    .substring(0, len);
}

export function computeHash(source, salt) {
  const hmac = crypto.createHmac('sha1', salt);
  const hash = hmac.update(source);
  return hash.digest('hex');
}

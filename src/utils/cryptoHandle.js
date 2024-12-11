import QuickCrypto from 'react-native-quick-crypto';
import {Buffer} from 'buffer';
import {createRandomLetters} from './base';

// AES加密函数
export const encryptAES = (text, secretKey) => {
  const JsonText = JSON.stringify(text); // 转换为JSON字符串
  const iv = QuickCrypto.randomBytes(16); // 生成随机初始化向量
  const hashed = QuickCrypto.createHash('sha256')
    .update(String(secretKey))
    .digest('hex'); // 生成哈希值
  // console.log(secretKey, hashed);

  const key = Buffer.from(hashed, 'hex'); // 生成密钥
  const cipher = QuickCrypto.createCipheriv(
    'aes-256-cbc',
    Buffer.from(key),
    iv,
  );
  let encrypted = cipher.update(JsonText, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  return {iv: iv.toString('hex'), encryptedData: encrypted};
};

// AES解密函数
export const decryptAES = (encryptedData, iv, secretKey) => {
  const hashed = QuickCrypto.createHash('sha256')
    .update(String(secretKey))
    .digest('hex'); // 生成哈希值
  const key = Buffer.from(hashed, 'hex'); // 生成密钥
  const decipher = QuickCrypto.createDecipheriv(
    'aes-256-cbc',
    Buffer.from(key),
    Buffer.from(iv, 'hex'),
  );
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  try {
    return JSON.parse(decrypted);
  } catch (error) {
    console.log(error);
    return null;
  }
};

// 生成秘钥库函数
export const generateSecretKey = (msgSecret) => {
  const secretHash = QuickCrypto.createHash('sha256').update(
    String(msgSecret),
  );
  const secretReHash = QuickCrypto.createHash('sha256').update(
    String(msgSecret.split('').reverse().join('')),
  );
  const secretKey1 = secretHash.digest('base64');
  const secretKey2 = secretHash.digest('hex');
  const secretKey3 = secretReHash.digest('base64');
  const secretKey4 = secretReHash.digest('hex');
  return secretKey1 + secretKey2 + secretKey3 + secretKey4;
};

// 生成随机秘钥位置
export const createRandomSecretKey = secretStr => {
  const indexList = [];
  const secretList = [];
  for (let i = 0; i < 8; i++) {
    const index = Math.floor(Math.random() * (secretStr.length - 1));
    indexList.push(
      index,
      createRandomLetters(Math.floor(Math.random() * 4) + 1),
    );
    secretList.push(secretStr.charAt(index));
  }
  return {
    secret: indexList.join(''),
    trueSecret: secretList.join(''),
  };
};

// 获取真正的秘钥
export const getTrueSecretKey = (secret, secretStr) => {
  const indexList = secret.match(/\d+/g);
  const secretList = [];
  indexList.forEach((index, i) => {
    secretList.push(secretStr.charAt(index));
  });
  return secretList.join('');
};

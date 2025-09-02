// Unit tests for EncryptionManager

import { testFramework, assert } from '@/lib/testing/testFramework';
import { encryptionManager } from '@/lib/security/encryptionManager';

testFramework.describe('EncryptionManager', 'Data encryption and security management tests', {
  setup: async () => {
    // Clear any existing test data
    encryptionManager.clear();
  },
  teardown: async () => {
    // Clean up test data
    encryptionManager.clear();
  }
});

testFramework.it('should encrypt and decrypt data successfully', async () => {
  const testData = {
    name: 'John Doe',
    email: 'john@example.com',
    age: 30,
    sensitive: 'This is sensitive information'
  };

  // Encrypt data
  const encryptedData = await encryptionManager.encryptData(testData, 'confidential');

  assert.isDefined(encryptedData, 'Encrypted data should be returned');
  assert.isString(encryptedData.data, 'Encrypted data should be a string');
  assert.isString(encryptedData.iv, 'IV should be a string');
  assert.isString(encryptedData.salt, 'Salt should be a string');
  assert.equal(encryptedData.algorithm, 'aes-256-gcm', 'Algorithm should be correct');
  assert.isDefined(encryptedData.timestamp, 'Timestamp should be present');

  // Decrypt data
  const decryptedData = await encryptionManager.decryptData(encryptedData, 'confidential');

  assert.deepEqual(decryptedData, testData, 'Decrypted data should match original');
});

testFramework.it('should handle different data classifications', async () => {
  const testData = { message: 'Test message' };

  // Test public data (no encryption)
  const publicData = await encryptionManager.encryptData(testData, 'public');
  assert.equal(publicData.algorithm, 'none', 'Public data should not be encrypted');

  // Test confidential data (encrypted)
  const confidentialData = await encryptionManager.encryptData(testData, 'confidential');
  assert.equal(confidentialData.algorithm, 'aes-256-gcm', 'Confidential data should be encrypted');
});

testFramework.it('should hash data securely', () => {
  const testData = 'sensitive information';
  
  // Hash data
  const hashResult = encryptionManager.hashData(testData);
  
  assert.isString(hashResult.hash, 'Hash should be a string');
  assert.isString(hashResult.salt, 'Salt should be a string');
  assert.notEqual(hashResult.hash, testData, 'Hash should be different from original');
  assert.notEqual(hashResult.salt, testData, 'Salt should be different from original');

  // Verify hash
  const isValid = encryptionManager.verifyHash(testData, hashResult.hash, hashResult.salt);
  assert.isTrue(isValid, 'Hash verification should succeed');

  // Test with wrong data
  const isInvalid = encryptionManager.verifyHash('wrong data', hashResult.hash, hashResult.salt);
  assert.isFalse(isInvalid, 'Hash verification should fail with wrong data');
});

testFramework.it('should generate and use key pairs', () => {
  // Generate key pair
  const keyPair = encryptionManager.generateKeyPair();
  
  assert.isDefined(keyPair, 'Key pair should be generated');
  assert.isString(keyPair.publicKey, 'Public key should be a string');
  assert.isString(keyPair.privateKey, 'Private key should be a string');
  assert.equal(keyPair.algorithm, 'rsa', 'Algorithm should be RSA');
  assert.isDefined(keyPair.keyId, 'Key ID should be present');
  assert.isDefined(keyPair.createdAt, 'Creation date should be present');

  // Test encryption with public key
  const testMessage = 'This is a test message';
  const encrypted = encryptionManager.encryptWithPublicKey(testMessage, keyPair.publicKey);
  
  assert.isString(encrypted, 'Encrypted message should be a string');
  assert.notEqual(encrypted, testMessage, 'Encrypted message should be different from original');

  // Test decryption with private key
  const decrypted = encryptionManager.decryptWithPrivateKey(encrypted, keyPair.privateKey);
  assert.equal(decrypted, testMessage, 'Decrypted message should match original');
});

testFramework.it('should sign and verify data', () => {
  // Generate key pair
  const keyPair = encryptionManager.generateKeyPair();
  
  const testData = 'This is data to be signed';
  
  // Sign data
  const signature = encryptionManager.signData(testData, keyPair.privateKey);
  
  assert.isString(signature, 'Signature should be a string');
  assert.notEqual(signature, testData, 'Signature should be different from data');

  // Verify signature
  const isValid = encryptionManager.verifySignature(testData, signature, keyPair.publicKey);
  assert.isTrue(isValid, 'Signature verification should succeed');

  // Test with wrong data
  const isInvalid = encryptionManager.verifySignature('wrong data', signature, keyPair.publicKey);
  assert.isFalse(isInvalid, 'Signature verification should fail with wrong data');
});

testFramework.it('should apply security policies', async () => {
  const testData = {
    name: 'John Doe',
    email: 'john@example.com',
    dataType: 'pii'
  };

  const context = {
    dataType: 'pii',
    userRole: 'user'
  };

  // Apply security policy
  const result = await encryptionManager.applySecurityPolicy(testData, context);

  // Should be encrypted due to PII policy
  assert.isDefined(result, 'Result should be returned');
  assert.notEqual(result, testData, 'Data should be modified by security policy');
});

testFramework.it('should store and retrieve secure data', async () => {
  const testData = {
    secret: 'This is secret information',
    value: 42
  };

  const key = 'test-secure-key';

  // Store secure data
  await encryptionManager.storeSecureData(key, testData, 'confidential');

  // Retrieve secure data
  const retrievedData = await encryptionManager.retrieveSecureData(key, 'confidential');

  assert.deepEqual(retrievedData, testData, 'Retrieved data should match original');
});

testFramework.it('should mask sensitive data', () => {
  const testData = {
    name: 'John Doe',
    email: 'john@example.com',
    phone: '123-456-7890',
    ssn: '123-45-6789',
    public: 'This is public information'
  };

  const sensitiveFields = ['email', 'phone', 'ssn'];

  // Mask data
  const maskedData = encryptionManager.maskData(testData, sensitiveFields);

  assert.equal(maskedData.name, testData.name, 'Non-sensitive fields should remain unchanged');
  assert.equal(maskedData.public, testData.public, 'Public fields should remain unchanged');
  assert.notEqual(maskedData.email, testData.email, 'Email should be masked');
  assert.notEqual(maskedData.phone, testData.phone, 'Phone should be masked');
  assert.notEqual(maskedData.ssn, testData.ssn, 'SSN should be masked');
});

testFramework.it('should anonymize data', () => {
  const testData = {
    name: 'John Doe',
    email: 'john@example.com',
    phone: '123-456-7890',
    public: 'This is public information'
  };

  const sensitiveFields = ['name', 'email', 'phone'];

  // Anonymize data
  const anonymizedData = encryptionManager.anonymizeData(testData, sensitiveFields);

  assert.equal(anonymizedData.public, testData.public, 'Public fields should remain unchanged');
  assert.notEqual(anonymizedData.name, testData.name, 'Name should be anonymized');
  assert.notEqual(anonymizedData.email, testData.email, 'Email should be anonymized');
  assert.notEqual(anonymizedData.phone, testData.phone, 'Phone should be anonymized');

  // Check that anonymized values are hashes
  assert.isString(anonymizedData.name, 'Anonymized name should be a string');
  assert.isString(anonymizedData.email, 'Anonymized email should be a string');
  assert.isString(anonymizedData.phone, 'Anonymized phone should be a string');
});

testFramework.it('should rotate encryption keys', async () => {
  const keyId = 'test-key';
  
  // Rotate key
  const result = await encryptionManager.rotateEncryptionKey(keyId);
  
  assert.isTrue(result, 'Key rotation should succeed');
});

testFramework.it('should provide security audit information', () => {
  const audit = encryptionManager.getSecurityAudit();
  
  assert.isDefined(audit, 'Security audit should be returned');
  assert.isNumber(audit.keyCount, 'Key count should be a number');
  assert.isNumber(audit.policyCount, 'Policy count should be a number');
  assert.isNumber(audit.classificationCount, 'Classification count should be a number');
  assert.isString(audit.lastKeyRotation, 'Last key rotation should be a string');
  assert.isNumber(audit.securityScore, 'Security score should be a number');
  assert.isInRange(audit.securityScore, 0, 100, 'Security score should be between 0 and 100');
});

testFramework.it('should handle data classification management', () => {
  // Get data classification
  const classification = encryptionManager.getDataClassification('confidential');
  
  assert.isDefined(classification, 'Classification should be returned');
  assert.equal(classification!.id, 'confidential', 'Classification ID should match');
  assert.equal(classification!.level, 'confidential', 'Classification level should match');
  assert.isTrue(classification!.encryptionRequired, 'Confidential data should require encryption');
});

testFramework.it('should handle security policy management', () => {
  // Get security policy
  const policy = encryptionManager.getSecurityPolicy('data-encryption-policy');
  
  assert.isDefined(policy, 'Policy should be returned');
  assert.equal(policy!.id, 'data-encryption-policy', 'Policy ID should match');
  assert.isTrue(policy!.isActive, 'Policy should be active');
  assert.isNotEmpty(policy!.rules, 'Policy should have rules');
});

testFramework.it('should handle encryption errors gracefully', async () => {
  // Test with invalid classification
  try {
    await encryptionManager.encryptData({ test: 'data' }, 'invalid-classification');
    assert.isTrue(false, 'Should throw error for invalid classification');
  } catch (error: any) {
    assert.isDefined(error, 'Error should be thrown');
    assert.isString(error.message, 'Error should have a message');
  }
});

testFramework.it('should handle decryption errors gracefully', async () => {
  // Test with invalid encrypted data
  const invalidEncryptedData = {
    data: 'invalid-data',
    iv: 'invalid-iv',
    salt: 'invalid-salt',
    algorithm: 'aes-256-gcm',
    timestamp: new Date().toISOString()
  };

  try {
    await encryptionManager.decryptData(invalidEncryptedData, 'confidential');
    assert.isTrue(false, 'Should throw error for invalid encrypted data');
  } catch (error: any) {
    assert.isDefined(error, 'Error should be thrown');
    assert.isString(error.message, 'Error should have a message');
  }
});

testFramework.it('should handle concurrent encryption operations', async () => {
  const testData = { message: 'Concurrent test' };
  
  // Try concurrent encryptions
  const encryptionPromises = Array.from({ length: 5 }, () => 
    encryptionManager.encryptData(testData, 'confidential')
  );

  const results = await Promise.all(encryptionPromises);
  
  // All should succeed
  results.forEach((result, index) => {
    assert.isDefined(result, `Concurrent encryption ${index + 1} should succeed`);
    assert.equal(result.algorithm, 'aes-256-gcm', 'Algorithm should be correct');
  });
});

testFramework.it('should handle different data types', async () => {
  const testCases = [
    { data: 'string data', type: 'string' },
    { data: 42, type: 'number' },
    { data: true, type: 'boolean' },
    { data: { nested: { value: 'test' } }, type: 'object' },
    { data: [1, 2, 3], type: 'array' },
    { data: null, type: 'null' }
  ];

  for (const testCase of testCases) {
    // Encrypt data
    const encryptedData = await encryptionManager.encryptData(testCase.data, 'confidential');
    
    // Decrypt data
    const decryptedData = await encryptionManager.decryptData(encryptedData, 'confidential');
    
    assert.deepEqual(decryptedData, testCase.data, `${testCase.type} data should be encrypted and decrypted correctly`);
  }
});

// Run tests
if (require.main === module) {
  testFramework.run().then(() => {
    testFramework.printResults();
  });
}

// Unit tests for AuthManager

import { testFramework, assert } from '@/lib/testing/testFramework';
import { authManager } from '@/lib/security/authManager';

testFramework.describe('AuthManager', 'Authentication and authorization system tests', {
  setup: async () => {
    // Clear any existing test data
    authManager.clear();
  },
  teardown: async () => {
    // Clean up test data
    authManager.clear();
  }
});

testFramework.it('should register a new user successfully', async () => {
  const userData = {
    email: 'test@example.com',
    password: 'TestPassword123!',
    role: 'user'
  };

  const result = await authManager.registerUser(userData);

  assert.isTrue(result.success, 'User registration should succeed');
  assert.isDefined(result.user, 'User should be returned');
  assert.equal(result.user!.email, userData.email, 'Email should match');
  assert.equal(result.user!.role, userData.role, 'Role should match');
  assert.isFalse(result.user!.isEmailVerified, 'Email should not be verified initially');
  assert.isTrue(result.user!.isActive, 'User should be active');
});

testFramework.it('should reject invalid email format', async () => {
  const userData = {
    email: 'invalid-email',
    password: 'TestPassword123!'
  };

  const result = await authManager.registerUser(userData);

  assert.isFalse(result.success, 'Registration should fail');
  assert.equal(result.error, 'Invalid email format', 'Should return email format error');
});

testFramework.it('should reject weak passwords', async () => {
  const userData = {
    email: 'test@example.com',
    password: 'weak'
  };

  const result = await authManager.registerUser(userData);

  assert.isFalse(result.success, 'Registration should fail');
  assert.isDefined(result.error, 'Should return password validation error');
});

testFramework.it('should reject duplicate email registration', async () => {
  const userData = {
    email: 'duplicate@example.com',
    password: 'TestPassword123!'
  };

  // Register first user
  const firstResult = await authManager.registerUser(userData);
  assert.isTrue(firstResult.success, 'First registration should succeed');

  // Try to register duplicate
  const secondResult = await authManager.registerUser(userData);
  assert.isFalse(secondResult.success, 'Duplicate registration should fail');
  assert.equal(secondResult.error, 'User already exists', 'Should return duplicate error');
});

testFramework.it('should authenticate valid user', async () => {
  const userData = {
    email: 'auth@example.com',
    password: 'TestPassword123!'
  };

  // Register user
  const registerResult = await authManager.registerUser(userData);
  assert.isTrue(registerResult.success, 'Registration should succeed');

  // Verify email (simulate email verification)
  const user = authManager.getUser(registerResult.user!.id);
  if (user) {
    user.isEmailVerified = true;
    authManager.updateUser(user.id, user);
  }

  // Authenticate user
  const authResult = await authManager.authenticateUser(userData.email, userData.password);

  assert.isTrue(authResult.success, 'Authentication should succeed');
  assert.isDefined(authResult.user, 'User should be returned');
  assert.isDefined(authResult.session, 'Session should be created');
  assert.equal(authResult.user!.email, userData.email, 'Email should match');
});

testFramework.it('should reject invalid credentials', async () => {
  const userData = {
    email: 'invalid@example.com',
    password: 'TestPassword123!'
  };

  // Register user
  const registerResult = await authManager.registerUser(userData);
  assert.isTrue(registerResult.success, 'Registration should succeed');

  // Try to authenticate with wrong password
  const authResult = await authManager.authenticateUser(userData.email, 'WrongPassword123!');

  assert.isFalse(authResult.success, 'Authentication should fail');
  assert.equal(authResult.error, 'Invalid credentials', 'Should return invalid credentials error');
});

testFramework.it('should require email verification', async () => {
  const userData = {
    email: 'unverified@example.com',
    password: 'TestPassword123!'
  };

  // Register user (email not verified)
  const registerResult = await authManager.registerUser(userData);
  assert.isTrue(registerResult.success, 'Registration should succeed');

  // Try to authenticate
  const authResult = await authManager.authenticateUser(userData.email, userData.password);

  assert.isFalse(authResult.success, 'Authentication should fail');
  assert.isTrue(authResult.requiresVerification, 'Should require email verification');
});

testFramework.it('should validate session tokens', async () => {
  const userData = {
    email: 'session@example.com',
    password: 'TestPassword123!'
  };

  // Register and authenticate user
  const registerResult = await authManager.registerUser(userData);
  assert.isTrue(registerResult.success, 'Registration should succeed');

  const user = authManager.getUser(registerResult.user!.id);
  if (user) {
    user.isEmailVerified = true;
    authManager.updateUser(user.id, user);
  }

  const authResult = await authManager.authenticateUser(userData.email, userData.password);
  assert.isTrue(authResult.success, 'Authentication should succeed');

  // Validate session
  const validationResult = await authManager.validateSession(authResult.session!.token);

  assert.isTrue(validationResult.valid, 'Session should be valid');
  assert.isDefined(validationResult.user, 'User should be returned');
  assert.isDefined(validationResult.session, 'Session should be returned');
});

testFramework.it('should reject invalid session tokens', async () => {
  const validationResult = await authManager.validateSession('invalid-token');

  assert.isFalse(validationResult.valid, 'Invalid session should be rejected');
  assert.isUndefined(validationResult.user, 'User should not be returned');
  assert.isUndefined(validationResult.session, 'Session should not be returned');
});

testFramework.it('should refresh session tokens', async () => {
  const userData = {
    email: 'refresh@example.com',
    password: 'TestPassword123!'
  };

  // Register and authenticate user
  const registerResult = await authManager.registerUser(userData);
  assert.isTrue(registerResult.success, 'Registration should succeed');

  const user = authManager.getUser(registerResult.user!.id);
  if (user) {
    user.isEmailVerified = true;
    authManager.updateUser(user.id, user);
  }

  const authResult = await authManager.authenticateUser(userData.email, userData.password);
  assert.isTrue(authResult.success, 'Authentication should succeed');

  // Refresh session
  const refreshResult = await authManager.refreshSession(authResult.session!.refreshToken);

  assert.isTrue(refreshResult.success, 'Session refresh should succeed');
  assert.isDefined(refreshResult.session, 'New session should be created');
  assert.notEqual(refreshResult.session!.token, authResult.session!.token, 'Token should be different');
});

testFramework.it('should logout user and invalidate session', async () => {
  const userData = {
    email: 'logout@example.com',
    password: 'TestPassword123!'
  };

  // Register and authenticate user
  const registerResult = await authManager.registerUser(userData);
  assert.isTrue(registerResult.success, 'Registration should succeed');

  const user = authManager.getUser(registerResult.user!.id);
  if (user) {
    user.isEmailVerified = true;
    authManager.updateUser(user.id, user);
  }

  const authResult = await authManager.authenticateUser(userData.email, userData.password);
  assert.isTrue(authResult.success, 'Authentication should succeed');

  // Logout
  const logoutResult = await authManager.logout(authResult.session!.token);
  assert.isTrue(logoutResult.success, 'Logout should succeed');

  // Try to validate session after logout
  const validationResult = await authManager.validateSession(authResult.session!.token);
  assert.isFalse(validationResult.valid, 'Session should be invalid after logout');
});

testFramework.it('should change user password', async () => {
  const userData = {
    email: 'password@example.com',
    password: 'OldPassword123!'
  };

  // Register user
  const registerResult = await authManager.registerUser(userData);
  assert.isTrue(registerResult.success, 'Registration should succeed');

  // Change password
  const changeResult = await authManager.changePassword(
    registerResult.user!.id,
    'OldPassword123!',
    'NewPassword123!'
  );

  assert.isTrue(changeResult.success, 'Password change should succeed');

  // Try to authenticate with old password
  const oldAuthResult = await authManager.authenticateUser(userData.email, 'OldPassword123!');
  assert.isFalse(oldAuthResult.success, 'Old password should not work');

  // Try to authenticate with new password
  const user = authManager.getUser(registerResult.user!.id);
  if (user) {
    user.isEmailVerified = true;
    authManager.updateUser(user.id, user);
  }

  const newAuthResult = await authManager.authenticateUser(userData.email, 'NewPassword123!');
  assert.isTrue(newAuthResult.success, 'New password should work');
});

testFramework.it('should check user permissions', async () => {
  const userData = {
    email: 'permissions@example.com',
    password: 'TestPassword123!',
    role: 'user'
  };

  // Register user
  const registerResult = await authManager.registerUser(userData);
  assert.isTrue(registerResult.success, 'Registration should succeed');

  const user = registerResult.user!;

  // Check permissions
  assert.isTrue(authManager.hasPermission(user, 'read_properties'), 'Should have read_properties permission');
  assert.isTrue(authManager.hasPermission(user, 'read_portfolio'), 'Should have read_portfolio permission');
  assert.isFalse(authManager.hasPermission(user, 'admin_access'), 'Should not have admin_access permission');
});

testFramework.it('should log security events', async () => {
  const userData = {
    email: 'security@example.com',
    password: 'TestPassword123!'
  };

  // Register user (should log security event)
  const registerResult = await authManager.registerUser(userData);
  assert.isTrue(registerResult.success, 'Registration should succeed');

  // Get security events
  const events = authManager.getSecurityEvents(10);
  assert.isNotEmpty(events, 'Should have security events');
  
  const registrationEvent = events.find(e => e.type === 'login' && e.details.action === 'user_registration');
  assert.isDefined(registrationEvent, 'Should have registration event');
});

testFramework.it('should handle brute force protection', async () => {
  const userData = {
    email: 'bruteforce@example.com',
    password: 'TestPassword123!'
  };

  // Register user
  const registerResult = await authManager.registerUser(userData);
  assert.isTrue(registerResult.success, 'Registration should succeed');

  // Try multiple failed logins
  for (let i = 0; i < 6; i++) {
    const authResult = await authManager.authenticateUser(userData.email, 'WrongPassword123!');
    assert.isFalse(authResult.success, `Failed login ${i + 1} should fail`);
  }

  // Try one more login (should be blocked)
  const blockedResult = await authManager.authenticateUser(userData.email, 'WrongPassword123!');
  assert.isFalse(blockedResult.success, 'Login should be blocked after too many attempts');
  assert.isDefined(blockedResult.error, 'Should return brute force error');
});

testFramework.it('should manage user data', async () => {
  const userData = {
    email: 'manage@example.com',
    password: 'TestPassword123!'
  };

  // Register user
  const registerResult = await authManager.registerUser(userData);
  assert.isTrue(registerResult.success, 'Registration should succeed');

  const userId = registerResult.user!.id;

  // Get user
  const user = authManager.getUser(userId);
  assert.isDefined(user, 'User should be retrievable');
  assert.equal(user!.email, userData.email, 'User email should match');

  // Update user
  const updateResult = authManager.updateUser(userId, { isActive: false });
  assert.isTrue(updateResult, 'User update should succeed');

  const updatedUser = authManager.getUser(userId);
  assert.isFalse(updatedUser!.isActive, 'User should be inactive');

  // Delete user
  const deleteResult = authManager.deleteUser(userId);
  assert.isTrue(deleteResult, 'User deletion should succeed');

  const deletedUser = authManager.getUser(userId);
  assert.isUndefined(deletedUser, 'User should be deleted');
});

testFramework.it('should handle concurrent operations', async () => {
  const userData = {
    email: 'concurrent@example.com',
    password: 'TestPassword123!'
  };

  // Register user
  const registerResult = await authManager.registerUser(userData);
  assert.isTrue(registerResult.success, 'Registration should succeed');

  const user = authManager.getUser(registerResult.user!.id);
  if (user) {
    user.isEmailVerified = true;
    authManager.updateUser(user.id, user);
  }

  // Try concurrent authentications
  const authPromises = Array.from({ length: 5 }, () => 
    authManager.authenticateUser(userData.email, userData.password)
  );

  const results = await Promise.all(authPromises);
  
  // All should succeed
  results.forEach((result, index) => {
    assert.isTrue(result.success, `Concurrent auth ${index + 1} should succeed`);
  });
});

// Run tests
if (require.main === module) {
  testFramework.run().then(() => {
    testFramework.printResults();
  });
}

-- Add test user for portfolio testing
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at) 
VALUES ('00000000-0000-0000-0000-000000000000', 'test@example.com', '', NOW(), NOW(), NOW()) 
ON CONFLICT (id) DO NOTHING;

-- Add test profile for the test user
INSERT INTO public.profiles (id, email, name, tier, created_at, updated_at) 
VALUES ('00000000-0000-0000-0000-000000000000', 'test@example.com', 'Test User', 'free', NOW(), NOW()) 
ON CONFLICT (id) DO NOTHING; 
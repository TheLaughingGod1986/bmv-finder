# Environment Variables Organization Guide

## Current Issues Found

1. **Syntax Error**: Your `.env.local` has a stray `%` character at the end
2. **Mixed Concerns**: Secret keys are in `.env` instead of `.env.local`
3. **Security Risk**: Sensitive data in `.env` could be committed to git

## Recommended Organization

### `.env` (Base/Shared Configuration)
```bash
# Stripe (Public Keys Only)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here

# Stripe Price IDs (Public)
NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID=price_1RilQpQul6soqa6ldncWEKg3
NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID=price_1RiY75Qul6soqa6lL3E7gOdq
NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID=price_1RiZsoQul6soqa6lJ7gXD4qA
NEXT_PUBLIC_STRIPE_ELITE_MONTHLY_PRICE_ID=price_1RiYE7Qul6soqa6lYTQvTGYX
NEXT_PUBLIC_STRIPE_ELITE_YEARLY_PRICE_ID=price_1Rim4iQul6soqa6l5CaBhkYd
NEXT_PUBLIC_STRIPE_PDF_REPORT_PRICE_ID=price_1RiZttQuI6soqa6lkQnaKcQZ

# Supabase (Public Configuration)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# App Configuration
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### `.env.local` (Local/Secret Configuration)
```bash
# Local Development Overrides
# These override .env values and should NEVER be committed to git

# Stripe (Secret Keys - Local Only)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Supabase (Service Role Key - Local Only)
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Elasticsearch Cloud Configuration (Local Override)
ES_NODE=https://your-elasticsearch-cluster.com:443
ES_USERNAME=elastic
ES_PASSWORD=your_elasticsearch_password_here
ES_INDEX=land_registry_sales
ES_CLOUD_ID=your_elasticsearch_cloud_id_here
ES_CA_FINGERPRINT=your_elasticsearch_ca_fingerprint_here
ES_API_KEY=your_elasticsearch_api_key_here

# Local Elasticsearch (Development Override)
ELASTICSEARCH_URL=http://localhost:9201
ELASTICSEARCH_USERNAME=elastic
ELASTICSEARCH_PASSWORD=your_local_elasticsearch_password_here

# Sentry (Error Tracking)
SENTRY_DSN=https://your_sentry_dsn_here
```

## Action Required

1. **Fix `.env.local`**: Remove the stray `%` character at the end
2. **Move secret keys**: Move all secret keys from `.env` to `.env.local`
3. **Keep public keys**: Keep only public keys in `.env`
4. **Verify `.gitignore`**: Ensure `.env.local` is in your `.gitignore`

## Security Benefits

- **`.env`**: Safe to commit, contains only public configuration
- **`.env.local`**: Never committed, contains all secrets and local overrides
- **Team collaboration**: Other developers can copy `.env` and add their own `.env.local`
- **Production safety**: No risk of accidentally committing secrets 
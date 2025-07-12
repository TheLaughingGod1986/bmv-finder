#!/bin/bash

# Path to your .env file
ENV_FILE=".env"

if [ ! -f "$ENV_FILE" ]; then
  echo "Error: $ENV_FILE not found in current directory."
  exit 1
fi

while IFS='=' read -r key value
do
  # Skip comments and empty lines
  [[ "$key" =~ ^#.*$ || -z "$key" ]] && continue
  # Remove possible quotes around the value
  value="${value%\"}"
  value="${value#\"}"
  value="${value%\'}"
  value="${value#\'}"
  # Set the secret using GitHub CLI
  echo "Setting $key..."
  gh secret set "$key" --body "$value"
done < "$ENV_FILE"

echo "All secrets from $ENV_FILE have been set as GitHub secrets for this repo." 
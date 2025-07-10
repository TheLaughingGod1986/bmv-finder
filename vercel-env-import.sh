#!/bin/bash

# This script reads .env.local and adds each variable to Vercel for all environments

ENV_FILE=".env.local"
ENVS="production preview development"

if [ ! -f "$ENV_FILE" ]; then
  echo ".env.local file not found!"
  exit 1
fi

while IFS= read -r line; do
  # Skip comments and blank lines
  if [[ "$line" =~ ^# ]] || [[ -z "$line" ]]; then
    continue
  fi
  # Parse key and value
  key="${line%%=*}"
  value="${line#*=}"
  for env in $ENVS; do
    echo "Adding $key to $env..."
    vercel env add $key $env <<< "$value"
  done
done < "$ENV_FILE"

echo "All environment variables from .env.local have been added to Vercel for all environments!" 
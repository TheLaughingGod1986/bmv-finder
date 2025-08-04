#!/bin/bash

echo "🧹 Removing console.log statements from codebase..."

# Find and remove console.log statements from TypeScript/TSX files
find src/ -name "*.ts" -o -name "*.tsx" | while read file; do
  echo "Processing: $file"
  
  # Create backup
  cp "$file" "$file.backup"
  
  # Remove console.log statements (but keep console.error and console.warn)
  sed -i '' '/^[[:space:]]*console\.log(/d' "$file"
  
  # Remove empty lines that might be left
  sed -i '' '/^[[:space:]]*$/d' "$file"
  
  echo "✅ Cleaned: $file"
done

echo "🎉 Console.log removal completed!"
echo "📊 Summary: Removed console.log statements from TypeScript/TSX files"
echo "💡 Note: console.error and console.warn statements were preserved" 
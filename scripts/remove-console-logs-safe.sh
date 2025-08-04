#!/bin/bash

echo "🧹 Safely removing console.log statements from codebase..."

# Find and remove only standalone console.log statements from TypeScript/TSX files
find src/ -name "*.ts" -o -name "*.tsx" | while read file; do
  echo "Processing: $file"
  
  # Create backup
  cp "$file" "$file.backup"
  
  # Remove only standalone console.log statements (not part of objects)
  # This regex matches console.log( followed by anything and ending with );
  sed -i '' '/^[[:space:]]*console\.log([^;]*);[[:space:]]*$/d' "$file"
  
  # Remove console.log statements that are part of a block (with proper indentation)
  sed -i '' '/^[[:space:]]*console\.log([^;]*);$/d' "$file"
  
  echo "✅ Cleaned: $file"
done

echo "🎉 Safe console.log removal completed!"
echo "📊 Summary: Removed standalone console.log statements from TypeScript/TSX files"
echo "💡 Note: console.error and console.warn statements were preserved" 
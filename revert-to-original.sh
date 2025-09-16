#!/bin/bash
# Revert to original heygen avatar implementation

echo "Reverting to original Heygen Avatar implementation..."

# Restore original files
cp src/lib/heygen-avatar.js.backup src/lib/heygen-avatar.js
cp src/app/coaching/page.js.backup src/app/coaching/page.js

# Remove new implementation
rm -f src/lib/heygen-avatar-v2.js

echo "✅ Reverted to original implementation successfully!"
echo "📁 Backup files still available:"
echo "   - src/lib/heygen-avatar.js.backup"
echo "   - src/app/coaching/page.js.backup"

echo "🔄 Please restart your development server."
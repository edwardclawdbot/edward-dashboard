#!/bin/bash
# Edward's Dashboard Status Updater

# Usage: ./update-status.sh "What I'm working on" "Details here"

MAC_HOST="ClawdBot@mac-claude"
DASH_URL="http://localhost:3000"

if [ -n "$1" ]; then
    WORKING_TITLE="$1"
else
    echo "Usage: $0 \"Title\" [\"Detail\"]"
    echo "Example: $0 \"Coding\" \"Building new feature\""
    exit 1
fi

DETAIL="${2:-}"

# Update via API
curl -s -X POST "$DASH_URL/api/status" \
    -H "Content-Type: application/json" \
    -d "{\"working\":{\"title\":\"$WORKING_TITLE\",\"detail\":\"$DETAIL\"}}" > /dev/null

echo "✅ Status updated!"
echo "🎯 Now working on: $WORKING_TITLE"
if [ -n "$DETAIL" ]; then
    echo "📝 Detail: $DETAIL"
fi

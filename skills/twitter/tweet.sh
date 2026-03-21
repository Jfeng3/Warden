#!/usr/bin/env bash
# Post a tweet using X API v2 with OAuth 1.0a.
# Usage: bash skills/twitter/tweet.sh "Your tweet text"
#    or: echo "Your tweet text" | bash skills/twitter/tweet.sh
# Reads TWITTER_CONSUMER_KEY, TWITTER_CONSUMER_SECRET,
#        TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_TOKEN_SECRET from environment.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

if [ -n "${1:-}" ]; then
  npx tsx "$SCRIPT_DIR/post.ts" "$1"
else
  npx tsx "$SCRIPT_DIR/post.ts"
fi


#!/bin/bash
# Source this file to set up local development environment
# Usage: source local-env.sh

echo "Setting up local development environment..."

# Memory and performance optimizations
export NODE_OPTIONS="--max-old-space-size=8192 --no-warnings"
export SKIP_TYPE_CHECK=true
export CI=false
export NEXT_TELEMETRY_DISABLED=1
export TSC_NONPOLLING_WATCHER=true
export TSC_COMPILE_ON_ERROR=true
export NEXT_PRIVATE_SKIP_TYPE_CHECK=true
export DISABLE_ESLINT_PLUGIN=true
export TS_NODE_TRANSPILE_ONLY=true
export NEXT_PRIVATE_DISABLE_EXPERIMENTAL_TRACE=true
export NPM_CONFIG_LEGACY_PEER_DEPS=true

# Use local development config
export NEXT_CONFIG_FILE="next.config.local.js"

# Mock services for local development
export TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
export TWILIO_AUTH_TOKEN="mock_token"
export TWILIO_PHONE_NUMBER="+15551234567"

echo "Local development environment configured!"
echo "Memory limit: 8GB"
echo "Type checking: DISABLED"
echo "Use './dev-local.sh' to start development server"
echo "Use './build-local.sh' to build locally"


#!/bin/bash
echo "Starting SafePlay ULTRA-FAST build for checkpoint creation..."

# Minimal memory settings for fastest possible build
export NODE_OPTIONS="--max-old-space-size=4096 --no-warnings"
export SKIP_TYPE_CHECK=true
export CI=true
export NEXT_TELEMETRY_DISABLED=1
export TSC_NONPOLLING_WATCHER=true
export TSC_COMPILE_ON_ERROR=true
export NEXT_PRIVATE_SKIP_TYPE_CHECK=true
export DISABLE_ESLINT_PLUGIN=true
export TS_NODE_TRANSPILE_ONLY=true
export NEXT_PRIVATE_DISABLE_EXPERIMENTAL_TRACE=true

# Skip heavy optimization steps
export NEXT_PRIVATE_SKIP_STATIC_GENERATION=false
export ANALYZE=false

# Mock configurations
export TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
export TWILIO_AUTH_TOKEN="mock_token"
export TWILIO_PHONE_NUMBER="+15551234567"

echo "Ultra-fast build settings configured"
echo "Running minimal build for checkpoint..."

# Use the build command directly
yarn build --no-lint --experimental-build-mode=fast 2>/dev/null || yarn build --no-lint || yarn build

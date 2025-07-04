
#!/bin/bash
echo "Starting SafePlay LOCAL build with optimized memory settings..."

# Set comprehensive environment variables for local development
export NODE_OPTIONS="--max-old-space-size=8192 --no-warnings"
export SKIP_TYPE_CHECK=true
export CI=false
export NEXT_TELEMETRY_DISABLED=1
export TSC_NONPOLLING_WATCHER=true
export TSC_COMPILE_ON_ERROR=true
export NEXT_PRIVATE_SKIP_TYPE_CHECK=true
export DISABLE_ESLINT_PLUGIN=true
export TS_NODE_TRANSPILE_ONLY=true

# Mock configurations for build process
export TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
export TWILIO_AUTH_TOKEN="mock_token"
export TWILIO_PHONE_NUMBER="+15551234567"

echo "Local build environment variables set:"
echo "NODE_OPTIONS=$NODE_OPTIONS"
echo "SKIP_TYPE_CHECK=$SKIP_TYPE_CHECK"
echo "TSC_COMPILE_ON_ERROR=$TSC_COMPILE_ON_ERROR"

echo "Running local optimized build..."
yarn build


#!/bin/bash
echo "Starting SafePlay LOCAL development server with optimized settings..."

# Set memory and performance optimizations for local development
export NODE_OPTIONS="--max-old-space-size=8192 --no-warnings"
export SKIP_TYPE_CHECK=true
export CI=false
export NEXT_TELEMETRY_DISABLED=1
export TSC_NONPOLLING_WATCHER=true
export TSC_COMPILE_ON_ERROR=true
export NEXT_PRIVATE_SKIP_TYPE_CHECK=true
export DISABLE_ESLINT_PLUGIN=true
export TS_NODE_TRANSPILE_ONLY=true

# Fast development settings
export NEXT_PRIVATE_DISABLE_EXPERIMENTAL_TRACE=true
export NPM_CONFIG_LEGACY_PEER_DEPS=true

echo "Local development environment variables set:"
echo "NODE_OPTIONS=$NODE_OPTIONS"
echo "SKIP_TYPE_CHECK=$SKIP_TYPE_CHECK"

echo "Starting development server on port 3000..."
yarn dev

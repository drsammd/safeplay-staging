
#!/bin/bash
echo "Starting SafePlay FAST development server with minimal type checking..."

# Minimal memory footprint for fastest startup
export NODE_OPTIONS="--max-old-space-size=4096 --no-warnings"
export SKIP_TYPE_CHECK=true
export CI=false
export NEXT_TELEMETRY_DISABLED=1
export TSC_NONPOLLING_WATCHER=true
export TSC_COMPILE_ON_ERROR=true
export NEXT_PRIVATE_SKIP_TYPE_CHECK=true
export DISABLE_ESLINT_PLUGIN=true
export TS_NODE_TRANSPILE_ONLY=true
export NEXT_PRIVATE_DISABLE_EXPERIMENTAL_TRACE=true

echo "Fast development environment variables set for minimal memory usage"
echo "Starting ultra-fast development server..."
yarn dev

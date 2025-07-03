
#!/bin/bash
echo "Starting SafePlay build with TypeScript checking disabled..."
export SKIP_TYPE_CHECK=true
export CI=false
export NEXT_TELEMETRY_DISABLED=1
next build

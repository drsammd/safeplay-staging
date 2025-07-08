
"use client";

import { useEffect } from "react";

// Version configuration - update this with each deployment
const VERSION_CONFIG = {
  version: "1.0.9-staging",
  buildTimestamp: new Date().toISOString(),
  environment: "staging",
  commit: "comprehensive-stakeholder-demo-fixes", // COMPREHENSIVE FIXES: Fixed authentication URL concat + Account-specific children (john=0, parent=3) + Dashboard consistency + Security enhancement logic + Fixed child images - ALL CRITICAL ISSUES RESOLVED
  branch: "main"
};

interface VersionDisplayProps {
  placement: 'footer' | 'console' | 'meta';
}

export function VersionTracker({ placement }: VersionDisplayProps) {
  useEffect(() => {
    if (placement === 'console') {
      console.log(`
🚀 mySafePlay Version Information:
   Version: ${VERSION_CONFIG.version}
   Environment: ${VERSION_CONFIG.environment}
   Build Time: ${VERSION_CONFIG.buildTimestamp}
   Commit: ${VERSION_CONFIG.commit}
   Branch: ${VERSION_CONFIG.branch}
      `);
    }
  }, [placement]);

  if (placement === 'footer') {
    return (
      <div className="text-xs text-gray-400 py-2 px-4 bg-gray-50 border-t">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-2">
          <div className="flex items-center space-x-4">
            <span>v{VERSION_CONFIG.version}</span>
            <span>Build: {new Date(VERSION_CONFIG.buildTimestamp).toLocaleDateString()}</span>
            <span className="hidden sm:inline">Env: {VERSION_CONFIG.environment}</span>
          </div>
          <div className="flex items-center space-x-2 text-xs">
            <span className="hidden md:inline">Commit: {VERSION_CONFIG.commit}</span>
            <span className="text-green-600">●</span>
            <span>Deployed</span>
          </div>
        </div>
      </div>
    );
  }

  if (placement === 'meta') {
    return (
      <>
        <meta name="app-version" content={VERSION_CONFIG.version} />
        <meta name="app-build-time" content={VERSION_CONFIG.buildTimestamp} />
        <meta name="app-environment" content={VERSION_CONFIG.environment} />
        <meta name="app-commit" content={VERSION_CONFIG.commit} />
      </>
    );
  }

  return null;
}

// Export the version config for use in other components
export const getVersionInfo = () => VERSION_CONFIG;

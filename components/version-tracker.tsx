
"use client";

import { useEffect, useState } from "react";

// Fallback version configuration
const FALLBACK_VERSION_CONFIG = {
  version: "1.2.25-staging",
  buildTimestamp: new Date().toISOString(),
  environment: "staging",
  commit: "address-validation-and-signup-api-fully-fixed",
  branch: "main"
};

interface VersionDisplayProps {
  placement: 'footer' | 'console' | 'meta';
}

export function VersionTracker({ placement }: VersionDisplayProps) {
  const [versionConfig, setVersionConfig] = useState({
    ...FALLBACK_VERSION_CONFIG,
    version: '1.2.23-staging'
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch version information from API
    fetch('/api/version')
      .then(response => response.json())
      .then(data => {
        setVersionConfig(data);
        setIsLoading(false);
      })
      .catch(error => {
        console.error('Failed to fetch version info:', error);
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    if (placement === 'console' && !isLoading) {
      console.log(`
🚀 mySafePlay Version Information:
   Version: ${versionConfig.version}
   Environment: ${versionConfig.environment}
   Build Time: ${versionConfig.buildTimestamp}
   Commit: ${versionConfig.commit}
   Branch: ${versionConfig.branch}
      `);
    }
  }, [placement, versionConfig, isLoading]);

  if (placement === 'footer') {
    return (
      <div className="text-xs text-gray-400 py-2 px-4 bg-gray-50 border-t">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-2">
          <div className="flex items-center space-x-4">
            <span>v{versionConfig.version}</span>
            <span>Build: {new Date(versionConfig.buildTimestamp).toLocaleDateString()}</span>
            <span className="hidden sm:inline">Env: {versionConfig.environment}</span>
          </div>
          <div className="flex items-center space-x-2 text-xs">
            <span className="hidden md:inline">Commit: {versionConfig.commit}</span>
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
        <meta name="app-version" content={versionConfig.version} />
        <meta name="app-build-time" content={versionConfig.buildTimestamp} />
        <meta name="app-environment" content={versionConfig.environment} />
        <meta name="app-commit" content={versionConfig.commit} />
      </>
    );
  }

  return null;
}

// Export the version config for use in other components
export const getVersionInfo = () => FALLBACK_VERSION_CONFIG;

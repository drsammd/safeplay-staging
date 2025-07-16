
'use client';

import { useState, useEffect } from 'react';

export default function VersionTracker() {
  const [versionInfo, setVersionInfo] = useState<any>(null);

  useEffect(() => {
    const fetchVersion = async () => {
      try {
        const response = await fetch('/api/version');
        const data = await response.json();
        setVersionInfo(data);
      } catch (error) {
        console.error('Failed to fetch version:', error);
      }
    };

    fetchVersion();
  }, []);

  if (!versionInfo) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-75 text-white px-3 py-2 rounded-lg text-xs font-mono z-50">
      <div>🚀 mySafePlay Version Information:</div>
      <div>&nbsp;&nbsp;&nbsp;Version: {versionInfo.version}</div>
      <div>&nbsp;&nbsp;&nbsp;Environment: {versionInfo.environment}</div>
      <div>&nbsp;&nbsp;&nbsp;Build Time: {versionInfo.buildTime}</div>
      <div>&nbsp;&nbsp;&nbsp;Commit: {versionInfo.commit}</div>
      <div>&nbsp;&nbsp;&nbsp;Branch: {versionInfo.branch}</div>
    </div>
  );
}

// Export for compatibility with existing imports
export { VersionTracker };

// Export helper function for version info
export async function getVersionInfo() {
  try {
    const response = await fetch('/api/version');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch version:', error);
    return null;
  }
}

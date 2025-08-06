export default function TestPage() {
  return (
    <div>
      <h1>Test Page - No Redirects</h1>
      <p>If you can see this, the app is working without redirects.</p>
      <p>Timestamp: {new Date().toISOString()}</p>
    </div>
  );
}

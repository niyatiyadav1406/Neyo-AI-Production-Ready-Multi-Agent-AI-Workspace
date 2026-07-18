export default function App() {
  return (
    <div style={{ padding: '40px 20px', fontFamily: 'system-ui', maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '32px', marginBottom: '10px' }}>🚀 AI Tutor Dashboard</h1>
      <p style={{ color: '#666', fontSize: '16px', marginBottom: '30px' }}>Frontend is running successfully!</p>
      
      <div style={{ padding: '20px', backgroundColor: '#f0f4f8', borderRadius: '8px', border: '1px solid #e0e8f0' }}>
        <h2 style={{ marginTop: 0, marginBottom: '15px', fontSize: '18px' }}>Setup Status</h2>
        <ul style={{ lineHeight: 2, marginBottom: 0, paddingLeft: '20px' }}>
          <li>✅ Vite dev server running on port 5173</li>
          <li>✅ React app initialized</li>
          <li>✅ React Router configured</li>
          <li>✅ UI component libraries ready</li>
        </ul>
      </div>

      <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '6px', fontSize: '13px', color: '#666', borderLeft: '3px solid #999' }}>
        <strong>Next Steps:</strong>
        <p style={{ margin: '8px 0' }}>The backend services and pages are ready to integrate. The app is in a "hello world" state while components are being prepared.</p>
      </div>
    </div>
  )
}

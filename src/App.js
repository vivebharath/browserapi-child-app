import React, { useEffect, useState } from 'react';
import './App.css';

// 🌐 ENVIRONMENT SETUP: Automatically detect Local vs Production
const IS_LOCAL = window.location.hostname === 'localhost';
const EXPECTED_ORIGIN = IS_LOCAL 
  ? 'http://localhost:3000' // Make sure this matches your Parent App's local port (usually 3000)
  : 'https://vivebharath.github.io';

const App = () => {
  const [status, setStatus] = useState('');
  const [formData, setFormData] = useState({ whatHappened: '', whyIsItProblem: '', howDetected: '' });
  const [parentData, setParentData] = useState(null);
  
  const [isConnected, setIsConnected] = useState(true);

  const getTargetWindow = () => {
    // Desktop Tab detection
    if (window.opener && !window.opener.closed) {
      return window.opener;
    }
    // Mobile Iframe detection
    if (window.parent && window.parent !== window) {
      return window.parent;
    }
    return null;
  };

  useEffect(() => {
    const targetWindow = getTargetWindow();
    if (!targetWindow) {
      console.warn('No parent/opener window available for postMessage.');
      setIsConnected(false); 
      return;
    }

    targetWindow.postMessage(
      { type: 'CHILD_LOADED', timestamp: new Date().toISOString() },
      EXPECTED_ORIGIN
    );
    console.log('Child window loaded and notified parent/opener');
  }, []);

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.origin !== EXPECTED_ORIGIN) {
        console.warn('Received message from untrusted origin:', event.origin);
        return;
      }

      const data = event.data;
      console.log('Child received from parent:', data);

      if (data.type === 'PARENT_DATA') {
        setParentData(data.payload);
        setFormData(data.payload); 
        setStatus('✅ Received data from Parent!');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    // Only start polling if there is an opener initially
    if (window.opener) {
      const checkConnection = setInterval(() => {
        // SAFE CHECK: Check if opener was completely wiped (null) OR if it is closed
        if (!window.opener || window.opener.closed) {
          setIsConnected(false);
          clearInterval(checkConnection); // Stop checking once we know it is dead
        }
      }, 1000); // Check every 1 second

      return () => clearInterval(checkConnection);
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const message = {
      type: 'FORM_SUBMITTED',
      payload: formData,
      timestamp: new Date().toISOString()
    };
    
    const targetWindow = getTargetWindow();
    if (!targetWindow) {
      setStatus('⚠️ No parent window connected.');
      return;
    }

    console.log('Child sending form data:', message);
    targetWindow.postMessage(message, EXPECTED_ORIGIN);
    setStatus('✅ Data sent to parent successfully!');

    // Reset form to blank after submission
    setFormData({ whatHappened: '', whyIsItProblem: '', howDetected: '' });
  };

  return (
    <div className="app-container">
      <div className="header">
        <h1>Child App (Consider Like 5w2h AI coach)</h1>
        <p>Running on: {IS_LOCAL ? 'Localhost' : 'Production'}</p>
      </div>

      {/* 🚨 NEW: Show a highly visible error if connection is lost */}
      {!isConnected && (
        <div style={{ 
          backgroundColor: '#f8d7da', 
          color: '#721c24', 
          padding: '15px', 
          borderRadius: '5px', 
          marginBottom: '20px', 
          border: '1px solid #f5c6cb' 
        }}>
          <strong>⚠️ Connection Lost!</strong> The Parent window was closed or disconnected. Any data submitted now will not be saved. Please reopen this tool from the Parent App.
        </div>
      )}

      <div className="form-container">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="whatHappened">What happened?</label>
            <input
              type="text"
              id="whatHappened"
              name="whatHappened"
              value={formData.whatHappened}
              onChange={handleInputChange}
              disabled={!isConnected} // Disable if parent is closed
            />
          </div>

          <div className="form-group">
            <label htmlFor="whyIsItProblem">Why is it a Problem?</label>
            <input
              type="text"
              id="whyIsItProblem"
              name="whyIsItProblem"
              value={formData.whyIsItProblem}
              onChange={handleInputChange}
              disabled={!isConnected} // Disable if parent is closed
            />
          </div>

          <div className="form-group">
            <label htmlFor="howDetected">How detected?</label>
            <input
              type="text"
              id="howDetected"
              name="howDetected"
              value={formData.howDetected}
              onChange={handleInputChange}
              disabled={!isConnected} // Disable if parent is closed
            />
          </div>

          <button 
            type="submit" 
            className="submit-btn"
            disabled={!isConnected} // Disable button if parent is closed
            style={{ 
              opacity: isConnected ? 1 : 0.5, 
              cursor: isConnected ? 'pointer' : 'not-allowed' 
            }}
          >
            Submit to Parent
          </button>
          
          {status && <p className="status-msg" style={{ marginTop: '10px', fontWeight: 'bold' }}>{status}</p>}
        </form>
      </div>
    </div>
  );
};

export default App;
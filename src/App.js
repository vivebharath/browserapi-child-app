import React, { useEffect, useState, useRef } from 'react';
import './App.css';

// 🌐 ENVIRONMENT SETUP
const IS_LOCAL = window.location.hostname === 'localhost';
const EXPECTED_ORIGIN = IS_LOCAL ? 'http://localhost:3000' : 'https://vivebharath.github.io';

// 🚨 NEW: We need the exact URL to open the Parent App
const PARENT_APP_URL = IS_LOCAL 
  ? 'http://localhost:3000/' 
  : 'https://vivebharath.github.io/browserapi-parent-app/';

const App = () => {
  const [status, setStatus] = useState('');
  const [formData, setFormData] = useState({ whatHappened: '', whyIsItProblem: '', howDetected: '' });
  
  // 🚨 NEW: Refs to handle the smart connection
  const activeParentRef = useRef(null);
  const latestFormDataRef = useRef(formData);
  const pendingSubmitRef = useRef(false); // Tracks if we are waiting for the parent to open

  // Keep the Ref synced with the latest typed data (Avoids stale closures)
  useEffect(() => {
    latestFormDataRef.current = formData;
  }, [formData]);

  const getTargetWindow = () => {
    if (window.opener && !window.opener.closed) return window.opener;
    if (window.parent && window.parent !== window) return window.parent;
    return null;
  };

  // 1. Initial Load: Find Parent and say Hello
  useEffect(() => {
    activeParentRef.current = getTargetWindow();
    
    if (activeParentRef.current) {
      // 100ms timeout ensures React Strict Mode doesn't detach the listener before sending
      setTimeout(() => {
        if (activeParentRef.current) {
          activeParentRef.current.postMessage({ 
            type: 'CHILD_LOADED', 
            payload: latestFormDataRef.current, 
            timestamp: new Date().toISOString() 
          }, EXPECTED_ORIGIN);
        }
      }, 100);
    }
  }, []);

  // 2. Message Listener
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.origin !== EXPECTED_ORIGIN) return;
      const data = event.data;

      // Handle receiving data from Parent
      if (data.type === 'PARENT_DATA') {
        setFormData(data.payload); 
        setStatus('✅ Received synced data from Parent!');
      }

      // 🚨 SMART HANDSHAKE: Parent just announced it finished opening!
      if (data.type === 'PARENT_READY') {
        // Send the data immediately using the Walkie-Talkie ref
        activeParentRef.current.postMessage({
          type: 'FORM_SUBMITTED',
          payload: latestFormDataRef.current,
          timestamp: new Date().toISOString()
        }, EXPECTED_ORIGIN);

        // If the user was waiting for this submit, clear the form and update status
        if (pendingSubmitRef.current) {
          setStatus('✅ Parent opened and data sent successfully!');
          setFormData({ whatHappened: '', whyIsItProblem: '', howDetected: '' });
          pendingSubmitRef.current = false; // Reset the flag
        } else {
          setStatus('✅ Parent reconnected!');
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []); // Empty array ensures listener never drops

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // 3. Smart Submit Logic
  const handleSubmit = (e) => {
    e.preventDefault();
    
    const message = {
      type: 'FORM_SUBMITTED',
      payload: formData,
      timestamp: new Date().toISOString()
    };
    
    // SCENARIO A: Parent is currently open and valid
    if (activeParentRef.current && !activeParentRef.current.closed) {
      activeParentRef.current.postMessage(message, EXPECTED_ORIGIN);
      setStatus('✅ Data sent to parent successfully!');
    } 
    // SCENARIO B: Parent is missing or closed
    else {
      setStatus('⏳ Opening Parent tab to send data...');
      pendingSubmitRef.current = true;
      
      // Open the new tab and save the new reference!
      const newParent = window.open(PARENT_APP_URL, 'parent-app');
      activeParentRef.current = newParent;
    }
  };

  return (
    <div className="app-container">
      <div className="header">
        <h1>Child App (Consider Like 5w2h AI coach)</h1>
      </div>

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
            />
          </div>

          <button type="submit" className="submit-btn">
            Submit to Parent
          </button>
          
          {status && <p className="status-msg" style={{ marginTop: '10px', fontWeight: 'bold' }}>{status}</p>}
        </form>
      </div>
    </div>
  );
};

export default App;
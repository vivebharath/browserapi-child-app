import React, { useEffect, useState } from 'react';
import './App.css';

const IS_LOCAL = window.location.hostname === 'localhost';
const EXPECTED_ORIGIN = IS_LOCAL 
  ? 'http://localhost:3000' 
  : 'https://vivebharath.github.io';

const App = () => {
  const [status, setStatus] = useState('');
  const [formData, setFormData] = useState({ whatHappened: '', whyIsItProblem: '', howDetected: '' });

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
        setFormData(data.payload); 
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
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

    // BUG FIX: Corrected typo 'whathappened' to 'whatHappened'
    setFormData({ whatHappened: '', howDetected: '', whyIsItProblem: '' });
  };

  return (
    <div className="app-container">
      <div className="header">
        <h1>Child App (Consider Like 5w2h AI coach)</h1>
        <p>Running on: {IS_LOCAL ? 'Localhost' : 'Production'}</p>
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

          <button type="submit" className="submit-btn">Submit to Parent</button>
          {status && <p className="status-msg">{status}</p>}
        </form>
      </div>
    </div>
  );
};

export default App;
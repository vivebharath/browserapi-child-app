import React, { useEffect, useState } from 'react';
import './App.css';

const App = () => {
  const [status, setStatus] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [parentData, setParentData] = useState(null);

  
  const PARENT_URL = 'https://vivebharath.github.io/browserapi-parent-app';

  const EXPECTED_ORIGIN = 'https://vivebharath.github.io';


  const getTargetWindow = () => {
    if (window.opener && !window.opener.closed) {
      return window.opener;
    }

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

    // Notify parent/opener that child is loaded
    targetWindow.postMessage(
  { type: 'CHILD_LOADED', timestamp: new Date().toISOString() },
  EXPECTED_ORIGIN // ✅ Correct: Just the origin
);
    console.log('Child window loaded and notified parent/opener');
  }, []);

  useEffect(() => {
    const handleMessage = (event) => {
      // Security: Validate origin
      if (event.origin !== EXPECTED_ORIGIN) {
        console.warn('Received message from untrusted origin:', event.origin);
        return;
      }

      const data = event.data;
      console.log('Child received from parent:', data);

      if (data.type === 'PARENT_DATA') {
        setParentData(data.payload);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
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
      setStatus('⚠️ No parent window connected. Please open this page using the "Open Child in New Tab" button from the Parent App.');
      return;
    }

    console.log('Child sending form data:', message);
    targetWindow.postMessage(message, EXPECTED_ORIGIN);
    setStatus('✅ Data sent to parent successfully!');

    // Reset form
    setFormData({
      name: '',
      email: '',
      phone: '',
      message: ''
    });
  };

  return (
    <div className="app-container">
      <div className="header">
        <h1>Child App - Simple Form</h1>
        <p>Running on: http://localhost:3001</p>
      </div>

      {parentData && (
        <div className="parent-data-panel">
          <h2>Data Received from Parent</h2>
          <div className="data-display">
            <p><strong>Title:</strong> {parentData.title || '(empty)'}</p>
            <p><strong>Description:</strong> {parentData.description || '(empty)'}</p>
            <p><strong>Value:</strong> {parentData.value || '(empty)'}</p>
          </div>
        </div>
      )}

      <div className="form-container">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Name:</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter your name"
            //   required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email:</label>
            <input
              type="text"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Enter your email"
            //   required
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone:</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="Enter your phone"
            //   required
            />
          </div>

          <div className="form-group">
            <label htmlFor="message">Message:</label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              placeholder="Enter your message (optional)"
              rows="4"
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

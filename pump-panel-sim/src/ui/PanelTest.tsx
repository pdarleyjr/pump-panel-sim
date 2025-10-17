import React from 'react';

export default function PanelTest() {
  console.log('PanelTest rendering');
  
  return (
    <div style={{ 
      padding: '50px', 
      backgroundColor: 'red', 
      color: 'white', 
      fontSize: '24px',
      textAlign: 'center' 
    }}>
      <h1>TEST PANEL</h1>
      <p>If you can see this red box, React is working!</p>
      <p>Time: {new Date().toLocaleTimeString()}</p>
    </div>
  );
}
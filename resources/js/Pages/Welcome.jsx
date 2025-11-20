import React from 'react';

export default function Welcome() {
    return (
        <div style={{
            fontFamily: 'Arial, sans-serif',
            margin: 0,
            padding: 0,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            height: '100vh',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: 'column'
        }}>
            <h1 style={{
                color: 'white',
                fontSize: '4rem',
                textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
                margin: '0 0 20px 0'
            }}>
                Hello Laravel with React!
            </h1>
            <p style={{
                color: 'white',
                fontSize: '1.2rem',
                textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
                margin: 0
            }}>
                Your React frontend is now ready to build amazing things!
            </p>
        </div>
    );
}
import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import ProposalScreen from './components/ProposalScreen';
import Dashboard from './components/Dashboard';

export default function App() {
  const [accepted, setAccepted] = useState(null); // null = loading

  useEffect(() => {
    supabase
      .from('proposal')
      .select('accepted')
      .eq('id', 'singleton')
      .single()
      .then(({ data }) => setAccepted(data?.accepted ?? false));
  }, []);

  const handleAccept = async () => {
    await supabase
      .from('proposal')
      .update({ accepted: true, updated_at: new Date().toISOString() })
      .eq('id', 'singleton');
    setAccepted(true);
  };

  if (accepted === null) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#1a0a12',
        color: '#e8a0b0',
        fontFamily: 'Montserrat, sans-serif',
        fontSize: '1.2rem',
      }}>
        💕
      </div>
    );
  }

  return accepted
    ? <Dashboard onReset={() => setAccepted(false)} />
    : <ProposalScreen onAccept={handleAccept} />;
}

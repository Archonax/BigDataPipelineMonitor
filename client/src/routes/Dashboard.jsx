import React, { useState, useEffect } from 'react';
import Calls from '../calls';

function Dashboard() {
  const [stats, setStats] = useState({ datasets: 0, pipelines: 0, activePipelines: 0, runs: 0, failedRuns: 0, alerts: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ds, pl, rn, al] = await Promise.all([
          Calls.get('/datasets'), Calls.get('/pipelines'), Calls.get('/runs'), Calls.get('/alerts')
        ]);
        
        setStats({
          datasets: ds.data.length,
          pipelines: pl.data.length,
          activePipelines: pl.data.filter(p => p.active).length,
          runs: rn.data.length,
          failedRuns: rn.data.filter(r => r.status === 'failed').length,
          alerts: al.data.length
        });
        setLoading(false);
      } catch (err) { setLoading(false); }
    };
    fetchData();
  }, []);

  if (loading) return <div>Načítám dashboard...</div>;

  return (
    <div>
      <h2>Dashboard</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
        <div style={cardStyle}><h3>Datasety</h3><h2>{stats.datasets}</h2></div>
        <div style={cardStyle}><h3>Pipeline</h3><h2>{stats.pipelines}</h2></div>
        <div style={cardStyle}><h3>Běhy (Failed)</h3><h2>{stats.runs} <span style={{color:'red'}}>({stats.failedRuns})</span></h2></div>
        <div style={cardStyle}><h3>Alerty</h3><h2>{stats.alerts}</h2></div>
      </div>
    </div>
  );
}
const cardStyle = { border: '1px solid #ccc', padding: '15px', borderRadius: '8px', textAlign: 'center', backgroundColor: '#f9f9f9' };
export default Dashboard;
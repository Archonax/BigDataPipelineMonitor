import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Calls from '../calls';

function Runs() {
  const [runs, setRuns] = useState([]);
  const [pipelines, setPipelines] = useState([]); // Potřebujeme pro mapování ID -> Jméno
  const [loading, setLoading] = useState(true);
  
  // Filtry
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPipeline, setFilterPipeline] = useState('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [runsRes, pipeRes] = await Promise.all([
          Calls.get('/runs'),
          Calls.get('/pipelines')
        ]);
        setRuns(runsRes.data);
        setPipelines(pipeRes.data);
        setLoading(false);
      } catch (err) {
        console.error("Chyba při načítání dat:", err);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Logika filtrování (kombinuje oba filtry) 
  const filteredRuns = runs.filter(run => {
    const matchesStatus = filterStatus === 'all' || run.status === filterStatus;
    const matchesPipeline = filterPipeline === 'all' || run.pipelineId === filterPipeline;
    return matchesStatus && matchesPipeline;
  });

  if (loading) return <div>Načítám historii běhů...</div>;

  return (
    <div>
      <h2>Seznam Běhů</h2>

      {/* Ovládací panel s filtry  */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '20px', backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '5px' }}>
        <div>
          <label><strong>Status: </strong></label>
          <select onChange={(e) => setFilterStatus(e.target.value)} value={filterStatus} style={inputStyle}>
            <option value="all">Všechny stavy</option>
            <option value="running">Running</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        <div>
          <label><strong>Pipeline: </strong></label>
          <select onChange={(e) => setFilterPipeline(e.target.value)} value={filterPipeline} style={inputStyle}>
            <option value="all">Všechny pipeline</option>
            {pipelines.map(p => (
              <option key={p._id} value={p._id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: '#f2f2f2', textAlign: 'left' }}>
            <th style={thStyle}>Pipeline</th> {/* Změněno z Pipeline ID */}
            <th style={thStyle}>Status</th>
            <th style={thStyle}>Začátek</th>
            <th style={thStyle}>Konec / Runtime</th>
            <th style={thStyle}>Akce</th>
          </tr>
        </thead>
        <tbody>
          {filteredRuns.map(run => {
            // Najdeme jméno pipeline podle ID 
            const pipe = pipelines.find(p => p._id === run.pipelineId);
            const pipeDisplayName = pipe ? `${pipe.name} (v${run.pipelineVersion || 1})` : "Neznámá pipeline";

            return (
              <tr key={run._id} style={{ borderBottom: '1px solid #ddd' }}>
                <td style={tdStyle}>
                  <strong>{pipeDisplayName}</strong>
                </td>
                <td style={tdStyle}>
                  <span style={getStatusStyle(run.status)}>{run.status.toUpperCase()}</span>
                </td>
                <td style={tdStyle}>{new Date(run.startedAt).toLocaleString()}</td>
                <td style={tdStyle}>
                  {run.finishedAt ? new Date(run.finishedAt).toLocaleTimeString() : '---'}
                </td>
                <td style={tdStyle}>
                  <Link to={`/runs/${run._id}`}>Zobrazit detail</Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      
      {filteredRuns.length === 0 && (
        <p style={{ textAlign: 'center', marginTop: '20px', color: '#666' }}>
          Pro vybrané filtry nebyly nalezeny žádné běhy.
        </p>
      )}
    </div>
  );
}

// Styly 
const thStyle = { padding: '12px', borderBottom: '2px solid #ddd' };
const tdStyle = { padding: '12px' };
const inputStyle = { padding: '5px', borderRadius: '4px', border: '1px solid #ccc', marginLeft: '5px' };

const getStatusStyle = (status) => {
  const base = { padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' };
  if (status === 'success') return { ...base, backgroundColor: '#d4edda', color: '#155724' };
  if (status === 'failed') return { ...base, backgroundColor: '#f8d7da', color: '#721c24' };
  return { ...base, backgroundColor: '#cce5ff', color: '#004085' };
};

export default Runs;
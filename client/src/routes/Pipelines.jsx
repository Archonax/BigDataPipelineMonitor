import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Calls from '../calls';

function Pipelines() {
  const [pipelines, setPipelines] = useState([]);
  const [runs, setRuns] = useState([]);
  const [datasets, setDatasets] = useState([]); // Nový stav pro datasety
  
  // Stavy pro formulář
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', datasetId: '', schedule: '0 2 * * *' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [plRes, runRes, dsRes] = await Promise.all([
        Calls.get('/pipelines'),
        Calls.get('/runs'),
        Calls.get('/datasets') // Stáhneme i datasety pro náš dropdown
      ]);
      setPipelines(plRes.data);
      setRuns(runRes.data);
      setDatasets(dsRes.data);
      
      // Předvyplníme první dataset do formuláře, pokud nějaký existuje
      if (dsRes.data.length > 0) {
        setFormData(prev => ({ ...prev, datasetId: dsRes.data[0]._id }));
      }
    } catch (err) { console.error(err); }
  };

  const handleRun = async (id) => {
    try {
      await Calls.post(`/pipelines/${id}/run`);
      alert('Pipeline úspěšně spuštěna!');
      fetchData(); // Obnovíme data, abychom viděli nový poslední běh
    } catch (err) {
      alert('Chyba: ' + (err.response?.data?.error || err.message));
    }
  };

  // Odeslání nové pipeline
  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await Calls.post('/pipelines', { ...formData, active: true });
      setShowForm(false);
      setFormData({ name: '', datasetId: datasets.length > 0 ? datasets[0]._id : '', schedule: '0 2 * * *' });
      fetchData();
      alert('Pipeline vytvořena!');
    } catch (err) {
      alert('Chyba: ' + (err.response?.data?.error || err.message));
    }
  };

  const getLastRun = (pipelineId) => {
    const pRuns = runs.filter(r => r.pipelineId === pipelineId).sort((a,b) => new Date(b.startedAt) - new Date(a.startedAt));
    return pRuns.length > 0 ? pRuns[0] : null;
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Seznam Pipeline</h2>
        <button onClick={() => setShowForm(!showForm)} style={buttonStyle}>
          {showForm ? '✖ Zavřít' : '➕ Nová Pipeline'}
        </button>
      </div>

      {/* Formulář pro vytvoření pipeline */}
      {showForm && (
        <form onSubmit={handleCreate} style={formStyle}>
          <div style={{ marginBottom: '10px' }}>
            <label>Název pipeline: </label>
            <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} style={inputStyle} />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>Zdrojový Dataset: </label>
            <select required value={formData.datasetId} onChange={e => setFormData({...formData, datasetId: e.target.value})} style={inputStyle}>
              {datasets.length === 0 && <option value="">Nejprve vytvořte dataset!</option>}
              {datasets.map(ds => (
                <option key={ds._id} value={ds._id}>{ds.name}</option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>Schedule (Cron): </label>
            <input required value={formData.schedule} onChange={e => setFormData({...formData, schedule: e.target.value})} style={inputStyle} />
          </div>
          <button type="submit" disabled={datasets.length === 0} style={{ ...buttonStyle, backgroundColor: datasets.length === 0 ? '#ccc' : '#28a745' }}>
            Vytvořit Pipeline
          </button>
        </form>
      )}

      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
        <thead><tr style={{ backgroundColor: '#f2f2f2', textAlign: 'left' }}>
          <th style={thStyle}>Název</th><th style={thStyle}>Dataset ID</th><th style={thStyle}>Poslední běh</th><th style={thStyle}>Akce</th>
        </tr></thead>
        <tbody>
          {pipelines.map(p => {
            const lastRun = getLastRun(p._id);
            // Najdeme jméno datasetu 
            const linkedDataset = datasets.find(d => d._id === p.datasetId);
            
            return (
              <tr key={p._id} style={{ borderBottom: '1px solid #ddd' }}>
                <td style={tdStyle}><Link to={`/pipelines/${p._id}`}><strong>{p.name}</strong></Link></td>
                <td style={tdStyle}>{linkedDataset ? linkedDataset.name : p.datasetId}</td>
                <td style={tdStyle}>
                  {lastRun ? (
                    <span style={{ color: lastRun.status === 'failed' ? 'red' : lastRun.status === 'success' ? 'green' : 'blue', fontWeight: 'bold' }}>
                      {lastRun.status.toUpperCase()}
                    </span>
                  ) : 'Nikdy nespuštěno'}
                </td>
                <td style={tdStyle}>
                  <button onClick={() => handleRun(p._id)} style={{ ...buttonStyle, backgroundColor: '#17a2b8', marginRight: '10px' }}>▶ Run</button>
                  <Link to={`/pipelines/${p._id}`}><button style={{...buttonStyle, backgroundColor: '#6c757d'}}>Detail</button></Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const thStyle = { padding: '12px', borderBottom: '2px solid #ddd' };
const tdStyle = { padding: '12px' };
const buttonStyle = { padding: '8px 12px', backgroundColor: '#007BFF', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' };
const formStyle = { padding: '15px', backgroundColor: '#f9f9f9', border: '1px solid #ddd', borderRadius: '5px', marginBottom: '20px' };
const inputStyle = { padding: '6px', width: '250px', marginLeft: '10px' };

export default Pipelines;
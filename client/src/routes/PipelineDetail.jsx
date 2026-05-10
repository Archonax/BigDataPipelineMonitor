import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Calls from '../calls';

function PipelineDetail() {
  const { id } = useParams();
  const [pipeline, setPipeline] = useState(null);
  const [runs, setRuns] = useState([]);
  const [versions, setVersions] = useState([]); // Nový stav pro verze

  const fetchDetail = async () => {
    try {
      const plRes = await Calls.get(`/pipelines/${id}`);
      const runsRes = await Calls.get('/runs');
      const versRes = await Calls.get(`/pipelines/${id}/versions`);
      
      setPipeline(plRes.data);
      setRuns(runsRes.data.filter(r => r.pipelineId === id));
      setVersions(versRes.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchDetail(); }, [id]);

  // Vytvoření nové verze
  const handleCreateVersion = async () => {
    const query = prompt("Zadejte nový SQL dotaz pro tuto verzi:", "SELECT * FROM data LIMIT 100");
    if (!query) return;
    try {
      await Calls.post(`/pipelines/${id}/versions`, { engine: "spark", query });
      fetchDetail();
      alert("Nová verze vytvořena (jako neaktivní)!");
    } catch (err) { alert("Chyba: " + err.message); }
  };

  // Aktivace vybrané verze
  const handleActivateVersion = async (versionId) => {
    try {
      await Calls.patch(`/pipelines/${id}/versions/${versionId}/activate`);
      fetchDetail();
    } catch (err) { alert("Chyba při aktivaci: " + err.message); }
  };

  if (!pipeline) return <div>Načítám detail...</div>;

  return (
    <div>
      <h2>Detail Pipeline: {pipeline.name}</h2>
      
      {/* Existující přehled */}
      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#e9ecef', borderRadius: '5px' }}>
        <p><strong>Dataset ID:</strong> {pipeline.datasetId}</p>
        <p><strong>Schedule:</strong> {pipeline.schedule}</p>
      </div>

      {/* SEKCE PRO VERZE */}
      <div style={{ marginBottom: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>Správa verzí (PipelineVersions)</h3>
          <button onClick={handleCreateVersion} style={buttonStyle}>➕ Vytvořit novou verzi</button>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f2f2f2', textAlign: 'left' }}>
              <th style={thStyle}>Verze</th>
              <th style={thStyle}>SQL Query (Config)</th>
              <th style={thStyle}>Stav</th>
              <th style={thStyle}>Akce</th>
            </tr>
          </thead>
          <tbody>
            {versions.map(v => (
              <tr key={v._id} style={{ borderBottom: '1px solid #ddd', backgroundColor: v.active ? '#e6f4ea' : 'transparent' }}>
                <td style={tdStyle}><strong>v{v.version}</strong></td>
                <td style={tdStyle}><code>{v.config?.query}</code></td>
                <td style={tdStyle}>
                  {v.active ? <span style={{color: 'green', fontWeight:'bold'}}>AKTIVNÍ</span> : 'Neaktivní'}
                </td>
                <td style={tdStyle}>
                  {!v.active && (
                    <button onClick={() => handleActivateVersion(v._id)} style={{...buttonStyle, backgroundColor: '#17a2b8', padding: '4px 8px'}}>
                      Nastavit jako aktivní
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Zbytek stránky (běhy) */}
      <h3>Historie Běhů</h3>
      <ul>
        {runs.map(run => (
          <li key={run._id} style={{ marginBottom: '5px' }}>
            <Link to={`/runs/${run._id}`}>{new Date(run.startedAt).toLocaleString()}</Link> - 
            Stav: <strong>{run.status.toUpperCase()}</strong> (Běželo na verzi: {run.pipelineVersion || 'N/A'})
          </li>
        ))}
      </ul>
    </div>
  );
}

const thStyle = { padding: '12px', borderBottom: '2px solid #ddd' };
const tdStyle = { padding: '12px' };
const buttonStyle = { padding: '8px 12px', backgroundColor: '#007BFF', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' };

export default PipelineDetail;
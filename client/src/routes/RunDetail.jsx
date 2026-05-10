import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Calls from '../calls';

function RunDetail() {
  const { id } = useParams();
  const [run, setRun] = useState(null);
  const [steps, setSteps] = useState([]);

  const fetchRunData = async () => {
    try {
      const runRes = await Calls.get(`/runs/${id}`);
      setRun(runRes.data);
      const stepsRes = await Calls.get(`/runs/${id}/steps`);
      setSteps(stepsRes.data);
    } catch (err) { console.error("Chyba při načítání detailu:", err); }
  };

  useEffect(() => { fetchRunData(); }, [id]);

  // Nová funkce pro změnu stavu KROKU
  const handleStepAction = async (stepId, status) => {
    const errorMsg = status === 'failed' ? prompt("Zadejte důvod chyby pro alert:") : null;
    if (status === 'failed' && errorMsg === null) return; // Zrušeno uživatelem
    
    try {
      await Calls.patch(`/runs/${id}/steps/${stepId}`, { status, errorMessage: errorMsg });
      fetchRunData(); // Obnovíme zobrazení po posunutí kroku
    } catch (err) { alert('Chyba při posunu kroku: ' + err.message); }
  };

  if (!run) return <div>Načítám běh...</div>;

  return (
    <div>
      <h2>Detail Běhu</h2>
      <div style={{ padding: '15px', border: '1px solid #ccc', borderRadius: '5px', marginBottom: '20px' }}>
        <p><strong>Pipeline ID:</strong> {run.pipelineId} (Verze: {run.pipelineVersion || 'N/A'})</p>
        <p><strong>Status Běhu:</strong> <span style={{ fontWeight: 'bold', color: run.status === 'failed' ? 'red' : run.status === 'success' ? 'green' : 'blue' }}>{run.status.toUpperCase()}</span></p>
        <p><strong>Začátek:</strong> {new Date(run.startedAt).toLocaleString()}</p>
        <p><strong>Konec:</strong> {run.finishedAt ? new Date(run.finishedAt).toLocaleString() : 'Probíhá...'}</p>
        {run.errorMessage && <p style={{ color: 'red', marginTop: '10px' }}><strong>Důvod selhání:</strong> {run.errorMessage}</p>}
      </div>

      <h3>Kroky běhu (JobRunSteps)</h3>
      {steps.length === 0 ? <p>Žádné kroky k zobrazení.</p> : (
        <ul style={{ listStyleType: 'none', padding: 0 }}>
          {steps.map((step, index) => (
            <li key={step._id} style={{ padding: '15px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: step.status === 'running' ? '#f0f8ff' : 'transparent' }}>
              <div>
                <strong>{index + 1}. {step.name.toUpperCase()}</strong> - Stav: <span style={{ fontWeight: 'bold', color: step.status === 'failed' ? 'red' : step.status === 'success' ? 'green' : 'inherit' }}>{step.status.toUpperCase()}</span>
                {step.finishedAt && <span style={{ marginLeft: '10px', fontSize: '12px', color: '#666' }}>(Dokončeno: {new Date(step.finishedAt).toLocaleTimeString()})</span>}
              </div>
              
              {/* Tlačítka se zobrazí pouze u KROKU, KTERÝ PRÁVĚ BĚŽÍ */}
              {step.status === 'running' && (
                <div>
                  <button onClick={() => handleStepAction(step._id, 'success')} style={{ ...buttonStyle, backgroundColor: '#28a745' }}>
                    ✔ Splněno
                  </button>
                  <button onClick={() => handleStepAction(step._id, 'failed')} style={{ ...buttonStyle, backgroundColor: '#dc3545' }}>
                    ✖ Selhání
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const buttonStyle = { padding: '6px 12px', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginLeft: '10px', fontWeight: 'bold', fontSize: '12px' };
export default RunDetail;
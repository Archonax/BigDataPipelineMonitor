import React, { useState, useEffect } from 'react';
import Calls from '../calls';

function AlertRules() {
  const [rules, setRules] = useState([]);
  const [pipelines, setPipelines] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Stavy pro formulář
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ pipelineId: '', name: '', condition: 'status == failed' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [rulesRes, plRes] = await Promise.all([
        Calls.get('/alert-rules'),
        Calls.get('/pipelines')
      ]);
      setRules(rulesRes.data);
      setPipelines(plRes.data);
      
      if (plRes.data.length > 0) {
        setFormData(prev => ({ ...prev, pipelineId: plRes.data[0]._id }));
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await Calls.post('/alert-rules', formData);
      setShowForm(false);
      fetchData();
      alert('Pravidlo úspěšně vytvořeno!');
    } catch (err) {
      alert('Chyba: ' + (err.response?.data?.error || err.message));
    }
  };

  const toggleRule = async (id, currentEnabled) => {
    try {
      await Calls.patch(`/alert-rules/${id}`, { enabled: !currentEnabled });
      fetchData();
    } catch (err) {
      alert('Chyba při změně stavu pravidla: ' + err.message);
    }
  };

  const deleteRule = async (id) => {
    if (!window.confirm('Opravdu chcete toto pravidlo smazat?')) return;
    try {
      await Calls.delete(`/alert-rules/${id}`);
      fetchData();
    } catch (err) {
      alert('Chyba při mazání: ' + err.message);
    }
  };

  if (loading) return <div>Načítám pravidla...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Pravidla pro Alerty (Alert Rules)</h2>
        <button onClick={() => setShowForm(!showForm)}>
          {showForm ? '✖ Zavřít' : '➕ Nové Pravidlo'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="card" style={{ marginBottom: '20px', marginTop: '10px' }}>
          <div style={{ marginBottom: '10px' }}>
            <label><strong>Pipeline: </strong></label>
            <select required value={formData.pipelineId} onChange={e => setFormData({...formData, pipelineId: e.target.value})}>
              {pipelines.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label><strong>Název pravidla: </strong></label>
            <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="např. Detekce selhání" />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label><strong>Podmínka: </strong></label>
            <input required value={formData.condition} onChange={e => setFormData({...formData, condition: e.target.value})} placeholder="např. runtime > 10m" />
          </div>
          <button type="submit" style={{ backgroundColor: '#28a745' }}>Vytvořit pravidlo</button>
        </form>
      )}

      {rules.length === 0 ? (
        <p>Zatím nejsou definována žádná pravidla pro alerty.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Název pravidla</th>
              <th>Pipeline</th>
              <th>Podmínka</th>
              <th>Stav</th>
              <th>Akce</th>
            </tr>
          </thead>
          <tbody>
            {rules.map(rule => {
              const pipe = pipelines.find(p => p._id === rule.pipelineId);
              return (
                <tr key={rule._id} style={{ opacity: rule.enabled ? 1 : 0.6 }}>
                  <td><strong>{rule.name}</strong></td>
                  <td>{pipe ? pipe.name : rule.pipelineId}</td>
                  <td><code>{rule.condition}</code></td>
                  <td>
                    {rule.enabled ? <span style={{ color: 'green', fontWeight: 'bold' }}>Aktivní</span> : <span style={{ color: 'gray' }}>Vypnuto</span>}
                  </td>
                  <td>
                    <button onClick={() => toggleRule(rule._id, rule.enabled)} style={{ marginRight: '10px', backgroundColor: rule.enabled ? '#6c757d' : '#17a2b8' }}>
                      {rule.enabled ? 'Vypnout' : 'Zapnout'}
                    </button>
                    <button onClick={() => deleteRule(rule._id)} style={{ backgroundColor: '#dc3545' }}>Smazat</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default AlertRules;
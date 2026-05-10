import React, { useState, useEffect } from 'react';
import Calls from '../calls';

function Datasets() {
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Stavy pro formulář
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', owner: '' });

  useEffect(() => {
    fetchDatasets();
  }, []);

  const fetchDatasets = async () => {
    try {
      const res = await Calls.get('/datasets');
      setDatasets(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      // Kompletní data včetně vlastníka
      await Calls.post('/datasets', formData);
      setShowForm(false);
      setFormData({ name: '', description: '', owner: '' }); 
      fetchDatasets();
      alert('Dataset úspěšně vytvořen!');
    } catch (err) {
      alert('Chyba: ' + (err.response?.data?.error || err.message));
    }
  };

  if (loading) return <div>Načítám datasety...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Seznam Datasetů</h2>
        <button onClick={() => setShowForm(!showForm)} style={buttonStyle}>
          {showForm ? '✖ Zavřít' : '➕ Nový Dataset'}
        </button>
      </div>

      {/* Formulář s polem pro jméno uživatele */}
      {showForm && (
        <form onSubmit={handleCreate} style={formStyle}>
          <div style={{ marginBottom: '10px' }}>
            <label>Název datasetu: </label>
            <input 
              required 
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})} 
              style={inputStyle} 
              placeholder="např. transactions" 
            />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>Vlastník (Uživatel): </label>
            <input 
              required 
              value={formData.owner} 
              onChange={e => setFormData({...formData, owner: e.target.value})} 
              style={inputStyle} 
              placeholder="Vaše jméno nebo email" 
            />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>Popis: </label>
            <input 
              value={formData.description} 
              onChange={e => setFormData({...formData, description: e.target.value})} 
              style={inputStyle} 
              placeholder="Volitelný popis" 
            />
          </div>
          <button type="submit" style={{ ...buttonStyle, backgroundColor: '#28a745' }}>Vytvořit</button>
        </form>
      )}

      {datasets.length === 0 ? (
        <p>Zatím nebyly vytvořeny žádné datasety.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f2f2f2', textAlign: 'left' }}>
              <th style={thStyle}>Název</th>
              <th style={thStyle}>Vlastník</th>
              <th style={thStyle}>Verze schématu</th>
              <th style={thStyle}>Vytvořeno</th>
            </tr>
          </thead>
          <tbody>
            {datasets.map(ds => (
              <tr key={ds._id} style={{ borderBottom: '1px solid #ddd' }}>
                <td style={tdStyle}>
                    <strong>{ds.name}</strong><br/>
                    <small style={{color: '#666'}}>{ds.description}</small>
                </td>
                <td style={tdStyle}>{ds.owner}</td>
                <td style={tdStyle}>{ds.schemaVersion}</td>
                <td style={tdStyle}>{new Date(ds.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

const thStyle = { padding: '12px', borderBottom: '2px solid #ddd' };
const tdStyle = { padding: '12px' };
const buttonStyle = { padding: '8px 12px', backgroundColor: '#007BFF', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' };
const formStyle = { padding: '15px', backgroundColor: '#f9f9f9', border: '1px solid #ddd', borderRadius: '5px', marginBottom: '20px' };
const inputStyle = { padding: '6px', width: '250px', marginLeft: '10px' };

export default Datasets;
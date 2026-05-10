import React, { useState, useEffect } from 'react';
import Calls from '../calls';

function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const res = await Calls.get('/alerts');
      setAlerts(res.data);
      setLoading(false);
    } catch (err) {
      setError('Nepodařilo se načíst seznam alertů.');
      setLoading(false);
    }
  };

  if (loading) return <div>Načítám alerty...</div>;
  if (error) return <div style={{ color: 'red' }}>Chyba: {error}</div>;

  return (
    <div>
      <h2>Seznam Alertů</h2>
      {alerts.length === 0 ? (
        <p>Žádné alerty nebyly zaznamenány. Vše běží v pořádku!</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
          <thead>
            <tr style={{ backgroundColor: '#fbdcdc', textAlign: 'left' }}>
              <th style={thStyle}>Závažnost</th>
              <th style={thStyle}>Zpráva (Message)</th>
              <th style={thStyle}>ID Běhu</th>
              <th style={thStyle}>Vytvořeno</th>
            </tr>
          </thead>
          <tbody>
            {alerts.map(alert => (
              <tr key={alert._id} style={{ borderBottom: '1px solid #ddd' }}>
                <td style={tdStyle}>
                  <span style={{ color: '#721c24', fontWeight: 'bold' }}>{alert.severity.toUpperCase()}</span>
                </td>
                <td style={tdStyle}>{alert.message}</td>
                <td style={tdStyle}>{alert.runId.substring(0, 8)}...</td>
                <td style={tdStyle}>{new Date(alert.createdAt).toLocaleString()}</td>
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

export default Alerts;
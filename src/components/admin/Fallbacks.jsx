import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext.jsx';

const Fallbacks = () => {
  const { profile } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!profile || !['admin','superuser'].includes(profile.role)) return;
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.from('admin_fallbacks').select('*').order('created_at', { ascending: false }).limit(50);
        if (error) {
          setError(error);
        } else if (mounted) {
          setLogs(data || []);
        }
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [profile]);

  if (!profile || !['admin','superuser'].includes(profile.role)) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-medium">Fallback logs</h3>
      {loading && <p>Loading...</p>}
      {error && <p className="text-danger">Error loading logs: {String(error.message || error)}</p>}
      {!loading && !error && (
        <div className="overflow-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="p-2 text-left">Time</th>
                <th className="p-2 text-left">User</th>
                <th className="p-2 text-left">Type</th>
                <th className="p-2 text-left">Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id} className="border-t last:border-b">
                  <td className="p-2 align-top">{new Date(l.created_at).toLocaleString()}</td>
                  <td className="p-2 align-top">{l.user_id}</td>
                  <td className="p-2 align-top">{l.event_type}</td>
                  <td className="p-2 align-top"><pre className="whitespace-pre-wrap text-xs">{JSON.stringify(l.details || {}, null, 2)}</pre></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Fallbacks;
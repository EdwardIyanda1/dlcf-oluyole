import { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import apiService, { isCanceled } from '../../api';

const ROLES = [
  { value: 'member',       label: 'Church Member' },
  { value: 'registration', label: 'Registration Unit' },
  { value: 'usher',        label: 'Usher' },
  { value: 'admin',        label: 'Admin' },
];

const roleBadge = {
  member:       'bg-[#1C2541]/10 text-[#1C2541]',
  registration: 'bg-[#D4A857]/20 text-[#6E2C3A]',
  usher:        'bg-[#1C2541]/15 text-[#1C2541]',
  admin:        'bg-[#6E2C3A] text-[#FAF6EE]',
};

const PAGE_SIZE = 50;

export default function AdminUsers() {
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    apiService.getUsers({ signal: controller.signal }).then(r => {
      setUsers(r.data.results ?? r.data);
      setLoading(false);
    }).catch(err => {
      if (isCanceled(err)) return;
      console.error(err);
      setLoading(false);
    });
    return () => controller.abort();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(u =>
      u.full_name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q)
    );
  }, [users, search]);

  const changeRole = async (user, role) => {
    setSavingId(user.id);
    try {
      const r = await apiService.setUserRole(user.id, role);
      setUsers(prev => prev.map(u => u.id === user.id ? r.data : u));
      toast.success(`${user.full_name} is now ${ROLES.find(x => x.value === role)?.label}.`);
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Could not update permission level.');
    }
    setSavingId(null);
  };

  if (loading) return <p className="text-[#6B7785]">Loading...</p>;

  return (
    <div>
      <p className="text-[#6E2C3A] text-xs font-semibold tracking-[0.25em] uppercase mb-1">Admin Dashboard</p>
      <h2 className="text-3xl font-bold text-[#1C2541] mb-1">Users &amp; Permission Levels</h2>
      <p className="text-[#6B7785] text-sm mb-6">
        Assign each account one of four levels: Church Member, Registration Unit, Usher, or Admin.
      </p>

      <input
        value={search}
        onChange={e => { setSearch(e.target.value); setVisible(PAGE_SIZE); }}
        placeholder="Search by name, username, or email..."
        className="w-full max-w-md border border-[#1C2541]/15 bg-white p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-[#D4A857] transition text-sm mb-5"
      />

      <p className="text-xs text-[#6B7785] mb-3">{filtered.length} account{filtered.length === 1 ? '' : 's'} found</p>

      <div className="bg-white rounded-2xl border border-[#1C2541]/10 overflow-x-auto shadow-sm">
        <table className="w-full text-left min-w-[640px]">
          <thead className="bg-[#1C2541]">
            <tr>
              {['Name', 'Email', 'Current Level', 'Set Level'].map(h => (
                <th key={h} className="p-4 text-xs font-semibold tracking-widest uppercase text-[#FAF6EE]/70">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0
              ? <tr><td colSpan={4} className="p-8 text-center text-[#6B7785]">No accounts match your search.</td></tr>
              : filtered.slice(0, visible).map(u => (
                <tr key={u.id} className="border-b border-[#1C2541]/5 last:border-0 hover:bg-[#FAF6EE]">
                  <td className="p-4 font-medium text-[#1C2541]">{u.full_name}</td>
                  <td className="p-4 text-[#6B7785]">{u.email || u.username}</td>
                  <td className="p-4">
                    <span className={`text-xs font-semibold uppercase tracking-wide px-2 py-1 rounded-full ${roleBadge[u.role]}`}>
                      {ROLES.find(r => r.value === u.role)?.label ?? u.role}
                    </span>
                  </td>
                  <td className="p-4">
                    {u.is_locked ? (
                      <span className="text-xs text-[#6B7785]">Superuser (locked)</span>
                    ) : (
                      <select
                        value={u.role}
                        disabled={savingId === u.id}
                        onChange={e => changeRole(u, e.target.value)}
                        className="border border-[#1C2541]/15 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-[#D4A857] transition disabled:opacity-50"
                      >
                        {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                      </select>
                    )}
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>

      {visible < filtered.length && (
        <button
          onClick={() => setVisible(v => v + PAGE_SIZE)}
          className="mt-4 px-4 py-2 border border-[#1C2541]/15 text-[#1C2541] rounded-lg text-sm font-semibold hover:bg-[#FAF6EE] transition"
        >
          Show more ({filtered.length - visible} remaining)
        </button>
      )}
    </div>
  );
}

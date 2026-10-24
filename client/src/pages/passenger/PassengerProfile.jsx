import { useState } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../../hooks/useAuth';
import { authAPI } from '../../services/authService';

const PassengerProfile = () => {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState({ firstName: user?.firstName || '', lastName: user?.lastName || '', phone: user?.phone || '', address: user?.address || '' });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await authAPI.updateMe(profile);
      updateUser(res.data.user);
      toast.success('Profile updated successfully.');
    } catch (err) { toast.error(err.message); }
    finally { setSavingProfile(false); }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirm) { toast.error('New passwords do not match.'); return; }
    setSavingPassword(true);
    try {
      await authAPI.changePassword({ currentPassword: passwords.currentPassword, newPassword: passwords.newPassword });
      toast.success('Password changed successfully.');
      setPasswords({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) { toast.error(err.message); }
    finally { setSavingPassword(false); }
  };

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Profile</h1>
          <p className="page-subtitle">Manage your account information</p>
        </div>
      </div>

      {/* Profile Card */}
      <div className="card p-4 mb-4">
        <div className="d-flex align-items-center gap-3 mb-4">
          <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold"
            style={{ width: 64, height: 64, background: 'var(--color-primary)', color: 'white', fontSize: '1.5rem' }}>
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <div>
            <div className="fw-bold fs-5">{user?.firstName} {user?.lastName}</div>
            <div className="text-muted small">{user?.email}</div>
            <span className="badge bg-primary mt-1">{user?.role}</span>
          </div>
        </div>

        <form onSubmit={handleProfileSave}>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">First Name</label>
              <input className="form-control" value={profile.firstName}
                onChange={(e) => setProfile({ ...profile, firstName: e.target.value })} required />
            </div>
            <div className="col-md-6">
              <label className="form-label">Last Name</label>
              <input className="form-control" value={profile.lastName}
                onChange={(e) => setProfile({ ...profile, lastName: e.target.value })} required />
            </div>
            <div className="col-md-6">
              <label className="form-label">Email <span className="text-muted small">(cannot change)</span></label>
              <input className="form-control" value={user?.email} disabled />
            </div>
            <div className="col-md-6">
              <label className="form-label">Phone</label>
              <input className="form-control" value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })} placeholder="+251 9XX XXX XXXX" />
            </div>
            <div className="col-12">
              <label className="form-label">Address</label>
              <input className="form-control" value={profile.address}
                onChange={(e) => setProfile({ ...profile, address: e.target.value })} placeholder="Your address" />
            </div>
          </div>
          <button type="submit" className="btn btn-primary mt-3 px-4" disabled={savingProfile}>
            {savingProfile ? <span className="spinner-border spinner-border-sm me-2" /> : null}
            Save Changes
          </button>
        </form>
      </div>

      {/* Change Password */}
      <div className="card p-4">
        <h6 className="fw-bold mb-3"><i className="bi bi-lock me-2" />Change Password</h6>
        <form onSubmit={handlePasswordChange}>
          <div className="row g-3">
            <div className="col-12">
              <label className="form-label">Current Password</label>
              <input type="password" className="form-control" value={passwords.currentPassword}
                onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })} required />
            </div>
            <div className="col-md-6">
              <label className="form-label">New Password</label>
              <input type="password" className="form-control" value={passwords.newPassword}
                onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                required minLength={8} placeholder="Min. 8 chars, 1 uppercase, 1 number" />
            </div>
            <div className="col-md-6">
              <label className="form-label">Confirm New Password</label>
              <input type="password" className="form-control" value={passwords.confirm}
                onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })} required />
            </div>
          </div>
          <button type="submit" className="btn btn-outline-primary mt-3 px-4" disabled={savingPassword}>
            {savingPassword ? <span className="spinner-border spinner-border-sm me-2" /> : null}
            Change Password
          </button>
        </form>
      </div>
    </div>
  );
};

export default PassengerProfile;

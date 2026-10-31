import React, { useState, useEffect } from 'react';
import { X, Key, Shield, Check } from 'lucide-react';
import { fetchConfig, updateConfig } from '../services/api';

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ConfigModal: React.FC<ConfigModalProps> = ({ isOpen, onClose }) => {
  const [region, setRegion] = useState('us-east-1');
  const [accessKey, setAccessKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [hasKeys, setHasKeys] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchConfig().then(data => {
        setRegion(data.aws_region || 'us-east-1');
        setAccessKey(data.aws_access_key || '');
        setHasKeys(data.has_aws_keys);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateConfig({
      aws_region: region,
      aws_access_key: accessKey,
      aws_secret_key: secretKey,
    });
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Key size={20} color="#38bdf8" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>AWS Cloud Credentials & Settings</h3>
          </div>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '1.25rem' }}>
            Configure your AWS credentials for <strong>Live AWS Execution Mode</strong>. If you are running in <strong>Simulation / Demo Mode</strong>, no AWS credentials are required!
          </p>

          <div className="form-group">
            <label className="form-label">Default AWS Region</label>
            <select className="form-select" value={region} onChange={(e) => setRegion(e.target.value)}>
              <option value="us-east-1">US East (N. Virginia) - us-east-1</option>
              <option value="us-west-2">US West (Oregon) - us-west-2</option>
              <option value="eu-west-1">EU (Ireland) - eu-west-1</option>
              <option value="ap-south-1">Asia Pacific (Mumbai) - ap-south-1</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">AWS Access Key ID</label>
            <input
              type="text"
              className="form-input"
              placeholder="AKIAIOSFODNN7EXAMPLE"
              value={accessKey}
              onChange={(e) => setAccessKey(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">AWS Secret Access Key</label>
            <input
              type="password"
              className="form-input"
              placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
            />
          </div>

          <div style={{
            background: 'rgba(56, 189, 248, 0.08)',
            border: '1px solid rgba(56, 189, 248, 0.2)',
            borderRadius: '8px',
            padding: '0.75rem 1rem',
            marginBottom: '1.5rem',
            fontSize: '0.8rem',
            color: '#cbd5e1',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem'
          }}>
            <Shield size={16} color="#38bdf8" />
            <span>Keys are securely stored in the local FastAPI orchestrator environment memory only.</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" style={{ minWidth: '130px' }}>
              {saved ? (
                <>
                  <Check size={16} color="#34d399" />
                  <span>Saved!</span>
                </>
              ) : (
                <span>Save Credentials</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

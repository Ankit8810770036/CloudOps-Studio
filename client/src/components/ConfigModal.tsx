import React, { useState, useEffect } from 'react';
import { X, Key, Shield, Check, AlertTriangle, AlertCircle } from 'lucide-react';
import { fetchConfig, updateConfig } from '../services/api';

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLiveModeRequired?: boolean;
  onSuccess?: () => void | Promise<void>;
}

export const ConfigModal: React.FC<ConfigModalProps> = ({
  isOpen,
  onClose,
  isLiveModeRequired = false,
  onSuccess,
}) => {
  const [region, setRegion] = useState('ap-south-1');
  const [accessKey, setAccessKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [hasKeys, setHasKeys] = useState(false);
  const [saved, setSaved] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleClose = () => {
    setValidationError(null);
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      fetchConfig()
        .then(data => {
          setRegion(data.aws_region || 'ap-south-1');
          setAccessKey(data.aws_access_key || '');
          setHasKeys(data.has_aws_keys);
        })
        .catch(err => {
          console.error('Failed to load cloud config', err);
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAccess = accessKey.trim();
    const cleanSecret = secretKey.trim();

    if (isLiveModeRequired || cleanAccess || cleanSecret) {
      if (!cleanAccess) {
        setValidationError('AWS Access Key ID is required to switch to Live Mode.');
        return;
      }
      if (cleanAccess === 'AKIAIOSFODNN7EXAMPLE') {
        setValidationError('Please enter your actual AWS Access Key ID (not the sample placeholder).');
        return;
      }
      if (!cleanSecret && !hasKeys) {
        setValidationError('AWS Secret Access Key is required to switch to Live Mode.');
        return;
      }
    }

    setValidationError(null);
    try {
      await updateConfig({
        aws_region: region,
        aws_access_key: cleanAccess,
        ...(cleanSecret ? { aws_secret_key: cleanSecret } : {})
      });
      setSaved(true);
      if (onSuccess) {
        await onSuccess();
      }
      setTimeout(() => {
        setSaved(false);
        onClose();
      }, 1000);
    } catch (err: any) {
      setValidationError(err.message || 'Failed to update AWS credentials');
    }
  };

  return (
    <div className="modal-overlay" onClick={handleClose} onWheel={(e) => e.stopPropagation()}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Key size={22} color="var(--aws-orange)" />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>AWS Cloud Credentials & Settings</h3>
            {hasKeys && (
              <span style={{ fontSize: '0.72rem', color: 'var(--status-success)', border: '1px solid var(--status-success)', padding: '0.15rem 0.45rem', borderRadius: 4, fontWeight: 700 }}>
                Active
              </span>
            )}
          </div>
          <button className="close-btn" onClick={handleClose}><X size={20} /></button>
        </div>

        {/* Live Mode Requirement Prompt Banner */}
        {isLiveModeRequired && (
          <div style={{
            background: 'rgba(236, 114, 17, 0.12)',
            border: '1px solid var(--aws-orange)',
            borderRadius: '8px',
            padding: '0.85rem 1rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.65rem'
          }}>
            <AlertTriangle size={18} color="var(--aws-orange)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)', lineHeight: 1.45 }}>
              <strong>AWS Cloud Credentials Required for Live Mode:</strong>
              <div style={{ color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                You are switching from <strong>SIMULATION MODE</strong> to <strong>LIVE MODE</strong>. Real AWS provisioning requires an active AWS Region, Access Key ID, and Secret Access Key. Please fill or verify these credentials below to proceed.
              </div>
            </div>
          </div>
        )}

        {/* Inline Validation Error */}
        {validationError && (
          <div style={{
            background: 'var(--status-danger-bg)',
            border: '1px solid var(--status-danger)',
            color: 'var(--status-danger)',
            borderRadius: '6px',
            padding: '0.65rem 0.85rem',
            marginBottom: '1rem',
            fontSize: '0.82rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <AlertCircle size={15} style={{ flexShrink: 0 }} />
            <span>{validationError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            Configure your AWS credentials for <strong>Live AWS Execution Mode</strong>. If you are running in <strong>Simulation / Demo Mode</strong>, no AWS credentials are required!
          </p>

          <div className="form-group">
            <label className="form-label">Default AWS Region</label>
            <select className="form-select" value={region} onChange={(e) => setRegion(e.target.value)}>
              <option value="ap-south-1">Asia Pacific (Mumbai) - ap-south-1</option>
              <option value="us-east-1">US East (N. Virginia) - us-east-1</option>
              <option value="us-west-2">US West (Oregon) - us-west-2</option>
              <option value="eu-west-1">EU (Ireland) - eu-west-1</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">AWS Access Key ID</label>
            <input
              type="text"
              className="form-input"
              placeholder="AKIAIOSFODNN7EXAMPLE"
              value={accessKey}
              onChange={(e) => {
                setAccessKey(e.target.value);
                if (validationError) setValidationError(null);
              }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">AWS Secret Access Key</label>
            <input
              type="password"
              className="form-input"
              placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
              value={secretKey}
              onChange={(e) => {
                setSecretKey(e.target.value);
                if (validationError) setValidationError(null);
              }}
            />
          </div>

          <div style={{
            background: 'var(--bg-card-subtle)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: '0.85rem 1.1rem',
            marginBottom: '1.5rem',
            fontSize: '0.82rem',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem'
          }}>
            <Shield size={18} color="var(--aws-blue)" />
            <span>Keys are securely stored in the local FastAPI orchestrator environment memory only.</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button type="button" className="btn-secondary" onClick={handleClose}>Cancel</button>
            <button type="submit" className="btn-primary" style={{ minWidth: '150px' }}>
              {saved ? (
                <>
                  <Check size={16} color="#FFFFFF" />
                  <span>{isLiveModeRequired ? 'Saved & Activated!' : 'Saved!'}</span>
                </>
              ) : (
                <span>{isLiveModeRequired ? 'Save & Switch to Live Mode' : 'Save Credentials'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


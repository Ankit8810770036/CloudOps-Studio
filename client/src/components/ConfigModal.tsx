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
    setSecretKey('');
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
      setSecretKey('');
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
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>
                {isLiveModeRequired ? 'Cannot Switch to Live Mode: AWS Credentials Required' : 'AWS Cloud Credentials & Settings'}
              </h3>
              {isLiveModeRequired ? (
                <div style={{ fontSize: '0.73rem', color: 'var(--aws-orange)', fontWeight: 600, marginTop: '2px' }}>
                  Action Required: Configure AWS credentials to enable live cloud deployment
                </div>
              ) : hasKeys ? (
                <span style={{ fontSize: '0.72rem', color: 'var(--status-success)', border: '1px solid var(--status-success)', padding: '0.1rem 0.4rem', borderRadius: 4, fontWeight: 700 }}>
                  Active Credentials Configured
                </span>
              ) : null}
            </div>
          </div>
          <button className="close-btn" onClick={handleClose}><X size={20} /></button>
        </div>

        {/* Live Mode Requirement Prompt Banner */}
        {isLiveModeRequired && (
          <div style={{
            background: 'rgba(236, 114, 17, 0.12)',
            border: '1.5px solid var(--aws-orange)',
            borderRadius: '8px',
            padding: '0.95rem 1.1rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem'
          }}>
            <AlertTriangle size={20} color="var(--aws-orange)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ fontSize: '0.83rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
              <div style={{ fontWeight: 800, color: 'var(--aws-orange)', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                Why were you not able to switch to Live Mode?
              </div>
              <p style={{ margin: '0 0 0.5rem 0', color: 'var(--text-muted)' }}>
                You requested to switch to <strong>LIVE AWS CLOUD MODE</strong>, but your cloud credentials have not been configured yet. Without valid credentials, the orchestrator cannot authenticate with AWS EC2 or create cloud resources.
              </p>
              <div style={{ background: 'var(--bg-card)', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontWeight: 700, fontSize: '0.76rem', color: 'var(--text-primary)', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Please fill in these 3 required settings below:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.78rem' }}>
                  <div>• <strong>Default AWS Region:</strong> Asia Pacific (Mumbai) - <code>ap-south-1</code></div>
                  <div>• <strong>AWS Access Key ID:</strong> Your 20-character AWS key (not the sample placeholder)</div>
                  <div>• <strong>AWS Secret Access Key:</strong> Your private AWS secret key</div>
                </div>
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


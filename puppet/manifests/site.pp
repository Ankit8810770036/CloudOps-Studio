# Puppet Site Manifest for DevOps Cloud Infrastructure
# Enforces system hardening, baseline packages, compliance banners, and monitoring agents

node default {
  # 1. Baseline Packages
  $required_packages = ['curl', 'wget', 'htop', 'ufw', 'fail2ban', 'nagios-nrpe-server', 'monitoring-plugins']

  package { $required_packages:
    ensure => present,
  }

  # 2. Enforce System MOTD & Security Banner (Configuration Drift Protection)
  file { '/etc/motd':
    ensure  => file,
    owner   => 'root',
    group   => 'root',
    mode    => '0644',
    content => @(BANNER)
      ===============================================================
       DEVOPS AUTOMATED CLOUD INFRASTRUCTURE - NODE COMPLIANCE
       Managed By: Puppet Configuration Enforcement Engine
       Status    : Active & Hardened
       Policy    : Drift Detection & Automated Remediation
      ===============================================================
    BANNER
  }

  file { '/etc/issue.net':
    ensure  => file,
    owner   => 'root',
    group   => 'root',
    mode    => '0644',
    content => "Authorized Access Only - All activities are monitored by Nagios Core.\n",
  }

  # 3. Enforce SSH Security Hardening
  file { '/etc/ssh/sshd_config.d/99-hardened.conf':
    ensure  => file,
    owner   => 'root',
    group   => 'root',
    mode    => '0644',
    content => @(SSHCONF)
      # Hardened by Puppet Configuration Management
      MaxAuthTries 4
      X11Forwarding no
      ClientAliveInterval 300
      ClientAliveCountMax 2
    SSHCONF
    notify  => Service['ssh'],
  }

  service { 'ssh':
    ensure     => running,
    enable     => true,
    hasrestart => true,
  }

  # 4. Enforce Web Root Directory Permissions & Ownership (Anti-Tampering)
  file { '/var/www/devops_app':
    ensure  => directory,
    owner   => 'www-data',
    group   => 'www-data',
    mode    => '0755',
    recurse => false,
  }

  # 5. Enforce Nagios NRPE Monitoring Agent Configuration
  file { '/etc/nagios/nrpe.cfg':
    ensure  => file,
    owner   => 'root',
    group   => 'root',
    mode    => '0644',
    content => @(NRPECONF)
      # NRPE Config Managed by Puppet
      server_port=5666
      allowed_hosts=127.0.0.1,::1
      dont_blame_nrpe=0
      command[check_users]=/usr/lib/nagios/plugins/check_users -w 5 -c 10
      command[check_load]=/usr/lib/nagios/plugins/check_load -r -w .80,.75,.70 -c .95,.90,.85
      command[check_disk]=/usr/lib/nagios/plugins/check_disk -w 20% -c 10% -p /
      command[check_total_procs]=/usr/lib/nagios/plugins/check_procs -w 150 -c 200
      command[check_http]=/usr/lib/nagios/plugins/check_http -H 127.0.0.1 -p 80
    NRPECONF
    require => Package['nagios-nrpe-server'],
    notify  => Service['nagios-nrpe-server'],
  }

  service { 'nagios-nrpe-server':
    ensure     => running,
    enable     => true,
    hasrestart => true,
    require    => Package['nagios-nrpe-server'],
  }

  # 6. UFW Firewall Baseline Rules
  exec { 'enable_ufw':
    command => '/usr/sbin/ufw --force enable',
    unless  => '/usr/sbin/ufw status | grep -q "Status: active"',
    require => Package['ufw'],
  }
}

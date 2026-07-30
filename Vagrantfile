# -*- mode: ruby -*-
# vi: set ft=ruby :

# VirtualBox is the only supported provider. libvirt/KVM is deliberately not
# used here -- it cannot share AMD-V with VirtualBox on the same host, and the
# other Forail environments are VirtualBox.
ENV["VAGRANT_DEFAULT_PROVIDER"] ||= "virtualbox"

Vagrant.configure("2") do |config|
  config.vm.box = "bento/ubuntu-24.04"
  config.vm.hostname = "forail-frontend"

  # Frontend dev ports
  config.vm.network "forwarded_port", guest: 3000, host: 3000  # Vite dev server
  config.vm.network "forwarded_port", guest: 4173, host: 4173  # Vite preview

  config.vm.network "private_network", ip: "192.168.56.21"

  config.vm.provider "virtualbox" do |vb|
    vb.name = "forail-frontend"
    vb.memory = "4096"
    vb.cpus = 2
  end

  config.vm.synced_folder ".", "/forail-frontend", type: "rsync",
    rsync__exclude: [".git/", "node_modules/", "build/", "dist/", "*.pyc", "__pycache__/"]

  config.vm.provision "shell", inline: <<-SHELL
    set -euo pipefail

    echo "============================================"
    echo " Forail Frontend - Ubuntu 24.04"
    echo " Provisioning..."
    echo "============================================"

    export DEBIAN_FRONTEND=noninteractive

    # --- System packages ---
    echo "[1/3] Installing system packages..."
    apt-get update
    apt-get install -y \
        git curl wget gnupg lsb-release ca-certificates \
        build-essential

    # --- Docker ---
    echo "[2/3] Installing Docker..."
    if ! command -v docker &> /dev/null; then
        curl -fsSL https://get.docker.com | sh
    fi
    systemctl enable docker --now
    usermod -aG docker vagrant

    apt-get install -y docker-compose-plugin 2>/dev/null || true

    if ! command -v docker-compose &> /dev/null; then
        COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep -oP '"tag_name": "\\K[^"]+')
        curl -SL "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-linux-x86_64" \
            -o /usr/local/bin/docker-compose
        chmod +x /usr/local/bin/docker-compose
    fi

    # --- Node.js 20 ---
    echo "[3/3] Installing Node.js 20..."
    if ! command -v node &> /dev/null; then
        curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
        apt-get install -y nodejs
    fi

    # --- Workspace setup ---
    ln -sf /forail-frontend /home/vagrant/forail-frontend

    cat >> /home/vagrant/.bashrc << 'BASHRC'

# Forail Frontend Environment
export FORAIL_FRONTEND=/forail-frontend
alias forail-dev='cd /forail-frontend && npm run dev'
alias forail-build='cd /forail-frontend && npm run build'
alias forail-test='cd /forail-frontend && npm test'
alias forail-lint='cd /forail-frontend && npm run lint'
BASHRC

    chown -R vagrant:vagrant /home/vagrant

    echo ""
    echo "============================================"
    echo " Forail Frontend - Ready"
    echo "============================================"
    echo ""
    echo " Versions:"
    echo "   OS:      $(lsb_release -ds)"
    echo "   Node.js: $(node --version 2>&1)"
    echo "   npm:     $(npm --version 2>&1)"
    echo "   Docker:  $(docker --version 2>&1)"
    echo ""
    echo " Quick start (vagrant ssh):"
    echo "   cd /forail-frontend && npm install && npm run dev"
    echo ""
    echo " Access: http://192.168.56.21:3000"
    echo "============================================"
  SHELL
end

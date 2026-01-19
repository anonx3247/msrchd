FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    sudo bash coreutils findutils grep sed gawk \
    ca-certificates curl wget git vim nano less fd-find \
    htop tmux screen psmisc procps \
    build-essential gcc g++ make cmake \
    python3 python3-pip python3-venv python3-dev \
    nodejs npm \
    netcat-openbsd iputils-ping dnsutils openssh-client \
    zip unzip tar gzip \
    jq xmlstarlet \
    ripgrep \
    afl++ gdb valgrind ltrace strace \
    qemu-system

RUN git clone https://github.com/radareorg/radare2 && cd radare2 && sys/install.sh

RUN groupadd -g 1001 agent && \
    useradd -u 1001 -g 1001 -m -s /bin/bash agent && \
    echo 'agent ALL=(ALL) NOPASSWD:ALL' >> /etc/sudoers

RUN mkdir -p /home/agent/.ssh && \
    chown -R agent:agent /home/agent/.ssh && \
    chmod 700 /home/agent/.ssh

# Create Python venv in a template location (will be copied to home on first run)
RUN python3 -m venv /etc/skel-agent-venv && \
    /etc/skel-agent-venv/bin/pip install --upgrade pip && \
    /etc/skel-agent-venv/bin/pip install \
    numpy pandas matplotlib seaborn plotly \
    requests httpx beautifulsoup4 \
    frida-tools frida r2pipe angr

# Create home directory template with dotfiles
RUN mkdir -p /etc/skel-agent/.ssh && \
    ssh-keyscan github.com > /etc/skel-agent/.ssh/known_hosts && \
    echo 'export PATH="/home/agent/.venv/bin:$PATH"' >> /etc/skel-agent/.bashrc && \
    echo 'export PYTHONPATH="/home/agent:$PYTHONPATH"' >> /etc/skel-agent/.bashrc && \
    echo 'alias ll="ls -la"' >> /etc/skel-agent/.bashrc && \
    echo 'alias la="ls -la"' >> /etc/skel-agent/.bashrc && \
    echo 'cd /home/agent' >> /etc/skel-agent/.bashrc && \
    cp /etc/skel-agent/.bashrc /etc/skel-agent/.bash_profile && \
    chown -R agent:agent /etc/skel-agent /etc/skel-agent-venv

# Add entrypoint script
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

USER agent
WORKDIR /home/agent

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["/bin/bash"]

LABEL maintainer="agent-computer" \
      description="Secure sandbox environment for AI agents (security profile)" \
      version="1.2"

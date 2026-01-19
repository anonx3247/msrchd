# Dockerfile for agent-computer:arc-agi
# Provides a secure, isolated environment for AI agents to solve ARC-AGI problems

FROM ubuntu:24.04

# Prevent interactive prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Install essential packages and development tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    # Core utilities
    sudo bash coreutils findutils grep sed gawk \
    ca-certificates vim nano less fd-find \
    # Process and system tools
    htop tmux screen psmisc procps \
    # Python ecosystem
    python3 python3-pip python3-venv python3-dev \
    # Archive tools
    zip unzip tar gzip \
    # Text processing
    jq xmlstarlet \
    # Search Tools
    ripgrep

# Create non-root user 'agent' with uid 1001
RUN groupadd -g 1001 agent && \
    useradd -u 1001 -g 1001 -m -s /bin/bash agent && \
    # Give agent sudo access (for permissive mode)
    echo 'agent ALL=(ALL) NOPASSWD:ALL' >> /etc/sudoers

# Create Python venv in a template location (will be copied to home on first run)
RUN python3 -m venv /etc/skel-agent-venv && \
    /etc/skel-agent-venv/bin/pip install --upgrade pip && \
    /etc/skel-agent-venv/bin/pip install \
    numpy pandas matplotlib seaborn plotly

# Create home directory template with dotfiles
RUN mkdir -p /etc/skel-agent && \
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

# Metadata
LABEL maintainer="agent-computer" \
    description="Secure sandbox environment for AI agents solving ARC-AGI problems" \
    version="1.2"

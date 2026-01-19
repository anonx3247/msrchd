FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    ELAN_HOME=/opt/lean/.elan \
    PATH="/opt/lean/.elan/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"

RUN apt-get update && apt-get install -y --no-install-recommends \
    sudo bash coreutils findutils grep sed gawk \
    ca-certificates curl wget git vim nano less fd-find \
    python3 python3-pip python3-venv python3-dev \
    jq xmlstarlet \
    ripgrep

RUN groupadd -g 1001 agent && \
    useradd -u 1001 -g 1001 -m -s /bin/bash agent && \
    echo 'agent ALL=(ALL) NOPASSWD:ALL' >> /etc/sudoers

# Create /opt/lean directory owned by agent
RUN mkdir -p /opt/lean && chown agent:agent /opt/lean

# Configure git globally
RUN git config --global --add safe.directory '*'

# Switch to agent user for all Lean installation (avoids massive chown)
USER agent
WORKDIR /opt/lean

# Install elan (Lean version manager)
RUN curl https://elan.lean-lang.org/elan-init.sh -sSf | sh -s -- -y --no-modify-path

# Create Math project with mathlib
RUN cd /opt/lean && \
    lake +leanprover-community/mathlib4:lean-toolchain new Math math && \
    cd Math && lake exe cache get

# Build Math project
RUN cd /opt/lean/Math && lake build

# Install Lean REPL
RUN cd /opt/lean && \
    git clone https://github.com/leanprover-community/repl.git && \
    cd repl && \
    cp /opt/lean/Math/lean-toolchain . && \
    lake build

# Create symlinks (needs root)
USER root
RUN ln -s /opt/lean/.elan/bin/lake /usr/local/bin/lake && \
    ln -s /opt/lean/.elan/bin/lean /usr/local/bin/lean && \
    ln -s /opt/lean/.elan/bin/elan /usr/local/bin/elan && \
    ln -s /opt/lean/repl/.lake/build/bin/repl /usr/local/bin/repl

USER agent
WORKDIR /home/agent

RUN python3 -m venv /home/agent/.venv && \
    /home/agent/.venv/bin/pip install --upgrade pip && \
    /home/agent/.venv/bin/pip install \
    numpy pandas matplotlib seaborn plotly

# Set up environment
RUN echo 'export ELAN_HOME=/opt/lean/.elan' >> /home/agent/.bashrc && \
    echo 'export PATH="/opt/lean/.elan/bin:/home/agent/.venv/bin:$PATH"' >> /home/agent/.bashrc && \
    echo 'export PYTHONPATH="/home/agent:$PYTHONPATH"' >> /home/agent/.bashrc && \
    echo 'alias ll="ls -la"' >> /home/agent/.bashrc && \
    echo 'alias la="ls -la"' >> /home/agent/.bashrc && \
    echo 'cd /home/agent' >> /home/agent/.bashrc

CMD ["/bin/bash"]

LABEL maintainer="agent-computer" \
    description="Secure sandbox environment for AI agents with Lean 4 and Mathlib" \
    version="1.5"

#!/bin/bash
# Shared entrypoint script to initialize home directory from template
# This copies essential dotfiles and venv from templates to /home/agent
# when the volume is mounted and these files don't exist yet

# Copy template dotfiles if they don't exist
if [ -d /etc/skel-agent ]; then
    for file in /etc/skel-agent/.*; do
        filename=$(basename "$file")
        # Skip . and ..
        if [ "$filename" = "." ] || [ "$filename" = ".." ]; then
            continue
        fi
        # Copy if doesn't exist in home
        if [ ! -e "/home/agent/$filename" ]; then
            cp -r "$file" "/home/agent/$filename"
        fi
    done
fi

# Copy .venv if it doesn't exist (for Python packages)
if [ ! -d /home/agent/.venv ] && [ -d /etc/skel-agent-venv ]; then
    cp -r /etc/skel-agent-venv /home/agent/.venv
fi

# Execute the command passed to the container
exec "$@"

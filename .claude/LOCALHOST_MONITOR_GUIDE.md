# Localhost Monitor - Usage Guide

## Overview

The **localhost-monitor** subagent provides real-time monitoring and dashboard views of your local development services including Docker containers, databases, LLM/AI services, and system resources.

## Components

### 1. Subagent (`localhost-monitor`)
**Location:** `.claude/agents/localhost-monitor.md`

A specialized Claude Code subagent that automatically activates when you ask about localhost services.

### 2. Helper Script (`localhost-monitor.sh`)
**Location:** `.claude/scripts/localhost-monitor.sh`

Standalone bash script for quick monitoring outside of Claude Code.

---

## Using the Subagent

The subagent activates automatically when you ask questions about your localhost services.

### Example Queries

```
"Show localhost dashboard"
→ Displays comprehensive service overview

"Check Bifrost status"
→ Detailed status of Bifrost gateway and dependencies

"What's using port 8000?"
→ Identifies service and provides details

"Is vLLM running?"
→ Checks vLLM service status and health

"Show GPU usage"
→ Displays NVIDIA GPU utilization

"Which databases are up?"
→ Lists all database services with connectivity status

"Check all LLM services"
→ Status table for Bifrost, vLLM, Ollama, TensorZero, LiteLLM
```

### Activation Keywords

The subagent automatically activates when you use phrases like:
- "localhost", "local services"
- "dashboard", "service status"
- "port", "what's using"
- "docker containers", "container status"
- "database", "postgres", "redis", "qdrant"
- "bifrost", "vllm", "ollama", "tensorzero", "litellm"
- "GPU", "nvidia", "resource usage"

---

## Using the Standalone Script

### Quick Dashboard

```bash
# Show full dashboard
./.claude/scripts/localhost-monitor.sh dashboard

# Or just run without arguments
./.claude/scripts/localhost-monitor.sh
```

**Output includes:**
- LLM/AI services status (Bifrost, vLLM, Ollama, TensorZero, LiteLLM)
- Database connectivity (PostgreSQL, Redis, Qdrant)
- Resource usage (CPU, memory per container)
- GPU utilization (if NVIDIA GPU present)
- Quick action commands

### Check Specific Service

```bash
# Check if Bifrost is running
./.claude/scripts/localhost-monitor.sh check bifrost

# Check vLLM
./.claude/scripts/localhost-monitor.sh check vllm

# Check any docker container
./.claude/scripts/localhost-monitor.sh check <container-name>
```

### Check Port Usage

```bash
# Check what's using port 8081
./.claude/scripts/localhost-monitor.sh port 8081

# Check port 8000
./.claude/scripts/localhost-monitor.sh port 8000
```

---

## Monitored Services

### LLM/AI Services

| Service | Port | Health Endpoint |
|---------|------|-----------------|
| Bifrost Gateway | 8081 | http://127.0.0.1:8081/metrics |
| vLLM (Qwen2.5-Coder) | 8000 | http://localhost:8000/health |
| Ollama | 11434 | http://localhost:11434/api/tags |
| TensorZero Gateway | 3000 | http://localhost:3000/health |
| TensorZero UI | 4001 | http://localhost:4001 |
| LiteLLM Proxy | 4000 | http://localhost:4000/health |
| Nomic Embedding | 8082 | http://localhost:8082/health |
| Code-RAG Query | 8001 | http://localhost:8001/health |
| Code-RAG Embedding | 8002 | http://localhost:8002/health |

### Database Services

| Service | Port(s) | Type |
|---------|---------|------|
| Bifrost PostgreSQL | 5434 | PostgreSQL 17 |
| LiteLLM PostgreSQL | 5432 | PostgreSQL 16 |
| LobeChat PostgreSQL | 5432 | PostgreSQL + pgvector |
| Bifrost Redis | 6380 | Redis Stack |
| Bifrost RedisInsight | 8004 | Redis UI |
| LobeChat Redis | 6379 | Redis 7 |
| Bifrost Qdrant | 6335, 6336 | Vector DB v1.16 |
| Code-RAG Qdrant | 6333, 6334 | Vector DB latest |

### Development Services

| Service | Port | Type |
|---------|------|------|
| n8n Workflow | 5678 | Automation |
| LobeChat Web | 3210 | Web App |
| Grafana | 3000 | Monitoring |
| Prometheus | 9090 | Metrics |
| MinIO Console | 9001 | S3 Storage |

---

## Understanding the Dashboard

### Service Status Indicators

- **✓ Running** = Container is up and running
- **✗ Stopped** = Container is not running
- **⚠ Degraded** = Running but health check failing

### Health Check Results

- **✓ Healthy** = HTTP endpoint responding correctly
- **⚠ Degraded** = Port listening but endpoint not responding
- **✗ Failed** = Connection refused or timeout
- **- N/A** = Service stopped, health check not applicable

### Resource Metrics

- **CPU %** = Percentage of CPU used by container
- **Memory** = Current / Limit (e.g., "450MB / 16GB")
- **Network I/O** = Download / Upload traffic

### GPU Metrics

- **Utilization** = Percentage of GPU compute used
- **Memory Used** = VRAM used / Total VRAM
- **Temperature** = Current GPU temperature in Celsius

---

## Quick Actions

### Starting Services

```bash
# Start Bifrost
cd ~/Development/bifrost && sudo docker-compose up -d

# Start vLLM
cd ~/Development/llm_servers/vllm && sudo docker-compose up -d

# Start Ollama
cd ~/Development/ollama-devstral && sudo docker-compose up -d

# Start TensorZero
cd ~/Development/tensorzero/examples/quickstart && sudo docker-compose up -d

# Start LiteLLM
cd ~/Development/litellm && sudo docker-compose up -d
```

### Viewing Logs

```bash
# View Bifrost logs (last 50 lines)
sudo docker logs --tail 50 bifrost-gateway

# Follow logs in real-time
sudo docker logs -f bifrost-gateway

# View vLLM logs
sudo docker logs --tail 50 vllm-qwen
```

### Restarting Services

```bash
# Restart Bifrost
cd ~/Development/bifrost && sudo docker-compose restart

# Restart specific service
cd ~/Development/bifrost && sudo docker-compose restart bifrost-gateway

# Restart vLLM
cd ~/Development/llm_servers/vllm && sudo docker-compose restart
```

### Stopping Services

```bash
# Stop Bifrost
cd ~/Development/bifrost && sudo docker-compose stop

# Stop all services
cd ~/Development/bifrost && sudo docker-compose down

# Stop but keep volumes
cd ~/Development/bifrost && sudo docker-compose down --volumes
```

---

## Troubleshooting

### "Port already in use"

```bash
# Check what's using the port
./.claude/scripts/localhost-monitor.sh port 8081

# Or manually
ss -tulpn | grep :8081
sudo lsof -i :8081
```

### "Health check failing"

1. Check if the service is actually running
2. Verify the health endpoint URL is correct
3. Check service logs for errors
4. Ensure dependencies (database, cache) are running

```bash
# Example: Bifrost health check failing
sudo docker logs bifrost-gateway

# Check Bifrost dependencies
./.claude/scripts/localhost-monitor.sh check bifrost-postgres
./.claude/scripts/localhost-monitor.sh check bifrost-redis
```

### "Container won't start"

```bash
# Check container status and errors
sudo docker ps -a | grep <container-name>

# View startup logs
sudo docker logs <container-name>

# Check docker-compose configuration
cd <service-directory>
sudo docker-compose config
```

### "GPU not detected"

```bash
# Check if nvidia-smi is available
nvidia-smi

# Check Docker GPU runtime
sudo docker run --rm --gpus all nvidia/cuda:12.0-base nvidia-smi

# Restart Docker daemon
sudo systemctl restart docker
```

---

## Integration with Claude Code

### Asking for Monitoring

Simply ask Claude Code natural questions:

```
You: "Show me what's running on localhost"
Claude: [Activates localhost-monitor subagent]
        [Displays comprehensive dashboard]

You: "Bifrost isn't responding"
Claude: [Checks Bifrost status, dependencies, logs]
        [Provides diagnostic information and fix suggestions]

You: "I need to free up port 8000"
Claude: [Identifies what's using port 8000]
        [Provides stop command]
```

### Automatic Activation

The subagent activates automatically when:
- You mention service names (Bifrost, vLLM, Ollama, etc.)
- You ask about ports or connectivity
- You request a dashboard or status view
- You troubleshoot service issues

---

## Customization

### Adding New Services

Edit `.claude/agents/localhost-monitor.md` to add monitoring for additional services:

1. Add service to the "Known Service Catalog" table
2. Add health check endpoint if available
3. Update monitoring commands section
4. Add quick action commands

### Changing Port Monitoring

Update the port list in the "Port Usage Check" section:

```bash
# Current monitored ports
ss -tulpn | grep -E ':(8081|8000|11434|3000|4000|5432|5434|6379|6380|6333|6335)'

# Add your custom ports
ss -tulpn | grep -E ':(8081|8000|YOUR_PORT_HERE)'
```

### Customizing Dashboard Layout

The helper script (`.claude/scripts/localhost-monitor.sh`) can be modified:

- Change color scheme (edit color variables at top)
- Adjust table widths (modify printf format strings)
- Add/remove service sections
- Change which metrics are displayed

---

## Advanced Usage

### Scheduling Periodic Checks

Add to crontab for periodic monitoring:

```bash
# Check every 5 minutes and log to file
*/5 * * * * /path/to/.claude/scripts/localhost-monitor.sh dashboard >> /tmp/service-monitor.log 2>&1

# Email on service failure
*/10 * * * * /path/to/.claude/scripts/localhost-monitor.sh | grep "✗" && echo "Service down!" | mail -s "Alert" you@example.com
```

### Integration with Other Tools

```bash
# Export to JSON (requires jq)
sudo docker stats --no-stream --format "{{json .}}" | jq -s .

# Send to monitoring system
./.claude/scripts/localhost-monitor.sh | curl -X POST -d @- https://your-monitoring-system.com/api

# Webhook notification
if ./.claude/scripts/localhost-monitor.sh | grep -q "✗"; then
    curl -X POST https://your-webhook.com/alert -d "Service down"
fi
```

---

## Best Practices

1. **Regular Monitoring**: Run the dashboard periodically to catch issues early
2. **Health Checks**: Verify services respond to health endpoints, not just port checks
3. **Resource Awareness**: Monitor GPU/CPU/memory to prevent resource exhaustion
4. **Log Analysis**: Check logs when health checks fail
5. **Dependency Order**: Start databases before applications that depend on them
6. **Port Management**: Avoid port conflicts by checking before starting new services

---

## Files Created

```
.claude/
├── agents/
│   └── localhost-monitor.md          # Subagent configuration
├── scripts/
│   └── localhost-monitor.sh           # Standalone monitoring script
└── LOCALHOST_MONITOR_GUIDE.md         # This file
```

---

## Support

For issues or questions:

1. Check service logs: `sudo docker logs <container-name>`
2. Verify docker-compose config: `sudo docker-compose config`
3. Ask Claude Code: "Debug my localhost services"
4. Run script manually: `./.claude/scripts/localhost-monitor.sh`

---

**Last Updated:** 2026-01-21
**Version:** 1.0
**Compatible with:** Claude Code, Docker, NVIDIA GPUs

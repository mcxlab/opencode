#!/bin/bash

# Localhost Service Monitor Script
# Monitors Docker containers, databases, LLM services, and system resources
# Can be called by Claude Code localhost-monitor subagent or run standalone

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Unicode symbols
CHECK="✓"
CROSS="✗"
WARN="⚠"

# Function to print section headers
print_header() {
    echo ""
    echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║$(printf "%-79s" "  $1")║${NC}"
    echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

# Function to check if a port is listening
check_port() {
    local port=$1
    ss -tuln | grep -q ":$port " && return 0 || return 1
}

# Function to check HTTP endpoint
check_http() {
    local url=$1
    curl -sf --max-time 2 "$url" > /dev/null 2>&1 && return 0 || return 1
}

# Function to get container uptime
get_uptime() {
    local container=$1
    if sudo docker ps --filter "name=$container" --format "{{.Status}}" 2>/dev/null | grep -q "Up"; then
        sudo docker ps --filter "name=$container" --format "{{.Status}}" | sed 's/Up //'
    else
        echo "Stopped"
    fi
}

# Main dashboard function
show_dashboard() {
    print_header "LOCALHOST SERVICE DASHBOARD"

    # LLM/AI Services
    echo -e "${CYAN}┌─────────────────────────────────────────────────────────────────────────────┐${NC}"
    echo -e "${CYAN}│ LLM/AI SERVICES                                                             │${NC}"
    echo -e "${CYAN}├──────────────────────┬──────┬───────────┬──────────────┬────────────────────┤${NC}"
    printf "${CYAN}│${NC} %-20s ${CYAN}│${NC} %-4s ${CYAN}│${NC} %-9s ${CYAN}│${NC} %-12s ${CYAN}│${NC} %-18s ${CYAN}│${NC}\n" \
           "Service" "Port" "Status" "Health" "Uptime"
    echo -e "${CYAN}├──────────────────────┼──────┼───────────┼──────────────┼────────────────────┤${NC}"

    # Check Bifrost
    if check_port 8081; then
        health=$(check_http "http://127.0.0.1:8081/metrics" && echo "${GREEN}${CHECK} Healthy${NC}" || echo "${YELLOW}${WARN} Degraded${NC}")
        uptime=$(get_uptime "bifrost")
        printf "${CYAN}│${NC} %-20s ${CYAN}│${NC} %-4s ${CYAN}│${NC} ${GREEN}%-9s${NC} ${CYAN}│${NC} %-20s ${CYAN}│${NC} %-18s ${CYAN}│${NC}\n" \
               "Bifrost Gateway" "8081" "${CHECK} Running" "$health" "$uptime"
    else
        printf "${CYAN}│${NC} %-20s ${CYAN}│${NC} %-4s ${CYAN}│${NC} ${RED}%-9s${NC} ${CYAN}│${NC} %-20s ${CYAN}│${NC} %-18s ${CYAN}│${NC}\n" \
               "Bifrost Gateway" "8081" "${CROSS} Stopped" "- N/A" "-"
    fi

    # Check vLLM
    if check_port 8000; then
        health=$(check_http "http://localhost:8000/health" && echo "${GREEN}${CHECK} Healthy${NC}" || echo "${YELLOW}${WARN} Degraded${NC}")
        uptime=$(get_uptime "vllm")
        printf "${CYAN}│${NC} %-20s ${CYAN}│${NC} %-4s ${CYAN}│${NC} ${GREEN}%-9s${NC} ${CYAN}│${NC} %-20s ${CYAN}│${NC} %-18s ${CYAN}│${NC}\n" \
               "vLLM (Qwen2.5)" "8000" "${CHECK} Running" "$health" "$uptime"
    else
        printf "${CYAN}│${NC} %-20s ${CYAN}│${NC} %-4s ${CYAN}│${NC} ${RED}%-9s${NC} ${CYAN}│${NC} %-20s ${CYAN}│${NC} %-18s ${CYAN}│${NC}\n" \
               "vLLM (Qwen2.5)" "8000" "${CROSS} Stopped" "- N/A" "-"
    fi

    # Check Ollama
    if check_port 11434; then
        health=$(check_http "http://localhost:11434/api/tags" && echo "${GREEN}${CHECK} Healthy${NC}" || echo "${YELLOW}${WARN} Degraded${NC}")
        uptime=$(get_uptime "ollama")
        printf "${CYAN}│${NC} %-20s ${CYAN}│${NC} %-4s ${CYAN}│${NC} ${GREEN}%-9s${NC} ${CYAN}│${NC} %-20s ${CYAN}│${NC} %-18s ${CYAN}│${NC}\n" \
               "Ollama" "11434" "${CHECK} Running" "$health" "$uptime"
    else
        printf "${CYAN}│${NC} %-20s ${CYAN}│${NC} %-4s ${CYAN}│${NC} ${RED}%-9s${NC} ${CYAN}│${NC} %-20s ${CYAN}│${NC} %-18s ${CYAN}│${NC}\n" \
               "Ollama" "11434" "${CROSS} Stopped" "- N/A" "-"
    fi

    # Check TensorZero
    if check_port 3000; then
        health=$(check_http "http://localhost:3000/health" && echo "${GREEN}${CHECK} Healthy${NC}" || echo "${YELLOW}${WARN} Degraded${NC}")
        uptime=$(get_uptime "tensorzero")
        printf "${CYAN}│${NC} %-20s ${CYAN}│${NC} %-4s ${CYAN}│${NC} ${GREEN}%-9s${NC} ${CYAN}│${NC} %-20s ${CYAN}│${NC} %-18s ${CYAN}│${NC}\n" \
               "TensorZero Gateway" "3000" "${CHECK} Running" "$health" "$uptime"
    else
        printf "${CYAN}│${NC} %-20s ${CYAN}│${NC} %-4s ${CYAN}│${NC} ${RED}%-9s${NC} ${CYAN}│${NC} %-20s ${CYAN}│${NC} %-18s ${CYAN}│${NC}\n" \
               "TensorZero Gateway" "3000" "${CROSS} Stopped" "- N/A" "-"
    fi

    # Check LiteLLM
    if check_port 4000; then
        health=$(check_http "http://localhost:4000/health" && echo "${GREEN}${CHECK} Healthy${NC}" || echo "${YELLOW}${WARN} Degraded${NC}")
        uptime=$(get_uptime "litellm")
        printf "${CYAN}│${NC} %-20s ${CYAN}│${NC} %-4s ${CYAN}│${NC} ${GREEN}%-9s${NC} ${CYAN}│${NC} %-20s ${CYAN}│${NC} %-18s ${CYAN}│${NC}\n" \
               "LiteLLM Proxy" "4000" "${CHECK} Running" "$health" "$uptime"
    else
        printf "${CYAN}│${NC} %-20s ${CYAN}│${NC} %-4s ${CYAN}│${NC} ${RED}%-9s${NC} ${CYAN}│${NC} %-20s ${CYAN}│${NC} %-18s ${CYAN}│${NC}\n" \
               "LiteLLM Proxy" "4000" "${CROSS} Stopped" "- N/A" "-"
    fi

    echo -e "${CYAN}└──────────────────────┴──────┴───────────┴──────────────┴────────────────────┘${NC}"
    echo ""

    # Database Services
    echo -e "${MAGENTA}┌─────────────────────────────────────────────────────────────────────────────┐${NC}"
    echo -e "${MAGENTA}│ DATABASE SERVICES                                                           │${NC}"
    echo -e "${MAGENTA}├──────────────────────┬──────┬───────────┬──────────────┬────────────────────┤${NC}"
    printf "${MAGENTA}│${NC} %-20s ${MAGENTA}│${NC} %-4s ${MAGENTA}│${NC} %-9s ${MAGENTA}│${NC} %-12s ${MAGENTA}│${NC} %-18s ${MAGENTA}│${NC}\n" \
           "Service" "Port" "Status" "Connectivity" "Type"
    echo -e "${MAGENTA}├──────────────────────┼──────┼───────────┼──────────────┼────────────────────┤${NC}"

    # Check PostgreSQL instances
    if check_port 5434; then
        conn=$(pg_isready -h 127.0.0.1 -p 5434 2>/dev/null && echo "${GREEN}${CHECK} Connected${NC}" || echo "${RED}${CROSS} Failed${NC}")
        printf "${MAGENTA}│${NC} %-20s ${MAGENTA}│${NC} %-4s ${MAGENTA}│${NC} ${GREEN}%-9s${NC} ${MAGENTA}│${NC} %-20s ${MAGENTA}│${NC} %-18s ${MAGENTA}│${NC}\n" \
               "Bifrost PostgreSQL" "5434" "${CHECK} Running" "$conn" "PostgreSQL 17"
    else
        printf "${MAGENTA}│${NC} %-20s ${MAGENTA}│${NC} %-4s ${MAGENTA}│${NC} ${RED}%-9s${NC} ${MAGENTA}│${NC} %-20s ${MAGENTA}│${NC} %-18s ${MAGENTA}│${NC}\n" \
               "Bifrost PostgreSQL" "5434" "${CROSS} Stopped" "- N/A" "PostgreSQL 17"
    fi

    if check_port 5432; then
        conn=$(pg_isready -h 127.0.0.1 -p 5432 2>/dev/null && echo "${GREEN}${CHECK} Connected${NC}" || echo "${RED}${CROSS} Failed${NC}")
        printf "${MAGENTA}│${NC} %-20s ${MAGENTA}│${NC} %-4s ${MAGENTA}│${NC} ${GREEN}%-9s${NC} ${MAGENTA}│${NC} %-20s ${MAGENTA}│${NC} %-18s ${MAGENTA}│${NC}\n" \
               "LiteLLM PostgreSQL" "5432" "${CHECK} Running" "$conn" "PostgreSQL 16"
    else
        printf "${MAGENTA}│${NC} %-20s ${MAGENTA}│${NC} %-4s ${MAGENTA}│${NC} ${RED}%-9s${NC} ${MAGENTA}│${NC} %-20s ${MAGENTA}│${NC} %-18s ${MAGENTA}│${NC}\n" \
               "LiteLLM PostgreSQL" "5432" "${CROSS} Stopped" "- N/A" "PostgreSQL 16"
    fi

    # Check Redis instances
    if check_port 6380; then
        conn=$(redis-cli -h 127.0.0.1 -p 6380 ping 2>/dev/null | grep -q "PONG" && echo "${GREEN}${CHECK} Connected${NC}" || echo "${RED}${CROSS} Failed${NC}")
        printf "${MAGENTA}│${NC} %-20s ${MAGENTA}│${NC} %-4s ${MAGENTA}│${NC} ${GREEN}%-9s${NC} ${MAGENTA}│${NC} %-20s ${MAGENTA}│${NC} %-18s ${MAGENTA}│${NC}\n" \
               "Bifrost Redis" "6380" "${CHECK} Running" "$conn" "Redis Stack"
    else
        printf "${MAGENTA}│${NC} %-20s ${MAGENTA}│${NC} %-4s ${MAGENTA}│${NC} ${RED}%-9s${NC} ${MAGENTA}│${NC} %-20s ${MAGENTA}│${NC} %-18s ${MAGENTA}│${NC}\n" \
               "Bifrost Redis" "6380" "${CROSS} Stopped" "- N/A" "Redis Stack"
    fi

    if check_port 6379; then
        conn=$(redis-cli -h 127.0.0.1 -p 6379 ping 2>/dev/null | grep -q "PONG" && echo "${GREEN}${CHECK} Connected${NC}" || echo "${RED}${CROSS} Failed${NC}")
        printf "${MAGENTA}│${NC} %-20s ${MAGENTA}│${NC} %-4s ${MAGENTA}│${NC} ${GREEN}%-9s${NC} ${MAGENTA}│${NC} %-20s ${MAGENTA}│${NC} %-18s ${MAGENTA}│${NC}\n" \
               "LobeChat Redis" "6379" "${CHECK} Running" "$conn" "Redis 7"
    else
        printf "${MAGENTA}│${NC} %-20s ${MAGENTA}│${NC} %-4s ${MAGENTA}│${NC} ${RED}%-9s${NC} ${MAGENTA}│${NC} %-20s ${MAGENTA}│${NC} %-18s ${MAGENTA}│${NC}\n" \
               "LobeChat Redis" "6379" "${CROSS} Stopped" "- N/A" "Redis 7"
    fi

    # Check Qdrant instances
    if check_port 6335; then
        conn=$(check_http "http://localhost:6335/health" && echo "${GREEN}${CHECK} Connected${NC}" || echo "${RED}${CROSS} Failed${NC}")
        printf "${MAGENTA}│${NC} %-20s ${MAGENTA}│${NC} %-4s ${MAGENTA}│${NC} ${GREEN}%-9s${NC} ${MAGENTA}│${NC} %-20s ${MAGENTA}│${NC} %-18s ${MAGENTA}│${NC}\n" \
               "Bifrost Qdrant" "6335" "${CHECK} Running" "$conn" "Qdrant v1.16"
    else
        printf "${MAGENTA}│${NC} %-20s ${MAGENTA}│${NC} %-4s ${MAGENTA}│${NC} ${RED}%-9s${NC} ${MAGENTA}│${NC} %-20s ${MAGENTA}│${NC} %-18s ${MAGENTA}│${NC}\n" \
               "Bifrost Qdrant" "6335" "${CROSS} Stopped" "- N/A" "Qdrant v1.16"
    fi

    if check_port 6333; then
        conn=$(check_http "http://localhost:6333/health" && echo "${GREEN}${CHECK} Connected${NC}" || echo "${RED}${CROSS} Failed${NC}")
        printf "${MAGENTA}│${NC} %-20s ${MAGENTA}│${NC} %-4s ${MAGENTA}│${NC} ${GREEN}%-9s${NC} ${MAGENTA}│${NC} %-20s ${MAGENTA}│${NC} %-18s ${MAGENTA}│${NC}\n" \
               "Code-RAG Qdrant" "6333" "${CHECK} Running" "$conn" "Qdrant latest"
    else
        printf "${MAGENTA}│${NC} %-20s ${MAGENTA}│${NC} %-4s ${MAGENTA}│${NC} ${RED}%-9s${NC} ${MAGENTA}│${NC} %-20s ${MAGENTA}│${NC} %-18s ${MAGENTA}│${NC}\n" \
               "Code-RAG Qdrant" "6333" "${CROSS} Stopped" "- N/A" "Qdrant latest"
    fi

    echo -e "${MAGENTA}└──────────────────────┴──────┴───────────┴──────────────┴────────────────────┘${NC}"
    echo ""

    # Resource Usage
    echo -e "${YELLOW}┌─────────────────────────────────────────────────────────────────────────────┐${NC}"
    echo -e "${YELLOW}│ RESOURCE USAGE (TOP 5 CONTAINERS)                                           │${NC}"
    echo -e "${YELLOW}├──────────────────────┬────────────┬──────────────┬───────────────────────────┤${NC}"
    printf "${YELLOW}│${NC} %-20s ${YELLOW}│${NC} %-10s ${YELLOW}│${NC} %-12s ${YELLOW}│${NC} %-25s ${YELLOW}│${NC}\n" \
           "Container" "CPU %" "Memory" "Network I/O"
    echo -e "${YELLOW}├──────────────────────┼────────────┼──────────────┼───────────────────────────┤${NC}"

    # Get resource stats
    sudo docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}" 2>/dev/null | tail -n +2 | head -5 | while IFS=$'\t' read -r name cpu mem net; do
        printf "${YELLOW}│${NC} %-20s ${YELLOW}│${NC} %-10s ${YELLOW}│${NC} %-12s ${YELLOW}│${NC} %-25s ${YELLOW}│${NC}\n" \
               "${name:0:20}" "$cpu" "$mem" "$net"
    done

    echo -e "${YELLOW}└──────────────────────┴────────────┴──────────────┴───────────────────────────┘${NC}"
    echo ""

    # GPU Status
    if command -v nvidia-smi &> /dev/null; then
        echo -e "${GREEN}┌─────────────────────────────────────────────────────────────────────────────┐${NC}"
        echo -e "${GREEN}│ GPU STATUS (NVIDIA)                                                         │${NC}"
        echo -e "${GREEN}├─────┬────────────────────┬─────────────┬──────────────┬─────────────────────┤${NC}"
        printf "${GREEN}│${NC} %-3s ${GREEN}│${NC} %-18s ${GREEN}│${NC} %-11s ${GREEN}│${NC} %-12s ${GREEN}│${NC} %-19s ${GREEN}│${NC}\n" \
               "GPU" "Name" "Utilization" "Memory Used" "Temperature"
        echo -e "${GREEN}├─────┼────────────────────┼─────────────┼──────────────┼─────────────────────┤${NC}"

        nvidia-smi --query-gpu=index,name,utilization.gpu,memory.used,memory.total,temperature.gpu --format=csv,noheader,nounits 2>/dev/null | while IFS=, read -r idx name util mem_used mem_total temp; do
            printf "${GREEN}│${NC} %-3s ${GREEN}│${NC} %-18s ${GREEN}│${NC} %-11s ${GREEN}│${NC} %-12s ${GREEN}│${NC} %-19s ${GREEN}│${NC}\n" \
                   "$idx" "${name:0:18}" "${util}%" "${mem_used}MB / ${mem_total}MB" "${temp}°C"
        done

        echo -e "${GREEN}└─────┴────────────────────┴─────────────┴──────────────┴─────────────────────┘${NC}"
        echo ""
    fi

    # Quick actions
    echo -e "${BLUE}QUICK ACTIONS:${NC}"
    echo -e "  • Check specific service: $0 check <service-name>"
    echo -e "  • Check port: $0 port <port-number>"
    echo -e "  • View logs: sudo docker logs --tail 50 <container-name>"
    echo -e "  • Check all ports: ss -tulpn | grep LISTEN"
    echo ""
}

# Check specific service
check_service() {
    local service=$1
    echo -e "${BLUE}Checking service: $service${NC}"
    sudo docker ps --filter "name=$service" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
}

# Check specific port
check_port_usage() {
    local port=$1
    echo -e "${BLUE}Port $port Status:${NC}"
    ss -tulpn | grep ":$port " || echo "Port $port is not in use"
    echo ""
    echo "Processes using port $port:"
    sudo lsof -i :$port 2>/dev/null || echo "No process found"
}

# Main script
case "${1:-dashboard}" in
    dashboard)
        show_dashboard
        ;;
    check)
        if [ -z "$2" ]; then
            echo "Usage: $0 check <service-name>"
            exit 1
        fi
        check_service "$2"
        ;;
    port)
        if [ -z "$2" ]; then
            echo "Usage: $0 port <port-number>"
            exit 1
        fi
        check_port_usage "$2"
        ;;
    *)
        echo "Usage: $0 {dashboard|check <service>|port <port>}"
        exit 1
        ;;
esac

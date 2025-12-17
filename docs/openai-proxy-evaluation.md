# Evaluation: Using OpenCode as/with an OpenAI-Compatible Proxy

## Executive Summary

OpenCode can be adapted to work as an OpenAI-compatible proxy, enabling other agents to leverage its powerful coding capabilities through a standardized API. This document evaluates the feasibility, approaches, trade-offs, and implementation strategies.

**Verdict**: Feasible with moderate effort. OpenCode's architecture supports this use case well, but requires building an adapter layer to translate OpenAI's API format to OpenCode's native session/message model.

---

## 1. OpenCode's Current Architecture

### Strengths
| Capability | Description |
|------------|-------------|
| **Multi-Provider Backend** | Uses Vercel AI SDK - already abstracts Anthropic, OpenAI, Google, Bedrock, etc. |
| **HTTP Server** | Built-in Hono.js server with 140+ REST endpoints (`server.ts:1789 lines`) |
| **Tool System** | Rich tool registry with 11+ built-in tools (bash, edit, read, write, grep, glob, etc.) |
| **Session Management** | Persistent sessions with conversation history, forking, and reverting |
| **Streaming** | Full SSE support for real-time updates |
| **OpenAPI Spec** | Auto-generated OpenAPI documentation at `/doc` |

### Key Files
```
/packages/opencode/src/
├── server/server.ts          # HTTP API (Hono.js)
├── session/prompt.ts         # Agent loop & LLM interaction
├── provider/provider.ts      # Multi-provider abstraction
├── tool/registry.ts          # Tool system
└── session/message-v2.ts     # Message format
```

### Limitations
| Limitation | Impact |
|------------|--------|
| **No OpenAI-compatible endpoint** | Must build adapter layer |
| **Session-based model** | Every interaction requires session management |
| **Tool-centric design** | Not a simple chat completion API |
| **Permission system** | May require handling permission callbacks |
| **Project-scoped** | Tied to working directory context |

---

## 2. Integration Approaches

### Approach A: OpenAI-Compatible Endpoint Adapter (Recommended)

Add new endpoints to OpenCode's server that implement OpenAI's Chat Completions API format:

```
POST /v1/chat/completions
POST /v1/models
GET /v1/models
```

**Implementation Strategy:**

```typescript
// New route in server.ts
.post(
  "/v1/chat/completions",
  validator("json", OpenAIChatCompletionRequest),
  async (c) => {
    const request = c.req.valid("json")

    // 1. Create or reuse session
    const session = await getOrCreateSession(request)

    // 2. Convert OpenAI messages to OpenCode parts
    const parts = convertOpenAIToOpenCode(request.messages)

    // 3. Map model name to provider/model
    const model = mapOpenAIModel(request.model)

    // 4. Call SessionPrompt.prompt()
    const result = await SessionPrompt.prompt({
      sessionID: session.id,
      model,
      parts,
      tools: request.tools ? mapTools(request.tools) : undefined,
    })

    // 5. Convert response to OpenAI format
    return c.json(convertToOpenAIResponse(result))
  }
)
```

**Pros:**
- Direct integration with OpenCode's capabilities
- Full access to all tools and agents
- Session persistence for multi-turn conversations
- Streaming support via existing SSE infrastructure

**Cons:**
- Requires OpenCode to be running as a service
- Session management overhead for simple queries
- Tool results need formatting for OpenAI compatibility

---

### Approach B: External Proxy Wrapper

Build a standalone proxy server that:
1. Accepts OpenAI API requests
2. Translates to OpenCode API calls
3. Returns OpenAI-formatted responses

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │────▶│ Proxy Layer │────▶│  OpenCode   │
│ (OpenAI API)│◀────│  (adapter)  │◀────│   Server    │
└─────────────┘     └─────────────┘     └─────────────┘
```

**Implementation (separate service):**

```typescript
// proxy-server.ts
import { Hono } from 'hono'

const proxy = new Hono()

proxy.post('/v1/chat/completions', async (c) => {
  const openaiReq = await c.req.json()

  // Create session in OpenCode
  const session = await fetch('http://localhost:4096/session', {
    method: 'POST',
  }).then(r => r.json())

  // Send message
  const result = await fetch(`http://localhost:4096/session/${session.id}/message`, {
    method: 'POST',
    body: JSON.stringify({
      parts: openaiReq.messages.map(m => ({
        type: 'text',
        text: m.content,
      })),
      model: { providerID: 'anthropic', modelID: 'claude-sonnet-4-20250514' }
    })
  }).then(r => r.json())

  // Format as OpenAI response
  return c.json({
    id: `chatcmpl-${session.id}`,
    object: 'chat.completion',
    created: Date.now(),
    model: openaiReq.model,
    choices: [{
      index: 0,
      message: {
        role: 'assistant',
        content: extractTextContent(result.parts),
      },
      finish_reason: 'stop',
    }],
    usage: extractUsage(result.info),
  })
})
```

**Pros:**
- No modifications to OpenCode core
- Can be deployed independently
- Easier to customize translation logic

**Cons:**
- Additional service to maintain
- Extra network hop latency
- Requires managing OpenCode lifecycle separately

---

### Approach C: OpenCode as MCP Server

Leverage Model Context Protocol to expose OpenCode's tools to other agents:

```typescript
// opencode-mcp-server.ts
const server = new McpServer({
  name: 'opencode',
  version: '1.0.0',
})

// Expose OpenCode tools via MCP
server.tool('bash', 'Execute shell commands', bashSchema, async (args) => {
  return executeBashTool(args)
})

server.tool('edit', 'Edit files', editSchema, async (args) => {
  return executeEditTool(args)
})

// ... expose all OpenCode tools
```

**Pros:**
- Standard protocol for tool sharing
- Claude/other agents natively support MCP
- Clean separation of concerns

**Cons:**
- Only exposes tools, not full agent capabilities
- Loses OpenCode's sophisticated prompting and agent loop
- Requires MCP-compatible client

---

## 3. Key Technical Considerations

### 3.1 Message Format Translation

**OpenAI Format:**
```json
{
  "messages": [
    {"role": "system", "content": "You are a helpful assistant"},
    {"role": "user", "content": "Fix the bug in main.py"}
  ]
}
```

**OpenCode Format (MessageV2):**
```json
{
  "parts": [
    {"type": "text", "text": "Fix the bug in main.py"}
  ]
}
```

**Translation Notes:**
- System messages → OpenCode agent/system prompt configuration
- User messages → TextPart
- Assistant messages → Retrieved from session history
- Tool calls → OpenCode has its own tool execution flow

### 3.2 Tool Handling

OpenCode's tools are more sophisticated than OpenAI function calling:

| Feature | OpenAI | OpenCode |
|---------|--------|----------|
| Tool Definition | JSON Schema | Zod + JSON Schema |
| Streaming Results | No | Yes (via SSE) |
| Permission Gating | No | Yes (allow/deny/ask) |
| Tool State | Stateless | Running/Completed/Error |
| Built-in Tools | None | 11+ coding-specific tools |

**Strategy:** For the proxy use case, either:
1. Disable permission prompts (auto-allow for trusted agents)
2. Implement permission callbacks via the proxy layer
3. Pre-configure permissions in OpenCode config

### 3.3 Session Management

**Challenge:** OpenAI's API is stateless; OpenCode is session-based.

**Solutions:**

1. **Session-per-conversation**: Create new session for each distinct conversation (track via custom header or model name suffix)
   ```
   X-OpenCode-Session: conv-abc123
   ```

2. **Ephemeral sessions**: Create, use, delete for single interactions
   ```typescript
   const session = await Session.create()
   const result = await SessionPrompt.prompt({...})
   await Session.remove(session.id)
   ```

3. **Session pooling**: Reuse sessions based on context hash

### 3.4 Streaming

OpenCode uses SSE; OpenAI uses SSE with specific format:

**OpenAI Stream Format:**
```
data: {"id":"chatcmpl-123","choices":[{"delta":{"content":"Hello"}}]}
data: [DONE]
```

**OpenCode Event Format:**
```
data: {"type":"message.part.updated","properties":{...}}
```

**Translation Required:** Subscribe to OpenCode's `/event` endpoint and transform events to OpenAI format.

---

## 4. Recommended Implementation Plan

### Phase 1: Basic Chat Completion Endpoint

1. Add `/v1/chat/completions` endpoint to `server.ts`
2. Implement message format translation
3. Support basic text-only conversations
4. Return responses in OpenAI format

### Phase 2: Tool Support

1. Map OpenAI function definitions to OpenCode tools
2. Handle tool_choice parameter
3. Return tool calls in OpenAI format
4. Process tool results

### Phase 3: Streaming

1. Implement SSE streaming in OpenAI format
2. Subscribe to OpenCode's bus events
3. Transform deltas to OpenAI chunks

### Phase 4: Advanced Features

1. Session management (conversation tracking)
2. Model mapping (OpenAI model names → OpenCode providers)
3. Permission handling
4. Usage tracking and billing

---

## 5. Configuration Example

```jsonc
// opencode.jsonc
{
  "proxy": {
    "enabled": true,
    "port": 8080,
    "openai_compatible": true,
    "default_provider": "anthropic",
    "default_model": "claude-sonnet-4-20250514",
    "session_management": "ephemeral", // or "persistent", "pooled"
    "auto_permissions": {
      "bash": "allow",
      "edit": "allow",
      "read": "allow"
    }
  }
}
```

---

## 6. Use Case Analysis

### Use Case: Agent-to-Agent Coding Tasks

**Scenario:** A orchestrator agent (e.g., Claude, GPT-4) delegates coding tasks to OpenCode via OpenAI-compatible API.

**Flow:**
```
Orchestrator Agent
       │
       ▼
POST /v1/chat/completions
{
  "model": "opencode/claude-sonnet",
  "messages": [
    {"role": "user", "content": "Fix the type errors in src/utils.ts"}
  ],
  "tools": [
    {"type": "function", "function": {"name": "read_file", ...}},
    {"type": "function", "function": {"name": "edit_file", ...}}
  ]
}
       │
       ▼
OpenCode Proxy Layer
       │
       ▼
OpenCode Session + Agent Loop
       │
       ▼
Tool Execution (read, edit, bash, etc.)
       │
       ▼
OpenAI-formatted Response
```

**Strengths Preserved:**
- Full tool access (bash, edit, grep, glob, LSP, MCP)
- Sophisticated prompting with agent system
- Session persistence for context
- Code understanding via LSP integration

**Limitations:**
- Permission handling may need automation
- Session overhead for single queries
- Complex tool results may lose fidelity in translation

---

## 7. Security Considerations

| Risk | Mitigation |
|------|------------|
| Untrusted callers | API key authentication |
| Arbitrary code execution | Sandbox tools, permission policies |
| Resource exhaustion | Rate limiting, session quotas |
| Data exfiltration | Project-scoped access, audit logging |

---

## 8. Alternative: Using OpenCode Directly

For some use cases, calling OpenCode's native API may be simpler:

```bash
# Create session
curl -X POST http://localhost:4096/session

# Send message
curl -X POST http://localhost:4096/session/$ID/message \
  -H "Content-Type: application/json" \
  -d '{"parts":[{"type":"text","text":"Fix the bug"}]}'

# Subscribe to events
curl -N http://localhost:4096/event
```

This avoids translation overhead and gives full access to OpenCode's features.

---

## 9. Conclusion

Using OpenCode with/as an OpenAI-compatible proxy is **feasible and valuable** for:
- Standardizing access for multi-agent systems
- Leveraging OpenCode's coding tools from any OpenAI-compatible client
- Building agent orchestration systems

**Recommended Approach:** Start with Approach A (direct endpoint integration) for tight integration, or Approach B (external proxy) for flexibility.

**Key Success Factors:**
1. Careful message format translation
2. Thoughtful session management strategy
3. Tool compatibility mapping
4. Streaming support for long-running operations
5. Permission automation for agent-to-agent communication

**Next Steps:**
1. Define target use cases precisely
2. Choose integration approach based on deployment constraints
3. Implement MVP with basic chat completion
4. Iterate based on real-world agent interactions

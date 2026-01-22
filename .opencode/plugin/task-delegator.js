/**
 * Task Delegator Plugin
 *
 * Enables delegating subtasks to specialized agents while preserving
 * the main conversation context. The main agent can spawn subagents
 * for focused work without cluttering the main thread.
 *
 * Usage:
 * "Delegate to code-reviewer: analyze provider.ts"
 * "Ask research agent to find best practices for X"
 */

export const TaskDelegatorPlugin = async ({ project, client, $, directory, worktree }) => {
  const taskHistory = []

  return {
    tool: {
      delegate_task: {
        description: "Delegate a focused subtask to a specialized agent. The subagent will work independently and return results without cluttering the main conversation. Use this when you need specialized work (code review, research, analysis) while maintaining the main context.",
        parameters: {
          agent: "string",
          task: "string",
          context: "string?"
        },
        async execute(args, ctx) {
          const taskId = `task-${Date.now()}`
          const startTime = Date.now()

          console.log(`[Delegator] 📤 Delegating to ${args.agent}: ${args.task.substring(0, 50)}...`)

          // Record delegation
          taskHistory.push({
            id: taskId,
            agent: args.agent,
            task: args.task,
            context: args.context,
            startTime,
            status: 'running'
          })

          // Construct the full prompt for the subagent
          let prompt = args.task
          if (args.context) {
            prompt = `Context: ${args.context}\n\nTask: ${args.task}`
          }

          // Execute as subagent (this preserves main context)
          // The subagent runs independently and returns its result
          const result = await client.run({
            prompt,
            agent: args.agent,
            // Don't continue the main conversation
            sessionID: undefined
          })

          const duration = Date.now() - startTime

          // Update history
          const task = taskHistory.find(t => t.id === taskId)
          if (task) {
            task.status = 'completed'
            task.duration = duration
            task.result = result
          }

          console.log(`[Delegator] ✅ Completed in ${duration}ms`)

          return {
            taskId,
            agent: args.agent,
            duration,
            result: result || "Task completed"
          }
        }
      },

      task_history: {
        description: "View history of delegated tasks in this session",
        parameters: {},
        async execute() {
          if (taskHistory.length === 0) {
            return "No tasks delegated in this session"
          }

          return taskHistory.map(t =>
            `[${t.id}] ${t.agent}: ${t.task.substring(0, 60)}... (${t.status}, ${t.duration}ms)`
          ).join('\n')
        }
      }
    },

    event: async ({ event }) => {
      // Log task delegation events
      if (event.type === "session.start") {
        console.log("[Delegator] Task delegation enabled")
      }

      if (event.type === "session.idle") {
        const completed = taskHistory.filter(t => t.status === 'completed').length
        if (completed > 0) {
          console.log(`[Delegator] Session completed ${completed} delegated task(s)`)
        }
      }
    }
  }
}

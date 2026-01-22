/**
 * Simple Task Logger Plugin
 *
 * Logs when tasks start/complete and tracks timing.
 * Good foundation for building more complex async workflows.
 */

export const TaskLoggerPlugin = async ({ project, client, $, directory, worktree }) => {
  const tasks = new Map()

  return {
    event: async ({ event }) => {
      // Track session start
      if (event.type === "session.start") {
        console.log(`[TaskLogger] Session started: ${event.sessionID}`)
        console.log(`[TaskLogger] Working directory: ${directory}`)
      }

      // Track when tools are executed (could spawn async tasks here)
      if (event.type === "tool.execute") {
        const taskId = `${event.tool}-${Date.now()}`
        tasks.set(taskId, {
          tool: event.tool,
          startTime: Date.now(),
          args: event.args
        })
        console.log(`[TaskLogger] Tool started: ${event.tool}`)
      }

      // Track completions
      if (event.type === "session.idle") {
        const duration = tasks.size > 0
          ? Date.now() - Math.min(...Array.from(tasks.values()).map(t => t.startTime))
          : 0
        console.log(`[TaskLogger] Session idle - ${tasks.size} tasks executed in ${duration}ms`)
        tasks.clear()
      }
    }
  }
}

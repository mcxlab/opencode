import { cmd } from "./cmd"
import * as prompts from "@clack/prompts"
import { UI } from "../ui"
import { Config } from "../../config/config"
import path from "path"
import fs from "fs/promises"
import { Filesystem } from "../../util/filesystem"

/**
 * Test connection to a provider endpoint
 */
async function testConnection(
  baseURL: string,
  modelId?: string,
): Promise<{
  success: boolean
  models?: string[]
  error?: string
}> {
  try {
    const url = baseURL.endsWith("/v1") ? `${baseURL}/models` : `${baseURL}/v1/models`
    const response = await fetch(url, {
      method: "GET",
      signal: AbortSignal.timeout(5000),
    })

    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}` }
    }

    const data = await response.json()
    const models = data.data?.map((m: any) => m.id) || []

    return { success: true, models }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Discover available models from endpoint
 */
async function discoverModels(baseURL: string): Promise<Array<{ id: string; name: string }>> {
  try {
    const url = baseURL.endsWith("/v1") ? `${baseURL}/models` : `${baseURL}/v1/models`
    const spinner = prompts.spinner()
    spinner.start("Fetching available models...")

    const response = await fetch(url, {
      method: "GET",
      signal: AbortSignal.timeout(5000),
    })

    if (!response.ok) {
      spinner.stop("Could not fetch models")
      return []
    }

    const data = await response.json()
    const models =
      data.data?.map((m: any) => ({
        id: m.id,
        name: m.id.split("/").pop()?.split(":")[0] || m.id,
      })) || []

    spinner.stop(`Found ${models.length} model(s)`)
    return models
  } catch (error) {
    return []
  }
}

export const ProviderCommand = cmd({
  command: "provider",
  describe: "manage custom providers",
  builder: (yargs) =>
    yargs
      .command(ProviderAddCommand)
      .command(ProviderListCommand)
      .command(ProviderRemoveCommand)
      .command(ProviderDoctorCommand)
      .demandCommand(),
  async handler() {},
})

export const ProviderListCommand = cmd({
  command: "list",
  aliases: ["ls"],
  describe: "list custom providers from opencode.json",
  async handler() {
    UI.empty()
    prompts.intro("Custom Providers")

    // Find opencode.json in current directory or up
    const configFiles = await Filesystem.findUp("opencode.json", process.cwd())
    const configFile = configFiles[0]

    if (!configFile) {
      prompts.log.warn("No opencode.json found in current directory or parent directories")
      prompts.outro("No custom providers configured")
      return
    }

    const configPath = configFile
    const displayPath = configPath.replace(process.env.HOME || "", "~")
    prompts.log.info(`Config: ${UI.Style.TEXT_DIM}${displayPath}`)
    UI.empty()

    try {
      const content = await fs.readFile(configPath, "utf-8")
      const config = JSON.parse(content)

      if (!config.provider || Object.keys(config.provider).length === 0) {
        prompts.log.warn("No custom providers configured in opencode.json")
        prompts.outro("0 providers")
        return
      }

      for (const [providerID, provider] of Object.entries(config.provider as Record<string, any>)) {
        const name = provider.name || providerID
        const baseURL = provider.options?.baseURL || "N/A"
        const modelCount = Object.keys(provider.models || {}).length

        prompts.log.info(`${name} ${UI.Style.TEXT_DIM}(${providerID})`)
        console.log(`  ${UI.Style.TEXT_DIM}URL: ${baseURL}`)
        console.log(`  ${UI.Style.TEXT_DIM}Models: ${modelCount}`)

        // List models
        if (provider.models) {
          for (const [modelID, model] of Object.entries(provider.models as Record<string, any>)) {
            const modelName = model.name || modelID
            console.log(`    • ${modelName} ${UI.Style.TEXT_DIM}(${modelID})`)
          }
        }
        UI.empty()
      }

      prompts.outro(`${Object.keys(config.provider).length} custom provider(s)`)
    } catch (error) {
      prompts.log.error(`Failed to read config: ${error}`)
      prompts.outro("Failed")
    }
  },
})

export const ProviderAddCommand = cmd({
  command: "add",
  describe: "add a custom provider to opencode.json",
  async handler() {
    UI.empty()
    prompts.intro("Add Custom Provider")

    // Find or create opencode.json
    const configFiles = await Filesystem.findUp("opencode.json", process.cwd())
    const configPath = configFiles[0] || path.join(process.cwd(), "opencode.json")

    // Get provider details
    const providerID = await prompts.text({
      message: "Provider ID (e.g., bifrost-ollama)",
      placeholder: "my-provider",
      validate: (x) => (x && x.match(/^[0-9a-z-]+$/) ? undefined : "Use only a-z, 0-9, and hyphens"),
    })
    if (prompts.isCancel(providerID)) throw new UI.CancelledError()

    const providerName = await prompts.text({
      message: "Provider display name",
      placeholder: "My Custom Provider",
      initialValue: providerID
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" "),
    })
    if (prompts.isCancel(providerName)) throw new UI.CancelledError()

    const baseURL = await prompts.text({
      message: "Base URL (API endpoint)",
      placeholder: "http://localhost:11434/v1",
      validate: (x) => {
        if (!x) return "Required"
        try {
          new URL(x)
          return undefined
        } catch {
          return "Must be a valid URL"
        }
      },
    })
    if (prompts.isCancel(baseURL)) throw new UI.CancelledError()

    // Test connection
    UI.empty()
    const spinner = prompts.spinner()
    spinner.start("Testing connection...")
    const testResult = await testConnection(baseURL)

    if (testResult.success) {
      spinner.stop("✓ Connection successful")
      prompts.log.success(`Detected OpenAI-compatible endpoint`)
      if (testResult.models && testResult.models.length > 0) {
        prompts.log.info(`Found ${testResult.models.length} model(s) available`)
      }
    } else {
      spinner.stop("⚠ Connection test failed")
      prompts.log.warn(`Could not connect: ${testResult.error}`)
      prompts.log.info(`Config will be saved anyway. Verify endpoint is correct.`)
    }
    UI.empty()

    const npmPackage = await prompts.select({
      message: "SDK package",
      options: [
        {
          label: "OpenAI Compatible (@ai-sdk/openai-compatible)",
          value: "@ai-sdk/openai-compatible",
          hint: "recommended",
        },
        {
          label: "Other",
          value: "other",
        },
      ],
    })
    if (prompts.isCancel(npmPackage)) throw new UI.CancelledError()

    let finalNpmPackage: string = npmPackage
    if (npmPackage === "other") {
      const customNpm = await prompts.text({
        message: "NPM package name",
        placeholder: "@ai-sdk/openai-compatible",
        validate: (x) => (x && x.length > 0 ? undefined : "Required"),
      })
      if (prompts.isCancel(customNpm)) throw new UI.CancelledError()
      finalNpmPackage = customNpm as string
    }

    // Add models - offer discovery if connection succeeded
    const models: Record<string, any> = {}
    let shouldDiscover = false

    if (testResult.success && testResult.models && testResult.models.length > 0) {
      const discoverConfirm = await prompts.confirm({
        message: "Fetch available models from server?",
        initialValue: true,
      })
      if (prompts.isCancel(discoverConfirm)) throw new UI.CancelledError()
      shouldDiscover = Boolean(discoverConfirm)
    }

    if (shouldDiscover) {
      const availableModels = await discoverModels(baseURL)

      if (availableModels.length > 0) {
        const selectedModels = await prompts.multiselect({
          message: "Select models to add:",
          options: availableModels.map((m) => ({
            label: m.id,
            value: m.id,
            hint: m.name,
          })),
          required: true,
        })
        if (prompts.isCancel(selectedModels)) throw new UI.CancelledError()

        // Add selected models
        for (const modelFullId of selectedModels) {
          const modelKey = String(modelFullId).split("/").pop()?.split(":")[0] || String(modelFullId)
          models[modelKey] = {
            id: modelFullId,
            name: modelKey.charAt(0).toUpperCase() + modelKey.slice(1).replace(/-/g, " "),
          }
        }
      } else {
        prompts.log.warn("Could not fetch models. Enter manually.")
      }
    }

    // Manual model entry if discovery was skipped or failed
    if (Object.keys(models).length === 0) {
      let addMore = true

      while (addMore) {
        const modelID = await prompts.text({
          message: "Model ID (short name for CLI)",
          placeholder: "devstral",
          validate: (x) => (x && x.length > 0 ? undefined : "Required"),
        })
        if (prompts.isCancel(modelID)) throw new UI.CancelledError()

        const realID = await prompts.text({
          message: "Actual model ID (as server expects)",
          placeholder: "ollama/devstral-small-2-100k:latest",
          initialValue: modelID,
        })
        if (prompts.isCancel(realID)) throw new UI.CancelledError()

        const modelName = await prompts.text({
          message: "Model display name",
          placeholder: "Devstral Small",
          initialValue: String(modelID)
            .split("-")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" "),
        })
        if (prompts.isCancel(modelName)) throw new UI.CancelledError()

        models[String(modelID)] = {
          id: realID,
          name: modelName,
        }

        const continueAdding = await prompts.confirm({
          message: "Add another model?",
          initialValue: false,
        })
        if (prompts.isCancel(continueAdding)) throw new UI.CancelledError()
        addMore = continueAdding
      }
    }

    // Read existing config or create new
    let config: any = {
      $schema: "https://opencode.ai/config.json",
      provider: {},
    }

    try {
      const content = await fs.readFile(configPath, "utf-8")
      config = JSON.parse(content)
      if (!config.provider) config.provider = {}
    } catch {
      // File doesn't exist, use default
    }

    // Add provider
    config.provider[providerID] = {
      npm: finalNpmPackage,
      name: providerName,
      options: {
        baseURL,
      },
      models,
    }

    // Show summary before saving
    UI.empty()
    prompts.log.info("Configuration Summary:")
    console.log(`  ${UI.Style.TEXT_DIM}Provider ID: ${UI.Style.TEXT_NORMAL}${providerID}`)
    console.log(`  ${UI.Style.TEXT_DIM}Provider Name: ${UI.Style.TEXT_NORMAL}${providerName}`)
    console.log(`  ${UI.Style.TEXT_DIM}Base URL: ${UI.Style.TEXT_NORMAL}${baseURL}`)
    console.log(`  ${UI.Style.TEXT_DIM}NPM Package: ${UI.Style.TEXT_NORMAL}${finalNpmPackage}`)
    console.log(`  ${UI.Style.TEXT_DIM}Models (${Object.keys(models).length}):`)
    for (const [key, model] of Object.entries(models)) {
      const modelStr = model.id ? `${key} → ${model.id}` : key
      console.log(`    • ${modelStr}`)
    }
    UI.empty()

    const shouldSave = await prompts.confirm({
      message: "Save this configuration?",
      initialValue: true,
    })
    if (prompts.isCancel(shouldSave) || !shouldSave) {
      prompts.outro("Cancelled")
      return
    }

    // Write config
    await fs.writeFile(configPath, JSON.stringify(config, null, 2) + "\n", "utf-8")

    UI.empty()
    prompts.log.success(`✓ Provider saved to opencode.json`)

    // Validate models if connection was successful
    if (testResult.success && testResult.models) {
      UI.empty()
      prompts.log.info("Validating models...")
      for (const [key, model] of Object.entries(models)) {
        const modelId = (model as any).id || key
        if (testResult.models.includes(modelId)) {
          console.log(`  ${UI.Style.TEXT_SUCCESS}✓${UI.Style.TEXT_NORMAL} ${key} ${UI.Style.TEXT_DIM}(available)`)
        } else {
          console.log(
            `  ${UI.Style.TEXT_WARNING}⚠${UI.Style.TEXT_NORMAL} ${key} ${UI.Style.TEXT_DIM}(not found on server)`,
          )
        }
      }
    }

    // Show usage instructions
    UI.empty()
    prompts.log.step("Test your provider:")
    const firstModel = Object.keys(models)[0]
    console.log(
      `  ${UI.Style.TEXT_HIGHLIGHT}opencode run --model ${providerID}/${firstModel} "Hello, world!"${UI.Style.TEXT_NORMAL}`,
    )
    UI.empty()
    prompts.log.step("List all providers:")
    console.log(`  ${UI.Style.TEXT_HIGHLIGHT}opencode provider list${UI.Style.TEXT_NORMAL}`)
    UI.empty()

    prompts.outro("Done! 🚀")
  },
})

export const ProviderRemoveCommand = cmd({
  command: "remove",
  aliases: ["rm"],
  describe: "remove a custom provider from opencode.json",
  async handler() {
    UI.empty()
    prompts.intro("Remove Custom Provider")

    // Find opencode.json
    const configFiles = await Filesystem.findUp("opencode.json", process.cwd())
    const configPath = configFiles[0]

    if (!configPath) {
      prompts.log.error("No opencode.json found")
      prompts.outro("Failed")
      return
    }

    try {
      const content = await fs.readFile(configPath, "utf-8")
      const config = JSON.parse(content)

      if (!config.provider || Object.keys(config.provider).length === 0) {
        prompts.log.error("No custom providers found in opencode.json")
        prompts.outro("Failed")
        return
      }

      const providerID = await prompts.select({
        message: "Select provider to remove",
        options: Object.entries(config.provider).map(([id, provider]: [string, any]) => ({
          label: provider.name || id,
          value: id,
          hint: provider.options?.baseURL,
        })),
      })
      if (prompts.isCancel(providerID)) throw new UI.CancelledError()

      const confirm = await prompts.confirm({
        message: `Remove provider '${providerID}'?`,
      })
      if (prompts.isCancel(confirm) || !confirm) throw new UI.CancelledError()

      delete config.provider[providerID]

      await fs.writeFile(configPath, JSON.stringify(config, null, 2) + "\n", "utf-8")

      prompts.log.success(`Provider '${providerID}' removed`)
      prompts.outro("Done")
    } catch (error) {
      if (error instanceof UI.CancelledError) throw error
      prompts.log.error(`Failed to remove provider: ${error}`)
      prompts.outro("Failed")
    }
  },
})

export const ProviderDoctorCommand = cmd({
  command: "doctor",
  aliases: ["check", "validate"],
  describe: "validate provider configuration and test connections",
  async handler() {
    UI.empty()
    prompts.intro("Provider Configuration Check")

    // Find opencode.json
    const configFiles = await Filesystem.findUp("opencode.json", process.cwd())
    const configPath = configFiles[0]

    if (!configPath) {
      prompts.log.warn("No opencode.json found")
      prompts.log.info("Providers will use built-in configuration only")
      prompts.outro("No custom providers")
      return
    }

    const displayPath = configPath.replace(process.env.HOME || "", "~")
    prompts.log.info(`Config: ${UI.Style.TEXT_DIM}${displayPath}`)
    UI.empty()

    try {
      const content = await fs.readFile(configPath, "utf-8")
      const config = JSON.parse(content)

      if (!config.provider || Object.keys(config.provider).length === 0) {
        prompts.log.warn("No custom providers configured")
        prompts.outro("Nothing to check")
        return
      }

      const providerCount = Object.keys(config.provider).length
      prompts.log.info(`Found ${providerCount} provider(s). Testing connections...\n`)

      let healthyCount = 0
      let unhealthyCount = 0

      for (const [providerID, provider] of Object.entries(config.provider as Record<string, any>)) {
        const name = provider.name || providerID
        console.log(`${UI.Style.TEXT_NORMAL_BOLD}${name}${UI.Style.TEXT_NORMAL} ${UI.Style.TEXT_DIM}(${providerID})`)
        console.log(`  URL: ${provider.options?.baseURL || "N/A"}`)

        // Test connection
        const testResult = await testConnection(provider.options?.baseURL)

        if (testResult.success) {
          console.log(`  ${UI.Style.TEXT_SUCCESS}✓ Connection successful${UI.Style.TEXT_NORMAL}`)
          healthyCount++

          // Validate each model
          const models = provider.models || {}
          const modelCount = Object.keys(models).length
          console.log(`  Models: ${modelCount}`)

          for (const [key, model] of Object.entries(models)) {
            const modelId = (model as any).id || key
            if (testResult.models?.includes(modelId)) {
              console.log(
                `    ${UI.Style.TEXT_SUCCESS}✓${UI.Style.TEXT_NORMAL} ${key} ${UI.Style.TEXT_DIM}(${modelId})`,
              )
            } else {
              console.log(
                `    ${UI.Style.TEXT_WARNING}⚠${UI.Style.TEXT_NORMAL} ${key} ${UI.Style.TEXT_DIM}not found on server`,
              )
              console.log(`      ${UI.Style.TEXT_DIM}Expected: ${modelId}`)
              if (testResult.models && testResult.models.length > 0) {
                console.log(
                  `      ${UI.Style.TEXT_DIM}Available: ${testResult.models.slice(0, 3).join(", ")}${testResult.models.length > 3 ? "..." : ""}`,
                )
              }
            }
          }
        } else {
          console.log(`  ${UI.Style.TEXT_DANGER}✗ Connection failed${UI.Style.TEXT_NORMAL}`)
          console.log(`  ${UI.Style.TEXT_DIM}Error: ${testResult.error}`)
          unhealthyCount++
        }

        UI.empty()
      }

      // Summary
      if (unhealthyCount === 0) {
        prompts.log.success(`All ${healthyCount} provider(s) are healthy ✓`)
        prompts.outro("Configuration OK")
      } else {
        prompts.log.warn(`${unhealthyCount} provider(s) have issues`)
        prompts.log.info(`${healthyCount} provider(s) are healthy`)
        prompts.outro("Check failed providers")
      }
    } catch (error) {
      prompts.log.error(`Failed to validate config: ${error}`)
      prompts.outro("Failed")
    }
  },
})

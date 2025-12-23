import { cmd } from "./cmd"
import * as prompts from "@clack/prompts"
import { UI } from "../ui"
import { Config } from "../../config/config"
import path from "path"
import fs from "fs/promises"
import { Filesystem } from "../../util/filesystem"

export const ProviderCommand = cmd({
  command: "provider",
  describe: "manage custom providers",
  builder: (yargs) =>
    yargs
      .command(ProviderAddCommand)
      .command(ProviderListCommand)
      .command(ProviderRemoveCommand)
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

    // Add models
    const models: Record<string, any> = {}
    let addMore = true

    while (addMore) {
      const modelID = await prompts.text({
        message: "Model ID",
        placeholder: "model-name",
        validate: (x) => (x && x.length > 0 ? undefined : "Required"),
      })
      if (prompts.isCancel(modelID)) throw new UI.CancelledError()

      const modelName = await prompts.text({
        message: "Model display name",
        placeholder: "Model Name",
        initialValue: modelID
          .split("-")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" "),
      })
      if (prompts.isCancel(modelName)) throw new UI.CancelledError()

      const realID = await prompts.text({
        message: "Actual model ID (if different from display ID)",
        placeholder: "Leave empty if same as model ID",
      })
      if (prompts.isCancel(realID)) {
        models[modelID] = { name: modelName }
      } else {
        models[modelID] = {
          name: modelName,
          ...(realID && realID.length > 0 ? { id: realID } : {}),
        }
      }

      const continueAdding = await prompts.confirm({
        message: "Add another model?",
        initialValue: false,
      })
      if (prompts.isCancel(continueAdding)) throw new UI.CancelledError()
      addMore = continueAdding
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

    // Write config
    await fs.writeFile(configPath, JSON.stringify(config, null, 2) + "\n", "utf-8")

    prompts.log.success(`Provider added to ${configPath}`)
    prompts.log.info(`Run 'opencode models ${providerID}' to see available models`)
    prompts.outro("Done")
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

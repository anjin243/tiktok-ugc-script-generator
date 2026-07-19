export interface EphemeralAiConfig {
  provider: string
  keys: Record<string, string>
  model?: string
  visionModel?: string
  supportsVision?: boolean
  isLocal?: boolean
}

let currentConfig: EphemeralAiConfig | undefined

export const getEphemeralAiConfig = (): EphemeralAiConfig | undefined => currentConfig

export const setEphemeralAiConfig = (config: EphemeralAiConfig): void => {
  currentConfig = config
}

export const clearEphemeralAiConfig = (): void => {
  currentConfig = undefined
}

import { IConfig, IDefaultFilters, IHeader, PresetConfig } from "../interfaces/common.interface";

export abstract class BaseConfigService {
  constructor(protected config: IConfig) { }

  getPreset(presetName?: string): PresetConfig | null {
    if (!presetName) {
      return this.config.presets?.[0] || null
    }
    return this.config.presets?.find(
      (preset: PresetConfig) => preset.presetName === presetName
    ) || null
  }

  getPresetNames(): string[] {
    try {
      return this.config.presets?.map((preset: PresetConfig) => preset.presetName) || []
    }
    catch (error) {
      console.error(error);
      return [];
    }
  }

  getHeaders(presetName?: string): IHeader[] {
    try {
      const preset = this.getPreset(presetName)
      return preset?.headers || []
    }
    catch (error) {
      console.error(error);
      return []
    }
  }

  getFilters(presetName?: string): IDefaultFilters {
    try {
      const preset = this.getPreset(presetName)
      return preset?.default_filters
    }
    catch (error) {
      console.error(error);
      return {}
    }
  }

  getFieldExceptions(presetName: string, field: string): string[] {
    try {
      const preset = this.getPreset(presetName)
      return preset?.exceptions?.[field] || []
    }
    catch (error) {
      console.error(error);
      return []
    }
  }
}
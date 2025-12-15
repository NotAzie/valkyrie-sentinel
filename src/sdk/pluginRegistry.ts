export interface ValkyriePlugin {
  name: string;
  version: string;
  initialize: (context: any) => Promise<void>;
  shutdown?: () => Promise<void>;
}

export class PluginRegistry {
  private static plugins = new Map<string, ValkyriePlugin>();

  public static register(plugin: ValkyriePlugin): void {
    if (this.plugins.has(plugin.name)) {
      throw new Error(`Plugin '${plugin.name}' already registered.`);
    }
    this.plugins.set(plugin.name, plugin);
    console.log(`[PluginRegistry] Installed extension: ${plugin.name}@${plugin.version}`);
  }

  public static async bootAll(context: any): Promise<void> {
    for (const [name, plugin] of this.plugins.entries()) {
      await plugin.initialize(context);
      console.log(`[PluginRegistry] Active: ${name}`);
    }
  }
}

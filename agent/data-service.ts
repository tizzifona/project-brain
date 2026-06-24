export class DataService {
  private data: any = null;
  private dataPath: string;

  constructor(dataPath: string) {
    this.dataPath = dataPath;
  }

  async getData(): Promise<any> {
    if (!this.data) {
      await this.loadData();
    }
    return this.data;
  }

  async loadData(): Promise<void> {
    try {
      const content = await Deno.readTextFile(this.dataPath);
      this.data = JSON.parse(content);
      console.log(`✅ Loaded data from ${this.dataPath}`);
    } catch (error) {
      console.error(`❌ Error loading data from ${this.dataPath}:`, error);
      throw error;
    }
  }

  async reloadData(): Promise<void> {
    this.data = null;
    await this.loadData();
  }

  getEvents(): any[] {
    return this.data?.events || [];
  }

  getProjectInfo(): any {
    return this.data?.project || {};
  }

  getBudgetInfo(): any {
    return this.data?.budget || {};
  }

  getTimelineInfo(): any {
    return this.data?.timeline || {};
  }

  getSprintInfo(): any {
    return this.data?.sprint || {};
  }
}

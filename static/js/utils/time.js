export class Time {
  constructor() {
    this.serverTimeOffset = 0;
    this.lastSync = 0;
  }

  async syncTime() {
    try {
      const beforeRequest = Date.now() / 1000;
      const response = await fetch('/api/time.php');
      const afterRequest = Date.now() / 1000;
      const serverTime = await response.json();
      
      // Calculate offset accounting for request latency
      const latency = (afterRequest - beforeRequest) / 2;
      this.serverTimeOffset = serverTime - (afterRequest - latency);
      this.lastSync = Date.now() / 1000;
    } catch (error) {
      console.error('Failed to sync time:', error);
    }
  }

  getCurrentTime() {
    const now = Date.now() / 1000;
    return now + this.serverTimeOffset;
  }
} 
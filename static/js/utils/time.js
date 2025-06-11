export class Time {
  constructor() {
    this.serverTimeOffset = 0;
    this.lastSyncTime = 0;
    this.syncInterval = 15000; // Sync every 15 seconds
    this.syncAttempts = 0;
    this.maxSyncAttempts = 3;
    this.syncWindow = 100; // Accept 100ms difference
    this.syncHistory = [];
    this.isStable = false;
    this.syncPromise = null;
  }

  async syncTime() {
    if (this.syncPromise) {
      return this.syncPromise;
    }

    this.syncPromise = this._doSync();
    try {
      await this.syncPromise;
    } finally {
      this.syncPromise = null;
    }
  }

  async _doSync() {
    const startTime = performance.now();
    try {
      const response = await fetch('/api/time.php');
      if (!response.ok) {
        throw new Error(`Time sync failed with status ${response.status}`);
      }
      
      const serverTimeSeconds = await response.json();
      if (typeof serverTimeSeconds !== 'number') {
        throw new Error('Invalid server time response');
      }
      
      const endTime = performance.now();
      const latency = (endTime - startTime) / 2; // Estimate one-way latency
      
      // Convert server time to milliseconds
      const serverTimeMs = serverTimeSeconds * 1000;
      const localTime = performance.now();
      const newOffset = serverTimeMs - (localTime + latency);
      
      // Add to sync history
      this.syncHistory.push({
        timestamp: localTime,
        offset: newOffset,
        latency,
        serverTime: serverTimeMs
      });
      
      // Keep only last 10 syncs
      if (this.syncHistory.length > 10) {
        this.syncHistory.shift();
      }
      
      // Calculate average of last 3 syncs
      const recentSyncs = this.syncHistory.slice(-3);
      const avgOffset = recentSyncs.reduce((sum, sync) => sum + sync.offset, 0) / recentSyncs.length;
      
      // Check if offset is stable
      const offsetDiff = Math.abs(avgOffset - this.serverTimeOffset);
      this.isStable = offsetDiff < this.syncWindow;
      
      if (!this.isStable) {        
        // If difference is too large, try again
        if (offsetDiff > this.syncWindow * 2) {
          this.syncAttempts++;
          if (this.syncAttempts < this.maxSyncAttempts) {
            console.log(`Retrying sync (attempt ${this.syncAttempts + 1}/${this.maxSyncAttempts})`);
            await new Promise(resolve => setTimeout(resolve, 200));
            return this._doSync();
          }
        }
      }
      
      this.serverTimeOffset = avgOffset;
      this.lastSyncTime = localTime;
      this.syncAttempts = 0;
      
      return this.isStable;
    } catch (error) {
      console.error('Time sync failed:', error);
      this.isStable = false;
      throw error;
    }
  }

  getCurrentTime() {
    // Convert back to seconds for comparison with server timestamps
    return (performance.now() + this.serverTimeOffset) / 1000;
  }

  getTimeDifference() {
    return this.serverTimeOffset;
  }

  shouldResync() {
    return !this.isStable || Math.abs(this.getTimeDifference()) > this.syncWindow;
  }

  getSyncState() {
    return {
      offset: this.serverTimeOffset,
      lastSync: this.lastSyncTime,
      isStable: this.isStable,
      attempts: this.syncAttempts,
      history: this.syncHistory
    };
  }

  startPeriodicSync() {
    setInterval(() => {
      if (this.shouldResync()) {
        this.syncTime().catch(error => {
          console.error('Periodic sync failed:', error);
        });
      }
    }, this.syncInterval);
  }

  async waitForStableSync() {
    if (this.isStable) {
      return;
    }

    // Try to sync up to max attempts
    for (let i = 0; i < this.maxSyncAttempts; i++) {
      try {
        await this.syncTime();
        if (this.isStable) {
          return;
        }
      } catch (error) {
        console.error(`Sync attempt ${i + 1} failed:`, error);
      }
      // Wait longer between attempts
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    throw new Error('Failed to achieve stable time sync');
  }
} 
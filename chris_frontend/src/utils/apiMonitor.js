/**
 * Real-time API call monitor for development debugging.
 * Logs all API calls and their results in a formatted table.
 */

let callLog = [];
let maxLogSize = 100;

// PUBLIC_INTERFACE
/**
 * Log an API call
 * @param {object} details - Call details
 */
export const logApiCall = (details) => {
  const entry = {
    timestamp: new Date().toISOString(),
    ...details
  };
  
  callLog.unshift(entry);
  
  // Keep log size manageable
  if (callLog.length > maxLogSize) {
    callLog = callLog.slice(0, maxLogSize);
  }
  
  return entry;
};

// PUBLIC_INTERFACE
/**
 * Get all logged API calls
 * @returns {array} Array of call log entries
 */
export const getCallLog = () => {
  return [...callLog];
};

// PUBLIC_INTERFACE
/**
 * Clear the call log
 */
export const clearCallLog = () => {
  callLog = [];
  console.log('API call log cleared');
};

// PUBLIC_INTERFACE
/**
 * Print call log as a formatted table
 * @param {number} limit - Maximum number of entries to show
 */
export const printCallLog = (limit = 20) => {
  const entries = callLog.slice(0, limit);
  
  if (entries.length === 0) {
    console.log('No API calls logged yet');
    return;
  }
  
  console.log(`\n=== API Call Log (${entries.length} recent calls) ===\n`);
  
  const tableData = entries.map(entry => ({
    Time: new Date(entry.timestamp).toLocaleTimeString(),
    Method: entry.method,
    Path: entry.path || entry.url,
    Status: entry.status || entry.error || 'pending',
    Duration: entry.duration ? `${entry.duration}ms` : '-',
    Result: entry.success ? '✓' : entry.error ? '✗' : '⏳'
  }));
  
  console.table(tableData);
  console.log('===================================\n');
};

// PUBLIC_INTERFACE
/**
 * Get statistics about API calls
 * @returns {object} Statistics object
 */
export const getCallStats = () => {
  const stats = {
    total: callLog.length,
    successful: 0,
    failed: 0,
    pending: 0,
    byMethod: {},
    byStatus: {},
    avgDuration: 0,
    totalDuration: 0
  };
  
  let durationCount = 0;
  
  callLog.forEach(entry => {
    // Count by result
    if (entry.success) {
      stats.successful++;
    } else if (entry.error) {
      stats.failed++;
    } else {
      stats.pending++;
    }
    
    // Count by method
    const method = entry.method || 'unknown';
    stats.byMethod[method] = (stats.byMethod[method] || 0) + 1;
    
    // Count by status
    const status = entry.status || 'pending';
    stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;
    
    // Calculate duration
    if (entry.duration) {
      stats.totalDuration += entry.duration;
      durationCount++;
    }
  });
  
  if (durationCount > 0) {
    stats.avgDuration = Math.round(stats.totalDuration / durationCount);
  }
  
  return stats;
};

// PUBLIC_INTERFACE
/**
 * Print call statistics
 */
export const printCallStats = () => {
  const stats = getCallStats();
  
  console.log('\n=== API Call Statistics ===');
  console.log(`Total Calls: ${stats.total}`);
  console.log(`Successful: ${stats.successful} (${Math.round(stats.successful / stats.total * 100)}%)`);
  console.log(`Failed: ${stats.failed} (${Math.round(stats.failed / stats.total * 100)}%)`);
  console.log(`Pending: ${stats.pending}`);
  console.log(`Average Duration: ${stats.avgDuration}ms`);
  console.log('\nBy Method:', stats.byMethod);
  console.log('By Status:', stats.byStatus);
  console.log('==========================\n');
};

// Make available globally in development
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  window.apiMonitor = {
    log: getCallLog,
    print: printCallLog,
    stats: printCallStats,
    clear: clearCallLog
  };
  console.log('💡 API Monitor available: window.apiMonitor.print(), .stats(), .clear()');
}

export default {
  logApiCall,
  getCallLog,
  clearCallLog,
  printCallLog,
  getCallStats,
  printCallStats
};

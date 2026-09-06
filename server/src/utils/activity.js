const MAX_ACTIVITY_LOGS = 200;

/** Write-through activity logging: appends to the embedded log, capped at the last 200 entries. */
export const logActivity = (task, actorId, action, meta) => {
  let safeMeta = meta;
  
  if (meta && typeof meta === 'object' && !Array.isArray(meta)) {
    safeMeta = Object.fromEntries(
      Object.entries(meta).slice(0, 8).map(([k, v]) => [k, String(v).slice(0, 200)])
    );
  } else if (Array.isArray(meta)) {
    safeMeta = meta.slice(0, 8).map((v) => String(v).slice(0, 200));
  }

  task.activityLog.push({ actorId, action, meta: safeMeta });
  
  if (task.activityLog.length > MAX_ACTIVITY_LOGS) {
    task.activityLog = task.activityLog.slice(-MAX_ACTIVITY_LOGS);
  }
};
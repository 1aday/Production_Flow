// Background task tracking system - persists across navigation

export type TaskType = 
  | 'show-generation'      // Initial GPT call to create show JSON
  | 'character-seeds'      // Character seed generation
  | 'character-dossier'    // Individual character dossier building
  | 'portrait'             // Character portrait generation
  | 'video'                // Character video generation
  | 'portrait-grid'        // Portrait grid composition
  | 'poster'               // Hero poster generation
  | 'library-poster'       // Library/show poster generation
  | 'trailer';             // Trailer generation

export type BackgroundTask = {
  id: string;
  type: TaskType;
  showId: string;
  characterId?: string; // For portrait/video/dossier tasks
  startedAt: number;
  completedAt?: number; // When the task finished
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  progress?: number; // 0-100
  outputUrl?: string;
  error?: string;
  metadata?: Record<string, unknown>;
  stepNumber?: number; // For ordering in pipeline view (1, 2, 3...)
};

const STORAGE_KEY = 'production-flow.background-tasks';
const MAX_ACTIVE_TASK_AGE = 30 * 60 * 1000; // 30 minutes for active tasks
const MAX_COMPLETED_TASK_AGE = 10 * 60 * 1000; // 10 minutes for completed/failed tasks

// Get all background tasks (including completed/failed)
export function getAllTasks(): BackgroundTask[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const tasks = JSON.parse(stored) as BackgroundTask[];
    
    // Filter out expired tasks based on status
    const now = Date.now();
    const valid = tasks.filter(task => {
      const age = now - task.startedAt;
      const isActive = task.status === 'starting' || task.status === 'processing';
      const maxAge = isActive ? MAX_ACTIVE_TASK_AGE : MAX_COMPLETED_TASK_AGE;
      return age < maxAge;
    });
    
    if (valid.length !== tasks.length) {
      saveBackgroundTasks(valid);
    }
    
    return valid;
  } catch {
    return [];
  }
}

// Get active background tasks (only starting/processing)
export function getBackgroundTasks(): BackgroundTask[] {
  return getAllTasks().filter(
    task => task.status === 'starting' || task.status === 'processing'
  );
}

// Save background tasks
export function saveBackgroundTasks(tasks: BackgroundTask[]) {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (error) {
    console.error('Failed to save background tasks:', error);
  }
}

// Add a new task
export function addBackgroundTask(task: Omit<BackgroundTask, 'startedAt'>): BackgroundTask {
  const newTask: BackgroundTask = {
    ...task,
    startedAt: Date.now(),
  };
  
  const tasks = getBackgroundTasks();
  
  // Check if task already exists (same type + showId + characterId)
  const existingIndex = tasks.findIndex(t => 
    t.type === task.type && 
    t.showId === task.showId &&
    t.characterId === task.characterId
  );
  
  if (existingIndex >= 0) {
    // Update existing task
    tasks[existingIndex] = newTask;
  } else {
    // Add new task
    tasks.push(newTask);
  }
  
  saveBackgroundTasks(tasks);
  return newTask;
}

// Update task status
export function updateBackgroundTask(
  id: string, 
  updates: Partial<BackgroundTask>
) {
  const tasks = getBackgroundTasks();
  const index = tasks.findIndex(t => t.id === id);
  
  if (index >= 0) {
    tasks[index] = { ...tasks[index], ...updates };
    saveBackgroundTasks(tasks);
    return tasks[index];
  }
  
  return null;
}

// Remove a task
export function removeBackgroundTask(id: string) {
  const tasks = getBackgroundTasks();
  const filtered = tasks.filter(t => t.id !== id);
  saveBackgroundTasks(filtered);
}

// Get tasks for a specific show
export function getShowTasks(showId: string): BackgroundTask[] {
  return getBackgroundTasks().filter(t => t.showId === showId);
}

// Get task by ID
export function getBackgroundTask(id: string): BackgroundTask | null {
  const tasks = getBackgroundTasks();
  return tasks.find(t => t.id === id) || null;
}

// Clear all completed/failed tasks
export function clearCompletedTasks() {
  const tasks = getAllTasks();
  const active = tasks.filter(t => t.status === 'starting' || t.status === 'processing');
  saveBackgroundTasks(active);
}

// Clean up stale tasks that are marked as processing but likely completed
export function cleanupStaleTasks() {
  const tasks = getAllTasks();
  const now = Date.now();
  const cleaned = tasks.filter(task => {
    // If task has been "processing" for more than 15 minutes, consider it stale
    if (task.status === 'processing' || task.status === 'starting') {
      const age = now - task.startedAt;
      // Keep tasks under 15 minutes old
      return age < 15 * 60 * 1000;
    }
    // Keep all other tasks
    return true;
  });
  
  if (cleaned.length !== tasks.length) {
    console.log(`🧹 Cleaned ${tasks.length - cleaned.length} stale tasks`);
    saveBackgroundTasks(cleaned);
  }
}


// Performance monitoring utilities for VR audio processing

export class PerformanceMonitor {
  private startTime: number;
  private steps: Map<string, number> = new Map();

  constructor() {
    this.startTime = Date.now();
  }

  mark(step: string): void {
    this.steps.set(step, Date.now());
    console.log(`⏱️  ${step}: ${Date.now() - this.startTime}ms`);
  }

  getTotalTime(): number {
    return Date.now() - this.startTime;
  }

  getStepTimes(): Record<string, number> {
    const result: Record<string, number> = {};
    let lastTime = this.startTime;

    for (const [step, time] of this.steps.entries()) {
      result[step] = time - lastTime;
      lastTime = time;
    }

    return result;
  }

  logSummary(): void {
    const total = this.getTotalTime();
    const steps = this.getStepTimes();
    
    console.log(`🚀 Performance Summary (${total}ms total):`);
    Object.entries(steps).forEach(([step, time]) => {
      const percentage = ((time / total) * 100).toFixed(1);
      console.log(`   ${step}: ${time}ms (${percentage}%)`);
    });
  }
}

// Helper function to measure async operations
export async function measureAsync<T>(
  name: string,
  operation: () => Promise<T>
): Promise<T> {
  const start = Date.now();
  try {
    const result = await operation();
    const duration = Date.now() - start;
    console.log(`✅ ${name}: ${duration}ms`);
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    console.log(`❌ ${name}: ${duration}ms (failed)`);
    throw error;
  }
}

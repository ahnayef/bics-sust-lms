// Simple retry utility for database operations
export async function retry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      console.warn(`DB attempt ${i + 1}/${maxRetries} failed, retrying in ${delayMs}ms...`, error);
      
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs * (i + 1))); // Exponential backoff
      }
    }
  }
  
  throw lastError;
}

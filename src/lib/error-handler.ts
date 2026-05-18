// Firestore Error Handler Utility

export const OperationType = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  LIST: 'list',
  GET: 'get',
  WRITE: 'write',
} as const;

export type OperationType = typeof OperationType[keyof typeof OperationType];

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  // Logical categorizing of errors
  if (errorMessage.includes('permission-denied') || errorMessage.includes('Missing or insufficient permissions')) {
    console.warn(`[Access Denied] ${operationType} on ${path || 'unknown path'}`);
    return;
  }

  console.error(`[Firestore Error] ${operationType} @ ${path || 'unknown'}:`, errorMessage);
  throw new Error(errorMessage);
}

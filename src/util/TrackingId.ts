
import { v4 as uuidv4 } from 'uuid';

/**
 * Generates a unique tracking Id using uuid
 */
export function generateTrackingId(): string {
    return uuidv4();
}
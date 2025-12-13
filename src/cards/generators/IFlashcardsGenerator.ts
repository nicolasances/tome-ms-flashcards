import { Card } from "../Card";

export interface FlashcardsGenerator {
    
    generateFlashcards(corpus: string, llmRequestTrackingId: string): Promise<Card[]>;

}
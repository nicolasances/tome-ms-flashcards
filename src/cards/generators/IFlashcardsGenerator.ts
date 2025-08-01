import { Card } from "../Card";

export interface FlashcardsGenerator {
    
    generateFlashcards(corpus: string): Promise<Card[]>;

    generation(): string;
    
}
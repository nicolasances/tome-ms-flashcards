import { ExecutionContext } from "toto-api-controller/dist/model/ExecutionContext";
import { FlashcardsGenerationOrchestrator } from "../FlashcardsGenerationOrchestrator";
import { DateFCGenerator } from "./DateFCGenerator";
import { HistoricalGraphGenerator } from "./HistoricalGraphGenerator";
import { MultipleOptionsFCGenerator } from "./MultipleOptionsFCGenerator";
import { SectionTimelineFCGenerator } from "./SectionTimelineFCGenerator";
import { Request } from "express";
import { FlashcardsGenerator } from "./IFlashcardsGenerator";
import { GENERATED_FLASHCARD_TYPES } from "../../model/FlashcardTypes";

export class FlashcardsGeneratorFactory {

    static getLatestGenerationCode(): string {
        return GENERATED_FLASHCARD_TYPES.map(type => {
            if (type === 'graph') return HistoricalGraphGenerator.generation(); 
            else if (type === 'date') return DateFCGenerator.generation();
            else if (type === 'options') return MultipleOptionsFCGenerator.generation();
            else if (type === 'timeline') return SectionTimelineFCGenerator.generation();
            
            return "";
        }).join('.');
    }

    static getGenerator(execContext: ExecutionContext, request: Request, user: string, topicCode: string, topicId: string, sectionCode: string, flashcardsType: string): FlashcardsGenerator {

        // Extract the section index from the section code. Section codes are formatted as {index}-{code}
        const sectionIndex = parseInt(sectionCode.split('-')[0]);

        if (flashcardsType == 'options') {
            return new MultipleOptionsFCGenerator(execContext, request, user, topicCode, topicId, sectionCode, sectionIndex);
        } else if (flashcardsType == 'timeline') {
            return new SectionTimelineFCGenerator(execContext, request, user, topicCode, topicId, sectionCode, sectionIndex);
        } else if (flashcardsType == 'date') {
            return new DateFCGenerator(execContext, request, user, topicCode, topicId, sectionCode, sectionIndex);
        } else if (flashcardsType == 'graph') {
            return new HistoricalGraphGenerator(execContext, request, user, topicCode, topicId, sectionCode, sectionIndex);
        }

        throw new Error(`Flashcards type ${flashcardsType} is not supported`);
    }
}
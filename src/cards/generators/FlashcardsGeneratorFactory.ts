import { ExecutionContext } from "toto-api-controller/dist/model/ExecutionContext";
import { FlashcardsGenerationOrchestrator } from "../FlashcardsGenerationOrchestrator";
import { DateFCGenerator } from "./DateFCGenerator";
import { HistoricalGraphGenerator } from "./HistoricalGraphGenerator";
import { MultipleOptionsFCGenerator } from "./MultipleOptionsFCGenerator";
import { SectionTimelineFCGenerator } from "./SectionTimelineFCGenerator";
import { Request } from "express";
import { FlashcardsGenerator } from "./IFlashcardsGenerator";

export class FlashcardsGeneratorFactory {

    static getGenerator(execContext: ExecutionContext, request: Request, user: string, topicCode: string, topicId: string, sectionCode: string, flashcardsType: string): FlashcardsGenerator {

        if (flashcardsType == 'options') {
            return new MultipleOptionsFCGenerator(execContext, request, user, topicCode, topicId, sectionCode);
        } else if (flashcardsType == 'timeline') {
            return new SectionTimelineFCGenerator(execContext, request, user, topicCode, topicId, sectionCode);
        } else if (flashcardsType == 'date') {
            return new DateFCGenerator(execContext, request, user, topicCode, topicId, sectionCode);
        } else if (flashcardsType == 'graph') {
            return new HistoricalGraphGenerator(execContext, request, user, topicCode, topicId, sectionCode);
        }

        throw new Error(`Flashcards type ${flashcardsType} is not supported`);
    }
}
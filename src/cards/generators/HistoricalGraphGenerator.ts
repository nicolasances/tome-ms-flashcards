import { ExecutionContext } from "toto-api-controller/dist/model/ExecutionContext";
import { LLMAPI, LLMPromptResponse } from "../../api/LLMAPI";
import { Request } from "express";
import { HistoricalGraphFC } from "../model/HistoricalGraphFC";
import { FlashcardsGenerator } from "./IFlashcardsGenerator";
import { LLMFacade } from "../../util/LLMFacade";
import { SectionClassificationPrompt } from "./prompts/SectionClassification";
import { GraphBuilderPrompt } from "./prompts/GraphBuilder";
import { GraphQuestionsBuilder } from "./prompts/GraphQuestionsBuilder";

export class HistoricalGraphGenerator implements FlashcardsGenerator {

    execContext: ExecutionContext;
    authHeader: string;
    user: string;
    topicCode: string;
    topicId: string;
    sectionCode: string;
    sectionIndex: number;
    request: Request;

    constructor(execContext: ExecutionContext, request: Request, user: string, topicCode: string, topicId: string, sectionCode: string, sectionIndex: number) {
        this.execContext = execContext;
        this.request = request;
        this.authHeader = String(request.headers['authorization'] ?? request.headers['Authorization']);
        this.user = user;
        this.topicCode = topicCode;
        this.sectionCode = sectionCode;
        this.sectionIndex = sectionIndex;
        this.topicId = topicId;
    }

    static generation() {
        return "g3"
    }

    async generateFlashcards(corpus: string, llmRequestTrackingId: string): Promise<HistoricalGraphFC[]> {

        const logger = this.execContext.logger;
        const cid = this.execContext.cid;

        const llm = new LLMFacade(this.execContext, this.request);

        // 1. Classify the section and stop if the section his not appropriate for a graph flashcard
        const sectionClassification = await llm.invoke(new SectionClassificationPrompt(), corpus, llmRequestTrackingId);

        logger.compute(cid, `Section ${this.sectionCode} was classified as ${JSON.stringify(sectionClassification)}`)

        if (!sectionClassification.containsTimeline || sectionClassification.typeOfInfo != 'timeline' || sectionClassification.period != 'sequence') return [];

        // 2. Generate the graph
        const graph = await llm.invoke(new GraphBuilderPrompt({ topicId: this.topicId, topicCode: this.topicCode, sectionCode: this.sectionCode, sectionIndex: this.sectionIndex, user: this.user }), corpus, llmRequestTrackingId);

        if (!graph) return [];

        // 3. Generate questions in the graph
        const questions = await llm.invoke(new GraphQuestionsBuilder(graph), corpus, llmRequestTrackingId);

        logger.compute(cid, `Generated ${questions.length} questions for section ${this.sectionCode} of the graph`)

        graph.addQuestions(questions);

        return [graph];
    }

}
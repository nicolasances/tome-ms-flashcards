import { WithId } from "mongodb";
import { Card } from "../Card";
import { LLMPromptResponse } from "../../api/LLMAPI";


export class HistoricalGraphFC implements Card {

    id?: string | undefined;
    type: string = 'graph';
    topicId: string;
    topicCode: string;
    sectionCode: string;
    user: string;
    
    sectionTitle: string; 
    sectionShortTitle: string;

    // Fields specific to Historical Graphs
    graph: HistoricalGraph;

    // Model related
    llmName: string; 
    llmProvider: string;

    constructor(
        topicId: string,
        topicCode: string,
        sectionCode: string,
        user: string,
        sectionTitle: string,
        sectionShortTitle: string,
        graph: HistoricalGraph,
        llmName: string, 
        llmProvider: string,
        id?: string
    ) {
        this.topicId = topicId;
        this.topicCode = topicCode;
        this.sectionCode = sectionCode;
        this.user = user;
        this.sectionTitle = sectionTitle;
        this.sectionShortTitle = sectionShortTitle;
        this.graph = graph;
        this.llmName = llmName;
        this.llmProvider = llmProvider;
        if (id) {
            this.id = id;
        }
    }

    toBSON() {
        return {
            user: this.user,
            type: this.type,
            topicId: this.topicId,
            topicCode: this.topicCode,
            sectionCode: this.sectionCode,
            sectionTitle: this.sectionTitle,
            sectionShortTitle: this.sectionShortTitle,
            graph: this.graph,
            llmName: this.llmName,
            llmProvider: this.llmProvider,
        }
    }

    /**
     * Adds questions to the flashcard. 
     * Each question is added to the event that it belongs to, based on the event code.
     * There can be only one question per event.
     * @param questions The questions to add.
     */
    addQuestions(questions: Question[]): void {
        if (!this.graph || !this.graph.eventGraph || !this.graph.eventGraph.firstEvent) {
            throw new Error("Cannot add questions to a flashcard without an event graph.");
        }

        const addQuestionToEvent = (event: EventNode) => {
            const question = questions.find(q => q.eventCode === event.code);
            if (question) {
                event.question = question.question;
                event.answers = question.answers;
                event.correctAnswerIndex = question.correctAnswerIndex;
            }
            if (event.nextEvent) {
                addQuestionToEvent(event.nextEvent);
            }
        };

        addQuestionToEvent(this.graph.eventGraph.firstEvent);
    }

    static fromLLMResponse(llmResponse: LLMPromptResponse, topicId: string, topicCode: string, sectionCode: string, user: string): HistoricalGraphFC {

        return new HistoricalGraphFC(
            topicId, topicCode, sectionCode, user,
            llmResponse.value.title,
            llmResponse.value.shortTitle,
            HistoricalGraph.fromLLMResponse(llmResponse),
            llmResponse.llmName,
            llmResponse.llmProvider
        )
    }

    static fromBSON(bson: WithId<any>): HistoricalGraphFC {
        return new HistoricalGraphFC(
            bson.topicId,
            bson.topicCode,
            bson.sectionCode,
            bson.user,
            bson.sectionTitle,
            bson.sectionShortTitle,
            bson.graph,
            bson.llmName,
            bson.llmProvider,
            bson._id.toHexString()
        );
    }

}

class HistoricalGraph {

    summary: string; 
    eventGraph: EventGraph;
    facts: Fact[];

    constructor(summary: string, eventGraph: EventGraph, facts: Fact[]) {
        this.summary = summary;
        this.eventGraph = eventGraph;
        this.facts = facts;
    }

    static fromLLMResponse(llmResponse: LLMPromptResponse): HistoricalGraph {
        return new HistoricalGraph(
            llmResponse.value.summary,
            llmResponse.value.eventGraph,
            llmResponse.value.facts
        );
    }

}

interface EventGraph {
    firstEvent: EventNode; // The first event in the graph
}

interface EventNode {
    code: string; // Unique code for the event
    event: string;
    reason: string | null; // Reason for the event, if mentioned
    date: string | null; // Date in a specific format
    dateFormat: string | null; // e.g. "YYYY-MM-DD", "MM-DD", "DD-MM"
    nextEvent: EventNode | null;
    question: string; 
    answers: string[]; // Array of answers, only one is correct
    correctAnswerIndex: number; // Index of the correct answer in the answers array
    link?: "causal" | "chronological"; // Link type with the previous event in the graph, if applicable
}

interface Fact {
    fact: string; 
    eventCode: string | null; // Code of the event this fact is connected to, or null if not related to any event
    linkReason: string | null; // Reason for the link to the specified event, if applicable
}

interface Question {
    eventCode: string; // Code of the event this question is related to
    question: string; 
    answers: string[]; // Array of answers, only one is correct
    correctAnswerIndex: number; // Index of the correct answer in the answers array
}
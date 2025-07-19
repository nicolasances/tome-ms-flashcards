import { WithId } from "mongodb";
import { Card } from "./Card";
import { Request } from "express";
import { ValidationError } from "toto-api-controller/dist/validation/Validator";

export class SectionTimelineFC implements Card {

    id?: string
    type: string = 'timeline'
    user: string
    topicId: string
    topicCode: string;

    sectionTitle: string; 
    events: SectionTimelineEvent[]; 


    constructor(
        user: string,
        topicId: string,
        topicCode: string,
        events: SectionTimelineEvent[],
        sectionTitle: string
    ) {
        this.user = user;
        this.topicId = topicId;
        this.topicCode = topicCode;
        this.events = events;
        this.sectionTitle = sectionTitle;
    }

    toBSON() {
        return { user: this.user, type: this.type, topicId: this.topicId, topicCode: this.topicCode, events: this.events, sectionTitle: this.sectionTitle }
    }

    /**
     * Shuffle the events array randomly.
     */
    shuffleEvents(): void {

        for (let i = this.events.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.events[i], this.events[j]] = [this.events[j], this.events[i]];
        }

    }

    static fromRequest(req: Request, user: string): SectionTimelineFC {

        const body = req.body;

        // Validate mandatory fields
        if (!body.topicCode) throw new ValidationError(400, "No topic code provided");
        if (!body.topicId) throw new ValidationError(400, "No topic id provided");
        if (!body.events) throw new ValidationError(400, "No events provided");
        if (!body.sectionTitle) throw new ValidationError(400, "No title provided");

        return new SectionTimelineFC(user, body.topicId, body.topicCode, body.events, body.sectionTitle)

    }

    static fromBSON(bson: WithId<any>): SectionTimelineFC {

        const card = new SectionTimelineFC(bson.user, bson.topicId, bson.topicCode, bson.events, bson.sectionTitle);
        card.id = bson._id.toHexString()

        return card

    }

}

export interface SectionTimelineEvent {

    event: string;
    date: string; 
    dateFormat: string;
    real: boolean;
    order: number;

}
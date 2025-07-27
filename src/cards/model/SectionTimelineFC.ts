import { WithId } from "mongodb";
import { Card } from "../Card";
import { Request } from "express";
import { ValidationError } from "toto-api-controller/dist/validation/Validator";

export class SectionTimelineFC implements Card {

    id?: string
    type: string = 'timeline'
    user: string
    topicId: string
    topicCode: string;
    sectionCode: string;

    sectionTitle: string; 
    sectionShortTitle: string;
    events: SectionTimelineEvent[]; 


    constructor(
        user: string,
        topicId: string,
        topicCode: string,
        sectionCode: string, 
        events: SectionTimelineEvent[],
        sectionTitle: string,
        sectionShortTitle: string
    ) {
        this.user = user;
        this.topicId = topicId;
        this.topicCode = topicCode;
        this.sectionCode = sectionCode;
        this.events = events;
        this.sectionTitle = sectionTitle;
        this.sectionShortTitle = sectionShortTitle;
    }

    toBSON() {
        return { user: this.user, type: this.type, topicId: this.topicId, topicCode: this.topicCode, sectionCode: this.sectionCode, events: this.events, sectionTitle: this.sectionTitle, sectionShortTitle: this.sectionShortTitle };
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
        if (!body.sectionCode) throw new ValidationError(400, "No section code provided");
        if (!body.sectionShortTitle) throw new ValidationError(400, "No section short title provided");

        return new SectionTimelineFC(user, body.topicId, body.topicCode, body.sectionCode, body.events, body.sectionTitle, body.sectionShortTitle)

    }

    static fromBSON(bson: WithId<any>): SectionTimelineFC {

        const card = new SectionTimelineFC(bson.user, bson.topicId, bson.topicCode, bson.sectionCode, bson.events, bson.sectionTitle, bson.sectionShortTitle);
        card.id = bson._id.toHexString()

        return card

    }

}

export interface SectionTimelineEvent {

    event: string;
    date: string; 
    dateFormat: string;
    correctIndex: number;

}
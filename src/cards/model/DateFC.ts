import { WithId } from "mongodb";
import { Card } from "../Card";

export class DateFC implements Card {

    id?: string
    type: string = 'date'
    user: string
    topicId: string
    topicCode: string;
    sectionCode: string;
    sectionTitle: string;
    sectionShortTitle: string;

    question: string;
    correctYear: number;


    constructor(
        user: string,
        topicId: string,
        topicCode: string,
        sectionCode: string,
        sectionTitle: string,
        sectionShortTitle: string,
        question: string,
        correctYear: number
    ) {
        this.user = user;
        this.topicId = topicId;
        this.topicCode = topicCode;
        this.sectionCode = sectionCode;
        this.sectionTitle = sectionTitle;
        this.sectionShortTitle = sectionShortTitle;
        this.question = question;
        this.correctYear = correctYear;
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
            question: this.question, 
            correctYear: this.correctYear, 
        };
    }

    static fromBSON(bson: WithId<any>): DateFC {

        const card = new DateFC(bson.user, bson.topicId, bson.topicCode, bson.sectionCode, bson.sectionTitle, bson.sectionShortTitle, bson.question, bson.correctYear);
        card.id = bson._id.toHexString()

        return card

    }

}

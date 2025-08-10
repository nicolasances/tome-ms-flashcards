import moment from "moment-timezone";


export class FCGenerationLogEntry {

    topicId: string;
    topicCode: string;
    sectionCode: string;
    flashcardType: string;

    timestamp: string;      // formatted YYYY.MM.DD HH:mm:ss
    cid: string;

    trackingId: string;     // Extra id that can be used to track requests in logs (i.e. a request Id)

    eventType: EventType;

    constructor(topicId: string, topicCode: string, sectionCode: string, flashcardType: string, eventType: EventType, cid: string, trackingId: string) {
        this.topicId = topicId;
        this.topicCode = topicCode;
        this.sectionCode = sectionCode;
        this.flashcardType = flashcardType;
        this.eventType = eventType;
        this.cid = cid;
        this.trackingId = trackingId;
        this.timestamp = moment().tz("Europe/Rome").format("YYYY.MM.DD HH:mm:ss");
    }

    toBSON() {
        return {
            topicId: this.topicId,
            topicCode: this.topicCode,
            sectionCode: this.sectionCode,
            flashcardType: this.flashcardType,
            timestamp: this.timestamp,
            cid: this.cid,
            trackingId: this.trackingId,
            eventType: this.eventType
        };
    }

}

export type EventType =
    "genRequestedEventSent" |
    "llmRequestSent" |
    "llmResponded" |
    "fcSaved" |
    "fcCreatedEventSent"
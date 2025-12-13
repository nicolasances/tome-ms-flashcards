import { TotoAPIController } from "toto-api-controller";
import { ControllerConfig } from "./Config";
import { PostFlashcard } from "./dlg/PostFlashcard";
import { OnTopicEvent } from "./evt/OnTopicEvent";
import { GetFlashcards } from "./dlg/GetFlashcards";
import { GenerateFlashcards } from "./dlg/GenerateFlashcards";
import { OnFlashcardsEvent } from "./evt/OnFlashcardsEvent";
import { GetFlashcardTypes } from "./dlg/GetFlashcardTypes";
import { GetLatestFlashcardsGeneration } from "./dlg/GetLatestFlashcardsGeneration";
import { GetTrackingEvents } from "./dlg/tracking/GetTrackingEvents";

const api = new TotoAPIController("tome-ms-flashcards", new ControllerConfig())

api.path('POST', '/flashcards', new PostFlashcard())
api.path('GET', '/flashcards', new GetFlashcards())

api.path('GET', '/flashcardtypes', new GetFlashcardTypes());

api.path('POST', '/corpus/flashcards', new GenerateFlashcards());
api.path('GET', '/generation/latest', new GetLatestFlashcardsGeneration());

api.path('POST', '/events/flashcards', new OnFlashcardsEvent())
api.path('POST', '/events/topic', new OnTopicEvent())

api.path('GET', '/topics/:topicId/events', new GetTrackingEvents());

api.init().then(() => {
    api.listen()
});
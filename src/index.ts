import { TotoAPIController } from "toto-api-controller";
import { ControllerConfig } from "./Config";
import { PostFlashcard } from "./dlg/PostFlashcard";
import { TestFlashcardsGenerator } from "./dlg/TestFlashcardsGenerator";

const api = new TotoAPIController("tome-ms-flashcards", new ControllerConfig())

api.path('POST', '/flashcards', new PostFlashcard())

api.path('POST', '/test/fcgenerator', new TestFlashcardsGenerator())

api.init().then(() => {
    api.listen()
});
import { DateFCGenerator } from "../cards/generators/DateFCGenerator";
import { MultipleOptionsFCGenerator } from "../cards/generators/MultipleOptionsFCGenerator";
import { SectionTimelineFCGenerator } from "../cards/generators/SectionTimelineFCGenerator";

export function getFlashcardsGeneration() {
    return `${SectionTimelineFCGenerator.generation()}-${MultipleOptionsFCGenerator.generation()}-${DateFCGenerator.generation()}`;
}
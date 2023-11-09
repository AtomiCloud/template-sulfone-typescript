import {ProcessorOutput, StartProcessorWithLambda} from "@atomicloud/cyan-sdk";

StartProcessorWithLambda(async (i, fileHelper): Promise<ProcessorOutput> => {

    return {
        directory: i.writeDir,
    }
});

import {StartPluginWithLambda} from "@atomicloud/cyan-sdk";

StartPluginWithLambda(async (i) => {
    return {
        directory: i.directory,
    }
});

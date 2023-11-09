import {Cyan, StartTemplateWithLambda} from "@atomicloud/cyan-sdk";


StartTemplateWithLambda(async (inquirer, determinism): Promise<Cyan> => {

  const hello = await inquirer.text("hello?");

  return {
      {{processors}},
      {{plugins}},
  } as Cyan;

});

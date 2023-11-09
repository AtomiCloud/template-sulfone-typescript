import {
  Cyan,
  GlobType,
  QuestionType,
  StartTemplateWithLambda,
} from "@atomicloud/cyan-sdk";
import isEmail from "validator/lib/isEmail";
import isURL from "validator/lib/isURL";
import validator from "validator";
import isInt = validator.isInt;

const usernameValidator = (type: string) => (input: string) => {
  if (input.length < 1 || input.length > 256) {
    return `${type} must be between 1 and 256 characters`;
  }
  if (!input.match(/^[a-z](\-?[a-z0-9]+)*$/)) {
    return `${type} can only contain alphanumeric characters and dashes, and cannot end or start with dashes or numbers`;
  }
  return null;
};

const referenceValid = (input: string) => {
  let fullRef = input;

  if (input.includes(":")) {
    if (input.split(":").length !== 2) {
      return "Invalid reference, can only have one colon";
    }
    const [fullref, version] = input.split(":");
    if (!isInt(version, { min: 0 })) {
      return "Invalid reference, version must be a positive integer";
    }
    fullRef = fullref;
  }

  const parts = fullRef.split("/");
  if (parts.length !== 2) {
    return "Invalid reference, must be in the format username/template or username/template:version";
  }
  const [username, template] = parts;
  const usernameError = usernameValidator("Reference username")(username);
  if (usernameError) return usernameError;
  const templateError = usernameValidator("Reference template")(template);
  if (templateError) return templateError;
  return null;
};

StartTemplateWithLambda(async (inquirer, determinism): Promise<Cyan> => {
  const cyanType = await inquirer.select("What do you want to create?", [
    "Template",
    "Plugin",
    "Processor",
  ]);

  const username = await inquirer.text({
    message: "CyanPrint username",
    desc: "You can find it in your profile in https://cyanprint.dev",
    type: QuestionType.Text,
    validate: usernameValidator("Username"),
  });

  const name = await inquirer.text({
    message: "Template name",
    desc: "Unique name under your account",
    type: QuestionType.Text,
    validate: usernameValidator("Template"),
  });

  const description = await inquirer.text({
    message: `${cyanType} description`,
    desc: `Short description of your ${cyanType.toLowerCase()}`,
    type: QuestionType.Text,
  });

  const tags: string[] = [];
  let cont = (await inquirer.select("Add a tag?", ["yes", "no"])) === "yes";
  while (cont) {
    const tag = await inquirer.text({
      message: "Tag to add",
      type: QuestionType.Text,
      validate: usernameValidator("Tag"),
    });
    tags.push(tag);
    cont = (await inquirer.select("Add a tag?", ["yes", "no"])) === "yes";
  }

  const email = await inquirer.text({
    message: "Email",
    desc: "Your email",
    type: QuestionType.Text,
    validate: (e) => (isEmail(e) ? null : "Invalid email"),
  });

  const project = await inquirer.text({
    message: "Project URL",
    desc: "Valid URL to this project's site",
    type: QuestionType.Text,
    validate: (url) =>
      isURL(url, { require_protocol: true }) ? null : "Invalid URL",
  });

  const source = await inquirer.text({
    message: "Source URL",
    desc: "Valid URL to this project source code",
    type: QuestionType.Text,
    validate: (url) =>
      isURL(url, { require_protocol: true }) ? null : "Invalid URL",
  });

  const processors: string[] = [];
  const plugins: string[] = [];
  if (cyanType === "Template") {
    let procCont =
      (await inquirer.select("Add a processor?", ["yes", "no"])) === "yes";
    while (procCont) {
      const proc = await inquirer.text({
        message: "Processor to add",
        type: QuestionType.Text,
        validate: referenceValid,
      });
      processors.push(proc);
      procCont =
        (await inquirer.select("Add a processor?", ["yes", "no"])) === "yes";
    }

    let plugCont =
      (await inquirer.select("Add a plugin?", ["yes", "no"])) === "yes";
    while (plugCont) {
      const proc = await inquirer.text({
        message: "Plugin to add",
        type: QuestionType.Text,
        validate: referenceValid,
      });
      processors.push(proc);
      plugCont =
        (await inquirer.select("Add a plugin?", ["yes", "no"])) === "yes";
    }
  }

  const excludes: Set<string> = new Set([
    "cyanprint/{{templateIndex}}.ts",
    "cyanprint/{{pluginIndex}}.ts",
    "cyanprint/{{processorIndex}}.ts",
    "{{pluginCyan}}.yaml",
    "{{processorCyan}}.yaml",
    "{{templateCyan}}.yaml",
  ]);
  if (cyanType === "Template") {
    excludes.delete("cyanprint/{{templateIndex}}.ts");
    excludes.delete("{{templateCyan}}.yaml");
  }

  if (cyanType === "Plugin") {
    excludes.delete("cyanprint/{{pluginIndex}}.ts");
    excludes.delete("{{pluginCyan}}.yaml");
  }
  if (cyanType === "Processor") {
    excludes.delete("cyanprint/{{processorIndex}}.ts");
    excludes.delete("{{processorCyan}}.yaml");
  }

  return {
    processors: [
      {
        name: "kirinnee/dotnet-handlebar:11",
        files: [
          {
            glob: "**/*.*",
            type: GlobType.Template,
            exclude: ["cyan/**/*.*", "cyan.yaml", ".github/workflows/publish.yaml", ...excludes],
          },
        ],
        config: {
          vars: {
            publish: "cyan_publish",
            pluginCyan: "cyan",
            processorCyan: "cyan",
            templateCyan: "cyan",
            templateIndex: "index",
            pluginIndex: "index",
            processorIndex: "index",
            username,
            name,
            desc: description,
            tags: JSON.stringify(tags),
            email,
            project,
            source,
            processors:
              cyanType === "Template"
                ? `processors: ${JSON.stringify(processors)}`
                : "",
            plugins:
              cyanType === "Template"
                ? `plugins: ${JSON.stringify(plugins)}`
                : "",
          },
        },
      },
    ],
    plugins: [],
  } as Cyan;
});

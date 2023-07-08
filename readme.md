# Translator
Make translations with ease

## Requirements
- NodeJS 16+
- npm (if you want to install cli tool)

## Installing
1. Clone this repository
2. Install using ``npm`` command: ``npm install -g ./translator/``

## Using Translator
> If you are using Translator directly instead of installing it, you'll have to replace ``translator`` prefix with ``node path/to/translator/dist/cli.js``

```sh
# Build language file
translator myLang.lang
cat myLang.json

# Build from configuration
# Configuration allow you to set target version and multiple language files
# {"include": ["myLang.lang"], "outputDirectory": "./compile"}
translator project.json
cat compile/myLang.json
```

## Syntax
```
// Comment line
/* Comment block */

import "./localFile.lang";
import "./compiledFile.json";

example.key "Simple entry";
example.arguments(arg1, arg2) "Argument 2 is " arg2 " and argument 1 is " arg1;
```
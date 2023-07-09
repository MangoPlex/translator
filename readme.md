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
# Configuration allow you to build multiple language files at once
# {"include": ["myLang.lang"], "outputDirectory": "./compile"}
translator project.json
cat compile/myLang.json
```

## Syntax
### Basic
```translator
// This is single-line comment.
/* This is comment block */

my.key "Translation for key 'my.key'";
my.emptykey; // Empty key
```

### Importing from other files
```translator
import "./path/to/file.lang";
import './path/to/file.lang'; // Single quote
```

### Namespaces
#### "Declarative" syntax
```translator
namespace myglobal.namespace;
key "The key for this is myglobal.namespace.key";

// Note: You should only use this syntax once for each file.
// A check that prevents you from adding this multiple times will be implemented in a future.
```

#### Nested syntax
```translator
namespace mynamespace {
    key "The key is mynamespace.key";

    namespace child {
        key "The key is mynamespace.child.key";
    }
}
```

#### Mixed
Of course, you can mix those 2 into a single file:

```translator
namespace myglobal;

namespace coolnamespace {
    key "myglobal.coolnamespace";
}

namespace anotherns {
    key "myglobal.anotherns";

    namespace child {
        key "myglobal.anotherns.child.key";
    }
}
```
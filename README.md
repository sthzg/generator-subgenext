# generator-subgenext

[![npm version](https://badge.fury.io/js/generator-subgenext.svg)](https://badge.fury.io/js/generator-subgenext)
[![Gitter](https://badges.gitter.im/sthzg/generator-subgenext.svg)](https://gitter.im/sthzg/generator-subgenext?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge) 
[![Build Status](https://travis-ci.org/sthzg/generator-subgenext.svg?branch=develop)](https://travis-ci.org/sthzg/generator-subgenext) 
[![Coverage Status](https://coveralls.io/repos/github/sthzg/generator-subgenext/badge.svg?branch=develop)](https://coveralls.io/github/sthzg/generator-subgenext?branch=develop) 
[![Dependency Status](https://david-dm.org/sthzg/generator-subgenext.svg)](https://david-dm.org/sthzg/generator-subgenext) 
[![devDependency Status](https://david-dm.org/sthzg/generator-subgenext/dev-status.svg)](https://david-dm.org/sthzg/generator-subgenext#info=devDependencies)

## Installation

```sh
npm install -g generator-subgenext
```

As this project doesn't make a whole lot of sense without a host 
generator, let's install `generator-react-webpack` for demo purposes. 
However, any Yeoman generator will do.

```sh
npm install -g generator-react-webpack@beta
mkdir -p ~/my-stuff/some-project && cd $_
yo react-webpack
```
 
 **Example**: Let's try installing an external subgen: 
 [contrib-subgen-react-webpack-container](https://www.npmjs.com/package/contrib-subgen-react-webpack-container).
 
 ```sh
 # Change into the project directory and install the subgen globally or locally
cd ~/my-stuff/some-project && cd $_
npm install -g contrib-subgen-react-webpack-container

# Search for available subgens (note: see below how to put the hostgen's name into .yo-rc.json to skip typing it)
yo subgenext --host=react-webpack
# ✔ Found 1 sub generator for generator-react-webpack (4.0.1-1)
#   1  contrib-subgen-react-webpack-container  0.0.3  Host dependency satisfied: >=4.0.1-1  (not activated)

# Activate it
yo subgenext:activate container --host=react-webpack
# ? I will create a symlink
# from =>	/Users/sthzg/.nvm/versions/node/v6.2.2/lib/node_modules/contrib-subgen-react-webpack-container/generators/container
# in =>	/Users/sthzg/.nvm/versions/node/v6.2.2/lib/node_modules/generator-react-webpack/generators/container
# Confirm to proceed: Yes
# ✔ Activated container!

# Try it out
yo react-webpack:container demo --component --nostyle
# create src/components/DemoContainer.js
# create test/components/DemoContainerTest.js
# create src/components/Demo.js
# create test/components/DemoTest.js

# That was nice, get rid of it
yo subgenext:deactivate container
# ? I will remove this symlink
# => /Users/sthzg/.nvm/versions/node/v6.2.2/lib/node_modules/generator-react-webpack/generators/container
# Confirm to proceed: Yes
# ✔ Deactivated container!
 ```
 
The only interesting thing to take away from here is, how the contents 
of an external npm package become available as a sub generator in 
another, possibly third party host generator.
 
### User Configuration

**Configuration**

You can add subgen configuration in your [`.yo-rc.json`](http://yeoman.io/authoring/storage.html).

**Supported config props**

`defaultHost`  
  if you omit the `--host` option on the command line it will fall back to using `defaultHost`

```json
{
  "generator-subgenext": {
    "defaultHost": "foobar"
  }
}
```


## Authoring External Subgens
 
[TODO]


### Authoring Configuration

Extgen authors can add a value for `generator-subgenext` into the 
extgen's `package.json`. Values inside this object will be considered 
for certain, supported authoring based config values.

**Supported config props**

`namespace`  
  A string added in namespace will be prepended while activating the extgen. 
  This is helpful when you want to group subgens provided by your package 
  under a namespace. If your package provides a subgen named `container` 
  and your `namespace` is set to `addons`, the activated subgen will 
  become available as `yo host_gen:addons-container`.


## Background

### Feature vs. Implementation

It is often desirable to add custom sub generators (subgens) to an
existing generator. Currently, you have the option to compose your own
generator with others, but stacking generators on top of each other
doesn't allow for modularity under one namespace.

Feature and implementation can be seen as two independent aspects. Maybe
the proposed feature in general is useful but the implementation is poor
or, less likely, the other way around ;)

We put a writeup of three approaches to achieve the goal to the [Wiki
Home](https://github.com/sthzg/generator-subgenext/wiki), and [The Fully
Integrated Happy
Path](https://github.com/sthzg/generator-subgenext/wiki/The-Fully-Integrated-Happy-Path)
describes what probably would be the nicest way to go.

However, since we wanted to showcase this idea with a proof-of-concept
that works without anyone (users or gen-authors) to change anything, we
start by implementing it in a way that doesn't require changes to Yo
core repositories or existing generators.

**The rest of the readme deals w/ describing the current approach, [https://github.com/sthzg/generator-subgenext/wiki/How-to-Setup-a-Manual-Playground](https://github.com/sthzg/generator-subgenext/wiki/How-to-Setup-a-Manual-Playground) shows how to setup the status quo on your local machine.**

### Motivation

**Modularity**

It often would be great to maintain one barebones umbrella generator and
inject subgens from individual npm packages. With `composeWith` we have
the oportunity to let different generators interact with one another
during the Yeoman run loop, but semantically we always ship a new
generator that provides its features under its own namespace.

The main aspect that this idea should enable is putting the subgenerator
into the center of development and transforming the host generator to an
open hub that the user can dock an arbitary number of subgens (core and
contributed) onto. On top of this modularity it would allow different
maintainers to contribute to different areas of a generator-domain while
still publishing under the umbrella of the host generator.

**Use Case 1**

I use `generator-x` and and want an additional subgen, that is a) either
specific to a current project or b) their maintainers simply do not wish
to include. The subgen may need to interact with other subgens from the
host generator (e.g. by invoking them programmatically and modifying the
generated source after they ran)

**Use Case 2**

I provide a generator operating on a large and multifaceted domain. It
becomes obvious that one monolithic package shouldn't provide
sub-generators that cover all the options available (think of the
Webpack and React ecosystem with its endless variaions of loaders, flux
implementations, routers, etc.). Subgens on a plugin-base could ease
this versatility by splitting responsibilities to a larger community
that would still be able to ship under one unique generator namespace.

**Use Case 3**

I am working on experimental features of a generator that should already
be accessible to early adopters, but are a) not ready to be merged into
core or b) may still be denied adoption at all.


## Testing

To invoke the test suite run:

```sh
npm run test
```

## License

![MIT](https://img.shields.io/badge/License-MIT-blue.svg)

# Yo External Sub Generators – RFC

[![Gitter](https://badges.gitter.im/sthzg/generator-subgenext.svg)](https://gitter.im/sthzg/generator-subgenext?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge)

It is often desirable to add custom sub generators (subgens) to an existing generator. Currently, you have the option to compose your own generator with others, but stacking generators on top of each other doesn't allow for modularity under one namespace (unless I failed to realize an important concept about it).

> Feature and implementation can be seen as two independent aspects. Maybe the proposed feature in general is useful but the implementation is poor or, less likely, the other way around ;)

**Modularity**

It would be great to maintain one umbrella generator and inject subgens as individual npm packages. With `composeWith` we have the oportunity to let the Yeoman run loop of different generators interact with one another, but semantically we always ship a new generator that provides its features under its own namespace.

The main aspect that this idea should enable is putting the subgenerator into the center of development and transform the main generator to an open hub that the user can dock an arbitary number of subgens (core and contributed) onto.

**Practical Use Case**

I use `generator-x` and and want an additional subgen, that is a) either specific to a current project or b) their maintainers simply do not wish to include. The subgen may need to interact with other subgens from the host generator (e.g. by invoking them programmatically and modifying the generated source after they ran)

So I start writing the generator and copy or link it to the host generator. I wonder if, with a bit of formalization, this may be become useful and automated infrastructure.

**Organization**

```
node_modules/
    (1) generator-x/
        package.json
        generators/
        ...
    (2) subgen-generator-x-foo
        package.json
        generators/
        ...
    (3) contrib-subgen-generator-x-bar
        package.json
        generators/
        ...
    
```

Legend
```
(1)     generator-x                        host generator, probably not yours  
(2)     subgen-generator-x-foo             an 'official' subgen, maintained by the gen maintainers  
(3)     contrib-subgen-generator-x-bam     a subgen for generator-x, developed by anyone
```

`(2)` and `(3)` are separate npm packages where the `subgen` and `contrib-subgen` prefixes are a naming convention.


**User interface**

```sh
npm i generator-x
npm i generator-subgenext
npm i subgen-generator-x-foo
npm i contrib-subgen-generator-x-bam
npm i subgen-generator-x-hameggs

yo subgenext:scan --host=x
# Found 3 external sub generators
# (1)  subgen-generator-x-foo      (compatible)   (not activated)
# (2)  subgen-generator-x-hameggs  (incompatible)
# (3)  contrib-generator-x-bam     (compatible)   (not activated)
# To activate a generator run yo:subgenext activate <subgen-name>
  
yo subgenext:activate subgen-generator-x-foo --host=x
# ✓ sub generator is compatible with host generator
# ✓ linking sub generator to host generator
# ✓ All Done!

yo subgenext:deactivate subgen-generator-x-foo --host=x
# ✓ unlinking sub generator from host generator
# ✓ All Done!
```

* scanning for subgens is based on the package name prefix.
* activating / deactivating an external subgen needs to write the host generator's `package.json`'s `file` property
* checking subgen compatiblity should be done through npm's api, the information for supported host generators should be taken from the subgen's `package.json`
* further bookkeeping (which subgens are activated) could be achieved through an additional dotfile. This may obsolete the `--host=x` option and may enable host-generator updates that remember which subgens they should try to reactivate after the update (no mvp-feature)
* the initial implementation may support one generator per package, but providing multiple subgens per external package should be supported later

The drafted user interface achieves logic through a separate generator (`generator-subgenext`). It is proposed since it doesn't demand Yeoman's maintainers to approve the idea but can be developed to a stable state individually. If, however, the idea sounds interesting it could also be implemented into the yo cli and thus, enable seamless integration. (e.g. `yo subgenext scan`, etc.).

##subgenext.json##

You can add a `subgenext.json` file to the root dir of you project to add external configuration.

**Supported config props**

`defaultHost`  
  if you omit the `--host` option on the command line it will fall back to using `defaultHost`

```json
{
  "defaultHost": "x"
}
```

##Caveats##

* The current way this generator looks up packages requires the host generator to be a (peer)dependency and all installed subgens to be (dev)dependencies in your `package.json`. There should be enough room for improvements.
* Initial development in this `proof-of-concept` branch works with locally installed generators. At a later stage I'd like to inspect if and what is necessary to respect globally installed generators as well.

# Yo External Sub Generators – RFC

It is often desirable to add custom sub generators (subgens) to an existing generator. Currently, you have the option to compose your own generator with others, but stacking generators on top of each other doesn't allow for horizontal modularity (unless I failed to realize an important fact about it).

**Practical Use Case**

I use `generator-x` and and want an additional subgen, that is a) either specific to a current project or b) their maintainers simply do not wish to include. The subgen may need to interact with other subgens from the host generator (e.g. by invoking them programmatically and modifying the generated source after they ran)

So I start writing the generator and copy or link it to the host generator. I wonder if, with a bit of formalization around this, it could become useful infrastructure.

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
npm i subgen-generator-x-foo
npm i contrib-subgen-generator-x-bam
npm i subgen-generator-x-hameggs

yo x:subgenext scan
# Found 3 external sub generators
# (1)  subgen-generator-x-foo      (compatible)   (not activated)
# (2)  subgen-generator-x-hameggs  (incompatible)
# (3)  contrib-generator-x-bam     (compatible)   (not activated)
# To activate a generator run yo:subgenext activate <subgen-name>
  
yo x:subgenext activate subgen-generator-x-foo
# ✓ sub generator is compatible with host generator
# ✓ linking sub generator to host generator
# ✓ All Done!

yo x:subgenext deactivate subgen-generator-x-foo
# ✓ unlinking sub generator from host generator
# ✓ All Done!
```

* scanning for subgens is based on the package name prefix.
* activating / deactivating an external subgen needs to write the host generator's `package.json`'s `file` property
* checking subgen compatiblity should be done through npm's api, the information for supported host generators should be taken from the subgen's `package.json`
* further bookkeeping (which subgens are activated) could be achieved through an additional dotfile and may enable host-generator updates that remember which subgens they should try to reactivate after the update (no mvp-feature)
* the initial implementation may support one generator per package, but providing multiple subgens per external package should be supported later

The drafted user interface achieves logic through a subgen (subgenext), that the host generator could opt-in to use. It is proposed since it doesn't demand Yeoman's maintainers to approve the idea but can be developed to a stable state individually. If, however, the idea sounds interesting it could also be implemented into the yo cli and thus, enable seamless integration. (e.g. `yo subgenext scan`, etc.).

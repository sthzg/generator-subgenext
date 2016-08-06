2016-08-06
- <@sthzg> refactored subgen config to .yo-rc.json
- <@sthzg> added confirmation prompts before file operations in activate and deactivate

2016-07-08
- <@sthzg> added coveralls integration
- <@sthzg> refactored activate/deactivate to symlink/unlink
- <@sthzg> added coverage by running npm run test:covarage
- <@sthzg> added basic set of unit tests for utils.js
- <@stylesuxx> added immutable Message and Package records
- <@stylesuxx> added semver checks to list and activate command

2016-07-07
- <@sthzg> refactored test runner to Mocha
- <@sthzg> updated code styling in generator code to become refactoring-friendly
- <@sthzg> fixed prioritization of CLI option over config value

2016-07-06
- <@sthzg> refactored tasks to base package detection on `yeoman-environment`
- <@sthzg> added tape as npm run script

2016-07-04
- <@sthzg> added support for reading config from subgenext.json file
- <@sthzg> added support for defaultHost property in subgenext.json

# Contributing to Origo

Thank you for your interest in contributing to the Origo framework, we appreciate any contributions. Read through this document to make the process as seamless as possible. Also keep in mind that these are just guidelines and not set rules, so do not feel discouraged to contribute if you do not follow all the guidelines to the letter.

## Submitting bug reports or feature requests

Please use the [GitHub issue tracker](https://github.com/origo-map/origo/issues) for reporting bugs and feature requests. Before creating a new issue, do a search to see if the problem/request already has been posted by another user. We will always respond to incoming issues.

### Tips for creating a good bug report
 * Use a descriptive title.
 * Describe the steps you need to take in order to encounter the bug.
 * Explain what you expected to happen, and what happened instead.
 * What version of Origo were you using?
 * What operating system and web browser were you using?
 * Feel free to include screenshots or other relevant files.

### Feature requests
 * Can be completely new functionality, or improvement of some existing function.
 * Be comprehensive when you describe the new feature.
 * Motivate why the request should be added to Origo.

## Contributing code

With Origo we strive for modularity and flexibility. If you are interested in developing with Origo, take a look at [`README.md`](https://github.com/origo-map/origo/blob/master/README.md) to get going.

Read through the guidelines below before you start coding.

If you are planning to contribute code to the project, open a new issue describing what you intend to fix or add. You will get a response from at least one of the core developers who will let you know if you can go ahead and submit a [pull request](https://github.com/origo-map/origo/pulls). If your code is accepted by the core developers and is deemed to meet the guidelines, it will be merged.

### Pull request guidelines

Your pull request should:

 * Follow [Airbnb's JavaScript Style Guide](https://github.com/airbnb/javascript/tree/es5-deprecated/es5) for ECMAScript 5.

 * Target a single issue, or add single item of functionality to Origo.

 * Have accompanying documentation. Create a new [pull request](https://github.com/origo-map/api-documentation/pulls) in the api-documentation repository, with a link to the pull request you have created in Origo.

 * Use clear and concise commit messages.

 * Have commits that are logical, incremental and easy to follow. Use git rebase on your local code if needed to clean up the commit history, prior to creating the pull request.

 * Be able to merge without conflicts.

### Commit messages guidelines

We are using the same guidelines for commit messages as the [OpenLayers project](https://github.com/openlayers/ol3).

Commit messages should look like:

     Header line: explaining the commit in one line, no more than 50 characters

     Body of commit message is a few lines of text, explaining things
     in more detail, possibly giving some background about the issue
     being fixed, etc etc.

     The body of the commit message can be several paragraphs, and
     please do proper word-wrap and keep columns shorter than about
     74 characters or so. That way "git log" will show things
     nicely even when it's indented.

     Further paragraphs come after blank lines.

### Documentation guidelines

[Docbox](https://github.com/mapbox/docbox/) is used for the documentation. Details on how to get started can be found in the [api-documentation repository](https://github.com/origo-map/api-documentation/). Currently we do not have any specific guidelines for when it comes to writing the documentation. You can however take a look at some of the existing documentation to get a feel for the kind of style we are going for, for example the [controls documentation](https://github.com/origo-map/api-documentation/blob/master/content/controls.md/). Basically keep it short and simple, and preferably add a code example.

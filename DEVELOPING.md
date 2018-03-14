# Developing with Origo

## Language
Origo uses JavaScript ECMAScript 5, HTML5 and CSS3. Dependencies to other frameworks shall be avoided. Utilizing other libraries and components are however allowed. The ambition is to use smaller libraries as building blocks rather than building Origo into a big and complex framework such as ExtJS or AngularJS. When using third party libraries or components it is important to ensure that the license is compatible with the license for Origo, see the [license file](LICENSE.txt). 

Origo uses OpenLayers as map component and jQuery is used primarily for DOM manipulation. Development in Origo shall support versions according to package.json at GitHub. Origo shall support the most commonly used web browsers such as Internet Explorer 10-11, Edge, FireFox, Chrome and Safari. 

When developing, progressive enhancement is a encouraged strategy. That means that it is allowed to adopt new technology that may not be widely supported today but enhances the user experience in modern web browsers under the condition the functionality is not critical.

## JavaScript
Origo follows the [Airbnb's JavaScript Style Guide](https://github.com/airbnb/javascript/tree/es5-deprecated/es5) for EcmaScript 5 (ES5). Iterators shall be avoided according to the [guidelines for ES6](https://github.com/airbnb/javascript#iterators-and-generators). It might be a good idea to configure your text editor so that it adheres to the guidelines.

The ambition for Origo is modular development. To promote this the framework is using Browserify to just like in Node.js be able to load packages by requiring them according to CommonJS. That makes it possible to install modules through npm even for browsers. To accept a module in the framework it must be loadable with Browserify.

Server components are handled separately in the [Origo-server repository](https://github.com/origo-map/origo-server) and are not part of the Origo framework.

## HTML5
Origo uses [Handlebars.js](http://handlebarsjs.com/) as templating system to build more advanced and dynamic HTML pages.

## CSS
The [CSS/SASS guidelines from Airbnb](https://github.com/airbnb/css) shall be followed.

Origo uses SASS to enable modular development of CSS. That means changes and additions to CSS are made in .scss files only. When changes are made it must be verified they are not in conflict with existing css. 

The classes and IDs of CSS selectors shall have the prefix 'o-'.

Icons shall be in SVG format. New icons are preferably chosen from the Material Icons library or in the second hand the Font Awesome library that are available as SVG sprites in Origo. If other libraries are introduced, they shall also be available as SVG sprites.

Origo has responsive and mobile-friendly deisgn. Development shall follow and work with layouts for existing breakpoints defined in the Origo configuration file. Overall, media queries are not used to define breakpoints since they uses the browser size and not the map size. Instead Origo uses a type to mimic what is usually entitled 'element queries'. Code-wise the breakpoints are defined in a similar way as for media queries but limited to the breakpoints defined in the Origo configuration file.

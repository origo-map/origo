module.exports = {
  crossDomain: true,
  target: '#app-wrapper',
  svgSpritePath: 'css/svg/',
  svgSprites: ['fa-icons.svg', 'google-icons.svg', 'miscellaneous.svg', 'custom.svg'],
  breakPoints: {
    xs: [240, 320],
    s: [320, 320],
    m: [500, 500],
    l: [768, 500]
  },
  breakPointsPrefix: 'o-media',
  defaultControls: [
    {
      "name": "scaleline"
    },
    {
      "name": "zoom"
    },
    {
      "name": "rotate"
    },
    {
      "name": "attribution"
    }
  ]
}

export default function pageTemplate({
  descriptionComponent,
  printMapComponent,
  titleComponent,
  footerComponent
}) {
  return `
  ${titleComponent.render()}
  ${printMapComponent.render()}
  ${descriptionComponent.render()}
  ${footerComponent.render()}
`;
}

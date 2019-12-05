export default function pageTemplate({
  descriptionComponent,
  printMapComponent,
  titleComponent
}) {
  return `
  ${titleComponent.render()}
  ${printMapComponent.render()}
  ${descriptionComponent.render()}
`;
}

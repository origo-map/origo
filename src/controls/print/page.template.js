export default function pageTemplate({
  descriptionComponent,
  printMapComponent,
  titleComponent,
  createdComponent
}) {
  return `
  ${titleComponent.render()}
  ${printMapComponent.render()}
  ${descriptionComponent.render()}
  ${createdComponent.render()}
`;
}

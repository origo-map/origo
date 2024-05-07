export default `<div id="o-editor-toolbar" class="o-editor-toolbar o-toolbar o-toolbar-horizontal o-padding-horizontal-8 o-rounded-top o-hidden">
    <div id="o-editor-toolbar-drawtools" class="o-toolbar-horizontal">
      <div class="o-popover-container">
        <button id="o-editor-draw" class="o-button-lg o-tooltip" style aria-label="Nytt objekt" type="button" name="button">
          <svg class="o-icon-24">
              <use xlink:href="#ic_add_24px"></use>
          </svg>
          <span data-tooltip="Nytt objekt" data-placement="north"></span>
        </button>
      </div>
    </div>
    <button id="o-editor-attribute" class="o-button-lg o-tooltip" style aria-label="Formulär" type="button" name="button">
      <svg class="o-icon-24">
          <use xlink:href="#ic_title_24px"></use>
      </svg>
      <span data-tooltip="Formulär" data-placement="north"></span>
    </button>
    <button id="o-editor-delete" class="o-button-lg o-tooltip" style aria-label="Radera" type="button" name="button">
      <svg class="o-icon-24">
          <use xlink:href="#ic_delete_24px"></use>
      </svg>
      <span data-tooltip="Radera" data-placement="north"></span>
    </button>
    <div class="o-popover-container">
      <button id="o-editor-layers" class="o-button-lg o-tooltip" style aria-label="Lager" type="button" name="button">
        <svg class="o-icon-24">
            <use xlink:href="#ic_layers_24px"></use>
        </svg>
        <span data-tooltip="Lager" data-placement="north"></span>
      </button>
    </div>
    <button id="o-editor-save" class="o-button-lg o-disabled o-tooltip" style aria-label="Spara" type="button" name="button">
      <svg class="o-icon-24">
          <use xlink:href="#ic_save_24px"></use>
      </svg>
      <span data-tooltip="Spara" data-placement="north"></span>
    </button>
</div>`;

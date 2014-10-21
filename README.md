Useful Forms Package
===================

A light weight forms package using shadow objects to provide reactivity and validation for forms.

Very much in development and still immature this library provides 5 template block helpers and 1 global helper:
- `Form` - (block helper) Wraps your form with a simple `<form></form>` and adds reactivity to the form. Takes an object properties:
	- `schema` - Required, an object (or instance of Schema) which defines the structure of the object you want to return from your form. See github.com/cwohlman/meteor-validation-schema for more info.
	- `item` - Optional, if you are editing an existing item pass it in here, the form will prepopulate with the existing data (and stay in sync if possible).
	- `template` - Overrides the default form template with a template you specify by name.
- `TextInput` - (template) Generates a normal text input takes pretty much the same options as a `input` tag takes as attributes:
	- `name` - the name of the field to edit, required, must match exactly to the property name of the field in the schema.
	- `type` - the input type, defaults to text
	- `placeholder`
	- `template` - pass a template name to override the default template name
	- more... - you can specify additional properties here and they will be available if you write a custom template (e.g. pass a label and write a template which prints that label for you).
- `DateInput` - this template takes the same options as the text input, but is optimized for dates.
- `TimeInput` - this template takes the same options as the text input, but is optimized for times.
- `SelectInput` - this template takes the same options as the text input, but is optimized for select boxes. Specify the available options using the options property.
	
Events
-------------------
The forms package provides some default event handling:
- The Form block helper will bind to the submit handler and act as a shim between the native form submit and your submit handler, it will validate the current object against the specified schema and stopPropagation of the event if the item is invalid.
- For invalid forms the helper will trigger an invalid event (not implemented)
- The Input helpers bind to the change events on their respective elements and auto-update the underlying reactive object to reflect the state of the form element.

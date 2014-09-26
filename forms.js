ShadowObject.shadow.fn.dirty = function (val) {
	this._dirty = this._dirty || new ReactiveVar();
	this.root()._._dirty = this.root()._._dirty || new ReactiveVar();
	if (arguments.length) {
		this._dirty.set(val);
	} else {
		return this.hasChanges() ||
			this._dirty.get() ||
			this.root()._._dirty.get();
	}
};
ShadowObject.shadow.fn.messages = function (val) {
	this._messages = this._messages || new ReactiveVar();
	if (arguments.length) {
		this._messages.set(val);
	} else {
		return this._messages.get();
	}
};

// XXX cache shadow object on form
// first we need to implement original handling in shadow-object so we can
// change the 'original' property

Template.Form.helpers({
	template: function () {
		if (this._.template) {
			if (Template[this._.template]) return Template[this._.template];
			else {
				throw new Error('template not found');	
			}
		} else {
			return Template.DefaultForm || Template.__DefaultForm;
		}
	}
	, withForm: function () {
		var result = new ShadowObject(this.schema, this.item);

		// XXX extend result, or extend _ ?

		_.defaults(result._, this);

		return result;
	}
	, autosave: function () {
		if (this._.hasChanges()) {
			$(UI.currentView.firstNode().parentElement).trigger('autosave');
		}
	}
});

Template.Form.events({
	'submit form': function (e, tmpl) {
		e.preventDefault();
		if (this._.hasChanges()) {
			this._.dirty(true);
			var errors = this._.errors();
			if (errors.length) {
				e.stopPropagation();
			}
		} else {
			e.stopPropagation();
			alert('No changes!');
		}
	}
});

Template.TextInput.helpers({
	template: function () {
		if (this.template) {
			if (Template[this.template]) return Template[this.template];
			else {
				throw new Error('template not found');	
			}
		} else {
			return Template.DefaultTextInput || Template.__DefaultTextInput;
		}
	}
});

Template.TextInput.events({
	'change': function (e) {
		this.item[this.name] = e.currentTarget.value;
	}
	, 'blur': function () {
		this.dirty(true);
	}
});

UI.registerHelper('usefulField', function (field, item) {
	if (!item) {
		item = this;
	}
	if (typeof field == 'string') {
		field = {
			name: field
		};
	}
	return _.defaults({}, field, {
		item: item
		, value: item[field.name]
	}, (item._ && item._.shadow[field.name] || {})._);
});
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
ShadowObject.shadow.fn.hasUnsavedChanges = function (val) {
	return this.hasChanges() && !this.hasPendingSave();
};
ShadowObject.shadow.fn.hasPendingSave = function (val) {
	this._pendingSave = this._pendingSave || new ReactiveVar();
	if (!arguments.length)
		return this._pendingSave.get();
	else {
		this._pendingSave.set(val);
		if (!val && this.hasOwnProperty('_pendingReset')) {
			this.resetOriginal(this._pendingReset);
			delete this._pendingReset;
		} 
	}

};
ShadowObject.shadow.fn.resetWithGuards = function (val) {
	var self = this;
	var saving = Deps.nonreactive(function () {return self.hasPendingSave();});
	var changes = Deps.nonreactive(function () {return self.hasChanges();});

	self.resetFormHelpers(true);

	if (saving) {
		self._pendingReset = val;
	} else if (changes) {
		self._pendingReset = val;
		if ((self.original && self.original._id) != (val && val._id)) {
			self.messages([{
				kind: 'error'
				, message: 'You have unsaved changes!'
			}]);
		} else if (!_.isEqual(self.original, val)) {
			self.messages([{
				kind: 'warning'
				, message: 'The item has been modified outside this form, any changes you make will overwrite outside changes.'
			}]);
		} else {
			self.messages([{
				kind: 'info'
				, message: 'Nothing to save.'
			}]);
		}
	} else {
		self.resetOriginal(val);
	}
};
ShadowObject.shadow.fn.resetFormHelpers = function (preserveMessages) {
	if (!preserveMessages) this.messages(null);
	this.dirty(false);
	if (this.properties) {
		_.each(this.properties, function (prop) {
			this.shadow[prop]._.resetFormHelpers();
		}, this);
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
		var view = UI.getView();

		if (view.shadow) {
			view.shadow._.resetWithGuards(this.item);
		} else {
			view.shadow = new ShadowObject(this.schema, this.item);
			_.defaults(view.shadow._, this);
		}
		return view.shadow;
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
				this._.messages([{
					kind: 'error'
					, message: 'Form is invalid: ' + errors[0].message
				}]);
			}
		} else {
			e.stopPropagation();
			this._.messages([{
				kind: 'warning'
				, message: "Nothing to save."
			}]);
		}
	}
	, 'change form': function (e, tmpl) {
		if (this._.hasChanges()) {
			this._.messages([{
				kind: 'info'
				, message: 'There are unsaved changes.'
			}]);
		} else {
			this._.messages([{
				kind: 'info'
				, message: "Nothing to save."
			}]);
		}
	}
});

Template.SelectInput.helpers({
	template: function () {
		if (this.template) {
			if (Template[this.template]) return Template[this.template];
			else {
				throw new Error('template not found');	
			}
		} else {
			return Template.DefaultSelectInput || Template.__DefaultSelectInput;
		}
	}
});

Template.SelectInput.events({
	'change': function (e) {
		this.item[this.name] = e.currentTarget.value;
	}
	, 'blur': function () {
		this.dirty(true);
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
	var result = _.defaults({}, field, {
		item: item
		, value: item[field.name]
	}, (item._ && item._.shadow[field.name] || {})._);

	if (result.schema) {
		var validator = _.find([].concat(result.schema.rules), function (a) {
			return _.isArray(a.options);
		});
		if (validator) result.options = validator.options;
	}

	return result;
});
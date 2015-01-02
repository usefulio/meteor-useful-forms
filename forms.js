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
		if (!val && (this.hasOwnProperty('_pendingReset') ||
			!this.original ||
			!this.original._id)) {
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

var getOptions = function (schema) {
	if (schema.options) {
		return schema.options;
	} else if (_.isArray(schema.rules)) {
		return _.chain(schema.rules).map(getOptions).filter(_.identity).first().value();
	} else if (_.isObject(schema.rules) && _.isFunction(schema.rules.errors)) {
		return getOptions(schema.rules);
	}
};

ShadowObject.property.fn.options = function () {
	return this.schema && getOptions(this.schema);	
};

Template.input.helpers({
	template: function () {
		var type = this.type || '';
		type = this.type.slice(0, 1).toUpperCase() + this.type.slice(1);

		return Template[this.template + type + 'Input'] ||
				Template[this.template] ||
				Template['Default' + type + 'Input'] ||
				Template['__default' + type + 'Input'] ||
				Template['__defaultInput'] ||
				null;
	}
	, field: function (item) {
		var field = this;
		if (typeof field == 'string') {
			field = {
				name: field
			};
		}

		result = _.extend({}
			, (item._ && item._.shadow[field.name] || {})._
			, field
			, {
				item: item
				, value: item[field.name]
			}
			);

		return result;
	}
});

Template.form.helpers({
	template: function () {
		return Template[this.template] ||
				Template[this.template + 'Form'] ||
				Template['__' + this.template] ||
				Template['__' + this.template + 'Form'] ||
				null;
	}
	, item: function () {
		var view = UI.getView();

		if (view.shadow) {
			view.shadow._.resetWithGuards(this.item);
		} else {
			view.shadow = new ShadowObject(this.schema, this.item);
			view.formId = Random.id();
			view.onViewDestroyed(function () {
				Forms._hasChanges[view.formId] = false;
				Forms._checkChanges();
			});
		}

		if (!this.dontTrackChanges) {
			Tracker.autorun(function () {
				Forms._hasChanges[view.formId] = 
					!!_.keys(view.shadow._.changes()).length;
				Forms._checkChanges();
			});
		}
		
		_.defaults(view.shadow, _.omit(this, 'item', 'schema'));

		return view.shadow;
	}

});

Template.form.events({
	'submit form': function (e, tmpl) {
		e.preventDefault();
		// if (this._.hasChanges()) {
			this._.dirty(true);
			var errors = this._.errors();
			if (errors.length) {
				e.stopImmediatePropagation();
				this._.messages([{
					kind: 'error'
					, message: 'Form is invalid: ' + errors[0].message
				}]);
			}
		// } else {
		// 	e.stopPropagation();
		// 	this._.messages([{
		// 		kind: 'warning'
		// 		, message: "Nothing to save."
		// 	}]);
		// }
	}
});

Forms = {
	DefaultInputEvents: {
		// XXX be more explicit about which events we handle.
		// XXX perform validation
		'change input, change textarea, change select': function (e, tmpl) {
			if (e.currentTarget.name == this.name) {
				// doesn't work for checkboxes
				if ($(e.currentTarget).prop('type') == 'checkbox') {
					this.item[this.name] = e.currentTarget.checked;
				} else {
					this.item[this.name] = e.currentTarget.value;
				}
			}
		}
		, 'change checkbox': function (e, tmpl) {
			if (e.currentTarget.name == this.name) {
				this.item[this.name] = e.currentTarget.checked;
			}
		}
	}
	, DefaultSelectHelpers: {
		optionValue: function () {
			// unwrap any primative types
			var self = this.valueOf();
			if (_.isObject(self)) {
				return self._id || self.name;
			} else {
				return self;
			}
		}
		, optionText: function () {
			// unwrap any primative types
			var self = this.valueOf();
			if (_.isObject(self)) {
				return self.name || self._id;
			} else {
				return self;
			}
		}
		, optionSelected: function () {
			return Forms.DefaultSelectHelpers.optionValue.call(this) == Template.parentData(1).value;
		}
	}
	, _hasChanges: {}
	, _checkChanges: function () {
		Forms.hasChanges.set(_.any(Forms._hasChanges));
	}
	, hasChanges: new ReactiveVar(false)
};

// prevent hot code reloads when user has data.
// XXX we should actually store this data in some way and restore it after
// migration
Meteor._reload.onMigrate(function (retry) {
	if (Forms.hasChanges.get()) {
		Tracker.autorun(function () {
			if (!Forms.hasChanges.get()) retry();
		});
		return false;
	} else {
		return [true];
	}
});

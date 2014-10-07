Package.describe({
  summary: "A minimalistic forms library with reactive updates and validation."
  , name: "cwohlman:forms"
  , git: "https://github.com/cwohlman/meteor-useful-forms.git"
  , version: "0.2.0"
});

Package.on_use(function (api, where) {
  api.versionsFrom('0.9.3');
  api.use(['templating', 'ui', 'cwohlman:shadow-objects@0.1.1', 'reactive-var']);
  
  // Core api
  api.add_files('forms.html', ['client']);
  api.add_files('forms.js', ['client']);

  // Default Templates
  api.add_files('defaultInput.html', ['client']);
  api.add_files('defaultInput.js', ['client']);
  api.add_files('defaultSelectInput.html', ['client']);
  api.add_files('defaultSelectInput.js', ['client']);
  api.add_files('defaultTextareaInput.html', ['client']);
  api.add_files('defaultTextareaInput.js', ['client']);
  api.add_files('defaultCheckboxInput.html', ['client']);
  api.add_files('defaultCheckboxInput.js', ['client']);

  api.export('Forms');
});

Package.on_test(function (api) {
  api.use('cwohlman:forms');

  api.add_files('forms_tests.js', ['client', 'server']);
});

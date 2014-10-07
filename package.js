Package.describe({
  summary: "A minimalistic forms library with reactive updates and validation."
  , name: "cwohlman:forms"
  , git: "https://github.com/cwohlman/meteor-useful-forms.git"
  , version: "0.2.0"
});

Package.on_use(function (api, where) {
  api.versionsFrom('0.9.3');
  api.use('templating');
  api.use('ui');
  api.use('cwohlman:shadow-objects@0.1.1');
  api.use('reactive-var');
  api.add_files('forms.html', ['client']);
  api.add_files('forms.js', ['client']);
  api.export('Forms');
});

Package.on_test(function (api) {
  api.use('cwohlman:forms');

  api.add_files('forms_tests.js', ['client', 'server']);
});

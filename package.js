Package.describe({
  summary: "REPLACEME - What does this package (or the original one you're wrapping) do?"
});

Package.on_use(function (api, where) {
  api.use('templating');
  api.use('ui');
  api.use('cwohlman:shadow-objects@0.1.0');
  api.use('reactive-var');
  api.add_files('forms.html', ['client']);
  api.add_files('forms.js', ['client']);
});

Package.on_test(function (api) {
  api.use('forms');

  api.add_files('forms_tests.js', ['client', 'server']);
});

define(
  [
    'jquery'
  ],
  function ($) {
    return {
      ajax: function (path, method = 'GET', data = {}, successFunction, errorFunction, completeFunction) {
        return $.ajax(path,
            {
              data: JSON.stringify(data),
              method: method,
              dataType: 'json',
              contentType: "application/json",
              success: successFunction,
              error: errorFunction,
              complete: completeFunction
            }
        );
      }
    };
  }
);
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _request = require('request');
var url = require('url');
var util = require('./util');

var TopClient = function () {
  function TopClient(options) {
    _classCallCheck(this, TopClient);

    var opts = options || {};
    if (!opts.appkey || !opts.appsecret) {
      throw new Error('appkey or appsecret need!');
    }
    this.options = opts;
    this.REST_URL = opts.REST_URL || 'http://gw.api.taobao.com/router/rest';
    this.OAUTH_URL = opts.OAUTH_URL || 'https://oauth.taobao.com/';
    this.appkey = opts.appkey;
    this.appsecret = opts.appsecret;
  }

  _createClass(TopClient, [{
    key: 'invoke',
    value: function invoke(method, params, reponseNames, defaultResponse, type) {
      var _this = this;

      return new Promise(function (resolve, reject) {
        var thisParams = params;
        thisParams.method = method;
        _this.request(thisParams, type).then(function (result) {
          var response = result;
          if (reponseNames && reponseNames.length > 0) {
            for (var i = 0; i < reponseNames.length; i++) {
              var name = reponseNames[i];
              response = response[name];
              if (response === undefined) {
                break;
              }
            }
          }
          if (response === undefined) {
            response = defaultResponse;
          }
          resolve(response);
        }).catch(function (err) {
          reject(err);
        });
      });
    }
  }, {
    key: 'timestamp',
    value: function timestamp() {
      return util.YYYYMMDDHHmmss();
    }
  }, {
    key: 'sign',
    value: function sign(params) {
      var sorted = Object.keys(params).sort();
      var basestring = this.appsecret;
      for (var i = 0; i < sorted.length; i++) {
        var k = sorted[i];
        basestring += k + params[k];
      }
      basestring += this.appsecret;
      return util.md5(basestring).toUpperCase();
    }
  }, {
    key: 'request',
    value: function request(params) {
      var _this2 = this;

      var type = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'POST';

      return new Promise(function (resolve, reject) {
        util.checkRequired(params, 'method').then(function () {
          var args = {
            timestamp: _this2.timestamp(),
            format: 'json',
            app_key: _this2.appkey,
            v: '2.0',
            sign_method: 'md5'
          };

          for (var k in params) {
            if (_typeof(params[k]) === 'object') {
              args[k] = JSON.stringify(params[k]);
            } else {
              args[k] = params[k];
            }
          }
          args.sign = _this2.sign(args);
          // const url = this.REST_URL;
          var requestOpts = {
            method: type,
            url: _this2.REST_URL,
            json: true
          };
          if (type.toUpperCase() === 'GET') {
            requestOpts.qs = args;
          } else if (type.toUpperCase() === 'POST') {
            requestOpts.form = args;
          } else {
            requestOpts.body = JSON.stringify(args);
          }
          _request(requestOpts, function (error, response, body) {
            if (error) {
              reject(error);
            }
            if (body) {
              var errRes = body && body.error_response;
              if (errRes) {
                var msg = errRes.msg + ', code ' + errRes.code;
                if (errRes.sub_msg && errRes.sub_code) {
                  msg += '; ' + errRes.sub_code + ': ' + errRes.sub_msg;
                }
                var e = new Error(msg);
                e.name = 'TOPClientError';
                e.code = errRes.code;
                e.sub_code = errRes.sub_code;
                e.data = body;
                reject(e);
              }
              resolve(body);
            }
            reject();
          });
        }).catch(function (checkErr) {
          reject(checkErr);
        });
      });
    }
  }, {
    key: 'getAuthorizeUrl',
    value: function getAuthorizeUrl() {
      var redirect_uri = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
      var state = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';
      var view = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 'wap';

      return url.resolve(this.OAUTH_URL, '/authorize?response_type=code&client_id=' + this.appkey + '&redirect_uri=' + encodeURIComponent(redirect_uri) + '&state=' + encodeURIComponent(state) + '&view=' + view);
    }
  }, {
    key: 'getAccessToken',
    value: function getAccessToken(code) {
      var redirect_uri = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';

      var _this3 = this;

      var state = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '';
      var view = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 'wap';

      return new Promise(function (resolve, reject) {
        _request({
          method: 'POST',
          url: url.resolve(_this3.OAUTH_URL, '/token'),
          json: true,
          form: {
            client_id: _this3.appkey,
            client_secret: _this3.appsecret,
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: redirect_uri,
            state: state,
            view: view
          }
        }, function (error, response, body) {
          if (error) {
            reject(error);
          }
          if (body) {
            if (body.error) {
              var e = new Error(JSON.stringify(body));
              reject(e);
            }
            resolve(body);
          }
          reject();
        });
      });
    }
  }, {
    key: 'execute',
    value: function execute(apiname, params, type) {
      return this.invoke(apiname, params, [util.getApiResponseName(apiname)], null, type);
    }
  }]);

  return TopClient;
}();

module.exports = TopClient;
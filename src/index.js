/*!
 * Copyright (c) 2016 Nanchao Inc.
 * All rights reserved.
 */

'use strict';

var Driver = require('ruff-driver');
var Receiver = require('./infrared-receiver.js');

module.exports = new Driver({
    attach: function () {
        var that = this;
        this._receiver = new Receiver();
        this._receiver.open(11, function (error, integers) {
            if(error) {
                 // eslint-disable-next-line no-console
                 console.log(error);
            } else {
                that.emit('data', integers);
            }
        });
    },

    detach: function () {
        this._receiver.close(function(){});
    }
});

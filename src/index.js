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
        this._receiver.open(11, function (integers) {
            that.emit('data', integers);
        });
    },

    detach: function () {
        this._receiver.close();
    }
});

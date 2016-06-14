'use strict';

var KernelModule = require('kernel-module');
var ReadHelper = KernelModule.ReadHelper;

//-----------------------------------------------------------------------------

var PULSE_BIT = 0x01000000;
// var PULSE_MASK = 0x00ffffff;

function signalToIntegers(buffer) {
    var integers = [];
    for (var offset = 0; offset < buffer.length; offset += 4) {
        var integer = buffer.readUInt32LE(offset);
        var header = integer & PULSE_BIT;
        // var payload = data & PULSE_MASK;
        if (integers.length === 0 && !header) {
            continue;
        }
        integers.push(integer);
    }
    return integers;
}

//-----------------------------------------------------------------------------

var MODULE_NAME = 'lirc-recv';
var DEVICE_PATH = '/dev/lirc-receiver';
var CHUNK_SIZE = 1024;
var POLL_INTERVAL = 2;
var SIGNAL_DURATION = 250;

function InfraredReceiver() {
    var self = {
        _file: undefined,
        _intervalHandle: null,
        _recvCallback: null
    };

    Object.setPrototypeOf(self, InfraredReceiver.prototype);

    return self;
}

InfraredReceiver.prototype._openDevice = function () {
    this._file = new ReadHelper(DEVICE_PATH, 'r');
};

InfraredReceiver.prototype._closeDevice = function () {
    this._file.close();
};

InfraredReceiver.prototype._startRead = function () {
    var that = this;
    if (this._intervalHandle) {
        return;
    }

    var elasped = 0;
    var siglen = 0;
    var signals = new Buffer(0);
    this._file.start(CHUNK_SIZE);

    this._file.on('data', function (data) {
        var signal = data;
        signals = Buffer.concat([signals, new Buffer(signal)]);
        if (that._intervalHandle) {
            return;
        }
        that._intervalHandle = setInterval(function () {
            if (elasped > SIGNAL_DURATION && siglen === signals.length) {
                if (signals.length < 4 * 10) {
                    // noise
                } else if (!(signals.length & 3) && that._recvCallback) {
                    var intsOfKey = signalToIntegers(signals);
                    that._recvCallback(intsOfKey);
                } else {
                    // broken data
                }
                clearInterval(that._intervalHandle);
                that._intervalHandle = null;
                elasped = 0;
                siglen = 0;
                signals = new Buffer(0);
            }
            elasped += POLL_INTERVAL;
            siglen = signals.length;
        }, POLL_INTERVAL);
    });
};

InfraredReceiver.prototype._stopRead = function () {
    if (this._intervalHandle) {
        clearInterval(this._intervalHandle);
        this._intervalHandle = null;
    }
    this._file.stop();
};

InfraredReceiver.prototype.open = function (pin, callback) {
    try {
        KernelModule.install(MODULE_NAME, 'gpio_in_pin=' + pin);
    } catch (e) {
        // eslint-disable-next-line no-console
        console.log(e);
    }
    this._recvCallback = callback;
    this._openDevice();
    this._startRead();
};

InfraredReceiver.prototype.close = function () {
    this._stopRead();
    this._closeDevice();
    this._recvCallback = null;
    KernelModule.remove(MODULE_NAME);
};

module.exports = InfraredReceiver;

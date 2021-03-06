const bleno = require('bleno');
import { BoardInformationCharacteristic } from './board/board_information.characteristic';

export class BoardService extends bleno.PrimaryService {
    constructor() {
        super({
            uuid: 'f924a104-d1c5-484c-af16-8c26ba074c79', // or 'fff1' for 16-bit
            properties: ['read', 'write'], // can be a combination of 'read', 'write', 'writeWithoutResponse', 'notify', 'indicate'
            secure: ['read', 'write'], // enable security for properties, can be a combination of 'read', 'write', 'writeWithoutResponse', 'notify', 'indicate'
            //value: null, // optional static value, must be of type Buffer - for read only characteristics
            characteristics: [
                new BoardInformationCharacteristic()
            ],
            //onReadRequest: null, // optional read request handler, function(offset, callback) { ... }
            //onWriteRequest: null, // optional write request handler, function(data, offset, withoutResponse, callback) { ...}
            //onSubscribe: null, // optional notify/indicate subscribe handler, function(maxValueSize, updateValueCallback) { ...}
            //onUnsubscribe: null, // optional notify/indicate unsubscribe handler, function() { ...}
            //onNotify: null, // optional notify sent handler, function() { ...}
            //onIndicate: null // optional indicate confirmation received handler, function() { ...}
        });
    }
}
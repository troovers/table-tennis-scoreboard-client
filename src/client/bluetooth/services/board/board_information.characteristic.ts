const bleno = require('bleno');
import { System } from '../../../../system';

export class BoardInformationCharacteristic extends bleno.Characteristic {
    constructor() {
        super({
            uuid: 'ae936a90-98d2-45a7-95f6-1e5fa1fa5a1d',
            properties: ['read', 'write'],
            descriptors: [
                new bleno.Descriptor({
                    uuid: 'f9e2091d-fbdc-497b-b393-89cd2d21e24f', // Name
                    value: 'Telbord 1'
                }),
                new bleno.Descriptor({
                    uuid: 'b63e1be4-9889-45b8-b14a-73e8c9aba6cf' // Serial number
                })
            ],
            onReadRequest: (offset: any, callback: (string: string, buffer: Buffer) => {}) => {
                console.log(offset);
                System.getSerialNumber().then((serialNumber) => {
                    callback(this.RESULT_SUCCESS, new Buffer([serialNumber]));
                }).catch((error) => {
                    console.error(error)
                })
            },
        });
    }
}
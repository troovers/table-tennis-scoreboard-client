require('dotenv').config({ path: '../' });

const bleno = require('bleno');

import axios from 'axios';
import { DevBoard } from '../board/board.dev';
import { Board } from '../board/board';
import { ConnectionState, BoardInterface } from '../board/board.interface';
import { ClientInterface } from './client.interface';
import { System } from '../system';
import { BoardService } from './bluetooth/services/board.service';

export class BluetoothClient { // implements ClientInterface {

    private name: string = 'Telbord';
    private primaryService: any;

    private serialNumber?: string;
    private scoreboard: BoardInterface;
    private board?: {
        id: number,
        name: string,
        active_match: any
    };

    async initialize(): Promise<void> {
        this.primaryService = new BoardService();

        bleno.on('stateChange', (state: string) => {
            console.log(`on -> stateChange: ${state}`);

            if (state === 'poweredOn') {
                bleno.startAdvertising(this.name, [this.primaryService.uuid], (error: any) => {
                    console.log('startAdvertising: ' + (error ? 'error ' + error : 'success'));
                });
            }
        });

        bleno.on('advertisingStart', (error: any) => {
            console.log('on -> advertisingStart: ' + (error ? 'error ' + error : 'success'));

            if (!error) {
                bleno.setServices([this.primaryService], (error: any) => {
                    console.error('setServices: ' + (error ? 'error ' + error : 'success'));
                });
            }
        });

        bleno.on('accept', (clientAddress: string) => {
            console.info(`on -> accept: ${clientAddress}`);
        });
    }
}
require('dotenv').config({ path: '../' });

const Echo = require('laravel-echo');
const io = require('socket.io-client');

import axios from 'axios';
import { DevBoard } from '../board/board.dev';
import { Board } from '../board/board';
import { ConnectionState, BoardInterface } from '../board/board.interface';
import { ClientInterface } from './client.interface';
import { System } from '../system';

export class EchoClient implements ClientInterface {

    private serialNumber?: string;
    private scoreboard: BoardInterface;
    private echo: any;
    private board?: {
        id: number,
        name: string,
        active_match: any
    };

    constructor() {
        if (process.env.ENV === 'production') {
            this.scoreboard = new Board();
        } else {
            this.scoreboard = new DevBoard();
        }

        this.scoreboard.welcomeScreen();

        this.setSerialNumber();
    }

    async showMessage(text: string): Promise<void> {
        this.scoreboard.basicText(text);
    }

    async initialize(): Promise<void> {
        if (this.serialNumber === undefined) {
            return;
        }

        this.scoreboard.connectionState(ConnectionState.Connecting);

        await this.initializeEcho();
    }

    private async initializeEcho() {
        this.echo = new Echo({
            broadcaster: 'socket.io',
            host: `${process.env.HOST}:${process.env.SOCKET_PORT}`,
            client: io,
        });

        this.echo.connector.socket.on('connect', () => {
            console.info('connected', this.echo.socketId());

            // Register at API
            axios.post(this.url('scoreboards'), {
                'serial_number': this.serialNumber
            }).then((response: { data: any }) => {
                console.info(`Registered with ID: ${response.data.data.id}`);

                // Save the board instance
                this.board = response.data.data;
                this.scoreboard.connectionState(ConnectionState.Connected, this.board!.name);

                // Join board specific channels
                this.joinBoardChannels();
            }).catch((error: any) => {
                console.info('Error registering', error);
            });
        });

        this.echo.connector.socket.on('connect_error', (error: { string: any }) => {
            console.error('connect_error', error);

            this.scoreboard.connectionState(ConnectionState.Failed);
        });

        this.echo.connector.socket.on('disconnect', function () {
            console.info('disconnected');
        });

        this.echo.connector.socket.on('reconnecting', function (attemptNumber: number) {
            console.info('reconnecting', attemptNumber);
        });

        this.echo.connector.socket.on('reconnect_error', function (error: { string: any }) {
            console.error('reconnect_error', error);
        });

        this.echo.channel('scoreboard_boards').listen('ConnectBoard', function () {
            console.info('We are connected!');
        });
    }

    private async setSerialNumber() {
        try {
            this.serialNumber = await System.getSerialNumber();
            console.log(`Serial number: ${this.serialNumber}`);
        } catch (error) {
            console.error(`Error retrieving serial number: ${error}`);

            if (process.env.env === 'production') {
                return;
            } else {
                console.debug('In DEV env, using stubbed serial number');
                this.serialNumber = 'DEV01';
            }
        }
    }

    private joinBoardChannels() {
        if (this.board === undefined) {
            console.error('No board present');
            return;
        }

        if (this.board.active_match !== null) {
            this.scoreboard.showScore(this.board.active_match);
        }

        this.echo.channel(`scoreboard_boards_${this.board.id}`).listen('StartMatch', (data: any) => {
            this.scoreboard.showScore(data.match);

        }).listen('StopMatch', (data: any) => {
            this.scoreboard.connectionState(ConnectionState.Connected, this.board!.name);

        }).listen('UpdateScore', (data: any) => {
            this.scoreboard.showScore(data.match);

        }).listen('Timeout', () => {
            this.scoreboard.startTimeout();

        }).listen('TimeoutEnded', () => {
            this.scoreboard.stopTimeout();

        }).listen('DisconnectBoard', () => {
            this.scoreboard.connectionState(ConnectionState.Connected, this.board!.name);

        });
    }

    private url(path: string): string {
        return `${process.env.HOST}/api/${path}`;
    }
}
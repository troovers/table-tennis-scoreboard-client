import { BoardInterface, ConnectionState, FontSize } from "./board.interface";

export class DevBoard implements BoardInterface {

    resetMatrix() {
        console.debug('resetMatrix()');
    }

    async welcomeScreen() {
        console.debug('welcomeScreen()');
    }

    async basicText(text: string, fontSize: FontSize = FontSize.Small, additionalText: Function = () => { }) {
        console.debug('basicText()');
    }

    async connectionState(state: ConnectionState, text?: string) {
        console.debug('connectionState()');
    }
    async showScore(match: any) {
        console.debug('showScore()');
    }

    startTimeout() {
        console.debug('startTimeout()');
    }

    stopTimeout() {
        console.debug('stopTimeout()');
    }
}
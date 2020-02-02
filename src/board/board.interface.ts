
export enum ConnectionState {
    Connecting = 'Verbinden..', Connected = 'Verbonden!', Failed = 'Niet verbonden'
}

export enum FontSize {
    ExtraSmall, Small, Large
}

export interface BoardInterface {
    resetMatrix(): void;

    welcomeScreen(): void;

    basicText(text: string, fontSize?: FontSize, additionalText?: Function): void;

    connectionState(state: ConnectionState, text?: string): void;

    showScore(match: any): void;

    startTimeout(): void;

    stopTimeout(): void;
}
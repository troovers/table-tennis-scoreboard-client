import { basename } from 'path';
import { Font, LedMatrix, LayoutUtils, VerticalAlignment, HorizontalAlignment, FontInstance } from 'rpi-led-matrix';
import { GpioMapping } from 'rpi-led-matrix';
import { ConnectionState, BoardInterface, FontSize } from './board.interface';

const Colors = {
    Aquamarine: 0x7FFFD4,
    Black: 0x000000,
    Blue: 0x0000FF,
    Cyan: 0x00FFFF,
    Green: 0x00FF00,
    Magenta: 0xFF00FF,
    Purple: 0x800080,
    Red: 0xFF0000,
    White: 0xFFFFFF,
    Yellow: 0xFFFF00,
};

export class Board implements BoardInterface {
    private matrix = new LedMatrix({
        ...LedMatrix.defaultMatrixOptions(),
        rows: 32,
        cols: 64,
        chainLength: 1,
        hardwareMapping: GpioMapping.AdafruitHat,
        showRefreshRate: true,
    }, {
        ...LedMatrix.defaultRuntimeOptions(),
        gpioSlowdown: 2,
    });

    private extraSmallFont = new Font(basename(`${process.cwd()}/fonts/4x6.bdf`, '.bdf'), `${process.cwd()}/fonts/4x6.bdf`);
    private smallFont = new Font(basename(`${process.cwd()}/fonts/spleen-5x8.bdf`, '.bdf'), `${process.cwd()}/fonts/spleen-5x8.bdf`);
    private largeFont = new Font(basename(`${process.cwd()}/fonts/peep-10x20.bdf`, '.bdf'), `${process.cwd()}/fonts/peep-10x20.bdf`);
    private timeoutDuration: number = 0;
    private interval: NodeJS.Timer;
    private match: any;

    resetMatrix(font: FontInstance = this.smallFont) {
        this.matrix
            .clear()
            .brightness(50)
            .font(font)
            .fgColor(Colors.White)
            .sync();
    }

    async welcomeScreen() {
        this.basicText('Telbord - TTV Smash');
    }

    async connectionState(state: ConnectionState, text?: string) {
        this.basicText(text === undefined ? state : text);
    }

    async basicText(text: string, fontSize: FontSize = FontSize.Small, additionalText: Function = () => { }) {
        try {
            let font = this.getFont(fontSize);

            this.resetMatrix(font);

            // Maintain a thunk of the latest render operation so that it can be repeated when options change
            let render = () => {
                this.matrix.clear();
                const fgColor = this.matrix.fgColor();
                this.matrix.fgColor(this.matrix.bgColor()).fill().fgColor(fgColor);
                const lines = LayoutUtils.textToLines(font, this.matrix.width(), text);

                LayoutUtils.linesToMappedGlyphs(lines, font.height(), this.matrix.width(), this.matrix.height(), HorizontalAlignment.Center, VerticalAlignment.Middle).map(glyph => {
                    this.matrix.drawText(glyph.char, glyph.x, glyph.y);
                });

                additionalText();

                this.matrix.sync();
            };

            render();
        } catch (error) {
            console.error(`Error showing basic text screen: ${error}`);
        }
    }

    private getFont(size: FontSize): FontInstance {
        switch (size) {
            case FontSize.ExtraSmall:
                return this.extraSmallFont;

            case FontSize.Small:
                return this.smallFont;

            case FontSize.Large:
                return this.largeFont;

            default:
                return this.smallFont;
        }
    }

    async showScore(match: any) {
        this.match = match;

        if (this.match.mode === 'match') {
            this.showMatchScore(match);
        } else {
            this.showOverallScore(match);
        }
    }

    private async showMatchScore(match: any) {
        try {
            this.resetMatrix();

            let render = async () => {
                var playerLeft: any;
                var playerRight: any;
                var gameCount = match.players.reduce((count: number, player: any) => count + player.end_score, 0);
                var serveTurn: string;
                var sideLeft: string;

                if (gameCount % 2 === 0) {
                    sideLeft = 'left';
                } else {
                    sideLeft = 'right';
                }

                // Switch in the fifth game at a first reach of 5 points
                if (gameCount === 4 && match.players.filter((player: any) => player.score_fifth_game >= 5).length > 0) {
                    sideLeft = sideLeft === 'left' ? 'right' : 'left';
                }

                playerLeft = match.players.filter((player: any) => player.side === sideLeft)[0];
                playerRight = match.players.filter((player: any) => player.side === (sideLeft === 'left' ? 'right' : 'left'))[0];

                // Serve turn stays on the same side when switching games
                const playerServesFirst = match.players.filter((player: any) => player.has_first_serve)[0].side;
                serveTurn = playerServesFirst;

                var game: string | null = 'first';

                switch (gameCount) {
                    case 0:
                        game = 'first'
                        break;
                    case 1:
                        game = 'second'
                        break;
                    case 2:
                        game = 'third'
                        break;
                    case 3:
                        game = 'fourth'
                        break;
                    case 4:
                        game = 'fifth'
                        break;
                    default: game = null;
                }

                const home = playerLeft[`score_${game}_game`];
                const away = playerRight[`score_${game}_game`];

                // This is an uneven score turn
                if ((home + away) < 20) {
                    if (Math.floor((home + away) / 2) % 2 !== 0) {
                        serveTurn = serveTurn === 'left' ? 'right' : 'left';
                    }
                } else {
                    // At 10-10, serves switch every point
                    if ((home + away) % 2 !== 0) {
                        serveTurn = serveTurn === 'left' ? 'right' : 'left';
                    }
                }

                // Switch serves in the fifth game at 5 points
                if (gameCount === 4 && match.players.filter((player: any) => player.score_fifth_game >= 5).length > 0) {
                    serveTurn = serveTurn === 'left' ? 'right' : 'left';
                }

                this.matrix.clear();
                const fgColor = Colors.Red;

                this.matrix.fgColor(this.matrix.bgColor()).fill().fgColor(fgColor);

                if (game !== null) {
                    if (serveTurn === 'left') {
                        this.matrix.fill(0, 0, 0, 32);
                    } else {
                        this.matrix.fill(this.matrix.width() - 1, 0, this.matrix.width() - 1, 32);
                    }
                }

                this.matrix.font(this.smallFont);
                this.matrix.drawText(`${playerLeft.end_score}`, 3, 2);
                this.matrix.fgColor(Colors.Red);
                this.matrix.drawText(`${playerRight.end_score}`, 56, 2);

                if (game !== null) {
                    this.matrix.font(this.largeFont);
                    this.matrix.fgColor(Colors.White);
                    this.matrix.drawText(`${home}`, 10 + (home > 9 ? 0 : 5), 2);
                    this.matrix.drawText(`${away}`, 34 + (away > 9 ? 0 : 5), 2);
                }

                if (playerLeft.has_timeout) {
                    this.matrix.fgColor(Colors.White);
                    this.matrix.fill(3, 12, 7, 19);
                }

                if (playerRight.has_timeout) {
                    this.matrix.fgColor(Colors.White);
                    this.matrix.fill(this.matrix.width() - 8, 12, this.matrix.width() - 4, 19);
                }

                this.matrix.sync();
            };

            render();
        } catch (error) {
            console.error(`Error showing score screen: ${error}`);
        }
    }

    private async showOverallScore(match: any) {
        try {
            this.resetMatrix();

            let render = async () => {
                this.matrix.clear();
                const fgColor = Colors.Red;

                this.matrix.fgColor(this.matrix.bgColor()).fill().fgColor(fgColor);
                this.matrix.font(this.smallFont);

                const font = this.extraSmallFont;
                const teamLeftLine = LayoutUtils.textToLines(font, this.matrix.width(), match.team_left.toUpperCase());
                let characterCount = 0;
                LayoutUtils.linesToMappedGlyphs(teamLeftLine, font.height(), this.matrix.width(), font.height(), HorizontalAlignment.Left, VerticalAlignment.Top).map(glyph => {
                    const x = glyph.x + characterCount;
                    this.matrix.drawText(glyph.char, x, glyph.y);
                    characterCount++;
                });

                const teamRightLine = LayoutUtils.textToLines(font, this.matrix.width(), match.team_right.toUpperCase());
                const length = match.team_right.length;
                // Start earlier than the glyph setting, because we're adding spacing
                characterCount = 0 - length + 1; // + 1 because the last letter doesn't need the extra spacing
                LayoutUtils.linesToMappedGlyphs(teamRightLine, font.height(), this.matrix.width(), this.matrix.height() - 1, HorizontalAlignment.Right, VerticalAlignment.Bottom).map(glyph => {
                    const x = glyph.x + characterCount;
                    this.matrix.drawText(glyph.char, x, glyph.y);
                    characterCount++;
                });

                this.matrix.font(this.largeFont);
                this.matrix.fgColor(Colors.White);
                this.matrix.drawText(`${match.score_left}`, 5 + (match.score_left > 9 ? 0 : 5), 7);
                this.matrix.drawText(`${match.score_right}`, 37 + (match.score_right > 9 ? 0 : 5), 7);

                this.matrix.sync();
            };

            render();
        } catch (error) {
            console.error(`Error showing score screen: ${error}`);
        }
    }

    startTimeout() {
        this.timeoutDuration = 60;

        let render = (() => {
            this.basicText(`${this.timeoutDuration}`, FontSize.Large, () => {
                // Add timeout title
                this.matrix.font(this.smallFont);
                const lines = LayoutUtils.textToLines(this.smallFont, this.matrix.width(), 'TIMEOUT');
                LayoutUtils.linesToMappedGlyphs(lines, this.smallFont.height(), this.matrix.width(), this.smallFont.height() + 1, HorizontalAlignment.Center, VerticalAlignment.Middle).map(glyph => {
                    this.matrix.drawText(glyph.char, glyph.x, glyph.y);
                });
            });
        });

        render();

        this.interval = setInterval(() => {
            this.timeoutDuration -= 1;

            if (this.timeoutDuration <= 0) {
                this.stopTimeout();
            } else {
                render();
            }
        }, 1000);
    }

    stopTimeout() {
        this.timeoutDuration = 0;
        if (this.interval !== undefined) {
            clearInterval(this.interval);
        }

        this.showScore(this.match);
    }
}
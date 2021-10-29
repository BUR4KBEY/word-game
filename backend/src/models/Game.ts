import axios from 'axios';

const apiPath = 'https://sozluk.gov.tr/gts?ara=';
const characters = [
    'a',
    'b',
    'c',
    'ç',
    'd',
    'e',
    'f',
    'g',
    'ğ',
    'h',
    'ı',
    'i',
    'j',
    'k',
    'l',
    'm',
    'n',
    'o',
    'ö',
    'p',
    'r',
    's',
    'ş',
    't',
    'u',
    'ü',
    'v',
    'y',
    'z'
];

export enum GameError {
    API,
    SAME_SENDER,
    INSUFFICIENT_LENGTH,
    NO_SPACE,
    SAME_WORD,
    WORD_USED,
    NOT_STARTING_VALID,
    WORD_UNACCEPTABLE,
    WORD_NOT_FOUND,
    INSUFFICIENT_WORDS_TO_FINISH
}

export function getGameErrorMessage(error: GameError): string {
    var _message: string;

    switch (error) {
        case GameError.API:
            _message = 'Error occurred. Try again.';
            break;
        case GameError.SAME_SENDER:
            _message = 'The same user cannot type words in a row.';
            break;
        case GameError.INSUFFICIENT_LENGTH:
            _message = 'A word must consist of at least two letters.';
            break;
        case GameError.NO_SPACE:
            _message = 'The word cannot contain spaces.';
            break;
        case GameError.SAME_WORD:
            _message = 'The same word cannot be used in a row.';
            break;
        case GameError.WORD_USED:
            _message =
                'This word has already been used. You cannot use this word again until the game is finished.';
            break;
        case GameError.NOT_STARTING_VALID:
            _message =
                'The word does not begin with the last letter of the last word.';
            break;
        case GameError.WORD_UNACCEPTABLE:
            _message = 'The word invalid.';
            break;
        case GameError.WORD_NOT_FOUND:
            _message = 'The word not found in TDK.';
            break;
        case GameError.INSUFFICIENT_WORDS_TO_FINISH:
            _message = 'Not enough words to finish the game.';
            break;
    }

    return _message;
}

interface GameResult {
    finished: boolean;
    newWord?: string;
    incomingWord: string;
    oldWords: string[];
}

export interface GameSettings {
    ppw: number;
    ppf: number;
    reuse: boolean;
    requiredWords: number;
}

export class Game {
    private _lastWord: string = '';
    private _lastSender: string = '';
    private _words: string[] = [];

    get lastWord() {
        return this._lastWord;
    }

    get wordsCount() {
        return this._words.length;
    }

    constructor(
        public ppw: number = 10 /* points per word */,
        public ppf: number = 100 /* points per finish */,
        public reuse: boolean = false,
        public minToFinish: number = 20
    ) {}

    append(word: string, sender: string) {
        return new Promise<GameResult>(async (resolve, reject) => {
            if (sender === this._lastSender)
                return reject(GameError.SAME_SENDER);

            const content = word.replace(/I/g, 'ı').toLowerCase();

            if (content.length < 2)
                return reject(GameError.INSUFFICIENT_LENGTH);

            if (content.split('').includes(' '))
                return reject(GameError.NO_SPACE);

            if (content === this._lastWord) return reject(GameError.SAME_WORD);

            if (this._words.includes(content) && !this.reuse)
                return reject(GameError.WORD_USED);

            const lastCharOfLastWord =
                this._lastWord != ''
                    ? this._lastWord[this._lastWord.length - 1]
                    : '';
            if (
                lastCharOfLastWord != '' &&
                !content.startsWith(lastCharOfLastWord)
            )
                return reject(GameError.NOT_STARTING_VALID);

            if (content.split('').some(c => !characters.includes(c)))
                return reject(GameError.WORD_UNACCEPTABLE);

            try {
                const response = await axios.get(
                    `${encodeURI(apiPath + content)}`
                );
                const body = response.data;

                if (body.error) return reject(GameError.WORD_NOT_FOUND);

                if (content.endsWith('ğ')) {
                    if (this._words.length < this.minToFinish)
                        return reject(GameError.INSUFFICIENT_WORDS_TO_FINISH);
                    else {
                        const validChars = characters.filter(c => c != 'ğ');

                        const selectedChar =
                            validChars[
                                Math.floor(Math.random() * validChars.length)
                            ];

                        resolve({
                            finished: true,
                            oldWords: this._words,
                            newWord: selectedChar,
                            incomingWord: content
                        });

                        this._lastSender = sender;
                        this._words = [];
                        this._lastWord = selectedChar;

                        return;
                    }
                } else {
                    resolve({
                        finished: false,
                        oldWords: this._words,
                        incomingWord: content
                    });

                    this._words.push(content);
                    this._lastWord = content;
                    this._lastSender = sender;

                    return;
                }
            } catch (ex) {
                return reject(GameError.API);
            }
        });
    }
}

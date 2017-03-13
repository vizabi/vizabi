import Reader from "base/reader";

const cached = {};

const CSVReader = Reader.extend({

  _name: "csv",

  /**
   * Initializes the reader.
   * @param {Object} readerInfo Information about the reader
   */
  init(readerInfo) {
    this._data = [];
    this._basepath = readerInfo.path;
    this.delimiter = readerInfo.delimiter;
    this.keySize = readerInfo.keySize || 1;

    Object.assign(this.ERRORS, {
      WRONG_TIME_COLUMN_OR_UNITS: "reader/error/wrongTimeUnitsOrColumn",
      NOT_ENOUGH_ROWS_IN_FILE: "reader/error/notEnoughRows",
      UNDEFINED_DELIMITER: "reader/error/undefinedDelimiter",
      EMPTY_HEADERS: "reader/error/emptyHeaders"
    });
  },

  ensureDataIsCorrect({ columns, data }, parsers) {
    const timeKey = columns[this.keySize];
    const [firstRow] = data;
    const parser = parsers[timeKey];

    const time = firstRow[timeKey];
    if (parser && !parser(time)) {
      throw this.error(this.ERRORS.WRONG_TIME_COLUMN_OR_UNITS, undefined, {
        currentYear: new Date().getFullYear(),
        foundYear: time
      });
    }

    if (!columns.filter(Boolean).length) {
      throw this.error(this.ERRORS.EMPTY_HEADERS);
    }
  },

  /**
   * This function returns info about the dataset
   * in case of CSV reader it's just the name of the file
   * @returns {object} object of info about the dataset
   */
  getDatasetInfo() {
    return { name: this._basepath.split("/").pop() };
  },

  load() {
    const { _basepath: path } = this;

    return new Promise((resolve, reject) => {
      const cachedData = cached[path];

      if (cachedData) {
        resolve(cachedData);
      } else {
        d3.text(path).get((error, text) => {
          if (!text) {
            return reject(`No permissions or empty file: ${path}. ${error}`);
          }

          if (error) {
            return reject(`Error happened while loading csv file: ${path}. ${error}`);
          }

          try {
            const { delimiter = this._guessDelimiter(text) } = this;
            const parser = d3.dsvFormat(delimiter);
            const data = parser.parse(text);

            const result = { columns: data.columns, data };
            cached[path] = result;
            resolve(result);
          } catch (e) {
            return reject(e);
          }
        });
      }
    });
  },

  _guessDelimiter(text) {
    const stringsToCheck = 2;
    const rows = this._getRows(text, stringsToCheck).map(row => row.replace(/".*?"/g, ""));

    if (rows.length !== stringsToCheck) {
      throw this.error(this.ERRORS.NOT_ENOUGH_ROWS_IN_FILE);
    }

    const [header, firstRow] = rows;
    const [comma, semicolon] = [",", ";"];
    const commasCountInHeader = this._countCharsInLine(header, comma);
    const semicolonsCountInHeader = this._countCharsInLine(header, semicolon);
    const commasCountInFirstRow = this._countCharsInLine(firstRow, comma);
    const semicolonsCountInFirstRow = this._countCharsInLine(firstRow, semicolon);

    if (
      commasCountInHeader === commasCountInFirstRow
      && commasCountInHeader > 1
      && (
        (semicolonsCountInHeader !== semicolonsCountInFirstRow)
        || (!semicolonsCountInHeader && !semicolonsCountInFirstRow)
        || (commasCountInHeader > semicolonsCountInHeader && commasCountInFirstRow > semicolonsCountInFirstRow)
      )
    ) {
      return comma;
    } else if (
      semicolonsCountInHeader === semicolonsCountInFirstRow
      && semicolonsCountInHeader > 1
      && (
        (commasCountInHeader !== commasCountInFirstRow)
        || (!commasCountInHeader && !commasCountInFirstRow)
        || (semicolonsCountInHeader > commasCountInHeader && semicolonsCountInFirstRow > commasCountInFirstRow)
      )
    ) {
      return semicolon;
    }

    throw this.error(this.ERRORS.UNDEFINED_DELIMITER);
  },

  _getRows(text, count = 0) {
    const re = /([^\r\n]+)/g;
    const rows = [];
    let rowsCount = 0;

    let matches = true;
    while (matches && rowsCount !== count) {
      matches = re.exec(text);
      if (matches && matches.length > 1) {
        ++rowsCount;
        rows.push(matches[1]);
      }
    }

    return rows;
  },

  _countCharsInLine(text, char) {
    const re = new RegExp(char, "g");
    const matches = text.match(re);
    return matches ? matches.length : 0;
  }

});

export default CSVReader;

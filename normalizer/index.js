const Readline = require('readline');

readline = Readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false,
});

class Normalizer {
  constructor() {
    this.CURRENT_LINE_INDEX = 0;
  }

  handleTimestamp(timestamp) {
    // eastern time is 3 hours ahead of pacific time
    const event = new Date(timestamp);

    Date.prototype.addHours = function(h) {
      this.setTime(this.getTime() + (h*60*60*1000));
      return this;
    }

    event.addHours(3);
    return event.toISOString();
  }

  handleZipcode(zipcode) {
    const zipLength = zipcode.toString().length;
    
    return zipLength < 5 ? 0 : zipcode;
  }

  handleFullname(fullname) {
    const validNames = this.handleInvalidChar(fullname)
    return validNames.toUpperCase();
  }

  handleDuration(duration) {
    const timeArray = duration.split(':'); // ['1', '23', '32.123']
    const secs = timeArray[2].split('.');  // ['32', '123']
    const seconds = secs[0];               // 32
    const miliseconds = secs[1];           // 123

    const hoursInSeconds = timeArray[0] * 3600;
    const minutesInSeconds = timeArray[1] * 60;
    const milisecondsInSeconds = miliseconds / 1000;
    
    const totalNumberOfSeconds = hoursInSeconds + minutesInSeconds + milisecondsInSeconds;
    return totalNumberOfSeconds;
  }

  handleTotalDuration(fooDurationData, barDurationData) {
    const fooDuration = this.handleDuration(fooDurationData);
    const barDuration = this.handleDuration(barDurationData);

    const totalDuration = fooDuration + barDuration;
    
    return totalDuration;
  }

  handleInvalidChar(data) {
    return data.replace(/[^\x20-\x7E]/g,"\ufffd");
  }

  mapColumnToHandler(data, columnIndex, columns) {
    if (this.CURRENT_LINE_INDEX === 0) return data; // skip column names

    switch (columnIndex) {
      case 0: // Timestamp
        return this.handleTimestamp(data);
      case 1: // Address
        return this.handleInvalidChar(data);
      case 2: // ZIP
        return this.handleZipcode(data);
      case 3: // Full Name
        return this.handleFullname(data);
      case 4: // Foo Duration
        return this.handleDuration(data);
      case 5: // Bar Duration
        return this.handleDuration(data);
      case 6: // Total Duration
        return this.handleTotalDuration(columns[4], columns[5]);
      case 7: // Notes
        return this.handleInvalidChar(data);
      default:
        break;
    }
  }

  normalize(line) {
    const encodedLine = line.replace(/"[\W+\w+]+"/, (string) => {
      return encodeURIComponent(string);
    });
    const columns = encodedLine.split(',');
    const rows = columns.map((column, index) => this.mapColumnToHandler(column, index, columns));

    this.CURRENT_LINE_INDEX++;

    return process.stdout.write(`${decodeURIComponent(rows.join(','))} \n`);
  }
}

const normalizer = new Normalizer();
readline.on('line', (line) => normalizer.normalize(line));

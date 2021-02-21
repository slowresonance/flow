class Event {
  constructor(taskName, sector, log = []) {
    this.start = new Date();
    this.taskName = taskName;
    this.sector = sector;
    this.state = 1;
    this.log = log;
  }
  pause() {
    if (this.state == 0) return;
    this.state = 0;
    this.end = new Date();
    this.record();
  }
  resume() {
    if (this.state == 1) return;
    this.state = 1;
    this.start = new Date();
  }
  stop() {
    if (this.state == 0) return;
    this.state = 0;
    this.end = new Date();
    this.record();
  }
  record() {
    let t = {
      taskName: this.taskName,
      sector: this.sector,
      start: this.start,
      end: this.end,
    };
    this.log.push(t);
  }
}

class Interface {
  constructor(log = []) {
    this.log = log;
    this.currentTask;
  }
  newEvent(taskName, sector) {
    this.currentTask = new Event(taskName, sector, this.log);
  }
  pause() {
    this.currentTask.pause();
  }
  resume() {
    this.currentTask.resume();
  }
  stop() {
    this.currentTask.stop();
  }
  stringify() {
    this.json_log = JSON.stringify(this.log);
  }
  unstringify() {
    this.unstr_log = JSON.parse(this.json_log, function (key, value) {
      if (key == "start" || key == "end") {
        return new Date(value);
      }
      return value;
    });
  }
}

class WeekVis {
  constructor(log) {
    this.log = log;
    this.visLog = [];
    this.widthPerHour = 30;
    this.height = 36;
    this.dayNum = 6;
    this.allowedTasks = [];
    this.visualise();
  }

  visualise() {
    this.createTaskIds();
    this.chunkify();
    this.createWidths();
    this.getAllowedTasks();
    this.displayTasks();
  }

  displayTasks() {
    let grid = document.getElementById("grid-container");
    let currentDate;
    let currentCanvas;
    let currentVIndex;
    let newSvg;
    let currentSvg;
    this.allowedTasks.forEach((task) => {
      if (currentDate != this.getDateId(task.start)) {
        currentDate = this.getDateId(task.start);
        currentCanvas = this.createElement("div", `grid-canvas`);
        currentVIndex = this.createElement("div", "v-index");
        currentVIndex.innerText = task.start.getDate();
        newSvg = this.createSvg(currentDate, "day");
        this.appendElements(grid, currentCanvas, currentVIndex, newSvg);
        currentSvg = document.getElementById(currentDate);
      }
      currentSvg.innerHTML += this.createRect(task);
    });
  }

  appendElements(grid, currentCanvas, currentVIndex, newSvg) {
    currentCanvas.append(currentVIndex);
    currentCanvas.append(newSvg);
    grid.append(currentCanvas);
  }

  createRect(task) {
    return `<rect class="${task.taskId} ${task.sector} task" shape-rendering="geometricPrecision" taskName="${task.taskName}" x="${task.offset}" width="${task.width}" height="${this.height}" />`;
  }

  createSvg(currentDate, className) {
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("id", `${currentDate}`);
    svg.setAttribute("class", `${className}`);
    svg.setAttribute("viewBox", "-2 1 724 23");
    svg.setAttributeNS(
      "http://www.w3.org/2000/xmlns/",
      "xmlns:xlink",
      "http://www.w3.org/1999/xlink"
    );
    return svg;
  }

  getDateId(date) {
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  }

  getLastTaskDate() {
    let lastTask = this.visLog[this.visLog.length - 1];
    return this.endOfDay(lastTask.end);
  }

  getFirstAllowedDate(upperBound) {
    upperBound.setDate(upperBound.getDate() - this.dayNum);
    let lowerBound = this.startOfDay(upperBound);
    return lowerBound;
  }

  getAllowedTasks() {
    let upperBound = this.getLastTaskDate();
    let lowerBound = this.getFirstAllowedDate(upperBound);
    this.visLog.forEach((task) => {
      if (task.start >= lowerBound) {
        this.allowedTasks.push(task);
      }
    });
  }

  createElement(tag, className) {
    const element = document.createElement(tag);
    element.classList.add(className);
    return element;
  }

  createTaskIds() {
    this.log.forEach((task) => {
      task.taskId = "_" + Math.random().toString(36).substr(2, 9);
    });
  }

  oneDayTask(task) {
    return task.start.getDate() == task.end.getDate();
  }

  newTask(taskName, sector, start, end, taskId) {
    return {
      taskName: taskName,
      sector: sector,
      start: start,
      end: end,
      taskId: taskId,
    };
  }

  chunkify() {
    this.log.forEach((task) => {
      let toBeDone = task;
      while (!this.oneDayTask(toBeDone)) {
        let newStart = toBeDone.start;
        let newEnd = this.endOfDay(newStart);
        toBeDone.start = this.startOfDay(newEnd, 1);
        this.visLog.push(
          this.newTask(
            task.taskName,
            task.sector,
            newStart,
            newEnd,
            task.taskId
          )
        );
      }
      this.visLog.push(toBeDone);
    });
  }

  createWidths() {
    this.visLog.forEach((task) => {
      task["offset"] = this.calculateOffset(task);
      task["width"] = this.calculateDuration(task);
    });
  }

  calculateOffset(task) {
    return this.timeDelta(
      this.startOfDay(task.start),
      task.start,
      this.widthPerHour
    );
  }

  calculateDuration(task) {
    return this.timeDelta(task.start, task.end, this.widthPerHour);
  }

  timeDelta(start, end) {
    return Math.abs(((end - start) * this.widthPerHour) / 3600000);
  }

  startOfDay(date, noOfDays = 0) {
    let newDate = new Date(date.valueOf());
    let hours = 24 * noOfDays;
    newDate.setHours(hours, 0, 0);
    return newDate;
  }

  endOfDay(date) {
    let newDate = new Date(date.valueOf());
    newDate.setHours(23, 59, 59);
    return newDate;
  }
}

log2 = [
  {
    taskName: "test0",
    sector: "design",
    start: new Date().setDate(1),
    end: new Date().setDate(6),
  },
  {
    taskName: "test0",
    sector: "design",
    start: new Date().setDate(8),
    end: new Date().setDate(11),
  },
  {
    taskName: "te",
    sector: "sleep",
    start: new Date().setHours(7),
    end: new Date().setHours(14),
  },
  {
    taskName: "te",
    sector: "coding",
    start: new Date().setHours(16),
    end: new Date().setHours(18),
  },
];

inte = new Interface(log2);

inte.stringify();

inte.unstringify();

function sleep(milliseconds) {
  const date = Date.now();
  let currentDate = null;
  do {
    currentDate = Date.now();
  } while (currentDate - date < milliseconds);
}

wvis = new WeekVis(inte.unstr_log);

console.log(wvis);

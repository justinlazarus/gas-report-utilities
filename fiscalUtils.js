function test() {
  var moment = Moment.load();
  var date = moment('20170918', "YYYYMMDD").getFiscalDate();
  date = date;
}

var fiscalUtils = (function() {
  
  // Constants
  var DAYS_IN_PERIOD = 28;
  var DAYS_IN_WEEK = 7;
  var WEEKS_IN_PERIOD = 4;
  var WEEKS_IN_YEAR = 52;
  var PERIODS_IN_YEAR = 13;
  
  // Globals
  var moment = Moment.load();
  var seeds = [ 
    {year: 2013, start: new Date(2012, 8, 3), end: new Date(2013, 8, 1), extraWeek: false},
    {year: 2014, start: new Date(2013, 8, 2), end: new Date(2014, 7, 31), extraWeek: false},
    {year: 2015, start: new Date(2014, 8, 1), end: new Date(2015, 7, 30), extraWeek: false},
    {year: 2016, start: new Date(2015, 7, 31), end: new Date(2016, 7, 28), extraWeek: false},
    {year: 2017, start: new Date(2016, 7, 29), end: new Date(2017, 8, 3), extraWeek: true},
    {year: 2018, start: new Date(2017, 8, 4), end: new Date(2018, 8, 2), extraWeek: false},
    {year: 2019, start: new Date(2018, 8, 3), end: new Date(2019, 8, 1), extraWeek: false},
    {year: 2020, start: new Date(2019, 8, 2), end: new Date(2020, 7, 30), extraWeek: false}
  ];
  
  // Extends the moment.js library to return fiscal date information for 
  // the moment. Supports all dates defined in the "seeds" global variable.
  moment.fn.getFiscalDate = function() {
    return getFiscalProperties(this);
  }
  
  moment.fn.getFiscalDates = function() {
    var fiscalProperties = getFiscalProperties(this);
    var fy = new FiscalObject(fiscalProperties.year);
    
    return fy.getDates();
  }
  
  function getSeedByFiscalYear(fiscalYear) {
    return seeds.filter(function(seed) {
      return (seed.year == fiscalYear);
    })[0];
  }
  
  function getSeedByDate(date) {
    return seeds.filter(function(seed) {
      return (
        (date.isSame(moment(seed.start)) || date.isAfter(moment(seed.start))) &&
        (date.isSame(moment(seed.end)) || date.isBefore(moment(seed.end)))
      );
    })[0]; 
  }
  
  // Returns all of the typical fiscal properties for the date passed in. Expects
  // the date to be a "moment," not a js date. 
  function getFiscalProperties(date) {
    var seed = getSeedByDate(date);
    var elapsed = date.diff(moment(seed.start), 'days');
    var period = ~~(elapsed / DAYS_IN_PERIOD) + 1;
    var week = ~~(elapsed / DAYS_IN_WEEK) + 1;
    var periodWeek = week - ((period - 1) * WEEKS_IN_PERIOD);
    
    // Account for the exception case of period 13 week 5
    if (period === (PERIODS_IN_YEAR + 1) && week === (WEEKS_IN_YEAR + 1)) {
      period = 13;
      periodWeek = 5;
    }
  
    return {year: seed.year, period: period, periodWeek: periodWeek, week: week};
  }
  
  function FiscalObject(fiscalYear) {
    this.seed = getSeedByFiscalYear(fiscalYear);
    this.year = this.seed.year;
    this.startDate = moment(this.seed.start);
    this.endDate = moment(this.seed.end);
    this.extraWeek = this.seed.extraWeek;
  }  

  // Returns a collection of dates in a fiscal year. If "range" is
  // specified, the collection only includes dates between range.start
  // and range.end. Expects a range defined by ordinal date numbers.
  FiscalObject.prototype.getDates = function(range) {    
    var fiscalYear = this;  
    var dayCount = this.endDate.diff(this.startDate, 'days');
    var range = (range || {start: 0, end: dayCount});
    
    function getDay(day) {
      return moment(fiscalYear.startDate).add(day, 'd').toDate();
    }
    
    return arrayTools.range(range).map(getDay);
  }
  
  // Returns a collection of weeks in a fiscal year. If "range" is 
  // specified, the collection only includes weeks between range.start
  // and range.end. Expects a range defined by ordinal week numbers.
  FiscalObject.prototype.getWeeks = function(range) {
    var fiscalYear = this;
    var calculatedWeeks = ((this.extraWeek) ? WEEKS_IN_YEAR + 1 : WEEKS_IN_YEAR);
    var range = range || {start: 1, end: calculatedWeeks};
    
    function getWeek(week) {
      var toAdd = ((week - 1) * DAYS_IN_WEEK);
      var start = moment(fiscalYear.startDate).add(toAdd, 'd');
      var end = moment(start).add((DAYS_IN_WEEK - 1), 'd');
      
      return {week: week, start: start.toDate(), end: end.toDate()};
    };
    
    return arrayTools.range(range).map(getWeek);
  }  
    
  // Returns a collection of periods in a fiscal year. If "range" is 
  // specified, the collection only includes periods beween range.start
  // and range.end. Expects a range defined by ordinal period numbers.
  FiscalObject.prototype.getPeriods = function(range) {
    var fiscalYear = this;
    var range = (range || {start: 1, end: PERIODS_IN_YEAR});
    
    function getPeriod(period) {
      var toAdd = ((period - 1) * DAYS_IN_PERIOD); 
      var start = moment(fiscalYear.startDate).add(toAdd, 'd');
      var end = moment(start).add((DAYS_IN_PERIOD - 1), 'd');
      
      if (fiscalYear.seed.extraWeek) end = moment(this.endDate);
      return {period: period, start: start.toDate(), end: end.toDate()};
    }
    
    return arrayTools.range(range).map(getPeriod);
  }
  
  FiscalObject.prototype.getPeriodDates = function(period, matrix) {
    var period = this.getPeriods({start: period, end: period})[0];
    
    return arrayTools.dateRange(
      {start: period.start, end: period.end}, matrix
    );
  }
  
  return {
    FiscalObject: FiscalObject,
    getFiscalProperties: getFiscalProperties,
    moment: moment
  }

} ());

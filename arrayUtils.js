var arrayTools = (function() {

  var moment = Moment.load();
  
  function range(rangeObject) {
    var start = rangeObject.start;
    var end = rangeObject.end; 
    var range = []; 
    var initial = end - start + 1;
    
    while (initial--) {
      range[initial] = end--
    }
    
    return range;
  }
  
  function dateRange(rangeObject, matrix) {
    var start = moment(rangeObject.start);
    var end = moment(rangeObject.end);
    var current = moment(start);
    var range = [];
    
    while(current.isBefore(end) || current.isSame(end)) {
      if (matrix) {
        range.push([moment(current).toDate()]);
      } else {
        range.push(moment(current).toDate());
      }
      current.add(1, 'd');
    }
    
    return range;
  }
  
  function filterByDate(multiArray, dateColumn, date) {
    var searchDate = moment(date), filtered = [];
    multiArray.forEach(function(element, index, array) {
      if (moment(element[dateColumn]).isSame(searchDate)) {
        filtered.push(index);
      }
    });    
    return filtered;
  }
  
  function filterByValues(multiArray, searches, returnIndexes) {
    var filtered = multiArray;
    var isFirstSearch = true;
    
    searches.forEach(function(search) {
      filtered = filtered.filter(function(row, index, array) {
        if (isFirstSearch) row.push(index);
        if (search.isTime) return moment(search.val).isSame(row[search.col]);
        return row[search.col] == search.val;
      });
      if (isFirstSearch) isFirstSearch = false;
    });
    
    return filtered.map(function(row) {
      if (returnIndexes) return row.pop();
      row.pop();
      return row;
    });
  }
  
  // Public Exports
  return {
    filterByDate: filterByDate,
    filterByValues: filterByValues,
    range: range,
    dateRange: dateRange
  }
} ());

// Array.find() polyfill
if (!Array.prototype.find) {
  Array.prototype.find = function(predicate) {
    if (this == null) {
      throw new TypeError('Array.prototype.find called on null or undefined');
    }
    if (typeof predicate !== 'function') {
      throw new TypeError('predicate must be a function');
    }
    var list = Object(this);
    var length = list.length >>> 0;
    var thisArg = arguments[1];
    var value;
    
    for (var i = 0; i < length; i++) {
      value = list[i];
      if (predicate.call(thisArg, value, i, list)) {
        return value;
      }
    }
    return undefined;
  };
}

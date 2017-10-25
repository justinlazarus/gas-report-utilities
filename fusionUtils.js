var fusionUtils = (function() {

  /**
   * TableObject class creates an object that mediates access to a 
   * Google Fusion Tables instance. Aside from encapsulating
   * programmatic access to fusion tables, the object also offers
   * numerous helpers to aid in CRUD operations
   * @class
   */
  function TableObject(tableId, uniques) {
    this.tableId = tableId;
    this.uniques = uniques; 
    this.columns = FusionTables.Table.get(tableId).columns;
    this.constants = {
      leftParens: "(",
      rightParens: ")",
      space: " ",
      comma: ",",
      apostrophee: "'",
      equals: "=",
      semiColon: ";",
      and: "AND",
      numericType: "NUMBER",
    };
  }
  
  /*
   * Returns the column type of a Google Fusion Tables column 
   * based on the string 'columnName' passed
   */
  TableObject.prototype.getColumnType = function(columnName) {
    return this.columns.find(function(column) {
      return column.name === columnName;
    }).type;
  }
  
  /*
   * Returns the a Query collection 'rows' object representing
   * all rows in the table
   */
  TableObject.prototype.getAllRows = function() {
    var query = 'select * from ' + this.tableId;
    
    return FusionTables.Query.sql(query).rows;
  }
  
  function getNewTableObject(tableId, uniques) {
    return new TableObject(tableId, uniques)
  }
  
  // Returns a table object for use in insert, update and delete.
  function getTableObject(tableId, uniques) {
    return {
      tableId: tableId,
      uniques: uniques, 
      columns: FusionTables.Table.get(tableId).columns,
      constants: {
        leftParens: "(",
        rightParens: ")",
        space: " ",
        comma: ",",
        apostrophee: "'",
        equals: "=",
        semiColon: ";",
        and: "AND",
        numericType: "NUMBER",
      },
      getColumnType: function getColumnType(columnName) {
        return this.columns.find(function(column) {
          return column.name === columnName;
        }).type;
      }
    };
  }
  
  // Checks existence of a row in a table based on the fields set
  // in the "uniques" propert of the table object.
  function rowExists(table, row) {
    var whereClause = "WHERE "
    var selectClause = "SELECT * FROM " + table.tableId 
      + table.constants.space;
    var query = "";
    
    // Build a where clause for the unique fields on the table
    table.uniques.forEach(function(unique) {
      
      // Non-numeric type columns
      if (table.getColumnType(unique) !== table.constants.numericType) {
        whereClause += (
          unique + table.constants.equals + table.constants.apostrophee 
          + row[unique] + table.constants.apostrophee + table.constants.space 
          + table.constants.and + table.constants.space
        );
        
      // Numeric type columns
      } else {
        whereClause += (
          unique + table.constants.equals + row[unique]
          + table.constants.space + table.constants.and 
          + table.constants.space
        );
      };
    });
    
    query += selectClause + whereClause.substr(0, whereClause.length - 4);
    
    // There is a rate quota for the SQL API that the Fustion Tables service
    // calls. This limit is 5 queries per second for reads. To avoid ending in 
    // error, the sleep function enforces a 200 milisecond pause before each
    // query request. This ensures that no more than 5 queries are executed 
    // per second. 
    Utilities.sleep(200);
    return FusionTables.Query.sqlGet(query).rows;
  }
  
  // Returns a query string that will insert a row into a table. 
  function getInsertString(table, row) {
    var intoString = "";
    var valueString = ""
    
    table.columns.forEach(function(column) {
      intoString += column.name + table.constants.comma;
      
      // Non-numeric type columns
      if (column.type !== table.constants.numericType) {
        valueString += (
          table.constants.apostrophee + row[column['name']]
          + table.constants.apostrophee + table.constants.comma
        );
        
      // Numeric type columns
      } else {
        valueString += row[column['name']] + table.constants.comma
      };
    });
  
    return (
      "INSERT INTO " + table.tableId + table.constants.space 
      + table.constants.leftParens + intoString.slice(0, -1) 
      + table.constants.rightParens + table.constants.space 
      + "VALUES" + table.constants.space + table.constants.leftParens 
      + valueString.slice(0, -1) + table.constants.rightParens
    );
  }
  
  // Returns the result of an insert query of a row into a table. Table
  // must be a table object created using the "getTableObject" function
  // and row must be an object with keys that correspond to the column
  // names in the "columns" property of a table object. 
  function insertRow(table, row) {
    var exists = rowExists(table, row);
    var insertQuery = getInsertString(table, row);
   
    if (!exists) {
    
      // There is a rate quota for the SQL API that the Fustion Tables service
      // calls. This limit is 30 queries per minute for writes. There is a 5 
      // minute execution limit for any google script. If an SQL read takes 
      // almost 0 miliseconds to complete, we can assume that calling sleep(2000)
      // 30 times in a minute should avoid hitting the google rate quota for write
      // frequency. However, there is a 150 row limit before hitting the 5 minute
      // quota. Therefore, for any insert request with more than a couple rows, 
      // 'insertRows' should be used. 
      Utilities.sleep(50);
      return FusionTables.Query.sql(insertQuery).rows;
    };
  }
  
  // Returns the result of an insert query of rows into a table. Table
  // must be a table object created using the "getTableObject" function
  // and rows must be an array of object with keys that correspond to 
  // the column names in the "columns" property of a table object. 
  function insertRows(table, rows) {
    
    var chunkedRows = arrayUtils.chunkArray(rows, 25);
    
    chunkedRows.forEach(function(rows) {
      var insertQuery = "";
      
      rows.forEach(function(row) {
        var exists = rowExists(table, row);
        if (!exists) {
          insertQuery += getInsertString(table, row) 
          + table.constants.semiColon + table.constants.space;
        };
      });
    
      if (insertQuery.length > 0) {
        FusionTables.Query.sql(insertQuery);
      };
    });  
  }  
  
  // Public Exports
  return {
    rowExists: rowExists,
    insertRow: insertRow,
    insertRows: insertRows,
    getTableObject: getTableObject,
    getNewTableObject: getNewTableObject
  }
} ());
